const { checkAllDependencies, installDependency, isFirstRun, markDepsChecked } = require('../services/dependencyChecker');

function registerDependencyHandlers(ipcMain) {
  ipcMain.handle('deps:check-all', async () => {
    return checkAllDependencies();
  });

  ipcMain.handle('deps:install', async (_event, installCmd) => {
    return installDependency(installCmd);
  });

  ipcMain.handle('deps:recheck', async () => {
    return checkAllDependencies();
  });

  ipcMain.handle('deps:is-first-run', async () => {
    return isFirstRun();
  });

  ipcMain.handle('deps:mark-checked', async () => {
    markDepsChecked();
    return { success: true };
  });
}

module.exports = { registerDependencyHandlers };
