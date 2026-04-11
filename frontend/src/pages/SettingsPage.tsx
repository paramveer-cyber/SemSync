import { useState, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useTheme, THEMES, buildCustomThemeVars } from '../context/ThemeContext';
import { Bell, BellOff, BookOpen, Palette, Sun, Moon, PlayCircle, Plus, Pencil, Trash2, Check, X, Info, Scale, Lightbulb, ExternalLink, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import OnboardingTutorial, { resetTutorial } from '../components/OnboardingTutorial';

// ── Shared sub-components ─────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="relative flex items-center transition-all duration-200"
      style={{
        width: 44, height: 24,
        background: on ? `linear-gradient(135deg,var(--color-brand),var(--color-brand-dim))` : 'var(--color-glass)',
        border: on ? '1px solid var(--color-brand)' : '1px solid var(--color-glass-border)',
        borderRadius: 9999,
        cursor: 'pointer',
        boxShadow: on ? '0 0 10px var(--color-brand-glow)' : 'none',
      }}>
      <div
        className="absolute transition-all duration-200"
        style={{
          width: 16, height: 16, borderRadius: 9999,
          background: on ? 'var(--color-surface)' : 'var(--color-text-muted)',
          left: on ? 24 : 4,
        }}
      />
    </button>
  );
}

function SectionHeader({ icon: Icon, title, color }: { icon: any; title: string; color: string }) {
  return (
    <div
      className="flex items-center gap-3 px-5 py-3.5"
      style={{ borderBottom: '1px solid var(--color-glass-border)', background: 'var(--color-glass)' }}
    >
      <div className="w-1 self-stretch rounded-full" style={{ background: color }} />
      <Icon className="w-4 h-4" style={{ color }} />
      <h3 className="text-sm font-bold tracking-wide" style={{ color: 'var(--color-text)' }}>{title}</h3>
    </div>
  );
}

