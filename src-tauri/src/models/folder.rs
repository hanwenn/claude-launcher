use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Folder summary for frontend list display
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FolderInfo {
    /// Absolute folder path
    pub path: String,
    /// Display name (last segment of path)
    pub display_name: String,
    /// Number of sessions in this folder
    pub session_count: usize,
    /// Most recent session activity time (None if no sessions)
    pub last_active: Option<DateTime<Utc>>,
}
