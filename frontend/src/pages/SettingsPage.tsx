import { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useTheme, THEMES } from '../context/ThemeContext';
import { Bell, BellOff, BookOpen, Palette, Sun, Moon, PlayCircle } from 'lucide-react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import OnboardingTutorial, { resetTutorial } from '../components/OnboardingTutorial';

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

function ThemeSwatch({ name, dark, vars, selected, onClick }: {
  themeId: string; name: string; dark: boolean; vars: Record<string, string>; selected: boolean; onClick: () => void;
}) {
  const brand   = vars['--color-brand'];
  const surface = vars['--color-surface'];
  const text    = vars['--color-text'];

  return (
    <button
      onClick={onClick}
      title={name}
      style={{
        width: '100%', padding: '8px 10px',
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
        <div style={{ position: 'absolute', top: 9, left: 4, width: 7,  height: 2, borderRadius: 2, background: text, opacity: 0.3 }} />
      </div>

      <div style={{ textAlign: 'left', flex: 1 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: text, margin: 0, lineHeight: 1.3 }}>{name}</p>
        <p style={{ fontSize: 10, color: `${text}88`, margin: 0, marginTop: 1 }}>{dark ? 'Dark' : 'Light'}</p>
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
  );
}

export default function SettingsPage() {
  const { settings, updateSettings, permission, requestPermission } = useNotifications();
  const { theme, setTheme } = useTheme();
  const [showTutorial, setShowTutorial] = useState(false);

  const handleReplayTutorial = () => {
    resetTutorial();
    setShowTutorial(true);
  };

  const darkThemes  = THEMES.filter(t => t.dark);
  const lightThemes = THEMES.filter(t => !t.dark);

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-surface)' }}>
      <Sidebar />
      <main className="grow flex flex-col">
        <Header title="Settings" subtitle="Preferences & Configuration" />

        {/* ── Tiled grid ── */}
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

            </div>
          </div>

          {/* ── Deadline Reminders (top-right) ── */}
          <div style={{ border: '1px solid var(--color-glass-border)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <SectionHeader icon={Bell} title="Deadline Reminders" color="var(--color-warn)" />
            <div className="px-5 py-4 space-y-4" style={{ background: 'var(--color-surface-1)', flex: 1 }}>

              {/* Master toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Enable Reminders</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Get notified before upcoming evaluations</p>
                </div>
                <Toggle on={settings.enabled} onChange={v => updateSettings({ enabled: v })} />
              </div>

              {/* Permission warning */}
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

              {/* Interval toggles */}
              <div
                className="space-y-2"
                style={{ opacity: settings.enabled ? 1 : 0.4, pointerEvents: settings.enabled ? 'auto' : 'none', transition: 'opacity 0.2s' }}
              >
                {([
                  { key: 'at6h',  label: 'Remind 6 hours before',  sub: 'Tight deadline alert — fires ~6h out' },
                  { key: 'at12h', label: 'Remind 12 hours before', sub: 'Half-day warning before deadline'     },
                  { key: 'at24h', label: 'Remind 24 hours before', sub: 'Day-before nudge to start preparing' },
                  { key: 'at48h', label: 'Remind 48 hours before', sub: 'Two-day heads-up for bigger tasks'   },
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

              {/* Vertical divider */}
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

        </div>
      </main>

      {showTutorial && (
        <OnboardingTutorial onClose={() => setShowTutorial(false)} />
      )}
    </div>
  );
}