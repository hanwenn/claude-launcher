# Claude Launcher 产品战略与路线图

> 基于 Windows Terminal 源码/文档分析、终端竞品调研、AI CLI 生态全景调研的综合决策文档
> 编制日期：2026-03-30

---

## 一、竞争格局分析

### 1.1 直接竞品对标

| 维度 | Claude Launcher (当前) | Opcode (19K stars) | ccmanager | cmux (macOS) | Warp | Windows Terminal |
|------|----------------------|-------------------|-----------|-------------|------|-----------------|
| 平台 | Windows | 全平台 | 全平台(TUI) | macOS | Win/Mac/Linux | Windows |
| 技术栈 | Electron+Solid.js | Tauri+React+Rust | Go TUI | Swift+libghostty | Rust原生 | C++/WinRT/DX |
| 多Agent支持 | Claude Code | Claude Code | 8种CLI Agent | Claude+Codex | 多Agent协调 | 通用Shell |
| 嵌入终端 | xterm.js+node-pty | xterm.js | tmux | libghostty GPU | 自研渲染 | Atlas GPU |
| 分屏布局 | 1/2/4/6/8宫格 | 无 | tmux分屏 | 垂直标签 | 标签+分屏 | 标签+窗格 |
| 会话管理 | JSONL解析 | 检查点/版本 | worktree隔离 | 状态检测 | AI会话保存 | 布局持久化 |
| DNS安全检查 | IP/CIDR验证 | 无 | 无 | 无 | 无 | 无 |
| AI集成 | 无(纯启动器) | 自定义Agent | 多Agent切换 | Agent状态 | Warp AI | 无 |
| 开源 | 是 | 是 | 是 | 是 | 否 | 是 |
| 定价 | 免费 | 免费 | 免费 | 免费 | $0-50/月 | 免费 |

### 1.2 SWOT 分析

**Strengths（优势）**
- Windows 原生体验 — cmux/Conductor 都只支持 macOS，Windows AI开发者无专属工具
- DNS 安全检查 — 独有功能，对中国大陆用户有实际价值（VPN/代理检测）
- 双窗口架构 — 浏览与终端分离，各司其职
- 分屏仪表盘 — 最多8宫格，超过 Opcode（无分屏）和大多数TUI工具
- JSONL 会话解析 — 直接读取 Claude Code 存储，无需额外配置
- 低门槛 — Electron 安装即用，无需 tmux/Go/Rust 工具链

**Weaknesses（劣势）**
- 仅支持 Claude Code — ccmanager 支持8种Agent，Agent Deck 支持5种
- 无 AI 功能 — Warp/Copilot CLI 有AI命令建议、错误解释
- 终端渲染性能 — xterm.js 远不如 Atlas/libghostty GPU渲染
- 无跨平台 — macOS/Linux 用户无法使用
- 无插件系统 — 无法扩展功能
- 无会话检查点 — Opcode 有版本化检查点
- Electron 内存占用 — ~200MB vs Tauri ~30MB

**Opportunities（机会）**
- Windows AI开发者市场空白 — 无竞品提供 Windows 原生 AI Agent 管理器
- 多Agent统一管理 — 用户同时使用 Claude/Codex/Gemini，需要统一入口
- 企业市场 — SSO/审计/成本控制是付费点（Warp Business $50/月验证了需求）
- 中国市场 — DNS检查+VPN提醒是独特卖点，国内开发者急需
- 跨agent记忆 — 无产品实现持久化知识图谱
- 移动端 — Android 无原生 AI Agent 管理应用

**Threats（威胁）**
- Anthropic 官方 Claude Desktop 持续增强（已支持多worktree并行）
- Warp 2.0 进入 Windows 市场，AI+终端一体化
- cmux 可能扩展到 Windows
- Cursor/Windsurf IDE 内置终端Agent管理越来越强

---

## 二、产品定位

### 核心定位
> **Claude Launcher = AI Agent 的 "Mission Control"**
> 不是通用终端，而是专为 AI 编码代理设计的会话管理与协作平台

### 差异化策略：取其精华，去其糟粕

**从 Windows Terminal 取的精华：**
- Shell Integration（命令标记、跳转、输出选择）
- 主题/配色系统（JSON可配置）
- 键盘快捷键体系
- 布局持久化/恢复
- Command Palette（模糊搜索命令）

**不做的糟粕（WT 的弱项或我们不需要的）：**
- GPU 渲染引擎（C++/DirectX 太重，xterm.js 够用）
- 通用 Shell 配置文件管理（我们只关注 AI Agent）
- ConPTY 底层开发（用 node-pty 封装即可）
- MSIX 打包（用 Electron Builder 更灵活）
- 片段扩展系统（用 JS 插件系统更强大）

**超越 Windows Terminal 的维度：**

