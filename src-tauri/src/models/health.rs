use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// DNS health check status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", content = "data")]
pub enum HealthStatus {
    /// DNS resolution OK, IP matches
    Healthy,
    /// DNS resolution OK but IP does not match
    WrongIp(Vec<String>),
    /// DNS resolution failed
    ResolutionFailed(String),
}

/// DNS health check result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthResult {
    pub status: HealthStatus,
    /// Actually resolved IP list
    pub resolved_ips: Vec<String>,
    /// Expected IP address
    pub expected_ip: String,
    /// Check timestamp
    pub checked_at: DateTime<Utc>,
}
