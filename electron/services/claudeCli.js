const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Validate that a CLI command string contains only safe characters.
 * Allows alphanumeric, hyphens, underscores, dots, forward/back slashes, colons, and spaces.
 * This prevents shell injection when spawning processes.
 * @param {string} command
 * @returns {boolean}
 */
function isSafeCliCommand(command) {
  if (!command || typeof command !== 'string') return false;
  if (command.length === 0 || command.length > 260) return false;
  // Allow path-like commands: alphanumeric, hyphens, underscores, dots, slashes, colons, spaces
  return /^[a-zA-Z0-9\-_.\\/: ]+$/.test(command);
}

/**
 * Validate that a session ID contains only safe characters (alphanumeric and hyphens).
 * @param {string} id
 * @returns {boolean}
 */
function isValidSessionId(id) {
  if (!id || typeof id !== 'string') return false;
  if (id.length === 0 || id.length > 64) return false;
  return /^[a-zA-Z0-9-]+$/.test(id);
}

/**
 * Launch a new Claude Code session in a new console window.
 * Spawns the CLI binary directly (no cmd /c) in the specified folder.
 *
 * @param {string} folderPath - Absolute path to the working directory
 * @param {string} [cliCommand='claude'] - Path or name of the CLI executable
 */
function findWindowsTerminal() {
  const possible = [
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WindowsApps', 'wt.exe'),
  ];
  // Also search in PATH-like locations
  const pathDirs = (process.env.PATH || '').split(';');
  for (const dir of pathDirs) {
    if (dir.toLowerCase().includes('windowsterminal')) {
      possible.push(path.join(dir, 'wt.exe'));
    }
  }
  for (const p of possible) {
    try {
      if (fs.existsSync(p)) return p;
    } catch (_) { /* skip */ }
  }
  return null;
}

function launchNewSession(folderPath, cliCommand = 'claude') {
  validateFolderPath(folderPath);
  validateCliCommand(cliCommand);

  try {
    const wtPath = findWindowsTerminal();
    let child;
    if (wtPath) {
      // Launch in Windows Terminal: new tab with cmd running claude
      child = spawn(wtPath, ['new-tab', '--title', 'Claude Code', '-d', folderPath, 'cmd.exe', '/k', cliCommand], {
        detached: true,
        stdio: 'ignore',
        shell: false,
      });
    } else {
      // Fallback: plain cmd window
      child = spawn('cmd.exe', ['/c', 'start', 'cmd.exe', '/k', cliCommand], {
        cwd: folderPath,
        detached: true,
        stdio: 'ignore',
        shell: false,
      });
    }
    child.unref();
  } catch (err) {
    throw new Error(`CLI_LAUNCH_ERROR: Failed to launch Claude CLI '${cliCommand}': ${err.message}`);
  }
}

/**
 * Resume an existing Claude Code session in a new console window.
 * Spawns the CLI binary directly with --resume flag.
 *
 * @param {string} folderPath - Absolute path to the working directory
 * @param {string} sessionId - Session ID to resume
 * @param {string} [cliCommand='claude'] - Path or name of the CLI executable
 */
function launchResumeSession(folderPath, sessionId, cliCommand = 'claude') {
  validateFolderPath(folderPath);
  validateCliCommand(cliCommand);

  if (!isValidSessionId(sessionId)) {
    throw new Error(
      `INVALID_SESSION_ID: Session ID contains invalid characters or is too long: ${sessionId}`
    );
  }

  try {
    const wtPath = findWindowsTerminal();
    let child;
    if (wtPath) {
      child = spawn(wtPath, ['new-tab', '--title', `Claude: ${sessionId.substring(0, 8)}`, '-d', folderPath, 'cmd.exe', '/k', `${cliCommand} --resume ${sessionId}`], {
        detached: true,
        stdio: 'ignore',
        shell: false,
      });
    } else {
      child = spawn('cmd.exe', ['/c', 'start', 'cmd.exe', '/k', `${cliCommand} --resume ${sessionId}`], {
        cwd: folderPath,
        detached: true,
        stdio: 'ignore',
        shell: false,
      });
    }
    child.unref();
  } catch (err) {
    throw new Error(`CLI_LAUNCH_ERROR: Failed to resume session '${sessionId}': ${err.message}`);
  }
}

/**
 * Validate that the folder path exists and is a directory.
 * @param {string} folderPath
 */
function validateFolderPath(folderPath) {
  if (!folderPath || typeof folderPath !== 'string') {
    throw new Error('NOT_FOUND: Folder path is required');
  }

  if (!path.isAbsolute(folderPath)) {
    throw new Error(`INVALID_PATH: Folder path must be absolute: ${folderPath}`);
  }

  let stat;
  try {
    stat = fs.statSync(folderPath);
  } catch (_err) {
    throw new Error(`NOT_FOUND: Folder does not exist: ${folderPath}`);
  }

  if (!stat.isDirectory()) {
    throw new Error(`NOT_FOUND: Folder does not exist: ${folderPath}`);
  }
}

/**
 * Validate CLI command for safety.
 * @param {string} cliCommand
 */
function validateCliCommand(cliCommand) {
  if (!isSafeCliCommand(cliCommand)) {
    throw new Error(
      `CLI_LAUNCH_ERROR: CLI command contains unsafe characters: ${cliCommand}`
    );
  }
}

module.exports = {
  launchNewSession,
  launchResumeSession,
  isSafeCliCommand,
  isValidSessionId,
};