| 维度 | Windows Terminal | Claude Launcher 目标 |
|------|-----------------|-------------------|
| AI 集成 | 无 | 原生 AI 命令建议、错误解释、会话总结 |
| 多Agent | 无概念 | 统一管理 Claude/Codex/Gemini/Copilot |
| 会话智能 | 布局持久化 | 内容持久化 + 跨会话记忆 + 知识图谱 |
| 成本管理 | 无 | Token/API 用量追踪、预算控制 |
| 团队协作 | 无 | 共享会话、实时观察、权限控制 |
| 安全检查 | 无 | DNS/VPN 验证、API Key 安全管理 |
| 智能路由 | 无 | 根据任务自动选择最优 Agent/Model |
| 插件系统 | JSON片段 | JS/TS 插件 + MCP Server 集成 |

---

## 三、产品路线图

### Phase 1：基础夯实（v0.2 - v0.5）| 2-3个月
> 目标：成为 Windows 上最好用的 Claude Code 管理器

| 版本 | 功能 | 层级 |
|------|------|------|
| v0.2 | Shell Integration（命令标记、跳转提示符、输出选择） | 基础 |
| v0.2 | 终端搜索（Ctrl+F 全文搜索 scrollback） | 基础 |
| v0.2 | 键盘快捷键系统（可自定义 JSON 配置） | 基础 |
| v0.3 | 主题/配色系统（内置10+暗色主题，自定义配色方案） | 基础 |
| v0.3 | 字体配置（Cascadia Code/JetBrains Mono/Fira Code） | 基础 |
| v0.3 | Command Palette（Ctrl+Shift+P 模糊搜索所有命令） | 基础 |
| v0.4 | 会话内容持久化（关闭后可恢复 scrollback 内容） | 核心 |
| v0.4 | 布局持久化（记住上次的窗口位置、分屏布局、打开的终端） | 核心 |
| v0.4 | 终端广播输入（向所有窗格同时发送命令） | 基础 |
| v0.5 | 会话总结（AI 自动生成每个会话的摘要） | 核心 |
| v0.5 | 终端窗格最大化/恢复优化、拖拽改进 | 基础 |
| v0.5 | 全局热键唤起（类似 WT Quake Mode） | 基础 |

### Phase 2：多Agent 统一管理（v0.6 - v0.8）| 2-3个月
> 目标：从 Claude Code 专属扩展为 AI Agent 统一入口

| 版本 | 功能 | 层级 |
|------|------|------|
| v0.6 | Agent 注册系统（插件化支持 Codex CLI、Gemini CLI、Copilot CLI） | 核心 |
| v0.6 | 每种 Agent 独立配置（命令路径、默认参数、环境变量） | 核心 |
| v0.6 | Agent 状态检测（运行中/空闲/错误/限流） | 核心 |
| v0.7 | 智能路由（根据任务描述推荐最优 Agent+Model） | 精品 |
| v0.7 | 跨Agent切换（同一会话中切换不同 AI 后端） | 精品 |
| v0.7 | Token/API 用量仪表盘（按Agent、按项目、按时间统计） | 核心 |
| v0.8 | 成本预算控制（按项目/按天设定限额，触发告警或暂停） | 精品 |
| v0.8 | Git Worktree 自动管理（每个Agent会话自动隔离分支） | 核心 |
| v0.8 | Diff Review 集成（会话结束后在应用内查看代码变更） | 核心 |

### Phase 3：AI 增强与知识管理（v0.9 - v1.2）| 3-4个月
> 目标：超越终端，成为 AI 编码的智能中枢

| 版本 | 功能 | 层级 |
|------|------|------|
| v0.9 | 跨会话记忆系统（持久化知识图谱，新会话自动加载上下文） | 精品 |
| v0.9 | 会话模板（预设常用任务流程，一键启动） | 核心 |
| v1.0 | 插件系统（JS/TS 插件 API，社区插件市场） | 核心 |
| v1.0 | MCP Server 管理（在应用内配置和管理 MCP 工具） | 核心 |
| v1.0 | AI 命令建议（基于上下文的命令自动完成和解释） | 精品 |
| v1.1 | 自然语言命令（输入中文/英文描述，转换为终端命令） | 精品 |
| v1.1 | 错误智能诊断（命令失败时自动分析原因并建议修复） | 精品 |
| v1.2 | 任务编排（串联多个Agent任务，DAG式工作流） | 扩展 |
| v1.2 | CI/CD 集成（Agent 会话由 GitHub Actions/GitLab CI 触发） | 扩展 |

### Phase 4：团队协作与商业化（v1.3 - v2.0）| 4-6个月
> 目标：企业级产品，实现收入

