const configService = require('../services/configService');
const dnsChecker = require('../services/dnsChecker');

function registerNetworkHandlers(ipcMain) {
  ipcMain.handle('check-dns-health', async () => {
    try {
      const config = configService.loadConfig();
      const result = await dnsChecker.checkDns(config.expected_ip);
      return result;
    } catch (err) {
      return {
        status: 'resolution_failed',
        error: err.message || String(err),
        resolved_ips: [],
        expected_ip: dnsChecker.BUILTIN_EXPECTED_IP,
        checked_at: new Date().toISOString(),
      };
    }
  });

  ipcMain.handle('get-expected-ip', async () => {
    const config = configService.loadConfig();
    return config.expected_ip || dnsChecker.BUILTIN_EXPECTED_IP;
  });

  ipcMain.handle('set-expected-ip', async (_event, newIp) => {
    if (!newIp || typeof newIp !== 'string') {
      throw new Error('IP address is required');
    }
    // Validate IP format: single IP, CIDR range, or comma-separated list
    const rules = newIp.split(',').map(s => s.trim()).filter(Boolean);
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
    for (const rule of rules) {
      if (!ipRegex.test(rule) && !cidrRegex.test(rule)) {
        throw new Error(`无效的 IP 格式: ${rule}（支持 IP 地址如 198.3.16.159 或 CIDR 网段如 198.3.16.0/24）`);
      }
    }
    const config = configService.loadConfig();
    const newConfig = { ...config, expected_ip: rules.join(',') };
    configService.saveConfig(newConfig);
    return rules.join(',');
  });
}

module.exports = { registerNetworkHandlers };
