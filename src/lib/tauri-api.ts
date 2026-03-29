import type { FolderInfo, SessionInfo, HealthResult } from "../types";

export async function getFolders(): Promise<FolderInfo[]> {
  return window.electronAPI.getFolders();
}

export async function addFolder(path: string): Promise<FolderInfo> {
  return window.electronAPI.addFolder(path);
}

export async function removeFolder(path: string): Promise<void> {
  return window.electronAPI.removeFolder(path);
}

export async function getSessions(folderPath: string): Promise<SessionInfo[]> {
  return window.electronAPI.getSessions(folderPath);
}

export async function checkDnsHealth(): Promise<HealthResult> {
  return window.electronAPI.checkDnsHealth();
}

export async function launchClaude(folder: string, sessionId?: string): Promise<void> {
  return window.electronAPI.launchClaude(folder, sessionId);
}

export async function createTerminal(options: {
  id: string;
  folder: string;
  folderDisplayName?: string;
  sessionId?: string;
  cliCommand?: string;
  cols?: number;
  rows?: number;
}): Promise<{ id: string }> {
  return window.electronAPI.createTerminal(options);
}

export async function writeTerminal(id: string, data: string): Promise<void> {
  return window.electronAPI.writeTerminal(id, data);
}

export async function resizeTerminal(id: string, cols: number, rows: number): Promise<void> {
  return window.electronAPI.resizeTerminal(id, cols, rows);
}

export async function closeTerminal(id: string): Promise<void> {
  return window.electronAPI.closeTerminal(id);
}

export async function replayTerminal(id: string): Promise<string> {
  return window.electronAPI.replayTerminal(id);
}

export function onTerminalOutput(callback: (payload: { id: string; data: string }) => void): () => void {
  return window.electronAPI.onTerminalOutput(callback);
}

export function onTerminalExit(callback: (payload: { id: string; exitCode: number }) => void): () => void {
  return window.electronAPI.onTerminalExit(callback);
}
