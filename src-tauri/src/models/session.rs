use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Session list item
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionInfo {
    /// Session unique identifier (from JSONL sessionId or filename)
    pub id: String,
    /// Session creation timestamp
    pub timestamp: DateTime<Utc>,
    /// Model name used (e.g. "claude-sonnet-4-20250514")
    pub model: Option<String>,
    /// Summary: first 120 characters of the first user message
    pub summary: String,
    /// Total message count
    pub message_count: usize,
}

/// Single message preview
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessagePreview {
    /// Message role: user / assistant / system
    pub role: String,
    /// First 500 characters of message content
    pub content_preview: String,
    /// Message timestamp
    pub timestamp: Option<DateTime<Utc>>,
}

/// Session detail with message preview list
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionDetail {
    pub id: String,
    pub messages: Vec<MessagePreview>,
}
