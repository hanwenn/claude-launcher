import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SessionInfo } from "../../types";

vi.mock("../../lib/tauri-api", () => ({
  getFolders: vi.fn(),
  addFolder: vi.fn(),
  removeFolder: vi.fn(),
  getSessions: vi.fn(),
  checkDnsHealth: vi.fn(),
  launchClaude: vi.fn(),
}));

const tauriApi = await import("../../lib/tauri-api");

let sessionStore: typeof import("../sessionStore");

beforeEach(async () => {
  vi.clearAllMocks();
  vi.resetModules();

  vi.doMock("../../lib/tauri-api", () => ({
    getFolders: tauriApi.getFolders,
    addFolder: tauriApi.addFolder,
    removeFolder: tauriApi.removeFolder,
    getSessions: tauriApi.getSessions,
    checkDnsHealth: tauriApi.checkDnsHealth,
    launchClaude: tauriApi.launchClaude,
  }));

  sessionStore = await import("../sessionStore");
});

const mockSessions: SessionInfo[] = [
  { id: "s1", timestamp: "2026-03-26T10:00:00Z", model: "claude-3", summary: "First session", message_count: 5 },
  { id: "s2", timestamp: "2026-03-28T12:00:00Z", model: "claude-3", summary: "Latest session", message_count: 10 },
  { id: "s3", timestamp: "2026-03-27T08:00:00Z", model: null, summary: "Middle session", message_count: 3 },
];

describe("loadSessions", () => {
  it("populates sessions sorted by date descending on success", async () => {
    vi.mocked(tauriApi.getSessions).mockResolvedValue([...mockSessions]);

    await sessionStore.loadSessions("D:\\project");

    const sessions = sessionStore.sessions();
    expect(sessions).toHaveLength(3);
    expect(sessions[0].id).toBe("s2"); // latest
    expect(sessions[1].id).toBe("s3"); // middle
    expect(sessions[2].id).toBe("s1"); // oldest
    expect(sessionStore.sessionsLoading()).toBe(false);
    expect(sessionStore.sessionsError()).toBeNull();
  });

  it("sets empty array and error signal on failure", async () => {
    vi.mocked(tauriApi.getSessions).mockRejectedValue(new Error("Parse error"));

    await sessionStore.loadSessions("D:\\project");

    expect(sessionStore.sessions()).toEqual([]);
    expect(sessionStore.sessionsError()).toContain("Parse error");
    expect(sessionStore.sessionsLoading()).toBe(false);
  });
});

describe("clearSessions", () => {
  it("resets sessions to empty array", async () => {
    vi.mocked(tauriApi.getSessions).mockResolvedValue([...mockSessions]);
    await sessionStore.loadSessions("D:\\project");
    expect(sessionStore.sessions()).toHaveLength(3);

    sessionStore.clearSessions();

    expect(sessionStore.sessions()).toEqual([]);
  });
});
