import { createSignal } from "solid-js";
import type { SessionInfo } from "../types";
import * as api from "../lib/tauri-api";

const [sessions, setSessions] = createSignal<readonly SessionInfo[]>([]);
const [sessionsLoading, setSessionsLoading] = createSignal(false);
const [sessionsError, setSessionsError] = createSignal<string | null>(null);

export { sessions, sessionsLoading, sessionsError };

export async function loadSessions(folderPath: string): Promise<void> {
  setSessionsLoading(true);
  setSessionsError(null);
  try {
    const result = await api.getSessions(folderPath);
    const sorted = [...result].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    setSessions(sorted);
  } catch (err) {
    console.error("Failed to load sessions:", err);
    setSessionsError(String(err));
    setSessions([]);
  } finally {
    setSessionsLoading(false);
  }
}

export function clearSessions(): void {
  setSessions([]);
}

const [activeSessions, setActiveSessions] = createSignal<readonly string[]>([]);
export { activeSessions };

/** Immediately mark a session as active (optimistic update, no waiting for backend poll) */
export function markSessionActive(sessionId: string): void {
  if (sessionId && !activeSessions().includes(sessionId)) {
    setActiveSessions((prev) => [...prev, sessionId]);
  }
}

export async function refreshActiveSessions(): Promise<void> {
  try {
    const list = await window.electronAPI.getActiveSessions();
    setActiveSessions(list);
  } catch {
    setActiveSessions([]);
  }
}
