const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_DIR = path.join(
  process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
  'ClaudeLauncher'
);
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG = Object.freeze({
  folders: [],
  expected_ip: '198.3.16.159',
  claude_cli_command: 'claude',
  health_check_interval_secs: 300,
});

/**
 * Load config from disk. Returns defaults if file does not exist.
 * If the file contains corrupted JSON, backs it up as .bak and returns defaults.
 * @returns {object} AppConfig
 */
function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    return { ...DEFAULT_CONFIG, folders: [] };
  }

  let content;
  try {
    content = fs.readFileSync(CONFIG_FILE, 'utf-8');
  } catch (err) {
    throw new Error(`CONFIG_READ_ERROR: Failed to read config file: ${err.message}`);
  }

  try {
    const parsed = JSON.parse(content);
    // Merge with defaults so missing keys get default values
    return {
      folders: Array.isArray(parsed.folders) ? [...parsed.folders] : [],
      expected_ip: typeof parsed.expected_ip === 'string' ? parsed.expected_ip : DEFAULT_CONFIG.expected_ip,
      claude_cli_command: typeof parsed.claude_cli_command === 'string' ? parsed.claude_cli_command : DEFAULT_CONFIG.claude_cli_command,
      health_check_interval_secs: typeof parsed.health_check_interval_secs === 'number' ? parsed.health_check_interval_secs : DEFAULT_CONFIG.health_check_interval_secs,
    };
  } catch (_parseErr) {
    // Corrupted JSON: backup the file and return defaults
    const backupPath = CONFIG_FILE + '.bak';
    try {
      fs.copyFileSync(CONFIG_FILE, backupPath);
    } catch (_backupErr) {
      // Best-effort backup; ignore failure
    }
    return { ...DEFAULT_CONFIG, folders: [] };
  }
}

/**
 * Save config with atomic write (write to .tmp then rename).
 * Creates parent directory if it does not exist.
 * @param {object} config - AppConfig to persist
 */
function saveConfig(config) {
  if (!fs.existsSync(CONFIG_DIR)) {
    try {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    } catch (err) {
      throw new Error(`CONFIG_WRITE_ERROR: Failed to create config directory: ${err.message}`);
    }
  }

  let content;
  try {
    content = JSON.stringify(config, null, 2);
  } catch (err) {
    throw new Error(`CONFIG_WRITE_ERROR: Failed to serialize config: ${err.message}`);
  }

  const tmpPath = CONFIG_FILE + '.tmp';
  try {
    fs.writeFileSync(tmpPath, content, 'utf-8');
  } catch (err) {
    throw new Error(`CONFIG_WRITE_ERROR: Failed to write temp config file: ${err.message}`);
  }

  try {
    fs.renameSync(tmpPath, CONFIG_FILE);
  } catch (err) {
    throw new Error(`CONFIG_WRITE_ERROR: Failed to rename temp config file: ${err.message}`);
  }
}

/**
 * Add a folder path to config (immutable: returns new config).
 * Validates the path exists, is a real directory (not a symlink), and is not a duplicate.
 * @param {object} config - Current AppConfig
 * @param {string} folderPath - Absolute path to add
 * @returns {object} New AppConfig with folder added
 */
function addFolder(config, folderPath) {
  let stat;
  try {
    stat = fs.lstatSync(folderPath);
  } catch (_err) {
    throw new Error('NOT_FOUND: Path not accessible');
  }

  if (!stat.isDirectory()) {
    throw new Error('NOT_FOUND: Path must be a real directory');
  }

  // Reject symlinks (lstatSync reports the link itself, not the target)
  if (stat.isSymbolicLink()) {
    throw new Error('NOT_FOUND: Path must be a real directory');
  }

  if (config.folders.some((f) => f === folderPath)) {
    throw new Error(`FOLDER_ALREADY_EXISTS: Folder already added: ${folderPath}`);
  }

  return {
    ...config,
    folders: [...config.folders, folderPath],
  };
}

/**
 * Remove a folder path from config (immutable: returns new config).
 * @param {object} config - Current AppConfig
 * @param {string} folderPath - Path to remove
 * @returns {object} New AppConfig with folder removed
 */
function removeFolder(config, folderPath) {
  return {
    ...config,
    folders: config.folders.filter((f) => f !== folderPath),
  };
}

module.exports = {
  loadConfig,
  saveConfig,
  addFolder,
  removeFolder,
  CONFIG_FILE,
  CONFIG_DIR,
  DEFAULT_CONFIG,
};
