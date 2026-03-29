# Claude Launcher - Rust 后端模块架构设计

> Tauri 2.x Rust 后端，用于 Windows 平台上的 Claude Code CLI 会话启动器。

---

## 目录结构

```
src-tauri/src/
├── main.rs                  # Tauri 入口，注册所有 commands
├── lib.rs                   # 模块声明
├── errors.rs                # 统一错误类型
├── commands/
│   ├── mod.rs
│   ├── folders.rs           # 文件夹管理 IPC
│   ├── sessions.rs          # 会话查询 IPC
│   ├── network.rs           # DNS 健康检查 IPC
│   └── launcher.rs          # Claude CLI 启动 IPC
├── services/
│   ├── mod.rs
│   ├── config_service.rs    # 配置文件读写
│   ├── session_parser.rs    # JSONL 会话解析与缓存
│   ├── dns_checker.rs       # DNS 解析健康检查
│   └── claude_cli.rs        # Claude CLI 进程管理
└── models/
    ├── mod.rs
    ├── config.rs            # AppConfig
    ├── folder.rs            # FolderInfo
    ├── session.rs           # SessionInfo, SessionDetail, MessagePreview
    └── health.rs            # HealthResult, HealthStatus
```

---

## 1. models/ — 数据结构

### 1.1 config.rs

```rust
use serde::{Deserialize, Serialize};

/// 应用全局配置，持久化到 %APPDATA%\ClaudeLauncher\config.json
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    /// 用户添加的项目文件夹路径列表
    pub folders: Vec<String>,
    /// DNS 健康检查期望的 IP 地址
    #[serde(default = "default_expected_ip")]
    pub expected_ip: String,
    /// Claude CLI 可执行命令（默认 "claude"）
    #[serde(default = "default_cli_command")]
    pub claude_cli_command: String,
    /// 健康检查轮询间隔（秒）
    #[serde(default = "default_health_interval")]
    pub health_check_interval_secs: u64,
}

fn default_expected_ip() -> String {
    "198.3.16.159".to_string()
}

fn default_cli_command() -> String {
    "claude".to_string()
}

fn default_health_interval() -> u64 {
    300 // 5 分钟
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
```

### 1.2 folder.rs

```rust
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// 文件夹摘要信息，用于前端列表展示
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FolderInfo {
    /// 文件夹绝对路径
    pub path: String,
    /// 显示名称（取路径最后一段）
    pub display_name: String,
    /// 该文件夹下的会话数量
    pub session_count: usize,
    /// 最近一次会话活动时间（可能为空，表示无会话）
    pub last_active: Option<DateTime<Utc>>,
}
```

### 1.3 session.rs

```rust
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// 会话列表项
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionInfo {
    /// 会话唯一标识（JSONL 文件中的 sessionId）
    pub id: String,
    /// 会话创建时间戳
    pub timestamp: DateTime<Utc>,
    /// 使用的模型名称（如 "claude-sonnet-4-20250514"）
    pub model: Option<String>,
    /// 摘要：第一条用户消息的前 120 个字符
    pub summary: String,
    /// 消息总数
    pub message_count: usize,
}

/// 单条消息预览
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessagePreview {
    /// 消息角色：user / assistant / system
    pub role: String,
    /// 消息内容前 500 字符
    pub content_preview: String,
    /// 消息时间戳
    pub timestamp: Option<DateTime<Utc>>,
}

/// 会话详情（包含消息预览列表）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionDetail {
    pub id: String,
    pub messages: Vec<MessagePreview>,
}
```

### 1.4 health.rs

```rust
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// DNS 健康检查状态枚举
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", content = "data")]
pub enum HealthStatus {
    /// DNS 解析正常，IP 匹配
    Healthy,
    /// DNS 解析成功但 IP 不匹配
    WrongIp(Vec<String>),
    /// DNS 解析失败
    ResolutionFailed(String),
}

/// DNS 健康检查结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthResult {
    pub status: HealthStatus,
    /// 实际解析到的 IP 列表
    pub resolved_ips: Vec<String>,
    /// 期望的 IP 地址
    pub expected_ip: String,
    /// 检查时间
    pub checked_at: DateTime<Utc>,
}
```

