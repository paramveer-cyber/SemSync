import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { authLogout } from '../lib/api';
import { Mail, Shield, LogOut, CheckCircle2, ExternalLink } from 'lucide-react';

export default function UserPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await authLogout(); } catch {}
    logout(); navigate('/');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  return (
    <div className="flex min-h-screen bg-[var(--color-surface)]">
      <Sidebar />

      <main className="grow flex flex-col">
        <Header title="My Profile" subtitle="Account Settings" />

        <div className="p-8 max-w-xl space-y-6">

          {/* Avatar */}
          <div
            className="rounded-xl p-6 flex items-center gap-4"
            style={{
              background: 'var(--color-glass)',
              border: '1px solid var(--color-glass-border)'
            }}>
            
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-14 h-14 rounded-xl object-cover"
              />
            ) : (
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-sm font-semibold"
                style={{
                  background: 'var(--color-brand)', color: 'var(--color-surface)'
                }}>
                {initials}
              </div>
            )}

            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                {user?.name ?? '—'}
              </h2>

              <div className="flex items-center gap-1.5 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs text-green-500">
                  Verified
                </span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div
            className="rounded-xl overflow-hidden"
            style={{
              border: '1px solid var(--color-glass-border)'
            }}>
            {[
              { icon: Mail, label: 'Email', value: user?.email ?? '—' },
              { icon: Shield, label: 'Auth Provider', value: 'Google OAuth 2.0', accent: true },
            ].map((row, i) => (
              <div
                key={row.label}
                className="flex items-center gap-3 px-5 py-4 hover:bg-white/3 transition-colors"
                style={{
                  borderBottom: i < 1 ? '1px solid var(--color-glass-border)' : 'none'
                }}>
                
                <row.icon className="w-4 h-4" style={{ color: 'var(--color-text-faint)' }} />

                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-[var(--color-text)]/40">
                    {row.label}
                  </p>
                  <p className={`text-sm truncate ${row.accent ? 'text-green-400' : 'text-[var(--color-text)]'}`}>
                    {row.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Sign Out */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="cursor-pointer w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#ef4444'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.18)';
              e.currentTarget.style.border = '1px solid rgba(239,68,68,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
              e.currentTarget.style.border = '1px solid rgba(239,68,68,0.2)';
            }}
          >
            {loggingOut
              ? <div className="w-4 h-4 rounded-full border border-current border-t-transparent animate-spin" />
              : <LogOut className="w-4 h-4" />
            }

            {loggingOut ? 'Signing out…' : 'Sign Out'}
          </button>

          {/* Legal */}
          <div
            className="rounded-xl p-5 space-y-3"
            style={{
              background: 'var(--color-glass)',
              border: '1px solid var(--color-glass-border)'
            }}>
            
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Legal & Privacy
            </p>

            <div className="space-y-3 text-xs leading-relaxed text-[var(--color-text)]/30">
              <p>
                Architect Academic Tracker is a personal productivity tool. Your data is stored securely and is never
                sold or shared with third parties. Authentication is handled via Google OAuth 2.0 and we only access
                your name, email, and profile picture.
              </p>

              <p>
                By using this service you agree to our Terms of Service. You may request deletion of your data at
                any time by contacting support.
              </p>

              <div className="flex gap-4 pt-1">
                {['Terms of Service', 'Privacy Policy', 'Data Processing'].map(l => (
                  <a
                    key={l}
                    href="/legal"
                    className="flex items-center gap-1 underline underline-offset-2 hover:text-[var(--color-text)] transition-colors">
                    {l}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-center" style={{ color: "var(--color-text-faint)" }}>
            © 2025 Architect System. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
}