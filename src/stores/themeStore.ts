import { createSignal } from "solid-js";

export type ThemeName = 'dark-default' | 'dark-ocean' | 'dark-forest' | 'dark-purple' | 'light';

const THEME_KEY = 'claude-launcher-theme';

interface ThemeVars {
  readonly name: string;
  readonly bgPrimary: string;
  readonly bgSecondary: string;
  readonly bgTertiary: string;
  readonly bgHover: string;
  readonly bgActive: string;
  readonly borderDefault: string;
  readonly borderMuted: string;
  readonly borderAccent: string;
  readonly accentBlue: string;
  readonly accentBlueMuted: string;
  readonly accentGreen: string;
  readonly accentGreenMuted: string;
  readonly accentRed: string;
  readonly accentRedMuted: string;
  readonly accentYellow: string;
  readonly accentPurple: string;
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly textMuted: string;
  readonly textInverse: string;
  readonly textLink: string;
}

const THEMES: Record<ThemeName, ThemeVars> = {
  'dark-default': {
    name: 'Dark Default',
    bgPrimary: '#0d1117',
    bgSecondary: '#161b22',
    bgTertiary: '#1c2128',
    bgHover: '#21262d',
    bgActive: '#292e36',
    borderDefault: '#30363d',
    borderMuted: '#21262d',
    borderAccent: '#58a6ff',
    accentBlue: '#58a6ff',
    accentBlueMuted: '#1f6feb',
    accentGreen: '#3fb950',
    accentGreenMuted: '#238636',
    accentRed: '#f85149',
    accentRedMuted: '#da3633',
    accentYellow: '#d29922',
    accentPurple: '#bc8cff',
    textPrimary: '#c9d1d9',
    textSecondary: '#8b949e',
    textMuted: '#484f58',
    textInverse: '#0d1117',
    textLink: '#58a6ff',
  },
  'dark-ocean': {
    name: 'Dark Ocean',
    bgPrimary: '#0a192f',
    bgSecondary: '#112240',
    bgTertiary: '#1d3461',
    bgHover: '#233554',
    bgActive: '#2a3f5f',
    borderDefault: '#233554',
    borderMuted: '#1d3461',
    borderAccent: '#64ffda',
    accentBlue: '#64ffda',
    accentBlueMuted: '#45b8ac',
    accentGreen: '#64ffda',
    accentGreenMuted: '#45b8ac',
    accentRed: '#ff6b6b',
    accentRedMuted: '#e05555',
    accentYellow: '#ffd866',
    accentPurple: '#c792ea',
    textPrimary: '#ccd6f6',
    textSecondary: '#8892b0',
    textMuted: '#495670',
    textInverse: '#0a192f',
    textLink: '#64ffda',
  },
  'dark-forest': {
    name: 'Dark Forest',
    bgPrimary: '#1a1e1c',
    bgSecondary: '#222826',
    bgTertiary: '#2a322e',
    bgHover: '#313b36',
    bgActive: '#3a453f',
    borderDefault: '#3a453f',
    borderMuted: '#2a322e',
    borderAccent: '#a3d977',
    accentBlue: '#a3d977',
    accentBlueMuted: '#7eb356',
    accentGreen: '#a3d977',
    accentGreenMuted: '#7eb356',
    accentRed: '#e06c75',
    accentRedMuted: '#c55a63',
    accentYellow: '#e5c07b',
    accentPurple: '#c678dd',
    textPrimary: '#d4d4d4',
    textSecondary: '#9ca38a',
    textMuted: '#5a6350',
    textInverse: '#1a1e1c',
    textLink: '#a3d977',
  },
  'dark-purple': {
    name: 'Dark Purple',
    bgPrimary: '#1a1025',
    bgSecondary: '#231536',
    bgTertiary: '#2d1b45',
    bgHover: '#362150',
    bgActive: '#40285c',
    borderDefault: '#40285c',
    borderMuted: '#2d1b45',
    borderAccent: '#bb86fc',
    accentBlue: '#bb86fc',
    accentBlueMuted: '#9a67db',
    accentGreen: '#03dac6',
    accentGreenMuted: '#018786',
    accentRed: '#cf6679',
    accentRedMuted: '#b05060',
    accentYellow: '#ffb74d',
    accentPurple: '#bb86fc',
    textPrimary: '#e1d5f0',
    textSecondary: '#a08cb5',
    textMuted: '#6a5880',
    textInverse: '#1a1025',
    textLink: '#bb86fc',
  },
  'light': {
    name: 'Light',
    bgPrimary: '#ffffff',
    bgSecondary: '#f6f8fa',
    bgTertiary: '#eef1f5',
    bgHover: '#e8ecf0',
    bgActive: '#dde2e8',
    borderDefault: '#d0d7de',
    borderMuted: '#e8ecf0',
    borderAccent: '#0366d6',
    accentBlue: '#0366d6',
    accentBlueMuted: '#0550ae',
    accentGreen: '#2da44e',
    accentGreenMuted: '#1a7f37',
    accentRed: '#cf222e',
    accentRedMuted: '#a40e26',
    accentYellow: '#bf8700',
    accentPurple: '#8250df',
    textPrimary: '#24292f',
    textSecondary: '#57606a',
    textMuted: '#8b949e',
    textInverse: '#ffffff',
    textLink: '#0366d6',
  },
};

