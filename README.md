# Claude Launcher

Windows 桌面端 Claude Code 会话管理与终端仪表盘。

<!-- screenshot -->

---

## 核心功能

- **工作目录管理** -- 添加、删除、刷新项目文件夹，侧边栏显示每个文件夹的会话数量
- **会话浏览** -- 查看历史 Claude Code 会话列表，显示模型标签、时间、消息摘要、消息数
- **DNS 健康检查** -- 启动前验证 `claude.ai` 的 IP 地址是否正常，支持精确 IP 和 CIDR 网段配置，多规则取或；VPN 异常时在界面顶部弹出警告并拦截启动
- **内嵌终端仪表盘** -- 独立窗口承载所有终端，基于 xterm.js + node-pty 实现完整终端模拟
- **分屏布局** -- 支持 1 / 2 / 4 / 6 / 8 宫格切换，灵活管理多个并发 Claude Code 会话
- **终端拖拽排序** -- 在仪表盘中拖拽调整终端面板位置
- **会话运行状态同步** -- 正在运行的会话在启动器中显示绿色标记，乐观状态更新防止重复启动
- **依赖检测** -- 首次运行时自动检查 Claude CLI 和 Windows Terminal 是否已安装
- **关闭确认** -- 当仍有终端运行时，关闭仪表盘窗口前弹出保护性确认

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面框架 | Electron 35 |
| 前端框架 | Solid.js 1.9 |
| 语言 | TypeScript 5.6 |
| 终端模拟 | xterm.js 5 + node-pty 1.1 |
| 构建工具 | Vite 6 |
| 测试框架 | Vitest 2 |
| 打包工具 | electron-builder 26 |

---

## 系统要求

- Windows 10 (1803+) / Windows 11
- Node.js 18+
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) 已安装并加入系统 PATH
- (可选) Windows Terminal -- 如未安装，将回退到 CMD

---

## 快速开始

```bash
git clone https://github.com/hanwenn/claude-launcher.git
cd claude-launcher
npm install
```

### 开发模式

```bash
npm run electron:dev    # Vite 热重载 + Electron，自动等待 Vite 就绪
```

也可以分开运行：

```bash
npm run dev             # 仅启动 Vite 开发服务器 (http://localhost:1420)
npx electron .          # 在另一个终端启动 Electron
```

### 构建生产版本

```bash
npm run build              # 仅构建前端 (Vite)
npm run electron:build     # 构建前端 + 打包 Electron 安装包
```

### 运行测试

```bash
npm test                # 单次运行
npm run test:watch      # 监听模式
```

---

## 项目结构

```
claude-launcher/
  electron/
    main.js                  # Electron 主进程入口，双窗口管理
    preload.js               # Context Bridge，暴露 electronAPI
    handlers/
      folders.js             # 文件夹增删查 IPC
      sessions.js            # 会话列表与详情 IPC
      network.js             # DNS 健康检查 IPC
      launcher.js            # 启动 Claude CLI IPC
      terminal.js            # 终端生命周期 IPC
      dependencies.js        # 依赖检测 IPC
    services/
      configService.js       # 配置文件读写（原子写入）
      sessionParser.js       # JSONL 会话解析
      dnsChecker.js          # DNS 解析与 IP/CIDR 匹配
      terminalManager.js     # node-pty 终端池管理
      claudeCli.js           # Claude CLI 进程启动
      dependencyChecker.js   # 依赖项检测
  src/
    main.tsx                 # 启动器页面入口
    App.tsx                  # 启动器根组件
    dashboard-main.tsx       # 仪表盘页面入口
    DashboardApp.tsx         # 仪表盘根组件
    components/
      FolderList.tsx         # 文件夹侧边栏
      SessionList.tsx        # 会话列表
      SessionCard.tsx        # 会话卡片
      HealthBanner.tsx       # DNS 健康状态横幅
      DashboardView.tsx      # 终端网格视图
      TerminalPane.tsx       # 单个终端面板 (xterm.js)
      LayoutSelector.tsx     # 分屏布局选择器
      LaunchButton.tsx       # 启动按钮（含状态保护）
      DependencyCheck.tsx    # 首次运行依赖检查
      AddFolderDialog.tsx    # 添加文件夹弹窗
      ...
    stores/
      folderStore.ts         # 文件夹状态
      sessionStore.ts        # 会话状态
      healthStore.ts         # 健康检查状态
      terminalStore.ts       # 终端状态
      viewStore.ts           # 视图/布局状态
    styles/                  # CSS 样式
    types/                   # TypeScript 类型定义
    lib/                     # 工具函数
  docs/
    PRD.md                   # 产品需求文档
  index.html                 # 启动器 HTML 入口
  dashboard.html             # 仪表盘 HTML 入口
  vite.config.ts             # Vite 配置（多入口）
  vitest.config.ts           # Vitest 配置
  tsconfig.json              # TypeScript 配置
  package.json
```

---

## 配置说明

应用配置存储在 `%APPDATA%\ClaudeLauncher\config.json`，首次运行时自动创建。

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `folders` | `string[]` | `[]` | 已添加的项目文件夹绝对路径列表 |
| `expected_ip` | `string` | `"198.3.16.159"` | DNS 健康检查期望的 IP 地址；支持逗号分隔的多条规则，每条可以是精确 IP（如 `198.3.16.159`）或 CIDR 网段（如 `198.3.16.0/24`），多规则之间取或匹配 |
| `claude_cli_command` | `string` | `"claude"` | Claude CLI 可执行文件名或完整路径 |
| `health_check_interval_secs` | `number` | `300` | DNS 健康检查轮询间隔（秒） |

配置文件采用原子写入（先写 `.tmp` 再 rename），JSON 损坏时自动备份为 `.bak` 并恢复默认值。

---

## 架构说明

Claude Launcher 采用 **双窗口架构**：

1. **Launcher 窗口**（主窗口）-- 管理工作目录和浏览会话。用户在此选择文件夹、查看历史会话、配置 DNS 规则、启动 Claude Code。
2. **Dashboard 窗口**（仪表盘窗口）-- 终端容器。当用户启动第一个终端时自动打开，所有 node-pty 终端在此窗口内以分屏网格形式展示。

两个窗口共享同一个 Electron 主进程，通过 IPC 通信。终端的数据流路径为：

```
node-pty (主进程) --> IPC batched output (16ms) --> xterm.js (Dashboard 渲染进程)
```

所有渲染进程均启用 `contextIsolation`，通过 preload 脚本暴露有限的 `electronAPI` 接口。

---

## 开发指南

### 前端开发

Vite 开发服务器运行在 `http://localhost:1420`，支持热模块替换。前端使用 Solid.js 响应式框架，状态管理采用 Solid.js 内置的 Signal/Store。

多入口构建：`index.html`（启动器）和 `dashboard.html`（仪表盘）在 `vite.config.ts` 中配置为 Rollup 多入口。

### 添加新的 IPC Handler

1. 在 `electron/handlers/` 下新建处理器文件
2. 在 `electron/main.js` 中 import 并注册
3. 在 `electron/preload.js` 中暴露对应的 API 方法
4. 在 `src/types/` 中添加 TypeScript 类型声明

### 测试

单元测试使用 Vitest + @solidjs/testing-library，配置文件为 `vitest.config.ts`。

---

## 许可证

MIT

---

## 贡献

欢迎提交 Pull Request 和 Issue。

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/your-feature`)
3. 提交更改 (`git commit -m 'feat: add some feature'`)
4. 推送分支 (`git push origin feature/your-feature`)
5. 创建 Pull Request
