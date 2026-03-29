const { dialog } = require('electron');
const path = require('path');
const configService = require('../services/configService');
const sessionParser = require('../services/sessionParser');

function registerFolderHandlers(ipcMain) {
  ipcMain.handle('get-folders', async () => {
    try {
      const config = configService.loadConfig();
      const folders = [];

      for (const folderPath of config.folders) {
        let sessionCount = 0;
        try {
          const sessions = await sessionParser.getSessions(folderPath);
          sessionCount = sessions.length;
        } catch (_err) {
          // If session scanning fails, report 0 sessions
        }

        folders.push({
          path: folderPath,
          display_name: path.basename(folderPath),
          session_count: sessionCount,
          last_active: null,
        });
      }

      return folders;
    } catch (err) {
      throw new Error(`Failed to get folders: ${err.message}`);
    }
  });

  ipcMain.handle('add-folder', async (_event, folderPath) => {
    try {
      const config = configService.loadConfig();
      const newConfig = configService.addFolder(config, folderPath);
      configService.saveConfig(newConfig);

      let sessionCount = 0;
      try {
        const sessions = await sessionParser.getSessions(folderPath);
        sessionCount = sessions.length;
      } catch (_) { /* ignore */ }

      return {
        path: folderPath,
        display_name: path.basename(folderPath),
        session_count: sessionCount,
        last_active: null,
      };
    } catch (err) {
      throw new Error(`Failed to add folder: ${err.message}`);
    }
  });

  ipcMain.handle('remove-folder', async (_event, folderPath) => {
    try {
      const config = configService.loadConfig();
      const newConfig = configService.removeFolder(config, folderPath);
      configService.saveConfig(newConfig);
      return { success: true, path: folderPath };
    } catch (err) {
      throw new Error(`Failed to remove folder: ${err.message}`);
    }
  });

  ipcMain.handle('open-folder-dialog', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });
}

module.exports = { registerFolderHandlers };
