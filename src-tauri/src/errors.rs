use serde::Serialize;
use std::fmt;

#[derive(Debug, Serialize)]
pub struct AppError {
    pub message: String,
    pub code: String,
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "[{}] {}", self.code, self.message)
    }
}

impl std::error::Error for AppError {}

impl AppError {
    pub fn new(code: impl Into<String>, message: impl Into<String>) -> Self {
        Self {
            code: code.into(),
            message: message.into(),
        }
    }

    pub fn not_found(message: impl Into<String>) -> Self {
        Self::new("NOT_FOUND", message)
    }

    pub fn io_error(message: impl Into<String>) -> Self {
        Self::new("IO_ERROR", message)
    }

    pub fn config_error(message: impl Into<String>) -> Self {
        Self::new("CONFIG_ERROR", message)
    }
}

// Blanket From impls removed intentionally.
// Use explicit error construction at each call site with appropriate error codes:
// "SESSION_PARSE_ERROR", "CONFIG_READ_ERROR", "CONFIG_WRITE_ERROR", "DNS_ERROR", "CLI_LAUNCH_ERROR"
