use crate::errors::AppError;
use crate::models::session::{MessagePreview, SessionDetail, SessionInfo};
use chrono::{DateTime, Utc};
use std::collections::HashMap;
use std::fs;
use std::io::{BufRead, BufReader};
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::SystemTime;

const MAX_MESSAGES: usize = 500;
const MAX_FILE_SIZE_BYTES: u64 = 50 * 1024 * 1024; // 50 MB
const MAX_METADATA_LINES: usize = 200;

/// Cache entry: file mtime + parsed results
struct CacheEntry {
    mtime: SystemTime,
    sessions: Vec<SessionInfo>,
}

/// Session parser with file-level mtime cache
pub struct SessionParser {
    cache: Mutex<HashMap<PathBuf, CacheEntry>>,
}

/// Validate that a session ID contains only safe characters (alphanumeric and hyphens).
/// Prevents path traversal attacks when constructing file paths from session IDs.
fn is_valid_session_id(id: &str) -> bool {
    !id.is_empty()
        && id.len() <= 64
        && id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-')
}

impl SessionParser {
    pub fn new() -> Self {
        Self {
            cache: Mutex::new(HashMap::new()),
        }
    }

    /// Encode a Windows path to Claude project directory name.
    /// Rule: "D:\foo\bar" -> "D--foo-bar"
    /// Observed from actual data: ":" becomes "-", "\" becomes "-", giving double dash after drive letter.
    pub fn encode_folder_path(folder_path: &str) -> String {
        folder_path.replace(':', "-").replace('\\', "-").replace('/', "-")
    }

    /// Get the Claude projects directory for a given folder path.
    /// Returns ~/.claude/projects/<encoded-path>/
    pub fn projects_dir(folder_path: &str) -> Result<PathBuf, AppError> {
        let home = dirs::home_dir().ok_or_else(|| {
            AppError::not_found("Cannot determine home directory")
        })?;

        let encoded = Self::encode_folder_path(folder_path);
        Ok(home.join(".claude").join("projects").join(encoded))
    }

    /// Scan all sessions for a given folder.
    /// Uses mtime cache: only re-parses when file modification time changes.
    /// The mutex is held only briefly to check/update the cache, not during file I/O.
    pub fn get_sessions(&self, folder_path: &str) -> Result<Vec<SessionInfo>, AppError> {
        let project_dir = Self::projects_dir(folder_path)?;

        if !project_dir.exists() {
            return Ok(Vec::new());
        }

        // Step 1: Collect all candidate JSONL file paths and their mtimes (no lock)
        let entries = fs::read_dir(&project_dir).map_err(|e| {
            AppError::new(
                "SESSION_PARSE_ERROR",
                format!("Failed to read project directory: {}", e),
            )
        })?;

        let mut candidates: Vec<(PathBuf, SystemTime)> = Vec::new();
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().map(|e| e == "jsonl").unwrap_or(false) && path.is_file() {
                let mtime = path
                    .metadata()
                    .and_then(|m| m.modified())
                    .unwrap_or(SystemTime::UNIX_EPOCH);
                candidates.push((path, mtime));
            }
        }

        // Step 2: Brief lock to check cache, determine which files need re-parsing
        let mut cached_results: Vec<SessionInfo> = Vec::new();
        let mut to_parse: Vec<(PathBuf, SystemTime)> = Vec::new();

        {
            let cache = self.cache.lock().map_err(|_| AppError::io_error("Internal cache error"))?;
            for (path, mtime) in &candidates {
                if let Some(cached) = cache.get(path) {
                    if cached.mtime == *mtime {
                        cached_results.extend(cached.sessions.clone());
                        continue;
                    }
                }
                to_parse.push((path.clone(), *mtime));
            }
        } // lock released

        // Step 3: Parse files outside the lock
        let mut newly_parsed: Vec<(PathBuf, SystemTime, SessionInfo)> = Vec::new();
        for (path, mtime) in &to_parse {
            match parse_jsonl_file(path) {
                Ok(session) => {
                    newly_parsed.push((path.clone(), *mtime, session));
                }
                Err(_) => {
                    // Skip files that fail to parse
                }
            }
        }

