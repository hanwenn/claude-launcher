import { createSignal } from "solid-js";
import type { HealthResult } from "../types";
import * as api from "../lib/tauri-api";

const [healthResult, setHealthResult] = createSignal<HealthResult | null>(null);
const [healthDismissed, setHealthDismissed] = createSignal(false);
const [healthChecking, setHealthChecking] = createSignal(false);

export { healthResult, healthDismissed, healthChecking };

export async function checkHealth(): Promise<void> {
  setHealthChecking(true);
  try {
    const result = await api.checkDnsHealth();
    setHealthResult(result);
    setHealthDismissed(false);
  } catch (err) {
    console.error("Health check failed:", err);
  } finally {
    setHealthChecking(false);
  }
}

export function dismissHealth(): void {
  setHealthDismissed(true);
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startHealthPolling(intervalMs: number = 300_000): void {
  stopHealthPolling();
  checkHealth();
  intervalId = setInterval(() => {
    checkHealth();
  }, intervalMs);
}

export function stopHealthPolling(): void {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
