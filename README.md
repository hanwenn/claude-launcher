# Claude Launcher

<p align="center">
  <strong>Windows desktop app for Claude Code session management & terminal dashboard</strong><br/>
  <strong>Windows 桌面端 Claude Code 会话管理与终端仪表盘</strong>
</p>

<p align="center">
  <a href="#english">English</a> | <a href="#中文">中文</a>
</p>

<!-- screenshot -->

---

<h2 id="english">English</h2>

<details open>
<summary><strong>Click to expand / collapse</strong></summary>

### Features

- **Workspace Management** -- Add, remove, and refresh project folders with session count badges
- **Session Browser** -- Browse historical Claude Code sessions with model tags, timestamps, summaries, and message counts
- **DNS Health Check** -- Validate `claude.ai` IP before launch; supports exact IP and CIDR ranges with OR logic; VPN warning with launch blocking
- **Embedded Terminal Dashboard** -- Separate window hosting all terminals via xterm.js + node-pty
- **Split-Screen Layouts** -- Switch between 1 / 2 / 4 / 6 / 8 grid panes
- **Drag-and-Drop Reorder** -- Rearrange terminal panes by dragging
- **Session State Sync** -- Running sessions show a green "Running" badge in the launcher; optimistic updates prevent duplicate launches
- **Dependency Check** -- First-run detection of Claude CLI and Windows Terminal
- **Close Protection** -- Confirmation dialog when closing dashboard with running terminals

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Framework | Electron 35 |
| Frontend Framework | Solid.js 1.9 |
| Language | TypeScript 5.6 |
| Terminal Emulation | xterm.js 5 + node-pty 1.1 |
| Build Tool | Vite 6 |
| Test Framework | Vitest 2 |

### Requirements

- Windows 10 (1803+) / Windows 11
- Node.js 18+
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and in PATH
- (Optional) Windows Terminal -- falls back to CMD if not installed

### Quick Start

```bash
git clone https://github.com/hanwenn/claude-launcher.git
cd claude-launcher
npm install
```

**Development:**
```bash
npm run electron:dev     # Vite hot-reload + Electron
# or separately:
npm run dev              # Vite dev server (http://localhost:1420)
npx electron .           # Electron in another terminal
```

**Production Build:**
```bash
npm run build            # Build frontend only
npm run electron:build   # Build + package installer
```

**Tests:**
```bash
npm test                 # Single run
npm run test:watch       # Watch mode
```

### Project Structure

```
claude-launcher/
  electron/                  # Main process (Node.js)
    main.js                  # Entry point, dual-window management
    preload.js               # Context bridge (electronAPI)
    handlers/                # IPC handlers (6 modules)
    services/                # Business logic (6 modules)
  src/                       # Renderer (Solid.js + TypeScript)
    App.tsx                  # Launcher root component
    DashboardApp.tsx         # Dashboard root component
    components/              # UI components (15+)
    stores/                  # Reactive state management (5 stores)
    styles/                  # CSS with design tokens
    types/                   # TypeScript type definitions
    lib/                     # Utilities and API wrappers
  docs/                      # Design documents
  index.html                 # Launcher entry
  dashboard.html             # Dashboard entry
```

### Configuration

Config file: `%APPDATA%\ClaudeLauncher\config.json` (auto-created on first run)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `folders` | `string[]` | `[]` | Project folder paths |
| `expected_ip` | `string` | `"198.3.16.159"` | Expected IP(s) for DNS check; comma-separated, supports exact IP and CIDR (e.g., `198.3.16.159,198.3.16.0/24`) |
| `claude_cli_command` | `string` | `"claude"` | CLI executable name or path |
| `health_check_interval_secs` | `number` | `300` | DNS check polling interval (seconds) |

### Architecture

Claude Launcher uses a **dual-window architecture**:

1. **Launcher Window** (main) -- Manages workspaces and browses sessions
2. **Dashboard Window** (separate) -- Hosts all embedded terminals in a split-screen grid

Both windows share one Electron main process, communicating via IPC. Terminal data flows:

```
node-pty (main) --> IPC batched output (16ms) --> xterm.js (Dashboard renderer)
```

All renderers use `contextIsolation` with a limited `electronAPI` exposed via preload.

### License

MIT

### Contributing

PRs and Issues welcome.

1. Fork this repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit changes (`git commit -m 'feat: add some feature'`)
4. Push (`git push origin feature/your-feature`)
5. Open a Pull Request

</details>

---

<h2 id="中文">中文</h2>

<details open>
<summary><strong>点击展开 / 收起</strong></summary>

### 核心功能

