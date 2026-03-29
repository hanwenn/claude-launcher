# Claude Launcher 测试计划

> 版本: 1.0
> 日期: 2026-03-28
> 覆盖率目标: 80%+
> 技术栈: Tauri 2.x (Rust 后端 + Solid.js 前端)

---

## 目录

- [1. Rust 单元测试](#1-rust-单元测试)
  - [1.1 config_service](#11-config_service)
  - [1.2 session_parser](#12-session_parser)
  - [1.3 dns_checker](#13-dns_checker)
  - [1.4 claude_cli](#14-claude_cli)
- [2. 前端组件测试](#2-前端组件测试)
  - [2.1 FolderList](#21-folderlist)
  - [2.2 SessionList](#22-sessionlist)
  - [2.3 SessionCard](#23-sessioncard)
  - [2.4 HealthBanner](#24-healthbanner)
  - [2.5 AddFolderDialog](#25-addfolderdialog)
  - [2.6 LaunchButton](#26-launchbutton)
- [3. 集成测试](#3-集成测试)
- [4. E2E 测试 (Playwright)](#4-e2e-测试-playwright)
- [5. 优先级说明](#5-优先级说明)

---

## 1. Rust 单元测试

> 测试框架: `#[cfg(test)]` + `cargo test`
> 文件位置: `src-tauri/src/` 各服务模块内联

### 1.1 config_service

| 测试 ID | 测试名称 | 前置条件 | 测试步骤 | 预期结果 | 优先级 |
|---------|---------|---------|---------|---------|--------|
| UT-CS-001 | 从有效 JSON 文件加载配置 | 临时目录下存在格式正确的 `config.json` | 1. 写入有效 JSON 到临时文件<br>2. 调用 `load_config(path)` | 返回 `Ok(Config)`, 各字段值与 JSON 内容一致 | P0 |
| UT-CS-002 | 配置文件不存在时使用默认值 | 临时目录下无 `config.json` | 1. 指定不存在的路径<br>2. 调用 `load_config(path)` | 返回 `Ok(Config)`, 使用默认配置(空文件夹列表、默认窗口尺寸等) | P0 |
| UT-CS-003 | 保存配置后重新读取一致 | 无 | 1. 构造 `Config` 对象<br>2. 调用 `save_config(path, config)`<br>3. 调用 `load_config(path)` | 保存与读取的 Config 完全相等(`assert_eq!`) | P0 |
| UT-CS-004 | 损坏的 JSON 文件优雅处理 | 临时文件中写入 `{invalid json` | 1. 写入损坏内容到临时文件<br>2. 调用 `load_config(path)` | 返回 `Ok(Config)` 使用默认值, 或返回明确的 `Err` 并包含可读错误信息; 不 panic | P0 |
| UT-CS-005 | 配置文件为空文件 | 临时目录下存在 0 字节的 `config.json` | 1. 创建空文件<br>2. 调用 `load_config(path)` | 返回默认配置, 不 panic | P1 |
| UT-CS-006 | 配置包含未知字段时兼容 | JSON 中包含未定义字段 `"unknown_key": 123` | 1. 写入含额外字段的 JSON<br>2. 调用 `load_config(path)` | 忽略未知字段, 正常加载已知字段 (`#[serde(deny_unknown_fields)]` 除外则返回 Err) | P1 |
| UT-CS-007 | 保存配置到只读路径失败 | 目标目录为只读 | 1. 设置目录只读<br>2. 调用 `save_config(path, config)` | 返回 `Err`, 包含权限相关错误信息 | P2 |
| UT-CS-008 | 并发读写配置安全性 | 无 | 1. 在两个线程中分别读和写同一配置文件 | 不 panic, 不产生数据损坏 | P2 |

### 1.2 session_parser

| 测试 ID | 测试名称 | 前置条件 | 测试步骤 | 预期结果 | 优先级 |
|---------|---------|---------|---------|---------|--------|
| UT-SP-001 | 路径编码: 反斜杠和冒号转换 | 无 | 1. 调用 `encode_path("D:\\foo\\bar")` | 返回 `"D--foo-bar"` | P0 |
| UT-SP-002 | 路径编码: 含空格路径 | 无 | 1. 调用 `encode_path("D:\\my folder\\project")` | 返回正确编码字符串(空格按约定处理) | P1 |
| UT-SP-003 | 路径编码: 根路径 | 无 | 1. 调用 `encode_path("C:\\")` | 返回 `"C-"` 或约定格式, 不 panic | P1 |
| UT-SP-004 | 解析有效 JSONL 文件提取元数据 | 临时 JSONL 文件包含 3 行有效 JSON | 1. 写入多行 JSONL<br>2. 调用 `parse_session(path)` | 返回包含正确 session ID、时间戳、摘要等元数据的结构体 | P0 |
| UT-SP-005 | 处理空 JSONL 文件 | 临时 JSONL 文件为空 (0 字节) | 1. 创建空文件<br>2. 调用 `parse_session(path)` | 返回空的会话列表或 `None`, 不 panic | P0 |
| UT-SP-006 | 跳过格式错误的 JSONL 行 | JSONL 文件中第 2 行为无效 JSON | 1. 写入 3 行, 其中第 2 行损坏<br>2. 调用 `parse_session(path)` | 跳过损坏行, 正确解析第 1、3 行, 返回 2 条记录 | P0 |
| UT-SP-007 | 按时间戳降序排列会话 | 3 个会话文件, 时间戳乱序 | 1. 创建 3 个不同时间的会话<br>2. 调用 `list_sessions(folder_path)` | 返回列表按时间戳降序排列(最新在前) | P0 |
| UT-SP-008 | 缓存命中: 文件未修改 | 已调用过一次 `list_sessions` | 1. 首次调用 `list_sessions`<br>2. 立即再次调用 | 第二次调用使用缓存, 不重新解析文件(可通过计时或 mock 验证) | P1 |
| UT-SP-009 | 缓存失效: 文件 mtime 变化 | 已缓存的会话列表 | 1. 首次调用 `list_sessions`<br>2. 修改某 JSONL 文件内容<br>3. 再次调用 `list_sessions` | 检测到 mtime 变化, 重新解析, 返回更新后的数据 | P1 |
| UT-SP-010 | `~/.claude/projects/` 目录不存在 | 目标目录不存在 | 1. 指定不存在的 projects 路径<br>2. 调用 `list_sessions(path)` | 返回空列表, 不 panic, 不创建目录 | P0 |
| UT-SP-011 | 编码后路径与实际目录匹配 | `~/.claude/projects/D--foo-bar/` 存在 | 1. 调用 `encode_path("D:\\foo\\bar")`<br>2. 拼接到 projects 目录<br>3. 检查目录存在 | 编码结果与实际目录名一致 | P0 |
| UT-SP-012 | 超大 JSONL 文件性能 | JSONL 文件包含 10,000 行 | 1. 生成大文件<br>2. 调用 `parse_session(path)` | 在合理时间内完成 (<2s), 不 OOM | P2 |

### 1.3 dns_checker

| 测试 ID | 测试名称 | 前置条件 | 测试步骤 | 预期结果 | 优先级 |
|---------|---------|---------|---------|---------|--------|
| UT-DC-001 | 健康: IP 匹配 198.3.16.159 | DNS 解析返回 `198.3.16.159` (mock) | 1. Mock DNS 解析结果为 `[198.3.16.159]`<br>2. 调用 `check_dns()` | 返回 `DnsStatus::Healthy` | P0 |
| UT-DC-002 | WrongIp: 解析 IP 不匹配 | DNS 解析返回 `1.2.3.4` (mock) | 1. Mock DNS 解析结果为 `[1.2.3.4]`<br>2. 调用 `check_dns()` | 返回 `DnsStatus::WrongIp { actual: "1.2.3.4" }` | P0 |
| UT-DC-003 | 多 IP 中有一个匹配即为健康 | DNS 返回多个 IP (mock) | 1. Mock DNS 解析结果为 `[1.2.3.4, 198.3.16.159, 5.6.7.8]`<br>2. 调用 `check_dns()` | 返回 `DnsStatus::Healthy` | P0 |
| UT-DC-004 | DNS 解析失败 | DNS 查询超时或出错 (mock) | 1. Mock DNS 解析返回错误<br>2. 调用 `check_dns()` | 返回 `DnsStatus::ResolutionFailed { error }` | P0 |
| UT-DC-005 | 忽略 IPv6 地址, 仅检查 IPv4 | DNS 返回 IPv6 + IPv4 (mock) | 1. Mock 返回 `[::1, 198.3.16.159]`<br>2. 调用 `check_dns()` | 过滤掉 IPv6, 仅检查 IPv4 地址, 返回 `Healthy` | P1 |
| UT-DC-006 | 仅有 IPv6 地址无 IPv4 | DNS 仅返回 `[::1, fe80::1]` (mock) | 1. Mock 仅返回 IPv6 地址<br>2. 调用 `check_dns()` | 返回 `ResolutionFailed` 或 `WrongIp`(无 IPv4 可比对) | P1 |
| UT-DC-007 | 多 IP 全部不匹配 | DNS 返回 `[1.2.3.4, 5.6.7.8]` (mock) | 1. Mock DNS 解析结果<br>2. 调用 `check_dns()` | 返回 `DnsStatus::WrongIp`, 报告实际 IP 列表 | P1 |
| UT-DC-008 | 期望 IP 可配置 | 配置中指定不同的期望 IP | 1. 设置期望 IP 为 `10.0.0.1`<br>2. Mock DNS 返回 `10.0.0.1`<br>3. 调用 `check_dns()` | 返回 `Healthy` | P2 |

### 1.4 claude_cli

| 测试 ID | 测试名称 | 前置条件 | 测试步骤 | 预期结果 | 优先级 |
|---------|---------|---------|---------|---------|--------|
| UT-CC-001 | 构建新会话命令 | 无 | 1. 调用 `build_command(folder: "D:\\project", resume: None)` | 返回正确的 `Command`, 包含工作目录参数, 无 `--resume` 标志 | P0 |
| UT-CC-002 | 构建恢复会话命令 | 有效的 session_id | 1. 调用 `build_command(folder: "D:\\project", resume: Some("abc-123"))` | 返回包含 `--resume abc-123` 参数的 `Command` | P0 |
| UT-CC-003 | claude CLI 不存在时优雅处理 | PATH 中无 `claude` 命令 | 1. 设置空 PATH (mock)<br>2. 调用 `launch_session(...)` | 返回 `Err`, 错误信息指明 "claude CLI not found" 或类似提示 | P0 |
| UT-CC-004 | 命令参数不包含注入风险 | folder 路径包含特殊字符 `; rm -rf /` | 1. 调用 `build_command(folder: "D:\\test; rm -rf /", ...)` | 特殊字符被安全转义或路径被验证拒绝, 不执行注入命令 | P1 |
| UT-CC-005 | 命令包含正确的工作目录 | 有效文件夹路径 | 1. 调用 `build_command(folder: "D:\\my-project", ...)` | `Command` 的 `current_dir` 设置为 `D:\my-project` | P0 |
| UT-CC-006 | 超长路径处理 | 路径长度超过 260 字符 (Windows MAX_PATH) | 1. 构造超长路径<br>2. 调用 `build_command(folder: long_path, ...)` | 正常构建命令或返回明确错误, 不 panic | P2 |

---

## 2. 前端组件测试

> 测试框架: Vitest + @solidjs/testing-library
> 文件位置: `src/__tests__/` 或各组件同级 `*.test.tsx`

### 2.1 FolderList

| 测试 ID | 测试名称 | 前置条件 | 测试步骤 | 预期结果 | 优先级 |
|---------|---------|---------|---------|---------|--------|
| FT-FL-001 | 渲染文件夹列表 | 传入 3 个文件夹数据 | 1. 渲染 `<FolderList folders={mockFolders} />`<br>2. 查询列表项 | 显示 3 个文件夹名称 | P0 |
| FT-FL-002 | 高亮当前选中文件夹 | `activeFolder` 指向第 2 个 | 1. 渲染组件, activeFolder = folders[1]<br>2. 检查第 2 项 CSS 类名 | 第 2 项包含 `active` 或高亮样式类 | P0 |
| FT-FL-003 | 空状态显示 | 文件夹列表为空 | 1. 渲染 `<FolderList folders={[]} />`<br>2. 查询空状态文案 | 显示 "暂无文件夹" 或引导添加的提示文字 | P0 |
| FT-FL-004 | 点击文件夹触发回调 | 传入 `onSelect` 回调 | 1. 渲染组件<br>2. 点击第 1 个文件夹 | `onSelect` 被调用, 参数为第 1 个文件夹对象 | P0 |
| FT-FL-005 | 文件夹名称过长截断显示 | 文件夹名超过 50 字符 | 1. 传入长名称文件夹<br>2. 检查渲染结果 | 文本被截断, 显示省略号, 不破坏布局 | P2 |

### 2.2 SessionList

| 测试 ID | 测试名称 | 前置条件 | 测试步骤 | 预期结果 | 优先级 |
|---------|---------|---------|---------|---------|--------|
| FT-SL-001 | 按日期降序渲染会话列表 | 传入 3 个不同日期的会话 | 1. 渲染 `<SessionList sessions={mockSessions} />`<br>2. 检查渲染顺序 | 最新会话在最上方 | P0 |
| FT-SL-002 | 加载状态显示 | `isLoading = true` | 1. 渲染 `<SessionList isLoading={true} />`<br>2. 查询加载指示器 | 显示 loading spinner 或骨架屏 | P0 |
| FT-SL-003 | 空会话列表 | sessions 为空数组 | 1. 渲染 `<SessionList sessions={[]} />`<br>2. 查询空状态 | 显示 "该文件夹下暂无会话" 提示 | P1 |
| FT-SL-004 | 错误状态显示 | 传入 error 信息 | 1. 渲染 `<SessionList error="加载失败" />`<br>2. 查询错误提示 | 显示错误信息和重试按钮 | P1 |

### 2.3 SessionCard

| 测试 ID | 测试名称 | 前置条件 | 测试步骤 | 预期结果 | 优先级 |
|---------|---------|---------|---------|---------|--------|
| FT-SC-001 | 显示所有会话字段 | 完整的 session 数据 | 1. 渲染 `<SessionCard session={mockSession} />`<br>2. 检查各字段 | 显示 session ID、时间戳、摘要、消息数量等 | P0 |
| FT-SC-002 | 长摘要截断 | 摘要超过 200 字符 | 1. 传入长摘要的 session<br>2. 检查摘要文本 | 摘要被截断, 末尾显示 "..." | P1 |
| FT-SC-003 | 时间戳格式化 | 时间戳为 Unix 毫秒 | 1. 传入 `timestamp: 1774886400000`<br>2. 检查显示的时间 | 显示人类可读格式 (如 "2026-03-28 12:00") | P1 |
| FT-SC-004 | 点击恢复按钮回调 | 传入 `onResume` 回调 | 1. 渲染组件<br>2. 点击 "恢复会话" 按钮 | `onResume(sessionId)` 被调用 | P0 |
| FT-SC-005 | 无摘要时显示占位文本 | session.summary 为 null | 1. 传入无摘要的 session<br>2. 检查摘要区域 | 显示 "无摘要" 或占位灰色文本 | P2 |

### 2.4 HealthBanner

| 测试 ID | 测试名称 | 前置条件 | 测试步骤 | 预期结果 | 优先级 |
|---------|---------|---------|---------|---------|--------|
| FT-HB-001 | 健康状态显示绿色 | status = Healthy | 1. 渲染 `<HealthBanner status="healthy" />`<br>2. 检查样式 | 显示绿色横幅, 文本提示 "DNS 正常" | P0 |
| FT-HB-002 | 错误 IP 显示红色警告 | status = WrongIp | 1. 渲染 `<HealthBanner status="wrong_ip" actualIp="1.2.3.4" />`<br>2. 检查样式和文本 | 红色横幅, 显示 "DNS 解析异常: 期望 198.3.16.159, 实际 1.2.3.4" | P0 |
| FT-HB-003 | 解析失败显示警告 | status = ResolutionFailed | 1. 渲染 `<HealthBanner status="resolution_failed" />`<br>2. 检查内容 | 显示黄色/红色警告, 提示 "DNS 解析失败" | P0 |
| FT-HB-004 | 关闭按钮隐藏横幅 | 横幅可见 | 1. 渲染组件<br>2. 点击关闭/dismiss 按钮 | 横幅从 DOM 中移除或不可见 | P1 |
| FT-HB-005 | 关闭后不再自动显示 (同次会话) | 已关闭横幅 | 1. 关闭横幅<br>2. 检查 dismissed 状态 | 横幅保持隐藏, `onDismiss` 回调被记录 | P1 |
| FT-HB-006 | 健康状态可选隐藏 | 配置 `hideWhenHealthy = true` | 1. 渲染 `<HealthBanner status="healthy" hideWhenHealthy />`<br>2. 查询横幅 | 横幅不显示 (仅异常时显示) | P2 |

### 2.5 AddFolderDialog

| 测试 ID | 测试名称 | 前置条件 | 测试步骤 | 预期结果 | 优先级 |
|---------|---------|---------|---------|---------|--------|
| FT-AF-001 | 对话框打开与关闭 | 无 | 1. 触发打开对话框<br>2. 检查对话框可见<br>3. 点击取消<br>4. 检查对话框隐藏 | 对话框正确打开和关闭 | P0 |
| FT-AF-002 | 验证文件夹选择 | 对话框已打开 | 1. 选择有效文件夹路径<br>2. 点击确认 | `onConfirm` 回调被调用, 参数为选中路径 | P0 |
| FT-AF-003 | 未选择文件夹时确认按钮禁用 | 对话框已打开, 未选择路径 | 1. 不选择任何文件夹<br>2. 检查确认按钮状态 | 确认按钮为 disabled 状态 | P1 |
| FT-AF-004 | 重复文件夹提示 | 已存在的文件夹路径 | 1. 选择已添加过的文件夹<br>2. 检查提示信息 | 显示 "该文件夹已添加" 错误提示 | P1 |
| FT-AF-005 | ESC 键关闭对话框 | 对话框已打开 | 1. 按下 ESC 键<br>2. 检查对话框状态 | 对话框关闭 | P2 |
| FT-AF-006 | 点击遮罩层关闭对话框 | 对话框已打开 | 1. 点击对话框外部遮罩<br>2. 检查对话框状态 | 对话框关闭 | P2 |

### 2.6 LaunchButton

| 测试 ID | 测试名称 | 前置条件 | 测试步骤 | 预期结果 | 优先级 |
|---------|---------|---------|---------|---------|--------|
| FT-LB-001 | 正常可点击状态 | 已选择文件夹 | 1. 渲染 `<LaunchButton folder={selected} />`<br>2. 检查按钮状态 | 按钮 enabled, 显示 "启动 Claude" | P0 |
| FT-LB-002 | 未选择文件夹时禁用 | folder 为 null | 1. 渲染 `<LaunchButton folder={null} />`<br>2. 检查按钮状态 | 按钮 disabled, 视觉灰化 | P0 |
| FT-LB-003 | 启动中显示加载状态 | 点击启动后 | 1. 点击启动按钮<br>2. 在 launch 完成前检查状态 | 显示 loading spinner, 按钮禁用防止重复点击 | P0 |
| FT-LB-004 | 启动失败显示错误 | CLI 启动失败 (mock) | 1. Mock invoke 返回错误<br>2. 点击启动按钮<br>3. 等待结果 | 显示错误提示, 按钮恢复可点击 | P1 |
| FT-LB-005 | 启动成功回调 | CLI 启动成功 (mock) | 1. Mock invoke 返回成功<br>2. 点击启动按钮<br>3. 等待结果 | `onSuccess` 回调触发, 按钮恢复正常状态 | P1 |

---

## 3. 集成测试

> Rust 集成测试: `src-tauri/tests/`
> 前端集成测试: `src/__tests__/integration/`

| 测试 ID | 测试名称 | 前置条件 | 测试步骤 | 预期结果 | 优先级 |
|---------|---------|---------|---------|---------|--------|
| IT-001 | 完整流程: 添加文件夹 -> 列出会话 -> 启动 Claude | 有效的项目目录, 目录下有 `.claude/` 数据 | 1. 调用添加文件夹 Tauri 命令<br>2. 调用列出会话 Tauri 命令<br>3. 调用启动 Claude Tauri 命令 (dry-run 模式) | 每步返回成功, 会话列表非空, 启动命令构建正确 | P0 |
| IT-002 | 启动时 DNS 检查 -> 横幅显示 | 网络可用 | 1. 启动应用 (测试模式)<br>2. 触发 DNS 检查<br>3. 获取检查结果<br>4. 验证前端横幅状态 | DNS 结果正确传递到前端, 横幅按状态显示 | P0 |
| IT-003 | 配置持久化跨重启 | 无现有配置 | 1. 添加 2 个文件夹<br>2. 保存配置<br>3. 模拟重启 (重新加载配置)<br>4. 检查文件夹列表 | 重新加载后, 2 个文件夹仍存在 | P0 |
| IT-004 | 移除文件夹后更新配置 | 已有 3 个文件夹 | 1. 移除第 2 个文件夹<br>2. 保存配置<br>3. 重新加载配置 | 仅剩 2 个文件夹, 顺序正确 | P1 |
| IT-005 | 文件夹不存在时优雅降级 | 配置中记录的文件夹路径已被外部删除 | 1. 加载配置 (含已删除文件夹)<br>2. 列出该文件夹会话 | 返回空列表或标记 "文件夹不存在", 不影响其他文件夹 | P1 |
| IT-006 | DNS 检查结果缓存 | 首次检查已完成 | 1. 首次 DNS 检查<br>2. 短时间内再次检查 | 第二次使用缓存结果, 不重复发起 DNS 查询 | P2 |

---

## 4. E2E 测试 (Playwright)

> 测试框架: Playwright + Tauri E2E 驱动
> 文件位置: `tests/e2e/`

| 测试 ID | 测试名称 | 前置条件 | 测试步骤 | 预期结果 | 优先级 |
|---------|---------|---------|---------|---------|--------|
| E2E-001 | 应用启动并显示文件夹列表 | 应用已构建 | 1. 启动应用<br>2. 等待主窗口加载<br>3. 截图验证 | 主窗口显示, 左侧文件夹列表面板可见, 无崩溃 | P0 |
| E2E-002 | 通过对话框添加文件夹 | 应用已启动, 无现有文件夹 | 1. 点击 "添加文件夹" 按钮<br>2. 在文件夹选择对话框中选择路径<br>3. 确认添加 | 文件夹出现在列表中, 自动选中 | P0 |
| E2E-003 | 选择文件夹并查看会话列表 | 应用已启动, 至少 1 个文件夹 | 1. 点击文件夹列表中的项目<br>2. 等待会话加载 | 右侧面板显示该文件夹下的会话列表 | P0 |
| E2E-004 | 点击恢复按钮启动会话 | 应用已启动, 选中文件夹, 有可用会话 | 1. 点击某会话卡片的 "恢复" 按钮<br>2. 观察行为 | 触发 Claude CLI 启动 (可验证进程创建或 Tauri 命令调用) | P0 |
| E2E-005 | DNS 警告横幅: IP 异常时显示 | Mock DNS 返回错误 IP | 1. 启动应用 (DNS mock 为 WrongIp)<br>2. 等待 DNS 检查完成 | 顶部显示红色警告横幅, 包含实际 IP 信息 | P1 |
| E2E-006 | DNS 警告横幅: 可关闭 | DNS 横幅已显示 | 1. 点击横幅关闭按钮<br>2. 验证横幅消失 | 横幅消失, 页面内容上移 | P1 |
| E2E-007 | 移除文件夹 | 已有 2 个文件夹 | 1. 右键或操作菜单点击某文件夹<br>2. 选择 "移除"<br>3. 确认移除 | 文件夹从列表中消失, 仅剩 1 个 | P1 |
| E2E-008 | 空状态引导 | 无文件夹 | 1. 启动应用 (空配置)<br>2. 观察界面 | 显示引导文字和 "添加文件夹" 按钮 | P1 |
| E2E-009 | 窗口大小调整后布局正常 | 应用已启动 | 1. 调整窗口大小为 800x600<br>2. 调整为 1920x1080<br>3. 各尺寸截图对比 | 各尺寸下布局不错乱, 无溢出, 列表可滚动 | P2 |
| E2E-010 | 快速连续点击不产生重复操作 | 应用已启动, 有可用会话 | 1. 快速双击 "恢复" 按钮<br>2. 检查启动次数 | 仅触发一次启动, 不产生重复进程 | P2 |

---

## 5. 优先级说明

| 优先级 | 含义 | 数量 | 执行阶段 |
|--------|------|------|---------|
| **P0** | 核心功能, 必须通过 | 30 | 每次提交前 |
| **P1** | 重要功能, 应当通过 | 20 | 每次 PR 合并前 |
| **P2** | 边缘场景, 建议通过 | 12 | 版本发布前 |

### 覆盖率要求

| 模块 | 最低覆盖率 | 说明 |
|------|-----------|------|
| `config_service` | 90% | 配置是核心基础, 必须高覆盖 |
| `session_parser` | 85% | 解析逻辑复杂, 需覆盖各种异常 |
| `dns_checker` | 80% | 网络相关需 mock, 覆盖主要分支 |
| `claude_cli` | 80% | 命令构建需验证安全性 |
| 前端组件 | 80% | 组件渲染和交互覆盖 |
| 总体 | **80%+** | 全项目最低标准 |

### 测试运行命令

```bash
# Rust 单元测试
cd src-tauri && cargo test

# Rust 覆盖率 (需安装 cargo-tarpaulin)
cd src-tauri && cargo tarpaulin --out Html

# 前端组件测试
npx vitest run

# 前端覆盖率
npx vitest run --coverage

# E2E 测试
npx playwright test

# 全量测试
npm run test:all
```
