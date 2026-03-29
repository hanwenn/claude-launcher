import type { Component } from "solid-js";
import { createSignal, For, Show } from "solid-js";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  RefreshCw,
  Settings,
} from "lucide-solid";

interface DepInfo {
  name: string;
  status: "installed" | "missing" | "optional_missing";
  version: string | null;
  path: string | null;
  required: boolean;
  installHint?: string;
  installCmd?: string;
}

interface DependencyCheckProps {
  deps: Record<string, DepInfo>;
  onContinue: () => void;
  onRecheck: () => Promise<void>;
}

const FALLBACK_MESSAGES: Record<string, string> = {
  windowsTerminal: "将使用 CMD 替代",
};

const DependencyCheck: Component<DependencyCheckProps> = (props) => {
  const [rechecking, setRechecking] = createSignal(false);

  const depEntries = () => Object.entries(props.deps);

  const allRequiredInstalled = () =>
    depEntries().every(
      ([, dep]) => !dep.required || dep.status === "installed"
    );

  async function handleRecheck() {
    setRechecking(true);
    try {
      await props.onRecheck();
    } finally {
      setRechecking(false);
    }
  }

  async function handleInstall(cmd: string) {
    try {
      await window.electronAPI.installDependency(cmd);
    } catch (err) {
      // best-effort, user sees the cmd window
    }
  }

  function statusIcon(dep: DepInfo) {
    if (dep.status === "installed") {
      return (
        <span class="dep-item__icon dep-item__icon--ok">
          <CheckCircle2 size={20} />
        </span>
      );
    }
    if (dep.status === "missing") {
      return (
        <span class="dep-item__icon dep-item__icon--error">
          <XCircle size={20} />
        </span>
      );
    }
    return (
      <span class="dep-item__icon dep-item__icon--warn">
        <AlertTriangle size={20} />
      </span>
    );
  }

  function statusLabel(dep: DepInfo) {
    if (dep.status === "installed") return "已安装";
    if (dep.status === "missing") return "未安装 (必需)";
    return "未安装 (可选)";
  }

  return (
    <div class="dep-check-overlay">
      <div class="dep-check">
        <div class="dep-check__title">
          <Settings size={22} />
          环境依赖检测
        </div>

        <div class="dep-check__list">
          <For each={depEntries()}>
            {([key, dep]) => (
              <div class="dep-item">
                {statusIcon(dep)}
                <div class="dep-item__info">
                  <div>
                    <span class="dep-item__name">{dep.name}</span>
                    <Show when={dep.version}>
                      <span class="dep-item__version">{dep.version}</span>
                    </Show>
                    <span class="dep-item__status-label">
                      {" "}
                      {statusLabel(dep)}
                    </span>
                  </div>
                  <Show when={dep.installHint && dep.status !== "installed"}>
                    <div class="dep-item__hint">{dep.installHint}</div>
                  </Show>
                  <Show when={dep.status === "optional_missing" && FALLBACK_MESSAGES[key]}>
                    <div class="dep-item__fallback">
                      {FALLBACK_MESSAGES[key]}
                    </div>
                  </Show>
                </div>
                <Show when={dep.installCmd && dep.status !== "installed"}>
                  <button
                    class="dep-item__install-btn"
                    onClick={() => handleInstall(dep.installCmd!)}
                  >
                    <Download size={14} />
                    安装
                  </button>
                </Show>
              </div>
            )}
          </For>
        </div>

        <div class="dep-check__footer">
          <button
            class="dep-check__recheck-btn"
            onClick={handleRecheck}
            disabled={rechecking()}
          >
            <RefreshCw size={16} class={rechecking() ? "spin" : ""} />
            {rechecking() ? "检测中..." : "重新检测"}
          </button>
          <button
            class="dep-check__continue-btn"
            onClick={props.onContinue}
            disabled={!allRequiredInstalled()}
          >
            {allRequiredInstalled() ? "继续使用" : "请先安装必需依赖"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DependencyCheck;
