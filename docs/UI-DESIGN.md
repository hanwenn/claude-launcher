# Claude Launcher 前端 UI 设计文档

> 技术栈：Tauri 2.x + Solid.js + TypeScript + CSS
> 目标平台：Windows 桌面应用
> 最后更新：2026-03-28

---

## 目录

1. [设计令牌（Design Tokens）](#1-设计令牌design-tokens)
2. [排版系统（Typography）](#2-排版系统typography)
3. [间距系统（Spacing）](#3-间距系统spacing)
4. [图标方案（Icons）](#4-图标方案icons)
5. [窗口配置（Window Config）](#5-窗口配置window-config)
6. [整体布局（Layout）](#6-整体布局layout)
7. [组件设计（Components）](#7-组件设计components)
   - 7.1 [App（根布局）](#71-app根布局)
   - 7.2 [HealthBanner](#72-healthbanner)
   - 7.3 [FolderList](#73-folderlist)
   - 7.4 [FolderItem](#74-folderitem)
   - 7.5 [SessionList](#75-sessionlist)
   - 7.6 [SessionCard](#76-sessioncard)
   - 7.7 [AddFolderDialog](#77-addfolderdialog)
   - 7.8 [LaunchButton](#78-launchbutton)
   - 7.9 [SettingsPanel](#79-settingspanel)
   - 7.10 [EmptyState](#710-emptystate)

---

## 1. 设计令牌（Design Tokens）

```css
:root {
  /* ── 背景色 ── */
  --bg-primary: #0d1117;        /* 主背景（最深） */
  --bg-secondary: #161b22;      /* 侧边栏、卡片背景 */
  --bg-tertiary: #1c2128;       /* 输入框、下拉等容器背景 */
  --bg-hover: #21262d;          /* 悬停态背景 */
  --bg-active: #292e36;         /* 激活态/按下态背景 */

  /* ── 边框 ── */
  --border-default: #30363d;    /* 默认边框 */
  --border-muted: #21262d;      /* 弱化边框 */
  --border-accent: #58a6ff;     /* 聚焦/高亮边框 */

  /* ── 强调色 ── */
  --accent-blue: #58a6ff;       /* 主强调色（选中、链接） */
  --accent-blue-muted: #1f6feb; /* 蓝色弱化版（按钮背景） */
  --accent-green: #3fb950;      /* 成功/健康状态 */
  --accent-green-muted: #238636;/* 绿色弱化版 */
  --accent-red: #f85149;        /* 错误/警告状态 */
  --accent-red-muted: #da3633;  /* 红色弱化版 */
  --accent-yellow: #d29922;     /* 警告/提醒 */
  --accent-purple: #bc8cff;     /* 模型标签色 */

  /* ── 文字 ── */
  --text-primary: #c9d1d9;      /* 主文字 */
  --text-secondary: #8b949e;    /* 次要文字 */
  --text-muted: #484f58;        /* 最弱文字（占位符） */
  --text-inverse: #0d1117;      /* 反色文字（用于亮色背景按钮） */
  --text-link: #58a6ff;         /* 链接文字 */

  /* ── 阴影 ── */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 3px 6px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
  --shadow-card-hover: 0 4px 12px rgba(88, 166, 255, 0.08);

  /* ── 圆角 ── */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-full: 9999px;

  /* ── 过渡 ── */
  --transition-fast: 120ms ease;
  --transition-normal: 200ms ease;
  --transition-slow: 300ms ease;

  /* ── Z-Index 层级 ── */
  --z-base: 0;
  --z-card: 10;
  --z-sidebar: 20;
  --z-banner: 30;
  --z-dialog: 100;
  --z-toast: 200;
}
```

---

## 2. 排版系统（Typography）

```css
:root {
  /* ── 字体族 ── */
  --font-sans: 'Segoe UI', 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;

  /* ── 字号阶梯 ── */
  --text-xs: 11px;     /* 辅助信息、徽章 */
  --text-sm: 12px;     /* 次要文本、标签 */
  --text-base: 13px;   /* 正文默认 */
  --text-md: 14px;     /* 卡片标题 */
  --text-lg: 16px;     /* 区域标题 */
  --text-xl: 18px;     /* 面板标题 */
  --text-2xl: 22px;    /* 页面标题（少用） */

  /* ── 行高 ── */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;

  /* ── 字重 ── */
  --weight-normal: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;
}
```

**使用规范：**

| 场景 | 字体 | 字号 | 字重 |
|------|------|------|------|
| 侧边栏标题 | sans | `--text-lg` | semibold |
| 文件夹名称 | sans | `--text-base` | medium |
| 会话卡片标题 | sans | `--text-md` | medium |
| 会话摘要 | sans | `--text-sm` | normal |
| 会话 ID / 路径 | mono | `--text-xs` | normal |
| 模型徽章 | mono | `--text-xs` | semibold |
| 按钮文字 | sans | `--text-sm` | semibold |
| Banner 消息 | sans | `--text-sm` | medium |
| 空状态标题 | sans | `--text-lg` | medium |
| 空状态描述 | sans | `--text-sm` | normal |

---

## 3. 间距系统（Spacing）

采用 4px 基础单位制：

```css
:root {
  --space-0: 0;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
}
```

**典型应用：**

| 场景 | 间距 |
|------|------|
| 组件内部 padding | `--space-3` ~ `--space-4` |
| 卡片之间间隙 | `--space-2` |
| 侧边栏内 padding | `--space-3` |
| 区域标题与内容间距 | `--space-4` |
| 对话框内 padding | `--space-6` |
| Banner 内 padding | `--space-2` × `--space-4` |

---

## 4. 图标方案（Icons）

使用 **Lucide Icons**（`lucide-solid` 适配 Solid.js）。

| 用途 | 图标名称 | 尺寸 |
|------|----------|------|
| 添加文件夹 | `FolderPlus` | 16px |
| 文件夹（默认） | `Folder` | 16px |
| 文件夹（展开/选中） | `FolderOpen` | 16px |
| 新建会话 | `Plus` | 16px |
| 启动 Claude | `Terminal` | 16px |
| 设置 | `Settings` | 16px |
| 健康状态（正常） | `CheckCircle2` | 14px |
| 健康状态（异常） | `AlertTriangle` | 14px |
| 消息数量 | `MessageSquare` | 12px |
| 日期 | `Calendar` | 12px |
| 关闭对话框 | `X` | 16px |
| 空状态 | `Inbox` | 48px |
| 删除 | `Trash2` | 14px |
| 搜索 | `Search` | 14px |
| 刷新 | `RefreshCw` | 14px |

---

## 5. 窗口配置（Window Config）

Tauri `tauri.conf.json` 关键配置：

```json
{
  "app": {
    "windows": [
      {
        "title": "Claude Launcher",
        "width": 1000,
        "height": 700,
        "minWidth": 800,
        "minHeight": 600,
        "resizable": true,
        "decorations": true,
        "center": true,
        "transparent": false
      }
    ]
  }
}
```

| 属性 | 值 | 说明 |
|------|----|------|
| 默认尺寸 | 1000 × 700 | 适合大多数 1080p 显示器 |
| 最小尺寸 | 800 × 600 | 保证三栏布局不崩溃 |
| 标题栏 | `decorations: true` | 使用 Windows 原生标题栏 |
| 居中显示 | `center: true` | 首次启动时居中 |
| 可调整大小 | `resizable: true` | 用户可自由拖拽窗口边缘 |

---

## 6. 整体布局（Layout）

```
┌──────────────────────────────────────────────────────┐
│  [Windows 原生标题栏]               Claude Launcher  │
├──────────────────────────────────────────────────────┤
│  HealthBanner（条件显示，高度 36px）                    │
├────────────┬─────────────────────────────────────────┤
│            │                                         │
│  FolderList│         SessionList                     │
│  (240px)   │                                         │
│            │   ┌─────────────────────────────────┐   │
│  ┌──────┐  │   │  SessionCard                    │   │
│  │Folder│  │   └─────────────────────────────────┘   │
│  │Item  │  │   ┌─────────────────────────────────┐   │
│  └──────┘  │   │  SessionCard                    │   │
│  ┌──────┐  │   └─────────────────────────────────┘   │
│  │Folder│  │   ┌─────────────────────────────────┐   │
│  │Item  │  │   │  SessionCard                    │   │
│  └──────┘  │   └─────────────────────────────────┘   │
│            │                                         │
│  ┌──────┐  │                                         │
│  │[+]Add│  │                                         │
│  └──────┘  │                                         │
│  ┌──────┐  │                                         │
│  │ ⚙︎设置│  │                                         │
│  └──────┘  │                                         │
├────────────┴─────────────────────────────────────────┤
```

**布局实现方式：**

```css
.app-layout {
  display: grid;
  grid-template-rows: auto 1fr;       /* banner + 内容区 */
  grid-template-columns: 240px 1fr;   /* 侧边栏 + 主内容 */
  height: 100vh;
  background: var(--bg-primary);
}

.health-banner {
  grid-column: 1 / -1;  /* 横跨全宽 */
}

.folder-list {
  grid-row: 2;
  grid-column: 1;
}

.session-list {
  grid-row: 2;
  grid-column: 2;
}
```

---

## 7. 组件设计（Components）

---

### 7.1 App（根布局）

**视觉描述：**
应用根容器，负责整体 Grid 布局。背景色 `--bg-primary`，无外边距，充满整个窗口。顶部是可选的 HealthBanner，下方左侧为 FolderList 侧边栏（固定宽度 240px），右侧为 SessionList 主内容区。

**状态：**

| 状态 | 描述 |
|------|------|
| 默认 | Banner 隐藏，显示侧边栏 + 主内容 |
| Banner 可见 | 顶部出现 36px 高度的状态条，内容区下移 |
| 加载中 | 全屏居中显示加载动画（应用初始化时短暂出现） |

**Props / 数据：**

```typescript
interface AppState {
  readonly healthStatus: HealthStatus;
  readonly folders: ReadonlyArray<Folder>;
  readonly activeFolderId: string | null;
  readonly sessions: ReadonlyArray<Session>;
  readonly isLoading: boolean;
}
```

**交互与动画：**
- 应用启动时，主内容区 `opacity: 0 → 1`，过渡 `--transition-slow`
- Banner 的出现/隐藏使用 `max-height` + `opacity` 过渡动画

---

### 7.2 HealthBanner

**视觉描述：**
横跨窗口顶部的窄条（高度 36px），用于展示 DNS 健康检查结果。左侧显示状态图标 + 文字，右侧显示"刷新"和"关闭"按钮。

- **健康态**：背景 `rgba(63, 185, 80, 0.1)`，左边框 3px `--accent-green`，图标 `CheckCircle2`（绿色），文字："DNS 连接正常"
- **异常态**：背景 `rgba(248, 81, 73, 0.1)`，左边框 3px `--accent-red`，图标 `AlertTriangle`（红色），文字："DNS 异常：IP 地址不匹配 (实际: x.x.x.x，期望: y.y.y.y)"
- **检查中**：背景 `rgba(88, 166, 255, 0.05)`，图标旋转动画，文字："正在检查 DNS 状态..."

**状态：**

| 状态 | 背景色 | 图标 | 文字颜色 |
|------|--------|------|----------|
| healthy | green 10% | CheckCircle2 (green) | `--text-primary` |
| warning | red 10% | AlertTriangle (red) | `--accent-red` |
| checking | blue 5% | RefreshCw (旋转) | `--text-secondary` |
| hidden | — | — | — |

**Props / 数据：**

```typescript
interface HealthBannerProps {
  readonly status: 'healthy' | 'warning' | 'checking' | 'hidden';
  readonly message: string;
  readonly details?: string;           // IP 不匹配的详细信息
  readonly onRefresh: () => void;
  readonly onDismiss: () => void;
}
```

**交互与动画：**
- 出现时：`max-height: 0 → 36px` + `opacity: 0 → 1`，过渡 `--transition-normal`
- 关闭时：反向动画
- 刷新按钮悬停时旋转 90 度
- 检查中状态图标持续旋转（`@keyframes spin`，1s 线性循环）

---

### 7.3 FolderList

**视觉描述：**
左侧固定宽度侧边栏（240px），背景 `--bg-secondary`，右边框 1px `--border-default`。内部结构从上到下：

1. **标题区**（高度 48px）：左侧 "工作目录" 标题（`--text-lg`），右侧 `FolderPlus` 图标按钮
2. **文件夹列表**：可滚动区域，内部排列 `FolderItem` 组件，间距 `--space-1`
3. **底部操作区**（高度 48px）：设置按钮（`Settings` 图标 + "设置"文字）

滚动条样式：宽 4px，圆角，颜色 `--border-default`，悬停时变亮。

**状态：**

| 状态 | 描述 |
|------|------|
| 默认 | 显示文件夹列表 |
| 空 | 列表区域显示 EmptyState（提示添加文件夹） |
| 加载中 | 骨架屏占位（3 个灰色矩形闪烁） |

**Props / 数据：**

```typescript
interface FolderListProps {
  readonly folders: ReadonlyArray<Folder>;
  readonly activeFolderId: string | null;
  readonly isLoading: boolean;
  readonly onFolderSelect: (folderId: string) => void;
  readonly onAddFolder: () => void;
  readonly onOpenSettings: () => void;
}

interface Folder {
  readonly id: string;
  readonly name: string;           // 显示名称（文件夹末段）
  readonly path: string;           // 完整路径
  readonly sessionCount: number;
}
```

**交互与动画：**
- 添加按钮悬停：背景 `--bg-hover`，过渡 `--transition-fast`
- 列表项切换时，内容区的会话列表做淡入过渡
- 滚动条在不滚动时透明，滚动时渐显

---

### 7.4 FolderItem

**视觉描述：**
单行列表项，高度 36px，水平 padding `--space-3`。内部从左到右：

1. `Folder` / `FolderOpen` 图标（16px，颜色 `--text-secondary`，选中时 `--accent-blue`）
2. 文件夹名称（`--text-base`，截断溢出用省略号）
3. 会话数徽章（圆角矩形，背景 `--bg-tertiary`，文字 `--text-secondary`，字号 `--text-xs`）

选中项：左侧 2px `--accent-blue` 边框指示器，背景 `--bg-hover`，文字 `--text-primary`，图标变为 `FolderOpen`。

**状态：**

| 状态 | 背景 | 文字色 | 左边框 |
|------|------|--------|--------|
| 默认 | transparent | `--text-secondary` | none |
| 悬停 | `--bg-hover` | `--text-primary` | none |
| 选中 | `--bg-hover` | `--text-primary` | 2px `--accent-blue` |
| 右键菜单打开 | `--bg-active` | `--text-primary` | none |

**Props / 数据：**

```typescript
interface FolderItemProps {
  readonly folder: Folder;
  readonly isActive: boolean;
  readonly onSelect: () => void;
  readonly onRemove: () => void;
}
```

**交互与动画：**
- 悬停时背景过渡 `--transition-fast`
- 选中时左侧蓝色边框从 `height: 0` 展开到 `height: 60%`，过渡 `--transition-normal`
- 右键菜单提供"移除文件夹"选项（仅从列表移除，不删除实际文件）
- 名称过长时悬停显示完整路径 tooltip

---

### 7.5 SessionList

**视觉描述：**
主内容区，背景 `--bg-primary`，内部 padding `--space-6`。

**头部区域**（高度 56px，flex 布局）：
- 左侧：当前文件夹路径（`--font-mono`，`--text-sm`，`--text-secondary`）
- 右侧：LaunchButton + "新建会话"按钮（小号，outline 风格）

**会话列表**（下方可滚动区域）：
- SessionCard 纵向排列，间距 `--space-2`
- 按日期降序排列（最近在上）

**状态：**

| 状态 | 描述 |
|------|------|
| 默认 | 展示当前文件夹下的会话卡片列表 |
| 空 | 显示 EmptyState（此文件夹没有会话） |
| 未选择文件夹 | 显示 EmptyState（请先选择一个工作目录） |
| 加载中 | 3 张骨架卡片，脉冲动画 |

**Props / 数据：**

```typescript
interface SessionListProps {
  readonly folderPath: string | null;
  readonly sessions: ReadonlyArray<Session>;
  readonly isLoading: boolean;
  readonly onLaunchNew: () => void;
  readonly onResumeSession: (sessionId: string) => void;
}
```

**交互与动画：**
- 切换文件夹时，列表做 `opacity` + 轻微 `translateY(4px → 0)` 的入场动画
- 滚动采用平滑滚动 `scroll-behavior: smooth`
- 加载态骨架屏使用 CSS `@keyframes pulse` 动画

---

### 7.6 SessionCard

**视觉描述：**
卡片式布局，背景 `--bg-secondary`，圆角 `--radius-lg`，边框 1px `--border-default`，内部 padding `--space-4`。

**卡片内部布局：**

```
┌─────────────────────────────────────────────────┐
│  [模型徽章]  [日期]                  [消息数]    │  ← 第一行（flex，两端对齐）
│                                                 │
│  会话摘要文本（最多 2 行，溢出省略）...           │  ← 第二行
│                                                 │
│  session-id: abc123def456                       │  ← 第三行（monospace，弱化色）
└─────────────────────────────────────────────────┘
```

**模型徽章**：圆角药片形，padding `2px 8px`，字号 `--text-xs`，`--font-mono`
- `opus`：背景 `rgba(188, 140, 255, 0.15)`，文字 `--accent-purple`
- `sonnet`：背景 `rgba(88, 166, 255, 0.15)`，文字 `--accent-blue`
- `haiku`：背景 `rgba(63, 185, 80, 0.15)`，文字 `--accent-green`

**日期**：`--text-sm`，`--text-secondary`，格式 "2026-03-28 14:30"

**消息数**：`MessageSquare` 图标（12px） + 数字，`--text-xs`，`--text-secondary`

**摘要文本**：`--text-sm`，`--text-primary`，最多两行，`-webkit-line-clamp: 2`

**会话 ID**：`--font-mono`，`--text-xs`，`--text-muted`

**状态：**

| 状态 | 边框 | 背景 | 阴影 |
|------|------|------|------|
| 默认 | `--border-default` | `--bg-secondary` | none |
| 悬停 | `--border-default` | `--bg-tertiary` | `--shadow-card-hover` |
| 按下 | `--accent-blue` 50% | `--bg-active` | none |
| 聚焦（键盘） | `--border-accent` | `--bg-secondary` | 0 0 0 2px rgba(88,166,255,0.3) |

**Props / 数据：**

```typescript
interface SessionCardProps {
  readonly session: Session;
  readonly onResume: () => void;
}

interface Session {
  readonly id: string;
  readonly model: 'opus' | 'sonnet' | 'haiku';
  readonly date: string;         // ISO 8601
  readonly summary: string;
  readonly messageCount: number;
}
```

**交互与动画：**
- 悬停时：背景色过渡 + 轻微 `translateY(-1px)` + `--shadow-card-hover`，过渡 `--transition-normal`
- 点击时：`scale(0.995)` 按压反馈，过渡 `--transition-fast`
- 点击后打开 Claude Code CLI 恢复该会话
- 初次渲染时卡片依次入场（每张延迟 50ms，`opacity` + `translateY`）

---

### 7.7 AddFolderDialog

**视觉描述：**
模态对话框，居中显示，宽度 480px。

**背景遮罩**：`rgba(0, 0, 0, 0.5)`，点击可关闭。

**对话框主体**：背景 `--bg-secondary`，圆角 `--radius-xl`，阴影 `--shadow-lg`，padding `--space-6`。

**内部布局：**

```
┌─────────────────────────────────────────┐
│  添加工作目录                     [×]   │  ← 标题行
│                                         │
│  ┌─────────────────────────────┐ [浏览] │  ← 路径输入
│  │ D:\Projects\my-project      │        │
│  └─────────────────────────────┘        │
│                                         │
│  显示名称（可选）                        │
│  ┌─────────────────────────────────┐    │
│  │ my-project                      │    │
│  └─────────────────────────────────┘    │
│                                         │
│                    [取消]  [添加]        │  ← 操作按钮
└─────────────────────────────────────────┘
```

**输入框**：背景 `--bg-tertiary`，边框 1px `--border-default`，圆角 `--radius-md`，高度 36px，聚焦时边框变为 `--border-accent`。

**"浏览"按钮**：调用 Tauri `dialog.open()` API 选择文件夹。

**"添加"按钮**：主色按钮（背景 `--accent-blue-muted`，文字白色）。

**"取消"按钮**：ghost 按钮（无背景，文字 `--text-secondary`）。

**状态：**

| 状态 | 描述 |
|------|------|
| 默认 | 空输入框，"添加"按钮禁用 |
| 已填写路径 | "添加"按钮启用 |
| 路径无效 | 输入框下方显示红色错误提示 |
| 提交中 | "添加"按钮显示 spinner，禁用所有输入 |

**Props / 数据：**

```typescript
interface AddFolderDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onConfirm: (path: string, displayName?: string) => void;
}
```

**交互与动画：**
- 打开时：遮罩 `opacity: 0 → 1`，对话框 `scale(0.96) → scale(1)` + `opacity: 0 → 1`，过渡 `--transition-normal`
- 关闭时：反向动画
- `Escape` 键关闭
- 输入框聚焦时边框颜色过渡 `--transition-fast`
- 错误消息使用 `slideDown` + `opacity` 出场

---

### 7.8 LaunchButton

**视觉描述：**
主操作按钮，位于 SessionList 头部右侧。较大尺寸（高度 36px，padding `--space-2` × `--space-4`），背景渐变 `linear-gradient(135deg, --accent-blue-muted, --accent-blue)`，圆角 `--radius-md`，文字白色 `--text-sm` semibold。

内部：`Terminal` 图标（16px）+ "启动 Claude" 文字。

**状态：**

| 状态 | 背景 | 效果 |
|------|------|------|
| 默认 | 蓝色渐变 | — |
| 悬停 | 渐变亮度 +10% | `box-shadow: 0 0 12px rgba(88,166,255,0.3)` |
| 按下 | 渐变亮度 -5% | `scale(0.97)` |
| 禁用 | 灰色 `--bg-hover` | `opacity: 0.5`，`cursor: not-allowed` |
| 加载中 | 蓝色渐变 | 内部文字替换为旋转 spinner |

**Props / 数据：**

```typescript
interface LaunchButtonProps {
  readonly folderPath: string | null;
  readonly isLaunching: boolean;
  readonly disabled: boolean;
  readonly onClick: () => void;
}
```

**交互与动画：**
- 悬停时光晕扩散效果，过渡 `--transition-normal`
- 点击时 `scale` 反馈 `--transition-fast`
- 加载时按钮内 spinner 旋转
- 未选择文件夹时禁用，tooltip 提示"请先选择工作目录"

---

### 7.9 SettingsPanel

**视觉描述：**
从侧边栏底部"设置"按钮触发，以侧滑面板形式出现（从左侧滑出，覆盖在 FolderList 上方），或作为模态对话框居中显示。推荐侧滑面板形式，宽度 320px。

背景 `--bg-secondary`，右边框 1px `--border-default`，阴影 `--shadow-lg`。

**内部结构：**

```
┌─────────────────────────────┐
│  设置                  [×]  │  ← 标题
├─────────────────────────────┤
│                             │
│  Claude CLI 路径             │
│  ┌───────────────────────┐  │
│  │ claude                │  │  ← 默认值，可编辑
│  └───────────────────────┘  │
│                             │
│  默认模型                    │
│  ┌───────────────────────┐  │
│  │ sonnet         ▾      │  │  ← 下拉选择
│  └───────────────────────┘  │
│                             │
│  DNS 检查间隔（秒）          │
│  ┌───────────────────────┐  │
│  │ 300                   │  │
│  └───────────────────────┘  │
│                             │
│  DNS 期望 IP                 │
│  ┌───────────────────────┐  │
│  │ 104.18.0.0/16         │  │
│  └───────────────────────┘  │
│                             │
│  主题                        │
│  ● 深色  ○ 浅色（预留）      │
│                             │
│              [保存设置]      │
└─────────────────────────────┘
```

**状态：**

| 状态 | 描述 |
|------|------|
| 关闭 | 面板不可见 |
| 打开 | 侧滑动画展开 |
| 已修改 | "保存设置"按钮高亮启用 |
| 保存中 | 按钮显示 spinner |
| 保存成功 | 按钮短暂变绿 + `CheckCircle2` 图标 |

**Props / 数据：**

```typescript
interface SettingsPanelProps {
  readonly isOpen: boolean;
  readonly settings: AppSettings;
  readonly onClose: () => void;
  readonly onSave: (settings: AppSettings) => void;
}

interface AppSettings {
  readonly cliPath: string;
  readonly defaultModel: 'opus' | 'sonnet' | 'haiku';
  readonly dnsCheckInterval: number;
  readonly dnsExpectedIp: string;
  readonly theme: 'dark' | 'light';
}
```

**交互与动画：**
- 打开：`translateX(-100%) → translateX(0)`，过渡 `--transition-normal`
- 关闭：反向动画
- 右侧内容区出现半透明遮罩（可选）
- 保存成功反馈：按钮文字 "保存设置" → "已保存 ✓"，1.5 秒后恢复
- `Escape` 键关闭

---

### 7.10 EmptyState

**视觉描述：**
居中布局，垂直排列：大图标（48px，`--text-muted`）+ 标题文字（`--text-lg`，`--text-secondary`）+ 描述文字（`--text-sm`，`--text-muted`）+ 可选操作按钮。

整体居中于所在容器。

**三种变体：**

| 变体 | 图标 | 标题 | 描述 | 操作按钮 |
|------|------|------|------|----------|
| 无文件夹 | `FolderPlus` | 还没有工作目录 | 添加一个文件夹来开始使用 Claude | "添加文件夹" |
| 无会话 | `Inbox` | 此目录没有会话 | 启动 Claude 开始你的第一次对话 | "启动 Claude" |
| 未选择 | `FolderOpen` | 选择一个工作目录 | 从左侧列表中选择文件夹以查看会话 | — |

**状态：**

| 状态 | 描述 |
|------|------|
| 默认 | 静态展示 |
| 按钮悬停 | 按钮高亮 |

**Props / 数据：**

```typescript
interface EmptyStateProps {
  readonly variant: 'no-folders' | 'no-sessions' | 'no-selection';
  readonly onAction?: () => void;
}
```

**交互与动画：**
- 入场动画：图标 `scale(0.8) → scale(1)` + `opacity`，文字稍后跟进（延迟 100ms）
- 图标有轻微的上下浮动呼吸动画（`translateY(0) → translateY(-4px)`，2s 缓入缓出循环）

---

## 附录 A：全局样式基础

```css
/* 全局重置 */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body, #root {
  height: 100%;
  overflow: hidden;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  -webkit-font-smoothing: antialiased;
}

/* 自定义滚动条（仅 Webkit） */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--border-default);
  border-radius: var(--radius-full);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}

/* 选中文字颜色 */
::selection {
  background: rgba(88, 166, 255, 0.3);
  color: var(--text-primary);
}
```

---

## 附录 B：动画关键帧定义

```css
/* 旋转（用于 spinner / 刷新图标） */
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* 脉冲（用于骨架屏） */
@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50%      { opacity: 0.8; }
}

/* 浮动呼吸（用于空状态图标） */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-4px); }
}

/* 卡片入场 */
@keyframes card-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 对话框入场 */
@keyframes dialog-enter {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 侧滑入场 */
@keyframes slide-in-left {
  from { transform: translateX(-100%); }
  to   { transform: translateX(0); }
}
```

---

## 附录 C：响应式适配策略

窗口最小尺寸为 800 x 600，不需要考虑移动端。但在不同窗口宽度下做微调：

| 窗口宽度 | 调整 |
|----------|------|
| >= 1200px | 侧边栏可扩展至 280px（可选） |
| 800 ~ 1200px | 侧边栏固定 240px，会话卡片撑满 |
| = 800px（最小） | 侧边栏 200px，卡片紧凑排列，padding 减小 |

```css
@media (max-width: 900px) {
  .app-layout {
    grid-template-columns: 200px 1fr;
  }
  .session-list {
    padding: var(--space-4);
  }
}
```

---

## 附录 D：键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + N` | 在当前文件夹启动新会话 |
| `Ctrl + ,` | 打开设置 |
| `Ctrl + Shift + A` | 添加文件夹 |
| `↑ / ↓` | 在文件夹列表/会话列表间导航 |
| `Enter` | 恢复选中的会话 |
| `Escape` | 关闭对话框/设置面板 |
