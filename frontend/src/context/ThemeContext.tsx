import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface Theme {
  id: string;
  name: string;
  label: string;
  dark: boolean;
  vars: Record<string, string>;
  custom?: boolean;
}

export const THEMES: Theme[] = [
  {
    id: 'Default',
    name: 'Default',
    label: 'Dark',
    dark: true,
    vars: {
      '--color-brand': '#22c55e',
      '--color-brand-dim': '#16a34a',
      '--color-brand-glow': 'rgba(34,197,94,0.22)',
      '--color-surface': '#020202',
      '--color-surface-1': '#0a0a0a',
      '--color-surface-2': '#0f0f0f',
      '--color-surface-3': '#141414',
      '--color-text': '#f5f5f5',
      '--color-text-muted': 'rgba(255,255,255,0.6)',
      '--color-text-faint': 'rgba(255,255,255,0.50)',
      '--color-glass': 'rgba(255,255,255,0.03)',
      '--color-glass-border': 'rgba(255,255,255,0.12)',
      '--color-glass-hover': 'rgba(255,255,255,0.06)',
      '--color-sidebar-bg': 'rgba(3,3,3,0.98)',
      '--color-sidebar-border': 'rgba(255,255,255,0.08)',
      '--color-active-bg': 'rgba(34,197,94,0.12)',
      '--color-active-text': '#4ade80',
      '--color-outline-variant': 'rgba(255,255,255,0.14)',
      '--color-secondary': '#22c55e',
    },
  },
  {
    id: 'dark-green',
    name: 'Emerald Night',
    label: 'Dark',
    dark: true,
    vars: {
      '--color-brand': '#22c55e',
      '--color-brand-dim': '#16a34a',
      '--color-brand-glow': 'rgba(34,197,94,0.18)',
      '--color-surface': '#020202',
      '--color-surface-1': '#0a0a0a',
      '--color-surface-2': '#0f0f0f',
      '--color-surface-3': '#141414',
      '--color-text': '#e4f0e8',
      '--color-text-muted': 'rgba(200,230,210,0.5)',
      '--color-text-faint': 'rgba(200,230,210,0.50)',
      '--color-glass': 'rgba(255,255,255,0.03)',
      '--color-glass-border': 'rgba(255,255,255,0.12)',
      '--color-glass-hover': 'rgba(255,255,255,0.06)',
      '--color-sidebar-bg': 'rgba(3,3,3,0.98)',
      '--color-sidebar-border': 'rgba(255,255,255,0.08)',
      '--color-active-bg': 'rgba(34,197,94,0.14)',
      '--color-active-text': '#4ade80',
      '--color-outline-variant': 'rgba(255,255,255,0.14)',
      '--color-secondary': '#22c55e',
    },
  },
  {
    id: 'dark-blue',
    name: 'Cobalt Dark',
    label: 'Dark',
    dark: true,
    vars: {
      '--color-brand': '#3b82f6',
      '--color-brand-dim': '#1d4ed8',
      '--color-brand-glow': 'rgba(59,130,246,0.18)',
      '--color-surface': '#020202',
      '--color-surface-1': '#0a0a0a',
      '--color-surface-2': '#0f0f0f',
      '--color-surface-3': '#141414',
      '--color-text': '#dde8ff',
      '--color-text-muted': 'rgba(200,220,255,0.5)',
      '--color-text-faint': 'rgba(200,220,255,0.50)',
      '--color-glass': 'rgba(255,255,255,0.03)',
      '--color-glass-border': 'rgba(255,255,255,0.12)',
      '--color-glass-hover': 'rgba(255,255,255,0.06)',
      '--color-sidebar-bg': 'rgba(3,3,3,0.98)',
      '--color-sidebar-border': 'rgba(255,255,255,0.08)',
      '--color-active-bg': 'rgba(59,130,246,0.14)',
      '--color-active-text': '#60a5fa',
      '--color-outline-variant': 'rgba(255,255,255,0.14)',
      '--color-secondary': '#3b82f6',
    },
  },
  {
    id: 'dark-violet',
    name: 'Violet Dusk',
    label: 'Dark',
    dark: true,
    vars: {
      '--color-brand': '#8b5cf6',
      '--color-brand-dim': '#6d28d9',
      '--color-brand-glow': 'rgba(139,92,246,0.18)',
      '--color-surface': '#020202',
      '--color-surface-1': '#0a0a0a',
      '--color-surface-2': '#0f0f0f',
      '--color-surface-3': '#141414',
      '--color-text': '#e8e0ff',
      '--color-text-muted': 'rgba(220,200,255,0.5)',
      '--color-text-faint': 'rgba(220,200,255,0.50)',
      '--color-glass': 'rgba(255,255,255,0.03)',
      '--color-glass-border': 'rgba(255,255,255,0.12)',
      '--color-glass-hover': 'rgba(255,255,255,0.06)',
      '--color-sidebar-bg': 'rgba(3,3,3,0.98)',
      '--color-sidebar-border': 'rgba(255,255,255,0.08)',
      '--color-active-bg': 'rgba(139,92,246,0.14)',
      '--color-active-text': '#a78bfa',
      '--color-outline-variant': 'rgba(255,255,255,0.14)',
      '--color-secondary': '#8b5cf6',
    },
  },
  {
    id: 'dark-amber',
    name: 'Amber Eclipse',
    label: 'Dark',
    dark: true,
    vars: {
      '--color-brand': '#f59e0b',
      '--color-brand-dim': '#b45309',
      '--color-brand-glow': 'rgba(245,158,11,0.18)',
      '--color-surface': '#020202',
      '--color-surface-1': '#0a0a0a',
      '--color-surface-2': '#0f0f0f',
      '--color-surface-3': '#141414',
      '--color-text': '#fef3c7',
      '--color-text-muted': 'rgba(254,243,199,0.5)',
      '--color-text-faint': 'rgba(254,243,199,0.50)',
      '--color-glass': 'rgba(255,255,255,0.03)',
      '--color-glass-border': 'rgba(255,255,255,0.12)',
      '--color-glass-hover': 'rgba(255,255,255,0.06)',
      '--color-sidebar-bg': 'rgba(3,3,3,0.98)',
      '--color-sidebar-border': 'rgba(255,255,255,0.08)',
      '--color-active-bg': 'rgba(245,158,11,0.14)',
      '--color-active-text': '#fbbf24',
      '--color-outline-variant': 'rgba(255,255,255,0.14)',
      '--color-secondary': '#f59e0b',
    },
  },
  {
    id: 'dark-rose',
    name: 'Rose Noir',
    label: 'Dark',
    dark: true,
    vars: {
      '--color-brand': '#f43f5e',
      '--color-brand-dim': '#be123c',
      '--color-brand-glow': 'rgba(244,63,94,0.18)',
      '--color-surface': '#020202',
      '--color-surface-1': '#0a0a0a',
      '--color-surface-2': '#0f0f0f',
      '--color-surface-3': '#141414',
      '--color-text': '#ffe4e6',
      '--color-text-muted': 'rgba(255,228,230,0.5)',
      '--color-text-faint': 'rgba(255,228,230,0.50)',
      '--color-glass': 'rgba(255,255,255,0.03)',
      '--color-glass-border': 'rgba(255,255,255,0.12)',
      '--color-glass-hover': 'rgba(255,255,255,0.06)',
      '--color-sidebar-bg': 'rgba(3,3,3,0.98)',
      '--color-sidebar-border': 'rgba(255,255,255,0.08)',
      '--color-active-bg': 'rgba(244,63,94,0.14)',
      '--color-active-text': '#fb7185',
      '--color-outline-variant': 'rgba(255,255,255,0.14)',
      '--color-secondary': '#f43f5e',
    },
  },
  {
    id: 'dark-teal',
    name: 'Abyssal Teal',
    label: 'Dark',
    dark: true,
    vars: {
      '--color-brand': '#14b8a6',
      '--color-brand-dim': '#0f766e',
      '--color-brand-glow': 'rgba(20,184,166,0.18)',
      '--color-surface': '#020202',
      '--color-surface-1': '#0a0a0a',
      '--color-surface-2': '#0f0f0f',
      '--color-surface-3': '#141414',
      '--color-text': '#ccfbf1',
      '--color-text-muted': 'rgba(204,251,241,0.5)',
      '--color-text-faint': 'rgba(204,251,241,0.50)',
      '--color-glass': 'rgba(255,255,255,0.03)',
      '--color-glass-border': 'rgba(255,255,255,0.12)',
      '--color-glass-hover': 'rgba(255,255,255,0.06)',
      '--color-sidebar-bg': 'rgba(3,3,3,0.98)',
      '--color-sidebar-border': 'rgba(255,255,255,0.08)',
      '--color-active-bg': 'rgba(20,184,166,0.14)',
      '--color-active-text': '#2dd4bf',
      '--color-outline-variant': 'rgba(255,255,255,0.14)',
      '--color-secondary': '#14b8a6',
    },
  },
  {
    id: 'dark-slate',
    name: 'Midnight Slate',
    label: 'Dark',
    dark: true,
    vars: {
      '--color-brand': '#94a3b8',
      '--color-brand-dim': '#64748b',
      '--color-brand-glow': 'rgba(148,163,184,0.18)',
      '--color-surface': '#020202',
      '--color-surface-1': '#0a0a0a',
      '--color-surface-2': '#0f0f0f',
      '--color-surface-3': '#141414',
      '--color-text': '#f1f5f9',
      '--color-text-muted': 'rgba(241,245,249,0.5)',
      '--color-text-faint': 'rgba(241,245,249,0.50)',
      '--color-glass': 'rgba(255,255,255,0.03)',
      '--color-glass-border': 'rgba(255,255,255,0.12)',
      '--color-glass-hover': 'rgba(255,255,255,0.06)',
      '--color-sidebar-bg': 'rgba(3,3,3,0.98)',
      '--color-sidebar-border': 'rgba(255,255,255,0.08)',
      '--color-active-bg': 'rgba(148,163,184,0.14)',
      '--color-active-text': '#cbd5e1',
      '--color-outline-variant': 'rgba(255,255,255,0.14)',
      '--color-secondary': '#94a3b8',
    },
  },
  {
    id: 'light-green',
    name: 'Mint Breeze',
    label: 'Light',
    dark: false,
    vars: {
      '--color-brand': '#16a34a',
      '--color-brand-dim': '#15803d',
      '--color-brand-glow': 'rgba(22,163,74,0.15)',
      '--color-surface': '#f8fafc',
      '--color-surface-1': '#ffffff',
      '--color-surface-2': '#f1f5f9',
      '--color-surface-3': '#e5e7eb',
      '--color-text': '#064e3b',
      '--color-text-muted': 'rgba(6,78,59,0.5)',
      '--color-text-faint': 'rgba(6,78,59,0.55)',
      '--color-glass': 'rgba(0,0,0,0.02)',
      '--color-glass-border': 'rgba(0,0,0,0.08)',
      '--color-glass-hover': 'rgba(0,0,0,0.04)',
      '--color-sidebar-bg': 'rgba(255,255,255,0.98)',
      '--color-sidebar-border': 'rgba(0,0,0,0.08)',
      '--color-active-bg': 'rgba(22,163,74,0.10)',
      '--color-active-text': '#16a34a',
      '--color-outline-variant': 'rgba(0,0,0,0.10)',
      '--color-secondary': '#16a34a',
    },
  },
  {
    id: 'light-blue',
    name: 'Sky Canvas',
    label: 'Light',
    dark: false,
    vars: {
      '--color-brand': '#2563eb',
      '--color-brand-dim': '#1d4ed8',
      '--color-brand-glow': 'rgba(37,99,235,0.15)',
      '--color-surface': '#f8fafc',
      '--color-surface-1': '#ffffff',
      '--color-surface-2': '#f1f5f9',
      '--color-surface-3': '#e5e7eb',
      '--color-text': '#0f172a',
      '--color-text-muted': 'rgba(15,23,42,0.5)',
      '--color-text-faint': 'rgba(15,23,42,0.55)',
      '--color-glass': 'rgba(0,0,0,0.02)',
      '--color-glass-border': 'rgba(0,0,0,0.08)',
      '--color-glass-hover': 'rgba(0,0,0,0.04)',
      '--color-sidebar-bg': 'rgba(255,255,255,0.98)',
      '--color-sidebar-border': 'rgba(0,0,0,0.08)',
      '--color-active-bg': 'rgba(37,99,235,0.10)',
      '--color-active-text': '#2563eb',
      '--color-outline-variant': 'rgba(0,0,0,0.10)',
      '--color-secondary': '#2563eb',
    },
  },
  {
    id: 'light-violet',
    name: 'Lavender Haze',
    label: 'Light',
    dark: false,
    vars: {
      '--color-brand': '#7c3aed',
      '--color-brand-dim': '#6d28d9',
      '--color-brand-glow': 'rgba(124,58,237,0.15)',
      '--color-surface': '#f8fafc',
      '--color-surface-1': '#ffffff',
      '--color-surface-2': '#f1f5f9',
      '--color-surface-3': '#e5e7eb',
      '--color-text': '#1e1033',
      '--color-text-muted': 'rgba(30,16,51,0.5)',
      '--color-text-faint': 'rgba(30,16,51,0.55)',
      '--color-glass': 'rgba(0,0,0,0.02)',
      '--color-glass-border': 'rgba(0,0,0,0.08)',
      '--color-glass-hover': 'rgba(0,0,0,0.04)',
      '--color-sidebar-bg': 'rgba(255,255,255,0.98)',
      '--color-sidebar-border': 'rgba(0,0,0,0.08)',
      '--color-active-bg': 'rgba(124,58,237,0.10)',
      '--color-active-text': '#7c3aed',
      '--color-outline-variant': 'rgba(0,0,0,0.10)',
      '--color-secondary': '#7c3aed',
    },
  },
  {
    id: 'light-amber',
    name: 'Golden Hour',
    label: 'Light',
    dark: false,
    vars: {
      '--color-brand': '#d97706',
      '--color-brand-dim': '#b45309',
      '--color-brand-glow': 'rgba(217,119,6,0.15)',
      '--color-surface': '#f8fafc',
      '--color-surface-1': '#ffffff',
      '--color-surface-2': '#f1f5f9',
      '--color-surface-3': '#e5e7eb',
      '--color-text': '#1c1408',
      '--color-text-muted': 'rgba(28,20,8,0.5)',
      '--color-text-faint': 'rgba(28,20,8,0.55)',
      '--color-glass': 'rgba(0,0,0,0.02)',
      '--color-glass-border': 'rgba(0,0,0,0.08)',
      '--color-glass-hover': 'rgba(0,0,0,0.04)',
      '--color-sidebar-bg': 'rgba(255,255,255,0.98)',
      '--color-sidebar-border': 'rgba(0,0,0,0.08)',
      '--color-active-bg': 'rgba(217,119,6,0.10)',
      '--color-active-text': '#d97706',
      '--color-outline-variant': 'rgba(0,0,0,0.10)',
      '--color-secondary': '#d97706',
    },
  },
  {
    id: 'light-rose',
    name: 'Petal Light',
    label: 'Light',
    dark: false,
    vars: {
      '--color-brand': '#e11d48',
      '--color-brand-dim': '#be123c',
      '--color-brand-glow': 'rgba(225,29,72,0.15)',
      '--color-surface': '#f8fafc',
      '--color-surface-1': '#ffffff',
      '--color-surface-2': '#f1f5f9',
      '--color-surface-3': '#e5e7eb',
      '--color-text': '#1c0812',
      '--color-text-muted': 'rgba(28,8,18,0.5)',
      '--color-text-faint': 'rgba(28,8,18,0.55)',
      '--color-glass': 'rgba(0,0,0,0.02)',
      '--color-glass-border': 'rgba(0,0,0,0.08)',
      '--color-glass-hover': 'rgba(0,0,0,0.04)',
      '--color-sidebar-bg': 'rgba(255,255,255,0.98)',
      '--color-sidebar-border': 'rgba(0,0,0,0.08)',
      '--color-active-bg': 'rgba(225,29,72,0.10)',
      '--color-active-text': '#e11d48',
      '--color-outline-variant': 'rgba(0,0,0,0.10)',
      '--color-secondary': '#e11d48',
    },
  },
  {
    id: 'light-teal',
    name: 'Ocean Foam',
    label: 'Light',
    dark: false,
    vars: {
      '--color-brand': '#0d9488',
      '--color-brand-dim': '#0f766e',
      '--color-brand-glow': 'rgba(13,148,136,0.15)',
      '--color-surface': '#f8fafc',
      '--color-surface-1': '#ffffff',
      '--color-surface-2': '#f1f5f9',
      '--color-surface-3': '#e5e7eb',
      '--color-text': '#134e4a',
      '--color-text-muted': 'rgba(19,78,74,0.5)',
      '--color-text-faint': 'rgba(19,78,74,0.55)',
      '--color-glass': 'rgba(0,0,0,0.02)',
      '--color-glass-border': 'rgba(0,0,0,0.08)',
      '--color-glass-hover': 'rgba(0,0,0,0.04)',
      '--color-sidebar-bg': 'rgba(255,255,255,0.98)',
      '--color-sidebar-border': 'rgba(0,0,0,0.08)',
      '--color-active-bg': 'rgba(13,148,136,0.10)',
      '--color-active-text': '#0d9488',
      '--color-outline-variant': 'rgba(0,0,0,0.10)',
      '--color-secondary': '#0d9488',
    },
  },
  {
    id: 'light-slate',
    name: 'Silver Lining',
    label: 'Light',
    dark: false,
    vars: {
      '--color-brand': '#475569',
      '--color-brand-dim': '#334155',
      '--color-brand-glow': 'rgba(71,85,105,0.15)',
      '--color-surface': '#f8fafc',
      '--color-surface-1': '#ffffff',
      '--color-surface-2': '#f1f5f9',
      '--color-surface-3': '#e5e7eb',
      '--color-text': '#0f172a',
      '--color-text-muted': 'rgba(15,23,42,0.5)',
      '--color-text-faint': 'rgba(15,23,42,0.55)',
      '--color-glass': 'rgba(0,0,0,0.02)',
      '--color-glass-border': 'rgba(0,0,0,0.08)',
      '--color-glass-hover': 'rgba(0,0,0,0.04)',
      '--color-sidebar-bg': 'rgba(255,255,255,0.98)',
      '--color-sidebar-border': 'rgba(0,0,0,0.08)',
      '--color-active-bg': 'rgba(71,85,105,0.10)',
      '--color-active-text': '#475569',
      '--color-outline-variant': 'rgba(0,0,0,0.10)',
      '--color-secondary': '#475569',
    },
  },
];