---

## 2. errors.rs — 统一错误类型

```rust
use serde::Serialize;
use std::fmt;

/// 后端统一错误类型，实现 Serialize 以便 Tauri IPC 返回给前端
#[derive(Debug, Serialize)]
pub struct AppError {
    /// 错误分类码
    pub code: ErrorCode,
    /// 面向用户的错误消息
    pub message: String,
    /// 可选的底层错误详情（仅日志，不暴露给前端）
    #[serde(skip)]
    pub source: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub enum ErrorCode {
    ConfigReadFailed,
    ConfigWriteFailed,
    FolderNotFound,
    FolderAlreadyExists,
    SessionParseError,
    SessionNotFound,
    DnsResolutionError,
    CliLaunchFailed,
    InvalidPath,
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "[{:?}] {}", self.code, self.message)
    }
}

impl std::error::Error for AppError {}

/// 便捷构造函数
impl AppError {
    pub fn new(code: ErrorCode, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
            source: None,
        }
    }

    pub fn with_source(code: ErrorCode, message: impl Into<String>, source: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
            source: Some(source.into()),
        }
    }
}

/// 从 std::io::Error 转换
impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError::with_source(
            ErrorCode::ConfigReadFailed,
            "文件操作失败",
            err.to_string(),
        )
    }
}

/// 从 serde_json::Error 转换
impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> Self {
        AppError::with_source(
            ErrorCode::SessionParseError,
            "JSON 解析失败",
            err.to_string(),
        )
    }
}
```

**错误处理策略：**

- 所有 `commands/` 层函数返回 `Result<T, AppError>`，Tauri 自动将错误序列化返回前端。
- `services/` 层同样返回 `Result<T, AppError>`，由 `commands` 层透传。
- 日志记录使用 `tracing` crate，`source` 字段仅写入日志，不发送给前端，避免泄露系统路径等敏感信息。

---

## 3. services/ — 业务逻辑层

### 3.1 config_service.rs

**职责：** 读取和保存 `AppConfig`，持久化路径为 `%APPDATA%\ClaudeLauncher\config.json`。

```rust
use crate::errors::{AppError, ErrorCode};
use crate::models::config::AppConfig;
use std::path::PathBuf;

/// 获取配置文件路径：%APPDATA%\ClaudeLauncher\config.json
pub fn config_path() -> Result<PathBuf, AppError>;

/// 加载配置。若文件不存在则返回 AppConfig::default() 并自动创建。
pub fn load_config() -> Result<AppConfig, AppError>;

/// 保存配置。自动创建父目录。写入时先写临时文件再原子重命名，防止写入中断导致数据丢失。
pub fn save_config(config: &AppConfig) -> Result<(), AppError>;

/// 向配置中添加文件夹路径（去重、校验路径存在）
pub fn add_folder(config: &AppConfig, path: String) -> Result<AppConfig, AppError>;

/// 从配置中移除文件夹路径
pub fn remove_folder(config: &AppConfig, path: &str) -> Result<AppConfig, AppError>;
```

**边界情况处理：**

| 场景 | 处理方式 |
|------|---------|
| `%APPDATA%` 环境变量缺失 | 返回 `ConfigReadFailed` 错误，提示用户检查系统环境 |
| 配置文件不存在 | 创建默认配置并返回 |
| 配置文件 JSON 格式损坏 | 记录日志，备份损坏文件为 `.bak`，返回默认配置 |
| 写入时磁盘满 | 原子写入失败时保留旧文件，返回 `ConfigWriteFailed` |
| 添加重复文件夹 | 返回 `FolderAlreadyExists` 错误 |
| 添加不存在的路径 | 返回 `FolderNotFound` 错误 |
| 路径包含 Unicode 字符 | 正常支持，Rust `String` 为 UTF-8 |

**注意：** `add_folder` 和 `remove_folder` 为纯函数，接收旧配置返回新配置（不可变模式），由调用方决定是否持久化。

