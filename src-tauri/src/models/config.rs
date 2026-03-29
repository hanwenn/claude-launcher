use serde::{Deserialize, Serialize};

fn default_expected_ip() -> String {
    "198.3.16.159".to_string()
}

fn default_cli_command() -> String {
    "claude".to_string()
}

fn default_health_interval() -> u64 {
    300
}

/// Application global configuration, persisted to %APPDATA%\ClaudeLauncher\config.json
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    /// User-added project folder paths
    pub folders: Vec<String>,
    /// Expected IP address for DNS health check
    #[serde(default = "default_expected_ip")]
    pub expected_ip: String,
    /// Claude CLI executable command (default "claude")
    #[serde(default = "default_cli_command")]
    pub claude_cli_command: String,
    /// Health check polling interval in seconds
    #[serde(default = "default_health_interval")]
    pub health_check_interval_secs: u64,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            folders: Vec::new(),
            expected_ip: default_expected_ip(),
            claude_cli_command: default_cli_command(),
            health_check_interval_secs: default_health_interval(),
        }
    }
}
