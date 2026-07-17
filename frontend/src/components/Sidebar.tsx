import {
    LayoutDashboard,
    BookOpen,
    CalendarDays,
    ClipboardList,
    Settings,
    LogOut,
    Timer,
    GraduationCap,
    Trophy,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useAchievements } from '../context/AchievementContext';
import { authLogout } from '../lib/api';
import { useState } from 'react';
import icon from '/favicon.ico';
import XPBar from './XPBar';

const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Courses', icon: BookOpen, path: '/courses' },
    { name: 'Classroom', icon: GraduationCap, path: '/classroom' },
    { name: 'Task Center', icon: ClipboardList, path: '/tasks' },
    { name: 'Calendar', icon: CalendarDays, path: '/calendar' },
    { name: 'Focus Timer', icon: Timer, path: '/focus' },
    { name: 'Progress', icon: Trophy, path: '/progress' },
    { name: 'Settings', icon: Settings, path: '/settings' },
];

export default function Sidebar({
    isOpen = false,
    onClose,
}: {
    isOpen?: boolean;
    onClose?: () => void;
}) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { toasts } = useNotifications();
    const { xpState } = useAchievements();
    const [loggingOut, setLoggingOut] = useState(false);

    const isProgressPage = location.pathname === '/progress';

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await authLogout();
        } catch {
            /* silent */
        }
        logout();
        navigate('/');
    };

    return (
        <nav
            aria-label='Primary'
            className={`w-72 flex flex-col h-screen fixed top-0 left-0 z-40 transition-transform duration-200 lg:sticky lg:translate-x-0 lg:shrink-0 ${
                isOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
            style={{
                background: 'var(--color-sidebar-bg)',
                borderRight: '1px solid var(--color-sidebar-border)',
                backdropFilter: 'blur(20px)',
            }}
        >
            <div className='px-8 pt-8 pb-6 flex items-center justify-between'>
                <Link to='/'>
                    <div className='flex items-center gap-3'>
                        <div className='w-8 h-8 flex items-center justify-center'>
                            <img src={icon} alt='Icon' />
                        </div>
                        <div>
                            <p
                                className='font-bold text-base tracking-wide font-headline'
                                style={{ color: 'var(--color-text)' }}
                            >
                                SEMSYNC
                            </p>
                            <p
                                className='text-xs'
                                style={{ color: 'var(--color-text-muted)' }}
                            >
                                Academic Tracker
                            </p>
                        </div>
                    </div>
                </Link>
            </div>

            <nav className='grow px-4 space-y-3'>
                {navItems.map((item) => {
                    const active = location.pathname.startsWith(item.path);
                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            onClick={onClose}
                            className='flex items-center gap-3 px-4 py-3 transition-all duration-200'
                            style={{
                                background: active
                                    ? 'var(--color-active-bg)'
                                    : 'transparent',
                                color: active
                                    ? 'var(--color-active-text)'
                                    : 'var(--color-text-muted)',
                                borderRadius: '0.5rem',
                            }}
                            onMouseEnter={(e) => {
                                if (!active)
                                    (
                                        e.currentTarget as HTMLElement
                                    ).style.background = 'var(--color-glass)';
                            }}
                            onMouseLeave={(e) => {
                                if (!active)
                                    (
                                        e.currentTarget as HTMLElement
                                    ).style.background = 'transparent';
                            }}
                        >
                            <item.icon
                                className='w-4 h-4 shrink-0'
                                style={{
                                    color: active
                                        ? 'var(--color-active-text)'
                                        : 'var(--color-text-faint)',
                                }}
                            />
                            <span
                                className='text-sm font-medium'
                                style={{
                                    color: active
                                        ? 'var(--color-active-text)'
                                        : 'var(--color-text-muted)',
                                }}
                            >
                                {item.name}
                            </span>
                            {active && (
                                <div
                                    className='ml-auto w-1.5 h-1.5 rounded-full'
                                    style={{ background: 'var(--color-brand)' }}
                                />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* XP bar — hidden on Progress page (already shown there in full) */}
            {xpState && !isProgressPage && (
                <div className='px-4 pt-2 pb-1'>
                    <XPBar
                        totalXp={xpState.totalXp}
                        level={xpState.level}
                        compact
                    />
                    {xpState.currentStreak > 0 && (
                        <div className='flex items-center gap-2 px-4 py-1.5'>
                            <span className='text-base'>
                                {xpState.currentStreak >= 30 ? '⭐' : '🔥'}
                            </span>
                            <span
                                className='text-xs font-black font-mono'
                                style={{ color: 'var(--color-brand)' }}
                            >
                                {xpState.currentStreak}
                            </span>
                            <span
                                className='text-3xs uppercase tracking-widest'
                                style={{ color: 'var(--color-text-muted)' }}
                            >
                                day streak
                            </span>
                        </div>
                    )}
                </div>
            )}

            <div
                className='px-4 pb-6 pt-4 space-y-1'
                style={{ borderTop: '1px solid var(--color-glass-border)' }}
            >
                {user && (
                    <>
                        <Link
                            to='/profile'
                            onClick={onClose}
                            className='flex items-center gap-3 px-4 py-3 transition-all duration-200'
                            style={{
                                background:
                                    location.pathname === '/profile'
                                        ? 'rgba(59,130,246,0.10)'
                                        : 'transparent',
                                color:
                                    location.pathname === '/profile'
                                        ? '#3b82f6'
                                        : 'var(--color-text-muted)',
                                borderRadius: '0.5rem',
                            }}
                            onMouseEnter={(e) => {
                                if (location.pathname !== '/profile')
                                    (
                                        e.currentTarget as HTMLElement
                                    ).style.background = 'var(--color-glass)';
                            }}
                            onMouseLeave={(e) => {
                                if (location.pathname !== '/profile')
                                    (
                                        e.currentTarget as HTMLElement
                                    ).style.background = 'transparent';
                            }}
                        >
                            {user.avatarUrl ? (
                                <img
                                    src={user.avatarUrl}
                                    alt={user.name}
                                    className='w-8 h-8 ring-2'
                                    style={{ borderRadius: '50%' }}
                                />
                            ) : (
                                <div
                                    className='w-8 h-8 flex items-center justify-center text-xs font-bold'
                                    style={{
                                        background:
                                            'linear-gradient(135deg,#3b82f6,#8b5cf6)',
                                        color: '#fff',
                                        borderRadius: '50%',
                                    }}
                                >
                                    {user.name
                                        ?.split(' ')
                                        .map((n: string) => n[0])
                                        .join('')
                                        .slice(0, 2)
                                        .toUpperCase()}
                                </div>
                            )}
                            <div className='min-w-0'>
                                <p
                                    className='text-sm font-semibold truncate'
                                    style={{ color: 'var(--color-text)' }}
                                >
                                    {user.name}
                                </p>
                                <p
                                    className='text-xs truncate'
                                    style={{ color: 'var(--color-text-muted)' }}
                                >
                                    {user.email}
                                </p>
                            </div>
                        </Link>
                        <button
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className='flex items-center gap-3 px-4 py-3 w-full transition-all duration-200 disabled:opacity-40'
                            style={{
                                color: 'var(--color-text-muted)',
                                cursor: 'pointer',
                                borderRadius: '0.5rem',
                            }}
                            onMouseEnter={(e) => {
                                (
                                    e.currentTarget as HTMLElement
                                ).style.background = 'rgba(239,68,68,0.08)';
                                (e.currentTarget as HTMLElement).style.color =
                                    '#f87171';
                            }}
                            onMouseLeave={(e) => {
                                (
                                    e.currentTarget as HTMLElement
                                ).style.background = 'transparent';
                                (e.currentTarget as HTMLElement).style.color =
                                    'var(--color-text-muted)';
                            }}
                        >
                            {loggingOut ? (
                                <div className='w-4 h-4 rounded-full border border-current border-t-transparent animate-spin' />
                            ) : (
                                <LogOut className='w-4 h-4' />
                            )}
                            <span className='text-sm'>
                                {loggingOut ? 'Signing out…' : 'Sign Out'}
                            </span>
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
}
