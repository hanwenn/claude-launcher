export interface FolderInfo {
  readonly path: string;
  readonly display_name: string;
  readonly session_count: number;
  readonly last_active: string | null;
}

export interface SessionInfo {
  readonly id: string;
  readonly timestamp: string;
  readonly model: string | null;
  readonly summary: string;
  readonly message_count: number;
}

export interface HealthResult {
  readonly status: "Healthy" | { WrongIp: string[] } | { ResolutionFailed: string };
  readonly resolved_ips: string[];
  readonly expected_ip: string;
  readonly checked_at: string;
}

export interface AgentProfile {
  readonly id: string;
  readonly name: string;
  readonly command: string;
  readonly color: string;
  readonly icon: string;
  readonly resumeFlag: string;
}

export interface TerminalInstance {
  readonly id: string;
  readonly folder: string;
  readonly folderDisplayName: string;
  readonly sessionId: string | null;
  readonly status: 'running' | 'exited';
  readonly exitCode: number | null;
  readonly agentId: string;
  readonly agentName: string;
  readonly agentColor: string;
}

export type LayoutMode = 1 | 2 | 4 | 6 | 8;
