const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Check if the Claude CLI is installed and accessible.
 * @returns {object} Dependency status for Claude CLI
 */
function checkClaude() {
  try {
    const result = execSync('where claude', {
      encoding: 'utf8',
      timeout: 5000,
      windowsHide: true,
    }).trim();

    let version = '';
    try {
      version = execSync('claude --version', {
        encoding: 'utf8',
        timeout: 5000,
        windowsHide: true,
      }).trim();
    } catch (_) {
      // version detection is best-effort
    }

    return {
      name: 'Claude CLI',
      status: 'installed',
      version: version || 'unknown',
      path: result.split('\n')[0].trim(),
      required: true,
    };
  } catch (_) {
    return {
      name: 'Claude CLI',
      status: 'missing',
      version: null,
      path: null,
      required: true,
      installHint: '请运行: npm install -g @anthropic-ai/claude-code',
      installCmd: 'npm install -g @anthropic-ai/claude-code',
    };
  }
}

/**
 * Check if Windows Terminal (wt.exe) is installed.
 * @returns {object} Dependency status for Windows Terminal
 */
function checkWindowsTerminal() {
  const searchPaths = [
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WindowsApps', 'wt.exe'),
  ];

  const pathDirs = (process.env.PATH || '').split(';');
  for (const dir of pathDirs) {
    if (dir.toLowerCase().includes('windowsterminal')) {
      searchPaths.push(path.join(dir, 'wt.exe'));
    }
  }

  for (const p of searchPaths) {
    try {
      if (fs.existsSync(p)) {
        return {
          name: 'Windows Terminal',
          status: 'installed',
          version: null,
          path: p,
          required: false,
        };
      }
    } catch (_) {
      // skip inaccessible paths
    }
  }

  // Fallback: try the where command
  try {
    const result = execSync('where wt.exe', {
      encoding: 'utf8',
      timeout: 5000,
      windowsHide: true,
    }).trim();

    return {
      name: 'Windows Terminal',
      status: 'installed',
      version: null,
      path: result.split('\n')[0].trim(),
      required: false,
    };
  } catch (_) {
    // not found
  }

  return {
    name: 'Windows Terminal',
    status: 'optional_missing',
    version: null,
    path: null,
    required: false,
    installHint: '可通过 Microsoft Store 安装，或运行: winget install Microsoft.WindowsTerminal',
    installCmd: 'winget install Microsoft.WindowsTerminal',
  };
}

/**
 * Report Node.js runtime information.
 * @returns {object} Dependency status for Node.js
 */
function checkNodejs() {
  return {
    name: 'Node.js',
    status: 'installed',
    version: process.version,
    path: process.execPath,
    required: true,
  };
}

/**
 * Check all application dependencies.
 * @returns {object} Map of dependency name to status object
 */
function checkAllDependencies() {
  return {
    nodejs: checkNodejs(),
    claude: checkClaude(),
    windowsTerminal: checkWindowsTerminal(),
  };
}

/**
 * Launch a dependency installation command in a visible cmd window.
 * @param {string} installCmd - The command to run
 * @returns {Promise<{launched: boolean, command: string}>}
 */
async function installDependency(installCmd) {
  if (!installCmd || typeof installCmd !== 'string') {
    throw new Error('INSTALL_ERROR: Install command is required');
  }

  // Only allow safe install commands
  const allowedPrefixes = ['npm install', 'winget install'];
  const isSafe = allowedPrefixes.some((prefix) => installCmd.startsWith(prefix));
  if (!isSafe) {
    throw new Error('INSTALL_ERROR: Install command not in allowlist');
  }

  return new Promise((resolve) => {
    exec(`start cmd /k "${installCmd}"`, { shell: true });
    resolve({ launched: true, command: installCmd });
  });
}

/**
 * Check if this is the first run (dependency check has never been completed).
 * Uses a marker file in the config directory.
 */
function isFirstRun() {
  const os = require('os');
  const markerDir = path.join(
    process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
    'ClaudeLauncher'
  );
  const markerFile = path.join(markerDir, '.deps-checked');
  return !fs.existsSync(markerFile);
}

/**
 * Mark dependency check as completed (user clicked "continue").
 */
function markDepsChecked() {
  const os = require('os');
  const markerDir = path.join(
    process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
    'ClaudeLauncher'
  );
  try {
    if (!fs.existsSync(markerDir)) {
      fs.mkdirSync(markerDir, { recursive: true });
    }
    fs.writeFileSync(path.join(markerDir, '.deps-checked'), new Date().toISOString());
  } catch (_) { /* best effort */ }
}

module.exports = { checkAllDependencies, installDependency, isFirstRun, markDepsChecked };