| 版本 | 功能 | 层级 |
|------|------|------|
| v1.3 | 团队空间（共享项目配置、Agent配置、会话模板） | 扩展 |
| v1.3 | 实时会话共享（团队成员观察/接管正在运行的Agent会话） | 扩展 |
| v1.4 | SSO 集成（企业 LDAP/SAML/OAuth） | 扩展 |
| v1.4 | 审计日志（谁在什么时间用了哪个Agent做了什么） | 扩展 |
| v1.5 | 跨平台（macOS 支持） | 核心 |
| v1.6 | 跨平台（Linux 支持） | 核心 |
| v1.7 | 移动端伴侣应用（iOS/Android，远程监控和控制Agent） | 扩展 |
| v2.0 | 云端 Agent（无需本地CLI，云端运行Agent会话） | 扩展 |

---

## 四、商业模式：免费+订阅

### 层级划分原则
- **基础功能**：终端操作的基本需求，建立用户量 → 免费
- **核心功能**：AI Agent 管理的核心价值，形成用户粘性 → 免费
- **精品功能**：AI 增强和智能化，体现差异化价值 → 订阅制
- **扩展功能**：团队/企业需求，高价值高付费意愿 → 订阅制

### 定价方案

| 层级 | 价格 | 包含功能 |
|------|------|----------|
| **Free** | $0 | 基础终端、分屏布局、会话浏览、DNS检查、主题配色、快捷键、Command Palette、3个Agent配置、单设备 |
| **Pro** | $9.9/月 或 $99/年 | Free 全部 + 跨会话记忆、智能路由、成本仪表盘、预算控制、会话总结、AI命令建议、无限Agent、插件系统、优先支持 |
| **Team** | $19.9/人/月 | Pro 全部 + 团队空间、会话共享、SSO、审计日志、集中配置管理、5人起 |
| **Enterprise** | 联系销售 | Team 全部 + 私有化部署、自定义SLA、专属客户成功经理、合规认证 |

### 收入预估（基于 Warp 和竞品参考）

| 时间 | 用户量(MAU) | 付费转化率 | ARR |
|------|------------|-----------|-----|
| 6个月 | 5,000 | 0% (纯免费) | $0 |
| 12个月 | 25,000 | 3% | $89K |
| 18个月 | 80,000 | 5% | $475K |
| 24个月 | 200,000 | 7% | $1.66M |

---

## 五、关键成功指标

### 产品指标
- DAU/MAU 比率 > 40%（高粘性）
- 平均每用户打开终端数 > 3（分屏功能使用率）
- 会话恢复率 > 60%（用户持续使用同一会话）
- Agent 种类 > 3（用户配置多种Agent）

### 增长指标
- GitHub Stars 6个月达 5,000（Opcode 用6个月达到 19K）
- 月下载量 12个月达 10,000
- 社区贡献者 > 20

### 商业指标
- Free → Pro 转化率 > 5%
- 月流失率 < 5%
- NPS > 50

---

## 六、技术架构演进

### 当前架构（v0.1）
```
Electron 35 + Solid.js + xterm.js + node-pty
单Agent（Claude Code）| 双窗口 | 本地存储
```

### 目标架构（v1.0+）
```
                    ┌─────────────────────┐
                    │   Plugin Marketplace │
                    └──────────┬──────────┘
                               │
┌──────────┐    ┌──────────────┴──────────────┐    ┌──────────┐
│ Mobile   │    │     Claude Launcher Core     │    │  Cloud   │
│ Companion├────┤                              ├────┤  Sync    │
│ (RN)     │    │  Agent Registry (Plugin API) │    │  Service │
└──────────┘    │  ┌────┐ ┌────┐ ┌────┐ ┌───┐ │    └──────────┘
                │  │CLD │ │CDX │ │GEM │ │...│ │
                │  └────┘ └────┘ └────┘ └───┘ │
                │                              │
                │  Knowledge Graph (SQLite)     │
                │  Cost Engine                  │
                │  MCP Router                   │
                │                              │
                │  ┌─────────────────────────┐ │
                │  │  Terminal Layer          │ │
                │  │  xterm.js + node-pty     │ │
                │  │  (or WebGPU renderer)    │ │
                │  └─────────────────────────┘ │
                └──────────────────────────────┘
```

### 技术债务优先清理
1. Electron → 考虑 v1.5 迁移到 Tauri 2（减少75%内存）
2. xterm.js → 考虑集成 WebGPU 渲染（对标 cmux/Rio 性能）
3. node-pty ConPTY 错误 → 升级 node-pty 或用 windows-process-tree 替代

---

## 七、执行优先级

### 立即开始（本周）
1. 修复 node-pty AttachConsole 错误
2. 完善终端渲染稳定性（游标、resize）
3. 准备 v0.2 开发：Shell Integration + 搜索

### 近期（1个月内）
1. v0.2 发布：Shell Integration + 搜索 + 快捷键
2. v0.3 开发：主题系统 + Command Palette
3. 社区建设：GitHub Discussions、Discord

### 中期（3个月内）
1. v0.5 发布：布局持久化 + 会话总结 + Quake Mode
2. v0.6 开发：多Agent支持
3. 开始 Pro 版功能开发

---

*本文档将随产品迭代持续更新。*
