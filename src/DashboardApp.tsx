import type { Component } from "solid-js";
import { onMount, onCleanup, createMemo, createSignal, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { AlertTriangle } from "lucide-solid";
import {
  setupListeners,
  cleanupListeners,
  terminals,
  loadTerminalsFromMain,
  maximizedId,
  setMaximized,
  removeTerminal,
  setLayoutMode,
} from "./stores/terminalStore";
import { activeFolder } from "./stores/folderStore";
import { openTerminal } from "./stores/terminalStore";
import * as api from "./lib/tauri-api";
import { initTheme, cycleTheme } from "./stores/themeStore";
import DashboardView from "./components/DashboardView";
import ShortcutHelp from "./components/ShortcutHelp";
import CommandPalette from "./components/CommandPalette";

const DashboardApp: Component = () => {
  const [showCloseConfirm, setShowCloseConfirm] = createSignal(false);
  const [closeRunningCount, setCloseRunningCount] = createSignal(0);
  const [showShortcutHelp, setShowShortcutHelp] = createSignal(false);
  const [showCommandPalette, setShowCommandPalette] = createSignal(false);
  const [pendingCloseId, setPendingCloseId] = createSignal<string | null>(null);

  let cleanupConfirmClose: (() => void) | null = null;

  function handleGlobalKeyDown(e: KeyboardEvent): void {
    // F1 or Ctrl+? => show shortcut help
    if (e.key === "F1" || (e.ctrlKey && e.key === "?")) {
      e.preventDefault();
      setShowShortcutHelp((prev) => !prev);
      return;
    }

    // Ctrl+Shift+P => command palette
    if (e.ctrlKey && e.shiftKey && e.key === "P") {
      e.preventDefault();
      setShowCommandPalette((prev) => !prev);
      return;
    }

    // Ctrl+Shift+N => new terminal in current folder
    if (e.ctrlKey && e.shiftKey && e.key === "N") {
      e.preventDefault();
      handleNewTerminal();
      return;
    }

    // Ctrl+W => close active terminal (with confirm)
    if (e.ctrlKey && !e.shiftKey && e.key === "w") {
      e.preventDefault();
      handleCloseActiveTerminal();
      return;
    }

    // Ctrl+Tab => cycle through terminal panes
    if (e.ctrlKey && e.key === "Tab") {
      e.preventDefault();
      handleCycleTerminals();
      return;
    }

    // Ctrl+1..8 => switch to terminal pane
    if (e.ctrlKey && !e.shiftKey && e.key >= "1" && e.key <= "8") {
      e.preventDefault();
      const index = parseInt(e.key, 10) - 1;
      const termList = terminals();
      if (index < termList.length) {
        // If a different terminal is maximized, switch maximized view
        const targetId = termList[index].id;
        if (maximizedId() !== null) {
          setMaximized(targetId);
        }
        // Focus the terminal container (the actual xterm will handle focus)
        const cells = document.querySelectorAll('.terminal-cell');
        const cell = cells[index] as HTMLElement | undefined;
        if (cell) {
          const xtermEl = cell.querySelector('.xterm-helper-textarea') as HTMLElement | null;
          xtermEl?.focus();
        }
      }
      return;
    }

    // F11 => toggle maximize active pane
    if (e.key === "F11") {
      e.preventDefault();
      handleToggleMaximize();
      return;
    }

    // Escape => close search / restore from maximize / close modals
    if (e.key === "Escape") {
      if (showCommandPalette()) {
        setShowCommandPalette(false);
        return;
      }
      if (showShortcutHelp()) {
        setShowShortcutHelp(false);
        return;
      }
      if (pendingCloseId()) {
        setPendingCloseId(null);
        return;
      }
      if (maximizedId() !== null) {
        setMaximized(null);
        return;
      }
      // Search bar Escape is handled within TerminalPane itself
      return;
    }
  }

  function handleNewTerminal(): void {
    const folder = activeFolder();
    if (!folder) return;
    const displayName = folder.split(/[/\\]/).pop() ?? folder;
    openTerminal(folder, displayName).catch(() => {
      // Failed to open terminal
    });
  }

  function handleCloseActiveTerminal(): void {
    const termList = terminals();
    if (termList.length === 0) return;

    // Close maximized terminal, or last terminal
    const targetId = maximizedId() ?? termList[termList.length - 1].id;
    const target = termList.find((t) => t.id === targetId);
    if (!target) return;

    if (target.status === "running") {
      setPendingCloseId(targetId);
    } else {
      doCloseTerminal(targetId);
    }
  }

  function doCloseTerminal(id: string): void {
    api.closeTerminal(id).catch(() => {});
    removeTerminal(id);
    setPendingCloseId(null);
  }

  function handleCycleTerminals(): void {
    const termList = terminals();
    if (termList.length <= 1) return;

    const currentMaxId = maximizedId();
    if (currentMaxId !== null) {
      const idx = termList.findIndex((t) => t.id === currentMaxId);
      const nextIdx = (idx + 1) % termList.length;
      setMaximized(termList[nextIdx].id);
    }
  }

  function handleToggleMaximize(): void {
    const termList = terminals();
    if (termList.length === 0) return;

    if (maximizedId() !== null) {
      setMaximized(null);
    } else {
      // Maximize the first terminal
      setMaximized(termList[0].id);
    }
  }

  function handleSearchTerminal(): void {
    // Trigger Ctrl+F on the active terminal
    const event = new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true });
    document.dispatchEvent(event);
  }

  function handleSetLayout(mode: number): void {
    setLayoutMode(mode as 1 | 2 | 4 | 6 | 8);
  }

  function handleSwitchTerminal(index: number): void {
    const termList = terminals();
    if (index < termList.length) {
      const targetId = termList[index].id;
      if (maximizedId() !== null) {
        setMaximized(targetId);
      }
      const cells = document.querySelectorAll('.terminal-cell');
      const cell = cells[index] as HTMLElement | undefined;
      if (cell) {
        const xtermEl = cell.querySelector('.xterm-helper-textarea') as HTMLElement | null;
        xtermEl?.focus();
      }
    }
  }

  onMount(() => {
    initTheme();
    setupListeners();
    loadTerminalsFromMain();

    document.addEventListener("keydown", handleGlobalKeyDown);

    // Listen for close confirmation request from main process
    cleanupConfirmClose = window.electronAPI.onConfirmClose((payload: any) => {
      setCloseRunningCount(payload.runningCount || 0);
      setShowCloseConfirm(true);
    });
  });

  onCleanup(() => {
    cleanupListeners();
    document.removeEventListener("keydown", handleGlobalKeyDown);
    if (cleanupConfirmClose) cleanupConfirmClose();
  });

  function handleCancelClose() {
    setShowCloseConfirm(false);
  }

  function handleConfirmClose() {
    setShowCloseConfirm(false);
    window.electronAPI.forceCloseDashboard();
  }

  const activeCount = createMemo(() =>
    terminals().filter((t) => t.status === "running").length
  );

  const totalCount = createMemo(() => terminals().length);

  return (
    <div class="dashboard-app">
      <div class="dashboard-header">
        <span class="dashboard-header__title">Claude 终端仪表盘</span>
        <span class="dashboard-header__count">
          {activeCount()} 活跃 / {totalCount()} 总计
        </span>
      </div>
      <DashboardView />

      {/* Close confirmation dialog (window close) */}
      <Show when={showCloseConfirm()}>
        <Portal>
          <div class="dialog-overlay">
            <div class="close-confirm-dialog">
              <div class="close-confirm-dialog__icon">
                <AlertTriangle size={48} />
              </div>
              <h3 class="close-confirm-dialog__title">
                关闭终端仪表盘
              </h3>
              <p class="close-confirm-dialog__desc">
                当前有 <strong>{closeRunningCount()}</strong> 个终端正在运行，关闭仪表盘将终止所有会话。
              </p>
              <div class="close-confirm-dialog__actions">
                <button
                  class="close-confirm-dialog__btn close-confirm-dialog__btn--cancel"
                  onClick={handleCancelClose}
                >
                  继续使用
                </button>
                <button
                  class="close-confirm-dialog__btn close-confirm-dialog__btn--confirm"
                  onClick={handleConfirmClose}
                >
                  关闭所有终端
                </button>
              </div>
            </div>
          </div>
        </Portal>
      </Show>

      {/* Close terminal confirmation (Ctrl+W on running terminal) */}
      <Show when={pendingCloseId()}>
        <Portal>
          <div class="dialog-overlay">
            <div class="close-confirm-dialog">
              <div class="close-confirm-dialog__icon">
                <AlertTriangle size={48} />
              </div>
              <h3 class="close-confirm-dialog__title">
                Close Running Terminal?
              </h3>
              <p class="close-confirm-dialog__desc">
                This terminal is still running. Are you sure you want to close it?
              </p>
              <div class="close-confirm-dialog__actions">
                <button
                  class="close-confirm-dialog__btn close-confirm-dialog__btn--cancel"
                  onClick={() => setPendingCloseId(null)}
                >
                  Cancel
                </button>
                <button
                  class="close-confirm-dialog__btn close-confirm-dialog__btn--confirm"
                  onClick={() => doCloseTerminal(pendingCloseId()!)}
                >
                  Close Terminal
                </button>
              </div>
            </div>
          </div>
        </Portal>
      </Show>

      {/* Command Palette */}
      <Show when={showCommandPalette()}>
        <Portal>
          <CommandPalette
            onClose={() => setShowCommandPalette(false)}
            onNewTerminal={handleNewTerminal}
            onCloseTerminal={handleCloseActiveTerminal}
            onToggleMaximize={handleToggleMaximize}
            onSearchTerminal={handleSearchTerminal}
            onSetLayout={handleSetLayout}
            onSwitchTerminal={handleSwitchTerminal}
            onShowShortcuts={() => setShowShortcutHelp(true)}
            onToggleTheme={cycleTheme}
          />
        </Portal>
      </Show>

      {/* Shortcut help modal */}
      <Show when={showShortcutHelp()}>
        <Portal>
          <ShortcutHelp onClose={() => setShowShortcutHelp(false)} />
        </Portal>
      </Show>
    </div>
  );
};

export default DashboardApp;
