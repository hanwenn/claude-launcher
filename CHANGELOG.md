# Changelog / 更新日志

<p align="center">
  <a href="#english">English</a> | <a href="#中文">中文</a>
</p>

---

<h2 id="english">English</h2>

<details open>
<summary><strong>Click to expand / collapse</strong></summary>

All notable changes to this project will be documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.3.0] - 2026-03-30

### Added

- **Command Palette** (Ctrl+Shift+P): fuzzy-search all available actions with keyboard navigation, icons, and shortcut hints
- **Theme System**: 5 built-in themes (Dark Default, Dark Ocean, Dark Forest, Dark Purple, Light) with localStorage persistence and xterm.js color integration
- **Pro Feature Gate Framework**: free tier limited to 4 panes, Pro unlocks 8 panes; lock icons and "Pro" badges on restricted layouts; license key activation via Upgrade Prompt dialog
- Toggle theme action wired into Command Palette

## [0.1.0] - 2026-03-30

### Added

- Workspace management: add, remove, and refresh project folders with session count badges
- Session browser: view historical Claude Code sessions with model tags, timestamps, summaries, message counts
- DNS health check: validate `claude.ai` IP before launch with top banner warning and launch blocking
- IP configuration: support exact IPs and CIDR ranges (e.g., `198.3.16.0/24`), comma-separated with OR logic
- Embedded terminal dashboard: separate window hosting all terminals via xterm.js + node-pty
- Split-screen layouts: switch between 1 / 2 / 4 / 6 / 8 grid panes
- Drag-and-drop terminal reordering in dashboard
- Session state sync: running sessions show green "Running" badge in launcher
- Optimistic state update: instant UI feedback on launch to prevent double-clicks
- Dependency checker: first-run detection of Claude CLI and Windows Terminal with install prompts
- Close protection: confirmation dialog when closing dashboard with running terminals
- Windows Terminal auto-detection with CMD fallback
- Terminal output batching (16ms flush interval) to reduce IPC overhead
- Atomic config writes (.tmp + rename) with automatic backup on corruption
- Dark theme UI matching Claude Code aesthetic
- Dual-window architecture: Launcher for browsing, Dashboard for terminals

### Security

- Content Security Policy (CSP) enabled
- Context Isolation enabled, nodeIntegration disabled
- Path traversal prevention (session ID alphanumeric validation)
- Command injection prevention (direct process spawning via node-pty, no shell passthrough)
- Folder whitelist validation (only configured folders can launch terminals)
- JSONL parsing limits (max file size 50MB, max 500 messages, max 200 metadata lines)
- Symlink rejection on folder add (uses lstat to detect and reject symbolic links)

</details>

---

<h2 id="中文">中文</h2>

<details open>
<summary><strong>点击展开 / 收起</strong></summary>

本文件记录所有版本的重要变更。格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

## [0.3.0] - 2026-03-30

### 新增

- **命令面板** (Ctrl+Shift+P)：模糊搜索所有可用操作，支持键盘导航、图标和快捷键提示
- **主题系统**：5 款内置主题（暗色默认、深海蓝、森林绿、暗紫、浅色），支持 localStorage 持久化和 xterm.js 配色同步
- **Pro 功能门控框架**：免费版限制 4 窗格，Pro 解锁 8 窗格；受限布局显示锁定图标和 "Pro" 徽章；支持许可证密钥激活的升级提示弹窗
- 主题切换已接入命令面板

## [0.1.0] - 2026-03-30

### 新增

- 工作目录管理：添加、删除、刷新项目文件夹，侧边栏实时显示会话数量
- 会话浏览器：查看历史 Claude Code 会话，显示模型、时间、摘要、消息数
- DNS 健康检查：启动前验证 `claude.ai` IP 地址，异常时顶部横幅警告并拦截启动
- IP 配置：支持精确 IP 和 CIDR 网段（如 `198.3.16.0/24`），逗号分隔多规则取或匹配
- 内嵌终端仪表盘：独立窗口，基于 xterm.js + node-pty 实现完整终端模拟
- 分屏布局：支持 1 / 2 / 4 / 6 / 8 宫格切换
- 终端拖拽排序：在仪表盘中拖拽调整终端面板位置
- 会话状态同步：运行中的会话在启动器中显示绿色标记
- 乐观状态更新：点击即时反馈，防止重复启动同一会话
- 依赖检测：首次运行检查 Claude CLI 和 Windows Terminal 是否已安装，提供安装引导
- 关闭确认：运行中终端的保护性确认弹窗，防止意外终止会话
- Windows Terminal 自动检测，未安装时回退到 CMD
- 终端输出批量刷新（16ms 间隔），减少 IPC 开销
- 配置原子写入（.tmp + rename），JSON 损坏时自动备份恢复
- 暗色主题 UI，匹配 Claude Code 风格
- 双窗口架构：Launcher 窗口管理目录与会话，Dashboard 窗口承载终端

### 安全

- 启用 Content Security Policy (CSP)
- 启用 Context Isolation，禁用 nodeIntegration
- 路径遍历防护（session ID 字母数字验证）
- 命令注入防护（通过 node-pty 直接进程启动，不经过 shell）
- 文件夹白名单验证（仅允许已配置的文件夹启动终端）
- JSONL 解析限制（文件最大 50MB，消息最多 500 条，元数据最多 200 行）
- 符号链接拒绝（添加文件夹时使用 lstat 检测并拒绝符号链接）

</details>
