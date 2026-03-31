const pty = require('node-pty');
const path = require('path');
const fs = require('fs');

const MAX_TERMINALS = 8;
const REPLAY_BUFFER_SIZE = 50 * 1024; // 50KB per terminal

const SESSION_ID_REGEX = /^[a-zA-Z0-9-]+$/;
const SESSION_ID_MAX_LENGTH = 64;

/**
 * Manages pseudo-terminal instances for embedded terminal sessions.
 * Each terminal is identified by a unique string id and wraps a node-pty process.
 */
class TerminalManager {
  constructor() {
    // id -> { pty, folder, sessionId, status, buffer }
    this.terminals = new Map();
  }

  /**
   * Create a new terminal session.
   *
   * @param {string} id - Unique terminal identifier
   * @param {object} options
   * @param {string} options.folder - Absolute path to working directory
   * @param {string} options.cliCommand - CLI executable name or path
   * @param {string} [options.sessionId] - Session ID to resume (optional)
   * @param {number} [options.cols=80] - Terminal columns
   * @param {number} [options.rows=24] - Terminal rows
   * @param {function} onData - Called with (data: string) when output arrives
   * @param {function} onExit - Called with ({ exitCode: number }) when process exits
   * @returns {{ id: string, folder: string, sessionId: string|null }}
   */
  create(id, options, onData, onExit) {
    if (!id || typeof id !== 'string') {
      throw new Error('TERMINAL_ERROR: Terminal id is required');
    }

    if (this.terminals.has(id)) {
      throw new Error(`TERMINAL_ERROR: Terminal already exists: ${id}`);
    }

    if (this.terminals.size >= MAX_TERMINALS) {
      throw new Error(`TERMINAL_ERROR: Maximum terminal limit reached (${MAX_TERMINALS})`);
    }

    const {
      folder,
      cliCommand = 'claude',
      sessionId = null,
      resumeFlag = '--resume',
      cols = 80,
      rows = 24,
    } = options;

    // Validate folder
    if (!folder || typeof folder !== 'string' || !path.isAbsolute(folder)) {
      throw new Error('TERMINAL_ERROR: Folder must be an absolute path');
    }

    try {
      const stat = fs.statSync(folder);
      if (!stat.isDirectory()) {
        throw new Error('TERMINAL_ERROR: Folder does not exist or is not a directory');
      }
    } catch (err) {
      if (err.message.startsWith('TERMINAL_ERROR')) throw err;
      throw new Error(`TERMINAL_ERROR: Folder does not exist: ${folder}`);
    }

    // Validate sessionId if provided
    if (sessionId !== null && sessionId !== undefined) {
      if (
        typeof sessionId !== 'string' ||
        sessionId.length === 0 ||
        sessionId.length > SESSION_ID_MAX_LENGTH ||
        !SESSION_ID_REGEX.test(sessionId)
      ) {
        throw new Error('TERMINAL_ERROR: Invalid session ID');
      }
    }

    // Validate cols/rows
    const safeCols = Number.isFinite(cols) && cols > 0 ? Math.floor(cols) : 80;
    const safeRows = Number.isFinite(rows) && rows > 0 ? Math.floor(rows) : 24;

    // Build command arguments
    const args = (sessionId && resumeFlag) ? [resumeFlag, sessionId] : [];

    // Platform-specific shell setup
    const shell = process.platform === 'win32' ? 'cmd.exe' : 'bash';
    const shellArgs = process.platform === 'win32'
      ? ['/k', [cliCommand, ...args].join(' ')]
      : ['-c', [cliCommand, ...args].join(' ')];

    let ptyProcess;
    try {
      ptyProcess = pty.spawn(shell, shellArgs, {
        name: 'xterm-color',
        cols: safeCols,
        rows: safeRows,
        cwd: folder,
        env: { ...process.env },
      });
    } catch (err) {
      throw new Error(`TERMINAL_ERROR: Failed to spawn terminal: ${err.message}`);
    }

    const entry = {
      pty: ptyProcess,
      folder,
      sessionId: sessionId || null,
      status: 'running',
      buffer: '',
    };

    this.terminals.set(id, entry);

    // Wire data handler: maintain replay buffer and forward
    ptyProcess.onData((data) => {
      const currentBuffer = entry.buffer + data;
      entry.buffer = currentBuffer.length > REPLAY_BUFFER_SIZE
        ? currentBuffer.slice(currentBuffer.length - REPLAY_BUFFER_SIZE)
        : currentBuffer;

      if (typeof onData === 'function') {
        onData(data);
      }
    });

    // Wire exit handler
    ptyProcess.onExit(({ exitCode }) => {
      entry.status = 'exited';
      if (typeof onExit === 'function') {
        onExit({ exitCode });
      }
    });

    return { id, folder, sessionId: sessionId || null };
  }

  /**
   * Write data to a terminal's stdin.
   * @param {string} id
   * @param {string} data
   */
  write(id, data) {
    const entry = this.terminals.get(id);
    if (!entry) {
      throw new Error(`TERMINAL_ERROR: Terminal not found: ${id}`);
    }
    if (entry.status !== 'running') {
      throw new Error(`TERMINAL_ERROR: Terminal is not running: ${id}`);
    }
    entry.pty.write(data);
  }

  /**
   * Resize a terminal.
   * @param {string} id
   * @param {number} cols
   * @param {number} rows
   */
  resize(id, cols, rows) {
    const entry = this.terminals.get(id);
    if (!entry) {
      throw new Error(`TERMINAL_ERROR: Terminal not found: ${id}`);
    }
    if (entry.status !== 'running') {
      return; // silently ignore resize on exited terminal
    }
    const safeCols = Number.isFinite(cols) && cols > 0 ? Math.floor(cols) : 80;
    const safeRows = Number.isFinite(rows) && rows > 0 ? Math.floor(rows) : 24;
    entry.pty.resize(safeCols, safeRows);
  }

  /**
   * Get the replay buffer for reconnection.
   * @param {string} id
   * @returns {string} Buffered output
   */
  getReplayBuffer(id) {
    const entry = this.terminals.get(id);
    if (!entry) {
      throw new Error(`TERMINAL_ERROR: Terminal not found: ${id}`);
    }
    return entry.buffer;
  }

  /**
   * Close and kill a terminal.
   * @param {string} id
   */
  close(id) {
    const entry = this.terminals.get(id);
    if (!entry) {
      return; // already closed, no-op
    }
    try {
      entry.pty.kill();
    } catch (_) {
      // Best-effort kill
    }
    this.terminals.delete(id);
  }

  /**
   * Close all terminals (used on app shutdown).
   */
  closeAll() {
    for (const [id] of this.terminals) {
      this.close(id);
    }
  }
}

module.exports = { TerminalManager, MAX_TERMINALS, REPLAY_BUFFER_SIZE };
