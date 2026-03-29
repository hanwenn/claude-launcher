import type { Component } from "solid-js";
import { Show, For, createMemo } from "solid-js";
import { Plus } from "lucide-solid";
import type { LayoutMode } from "../types";
import {
  terminals,
  layoutMode,
  maximizedId,
  setMaximized,
  removeTerminal,
  reorderTerminals,
} from "../stores/terminalStore";
import { activeFolder } from "../stores/folderStore";
import { openTerminal } from "../stores/terminalStore";
import * as api from "../lib/tauri-api";
import LayoutSelector from "./LayoutSelector";
import PaneHeader from "./PaneHeader";
import TerminalPane from "./TerminalPane";

function getGridStyle(mode: LayoutMode): { columns: string; rows: string } {
  switch (mode) {
    case 1: return { columns: "1fr", rows: "1fr" };
    case 2: return { columns: "1fr 1fr", rows: "1fr" };
    case 4: return { columns: "1fr 1fr", rows: "1fr 1fr" };
    case 6: return { columns: "1fr 1fr 1fr", rows: "1fr 1fr" };
    case 8: return { columns: "1fr 1fr 1fr 1fr", rows: "1fr 1fr" };
  }
}

const DashboardView: Component = () => {
  const mode = () => layoutMode();
  const maxId = () => maximizedId();
  const termList = () => terminals();

  const gridStyle = createMemo(() => getGridStyle(mode()));

  const slots = createMemo(() => {
    const slotCount = mode();
    const currentTerminals = termList();
    const result: Array<{ type: 'terminal'; id: string } | { type: 'empty'; index: number }> = [];

    // Show ALL terminals, even if more than layout slots
    const visibleCount = Math.max(slotCount, currentTerminals.length);

    for (let i = 0; i < visibleCount; i++) {
      if (i < currentTerminals.length) {
        result.push({ type: 'terminal', id: currentTerminals[i].id });
      } else {
        result.push({ type: 'empty', index: i });
      }
    }

    return result;
  });

  // Dynamic grid style: auto-expand rows when terminals exceed layout slots
  const dynamicGridStyle = createMemo(() => {
    const base = gridStyle();
    const slotCount = mode();
    const termCount = termList().length;
    if (termCount <= slotCount) return base;

    // Calculate needed rows based on column count
    const colCount = mode() <= 2 ? mode() : mode() <= 4 ? 2 : mode() <= 6 ? 3 : 4;
    const neededRows = Math.ceil(termCount / colCount);
    return {
      columns: base.columns,
      rows: Array(neededRows).fill('1fr').join(' '),
    };
  });

  let dragFromIndex: number | null = null;

  function handleDragStart(index: number): void {
    dragFromIndex = index;
  }

  function handleDragOver(e: DragEvent): void {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(toIndex: number): void {
    if (dragFromIndex !== null && dragFromIndex !== toIndex) {
      reorderTerminals(dragFromIndex, toIndex);
    }
    dragFromIndex = null;
  }

  function handleDragEnd(): void {
    dragFromIndex = null;
  }

  function handleClose(id: string): void {
    api.closeTerminal(id).catch(() => {});
    removeTerminal(id);
  }

  function handleMaximize(id: string): void {
    setMaximized(maxId() === id ? null : id);
  }

  async function handleAddTerminal(): Promise<void> {
    const folder = activeFolder();
    if (!folder) return;
    const displayName = folder.split(/[/\\]/).pop() ?? folder;
    try {
      await openTerminal(folder, displayName);
    } catch (err) {
      // Failed to open terminal - user will see empty slot
    }
  }

  const maximizedTerminal = createMemo(() => {
    const mid = maxId();
    if (!mid) return null;
    return termList().find((t) => t.id === mid) ?? null;
  });

  return (
    <div class="dashboard-view">
      <LayoutSelector />

      <div
        class="terminal-grid"
        classList={{ "terminal-grid--has-maximized": !!maxId() }}
        style={{
          "grid-template-columns": maxId() ? "1fr" : dynamicGridStyle().columns,
          "grid-template-rows": maxId() ? "1fr" : dynamicGridStyle().rows,
        }}
      >
        <For each={termList()}>
          {(terminal, index) => {
            const isMaxed = () => maxId() === terminal.id;
            const isHidden = () => maxId() !== null && maxId() !== terminal.id;

            return (
              <div
                class="terminal-cell"
                classList={{
                  "terminal-cell--maximized": isMaxed(),
                  "terminal-cell--hidden": isHidden(),
                }}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(index())}
              >
                <PaneHeader
                  terminal={terminal}
                  onClose={() => handleClose(terminal.id)}
                  onMaximize={() => handleMaximize(terminal.id)}
                  isMaximized={isMaxed()}
                  onDragStart={() => handleDragStart(index())}
                  onDragEnd={handleDragEnd}
                />
                <TerminalPane terminalId={terminal.id} />
              </div>
            );
          }}
        </For>

        {/* Empty slots when no maximized pane */}
        <Show when={!maxId()}>
          <For each={Array.from({ length: Math.max(0, mode() - termList().length) })}>
            {() => (
              <div class="terminal-cell empty-slot">
                <button
                  class="empty-slot__add-btn"
                  onClick={handleAddTerminal}
                  title="打开新终端"
                >
                  <Plus size={24} />
                  <span>打开终端</span>
                </button>
              </div>
            )}
          </For>
        </Show>
      </div>
    </div>
  );
};

export default DashboardView;
