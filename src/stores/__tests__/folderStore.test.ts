import { describe, it, expect, vi, beforeEach } from "vitest";
import type { FolderInfo } from "../../types";

vi.mock("../../lib/tauri-api", () => ({
  getFolders: vi.fn(),
  addFolder: vi.fn(),
  removeFolder: vi.fn(),
  getSessions: vi.fn(),
  checkDnsHealth: vi.fn(),
  launchClaude: vi.fn(),
}));

// Must import after mock is set up
const tauriApi = await import("../../lib/tauri-api");

// Each test needs a fresh module to reset signals
let folderStore: typeof import("../folderStore");

beforeEach(async () => {
  vi.clearAllMocks();
  // Re-import to reset signal state
  vi.resetModules();

  // Re-mock after resetModules
  vi.doMock("../../lib/tauri-api", () => ({
    getFolders: tauriApi.getFolders,
    addFolder: tauriApi.addFolder,
    removeFolder: tauriApi.removeFolder,
    getSessions: tauriApi.getSessions,
    checkDnsHealth: tauriApi.checkDnsHealth,
    launchClaude: tauriApi.launchClaude,
  }));

  folderStore = await import("../folderStore");
});

const mockFolders: readonly FolderInfo[] = [
  { path: "D:\\project1", display_name: "project1", session_count: 3, last_active: "2026-03-28T10:00:00Z" },
  { path: "D:\\project2", display_name: "project2", session_count: 1, last_active: "2026-03-27T08:00:00Z" },
];

describe("loadFolders", () => {
  it("populates folders signal on success", async () => {
    vi.mocked(tauriApi.getFolders).mockResolvedValue([...mockFolders]);

    await folderStore.loadFolders();

    expect(folderStore.folders()).toHaveLength(2);
    expect(folderStore.folders()[0].path).toBe("D:\\project1");
    expect(folderStore.foldersLoading()).toBe(false);
  });

  it("sets empty array on error", async () => {
    vi.mocked(tauriApi.getFolders).mockRejectedValue(new Error("Network error"));

    await folderStore.loadFolders();

    expect(folderStore.folders()).toEqual([]);
    expect(folderStore.foldersLoading()).toBe(false);
  });
});

describe("addNewFolder", () => {
  it("appends new folder to list", async () => {
    vi.mocked(tauriApi.getFolders).mockResolvedValue([...mockFolders]);
    await folderStore.loadFolders();

    const newFolder: FolderInfo = {
      path: "D:\\project3",
      display_name: "project3",
      session_count: 0,
      last_active: null,
    };
    vi.mocked(tauriApi.addFolder).mockResolvedValue(newFolder);

    const result = await folderStore.addNewFolder("D:\\project3");

    expect(result).toEqual(newFolder);
    expect(folderStore.folders()).toHaveLength(3);
    expect(folderStore.folders()[2].path).toBe("D:\\project3");
  });
});

describe("removeFolderByPath", () => {
  it("removes folder from list", async () => {
    vi.mocked(tauriApi.getFolders).mockResolvedValue([...mockFolders]);
    await folderStore.loadFolders();

    vi.mocked(tauriApi.removeFolder).mockResolvedValue(undefined);

    await folderStore.removeFolderByPath("D:\\project1");

    expect(folderStore.folders()).toHaveLength(1);
    expect(folderStore.folders()[0].path).toBe("D:\\project2");
  });

  it("clears activeFolder if removed folder was active", async () => {
    vi.mocked(tauriApi.getFolders).mockResolvedValue([...mockFolders]);
    vi.mocked(tauriApi.getSessions).mockResolvedValue([]);
    await folderStore.loadFolders();

    folderStore.selectFolder("D:\\project1");
    expect(folderStore.activeFolder()).toBe("D:\\project1");

    vi.mocked(tauriApi.removeFolder).mockResolvedValue(undefined);
    await folderStore.removeFolderByPath("D:\\project1");

    expect(folderStore.activeFolder()).toBeNull();
  });
});

describe("selectFolder", () => {
  it("updates activeFolder signal", () => {
    vi.mocked(tauriApi.getSessions).mockResolvedValue([]);

    folderStore.selectFolder("D:\\myproject");

    expect(folderStore.activeFolder()).toBe("D:\\myproject");
  });
});
