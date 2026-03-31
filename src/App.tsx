import type { Component } from "solid-js";
import { createSignal, onMount, onCleanup, Show } from "solid-js";
import { loadFolders, addNewFolder } from "./stores/folderStore";
import { startHealthPolling, stopHealthPolling } from "./stores/healthStore";
import { refreshActiveSessions } from "./stores/sessionStore";
import HealthBanner from "./components/HealthBanner";
import FolderList from "./components/FolderList";
import SessionList from "./components/SessionList";
import AddFolderDialog from "./components/AddFolderDialog";
import DependencyCheck from "./components/DependencyCheck";
import ActiveTerminals from "./components/ActiveTerminals";

const App: Component = () => {
  const [dialogOpen, setDialogOpen] = createSignal(false);
  const [deps, setDeps] = createSignal<Record<string, any> | null>(null);
  const [showDepCheck, setShowDepCheck] = createSignal(true);

  let activeInterval: ReturnType<typeof setInterval> | null = null;

  onMount(async () => {
    // Only show dependency check on first run
    try {
      const firstRun = await window.electronAPI.isFirstRun();
      if (firstRun) {
        const result = await window.electronAPI.checkDependencies();
        setDeps(result);
        const allRequired = Object.values(result).every(
          (d: any) => !d.required || d.status === "installed"
        );
        if (allRequired) {
          // All good — show briefly then auto-dismiss
          setTimeout(() => {
            setShowDepCheck(false);
            window.electronAPI.markDepsChecked();
          }, 1500);
        }
      } else {
        setShowDepCheck(false);
      }
    } catch (_) {
      setShowDepCheck(false);
    }

    loadFolders();
    startHealthPolling();
    refreshActiveSessions();
    activeInterval = setInterval(() => refreshActiveSessions(), 2000);
  });

  onCleanup(() => {
    stopHealthPolling();
    if (activeInterval) clearInterval(activeInterval);
  });

  async function handleAddFolder(path: string): Promise<void> {
    await addNewFolder(path);
  }

  async function handleRecheck() {
    try {
      const result = await window.electronAPI.recheckDependencies();
      setDeps(result);
    } catch (_) {
      // best-effort
    }
  }

  function handleDepContinue() {
    setShowDepCheck(false);
    window.electronAPI.markDepsChecked();
  }

  return (
    <div class="app-layout">
      <Show when={showDepCheck() && deps()}>
        <DependencyCheck
          deps={deps()!}
          onContinue={handleDepContinue}
          onRecheck={handleRecheck}
        />
      </Show>
      <HealthBanner />
      <FolderList onAddFolder={() => setDialogOpen(true)} />
      <div class="main-area">
        <SessionList />
        <ActiveTerminals />
      </div>
      <AddFolderDialog
        isOpen={dialogOpen()}
        onClose={() => setDialogOpen(false)}
        onConfirm={handleAddFolder}
      />
    </div>
  );
};

export default App;
