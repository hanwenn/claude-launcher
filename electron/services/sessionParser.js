const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

const MAX_MESSAGES = 500;
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_METADATA_LINES = 200;
const MAX_SESSION_ID_LENGTH = 64;

/**
 * Validate that a session ID contains only safe characters (alphanumeric and hyphens).
 * Prevents path traversal attacks when constructing file paths from session IDs.
 * @param {string} id
 * @returns {boolean}
 */
function isValidSessionId(id) {
  if (!id || typeof id !== 'string') return false;
  if (id.length === 0 || id.length > MAX_SESSION_ID_LENGTH) return false;
  return /^[a-zA-Z0-9-]+$/.test(id);
}

/**
 * Encode a folder path to Claude project directory name.
 * Rule: "D:\foo\bar" -> "D--foo-bar"
 * Colon becomes dash, backslash becomes dash, forward slash becomes dash.
 * @param {string} folderPath
 * @returns {string}
 */
function encodeFolderPath(folderPath) {
  return folderPath.replace(/:/g, '-').replace(/\\/g, '-').replace(/\//g, '-');
}

/**
 * Get the Claude projects directory for a given folder path.
 * Returns ~/.claude/projects/<encoded-path>/
 * @param {string} folderPath
 * @returns {string}
 */
function projectsDir(folderPath) {
  const home = os.homedir();
  if (!home) {
    throw new Error('NOT_FOUND: Cannot determine home directory');
  }
  const encoded = encodeFolderPath(folderPath);
  return path.join(home, '.claude', 'projects', encoded);
}

/**
 * mtime cache: Map<filePath, { mtimeMs: number, sessions: SessionInfo[] }>
 */
const mtimeCache = new Map();

/**
 * Scan all sessions for a given folder.
 * Uses mtime cache: only re-parses when file modification time changes.
 * @param {string} folderPath
 * @returns {Promise<Array>} Array of SessionInfo objects
 */
async function getSessions(folderPath) {
  const projDir = projectsDir(folderPath);

  if (!fs.existsSync(projDir)) {
    return [];
  }

  // Step 1: Collect all candidate JSONL file paths and their mtimes
  let entries;
  try {
    entries = fs.readdirSync(projDir, { withFileTypes: true });
  } catch (err) {
    throw new Error(`SESSION_PARSE_ERROR: Failed to read project directory: ${err.message}`);
  }

  const candidates = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.jsonl')) continue;
    const filePath = path.join(projDir, entry.name);
    try {
      const stat = fs.statSync(filePath);
      candidates.push({ filePath, mtimeMs: stat.mtimeMs });
    } catch (_err) {
      // Skip files we cannot stat
    }
  }

  // Step 2: Check cache, determine which files need re-parsing
  const cachedResults = [];
  const toParse = [];

  for (const { filePath, mtimeMs } of candidates) {
    const cached = mtimeCache.get(filePath);
    if (cached && cached.mtimeMs === mtimeMs) {
      cachedResults.push(...cached.sessions);
    } else {
      toParse.push({ filePath, mtimeMs });
    }
  }

  // Step 3: Parse files that are new or changed
  const newlyParsed = [];
  for (const { filePath, mtimeMs } of toParse) {
    try {
      const session = await parseJsonlFile(filePath);
      newlyParsed.push({ filePath, mtimeMs, session });
    } catch (_err) {
      // Skip files that fail to parse
    }
  }

  // Step 4: Update cache
  for (const { filePath, mtimeMs, session } of newlyParsed) {
    mtimeCache.set(filePath, { mtimeMs, sessions: [session] });
  }

  // Step 5: Assemble results
  const allSessions = [
    ...cachedResults,
    ...newlyParsed.map((p) => p.session),
  ];

  return allSessions;
}

/**
 * Get detail for a single session (message preview list).
 * @param {string} sessionId
 * @param {string} folderPath
 * @returns {Promise<object>} SessionDetail { id, messages }
 */
async function getSessionDetail(sessionId, folderPath) {
  if (!isValidSessionId(sessionId)) {
    throw new Error(
      `INVALID_SESSION_ID: Session ID contains invalid characters or is too long: ${sessionId}`
    );
  }

  const projDir = projectsDir(folderPath);
  const jsonlPath = path.join(projDir, `${sessionId}.jsonl`);

  if (!fs.existsSync(jsonlPath)) {
    throw new Error(`NOT_FOUND: Session file not found: ${sessionId}`);
  }

  const messages = await parseJsonlMessages(jsonlPath);

  return {
    id: sessionId,
    messages,
  };
}

/**
 * Parse a single JSONL file into a SessionInfo.
 * Reads line by line (streaming) and stops after MAX_METADATA_LINES.
 * @param {string} filePath
 * @returns {Promise<object>} SessionInfo
 */