- **工作目录管理** -- 添加、删除、刷新项目文件夹，侧边栏显示每个文件夹的会话数量
- **会话浏览** -- 查看历史 Claude Code 会话列表，显示模型标签、时间、消息摘要、消息数
- **DNS 健康检查** -- 启动前验证 `claude.ai` 的 IP 地址是否正常，支持精确 IP 和 CIDR 网段配置，多规则取或；VPN 异常时在界面顶部弹出警告并拦截启动
- **内嵌终端仪表盘** -- 独立窗口承载所有终端，基于 xterm.js + node-pty 实现完整终端模拟
- **分屏布局** -- 支持 1 / 2 / 4 / 6 / 8 宫格切换，灵活管理多个并发 Claude Code 会话
- **终端拖拽排序** -- 在仪表盘中拖拽调整终端面板位置
- **会话运行状态同步** -- 正在运行的会话在启动器中显示绿色标记，乐观状态更新防止重复启动
- **依赖检测** -- 首次运行时自动检查 Claude CLI 和 Windows Terminal 是否已安装
- **关闭确认** -- 当仍有终端运行时，关闭仪表盘窗口前弹出保护性确认

### 技术栈

| 层级 | 技术 |
|------|------|
| 桌面框架 | Electron 35 |
| 前端框架 | Solid.js 1.9 |
| 语言 | TypeScript 5.6 |
| 终端模拟 | xterm.js 5 + node-pty 1.1 |
| 构建工具 | Vite 6 |
| 测试框架 | Vitest 2 |

### 系统要求

- Windows 10 (1803+) / Windows 11
- Node.js 18+
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) 已安装并加入系统 PATH
- (可选) Windows Terminal -- 如未安装，将回退到 CMD

### 快速开始

```bash
git clone https://github.com/hanwenn/claude-launcher.git
cd claude-launcher
npm install
```

**开发模式：**
```bash
npm run electron:dev    # Vite 热重载 + Electron，自动等待 Vite 就绪
# 也可以分开运行：
npm run dev             # 仅启动 Vite 开发服务器 (http://localhost:1420)
npx electron .          # 在另一个终端启动 Electron
```

**构建生产版本：**
```bash
npm run build              # 仅构建前端 (Vite)
npm run electron:build     # 构建前端 + 打包 Electron 安装包
```

**运行测试：**
```bash
npm test                # 单次运行
npm run test:watch      # 监听模式
```

### 项目结构

```
claude-launcher/
  electron/                  # 主进程 (Node.js)
    main.js                  # 入口，双窗口管理
    preload.js               # Context Bridge (electronAPI)
    handlers/                # IPC 处理器 (6 个模块)
    services/                # 业务逻辑 (6 个模块)
  src/                       # 渲染进程 (Solid.js + TypeScript)
    App.tsx                  # 启动器根组件
    DashboardApp.tsx         # 仪表盘根组件
    components/              # UI 组件 (15+)
    stores/                  # 响应式状态管理 (5 个 Store)
    styles/                  # CSS 样式与设计令牌
    types/                   # TypeScript 类型定义
    lib/                     # 工具函数与 API 封装
  docs/                      # 设计文档
  index.html                 # 启动器 HTML 入口
  dashboard.html             # 仪表盘 HTML 入口
```

### 配置说明

配置文件位于 `%APPDATA%\ClaudeLauncher\config.json`，首次运行时自动创建。

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `folders` | `string[]` | `[]` | 已添加的项目文件夹绝对路径列表 |
| `expected_ip` | `string` | `"198.3.16.159"` | DNS 健康检查期望的 IP 地址；支持逗号分隔的多条规则，每条可以是精确 IP 或 CIDR 网段（如 `198.3.16.159,198.3.16.0/24`），多规则之间取或匹配 |
| `claude_cli_command` | `string` | `"claude"` | Claude CLI 可执行文件名或完整路径 |
| `health_check_interval_secs` | `number` | `300` | DNS 健康检查轮询间隔（秒） |

配置文件采用原子写入（先写 `.tmp` 再 rename），JSON 损坏时自动备份为 `.bak` 并恢复默认值。

### 架构说明

Claude Launcher 采用 **双窗口架构**：

1. **Launcher 窗口**（主窗口）-- 管理工作目录和浏览会话
2. **Dashboard 窗口**（仪表盘窗口）-- 终端容器，当用户启动第一个终端时自动打开

两个窗口共享同一个 Electron 主进程，通过 IPC 通信。终端数据流路径：

```
node-pty (主进程) --> IPC 批量输出 (16ms) --> xterm.js (Dashboard 渲染进程)
```

所有渲染进程均启用 `contextIsolation`，通过 preload 脚本暴露有限的 `electronAPI` 接口。

### 许可证

MIT

### 贡献

欢迎提交 Pull Request 和 Issue。

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/your-feature`)
3. 提交更改 (`git commit -m 'feat: add some feature'`)
4. 推送分支 (`git push origin feature/your-feature`)
5. 创建 Pull Request

</details>
