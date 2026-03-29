use crate::errors::AppError;
use std::os::windows::process::CommandExt;
use std::path::Path;
use std::process::Command;

const CREATE_NEW_CONSOLE: u32 = 0x00000010;

/// Launch a new Claude Code session.
/// Opens a new console window running the CLI binary directly in the specified folder.
pub fn launch_new_session(
    cli_command: &str,
    folder_path: &Path,
) -> Result<(), AppError> {
    if !folder_path.is_dir() {
        return Err(AppError::not_found(format!(
            "Folder does not exist: {}",
            folder_path.display()
        )));
    }

    Command::new(cli_command)
        .current_dir(folder_path)
        .creation_flags(CREATE_NEW_CONSOLE)
        .spawn()
        .map_err(|e| {
            AppError::new(
                "CLI_LAUNCH_ERROR",
                format!("Failed to launch Claude CLI '{}': {}", cli_command, e),
            )
        })?;

    Ok(())
}

/// Resume an existing Claude Code session.
/// Opens a new console window running the CLI binary directly with --resume flag.
pub fn launch_resume_session(
    cli_command: &str,
    folder_path: &Path,
    session_id: &str,
) -> Result<(), AppError> {
    if !folder_path.is_dir() {
        return Err(AppError::not_found(format!(
            "Folder does not exist: {}",
            folder_path.display()
        )));
    }

    Command::new(cli_command)
        .args(["--resume", session_id])
        .current_dir(folder_path)
        .creation_flags(CREATE_NEW_CONSOLE)
        .spawn()
        .map_err(|e| {
            AppError::new(
                "CLI_LAUNCH_ERROR",
                format!("Failed to resume session '{}': {}", session_id, e),
            )
        })?;

    Ok(())
}
