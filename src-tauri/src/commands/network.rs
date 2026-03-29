use crate::models::health::HealthResult;
use crate::services::{config_service, dns_checker};

/// Execute DNS health check
#[tauri::command]
pub async fn check_dns_health() -> Result<HealthResult, String> {
    let config = config_service::load_config().map_err(|e| e.to_string())?;
    let result = dns_checker::check_dns(&config.expected_ip).await;
    Ok(result)
}
