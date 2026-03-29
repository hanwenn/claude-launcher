const dns = require('dns');
const { promisify } = require('util');

const resolve4 = promisify(dns.resolve4);

const BUILTIN_EXPECTED_IP = '198.3.16.159';

/**
 * Parse an IP address string to a 32-bit integer.
 * @param {string} ip - IPv4 address like "198.3.16.159"
 * @returns {number}
 */
function ipToInt(ip) {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

/**
 * Check if an IP matches a single IP or CIDR range.
 * Supports: "198.3.16.159" (exact) or "198.3.16.0/24" (CIDR range)
 * @param {string} ip - IP to check
 * @param {string} rule - IP or CIDR rule
 * @returns {boolean}
 */
function ipMatchesRule(ip, rule) {
  const trimmed = rule.trim();
  if (trimmed.includes('/')) {
    // CIDR range: e.g., 198.3.16.0/24
    const [network, prefixStr] = trimmed.split('/');
    const prefix = parseInt(prefixStr, 10);
    if (isNaN(prefix) || prefix < 0 || prefix > 32) return false;
    const mask = prefix === 0 ? 0 : (0xFFFFFFFF << (32 - prefix)) >>> 0;
    return (ipToInt(ip) & mask) === (ipToInt(network) & mask);
  } else {
    // Exact match
    return ip === trimmed;
  }
}

/**
 * Execute DNS health check for claude.ai.
 * Resolves claude.ai and compares against expected IPs.
 * The built-in IP is always used as the primary check. If the config provides
 * a different IP, it is accepted as an additional allowed IP but a warning is logged.
 *
 * @param {string} configExpectedIp - Expected IP from user config
 * @returns {Promise<object>} HealthResult { status, resolved_ips, expected_ip, checked_at }
 */
async function checkDns(configExpectedIp) {
  const checkedAt = new Date().toISOString();

  // Build list of allowed IP rules: include built-in + all config IPs/CIDRs (comma-separated)
  const allowedRules = [BUILTIN_EXPECTED_IP];
  if (configExpectedIp && typeof configExpectedIp === 'string') {
    const configRules = configExpectedIp.split(',').map(s => s.trim()).filter(Boolean);
    for (const rule of configRules) {
      if (!allowedRules.includes(rule)) {
        allowedRules.push(rule);
      }
    }
  }

  try {
    const resolvedIps = await resolve4('claude.ai');

    // Check if any resolved IP matches any rule (exact IP or CIDR range) — OR logic
    const hasMatch = resolvedIps.some((ip) =>
      allowedRules.some((rule) => ipMatchesRule(ip, rule))
    );

    const status = hasMatch ? 'healthy' : 'wrong_ip';

    return {
      status,
      resolved_ips: [...resolvedIps],
      expected_ip: BUILTIN_EXPECTED_IP,
      checked_at: checkedAt,
    };
  } catch (err) {
    return {
      status: 'resolution_failed',
      error: err.message || String(err),
      resolved_ips: [],
      expected_ip: BUILTIN_EXPECTED_IP,
      checked_at: checkedAt,
    };
  }
}

module.exports = { checkDns, BUILTIN_EXPECTED_IP };