export const THEME_LIST: readonly { readonly key: ThemeName; readonly name: string }[] = [
  { key: 'dark-default', name: 'Dark Default' },
  { key: 'dark-ocean', name: 'Dark Ocean' },
  { key: 'dark-forest', name: 'Dark Forest' },
  { key: 'dark-purple', name: 'Dark Purple' },
  { key: 'light', name: 'Light' },
];

function loadSavedTheme(): ThemeName {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved && saved in THEMES) return saved as ThemeName;
  } catch {
    // localStorage unavailable
  }
  return 'dark-default';
}

const [currentTheme, setCurrentThemeSignal] = createSignal<ThemeName>(loadSavedTheme());

export { currentTheme };

function applyThemeToDOM(theme: ThemeName): void {
  const vars = THEMES[theme];
  const root = document.documentElement;
  root.style.setProperty('--bg-primary', vars.bgPrimary);
  root.style.setProperty('--bg-secondary', vars.bgSecondary);
  root.style.setProperty('--bg-tertiary', vars.bgTertiary);
  root.style.setProperty('--bg-hover', vars.bgHover);
  root.style.setProperty('--bg-active', vars.bgActive);
  root.style.setProperty('--border-default', vars.borderDefault);
  root.style.setProperty('--border-muted', vars.borderMuted);
  root.style.setProperty('--border-accent', vars.borderAccent);
  root.style.setProperty('--accent-blue', vars.accentBlue);
  root.style.setProperty('--accent-blue-muted', vars.accentBlueMuted);
  root.style.setProperty('--accent-green', vars.accentGreen);
  root.style.setProperty('--accent-green-muted', vars.accentGreenMuted);
  root.style.setProperty('--accent-red', vars.accentRed);
  root.style.setProperty('--accent-red-muted', vars.accentRedMuted);
  root.style.setProperty('--accent-yellow', vars.accentYellow);
  root.style.setProperty('--accent-purple', vars.accentPurple);
  root.style.setProperty('--text-primary', vars.textPrimary);
  root.style.setProperty('--text-secondary', vars.textSecondary);
  root.style.setProperty('--text-muted', vars.textMuted);
  root.style.setProperty('--text-inverse', vars.textInverse);
  root.style.setProperty('--text-link', vars.textLink);
}

export function setTheme(theme: ThemeName): void {
  setCurrentThemeSignal(theme);
  applyThemeToDOM(theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // localStorage unavailable
  }
}

export function cycleTheme(): void {
  const keys = THEME_LIST.map((t) => t.key);
  const idx = keys.indexOf(currentTheme());
  const next = keys[(idx + 1) % keys.length];
  setTheme(next);
}

export function initTheme(): void {
  applyThemeToDOM(currentTheme());
}

export interface XtermThemeColors {
  readonly background: string;
  readonly foreground: string;
  readonly cursor: string;
  readonly cursorAccent: string;
  readonly selectionBackground: string;
}

export function getXtermTheme(theme: ThemeName): XtermThemeColors {
  const vars = THEMES[theme];
  return {
    background: vars.bgPrimary,
    foreground: vars.textPrimary,
    cursor: vars.accentBlue,
    cursorAccent: vars.bgPrimary,
    selectionBackground: `${vars.accentBlue}40`,
  };
}
