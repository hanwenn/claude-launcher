import type { Component } from "solid-js";
import { For, Show, createSignal } from "solid-js";
import { Portal } from "solid-js/web";
import { Lock } from "lucide-solid";
import type { LayoutMode } from "../types";
import { layoutMode, setLayoutMode, terminals } from "../stores/terminalStore";
import { isProUser, getMaxPanes } from "../lib/proGate";
import UpgradePrompt from "./UpgradePrompt";

interface GridPreview {
  readonly mode: LayoutMode;
  readonly cols: number;
  readonly rows: number;
  readonly label: string;
}

const GRID_PREVIEWS: readonly GridPreview[] = [
  { mode: 1, cols: 1, rows: 1, label: "1" },
  { mode: 2, cols: 2, rows: 1, label: "2" },
  { mode: 4, cols: 2, rows: 2, label: "4" },
  { mode: 6, cols: 3, rows: 2, label: "6" },
  { mode: 8, cols: 4, rows: 2, label: "8" },
];

const PRO_ONLY_MODES: ReadonlySet<LayoutMode> = new Set([6, 8]);

const LayoutSelector: Component = () => {
  const activeCount = () => terminals().filter((t) => t.status === 'running').length;
  const [showUpgrade, setShowUpgrade] = createSignal(false);

  function handleLayoutClick(mode: LayoutMode): void {
    if (PRO_ONLY_MODES.has(mode) && !isProUser()) {
      setShowUpgrade(true);
      return;
    }
    setLayoutMode(mode);
  }

  return (
    <div class="layout-selector">
      <span class="layout-selector__label">布局</span>
      <div class="layout-selector__buttons">
        <For each={GRID_PREVIEWS}>
          {(preview) => {
            const locked = () => PRO_ONLY_MODES.has(preview.mode) && !isProUser();
            return (
              <button
                class="layout-btn"
                classList={{
                  "layout-btn--active": layoutMode() === preview.mode,
                  "layout-btn--locked": locked(),
                }}
                onClick={() => handleLayoutClick(preview.mode)}
                title={locked() ? `${preview.label} panes (Pro)` : `${preview.label} 窗格布局`}
              >
                <div
                  class="layout-btn__grid"
                  style={{
                    "grid-template-columns": `repeat(${preview.cols}, 1fr)`,
                    "grid-template-rows": `repeat(${preview.rows}, 1fr)`,
                  }}
                >
                  <For each={Array.from({ length: preview.mode })}>
                    {() => <div class="layout-btn__cell" />}
                  </For>
                </div>
                <Show when={locked()}>
                  <span class="layout-btn__pro-badge">
                    <Lock size={10} />
                    Pro
                  </span>
                </Show>
              </button>
            );
          }}
        </For>
      </div>
      <span class="layout-selector__count">
        {activeCount()}/{layoutMode()} 活跃
      </span>

      <Show when={showUpgrade()}>
        <Portal>
          <UpgradePrompt onClose={() => setShowUpgrade(false)} />
        </Portal>
      </Show>
    </div>
  );
};

export default LayoutSelector;