**依赖 crate：**
- `serde`, `serde_json` — 序列化/反序列化
- `dirs` — 获取 `%APPDATA%` 路径（跨平台）

---

### 3.2 session_parser.rs

**职责：** 扫描 `~/.claude/projects/<encoded-path>/` 目录下的 `*.jsonl` 文件，解析会话元数据，提供文件级缓存。

```rust
use crate::errors::AppError;
use crate::models::session::{MessagePreview, SessionDetail, SessionInfo};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::SystemTime;

/// 缓存条目：文件 mtime + 解析结果
struct CacheEntry {
    mtime: SystemTime,
    sessions: Vec<SessionInfo>,
}

/// 会话解析器，持有文件级缓存
pub struct SessionParser {
    cache: Mutex<HashMap<PathBuf, CacheEntry>>,
}

impl SessionParser {
    pub fn new() -> Self;

    /// 将 Windows 路径编码为 Claude 项目目录名
    /// 规则：D:\foo\bar → D--foo--bar（将 ":\" 和 "\" 替换为 "--"）
    pub fn encode_folder_path(folder_path: &str) -> String;

    /// 获取指定文件夹的 Claude 项目目录路径
    /// 返回 ~/.claude/projects/<encoded-path>/
    pub fn projects_dir(folder_path: &str) -> Result<PathBuf, AppError>;

    /// 扫描指定文件夹下的所有会话
    /// 利用 mtime 缓存：仅当文件修改时间变化时重新解析
    pub fn get_sessions(&self, folder_path: &str) -> Result<Vec<SessionInfo>, AppError>;

    /// 获取单个会话的详细信息（消息预览列表）
    pub fn get_session_detail(
        &self,
        session_id: &str,
        folder_path: &str,
    ) -> Result<SessionDetail, AppError>;
}
```

**JSONL 解析逻辑：**

每个 `.jsonl` 文件包含多行 JSON 对象。解析每行提取以下字段：

```
行结构（简化）：
{
  "type": "user" | "assistant" | "system",
  "sessionId": "uuid-string",
  "timestamp": "2026-01-15T10:30:00Z",
  "model": "claude-sonnet-4-20250514",
  "message": { "role": "user", "content": "..." }
}
```

**提取规则：**
1. `sessionId` — 从任意行提取，同一文件所有行共享
2. `timestamp` — 取第一行的时间戳作为会话创建时间
3. `model` — 取第一个 assistant 消息中的 model 字段
4. `summary` — 取第一条 role=user 的消息内容，截断至 120 字符
5. `message_count` — 统计所有消息行数

**边界情况处理：**

| 场景 | 处理方式 |
|------|---------|
| `~/.claude/projects/` 目录不存在 | 返回空列表（非错误） |
| 编码后的目录不存在 | 返回空列表（非错误） |
| JSONL 文件为空 | 跳过该文件 |
| JSONL 某行格式错误 | 跳过该行，记录 `tracing::warn`，继续解析其余行 |
| 文件缺少 sessionId | 使用文件名（不含扩展名）作为 session ID |
| 内容为空的消息 | summary 显示 "(空消息)" |
| 文件非常大（>100MB） | 流式逐行读取，不一次性加载到内存 |
| 并发访问缓存 | `Mutex` 保护，短暂持锁仅做 mtime 比较和缓存读写 |

**依赖 crate：**
- `serde_json` — JSONL 逐行解析
- `chrono` — 时间戳解析
- `dirs` — 获取 `~/.claude` 路径

---

### 3.3 dns_checker.rs

**职责：** 解析 `claude.ai` 的 DNS 记录，与期望 IP 比对，返回健康状态。

```rust
use crate::errors::AppError;
use crate::models::health::{HealthResult, HealthStatus};

/// 执行 DNS 健康检查
/// 使用 dns-lookup crate 解析 claude.ai，与 expected_ip 比对
pub async fn check_dns(expected_ip: &str) -> HealthResult;
```

**实现细节：**