        // Step 4: Brief lock to update cache
        {
            let mut cache = self.cache.lock().map_err(|_| AppError::io_error("Internal cache error"))?;
            for (path, mtime, session) in &newly_parsed {
                cache.insert(
                    path.clone(),
                    CacheEntry {
                        mtime: *mtime,
                        sessions: vec![session.clone()],
                    },
                );
            }
        } // lock released

        // Step 5: Assemble results
        let mut all_sessions = cached_results;
        for (_, _, session) in newly_parsed {
            all_sessions.push(session);
        }

        Ok(all_sessions)
    }

    /// Get detail for a single session (message preview list).
    pub fn get_session_detail(
        &self,
        session_id: &str,
        folder_path: &str,
    ) -> Result<SessionDetail, AppError> {
        if !is_valid_session_id(session_id) {
            return Err(AppError::new(
                "INVALID_SESSION_ID",
                format!(
                    "Session ID contains invalid characters or is too long: {}",
                    session_id
                ),
            ));
        }

        let project_dir = Self::projects_dir(folder_path)?;
        let jsonl_path = project_dir.join(format!("{}.jsonl", session_id));

        if !jsonl_path.exists() {
            return Err(AppError::not_found(format!(
                "Session file not found: {}",
                session_id
            )));
        }

        let messages = parse_jsonl_messages(&jsonl_path)?;

        Ok(SessionDetail {
            id: session_id.to_string(),
            messages,
        })
    }
}

/// Parse a single JSONL file into a SessionInfo.
/// Reads line by line (streaming) to handle large files.
fn parse_jsonl_file(path: &std::path::Path) -> Result<SessionInfo, AppError> {
    let file = fs::File::open(path).map_err(|e| {
        AppError::new(
            "SESSION_PARSE_ERROR",
            format!("Failed to open session file {}: {}", path.display(), e),
        )
    })?;
    let reader = BufReader::new(file);

    let fallback_id = path
        .file_stem()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_default();

    let mut session_id: Option<String> = None;
    let mut first_timestamp: Option<DateTime<Utc>> = None;
    let mut model: Option<String> = None;
    let mut summary: Option<String> = None;
    let mut message_count: usize = 0;
    let mut lines_read: usize = 0;

    for line in reader.lines() {
        lines_read += 1;
        if lines_read > MAX_METADATA_LINES {
            break;
        }
        let line = match line {
            Ok(l) => l,
            Err(_) => continue,
        };

        if line.trim().is_empty() {
            continue;
        }

        let value: serde_json::Value = match serde_json::from_str(&line) {
            Ok(v) => v,
            Err(_) => continue, // Skip malformed lines
        };

        // Extract sessionId from any line that has it
        if session_id.is_none() {
            if let Some(sid) = value.get("sessionId").and_then(|v| v.as_str()) {
                session_id = Some(sid.to_string());
            }
        }

        // Extract first timestamp
        if first_timestamp.is_none() {
            if let Some(ts) = value.get("timestamp").and_then(|v| v.as_str()) {
                if let Ok(dt) = ts.parse::<DateTime<Utc>>() {
                    first_timestamp = Some(dt);
                }
            }
        }

        let msg_type = value.get("type").and_then(|v| v.as_str()).unwrap_or("");

        // Count user and assistant messages
        if msg_type == "user" || msg_type == "assistant" {
            // Skip meta messages for counting
            let is_meta = value.get("isMeta").and_then(|v| v.as_bool()).unwrap_or(false);
            if !is_meta {
                message_count += 1;
            }
        }

        // Extract model from first assistant message
        if model.is_none() && msg_type == "assistant" {
            if let Some(msg) = value.get("message") {
                if let Some(m) = msg.get("model").and_then(|v| v.as_str()) {
                    let m_str = m.to_string();
                    if m_str != "<synthetic>" {
                        model = Some(m_str);
                    }
                }
            }
        }

        // Extract summary from first non-meta user message
        if summary.is_none() && msg_type == "user" {
            let is_meta = value.get("isMeta").and_then(|v| v.as_bool()).unwrap_or(false);
            if !is_meta {
                if let Some(msg) = value.get("message") {
                    if let Some(content) = msg.get("content").and_then(|v| v.as_str()) {
                        let trimmed = content.trim();
                        if !trimmed.is_empty() {
                            let truncated: String = trimmed.chars().take(120).collect();
                            summary = Some(truncated);
                        }
                    }
                }
            }
        }
    }

    // Must have at least a timestamp to be a valid session
    let timestamp = first_timestamp.ok_or_else(|| {
        AppError::new("SESSION_PARSE_ERROR", "JSONL file has no valid timestamp")
    })?;

    Ok(SessionInfo {
        id: session_id.unwrap_or(fallback_id),
        timestamp,
        model,
        summary: summary.unwrap_or_else(|| "(empty)".to_string()),
        message_count,
    })
}

