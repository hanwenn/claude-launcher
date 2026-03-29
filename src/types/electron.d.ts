import type { FolderInfo, SessionInfo, HealthResult } from "./index";

declare global {
  interface Window {
    electronAPI: {
      getFolders: () => Promise<FolderInfo[]>;
      addFolder: (path: string) => Promise<FolderInfo>;
      removeFolder: (path: string) => Promise<void>;
      getSessions: (folderPath: string) => Promise<SessionInfo[]>;
      checkDnsHealth: () => Promise<HealthResult>;
      getExpectedIp: () => Promise<string>;
      setExpectedIp: (ip: string) => Promise<string>;
      launchClaude: (folder: string, sessionId?: string) => Promise<void>;
      openFolderDialog: () => Promise<string | null>;
      createTerminal: (options: { id: string; folder: string; folderDisplayName?: string; sessionId?: string; cliCommand?: string; cols?: number; rows?: number }) => Promise<{ id: string }>;
      writeTerminal: (id: string, data: string) => Promise<void>;
      resizeTerminal: (id: string, cols: number, rows: number) => Promise<void>;
      closeTerminal: (id: string) => Promise<void>;
      replayTerminal: (id: string) => Promise<string>;
      onTerminalOutput: (callback: (payload: { id: string; data: string }) => void) => () => void;
      onTerminalExit: (callback: (payload: { id: string; exitCode: number }) => void) => () => void;
      openDashboard: () => Promise<void>;
      forceCloseDashboard: () => Promise<void>;
      onConfirmClose: (callback: (payload: { runningCount: number }) => void) => () => void;
      checkDependencies: () => Promise<Record<string, any>>;
      installDependency: (cmd: string) => Promise<{ launched: boolean; command: string }>;
      recheckDependencies: () => Promise<Record<string, any>>;
      isFirstRun: () => Promise<boolean>;
      markDepsChecked: () => Promise<void>;
      getTerminalList: () => Promise<any[]>;
      getActiveSessions: () => Promise<string[]>;
      onTerminalCreated: (callback: (payload: any) => void) => () => void;
    };
  }
}

export {};