```rust
use dns_lookup::lookup_host;
use chrono::Utc;

pub async fn check_dns(expected_ip: &str) -> HealthResult {
    let checked_at = Utc::now();

    // DNS 解析在阻塞线程中执行（lookup_host 是同步的）
    let result = tokio::task::spawn_blocking({
        let expected = expected_ip.to_string();
        move || -> HealthResult {
            match lookup_host("claude.ai") {
                Ok(ips) => {
                    let ip_strings: Vec<String> = ips.iter().map(|ip| ip.to_string()).collect();
                    let status = if ip_strings.contains(&expected) {
                        HealthStatus::Healthy
                    } else {
                        HealthStatus::WrongIp(ip_strings.clone())
                    };
                    HealthResult {
                        status,
                        resolved_ips: ip_strings,
                        expected_ip: expected,
                        checked_at,
                    }
                }
                Err(e) => HealthResult {
                    status: HealthStatus::ResolutionFailed(e.to_string()),
                    resolved_ips: vec![],
                    expected_ip: expected,
                    checked_at,
                },
            }
        }
    })
    .await
    .unwrap_or_else(|e| HealthResult {
        status: HealthStatus::ResolutionFailed(format!("任务执行失败: {}", e)),
        resolved_ips: vec![],
        expected_ip: expected_ip.to_string(),
        checked_at,
    });

    result
}
```

**边界情况处理：**

| 场景 | 处理方式 |
|------|---------|
| 网络断开 | 返回 `ResolutionFailed`，错误信息包含原因 |
| DNS 返回多个 IP | 检查期望 IP 是否在列表中，任一匹配即为 Healthy |
| DNS 超时 | `lookup_host` 遵循系统 DNS 超时，返回 `ResolutionFailed` |
| 期望 IP 配置为空 | 仅执行解析，不做比对，返回 Healthy |
| 阻塞线程 panic | `spawn_blocking` 的 JoinError 被捕获，返回 `ResolutionFailed` |

**依赖 crate：**
- `dns-lookup` — DNS 解析
- `tokio` — 异步运行时，`spawn_blocking` 处理同步 DNS 调用
- `chrono` — 时间戳

---

### 3.4 claude_cli.rs

**职责：** 构建并启动 Claude Code CLI 进程，支持新建会话和恢复会话两种模式。

```rust
use crate::errors::AppError;
use std::path::Path;

/// 启动新的 Claude Code 会话
/// 在指定文件夹（cwd）中打开新终端窗口运行 claude
pub fn launch_new_session(
    cli_command: &str,
    folder_path: &Path,
) -> Result<(), AppError>;

/// 恢复已有会话
/// 在指定文件夹中打开新终端窗口运行 claude --resume <session_id>
pub fn launch_resume_session(
    cli_command: &str,
    folder_path: &Path,
    session_id: &str,
) -> Result<(), AppError>;
```

**实现细节：**

```rust
use std::process::Command;

pub fn launch_new_session(cli_command: &str, folder_path: &Path) -> Result<(), AppError> {
    // cmd /c start "" "claude"
    // start 命令会打开新终端窗口，父进程不阻塞
    Command::new("cmd")
        .args(["/c", "start", "", cli_command])
        .current_dir(folder_path)
        .spawn()
        .map_err(|e| AppError::with_source(
            ErrorCode::CliLaunchFailed,
            format!("无法启动 Claude CLI: {}", cli_command),
            e.to_string(),
        ))?;
    Ok(())
}

pub fn launch_resume_session(
    cli_command: &str,
    folder_path: &Path,
    session_id: &str,
) -> Result<(), AppError> {
    // cmd /c start "" "claude" "--resume" "<session-id>"
    Command::new("cmd")
        .args(["/c", "start", "", cli_command, "--resume", session_id])
        .current_dir(folder_path)
        .spawn()
        .map_err(|e| AppError::with_source(
            ErrorCode::CliLaunchFailed,
            format!("无法恢复会话 {}", session_id),
            e.to_string(),
        ))?;
    Ok(())
}
```

**边界情况处理：**