function ThemeSwatch({ name, dark, vars, selected, onClick, custom, onEdit, onDelete }: {
  themeId: string; name: string; dark: boolean; vars: Record<string, string>; selected: boolean; onClick: () => void;
  custom?: boolean; onEdit?: () => void; onDelete?: () => void;
}) {
  const brand = vars['--color-brand'];
  const surface = vars['--color-surface'];
  const text = vars['--color-text'];

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 4 }}>
      <button
        onClick={onClick}
        title={name}
        style={{
          flex: 1, padding: '8px 10px',
          background: vars['--color-surface-1'],
          border: selected
            ? `2px solid ${brand}`
            : `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          borderRadius: 8, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 10,
          transition: 'all 0.15s',
          boxShadow: selected ? `0 0 0 3px ${brand}33` : 'none',
        }}>
        {/* Mini preview */}
        <div style={{
          width: 28, height: 28, borderRadius: 6, background: surface,
          flexShrink: 0, position: 'relative', overflow: 'hidden',
          border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        }}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 9, background: brand, opacity: 0.85 }} />
          <div style={{ position: 'absolute', top: 5, left: 4, width: 10, height: 2, borderRadius: 2, background: text, opacity: 0.5 }} />
          <div style={{ position: 'absolute', top: 9, left: 4, width: 7, height: 2, borderRadius: 2, background: text, opacity: 0.3 }} />
        </div>

        <div style={{ textAlign: 'left', flex: 1 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: text, margin: 0, lineHeight: 1.3 }}>{name}</p>
          <p style={{ fontSize: 10, color: `${text}88`, margin: 0, marginTop: 1 }}>
            {dark ? 'Dark' : 'Light'}{custom ? ' · Custom' : ''}
          </p>
        </div>

        {selected && (
          <div style={{
            width: 16, height: 16, borderRadius: '50%', background: brand,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="8" height="7" viewBox="0 0 8 7" fill="none">
              <path d="M1 3.5L3 5.5L7 1" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </button>

      {/* Edit/delete for custom themes */}
      {custom && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {onEdit && (
            <button
              onClick={onEdit}
              title="Edit theme"
              style={{
                width: 24, height: 24, borderRadius: 5, border: '1px solid var(--color-glass-border)',
                background: 'var(--color-glass)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              <Pencil style={{ width: 11, height: 11, color: 'var(--color-text-muted)' }} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              title="Delete theme"
              style={{
                width: 24, height: 24, borderRadius: 5, border: '1px solid rgba(239,68,68,0.3)',
                background: 'rgba(239,68,68,0.07)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              <Trash2 style={{ width: 11, height: 11, color: '#f87171' }} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Custom Theme Builder ──────────────────────────────────────────────────

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#ef4444',
  '#f97316', '#f59e0b', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#a855f7', '#d946ef', '#94a3b8',
];

interface ThemeBuilderProps {
  /** If provided, we're editing an existing custom theme */
  editing?: { id: string; name: string; brandHex: string; dark: boolean } | null;
  onSave: (name: string, brandHex: string, dark: boolean) => void;
  onCancel: () => void;
}

function ThemeBuilder({ editing, onSave, onCancel }: ThemeBuilderProps) {
  const [name, setName] = useState(editing?.name ?? '');
  const [brandHex, setBrandHex] = useState(editing?.brandHex ?? '#6366f1');
  const [dark, setDark] = useState(editing?.dark ?? true);

  // Derive live preview vars
  const previewVars = buildCustomThemeVars(brandHex, dark);
  const brand = previewVars['--color-brand'];
  const surface = previewVars['--color-surface'];
  const surf1 = previewVars['--color-surface-1'];
  const text = previewVars['--color-text'];
  const textMut = previewVars['--color-text-muted'];
  const border = previewVars['--color-glass-border'];
  const activeBg = previewVars['--color-active-bg'];

  const isValid = /^#[0-9a-fA-F]{6}$/.test(brandHex);

  return (
    <div style={{
      border: `1px solid ${brand}55`,
      borderRadius: 10, overflow: 'hidden',
      background: 'var(--color-surface-1)',
      boxShadow: `0 0 0 3px ${brand}18`,
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px',
        background: `${brand}0f`,
        borderBottom: `1px solid ${brand}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: brand, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {editing ? 'Edit Theme' : 'New Custom Theme'}
        </p>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
          <X style={{ width: 14, height: 14, color: 'var(--color-text-muted)' }} />
        </button>
      </div>

      <div style={{ padding: '14px 14px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Theme name */}
        <div>
          <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5 }}>
            Theme Name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. My Indigo Night"
            maxLength={32}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '7px 10px', borderRadius: 6, fontSize: 12,
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-glass-border)',
              color: 'var(--color-text)', outline: 'none',
            }}
          />
        </div>

        {/* Dark / Light toggle */}
        <div>
          <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5 }}>
            Mode
          </label>
          <div style={{ display: 'flex', gap: 6 }}>
            {([true, false] as const).map(isDark => (
              <button
                key={String(isDark)}
                onClick={() => setDark(isDark)}
                style={{
                  flex: 1, padding: '6px 0', borderRadius: 6, fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  background: dark === isDark ? `${brand}18` : 'var(--color-glass)',
                  border: dark === isDark ? `1px solid ${brand}` : '1px solid var(--color-glass-border)',
                  color: dark === isDark ? brand : 'var(--color-text-muted)',
                  transition: 'all 0.15s',
                }}>
                {isDark ? <Moon style={{ width: 11, height: 11 }} /> : <Sun style={{ width: 11, height: 11 }} />}
                {isDark ? 'Dark' : 'Light'}
              </button>
            ))}
          </div>
        </div>

        {/* Accent colour */}
        <div>
          <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5 }}>
            Accent Colour
          </label>
          {/* Preset swatches */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
            {PRESET_COLORS.map(hex => (
              <button
                key={hex}
                onClick={() => setBrandHex(hex)}
                title={hex}
                style={{
                  width: 22, height: 22, borderRadius: 5, background: hex, cursor: 'pointer',
                  border: brandHex.toLowerCase() === hex.toLowerCase() ? '2px solid var(--color-text)' : '2px solid transparent',
                  transition: 'transform 0.1s',
                  transform: brandHex.toLowerCase() === hex.toLowerCase() ? 'scale(1.18)' : 'scale(1)',
                  boxShadow: brandHex.toLowerCase() === hex.toLowerCase() ? `0 0 0 1px ${hex}` : 'none',
                }}
              />
            ))}
          </div>
          {/* Custom hex + colour picker */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="color"
              value={isValid ? brandHex : '#6366f1'}
              onChange={e => setBrandHex(e.target.value)}
              style={{ width: 34, height: 28, borderRadius: 5, border: '1px solid var(--color-glass-border)', cursor: 'pointer', padding: 2, background: 'none' }}
            />
            <input
              type="text"
              value={brandHex}
              onChange={e => setBrandHex(e.target.value)}
              placeholder="#6366f1"
              maxLength={7}
              style={{
                flex: 1, padding: '6px 9px', borderRadius: 6, fontSize: 11,
                background: 'var(--color-surface-2)',
                border: `1px solid ${isValid ? 'var(--color-glass-border)' : '#ef4444'}`,
                color: 'var(--color-text)', outline: 'none', fontFamily: 'monospace',
              }}
            />
          </div>
        </div>

        {/* Live mini-preview */}
        <div>
          <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5 }}>
            Preview
          </label>
          <div style={{
            borderRadius: 8, overflow: 'hidden', border: `1px solid ${border}`,
            background: surface, fontSize: 11,
          }}>
            {/* Fake sidebar strip + content */}
            <div style={{ display: 'flex', height: 70 }}>
              <div style={{ width: 36, background: dark ? 'rgba(3,3,3,0.98)' : 'rgba(255,255,255,0.98)', borderRight: `1px solid ${border}`, padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[brand, textMut, textMut].map((c, i) => (
                  <div key={i} style={{ width: 20, height: 5, borderRadius: 2, background: i === 0 ? activeBg : 'transparent', display: 'flex', alignItems: 'center', paddingLeft: 2 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: c, opacity: i === 0 ? 1 : 0.4 }} />
                  </div>
                ))}
              </div>
              <div style={{ flex: 1, background: surf1, padding: '8px 10px' }}>
                <div style={{ width: '60%', height: 5, borderRadius: 2, background: brand, marginBottom: 6 }} />
                <div style={{ width: '80%', height: 3, borderRadius: 2, background: text, opacity: 0.3, marginBottom: 3 }} />
                <div style={{ width: '55%', height: 3, borderRadius: 2, background: text, opacity: 0.2, marginBottom: 8 }} />
                <div style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 4, background: brand, fontSize: 9, color: dark ? '#000' : '#fff', fontWeight: 700 }}>
                  Action
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save / Cancel */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => isValid && onSave(name, brandHex, dark)}
            disabled={!isValid}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 6, fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.07em',
              background: isValid ? brand : 'var(--color-glass)',
              color: isValid ? (dark ? '#000' : '#fff') : 'var(--color-text-muted)',
              border: 'none', cursor: isValid ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              transition: 'all 0.15s',
            }}>
            <Check style={{ width: 12, height: 12 }} />
            {editing ? 'Save Changes' : 'Create Theme'}
          </button>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              background: 'var(--color-glass)', color: 'var(--color-text-muted)',
              border: '1px solid var(--color-glass-border)', cursor: 'pointer',
            }}>
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { settings, updateSettings, permission, requestPermission } = useNotifications();
  const { theme, setTheme, customThemes, addCustomTheme, updateCustomTheme, deleteCustomTheme } = useTheme();
  const [showTutorial, setShowTutorial] = useState(false);
  const [builderMode, setBuilderMode] = useState<'create' | 'edit' | null>(null);
  const [editingTheme, setEditingTheme] = useState<{ id: string; name: string; brandHex: string; dark: boolean } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleReplayTutorial = () => {
    resetTutorial();
    setShowTutorial(true);
  };

  const darkThemes = THEMES.filter(t => t.dark);
  const lightThemes = THEMES.filter(t => !t.dark);
  const customDark = customThemes.filter(t => t.dark);
  const customLight = customThemes.filter(t => !t.dark);

  const handleSaveTheme = (name: string, brandHex: string, dark: boolean) => {
    if (builderMode === 'create') {
      const newTheme = addCustomTheme(name, brandHex, dark);
      setTheme(newTheme.id);
    } else if (builderMode === 'edit' && editingTheme) {
      updateCustomTheme(editingTheme.id, name, brandHex, dark);
    }
    setBuilderMode(null);
    setEditingTheme(null);
  };

  const handleEditTheme = (t: typeof customThemes[number]) => {
    setEditingTheme({
      id: t.id,
      name: t.name,
      brandHex: t.vars['--color-brand'],
      dark: t.dark,
    });
    setBuilderMode('edit');
  };

  const handleDeleteTheme = (id: string) => {
    if (deleteConfirm === id) {
      deleteCustomTheme(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      // auto-clear confirmation after 3 s
      setTimeout(() => setDeleteConfirm(c => c === id ? null : c), 3000);
    }
  };

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-surface)' }}>
      <Sidebar />
      <main className="grow flex flex-col">
        <Header title="Settings" subtitle="Preferences & Configuration" />

        <div
          className="p-6"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: 'auto auto',
            gap: 12,
            maxWidth: 900,
          }}
        >

          {/* ── Appearance (top-left) ── */}
          <div style={{ border: '1px solid var(--color-glass-border)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <SectionHeader icon={Palette} title="Appearance" color="var(--color-brand)" />
            <div className="px-5 py-4 space-y-4" style={{ background: 'var(--color-surface-1)', flex: 1, overflowY: 'auto' }}>

              {/* Built-in dark */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Moon className="w-3 h-3" style={{ color: 'var(--color-text-muted)' }} />
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Dark</p>
                </div>
                <div className="space-y-1.5">
                  {darkThemes.map(t => (
                    <ThemeSwatch key={t.id} themeId={t.id} name={t.name} dark={t.dark} vars={t.vars} selected={theme.id === t.id} onClick={() => setTheme(t.id)} />
                  ))}
                </div>
              </div>

              {/* Built-in light */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sun className="w-3 h-3" style={{ color: 'var(--color-text-muted)' }} />
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Light</p>
                </div>
                <div className="space-y-1.5">
                  {lightThemes.map(t => (
                    <ThemeSwatch key={t.id} themeId={t.id} name={t.name} dark={t.dark} vars={t.vars} selected={theme.id === t.id} onClick={() => setTheme(t.id)} />
                  ))}
                </div>
              </div>

              {/* Custom themes */}
              {customThemes.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Pencil className="w-3 h-3" style={{ color: 'var(--color-brand)' }} />
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-brand)' }}>
                      Custom
                    </p>
                    <p className="text-xs font-semibold tracking-normal" style={{ color: 'var(--color-brand-dim)' }}>
                      [All Colors are not configured, some might break!]
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    {customThemes.map(t => (
                      <ThemeSwatch
                        key={t.id}
                        themeId={t.id}
                        name={t.name}
                        dark={t.dark}
                        vars={t.vars}
                        selected={theme.id === t.id}
                        onClick={() => setTheme(t.id)}
                        custom
                        onEdit={() => handleEditTheme(t)}
                        onDelete={() => handleDeleteTheme(t.id)}
                      />
                    ))}
                  </div>
                  {/* Delete confirmation hint */}
                  {deleteConfirm && (
                    <p style={{ fontSize: 10, color: '#f87171', marginTop: 4, textAlign: 'right' }}>
                      Click 🗑️ again to confirm deletion
                    </p>
                  )}
                </div>
              )}

              {/* Builder — inline in the Appearance card */}
              {builderMode ? (
                <ThemeBuilder
                  editing={builderMode === 'edit' ? editingTheme : null}
                  onSave={handleSaveTheme}
                  onCancel={() => { setBuilderMode(null); setEditingTheme(null); }}
                />
              ) : (
                <button
                  onClick={() => setBuilderMode('create')}
                  style={{
                    width: '100%', padding: '8px 0', borderRadius: 8, fontSize: 11, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.07em',
                    background: 'var(--color-active-bg)',
                    color: 'var(--color-brand)',
                    border: '1px dashed var(--color-brand)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-glass-hover)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-active-bg)'; }}
                >
                  <Plus style={{ width: 12, height: 12 }} />
                  Create Custom Theme
                </button>
              )}

            </div>
          </div>

          {/* ── Deadline Reminders (top-right) ── */}
          <div style={{ border: '1px solid var(--color-glass-border)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <SectionHeader icon={Bell} title="Deadline Reminders" color="var(--color-warn)" />
            <div className="px-5 py-4 space-y-4" style={{ background: 'var(--color-surface-1)', flex: 1 }}>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Enable Reminders</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Get notified before upcoming evaluations</p>
                </div>
                <Toggle on={settings.enabled} onChange={v => updateSettings({ enabled: v })} />
              </div>

              {permission !== 'granted' && permission !== 'unsupported' && (
                <div
                  className="flex items-start gap-3 px-4 py-3"
                  style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 7 }}
                >
                  <BellOff className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#f59e0b' }} />
                  <div className="flex-1">
                    <p className="text-xs font-semibold mb-1" style={{ color: '#fbbf24' }}>
                      Browser notifications {permission === 'denied' ? 'blocked' : 'not enabled'}
                    </p>
                    <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
                      {permission === 'denied'
                        ? 'Enable them in your browser site settings.'
                        : 'Allow notifications to get alerts when the tab is in background.'}
                    </p>
                    {permission !== 'denied' && (
                      <button
                        onClick={requestPermission}
                        className="px-4 py-1.5 text-xs font-bold uppercase tracking-wide cursor-pointer transition-all duration-150"
                        style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 5 }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.28)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.15)'; }}
                      >
                        Enable Browser Notifications
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div
                className="space-y-2"
                style={{ opacity: settings.enabled ? 1 : 0.4, pointerEvents: settings.enabled ? 'auto' : 'none', transition: 'opacity 0.2s' }}
              >
                {([
                  { key: 'at6h', label: 'Remind 6 hours before', sub: 'Tight deadline alert — fires ~6h out' },
                  { key: 'at12h', label: 'Remind 12 hours before', sub: 'Half-day warning before deadline' },
                  { key: 'at24h', label: 'Remind 24 hours before', sub: 'Day-before nudge to start preparing' },
                  { key: 'at48h', label: 'Remind 48 hours before', sub: 'Two-day heads-up for bigger tasks' },
                ] as const).map(w => (
                  <div
                    key={w.key}
                    className="flex items-center justify-between px-3 py-2.5 transition-colors"
                    style={{ border: '1px solid var(--color-glass-border)', borderRadius: 7, background: settings[w.key] ? 'var(--color-active-bg)' : 'transparent' }}
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{w.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{w.sub}</p>
                    </div>
                    <Toggle on={settings[w.key]} onChange={v => updateSettings({ [w.key]: v } as any)} />
                  </div>
                ))}
              </div>

              <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                SemSync checks for upcoming deadlines every 5 minutes while the app is open.
              </p>
            </div>
          </div>

          {/* ── App Guide (bottom, full width) ── */}
          <div style={{ gridColumn: 'span 2', border: '1px solid var(--color-glass-border)', borderRadius: 10, overflow: 'hidden' }}>
            <SectionHeader icon={PlayCircle} title="App Guide" color="#818cf8" />
            <div
              className="px-5 py-4 flex items-center justify-between"
              style={{ background: 'var(--color-surface-1)' }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>How to Use SemSync</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  Replay the onboarding walkthrough — covers every section of the app
                </p>
              </div>
              <button
                onClick={handleReplayTutorial}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-widest cursor-pointer transition-all duration-150"
                style={{
                  background: 'rgba(129,140,248,0.12)',
                  color: '#818cf8',
                  border: '1px solid rgba(129,140,248,0.35)',
                  borderRadius: 7,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(129,140,248,0.24)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(129,140,248,0.2)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(129,140,248,0.12)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                <PlayCircle style={{ width: 14, height: 14 }} />
                Replay Tutorial
              </button>
            </div>
          </div>

          {/* ── Academic Preferences (bottom, full width) ── */}
          <div style={{ gridColumn: 'span 2', border: '1px solid var(--color-glass-border)', borderRadius: 10, overflow: 'hidden' }}>
            <SectionHeader icon={BookOpen} title="Academic Preferences" color="var(--color-done)" />
            <div
              className="px-5 py-4"
              style={{
                background: 'var(--color-surface-1)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              <div className="flex items-center justify-between" style={{ flex: 1, minWidth: 200 }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Grade Display</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>How grades are shown throughout the app</p>
                </div>
                <span
                  className="text-xs font-bold px-3 py-1.5 uppercase tracking-widest"
                  style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 5 }}
                >
                  Percentage (%)
                </span>
              </div>

              <div style={{ width: 1, background: 'var(--color-glass-border)', alignSelf: 'stretch' }} />

              <div className="flex items-center justify-between" style={{ flex: 1, minWidth: 200 }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Remaining Weight Formula</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>100% − evaluated weight, regardless of score</p>
                </div>
                <span
                  className="text-xs font-bold px-3 py-1.5 uppercase tracking-widest"
                  style={{ background: 'var(--color-active-bg)', color: 'var(--color-brand)', border: '1px solid var(--color-brand)', borderRadius: 5, opacity: 0.9 }}
                >
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* ── About & Legal ── */}
          <div style={{ gridColumn: 'span 2', border: '1px solid var(--color-glass-border)', borderRadius: 10, overflow: 'hidden' }}>
            <SectionHeader icon={Info} title="About & Legal" color="#38bdf8" />
            <div style={{ background: 'var(--color-surface-1)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, backgroundColor: 'var(--color-glass-border)' }}>
              <Link
                to="/about"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'var(--color-surface-1)', textDecoration: 'none', transition: 'background 0.12s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-glass)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-1)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Info style={{ width: 15, height: 15, color: '#38bdf8' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>About SemSync</p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0, marginTop: 2 }}>What this app is</p>
                  </div>
                </div>
                <ExternalLink style={{ width: 13, height: 13, color: 'var(--color-text-faint)' }} />
              </Link>

              <Link
                to="/legal"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'var(--color-surface-1)', textDecoration: 'none', transition: 'background 0.12s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-glass)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-1)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Scale style={{ width: 15, height: 15, color: '#94a3b8' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>Legal & Privacy</p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0, marginTop: 2 }}>Terms of use, privacy policy & data</p>
                  </div>
                </div>
                <ExternalLink style={{ width: 13, height: 13, color: 'var(--color-text-faint)' }} />
              </Link>
            </div>
          </div>

          {/* ── Feature Requests ── */}
          <div style={{ gridColumn: 'span 2', border: '1px solid var(--color-glass-border)', borderRadius: 10, overflow: 'hidden' }}>
            <SectionHeader icon={Lightbulb} title="Feature Requests" color="#f59e0b" />
            <div style={{ background: 'var(--color-surface-1)', padding: '20px 20px 24px' }}>
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <div style={{ width: 44, height: 44, borderRadius: 11, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  <Lightbulb style={{ width: 20, height: 20, color: '#f59e0b' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px' }}>Got an idea to make SemSync better?</p>
                  <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '0 0 16px', lineHeight: 1.6 }}>
                    SemSync is built around what students actually need. If there's a feature you'd find useful — a new view, an integration, a workflow tweak — send it over. Good ideas get built.
                  </p>
                  <a
                    href="mailto:paramveer25356@iiitd.ac.in?subject=Feature%20Request"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7,
                      padding: '9px 18px', borderRadius: 7, textDecoration: 'none',
                      background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                      color: '#f59e0b', fontSize: 13, fontWeight: 700,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.2)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(245,158,11,0.15)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.1)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                  >
                    <Mail style={{ width: 14, height: 14 }} />
                    Send a Feature Request
                  </a>
                  <p style={{ fontSize: 11, color: 'var(--color-text-faint)', margin: '10px 0 0' }}>
                    Opens your mail client
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {showTutorial && (
        <OnboardingTutorial onClose={() => setShowTutorial(false)} />
      )}
    </div>
  );
}