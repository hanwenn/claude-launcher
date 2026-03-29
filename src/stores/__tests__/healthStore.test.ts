import { describe, it, expect, vi, beforeEach } from "vitest";
import type { HealthResult } from "../../types";

vi.mock("../../lib/tauri-api", () => ({
  getFolders: vi.fn(),
  addFolder: vi.fn(),
  removeFolder: vi.fn(),
  getSessions: vi.fn(),
  checkDnsHealth: vi.fn(),
  launchClaude: vi.fn(),
}));

const tauriApi = await import("../../lib/tauri-api");

let healthStore: typeof import("../healthStore");

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

  healthStore = await import("../healthStore");
});

describe("checkHealth", () => {
  it("sets healthy result", async () => {
    const healthy: HealthResult = {
      status: "Healthy",
      resolved_ips: ["198.3.16.159"],
      expected_ip: "198.3.16.159",
      checked_at: "2026-03-28T12:00:00Z",
    };
    vi.mocked(tauriApi.checkDnsHealth).mockResolvedValue(healthy);

    await healthStore.checkHealth();

    expect(healthStore.healthResult()).toEqual(healthy);
    expect(healthStore.healthResult()!.status).toBe("Healthy");
    expect(healthStore.healthChecking()).toBe(false);
    expect(healthStore.healthDismissed()).toBe(false);
  });

  it("sets WrongIp result", async () => {
    const wrongIp: HealthResult = {
      status: { WrongIp: ["1.2.3.4"] },
      resolved_ips: ["1.2.3.4"],
      expected_ip: "198.3.16.159",
      checked_at: "2026-03-28T12:00:00Z",
    };
    vi.mocked(tauriApi.checkDnsHealth).mockResolvedValue(wrongIp);

    await healthStore.checkHealth();

    const result = healthStore.healthResult()!;
    expect(result.status).toEqual({ WrongIp: ["1.2.3.4"] });
    expect(result.resolved_ips).toEqual(["1.2.3.4"]);
    expect(healthStore.healthChecking()).toBe(false);
  });

  it("sets ResolutionFailed result", async () => {
    const failed: HealthResult = {
      status: { ResolutionFailed: "DNS lookup timed out" },
      resolved_ips: [],
      expected_ip: "198.3.16.159",
      checked_at: "2026-03-28T12:00:00Z",
    };
    vi.mocked(tauriApi.checkDnsHealth).mockResolvedValue(failed);

    await healthStore.checkHealth();

    const result = healthStore.healthResult()!;
    expect(result.status).toEqual({ ResolutionFailed: "DNS lookup timed out" });
    expect(result.resolved_ips).toEqual([]);
    expect(healthStore.healthChecking()).toBe(false);
  });

  it("handles check failure gracefully", async () => {
    vi.mocked(tauriApi.checkDnsHealth).mockRejectedValue(new Error("Network unreachable"));

    await healthStore.checkHealth();

    // healthResult stays null when the check itself throws
    expect(healthStore.healthResult()).toBeNull();
    expect(healthStore.healthChecking()).toBe(false);
  });
});

describe("dismissHealth", () => {
  it("sets dismissed signal to true", async () => {
    const healthy: HealthResult = {
      status: "Healthy",
      resolved_ips: ["198.3.16.159"],
      expected_ip: "198.3.16.159",
      checked_at: "2026-03-28T12:00:00Z",
    };
    vi.mocked(tauriApi.checkDnsHealth).mockResolvedValue(healthy);
    await healthStore.checkHealth();

    expect(healthStore.healthDismissed()).toBe(false);

    healthStore.dismissHealth();

    expect(healthStore.healthDismissed()).toBe(true);
  });

  it("checkHealth resets dismissed back to false", async () => {
    healthStore.dismissHealth();
    expect(healthStore.healthDismissed()).toBe(true);

    const healthy: HealthResult = {
      status: "Healthy",
      resolved_ips: ["198.3.16.159"],
      expected_ip: "198.3.16.159",
      checked_at: "2026-03-28T12:00:00Z",
    };
    vi.mocked(tauriApi.checkDnsHealth).mockResolvedValue(healthy);
    await healthStore.checkHealth();

    expect(healthStore.healthDismissed()).toBe(false);
  });
});
