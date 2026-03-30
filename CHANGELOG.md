# 更新日志

所有版本更新记录。格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

## [0.1.0] - 2026-03-30

### 新增

- 工作目录管理：添加、删除、刷新项目文件夹，侧边栏实时显示会话数量
- 会话浏览器：查看历史 Claude Code 会话，显示模型、时间、摘要、消息数
- DNS 健康检查：启动前验证 `claude.ai` IP 地址，异常时顶部横幅警告并拦截启动
- IP 配置：支持精确 IP 和 CIDR 网段，逗号分隔多规则取或匹配
- 内嵌终端仪表盘：独立窗口，基于 xterm.js + node-pty 实现完整终端模拟
- 分屏布局：支持 1 / 2 / 4 / 6 / 8 宫格切换
- 终端拖拽排序：在仪表盘中拖拽调整终端面板位置
- 会话状态同步：运行中的会话在启动器中显示绿色标记
- 乐观状态更新：点击即时反馈，防止重复启动同一会话
- 依赖检测：首次运行检查 Claude CLI 和 Windows Terminal 是否已安装
- 关闭确认：运行中终端的保护性确认弹窗，防止意外终止会话
- Windows Terminal 自动检测，未安装时回退到 CMD
- 终端输出批量刷新（16ms 间隔），减少 IPC 开销
- 配置原子写入（.tmp + rename），JSON 损坏时自动备份恢复
- 暗色主题 UI，匹配 Claude Code 风格
- 双窗口架构：Launcher 窗口管理目录与会话，Dashboard 窗口承载终端

### 安全

- CSP 策略启用
- Context Isolation 启用，nodeIntegration 禁用
- 路径遍历防护（session ID 验证）
- 命令注入防护（通过 node-pty 直接进程启动，不经过 shell）
- 文件夹白名单验证（仅允许已配置的文件夹启动终端）
- JSONL 解析限制（防止内存耗尽）
- 符号链接拒绝（添加文件夹时使用 lstat 检测并拒绝符号链接）
