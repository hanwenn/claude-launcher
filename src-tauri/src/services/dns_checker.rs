use crate::models::health::{HealthResult, HealthStatus};
use chrono::Utc;

/// Built-in expected IP for claude.ai, used as primary check to prevent config tampering.
const BUILTIN_EXPECTED_IP: &str = "198.3.16.159";

/// Execute DNS health check.
/// Uses dns_lookup crate to resolve claude.ai, compares against expected_ip.
/// The built-in IP is always used as the primary check. If the config provides
/// a different IP, it is accepted as an additional allowed IP but a warning is logged.
pub async fn check_dns(config_expected_ip: &str) -> HealthResult {
    let checked_at = Utc::now();
    let builtin = BUILTIN_EXPECTED_IP.to_string();

    // Build list of allowed IPs: always include built-in, optionally include config value
    let mut allowed_ips: Vec<String> = vec![builtin.clone()];
    if !config_expected_ip.is_empty() && config_expected_ip != BUILTIN_EXPECTED_IP {
        eprintln!(
            "WARNING: config expected_ip ({}) differs from built-in ({}). Using both.",
            config_expected_ip, BUILTIN_EXPECTED_IP
        );
        allowed_ips.push(config_expected_ip.to_string());
    }

    // DNS resolution is blocking, run in a blocking thread
    let result = tokio::task::spawn_blocking({
        let builtin = builtin.clone();
        move || -> HealthResult {
            match dns_lookup::lookup_host("claude.ai") {
                Ok(ips) => {
                    let ip_strings: Vec<String> =
                        ips.iter().map(|ip| ip.to_string()).collect();

                    let status = if ip_strings.iter().any(|ip| allowed_ips.contains(ip)) {
                        HealthStatus::Healthy
                    } else {
                        HealthStatus::WrongIp(ip_strings.clone())
                    };

                    HealthResult {
                        status,
                        resolved_ips: ip_strings,
                        expected_ip: builtin,
                        checked_at,
                    }
                }
                Err(e) => HealthResult {
                    status: HealthStatus::ResolutionFailed(e.to_string()),
                    resolved_ips: vec![],
                    expected_ip: builtin,
                    checked_at,
                },
            }
        }
    })
    .await
    .unwrap_or_else(|e| HealthResult {
        status: HealthStatus::ResolutionFailed(format!("Task execution failed: {}", e)),
        resolved_ips: vec![],
        expected_ip: BUILTIN_EXPECTED_IP.to_string(),
        checked_at,
    });

    result
}
