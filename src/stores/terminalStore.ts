import { createSignal } from "solid-js";
import type { TerminalInstance, LayoutMode } from "../types";
import * as api from "../lib/tauri-api";

const [terminals, setTerminals] = createSignal<readonly TerminalInstance[]>([]);
const [layoutMode, setLayoutMode] = createSignal<LayoutMode>(1);
const [maximizedId, setMaximized] = createSignal<string | null>(null);

export { terminals, layoutMode, maximizedId, setLayoutMode, setMaximized };

// Output emitter: routes terminal data to subscribers without reactive signals
const outputEmitters = new Map<string, Set<(data: string) => void>>();

export function subscribeOutput(id: string, callback: (data: string) => void): void {
  const existing = outputEmitters.get(id);
  if (existing) {
    existing.add(callback);
  } else {
    outputEmitters.set(id, new Set([callback]));
  }
}

export function unsubscribeOutput(id: string, callback: (data: string) => void): void {
  const listeners = outputEmitters.get(id);
  if (listeners) {
    listeners.delete(callback);
    if (listeners.size === 0) {
      outputEmitters.delete(id);
    }
  }
}

function emitOutput(id: string, data: string): void {
  const listeners = outputEmitters.get(id);
  if (listeners) {
    listeners.forEach((cb) => cb(data));
  }
}

export function addTerminal(terminal: TerminalInstance): void {
  // Avoid duplicates
  setTerminals((prev) => {
    if (prev.some((t) => t.id === terminal.id)) return prev;
    return [...prev, terminal];
  });
}

export function reorderTerminals(fromIndex: number, toIndex: number): void {
  setTerminals((prev) => {
    const items = [...prev];
    const [moved] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, moved);
    return items;
  });
}

export function removeTerminal(id: string): void {
  setTerminals((prev) => prev.filter((t) => t.id !== id));
  outputEmitters.delete(id);
  if (maximizedId() === id) {
    setMaximized(null);
  }
}

export function updateTerminalStatus(id: string, status: 'running' | 'exited', exitCode: number | null): void {
  setTerminals((prev) =>
    prev.map((t) =>
      t.id === id ? { ...t, status, exitCode } : t
    )
  );
}

function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Open a terminal - called from Launcher window.
 * Creates terminal via IPC (main process spawns pty).
 */
export async function openTerminal(
  folder: string,
  displayName: string,
  sessionId?: string
): Promise<string> {
  const id = generateId();

  await api.createTerminal({
    id,
    folder,
    folderDisplayName: displayName,
    sessionId,
    cols: 80,
    rows: 24,
  });

  return id;
}

/**
 * Load existing terminals from main process - called by Dashboard on startup.
 */
export async function loadTerminalsFromMain(): Promise<void> {
  try {
    const list = await window.electronAPI.getTerminalList();
    for (const meta of list) {
      addTerminal({
        id: meta.id,
        folder: meta.folder,
        folderDisplayName: meta.folderDisplayName || meta.folder,
        sessionId: meta.sessionId || null,
        status: meta.status || 'running',
        exitCode: meta.exitCode ?? null,
      });
    }
    // Auto-adjust layout to fit terminal count
    autoAdjustLayout();
  } catch (err) {
    // ignore - dashboard may start before any terminals exist
  }
}

/**
 * Auto-adjust layout mode to best fit the current terminal count.
 */
export function autoAdjustLayout(): void {
  const count = terminals().length;
  if (count <= 1) setLayoutMode(1);
  else if (count <= 2) setLayoutMode(2);
  else if (count <= 4) setLayoutMode(4);
  else if (count <= 6) setLayoutMode(6);
  else setLayoutMode(8);
}

let cleanupOutputListener: (() => void) | null = null;
let cleanupExitListener: (() => void) | null = null;
let cleanupCreatedListener: (() => void) | null = null;

export function setupListeners(): void {
  // Listen for terminal output
  cleanupOutputListener = api.onTerminalOutput((payload) => {
    emitOutput(payload.id, payload.data);
  });

  // Listen for terminal exit
  cleanupExitListener = api.onTerminalExit((payload) => {
    updateTerminalStatus(payload.id, 'exited', payload.exitCode);
  });

  // Listen for new terminals created (from Launcher window via main process)
  cleanupCreatedListener = window.electronAPI.onTerminalCreated((meta) => {
    addTerminal({
      id: meta.id,
      folder: meta.folder,
      folderDisplayName: meta.folderDisplayName || meta.folder,
      sessionId: meta.sessionId || null,
      status: 'running',
      exitCode: null,
    });
    autoAdjustLayout();
  });
}

export function cleanupListeners(): void {
  if (cleanupOutputListener) { cleanupOutputListener(); cleanupOutputListener = null; }
  if (cleanupExitListener) { cleanupExitListener(); cleanupExitListener = null; }
  if (cleanupCreatedListener) { cleanupCreatedListener(); cleanupCreatedListener = null; }
}
