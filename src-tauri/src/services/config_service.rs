use crate::errors::AppError;
use crate::models::config::AppConfig;
use std::fs;
use std::path::PathBuf;

/// Get config file path: %APPDATA%\ClaudeLauncher\config.json
pub fn config_path() -> Result<PathBuf, AppError> {
    let config_dir = dirs::config_dir().ok_or_else(|| {
        AppError::config_error("Cannot determine config directory (%APPDATA%)")
    })?;

    Ok(config_dir.join("ClaudeLauncher").join("config.json"))
}

/// Load config. Returns AppConfig::default() if file does not exist.
/// If the file is corrupted JSON, backs it up as .bak and returns defaults.
pub fn load_config() -> Result<AppConfig, AppError> {
    let path = config_path()?;

    if !path.exists() {
        return Ok(AppConfig::default());
    }

    let content = fs::read_to_string(&path).map_err(|e| {
        AppError::new(
            "CONFIG_READ_ERROR",
            format!("Failed to read config file: {}", e),
        )
    })?;

    match serde_json::from_str::<AppConfig>(&content) {
        Ok(config) => Ok(config),
        Err(_err) => {
            // Corrupted JSON: backup the file and return defaults
            let backup_path = path.with_extension("json.bak");
            let _ = fs::copy(&path, &backup_path);
            Ok(AppConfig::default())
        }
    }
}

/// Save config with atomic write (write to .tmp then rename).
/// Creates parent directory if it does not exist.
pub fn save_config(config: &AppConfig) -> Result<(), AppError> {
    let path = config_path()?;

    if let Some(parent) = path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| {
                AppError::new(
                    "CONFIG_WRITE_ERROR",
                    format!("Failed to create config directory: {}", e),
                )
            })?;
        }
    }

    let content = serde_json::to_string_pretty(config)
        .map_err(|e| AppError::new("CONFIG_WRITE_ERROR", format!("Failed to serialize config: {}", e)))?;

    let tmp_path = path.with_extension("json.tmp");
    fs::write(&tmp_path, &content).map_err(|e| {
        AppError::new("CONFIG_WRITE_ERROR", format!("Failed to write temp config file: {}", e))
    })?;

    fs::rename(&tmp_path, &path).map_err(|e| {
        AppError::new("CONFIG_WRITE_ERROR", format!("Failed to rename temp config file: {}", e))
    })?;

    Ok(())
}

/// Add a folder path to config (immutable: returns new config).
/// Validates the path exists and is a directory, and checks for duplicates.
pub fn add_folder(config: &AppConfig, path: String) -> Result<AppConfig, AppError> {
    let meta = std::fs::symlink_metadata(&path)
        .map_err(|_| AppError::not_found("Path not accessible"))?;
    if !meta.file_type().is_dir() {
        return Err(AppError::not_found("Path must be a real directory"));
    }

    if config.folders.iter().any(|f| f == &path) {
        return Err(AppError::new(
            "FOLDER_ALREADY_EXISTS",
            format!("Folder already added: {}", path),
        ));
    }

    let mut new_folders = config.folders.clone();
    new_folders.push(path);

    Ok(AppConfig {
        folders: new_folders,
        expected_ip: config.expected_ip.clone(),
        claude_cli_command: config.claude_cli_command.clone(),
        health_check_interval_secs: config.health_check_interval_secs,
    })
}

/// Remove a folder path from config (immutable: returns new config).
pub fn remove_folder(config: &AppConfig, path: &str) -> Result<AppConfig, AppError> {
    let new_folders: Vec<String> = config
        .folders
        .iter()
        .filter(|f| f.as_str() != path)
        .cloned()
        .collect();

    Ok(AppConfig {
        folders: new_folders,
        expected_ip: config.expected_ip.clone(),
        claude_cli_command: config.claude_cli_command.clone(),
        health_check_interval_secs: config.health_check_interval_secs,
    })
}
