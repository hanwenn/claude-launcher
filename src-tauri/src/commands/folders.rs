use crate::models::folder::FolderInfo;
use crate::services::{config_service, session_parser::SessionParser};
use crate::ConfigLock;
use tauri::State;

/// Get all configured folders with session statistics
#[tauri::command]
pub async fn get_folders(
    parser: State<'_, SessionParser>,
) -> Result<Vec<FolderInfo>, String> {
    let config = config_service::load_config().map_err(|e| e.to_string())?;
    let mut folders = Vec::new();

    for path in &config.folders {
        let sessions = parser.get_sessions(path).unwrap_or_default();
        let last_active = sessions.iter().map(|s| s.timestamp).max();
        let display_name = std::path::Path::new(path)
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| path.clone());

        folders.push(FolderInfo {
            path: path.clone(),
            display_name,
            session_count: sessions.len(),
            last_active,
        });
    }

    Ok(folders)
}

/// Add a folder to configuration.
/// Uses ConfigLock to serialize read-modify-write to prevent race conditions.
#[tauri::command]
pub async fn add_folder(
    path: String,
    config_lock: State<'_, ConfigLock>,
) -> Result<(), String> {
    let _guard = config_lock.0.lock().map_err(|_| "Config lock poisoned".to_string())?;
    let config = config_service::load_config().map_err(|e| e.to_string())?;
    let new_config =
        config_service::add_folder(&config, path).map_err(|e| e.to_string())?;
    config_service::save_config(&new_config).map_err(|e| e.to_string())?;
    Ok(())
}

/// Remove a folder from configuration (does not delete disk files).
/// Uses ConfigLock to serialize read-modify-write to prevent race conditions.
#[tauri::command]
pub async fn remove_folder(
    path: String,
    config_lock: State<'_, ConfigLock>,
) -> Result<(), String> {
    let _guard = config_lock.0.lock().map_err(|_| "Config lock poisoned".to_string())?;
    let config = config_service::load_config().map_err(|e| e.to_string())?;
    let new_config =
        config_service::remove_folder(&config, &path).map_err(|e| e.to_string())?;
    config_service::save_config(&new_config).map_err(|e| e.to_string())?;
    Ok(())
}