| 场景 | 处理方式 |
|------|---------|
| `claude` 命令不在 PATH 中 | `spawn()` 返回 `io::Error`，转换为 `CliLaunchFailed` |
| 文件夹路径不存在 | 启动前校验路径存在，否则返回 `FolderNotFound` |
| session_id 格式非法 | 由 `commands` 层校验 UUID 格式 |
| 进程启动后立即退出 | 不监控子进程生命周期（分离模式），属于 Claude CLI 自身问题 |
| 路径含空格或特殊字符 | `cmd /c start "" "command"` 中双引号保护参数 |
| CLI 命令为自定义路径 | 支持用户在配置中指定完整路径如 `C:\tools\claude.exe` |

**依赖 crate：**
- 仅使用标准库 `std::process::Command`

---

## 4. commands/ — Tauri IPC 处理层

> 此层为薄封装，负责：参数校验 -> 调用 service -> 返回结果。
> 所有函数使用 `#[tauri::command]` 宏标注。

### 4.1 folders.rs

```rust
use crate::errors::AppError;
use crate::models::folder::FolderInfo;
use crate::services::{config_service, session_parser::SessionParser};
use tauri::State;

/// 获取所有已配置的文件夹及其会话统计
#[tauri::command]
pub async fn get_folders(
    parser: State<'_, SessionParser>,
) -> Result<Vec<FolderInfo>, AppError> {
    let config = config_service::load_config()?;
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

/// 添加文件夹
#[tauri::command]
pub async fn add_folder(path: String) -> Result<(), AppError> {
    // 校验路径存在且为目录
    let p = std::path::Path::new(&path);
    if !p.is_dir() {
        return Err(AppError::new(
            ErrorCode::InvalidPath,
            format!("路径不存在或不是目录: {}", path),
        ));
    }

    let config = config_service::load_config()?;
    let new_config = config_service::add_folder(&config, path)?;
    config_service::save_config(&new_config)?;
    Ok(())
}

/// 移除文件夹（仅从配置中移除，不删除磁盘文件）
#[tauri::command]
pub async fn remove_folder(path: String) -> Result<(), AppError> {
    let config = config_service::load_config()?;
    let new_config = config_service::remove_folder(&config, &path)?;
    config_service::save_config(&new_config)?;
    Ok(())
}
```

### 4.2 sessions.rs

```rust
use crate::errors::AppError;
use crate::models::session::{SessionDetail, SessionInfo};
use crate::services::session_parser::SessionParser;
use tauri::State;

/// 获取指定文件夹下的所有会话，按时间倒序
#[tauri::command]
pub async fn get_sessions(
    folder_path: String,
    parser: State<'_, SessionParser>,
) -> Result<Vec<SessionInfo>, AppError> {
    let mut sessions = parser.get_sessions(&folder_path)?;
    sessions.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    Ok(sessions)
}

/// 获取单个会话的详细信息
#[tauri::command]
pub async fn get_session_detail(
    session_id: String,
    folder_path: String,
    parser: State<'_, SessionParser>,
) -> Result<SessionDetail, AppError> {
    parser.get_session_detail(&session_id, &folder_path)
}
```

### 4.3 network.rs

```rust
use crate::models::health::HealthResult;
use crate::services::{config_service, dns_checker};

/// 执行 DNS 健康检查
#[tauri::command]
pub async fn check_dns_health() -> Result<HealthResult, String> {
    let config = config_service::load_config()
        .map_err(|e| e.message)?;
    let result = dns_checker::check_dns(&config.expected_ip).await;
    Ok(result)
}
```

### 4.4 launcher.rs

```rust
use crate::errors::{AppError, ErrorCode};
use crate::services::{claude_cli, config_service};
use std::path::Path;

/// 启动 Claude Code（新建或恢复会话）
#[tauri::command]
pub async fn launch_claude(
    folder: String,
    session_id: Option<String>,
) -> Result<(), AppError> {
    let folder_path = Path::new(&folder);
    if !folder_path.is_dir() {
        return Err(AppError::new(
            ErrorCode::FolderNotFound,
            format!("文件夹不存在: {}", folder),
        ));
    }

    let config = config_service::load_config()?;
    let cli = &config.claude_cli_command;

    match session_id {
        Some(id) => claude_cli::launch_resume_session(cli, folder_path, &id),
        None => claude_cli::launch_new_session(cli, folder_path),
    }
}
```