/// Parse a JSONL file into a list of message previews for session detail view.
fn parse_jsonl_messages(path: &std::path::Path) -> Result<Vec<MessagePreview>, AppError> {
    let file_size = fs::metadata(path).map_err(|e| {
        AppError::new(
            "SESSION_PARSE_ERROR",
            format!("Failed to read session file metadata {}: {}", path.display(), e),
        )
    })?.len();
    if file_size > MAX_FILE_SIZE_BYTES {
        return Err(AppError::new(
            "SESSION_PARSE_ERROR",
            format!(
                "Session file too large ({} bytes, max {} bytes)",
                file_size, MAX_FILE_SIZE_BYTES
            ),
        ));
    }

    let file = fs::File::open(path).map_err(|e| {
        AppError::new(
            "SESSION_PARSE_ERROR",
            format!("Failed to open session file {}: {}", path.display(), e),
        )
    })?;
    let reader = BufReader::new(file);
    let mut messages = Vec::new();

    for line in reader.lines() {
        let line = match line {
            Ok(l) => l,
            Err(_) => continue,
        };

        if line.trim().is_empty() {
            continue;
        }

        let value: serde_json::Value = match serde_json::from_str(&line) {
            Ok(v) => v,
            Err(_) => continue,
        };

        let msg_type = match value.get("type").and_then(|v| v.as_str()) {
            Some(t) => t,
            None => continue,
        };

        // Only include user and assistant messages
        if msg_type != "user" && msg_type != "assistant" {
            continue;
        }

        let is_meta = value.get("isMeta").and_then(|v| v.as_bool()).unwrap_or(false);
        if is_meta {
            continue;
        }

        let timestamp = value
            .get("timestamp")
            .and_then(|v| v.as_str())
            .and_then(|ts| ts.parse::<DateTime<Utc>>().ok());

        let role = msg_type.to_string();

        let content_preview = extract_content_preview(&value, msg_type);

        messages.push(MessagePreview {
            role,
            content_preview,
            timestamp,
        });

        if messages.len() >= MAX_MESSAGES {
            break;
        }
    }

    Ok(messages)
}

/// Extract content preview from a JSONL message line.
/// For user messages: message.content (string)
/// For assistant messages: concatenate text blocks from message.content array
fn extract_content_preview(value: &serde_json::Value, msg_type: &str) -> String {
    let msg = match value.get("message") {
        Some(m) => m,
        None => return "(no content)".to_string(),
    };

    let content = match msg.get("content") {
        Some(c) => c,
        None => return "(no content)".to_string(),
    };

    let raw_text = if let Some(s) = content.as_str() {
        // User messages: content is a plain string
        s.to_string()
    } else if let Some(arr) = content.as_array() {
        // Assistant messages: content is an array of blocks
        let mut parts = Vec::new();
        for block in arr {
            if let Some(block_type) = block.get("type").and_then(|v| v.as_str()) {
                if block_type == "text" {
                    if let Some(text) = block.get("text").and_then(|v| v.as_str()) {
                        parts.push(text.to_string());
                    }
                }
            }
        }
        if parts.is_empty() {
            return match msg_type {
                "assistant" => "(thinking...)".to_string(),
                _ => "(no content)".to_string(),
            };
        }
        parts.join("\n")
    } else {
        return "(no content)".to_string();
    };

    let trimmed = raw_text.trim();
    if trimmed.is_empty() {
        return "(empty)".to_string();
    }

    trimmed.chars().take(500).collect()
}
