import { LayoutDashboard, BookOpen, CalendarDays, ClipboardList, Settings, LogOut, Bell, Timer } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { authLogout } from '../lib/api';
import { useState } from 'react';

const navItems = [
  { name: 'Dashboard',   icon: LayoutDashboard, path: '/dashboard' },
  { name: 'Courses',     icon: BookOpen,         path: '/courses'   },
  { name: 'Task Center', icon: ClipboardList,    path: '/tasks'     },
  { name: 'Calendar',    icon: CalendarDays,     path: '/calendar'  },
  { name: 'Focus Timer', icon: Timer,            path: '/focus'     },
  { name: 'Settings',    icon: Settings,         path: '/settings'  },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toasts, settings } = useNotifications();
  const [loggingOut, setLoggingOut] = useState(false);

  const unread = toasts.length;

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await authLogout(); } catch { /* silent */ }
    logout();
    navigate('/');
  };

  return (
    <aside className="w-72 flex flex-col h-screen sticky top-0 shrink-0"
      style={{ background: 'rgba(10,10,15,0.95)', borderRight: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>

      {/* Logo + bell */}
      <div className="px-8 pt-8 pb-6 flex items-center justify-between rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #22c55e, #15803d)' }}>
            <span className="text-black font-bold text-sm font-headline">S</span>
          </div>
          <div>
            <p className="text-white font-bold text-base tracking-wide font-headline">SEMSYNC</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Academic Tracker</p>
          </div>
        </div>

        {/* Notification bell with badge */}
        <Link to="/settings"
          className="relative w-8 h-8 flex items-center justify-center transition-colors duration-150"
          style={{ color: settings.enabled ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.18)', cursor: 'pointer' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#22c55e')}
          onMouseLeave={e => (e.currentTarget.style.color = settings.enabled ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.18)')}
          title="Notification settings">
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center text-[9px] font-black"
              style={{ background: '#ef4444', color: '#fff' }}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-grow px-4 space-y-2">
        {navItems.map(item => {
          const active = location.pathname.startsWith(item.path);
          return (
            <Link key={item.name} to={item.path}
              className="flex items-center gap-3 px-4 py-3 rounded transition-all duration-200 group"
              style={{
                background: active ? 'rgba(34,197,94,0.12)' : 'transparent',
                color: active ? '#22c55e' : 'rgba(255,255,255,0.55)',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
              <item.icon className="w-4 h-4 shrink-0" style={{ color: active ? '#22c55e' : 'rgba(255,255,255,0.4)' }} />
              <span className="text-sm text-zinc-400 font-medium">{item.name}</span>
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand" />}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="px-4 pb-6 pt-4 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        {user && (
          <Link to="/profile"
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
            style={{
              background: location.pathname === '/profile' ? 'rgba(59,130,246,0.10)' : 'transparent',
              color: location.pathname === '/profile' ? '#3b82f6' : 'rgba(255,255,255,0.55)',
              cursor: 'pointer',
            }}
            onMouseEnter={e => { if (location.pathname !== '/profile') (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={e => { if (location.pathname !== '/profile') (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
            {user.avatarUrl
              ? <img src={user.avatarUrl} alt={user.name} className="rounded-full w-8 h-8 ring-2" style={{ ringColor: 'rgba(255,255,255,0.1)' }} />
              : <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', color: '#fff' }}>
                  {user.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
            }
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>{user.email}</p>
            </div>
          </Link>
        )}
        <button onClick={handleLogout} disabled={loggingOut}
          className="flex items-center gap-3 px-4 py-3 rounded-xl w-full transition-all duration-200 disabled:opacity-40"
          style={{ color: 'rgba(255,255,255,0.35)', cursor: 'pointer' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; (e.currentTarget as HTMLElement).style.color = '#f87171'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'; }}>
          {loggingOut
            ? <div className="w-4 h-4 rounded-full border border-current border-t-transparent animate-spin" />
            : <LogOut className="w-4 h-4" />}
          <span className="text-sm">{loggingOut ? 'Signing out…' : 'Sign Out'}</span>
        </button>
      </div>
    </aside>
  );
}
