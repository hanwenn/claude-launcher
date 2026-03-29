import type { Component } from "solid-js";
import { Show, createSignal } from "solid-js";
import { Portal } from "solid-js/web";
import { CheckCircle2, AlertTriangle, RefreshCw, X, Settings } from "lucide-solid";
import {
  healthResult,
  healthDismissed,
  healthChecking,
  checkHealth,
  dismissHealth,
} from "../stores/healthStore";

function getStatusInfo(result: ReturnType<typeof healthResult>) {
  if (!result) {
    return null;
  }
  const status = result.status as any;

  // Handle both Electron format (lowercase strings) and Tauri format (PascalCase/objects)
  if (status === "Healthy" || status === "healthy") {
    return {
      type: "healthy" as const,
      message: "DNS 连接正常",
      details: `IP: ${(result.resolved_ips || []).join(", ")}`,
    };
  }
  if (status === "wrong_ip" || (typeof status === "object" && "WrongIp" in status)) {
    const ips = typeof status === "object" && "WrongIp" in status
      ? status.WrongIp
      : result.resolved_ips || [];
    return {
      type: "warning" as const,
      message: "DNS 异常：IP 地址不匹配",
      details: `实际: ${ips.join(", ")}，期望: ${result.expected_ip}`,
    };
  }
  if (status === "resolution_failed" || (typeof status === "object" && "ResolutionFailed" in status)) {
    const errMsg = typeof status === "object" && "ResolutionFailed" in status
      ? status.ResolutionFailed
      : (result as any).error || "未知错误";
    return {
      type: "warning" as const,
      message: "DNS 解析失败",
      details: errMsg,
    };
  }
  return null;
}

const HealthBanner: Component = () => {
  const info = () => getStatusInfo(healthResult());
  const visible = () => !healthDismissed() && (healthChecking() || info() !== null);
  const [showIpConfig, setShowIpConfig] = createSignal(false);
  const [ipRules, setIpRules] = createSignal<string[]>([]);
  const [newRule, setNewRule] = createSignal("");
  const [ipSaving, setIpSaving] = createSignal(false);
  const [ipError, setIpError] = createSignal("");

  async function openIpConfig() {
    try {
      const currentIp = await window.electronAPI.getExpectedIp();
      const rules = currentIp.split(",").map((s: string) => s.trim()).filter(Boolean);
      setIpRules(rules.length > 0 ? rules : ["198.3.16.159"]);
    } catch (_) {
      setIpRules(["198.3.16.159"]);
    }
    setNewRule("");
    setIpError("");
    setShowIpConfig(true);
  }

  function addRule() {
    const val = newRule().trim();
    if (!val) return;
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
    if (!ipRegex.test(val) && !cidrRegex.test(val)) {
      setIpError("格式无效，请输入 IP（如 198.3.16.159）或网段（如 198.3.16.0/24）");
      return;
    }
    if (ipRules().includes(val)) {
      setIpError("该规则已存在");
      return;
    }
    setIpRules([...ipRules(), val]);
    setNewRule("");
    setIpError("");
  }

  function removeRule(index: number) {
    setIpRules(ipRules().filter((_, i) => i !== index));
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addRule();
    }
  }

  async function saveIp() {
    if (ipRules().length === 0) {
      setIpError("至少需要一条 IP 规则");
      return;
    }
    setIpSaving(true);
    setIpError("");
    try {
      await window.electronAPI.setExpectedIp(ipRules().join(","));
      setShowIpConfig(false);
      checkHealth();
    } catch (err) {
      setIpError(String(err));
    } finally {
      setIpSaving(false);
    }
  }

  return (
    <>
      <Show when={visible()}>
        <div
          class="health-banner"
          classList={{
            "health-banner--healthy": !healthChecking() && info()?.type === "healthy",
            "health-banner--warning": !healthChecking() && info()?.type === "warning",
            "health-banner--checking": healthChecking(),
          }}
        >
          <div class="health-banner__content">
            <Show when={healthChecking()}>
              <RefreshCw size={14} class="health-banner__icon health-banner__icon--spin" />
              <span class="health-banner__text">正在检查 DNS 状态...</span>
            </Show>
            <Show when={!healthChecking() && info()}>
              {(() => {
                const i = info()!;
                return (
                  <>
                    {i.type === "healthy" ? (
                      <CheckCircle2 size={14} class="health-banner__icon health-banner__icon--green" />
                    ) : (
                      <AlertTriangle size={14} class="health-banner__icon health-banner__icon--red" />
                    )}
                    <span class="health-banner__text">{i.message}</span>
                    <Show when={i.details}>
                      <span class="health-banner__details">({i.details})</span>
                    </Show>
                  </>
                );
              })()}
            </Show>
          </div>
          <div class="health-banner__actions">
            <button
              class="health-banner__btn"
              onClick={() => openIpConfig()}
              title="配置期望 IP"
            >
              <Settings size={14} />
            </button>
            <button
              class="health-banner__btn"
              onClick={() => checkHealth()}
              title="刷新"
            >
              <RefreshCw size={14} />
            </button>
            <button
              class="health-banner__btn"
              onClick={() => dismissHealth()}
              title="关闭"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </Show>

      <Show when={showIpConfig()}>
        <Portal>
        <div class="dialog-overlay" onClick={() => setShowIpConfig(false)}>
          <div class="dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div class="dialog__header">
              <h3 class="dialog__title">DNS 检测 IP 配置</h3>
              <button class="dialog__close" onClick={() => setShowIpConfig(false)}>
                <X size={16} />
              </button>
            </div>
            <div class="dialog__body">
              <p class="dialog__description">
                配置允许的 IP 地址或网段，任一规则匹配即视为正常。
              </p>

              <div class="ip-tags">
                {ipRules().map((rule, index) => (
                  <span class="ip-tag">
                    <span class="ip-tag__text">{rule}</span>
                    <button
                      class="ip-tag__remove"
                      onClick={() => removeRule(index)}
                      title="移除"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>

              <div class="ip-add-row">
                <input
                  class="dialog__input ip-add-row__input"
                  type="text"
                  value={newRule()}
                  onInput={(e) => { setNewRule(e.currentTarget.value); setIpError(""); }}
                  onKeyDown={handleKeyDown}
                  placeholder="输入 IP 或网段，如 198.3.16.0/24"
                />
                <button class="ip-add-row__btn" onClick={addRule}>
                  添加
                </button>
              </div>

              <div class="ip-presets">
                <span class="ip-presets__label">快捷添加：</span>
                {["198.3.16.159", "198.3.16.0/24", "104.18.0.0/16"].map((preset) => (
                  <button class="ip-preset-btn" onClick={() => {
                    if (!ipRules().includes(preset)) {
                      setIpRules([...ipRules(), preset]);
                      setIpError("");
                    }
                  }}>
                    {preset}
                  </button>
                ))}
              </div>

              <Show when={ipError()}>
                <p class="dialog__error">{ipError()}</p>
              </Show>
            </div>
            <div class="dialog__footer">
              <button class="dialog__btn dialog__btn--secondary" onClick={() => setShowIpConfig(false)}>
                取消
              </button>
              <button class="dialog__btn dialog__btn--primary" onClick={saveIp} disabled={ipSaving()}>
                {ipSaving() ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
        </Portal>
      </Show>
    </>
  );
};

export default HealthBanner;
