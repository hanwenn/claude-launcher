const configService = require('../services/configService');
const { TerminalManager } = require('../services/terminalManager');

const manager = new TerminalManager();

// Output batching: accumulate per-terminal output and flush every 16ms
const outputBuffers = new Map(); // id -> accumulated string
const flushTimers = new Map();  // id -> timeout handle

function flushOutput(id, getDashboardWindow) {
  const buffer = outputBuffers.get(id);
  if (buffer && buffer.length > 0) {
    const win = getDashboardWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('terminal:output', { id, data: buffer });
    }
    outputBuffers.set(id, '');
  }
  flushTimers.delete(id);
}

function cleanupBuffers(id) {
  const timer = flushTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    flushTimers.delete(id);
  }
  outputBuffers.delete(id);
}

/**
 * Register IPC handlers for terminal operations.
 * @param {Electron.IpcMain} ipcMain
 * @param {function} getDashboardWindow - Returns the dashboard BrowserWindow instance
 * @param {function} openDashboardWindow - Opens or focuses the dashboard window
 */
// Track terminal metadata for dashboard synchronization
const terminalMetas = new Map(); // id -> { id, folder, folderDisplayName, sessionId, status, exitCode }

function getTerminalList() {
  return Array.from(terminalMetas.values());
}

function registerTerminalHandlers(ipcMain, getDashboardWindow, openDashboardWindow) {
  // Dashboard requests the current terminal list on startup
  ipcMain.handle('terminal:list', async () => {
    return getTerminalList();
  });

  // Return list of active (running) session IDs for Launcher
  ipcMain.handle('terminal:active-sessions', async () => {
    return Array.from(terminalMetas.values())
      .filter(m => m.sessionId && m.status === 'running')
      .map(m => m.sessionId);
  });
  ipcMain.handle('terminal:create', async (_event, options) => {
    try {
      const { id, folder, sessionId, folderDisplayName, cols, rows } = options || {};

      if (!id || typeof id !== 'string') {
        throw new Error('Terminal id is required');
      }

      // Validate folder is in configured list
      const config = configService.loadConfig();
      if (!config.folders.some((f) => f === folder)) {
        throw new Error('Folder not in configured list');
      }

      const cliCommand = config.claude_cli_command || 'claude';
      const safeCols = cols || 80;
      const safeRows = rows || 24;
      const displayName = folderDisplayName || require('path').basename(folder);

      // Save terminal metadata
      const meta = {
        id,
        folder,
        folderDisplayName: displayName,
        sessionId: sessionId || null,
        status: 'running',
        exitCode: null,
      };
      terminalMetas.set(id, meta);

      // Ensure dashboard window is open
      openDashboardWindow();

      // Set up batched output forwarding
      outputBuffers.set(id, '');

      const onData = (data) => {
        const existing = outputBuffers.get(id) || '';
        outputBuffers.set(id, existing + data);
        if (!flushTimers.has(id)) {
          flushTimers.set(
            id,
            setTimeout(() => flushOutput(id, getDashboardWindow), 16)
          );
        }
      };

      const onExit = ({ exitCode }) => {
        flushOutput(id, getDashboardWindow);
        cleanupBuffers(id);

        // Update metadata
        const m = terminalMetas.get(id);
        if (m) {
          terminalMetas.set(id, { ...m, status: 'exited', exitCode });
        }

        const win = getDashboardWindow();
        if (win && !win.isDestroyed()) {
          win.webContents.send('terminal:exit', { id, exitCode });
        }
      };

      const result = manager.create(
        id,
        { folder, cliCommand, sessionId, cols: safeCols, rows: safeRows },
        onData,
        onExit
      );

      // Notify dashboard about new terminal
      // Use a short delay to ensure dashboard window is ready
      setTimeout(() => {
        const win = getDashboardWindow();
        if (win && !win.isDestroyed()) {
          win.webContents.send('terminal:created', meta);
        }
      }, 500);

      return { success: true, ...result };
    } catch (err) {
      throw new Error(`Failed to create terminal: ${err.message}`);
    }
  });

  ipcMain.handle('terminal:input', async (_event, { id, data }) => {
    try {
      manager.write(id, data);
      return { success: true };
    } catch (err) {
      throw new Error(`Failed to write to terminal: ${err.message}`);
    }
  });

  ipcMain.handle('terminal:resize', async (_event, { id, cols, rows }) => {
    try {
      manager.resize(id, cols, rows);
      return { success: true };
    } catch (err) {
      throw new Error(`Failed to resize terminal: ${err.message}`);
    }
  });

  ipcMain.handle('terminal:close', async (_event, { id }) => {
    try {
      cleanupBuffers(id);
      manager.close(id);
      terminalMetas.delete(id);
      return { success: true };
    } catch (err) {
      throw new Error(`Failed to close terminal: ${err.message}`);
    }
  });

  ipcMain.handle('terminal:replay', async (_event, { id }) => {
    try {
      const buffer = manager.getReplayBuffer(id);
      return { success: true, data: buffer };
    } catch (err) {
      throw new Error(`Failed to get replay buffer: ${err.message}`);
    }
  });
}

module.exports = { registerTerminalHandlers, manager };
