import type { Component } from "solid-js";
import { createSignal, onMount, onCleanup, Show, For } from "solid-js";

interface TerminalMeta {
  readonly id: string;
  readonly folder: string;
  readonly folderDisplayName: string;
  readonly sessionId: string | null;
  readonly status: "running" | "exited";
  readonly exitCode: number | null;
  readonly startedAt: string;
  readonly lastOutput: string;
}

function formatDuration(startedAt: string): string {
  const elapsed = Date.now() - new Date(startedAt).getTime();
  if (elapsed < 0) return "0s";
  const totalSeconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainMinutes = minutes % 60;
    return `${hours}h${remainMinutes > 0 ? remainMinutes + "m" : ""}`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
}

function truncateOutput(output: string): string {
  if (!output) return "";
  // Take last line that has meaningful content
  const lines = output.split("\n").filter((l) => l.trim().length > 0);
  const last = lines[lines.length - 1] || "";
  return last.length > 60 ? last.slice(-60) : last;
}

const ActiveTerminals: Component = () => {
  const [terminals, setTerminals] = createSignal<readonly TerminalMeta[]>([]);
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  async function fetchTerminals(): Promise<void> {
    try {
      const list = await window.electronAPI.getTerminalList();
      setTerminals(list as TerminalMeta[]);
    } catch {
      setTerminals([]);
    }
  }

  onMount(() => {
    fetchTerminals();
    pollTimer = setInterval(fetchTerminals, 3000);
  });

  onCleanup(() => {
    if (pollTimer) clearInterval(pollTimer);
  });

  function handleOpenDashboard(): void {
    window.electronAPI.openDashboard();
  }

  function handleTerminalClick(_terminal: TerminalMeta): void {
    window.electronAPI.openDashboard();
  }

  return (
    <Show when={terminals().length > 0}>
      <div class="active-terminals">
        <div class="active-terminals__header">
          <span class="active-terminals__title">Terminals</span>
          <span class="active-terminals__count">{terminals().length}</span>
        </div>

        <div class="active-terminals__list">
          <For each={terminals()}>
            {(terminal) => (
              <button
                class="active-terminal-item"
                onClick={() => handleTerminalClick(terminal)}
                title={`${terminal.folder}\nClick to open dashboard`}
              >
                <span
                  class="active-terminal-item__status"
                  classList={{
                    "active-terminal-item__status--running":
                      terminal.status === "running",
                    "active-terminal-item__status--exited":
                      terminal.status === "exited",
                  }}
                />
                <div class="active-terminal-item__info">
                  <div class="active-terminal-item__name-row">
                    <span class="active-terminal-item__name">
                      {terminal.folderDisplayName}
                    </span>
                    <span class="active-terminal-item__duration">
                      {terminal.status === "running"
                        ? `Running \u00B7 ${formatDuration(terminal.startedAt)}`
                        : `Exited \u00B7 ${formatDuration(terminal.startedAt)}`}
                    </span>
                  </div>
                  <Show when={terminal.lastOutput}>
                    <div class="active-terminal-item__output">
                      {truncateOutput(terminal.lastOutput)}
                    </div>
                  </Show>
                </div>
              </button>
            )}
          </For>
        </div>

        <button class="active-terminals__dashboard-btn" onClick={handleOpenDashboard}>
          打开仪表盘
        </button>
      </div>
    </Show>
  );
};

export default ActiveTerminals;
