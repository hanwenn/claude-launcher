import { createSignal } from "solid-js";
import type { AgentProfile } from "../types";
import * as api from "../lib/tauri-api";

const DEFAULT_AGENTS: readonly AgentProfile[] = [
  { id: 'claude', name: 'Claude Code', command: 'claude', color: '#bc8cff', icon: 'brain', resumeFlag: '--resume' },
];

const [agents, setAgents] = createSignal<readonly AgentProfile[]>(DEFAULT_AGENTS);
const [selectedAgentId, setSelectedAgentId] = createSignal<string>('claude');

export { agents, selectedAgentId, setSelectedAgentId };

export function selectedAgent(): AgentProfile {
  const id = selectedAgentId();
  const found = agents().find((a) => a.id === id);
  return found ?? agents()[0];
}

export async function loadAgents(): Promise<void> {
  try {
    const [agentList, defaultId] = await Promise.all([
      api.getAgents(),
      api.getDefaultAgent(),
    ]);
    if (agentList.length > 0) {
      setAgents(agentList);
    }
    if (defaultId) {
      setSelectedAgentId(defaultId);
    }
  } catch (_err) {
    // Use defaults on error
  }
}
