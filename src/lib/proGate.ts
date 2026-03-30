const FREE_MAX_PANES = 4;
const PRO_MAX_PANES = 8;
const PRO_KEY = 'claude-launcher-pro-key';

export function isProUser(): boolean {
  try {
    return !!localStorage.getItem(PRO_KEY);
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
