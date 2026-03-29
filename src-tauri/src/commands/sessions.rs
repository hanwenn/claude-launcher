use crate::models::session::{SessionDetail, SessionInfo};
use crate::services::{config_service, session_parser::SessionParser};
use std::path::Path;
use tauri::State;

/// Validate that a folder path is absolute and exists as a directory.
fn validate_folder_path(folder_path: &str) -> Result<(), String> {
    let path = Path::new(folder_path);
    if !path.is_absolute() {
        return Err(format!("Folder path must be absolute: {}", folder_path));
    }
    if !path.is_dir() {
        return Err(format!("Folder does not exist or is not a directory: {}", folder_path));
    }
    Ok(())
}

/// Get all sessions for a folder, sorted by time descending
#[tauri::command]
pub async fn get_sessions(
    folder_path: String,
    parser: State<'_, SessionParser>,
) -> Result<Vec<SessionInfo>, String> {
    validate_folder_path(&folder_path)?;

    let config = config_service::load_config().map_err(|e| e.to_string())?;
    if !config.folders.iter().any(|f| f == &folder_path) {
        return Err("Folder not in configured list".to_string());
    }

    let mut sessions = parser
        .get_sessions(&folder_path)
        .map_err(|e| e.to_string())?;
    sessions.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    Ok(sessions)
}

/// Get detail for a single session
#[tauri::command]
pub async fn get_session_detail(
    session_id: String,
    folder_path: String,
    parser: State<'_, SessionParser>,
) -> Result<SessionDetail, String> {
    validate_folder_path(&folder_path)?;

    let config = config_service::load_config().map_err(|e| e.to_string())?;
    if !config.folders.iter().any(|f| f == &folder_path) {
        return Err("Folder not in configured list".to_string());
    }

    parser
        .get_session_detail(&session_id, &folder_path)
        .map_err(|e| e.to_string())
}
