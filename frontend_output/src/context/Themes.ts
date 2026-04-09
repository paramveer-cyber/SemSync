// ─── Types ────────────────────────────────────────────────────────────────────

export interface ThemeVars {
  // Brand
  '--color-brand': string;
  '--color-brand-dim': string;
  '--color-brand-glow': string;

  // Surfaces (neutral — never tinted toward brand color)
  '--color-surface': string;
  '--color-surface-1': string;
  '--color-surface-2': string;
  '--color-surface-3': string;

  // Text
  '--color-text': string;
  '--color-text-muted': string;
  '--color-text-faint': string;

  // Glass / borders
  '--color-glass': string;
  '--color-glass-border': string;
  '--color-glass-hover': string;

  // Sidebar
  '--color-sidebar-bg': string;
  '--color-sidebar-border': string;

  // Active states (brand-tinted, used only where intentional)
  '--color-active-bg': string;
  '--color-active-text': string;

  // Misc
  '--color-outline-variant': string;
  '--color-secondary': string;
}

export interface Theme {
  id: string;
  name: string;
  label: 'Dark' | 'Light';
  dark: boolean;
  vars: ThemeVars;
}

// ─── Shared neutral surfaces ──────────────────────────────────────────────────
// Cards use these instead of per-theme tinted surfaces, so they look consistent
// across all themes within the same mode.

const DARK_CARD_SURFACES = {
  '--color-surface':   '#080808',
  '--color-surface-1': '#111111',  // card bg
  '--color-surface-2': '#181818',
  '--color-surface-3': '#202020',
  '--color-text':       '#f2f2f2',
  '--color-text-muted': 'rgba(255,255,255,0.55)',
  '--color-text-faint': 'rgba(255,255,255,0.30)',
  '--color-glass':        'rgba(255,255,255,0.03)',
  '--color-glass-border': 'rgba(255,255,255,0.10)',
  '--color-glass-hover':  'rgba(255,255,255,0.06)',
} as const;

const LIGHT_CARD_SURFACES = {
  '--color-surface':   '#f5f5f5',
  '--color-surface-1': '#ffffff',  // card bg
  '--color-surface-2': '#f0f0f0',
  '--color-surface-3': '#e8e8e8',
  '--color-text':       '#111111',
  '--color-text-muted': 'rgba(0,0,0,0.50)',
  '--color-text-faint': 'rgba(0,0,0,0.28)',
  '--color-glass':        'rgba(0,0,0,0.03)',
  '--color-glass-border': 'rgba(0,0,0,0.10)',
  '--color-glass-hover':  'rgba(0,0,0,0.06)',
} as const;

// ─── Theme factory helpers ─────────────────────────────────────────────────────

function makeDark(
  id: string,
  name: string,
  brand: string,
  brandDim: string,
  brandGlow: string,
  activeText: string,
): Theme {
  return {
    id,
    name,
    label: 'Dark',
    dark: true,
    vars: {
      '--color-brand':     brand,
      '--color-brand-dim': brandDim,
      '--color-brand-glow': brandGlow,

      ...DARK_CARD_SURFACES,

      '--color-sidebar-bg':     'rgba(6,6,6,0.98)',
      '--color-sidebar-border': 'rgba(255,255,255,0.08)',

      '--color-active-bg':   `rgba(${hexToRgb(brand)},0.12)`,
      '--color-active-text': activeText,

      '--color-outline-variant': 'rgba(255,255,255,0.12)',
      '--color-secondary': brand,
    },
  };
}

function makeLight(
  id: string,
  name: string,
  brand: string,
  brandDim: string,
  brandGlow: string,
  activeText: string,
): Theme {
  return {
    id,
    name,
    label: 'Light',
    dark: false,
    vars: {
      '--color-brand':     brand,
      '--color-brand-dim': brandDim,
      '--color-brand-glow': brandGlow,

      ...LIGHT_CARD_SURFACES,

      '--color-sidebar-bg':     'rgba(255,255,255,0.97)',
      '--color-sidebar-border': 'rgba(0,0,0,0.10)',

      '--color-active-bg':   `rgba(${hexToRgb(brand)},0.10)`,
      '--color-active-text': activeText,

      '--color-outline-variant': 'rgba(0,0,0,0.10)',
      '--color-secondary': brand,
    },
  };
}

// Converts a 6-digit hex to "r,g,b" for use in rgba()
function hexToRgb(hex: string): string {
  const n = parseInt(hex.replace('#', ''), 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

// ─── Theme definitions ─────────────────────────────────────────────────────────

export const THEMES: Theme[] = [
  // Dark
  makeDark('dark-default',  'Default',       '#22c55e', '#16a34a', 'rgba(34,197,94,0.18)',   '#4ade80'),
  makeDark('dark-emerald',  'Emerald Night', '#22c55e', '#16a34a', 'rgba(34,197,94,0.18)',   '#4ade80'),
  makeDark('dark-cobalt',   'Cobalt Dark',   '#3b82f6', '#1d4ed8', 'rgba(59,130,246,0.18)',  '#60a5fa'),
  makeDark('dark-violet',   'Violet Dusk',   '#8b5cf6', '#6d28d9', 'rgba(139,92,246,0.18)',  '#a78bfa'),
  makeDark('dark-amber',    'Amber Eclipse', '#f59e0b', '#b45309', 'rgba(245,158,11,0.18)',  '#fbbf24'),
  makeDark('dark-rose',     'Rose Noir',     '#f43f5e', '#be123c', 'rgba(244,63,94,0.18)',   '#fb7185'),
  makeDark('dark-teal',     'Abyssal Teal',  '#14b8a6', '#0f766e', 'rgba(20,184,166,0.18)',  '#2dd4bf'),
  makeDark('dark-slate',    'Midnight Slate','#94a3b8', '#64748b', 'rgba(148,163,184,0.18)', '#cbd5e1'),

  // Light
  makeLight('light-green',  'Mint Breeze',   '#16a34a', '#15803d', 'rgba(22,163,74,0.15)',   '#16a34a'),
  makeLight('light-blue',   'Sky Canvas',    '#2563eb', '#1d4ed8', 'rgba(37,99,235,0.15)',   '#2563eb'),
  makeLight('light-violet', 'Lavender Haze', '#7c3aed', '#6d28d9', 'rgba(124,58,237,0.15)', '#7c3aed'),
  makeLight('light-amber',  'Golden Hour',   '#d97706', '#b45309', 'rgba(217,119,6,0.15)',   '#d97706'),
  makeLight('light-rose',   'Petal Light',   '#e11d48', '#be123c', 'rgba(225,29,72,0.15)',   '#e11d48'),
  makeLight('light-teal',   'Ocean Foam',    '#0d9488', '#0f766e', 'rgba(13,148,136,0.15)',  '#0d9488'),
  makeLight('light-slate',  'Silver Lining', '#475569', '#334155', 'rgba(71,85,105,0.15)',   '#475569'),
];

// ─── Theme lookup ──────────────────────────────────────────────────────────────

export const THEME_MAP = new Map(THEMES.map(t => [t.id, t]));

export function getTheme(id: string): Theme {
  return THEME_MAP.get(id) ?? THEMES[0];
}

export const darkThemes  = THEMES.filter(t => t.dark);
export const lightThemes = THEMES.filter(t => !t.dark);