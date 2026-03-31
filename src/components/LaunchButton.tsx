import type { Component } from "solid-js";
import { createSignal, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { Terminal, RefreshCw, ShieldAlert } from "lucide-solid";
import * as api from "../lib/tauri-api";
import { openTerminal } from "../stores/terminalStore";
import { markSessionActive } from "../stores/sessionStore";
import { selectedAgentId } from "../stores/agentStore";

interface LaunchButtonProps {
  readonly folderPath: string | null;
  readonly sessionId?: string;
  readonly label?: string;
  readonly variant?: "primary" | "outline";
  readonly disabled?: boolean;
}

const LaunchButton: Component<LaunchButtonProps> = (props) => {
  const [launching, setLaunching] = createSignal(false);
  const [launchError, setLaunchError] = createSignal<string | null>(null);
  const [showDnsBlock, setShowDnsBlock] = createSignal(false);
  const [dnsDetail, setDnsDetail] = createSignal("");

  const label = () => props.disabled ? "运行中" : (props.label ?? (props.sessionId ? "恢复会话" : "新建会话"));
  const disabled = () => !props.folderPath || !!props.disabled;

  function getFolderDisplayName(): string {
    const folder = props.folderPath;
    if (!folder) return "";
    return folder.split(/[/\\]/).pop() ?? folder;
  }

  async function launchTerminal(): Promise<void> {
    const folder = props.folderPath!;
    const displayName = getFolderDisplayName();
    // When resuming a session, always use claude (sessions are Claude-specific).
    // For new sessions, use the currently selected agent.
    const agentId = props.sessionId ? 'claude' : selectedAgentId();
    await openTerminal(folder, displayName, props.sessionId ?? undefined, agentId);
    await window.electronAPI.openDashboard();
  }

  async function handleClick() {
    if (disabled() || launching()) return;
    setLaunching(true);
    setLaunchError(null);
    setShowDnsBlock(false);

    try {
      // Pre-launch DNS check -- block if IP mismatch
      const health = await api.checkDnsHealth();
      const status = health.status as any;
      if (status !== "Healthy" && status !== "healthy") {
        const resolvedIps = (health.resolved_ips || []).join(", ") || "无法解析";
        setDnsDetail(
          `检测到 IP: ${resolvedIps}，期望: ${health.expected_ip}`
        );
        setShowDnsBlock(true);
        setLaunching(false);
        return;
      }

      // Optimistic: mark session active immediately to prevent double-click
      if (props.sessionId) {
        markSessionActive(props.sessionId);
      }
      await launchTerminal();
    } catch (err) {
      setLaunchError(String(err));
      setTimeout(() => setLaunchError(null), 5000);
    } finally {
      setLaunching(false);
    }
  }

  function forcelaunch() {
    setShowDnsBlock(false);
    setLaunching(true);
    setLaunchError(null);
    if (props.sessionId) {
      markSessionActive(props.sessionId);
    }
    launchTerminal()
      .catch((err) => {
        setLaunchError(String(err));
        setTimeout(() => setLaunchError(null), 5000);
      })
      .finally(() => setLaunching(false));
  }

  return (
    <div class="launch-btn-wrap">
      <button
        class="launch-btn"
        classList={{
          "launch-btn--primary": (props.variant ?? "primary") === "primary",
          "launch-btn--outline": props.variant === "outline",
          "launch-btn--disabled": disabled(),
          "launch-btn--loading": launching(),
        }}
        onClick={handleClick}
        disabled={disabled()}
        title={disabled() ? "请先选择工作目录" : label()}
      >
        <Show when={launching()} fallback={<Terminal size={16} />}>
          <RefreshCw size={16} class="launch-btn__spinner" />
        </Show>
        <span>{label()}</span>
      </button>
      <Show when={launchError()}>
        <p class="launch-btn__error">{launchError()}</p>
      </Show>
      <Show when={showDnsBlock()}>
        <Portal>
          <div class="dialog-overlay" onClick={() => setShowDnsBlock(false)}>
            <div class="dns-block-dialog" onClick={(e) => e.stopPropagation()}>
              <div class="dns-block-dialog__icon">
                <ShieldAlert size={40} />
              </div>
              <h3 class="dns-block-dialog__title">DNS 检测未通过</h3>
              <p class="dns-block-dialog__subtitle">已阻止启动 Claude 会话</p>
              <div class="dns-block-dialog__detail">{dnsDetail()}</div>
              <p class="dns-block-dialog__hint">
                请检查 VPN 是否已开启，确保网络连接正常后重试。<br/>
                也可以在顶部状态栏的 ⚙ 按钮中配置期望的 IP 地址或网段。
              </p>
              <div class="dns-block-dialog__actions">
                <button class="dns-block-dialog__btn dns-block-dialog__btn--cancel" onClick={() => setShowDnsBlock(false)}>
                  关闭
                </button>
                <button class="dns-block-dialog__btn dns-block-dialog__btn--force" onClick={forcelaunch}>
                  强制启动（忽略风险）
                </button>
              </div>
            </div>
          </div>
        </Portal>
      </Show>
    </div>
  );
};

export default LaunchButton;
