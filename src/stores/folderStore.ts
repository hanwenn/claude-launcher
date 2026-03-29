import { createSignal } from "solid-js";
import type { FolderInfo } from "../types";
import * as api from "../lib/tauri-api";
import { loadSessions } from "./sessionStore";

const [folders, setFolders] = createSignal<readonly FolderInfo[]>([]);
const [activeFolder, setActiveFolder] = createSignal<string | null>(null);
const [foldersLoading, setFoldersLoading] = createSignal(false);

export { folders, activeFolder, foldersLoading };

export async function loadFolders(): Promise<void> {
  setFoldersLoading(true);
  try {
    const result = await api.getFolders();
    setFolders(result);
  } catch (err) {
    console.error("Failed to load folders:", err);
    setFolders([]);
  } finally {
    setFoldersLoading(false);
  }
}

export async function addNewFolder(path: string): Promise<FolderInfo> {
  const folder = await api.addFolder(path);
  setFolders((prev) => [...prev, folder]);
  return folder;
}

export async function removeFolderByPath(path: string): Promise<void> {
  await api.removeFolder(path);
  setFolders((prev) => prev.filter((f) => f.path !== path));
  if (activeFolder() === path) {
    setActiveFolder(null);
  }
}

export function selectFolder(path: string): void {
  setActiveFolder(path);
  loadSessions(path).catch((err) => {
    console.error("Failed to load sessions for folder:", err);
  });
}
