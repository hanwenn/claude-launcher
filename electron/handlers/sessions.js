const path = require('path');
const fs = require('fs');
const configService = require('../services/configService');
const sessionParser = require('../services/sessionParser');

/**
 * Validate that a folder path is absolute, exists as a directory,
 * and is in the configured folder list.
 * @param {string} folderPath
 * @param {object} config
 */
function validateFolderAccess(folderPath, config) {
  if (!folderPath || typeof folderPath !== 'string') {
    throw new Error('Folder path is required');
  }

  if (!path.isAbsolute(folderPath)) {
    throw new Error(`Folder path must be absolute: ${folderPath}`);
  }

  let stat;
  try {
    stat = fs.statSync(folderPath);
  } catch (_err) {
    throw new Error(`Folder does not exist or is not accessible: ${folderPath}`);
  }

  if (!stat.isDirectory()) {
    throw new Error(`Folder does not exist or is not a directory: ${folderPath}`);
  }

  if (!config.folders.some((f) => f === folderPath)) {
    throw new Error('Folder not in configured list');
  }
}

function registerSessionHandlers(ipcMain) {
  ipcMain.handle('get-sessions', async (_event, folderPath) => {
    try {
      const config = configService.loadConfig();
      validateFolderAccess(folderPath, config);

      const sessions = await sessionParser.getSessions(folderPath);

      // Sort by timestamp descending (newest first) - immutable sort via spread
      const sorted = [...sessions].sort((a, b) => {
        const ta = new Date(a.timestamp).getTime();
        const tb = new Date(b.timestamp).getTime();
        return tb - ta;
      });

      return sorted;
    } catch (err) {
      throw new Error(`Failed to get sessions: ${err.message}`);
    }
  });

  ipcMain.handle('get-session-detail', async (_event, sessionId, folderPath) => {
    try {
      const config = configService.loadConfig();
      validateFolderAccess(folderPath, config);

      const detail = await sessionParser.getSessionDetail(sessionId, folderPath);
      return detail;
    } catch (err) {
      throw new Error(`Failed to get session detail: ${err.message}`);
    }
  });
}

module.exports = { registerSessionHandlers };