---

## 5. main.rs — 应用入口

```rust
mod commands;
mod errors;
mod models;
mod services;

use services::session_parser::SessionParser;

fn main() {
    tauri::Builder::default()
        .manage(SessionParser::new())
        .invoke_handler(tauri::generate_handler![
            commands::folders::get_folders,
            commands::folders::add_folder,
            commands::folders::remove_folder,
            commands::sessions::get_sessions,
            commands::sessions::get_session_detail,
            commands::network::check_dns_health,
            commands::launcher::launch_claude,
        ])
        .run(tauri::generate_context!())
        .expect("启动 Tauri 应用失败");
}
```

---

## 6. 依赖清单 (Cargo.toml)

```toml
[dependencies]
tauri = { version = "2", features = ["devtools"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
chrono = { version = "0.4", features = ["serde"] }
dns-lookup = "2"
tokio = { version = "1", features = ["rt-multi-thread", "macros"] }
dirs = "5"
tracing = "0.1"
tracing-subscriber = "0.3"
uuid = { version = "1", features = ["v4", "serde"] }
```

---

## 7. 数据流概览

```
前端 (TypeScript)
  │
  │  invoke("get_sessions", { folderPath: "D:\\myproject" })
  ▼
commands/sessions.rs::get_sessions()
  │  参数校验
  ▼
services/session_parser.rs::get_sessions()
  │  1. encode_folder_path("D:\\myproject") → "D--myproject"
  │  2. 拼接 ~/.claude/projects/D--myproject/
  │  3. 扫描 *.jsonl 文件
  │  4. 检查缓存：mtime 未变则返回缓存
  │  5. 逐行解析 JSONL，提取 SessionInfo
  │  6. 更新缓存
  ▼
返回 Vec<SessionInfo> → 序列化为 JSON → 前端
```

---

## 8. 状态管理

| 状态 | 存储方式 | 生命周期 |
|------|---------|---------|
| `AppConfig` | 磁盘文件 (`%APPDATA%`) | 持久化，每次操作重新读取 |
| `SessionParser` 缓存 | 内存 (`Mutex<HashMap>`) | 应用运行期间，通过 `tauri::manage()` 注入 |
| `HealthResult` | 前端状态 | 按需查询，不在后端缓存 |

---

## 9. 线程安全设计

- `SessionParser` 使用 `Mutex<HashMap>` 保护缓存，短暂持锁（仅读写 HashMap）。
- DNS 查询通过 `tokio::task::spawn_blocking` 在专用线程池执行，不阻塞 Tauri 主线程。
- `config_service` 的读写为无状态函数调用，文件操作通过原子写入（先写临时文件后重命名）保证一致性。
- CLI 启动为 fire-and-forget 模式，不持有子进程句柄。

---

## 10. 测试策略

### 单元测试

| 模块 | 测试重点 |
|------|---------|
| `session_parser::encode_folder_path` | 路径编码正确性：含空格、中文、多级目录 |
| `session_parser` JSONL 解析 | 正常行、格式错误行、空文件、缺失字段 |
| `config_service` | 默认配置生成、JSON 往返序列化、损坏文件恢复 |
| `dns_checker` | Mock DNS 结果测试三种状态分支 |
| `errors` | From trait 转换覆盖 |

### 集成测试

| 测试场景 | 方法 |
|----------|------|
| 配置文件读写 | 使用临时目录，覆盖 `config_path()` |
| 会话扫描 | 在临时目录构造 `.jsonl` 文件 |
| IPC 命令 | 使用 `tauri::test` 模块 mock 调用 |

### 目标覆盖率

80% 以上，重点覆盖 `services/` 层的业务逻辑。
