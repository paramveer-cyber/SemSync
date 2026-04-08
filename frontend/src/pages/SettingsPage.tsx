import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Bell, BellOff, User, BookOpen, Save, CheckCircle2, AlertTriangle } from 'lucide-react';

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="relative flex items-center transition-all duration-200"
      style={{
        width: 44, height: 24,
        background: on ? 'linear-gradient(135deg,#22c55e,#15803d)' : 'rgba(255,255,255,0.1)',
        border: on ? '1px solid rgba(34,197,94,0.5)' : '1px solid rgba(255,255,255,0.15)',
        cursor: 'pointer',
        boxShadow: on ? '0 0 10px rgba(34,197,94,0.25)' : 'none',
      }}>
      <div className="absolute transition-all duration-200"
        style={{ width: 16, height: 16, background: on ? '#000' : 'rgba(255,255,255,0.5)', left: on ? 24 : 4 }} />
    </button>
  );
}

function Section({ icon: Icon, title, color, children }: { icon: any; title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center gap-3 px-6 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="w-1 self-stretch" style={{ background: color }} />
        <Icon className="w-4 h-4" style={{ color }} />
        <h3 className="text-sm font-bold text-white tracking-wide">{title}</h3>
      </div>
      <div className="px-6 py-5 space-y-5">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
        color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', marginBottom: 6 }}>{label}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '10px 14px',
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${focused ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.09)'}`,
          color: '#fff', fontSize: '0.875rem', outline: 'none',
          fontFamily: 'inherit', transition: 'border-color 0.15s',
        }} />
    </div>
  );
}

export default function SettingsPage() {
  const { user }    = useAuth();
  const { settings, updateSettings, permission, requestPermission } = useNotifications();

  const [displayName, setDisplayName] = useState(user?.name ?? '');
  const [cgpa,        setCgpa       ] = useState('');
  const [semester,    setSemester   ] = useState('');
  const [saved,       setSaved      ] = useState(false);
  const [saveErr,     setSaveErr    ] = useState('');

  const handleSaveProfile = () => {
    setSaveErr('');
    if (!displayName.trim()) { setSaveErr('Display name cannot be empty.'); return; }
    if (cgpa && (parseFloat(cgpa) < 0 || parseFloat(cgpa) > 10)) { setSaveErr('CGPA must be 0–10.'); return; }
    localStorage.setItem('semsync_profile', JSON.stringify({ displayName: displayName.trim(), cgpa, semester }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />
      <main className="grow flex flex-col">
        <Header title="Settings" subtitle="Preferences & Configuration" />
        <div className="p-8 max-w-2xl space-y-6">

          {/* Profile */}
          <Section icon={User} title="Profile" color="#3b82f6">
            <Field label="Display Name" value={displayName} onChange={setDisplayName} placeholder="Your name" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="CGPA" value={cgpa} onChange={setCgpa} type="number" placeholder="e.g. 8.4" />
              <Field label="Current Semester" value={semester} onChange={setSemester} placeholder="e.g. Sem 4" />
            </div>
            {saveErr && (
              <div className="flex items-center gap-2 px-4 py-2.5"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: '#ef4444' }} />
                <span className="text-xs" style={{ color: '#f87171' }}>{saveErr}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveProfile}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-widest cursor-pointer transition-all duration-150"
                style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.4)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#22c55e'; (e.currentTarget as HTMLElement).style.color = '#000'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(34,197,94,0.1)'; (e.currentTarget as HTMLElement).style.color = '#22c55e'; }}
              >
                <Save className="w-3.5 h-3.5" /> Save Profile
              </button>
              {saved && (
                <span className="flex items-center gap-1.5 text-xs font-semibold animate-fade-up" style={{ color: '#22c55e' }}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
                </span>
              )}
            </div>
          </Section>

          {/* Notifications */}
          <Section icon={Bell} title="Deadline Reminders" color="#f59e0b">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Enable Reminders</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>Get notified before upcoming evaluations</p>
              </div>
              <Toggle on={settings.enabled} onChange={v => updateSettings({ enabled: v })} />
            </div>

            {permission !== 'granted' && permission !== 'unsupported' && (
              <div className="flex items-start gap-3 px-4 py-3"
                style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <BellOff className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#f59e0b' }} />
                <div className="flex-1">
                  <p className="text-xs font-semibold mb-1" style={{ color: '#fbbf24' }}>
                    Browser notifications {permission === 'denied' ? 'blocked' : 'not enabled'}
                  </p>
                  <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.38)' }}>
                    {permission === 'denied'
                      ? 'Enable them in your browser site settings.'
                      : 'Allow notifications to get alerts when the tab is in background.'}
                  </p>
                  {permission !== 'denied' && (
                    <button
                      onClick={requestPermission}
                      className="px-4 py-1.5 text-xs font-bold uppercase tracking-wide cursor-pointer transition-all duration-150"
                      style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.35)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.28)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.15)'; }}
                    >Enable Browser Notifications</button>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3 pt-1"
              style={{ opacity: settings.enabled ? 1 : 0.4, pointerEvents: settings.enabled ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
              {([
                { key: 'at6h',  label: 'Remind 6 hours before',  sub: 'Tight deadline alert — fires ~6h out'  },
                { key: 'at12h', label: 'Remind 12 hours before', sub: 'Half-day warning before deadline'      },
                { key: 'at24h', label: 'Remind 24 hours before', sub: 'Day-before nudge to start preparing'  },
                { key: 'at48h', label: 'Remind 48 hours before', sub: 'Two-day heads-up for bigger tasks'    },
              ] as const).map(w => (
                <div key={w.key}
                  className="flex items-center justify-between px-4 py-3 transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.07)', background: settings[w.key] ? 'rgba(34,197,94,0.04)' : 'transparent' }}>
                  <div>
                    <p className="text-sm font-medium text-white">{w.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{w.sub}</p>
                  </div>
                  <Toggle on={settings[w.key]} onChange={v => updateSettings({ [w.key]: v } as any)} />
                </div>
              ))}
            </div>

            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>
              SemSync checks for upcoming deadlines every 5 minutes while the app is open.
            </p>
          </Section>

          {/* Academic */}
          <Section icon={BookOpen} title="Academic Preferences" color="#8b5cf6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Grade Display</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>How grades are shown throughout the app</p>
              </div>
              <span className="text-xs font-bold px-3 py-1.5 uppercase tracking-widest"
                style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)' }}>
                Percentage (%)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Remaining Weight Formula</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>100% − evaluated weight, regardless of score</p>
              </div>
              <span className="text-xs font-bold px-3 py-1.5 uppercase tracking-widest"
                style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' }}>
                Active
              </span>
            </div>
          </Section>

        </div>
      </main>
    </div>
  );
}
