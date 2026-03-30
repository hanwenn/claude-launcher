const FREE_MAX_PANES = 4;
const PRO_MAX_PANES = 8;
const PRO_KEY = 'claude-launcher-pro-key';
const KEY_PREFIX = 'CL-';
const KEY_PATTERN = /^CL-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$/;

export function validateKey(key: string): boolean {
  return KEY_PATTERN.test(key.trim());
}

export function isProUser(): boolean {
  try {
    const stored = localStorage.getItem(PRO_KEY);
    return typeof stored === 'string' && stored.startsWith(KEY_PREFIX);
  } catch {
    return false;
  }
}

export function canOpenMorePanes(currentCount: number): boolean {
  const max = isProUser() ? PRO_MAX_PANES : FREE_MAX_PANES;
  return currentCount < max;
}

export function getMaxPanes(): number {
  return isProUser() ? PRO_MAX_PANES : FREE_MAX_PANES;
}

export function setProKey(key: string): void {
  try {
    localStorage.setItem(PRO_KEY, key);
  } catch {
    // localStorage unavailable
  }
}

export function clearProKey(): void {
  try {
    localStorage.removeItem(PRO_KEY);
  } catch {
    // localStorage unavailable
  }
}
