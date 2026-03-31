const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Folder operations
  getFolders: () => ipcRenderer.invoke('get-folders'),
  addFolder: (path) => ipcRenderer.invoke('add-folder', path),
  removeFolder: (path) => ipcRenderer.invoke('remove-folder', path),

  // Session operations
  getSessions: (folderPath) => ipcRenderer.invoke('get-sessions', folderPath),
  getSessionDetail: (sessionId, folderPath) => ipcRenderer.invoke('get-session-detail', sessionId, folderPath),

  // Network operations
  checkDnsHealth: () => ipcRenderer.invoke('check-dns-health'),
  getExpectedIp: () => ipcRenderer.invoke('get-expected-ip'),
  setExpectedIp: (ip) => ipcRenderer.invoke('set-expected-ip', ip),

  // Launcher operations
  launchClaude: (folder, sessionId) => ipcRenderer.invoke('launch-claude', folder, sessionId),

  // Agent operations
  getAgents: () => ipcRenderer.invoke('get-agents'),
  getDefaultAgent: () => ipcRenderer.invoke('get-default-agent'),

  // Terminal operations
  createTerminal: (options) => ipcRenderer.invoke('terminal:create', options),
  writeTerminal: (id, data) => ipcRenderer.invoke('terminal:input', { id, data }),
  resizeTerminal: (id, cols, rows) => ipcRenderer.invoke('terminal:resize', { id, cols, rows }),
  closeTerminal: (id) => ipcRenderer.invoke('terminal:close', { id }),
  replayTerminal: (id) => ipcRenderer.invoke('terminal:replay', { id }),
  onTerminalOutput: (callback) => {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on('terminal:output', handler);
    return () => ipcRenderer.removeListener('terminal:output', handler);
  },
  onTerminalExit: (callback) => {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on('terminal:exit', handler);
    return () => ipcRenderer.removeListener('terminal:exit', handler);
  },

  // Dashboard
  openDashboard: () => ipcRenderer.invoke('open-dashboard'),
  forceCloseDashboard: () => ipcRenderer.invoke('dashboard:force-close'),
  onConfirmClose: (callback) => {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on('dashboard:confirm-close', handler);
    return () => ipcRenderer.removeListener('dashboard:confirm-close', handler);
  },
  getTerminalList: () => ipcRenderer.invoke('terminal:list'),
  onTerminalCreated: (callback) => {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on('terminal:created', handler);
    return () => ipcRenderer.removeListener('terminal:created', handler);
  },

  // Active sessions
  getActiveSessions: () => ipcRenderer.invoke('terminal:active-sessions'),

  // Dependencies
  checkDependencies: () => ipcRenderer.invoke('deps:check-all'),
  installDependency: (cmd) => ipcRenderer.invoke('deps:install', cmd),
  recheckDependencies: () => ipcRenderer.invoke('deps:recheck'),
  isFirstRun: () => ipcRenderer.invoke('deps:is-first-run'),
  markDepsChecked: () => ipcRenderer.invoke('deps:mark-checked'),

  // Dialog
  openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
});
