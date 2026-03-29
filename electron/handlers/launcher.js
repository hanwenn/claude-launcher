const configService = require('../services/configService');
const claudeCli = require('../services/claudeCli');

function registerLauncherHandlers(ipcMain) {
  ipcMain.handle('launch-claude', async (_event, folder, sessionId) => {
    try {
      const config = configService.loadConfig();

      // Validate that the folder is in the configured list
      if (!config.folders.some((f) => f === folder)) {
        throw new Error('Folder not in configured list');
      }

      const cliCommand = config.claude_cli_command || 'claude';

      if (sessionId) {
        claudeCli.launchResumeSession(folder, sessionId, cliCommand);
      } else {
        claudeCli.launchNewSession(folder, cliCommand);
      }

      return { success: true, folder, sessionId: sessionId || null };
    } catch (err) {
      throw new Error(`Failed to launch Claude: ${err.message}`);
    }
  });
}

module.exports = { registerLauncherHandlers };