function parseJsonlFile(filePath) {
  return new Promise((resolve, reject) => {
    let fileStream;
    try {
      fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
    } catch (err) {
      return reject(new Error(`SESSION_PARSE_ERROR: Failed to open session file ${filePath}: ${err.message}`));
    }

    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    const fallbackId = path.basename(filePath, '.jsonl');
    let sessionId = null;
    let firstTimestamp = null;
    let model = null;
    let summary = null;
    let messageCount = 0;
    let linesRead = 0;

    rl.on('line', (line) => {
      linesRead += 1;
      if (linesRead > MAX_METADATA_LINES) {
        rl.close();
        fileStream.destroy();
        return;
      }

      const trimmed = line.trim();
      if (trimmed.length === 0) return;

      let value;
      try {
        value = JSON.parse(trimmed);
      } catch (_err) {
        return; // Skip malformed lines
      }

      // Extract sessionId from first line that has it
      if (sessionId === null && value.sessionId && typeof value.sessionId === 'string') {
        sessionId = value.sessionId;
      }

      // Extract first timestamp
      if (firstTimestamp === null && value.timestamp && typeof value.timestamp === 'string') {
        const dt = new Date(value.timestamp);
        if (!isNaN(dt.getTime())) {
          firstTimestamp = value.timestamp;
        }
      }

      const msgType = (value.type && typeof value.type === 'string') ? value.type : '';

      // Count user and assistant messages (skip meta)
      if (msgType === 'user' || msgType === 'assistant') {
        const isMeta = value.isMeta === true;
        if (!isMeta) {
          messageCount += 1;
        }
      }

      // Extract model from first assistant message
      if (model === null && msgType === 'assistant') {
        const msg = value.message;
        if (msg && msg.model && typeof msg.model === 'string' && msg.model !== '<synthetic>') {
          model = msg.model;
        }
      }

      // Extract summary from first non-meta user message
      if (summary === null && msgType === 'user') {
        const isMeta = value.isMeta === true;
        if (!isMeta && value.message) {
          const content = value.message.content;
          if (typeof content === 'string') {
            const t = content.trim();
            if (t.length > 0) {
              summary = t.length > 120 ? t.substring(0, 120) : t;
            }
          }
        }
      }
    });

    rl.on('close', () => {
      if (firstTimestamp === null) {
        return reject(new Error('SESSION_PARSE_ERROR: JSONL file has no valid timestamp'));
      }

      resolve({
        id: sessionId || fallbackId,
        timestamp: firstTimestamp,
        model: model || null,
        summary: summary || '(empty)',
        message_count: messageCount,
      });
    });

    rl.on('error', (err) => {
      reject(new Error(`SESSION_PARSE_ERROR: Failed to read session file ${filePath}: ${err.message}`));
    });

    fileStream.on('error', (err) => {
      reject(new Error(`SESSION_PARSE_ERROR: Failed to open session file ${filePath}: ${err.message}`));
    });
  });
}

/**
 * Parse a JSONL file into a list of message previews for session detail view.
 * Enforces MAX_FILE_SIZE and MAX_MESSAGES limits.
 * @param {string} filePath
 * @returns {Promise<Array>} Array of MessagePreview objects
 */
function parseJsonlMessages(filePath) {
  return new Promise((resolve, reject) => {
    // Check file size first
    let stat;
    try {
      stat = fs.statSync(filePath);
    } catch (err) {
      return reject(new Error(`SESSION_PARSE_ERROR: Failed to read session file metadata ${filePath}: ${err.message}`));
    }

    if (stat.size > MAX_FILE_SIZE_BYTES) {
      return reject(new Error(
        `SESSION_PARSE_ERROR: Session file too large (${stat.size} bytes, max ${MAX_FILE_SIZE_BYTES} bytes)`
      ));
    }

    let fileStream;
    try {
      fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
    } catch (err) {
      return reject(new Error(`SESSION_PARSE_ERROR: Failed to open session file ${filePath}: ${err.message}`));
    }

    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
    const messages = [];

    rl.on('line', (line) => {
      if (messages.length >= MAX_MESSAGES) {
        rl.close();
        fileStream.destroy();
        return;
      }

      const trimmed = line.trim();
      if (trimmed.length === 0) return;

      let value;
      try {
        value = JSON.parse(trimmed);
      } catch (_err) {
        return; // Skip malformed lines
      }

      const msgType = value.type;
      if (typeof msgType !== 'string') return;

      // Only include user and assistant messages
      if (msgType !== 'user' && msgType !== 'assistant') return;

      const isMeta = value.isMeta === true;
      if (isMeta) return;

      const timestamp = (value.timestamp && typeof value.timestamp === 'string')
        ? value.timestamp
        : null;

      const contentPreview = extractContentPreview(value, msgType);

      messages.push({
        role: msgType,
        content_preview: contentPreview,
        timestamp,
      });
    });

    rl.on('close', () => {
      resolve(messages);
    });

    rl.on('error', (err) => {
      reject(new Error(`SESSION_PARSE_ERROR: Failed to read session file ${filePath}: ${err.message}`));
    });

    fileStream.on('error', (err) => {
      reject(new Error(`SESSION_PARSE_ERROR: Failed to open session file ${filePath}: ${err.message}`));
    });
  });
}

/**
 * Extract content preview from a JSONL message line.
 * For user messages: message.content (string)
 * For assistant messages: concatenate text blocks from message.content array
 * @param {object} value - Parsed JSON line
 * @param {string} msgType - 'user' or 'assistant'
 * @returns {string}
 */
function extractContentPreview(value, msgType) {
  const msg = value.message;
  if (!msg) return '(no content)';

  const content = msg.content;
  if (content === undefined || content === null) return '(no content)';

  let rawText;

  if (typeof content === 'string') {
    // User messages: content is a plain string
    rawText = content;
  } else if (Array.isArray(content)) {
    // Assistant messages: content is an array of blocks
    const parts = [];
    for (const block of content) {
      if (block && typeof block.type === 'string' && block.type === 'text') {
        if (typeof block.text === 'string') {
          parts.push(block.text);
        }
      }
    }
    if (parts.length === 0) {
      return msgType === 'assistant' ? '(thinking...)' : '(no content)';
    }
    rawText = parts.join('\n');
  } else {
    return '(no content)';
  }

  const trimmed = rawText.trim();
  if (trimmed.length === 0) return '(empty)';

  return trimmed.length > 500 ? trimmed.substring(0, 500) : trimmed;
}

module.exports = {
  getSessions,
  getSessionDetail,
  encodeFolderPath,
  projectsDir,
  isValidSessionId,
};