// ── Custom theme utilities ────────────────────────────────────────────────

const CUSTOM_THEMES_KEY = 'semsync_custom_themes';
const STORAGE_KEY = 'semsync_theme';
const DEFAULT_THEME = 'Default';

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const d = (c: number) => Math.round(c * (1 - amount));
  return `#${[d(r), d(g), d(b)].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const l = (c: number) => Math.round(c + (255 - c) * amount);
  return `#${[l(r), l(g), l(b)].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Build a full set of CSS vars from a brand colour + dark/light mode.
 * The user only picks two things; everything else is derived automatically.
 */
export function buildCustomThemeVars(
  brandHex: string,
  dark: boolean,
): Record<string, string> {
  const [r, g, b] = hexToRgb(brandHex);

  if (dark) {
    const dimHex = darken(brandHex, 0.25);
    const activeTextHex = lighten(brandHex, 0.2);
    return {
      '--color-brand': brandHex,
      '--color-brand-dim': dimHex,
      '--color-brand-glow': `rgba(${r},${g},${b},0.22)`,
      '--color-surface': '#020202',
      '--color-surface-1': '#0a0a0a',
      '--color-surface-2': '#0f0f0f',
      '--color-surface-3': '#141414',
      '--color-text': '#f5f5f5',
      '--color-text-muted': 'rgba(255,255,255,0.6)',
      '--color-text-faint': 'rgba(255,255,255,0.50)',
      '--color-glass': 'rgba(255,255,255,0.03)',
      '--color-glass-border': 'rgba(255,255,255,0.12)',
      '--color-glass-hover': 'rgba(255,255,255,0.06)',
      '--color-sidebar-bg': 'rgba(3,3,3,0.98)',
      '--color-sidebar-border': 'rgba(255,255,255,0.08)',
      '--color-active-bg': `rgba(${r},${g},${b},0.14)`,
      '--color-active-text': activeTextHex,
      '--color-outline-variant': 'rgba(255,255,255,0.14)',
      '--color-secondary': brandHex,
    };
  } else {
    const dimHex = darken(brandHex, 0.15);
    return {
      '--color-brand': brandHex,
      '--color-brand-dim': dimHex,
      '--color-brand-glow': `rgba(${r},${g},${b},0.15)`,
      '--color-surface': '#f8fafc',
      '--color-surface-1': '#ffffff',
      '--color-surface-2': '#f1f5f9',
      '--color-surface-3': '#e5e7eb',
      '--color-text': '#0f172a',
      '--color-text-muted': 'rgba(15,23,42,0.5)',
      '--color-text-faint': 'rgba(15,23,42,0.55)',
      '--color-glass': 'rgba(0,0,0,0.02)',
      '--color-glass-border': 'rgba(0,0,0,0.08)',
      '--color-glass-hover': 'rgba(0,0,0,0.04)',
      '--color-sidebar-bg': 'rgba(255,255,255,0.98)',
      '--color-sidebar-border': 'rgba(0,0,0,0.08)',
      '--color-active-bg': `rgba(${r},${g},${b},0.10)`,
      '--color-active-text': brandHex,
      '--color-outline-variant': 'rgba(0,0,0,0.10)',
      '--color-secondary': brandHex,
    };
  }
}

