const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Import service handlers
const { registerFolderHandlers } = require('./handlers/folders');
const { registerSessionHandlers } = require('./handlers/sessions');
const { registerNetworkHandlers } = require('./handlers/network');
const { registerLauncherHandlers } = require('./handlers/launcher');
const { registerTerminalHandlers, manager: terminalManager } = require('./handlers/terminal');
const { registerDependencyHandlers } = require('./handlers/dependencies');

let mainWindow;
let dashboardWindow = null;

function isDev() {
  const distPath = path.join(__dirname, '../dist/index.html');
  return !fs.existsSync(distPath) || process.env.VITE_DEV === '1';
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    title: 'Claude Launcher',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#0d1117',
    autoHideMenuBar: true,
  });

  if (isDev()) {
    mainWindow.loadURL('http://localhost:1420');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

function openDashboardWindow() {
  if (dashboardWindow && !dashboardWindow.isDestroyed()) {
    dashboardWindow.focus();
    return;
  }

  dashboardWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    title: 'Claude 终端仪表盘',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#0d1117',
    autoHideMenuBar: true,
  });

  if (isDev()) {
    dashboardWindow.loadURL('http://localhost:1420/dashboard.html');
  } else {
    dashboardWindow.loadFile(path.join(__dirname, '../dist/dashboard.html'));
  }

  if (process.env.NODE_ENV === 'development') {
    dashboardWindow.webContents.openDevTools();
  }

  // Intercept close: if terminals are running, ask frontend to confirm
  let forceClose = false;
  dashboardWindow.on('close', (e) => {
    if (forceClose) return;
    const runningCount = Array.from(
      require('./handlers/terminal').manager.terminals.values()
    ).filter(t => t.status === 'running').length;

    if (runningCount > 0) {
      e.preventDefault();
      // Tell the dashboard frontend to show a confirm dialog
      dashboardWindow.webContents.send('dashboard:confirm-close', { runningCount });
    }
  });

  dashboardWindow.on('closed', () => {
    dashboardWindow = null;
  });
}

function getDashboardWindow() {
  return dashboardWindow;
}

app.whenReady().then(() => {
  // Register all IPC handlers
  registerFolderHandlers(ipcMain);
  registerSessionHandlers(ipcMain);
  registerNetworkHandlers(ipcMain);
  registerLauncherHandlers(ipcMain);
  registerTerminalHandlers(ipcMain, getDashboardWindow, openDashboardWindow);
  registerDependencyHandlers(ipcMain);

  ipcMain.handle('open-dashboard', async () => {
    openDashboardWindow();
    return { success: true };
  });

  ipcMain.handle('dashboard:force-close', async () => {
    terminalManager.closeAll();
    if (dashboardWindow && !dashboardWindow.isDestroyed()) {
      // Set forceClose flag via the close event variable
      dashboardWindow.destroy(); // bypass close event
    }
    dashboardWindow = null;
    return { success: true };
  });

  createWindow();
});

app.on('before-quit', () => {
  terminalManager.closeAll();
});

app.on('window-all-closed', () => {
  app.quit();
});
