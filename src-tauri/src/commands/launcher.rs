use crate::errors::AppError;
use crate::services::{claude_cli, config_service};
use std::path::Path;

/// Launch Claude Code (new session or resume existing)
#[tauri::command]
pub async fn launch_claude(
    folder_path: String,
    session_id: Option<String>,
) -> Result<(), String> {
    let config = config_service::load_config().map_err(|e| e.to_string())?;
    if !config.folders.iter().any(|f| f == &folder_path) {
        return Err("Folder not in configured list".to_string());
    }

    let folder = Path::new(&folder_path);
    if !folder.is_dir() {
        return Err(
            AppError::not_found(format!("Folder does not exist: {}", folder_path))
                .to_string(),
        );
    }
    let cli = &config.claude_cli_command;

    match session_id {
        Some(id) => claude_cli::launch_resume_session(cli, folder, &id),
        None => claude_cli::launch_new_session(cli, folder),
    }
    .map_err(|e| e.to_string())
}