function loadCustomThemes(): Theme[] {
  try {
    const raw = localStorage.getItem(CUSTOM_THEMES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Theme[];
  } catch {
    return [];
  }
}

function saveCustomThemes(themes: Theme[]) {
  localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(themes));
}

// ── Context ───────────────────────────────────────────────────────────────

interface ThemeCtx {
  theme: Theme;
  setTheme: (id: string) => void;
  customThemes: Theme[];
  addCustomTheme: (name: string, brandHex: string, dark: boolean) => Theme;
  updateCustomTheme: (id: string, name: string, brandHex: string, dark: boolean) => void;
  deleteCustomTheme: (id: string) => void;
  allThemes: Theme[];
}

const ThemeContext = createContext<ThemeCtx | null>(null);

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  root.setAttribute('data-theme', theme.id);
  root.setAttribute('data-dark', theme.dark ? 'true' : 'false');
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_THEME;
  });

  const [customThemes, setCustomThemes] = useState<Theme[]>(() => loadCustomThemes());

  const allThemes = [...THEMES, ...customThemes];
  const theme = allThemes.find(t => t.id === themeId) ?? THEMES[0];

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = (id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setThemeId(id);
  };

  const addCustomTheme = (name: string, brandHex: string, dark: boolean): Theme => {
    const id = `custom-${Date.now()}`;
    const newTheme: Theme = {
      id,
      name: name.trim() || 'My Theme',
      label: dark ? 'Dark' : 'Light',
      dark,
      custom: true,
      vars: buildCustomThemeVars(brandHex, dark),
    };
    const updated = [...customThemes, newTheme];
    setCustomThemes(updated);
    saveCustomThemes(updated);
    return newTheme;
  };

  const updateCustomTheme = (id: string, name: string, brandHex: string, dark: boolean) => {
    const updated = customThemes.map(t =>
      t.id === id
        ? { ...t, name: name.trim() || t.name, dark, label: dark ? 'Dark' : 'Light', vars: buildCustomThemeVars(brandHex, dark) }
        : t
    );
    setCustomThemes(updated);
    saveCustomThemes(updated);
    if (themeId === id) {
      const next = updated.find(t => t.id === id);
      if (next) applyTheme(next);
    }
  };

  const deleteCustomTheme = (id: string) => {
    const updated = customThemes.filter(t => t.id !== id);
    setCustomThemes(updated);
    saveCustomThemes(updated);
    if (themeId === id) setTheme('Default');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, customThemes, addCustomTheme, updateCustomTheme, deleteCustomTheme, allThemes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
