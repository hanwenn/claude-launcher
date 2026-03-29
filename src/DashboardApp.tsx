import type { Component } from "solid-js";
import { onMount, onCleanup, createMemo, createSignal, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { AlertTriangle } from "lucide-solid";
import { setupListeners, cleanupListeners, terminals, loadTerminalsFromMain } from "./stores/terminalStore";
import DashboardView from "./components/DashboardView";

const DashboardApp: Component = () => {
  const [showCloseConfirm, setShowCloseConfirm] = createSignal(false);
  const [closeRunningCount, setCloseRunningCount] = createSignal(0);

  let cleanupConfirmClose: (() => void) | null = null;

  onMount(() => {
    setupListeners();
    loadTerminalsFromMain();

    // Listen for close confirmation request from main process
    cleanupConfirmClose = window.electronAPI.onConfirmClose((payload: any) => {
      setCloseRunningCount(payload.runningCount || 0);
      setShowCloseConfirm(true);
    });
  });

  onCleanup(() => {
    cleanupListeners();
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
    </div>
  );
};

export default DashboardApp;
