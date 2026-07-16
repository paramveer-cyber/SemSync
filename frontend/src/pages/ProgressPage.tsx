import { useEffect, useState, useRef } from 'react';
import { Trophy, Flame, Zap, Clock, Crown, Lock, Sparkles } from 'lucide-react';
import Header from '../components/Header';
import {
    getGamificationDashboard,
    trackPageVisit,
    getAchievementCatalog,
} from '../lib/api';
import { useAchievements } from '../context/AchievementContext';
import { TIER } from '../components/AchievementsGrid';
import InfoTooltip from '../components/InfoTooltip';
import { TOOLTIP_CONTENT } from '../data/TooltipContent';
import type { ReactNode } from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

interface Stats {
    totalXp: number;
    level: number;
    totalSessions: number;
    totalMinutes: number;
}

interface CatalogEntry {
    id: string | null;
    tier: string;
    hidden: boolean;
    earned: boolean;
    locked?: boolean;
    name?: string | null;
    desc?: string | null;
    emoji?: string | null;
    xp?: number | null;
    earnedAt?: string | null;
    xpAwarded?: number | null;
}
interface Streak {
    currentStreak: number;
    longestStreak: number;
}
interface EarnedAchievement {
    achievementId: string;
    tier: string;
    xpAwarded: number;
    earnedAt: string;
}
interface Goal {
    id: string;
    type: string;
    title: string;
    targetValue: number;
    status: 'pending' | 'completed' | 'missed';
    xpReward: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const LEVEL_NAMES: Record<number, string> = {
    1: 'Student',
    2: 'Student',
    3: 'Student',
    4: 'Student',
    5: 'Grinder',
    6: 'Grinder',
    7: 'Grinder',
    8: 'Grinder',
    9: 'Grinder',
    10: 'Scholar',
    11: 'Scholar',
    12: 'Scholar',
    13: 'Scholar',
    14: 'Scholar',
    15: 'Veteran',
    16: 'Veteran',
    17: 'Veteran',
    18: 'Veteran',
    19: 'Veteran',
};
function getLevelName(l: number) {
    return l >= 30
        ? 'Legend'
        : l >= 20
          ? 'Academic'
          : (LEVEL_NAMES[l] ?? 'Student');
}
function xpForLevel(l: number) {
    return l * l * 100;
}

function flameTier(n: number) {
    if (n >= 90)
        return {
            emoji: '🌟',
            color: '#c0a8ff',
            glow: 'rgba(192,168,255,0.55)',
        };
    if (n >= 30)
        return { emoji: '🔥', color: '#FFD700', glow: 'rgba(255,215,0,0.45)' };
    if (n >= 14)
        return { emoji: '🔥', color: '#ff6b00', glow: 'rgba(255,107,0,0.35)' };
    if (n >= 7)
        return { emoji: '🔥', color: '#ff9500', glow: 'rgba(255,149,0,0.25)' };
    return {
        emoji: '🔥',
        color: 'var(--color-text-faint)',
        glow: 'transparent',
    };
}

function getAchievementProgress(
    a: CatalogEntry,
    stats: Stats | null,
    streak: Streak | null,
): { value: number; max: number } | null {
    const id = a.id;
    if (!id) return null;
    const streakMap: Record<string, number> = {
        kindling: 3,
        ritual: 14,
        no_days_off: 30,
        unbroken: 60,
        the_iron_standard: 100,
        chronos: 365,
    };
    if (streakMap[id])
        return { value: streak?.currentStreak ?? 0, max: streakMap[id] };
    const sessMap: Record<string, number> = {
        first_light: 1,
        the_contract: 3,
        the_compound: 200,
    };
    if (sessMap[id])
        return { value: stats?.totalSessions ?? 0, max: sessMap[id] };
    return null;
}

// ── Animated components ───────────────────────────────────────────────────────

function CountUp({
    target,
    duration = 900,
    suffix = '',
}: {
    target: number;
    duration?: number;
    suffix?: string;
}) {
    const [val, setVal] = useState(0);
    const done = useRef(false);
    useEffect(() => {
        if (done.current) return;
        done.current = true;
        let start = 0;
        const steps = 30;
        const iv = setInterval(() => {
            start++;
            setVal(Math.round(target * (start / steps)));
            if (start >= steps) clearInterval(iv);
        }, duration / steps);
        return () => clearInterval(iv);
    }, [target, duration]);
    return (
        <>
            {val.toLocaleString()}
            {suffix}
        </>
    );
}

function XPFillBar({ pct }: { pct: number }) {
    const [w, setW] = useState(0);
    useEffect(() => {
        const id = requestAnimationFrame(() => setW(pct));
        return () => cancelAnimationFrame(id);
    }, [pct]);
    return (
        <div className='relative h-full w-full overflow-hidden rounded-full'>
            <div
                style={{
                    width: `${w}%`,
                    height: '100%',
                    background:
                        'linear-gradient(90deg,var(--color-brand),var(--color-active-text,var(--color-brand)))',
                    transition: 'width 1.1s cubic-bezier(0.22,1,0.36,1)',
                    willChange: 'width',
                    borderRadius: 'inherit',
                }}
            />
        </div>
    );
}

function StatCard({
    icon: Icon,
    label,
    value,
    sub,
    color,
    delay = 0,
}: {
    icon: any;
    label: string;
    value: ReactNode;
    sub?: string;
    color?: string;
    delay?: number;
}) {
    return (
        <div
            className='relative overflow-hidden rounded-xl p-5 flex flex-col gap-3 animate-fade-up'
            style={{
                animationDelay: `${delay}s`,
                background: 'var(--color-surface-1)',
                border: '1px solid var(--color-glass-border)',
            }}
        >
            <div className='flex items-center justify-between'>
                <span
                    className='text-3xs font-black tracking-[0.22em] uppercase'
                    style={{ color: 'var(--color-text-muted)' }}
                >
                    {label}
                </span>
                <Icon
                    className='w-4 h-4'
                    style={{
                        color: color ?? 'var(--color-brand)',
                        opacity: 0.6,
                    }}
                />
            </div>
            <div
                className='text-4xl font-black font-mono tracking-tighter leading-none'
                style={{ color: color ?? 'var(--color-brand)' }}
            >
                {value}
            </div>
            {sub && (
                <p
                    className='text-3xs font-mono'
                    style={{ color: 'var(--color-text-muted)' }}
                >
                    {sub}
                </p>
            )}
        </div>
    );
}

// ── Achievement Tile ──────────────────────────────────────────────────────────

function AchievementTile({
    a,
    stats,
    streak,
    idx,
}: {
    a: CatalogEntry;
    stats: Stats | null;
    streak: Streak | null;
    idx: number;
}) {
    const [hover, setHover] = useState(false);
    const earned = !!a.earned;
    const ts = TIER[a.tier ?? 'bronze'] ?? TIER.bronze;
    const isHidden = !earned && (a.hidden || a.name == null);
    const date = a.earnedAt
        ? new Date(a.earnedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
          })
        : null;
    const progress = !earned ? getAchievementProgress(a, stats, streak) : null;
    const pct = progress
        ? Math.min(100, Math.round((progress.value / progress.max) * 100))
        : 0;

    return (
        <div
            className='group relative overflow-hidden rounded-xl flex flex-col items-center text-center p-5 gap-3 cursor-default animate-fade-up'
            style={{
                animationDelay: `${idx * 0.03}s`,
                opacity: earned ? 1 : isHidden ? 0.2 : 0.42,
                background: earned && hover ? ts.bg : 'var(--color-surface-1)',
                border: `1px solid ${earned ? ts.color + '33' : 'var(--color-glass-border)'}`,
                boxShadow: earned && hover ? `0 0 18px ${ts.glow}` : 'none',
                transform:
                    hover && earned ? 'translateY(-2px)' : 'translateY(0)',
                transition: 'all 0.18s cubic-bezier(0.22,1,0.36,1)',
            }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            {/* Tier pill */}
            <span
                className='text-5xs font-black tracking-[0.22em] uppercase px-2 py-0.5 rounded-full'
                style={{
                    color: earned ? ts.color : 'var(--color-text-muted)',
                    background: earned ? ts.bg : 'var(--color-surface-2)',
                    border: `1px solid ${earned ? ts.color + '33' : 'var(--color-glass-border)'}`,
                }}
            >
                {ts.badge}
            </span>

            {/* Emoji */}
            <div
                className='relative flex items-center justify-center w-16 h-16 rounded-xl'
                style={{
                    background: earned
                        ? `${ts.color}10`
                        : 'rgba(255,255,255,0.025)',
                    border: `1px solid ${earned ? ts.color + '25' : 'rgba(255,255,255,0.05)'}`,
                }}
            >
                {!earned && (
                    <Lock
                        className='absolute top-1.5 right-1.5 w-2.5 h-2.5'
                        style={{ opacity: 0.35 }}
                    />
                )}
                <span
                    style={{
                        fontSize: 'var(--text-32)',
                        filter: earned
                            ? `drop-shadow(0 0 8px ${ts.glow})`
                            : 'grayscale(1)',
                        opacity: isHidden ? 0.1 : 1,
                        transition: 'filter 0.25s ease',
                    }}
                >
                    {isHidden ? '🔮' : a.emoji}
                </span>
            </div>

            {/* Name + desc */}
            <div className='space-y-1'>
                <p
                    className='text-sm font-black leading-tight'
                    style={{
                        color: earned ? ts.color : 'var(--color-text-muted)',
                    }}
                >
                    {isHidden ? '???' : a.name}
                </p>
                <p
                    className='text-2xs leading-snug'
                    style={{ color: 'var(--color-text-muted)' }}
                >
                    {isHidden ? 'Hidden achievement' : a.desc}
                </p>
            </div>

            {/* Progress bar */}
            {!earned && !isHidden && progress && pct > 0 && (
                <div className='w-full px-1'>
                    <div
                        className='h-0.5 rounded-full overflow-hidden'
                        style={{ background: 'var(--color-surface-3)' }}
                    >
                        <div
                            className='h-full rounded-full'
                            style={{
                                width: `${pct}%`,
                                background: ts.color,
                                opacity: 0.5,
                                transition: 'width 0.8s ease',
                            }}
                        />
                    </div>
                    <p
                        className='text-4xs font-mono mt-1 text-center'
                        style={{ color: 'var(--color-text-muted)' }}
                    >
                        {progress.value.toLocaleString()} /{' '}
                        {progress.max.toLocaleString()}
                    </p>
                </div>
            )}

            {/* Earned footer */}
            {earned ? (
                <div
                    className='w-full mt-auto pt-3'
                    style={{ borderTop: `1px solid ${ts.color}18` }}
                >
                    <div className='flex items-center justify-between'>
                        <span
                            className='text-4xs font-mono'
                            style={{ color: 'var(--color-text-muted)' }}
                        >
                            {date}
                        </span>
                        <span
                            className='text-3xs font-black font-mono'
                            style={{ color: ts.color }}
                        >
                            +{a.xpAwarded ?? a.xp} XP
                        </span>
                    </div>
                </div>
            ) : (
                <div className='w-full mt-auto pt-2'>
                    <span
                        className='text-4xs font-bold tracking-widest uppercase'
                        style={{ color: 'var(--color-text-muted)' }}
                    >
                        {isHidden ? '???' : 'Locked'}
                    </span>
                </div>
            )}
        </div>
    );
}

// ── Goals Panel ───────────────────────────────────────────────────────────────

function GoalsPanel({ goals }: { goals: Goal[] }) {
    if (!goals?.length) return null;
    const done = goals.filter((g) => g.status === 'completed').length;
    const pct = Math.round((done / goals.length) * 100);
    const allDone = done === goals.length;

    return (
        <div
            className='card p-5 animate-fade-up'
            style={{
                animationDelay: '0.1s',
                borderColor: allDone ? 'var(--color-brand)' : undefined,
                boxShadow: allDone
                    ? '0 0 18px var(--color-brand-glow)'
                    : undefined,
                transition: 'border-color 0.5s,box-shadow 0.5s',
            }}
        >
            <div className='flex items-center justify-between mb-2'>
                <span
                    className='text-3xs font-black tracking-[0.22em] uppercase'
                    style={{ color: 'var(--color-brand)' }}
                >
                    Today's Goals
                </span>
                <span
                    className='text-3xs font-black font-mono'
                    style={{
                        color: allDone
                            ? 'var(--color-brand)'
                            : 'var(--color-text-muted)',
                    }}
                >
                    {done}/{goals.length}
                </span>
            </div>
            <div
                className='h-0.5 rounded-full overflow-hidden mb-4'
                style={{ background: 'var(--color-surface-3)' }}
            >
                <div
                    className='h-full rounded-full'
                    style={{
                        width: `${pct}%`,
                        background: 'var(--color-brand)',
                        transition: 'width 0.8s ease',
                    }}
                />
            </div>
            <div className='space-y-2'>
                {goals.map((g, i) => {
                    const isDone = g.status === 'completed';
                    return (
                        <div
                            key={g.id}
                            className='flex items-center gap-3 px-3 py-2.5 rounded-lg'
                            style={{
                                background: isDone
                                    ? 'var(--color-active-bg)'
                                    : 'var(--color-surface-2)',
                                border: `1px solid ${isDone ? 'var(--color-brand)' : 'var(--color-glass-border)'}`,
                                opacity: g.status === 'missed' ? 0.35 : 1,
                                animation: `fadeUp 0.3s ease ${i * 0.05}s both`,
                                transition:
                                    'background 0.25s,border-color 0.25s',
                            }}
                        >
                            <span
                                style={{
                                    color: isDone
                                        ? 'var(--color-brand)'
                                        : 'var(--color-text-faint)',
                                    fontSize: 'var(--text-13)',
                                    fontWeight: 900,
                                }}
                            >
                                {isDone ? '✓' : '·'}
                            </span>
                            <span
                                className='text-xs font-bold flex-1'
                                style={{
                                    color: isDone
                                        ? 'var(--color-text-muted)'
                                        : 'var(--color-text)',
                                    textDecoration: isDone
                                        ? 'line-through'
                                        : 'none',
                                    transition: 'color 0.2s',
                                }}
                            >
                                {g.title}
                            </span>
                            <span
                                className='text-3xs font-black font-mono shrink-0'
                                style={{
                                    color: isDone
                                        ? 'var(--color-brand)'
                                        : 'var(--color-text-muted)',
                                }}
                            >
                                +{g.xpReward}
                            </span>
                        </div>
                    );
                })}
            </div>
            {allDone && (
                <p
                    className='mt-3 text-center text-xs font-bold animate-scale-in'
                    style={{ color: 'var(--color-brand)' }}
                >
                    All goals complete — you built this. 🎯
                </p>
            )}
        </div>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────

type FilterMode = 'all' | 'earned' | 'locked';

export default function ProgressPage() {
    useDocumentTitle('Progress');
    const { checkAchievements } = useAchievements();
    const [data, setData] = useState<{
        stats: Stats | null;
        streak: Streak | null;
        catalog: CatalogEntry[];
        goals: Goal[];
    }>({
        stats: null,
        streak: null,
        catalog: [],
        goals: [],
    });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterMode>('all');
    const [tierFilter, setTierFilter] = useState<string>('all');

    useEffect(() => {
        trackPageVisit('progress').catch(() => {});

        const dashboardPromise = getGamificationDashboard();
        const catalogPromise = getAchievementCatalog().catch(() => ({
            achievements: [],
        }));

        dashboardPromise
            .then((d: any) => {
                const fallbackCatalog: CatalogEntry[] = (d.earned ?? []).map(
                    (e: EarnedAchievement) => ({
                        id: e.achievementId,
                        tier: e.tier,
                        hidden: false,
                        earned: true,
                        earnedAt: e.earnedAt,
                        xpAwarded: e.xpAwarded,
                    }),
                );
                setData((prev) => ({
                    ...prev,
                    stats: d.stats ?? null,
                    streak: d.streak ?? null,
                    goals: d.goals ?? [],
                    catalog: prev.catalog.length
                        ? prev.catalog
                        : fallbackCatalog,
                }));
                // Trigger global achievement check — ensures toasts fire even if user came here directly
                checkAchievements();
            })
            .catch(() => {})
            .finally(() => setLoading(false));

        catalogPromise.then((catalogRes: any) => {
            const catalogAchievements: any[] = catalogRes.achievements ?? [];
            if (!catalogAchievements.length) return;
            const catalog: CatalogEntry[] = catalogAchievements.map((a) => ({
                id: a.id,
                tier: a.tier,
                hidden: false,
                earned: !!a.completed,
                locked: !a.completed,
                name: a.name,
                desc: a.desc,
                emoji: a.emoji,
                xp: a.xp,
                earnedAt: a.earnedAt,
                xpAwarded: a.xp,
            }));
            setData((prev) => ({ ...prev, catalog }));
        });
    }, [checkAchievements]);

    const { stats, streak, catalog, goals } = data;

    const level = stats?.level ?? 1;
    const totalXp = stats?.totalXp ?? 0;
    const curLevelXp = xpForLevel(level - 1);
    const nxtLevelXp = xpForLevel(level);
    const xpInLevel = totalXp - curLevelXp;
    const xpNeeded = nxtLevelXp - curLevelXp;
    const pct = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));

    const tierCounts = {
        bronze: 0,
        silver: 0,
        gold: 0,
        platinum: 0,
        legendary: 0,
    };
    catalog
        .filter((a) => a.earned)
        .forEach((a) => {
            if (a.tier in tierCounts)
                tierCounts[a.tier as keyof typeof tierCounts]++;
        });

    const sortedAchievements = [...catalog].sort((a, b) => {
        if (a.earned !== b.earned) return a.earned ? -1 : 1;
        if (a.earned && b.earned)
            return (b.earnedAt ?? '').localeCompare(a.earnedAt ?? '');
        if (a.hidden !== b.hidden) return a.hidden ? 1 : -1;
        return 0;
    });

    const visibleAchievements = sortedAchievements.filter((a) => {
        if (filter === 'earned' && !a.earned) return false;
        if (filter === 'locked' && a.earned) return false;
        if (tierFilter !== 'all' && a.tier !== tierFilter) return false;
        return true;
    });

    const fl = streak ? flameTier(streak.currentStreak) : flameTier(0);

    if (loading) {
        return (
            <div className='grow p-8 space-y-4'>
                <div className='h-10 w-64 rounded-lg bg-[var(--color-surface-2)] animate-pulse' />
                <div className='grid grid-cols-4 gap-4'>
                    {[0, 1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className='h-32 rounded-xl bg-[var(--color-surface-2)] animate-pulse'
                        />
                    ))}
                </div>
                <div className='h-40 rounded-xl bg-[var(--color-surface-2)] animate-pulse' />
                <div className='grid grid-cols-3 gap-4'>
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className='h-52 rounded-xl bg-[var(--color-surface-2)] animate-pulse'
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className='grow overflow-y-auto'>
                <Header
                    title='Progress'
                    subtitle='Your academic momentum at a glance'
                />

                <div className='p-8 space-y-8'>
                    {/* ── Level + XP hero ───────────────────────────────────────── */}
                    <section
                        className='relative overflow-hidden rounded-2xl p-8 animate-fade-up'
                        style={{
                            background: 'var(--color-surface-1)',
                            border: '1px solid var(--color-glass-border)',
                        }}
                    >
                        <div className='relative z-10 grid lg:grid-cols-[1.4fr_0.8fr] gap-8 items-center'>
                            <div>
                                <div className='flex items-center gap-3 mb-5'>
                                    <div
                                        className='w-11 h-11 rounded-xl flex items-center justify-center'
                                        style={{
                                            background:
                                                'var(--color-active-bg)',
                                            border: '1px solid var(--color-brand)22',
                                        }}
                                    >
                                        <Crown
                                            className='w-5 h-5'
                                            style={{
                                                color: 'var(--color-brand)',
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <p
                                            className='text-4xs font-black tracking-[0.3em] uppercase flex items-center gap-1.5'
                                            style={{
                                                color: 'var(--color-brand)',
                                            }}
                                        >
                                            Academic Rank
                                        </p>
                                        <h1
                                            className='text-3xl font-black tracking-tight'
                                            style={{
                                                color: 'var(--color-text)',
                                            }}
                                        >
                                            {getLevelName(level)}
                                        </h1>
                                    </div>
                                </div>

                                <div className='flex items-end gap-5 mb-7'>
                                    <span
                                        className='text-7xl font-black font-mono leading-none'
                                        style={{ color: 'var(--color-brand)' }}
                                    >
                                        {level}
                                    </span>
                                    <div className='pb-1'>
                                        <p
                                            className='text-xs font-mono mb-0.5'
                                            style={{
                                                color: 'var(--color-text-muted)',
                                            }}
                                        >
                                            Total XP
                                        </p>
                                        <p
                                            className='text-2xl font-black'
                                            style={{
                                                color: 'var(--color-text)',
                                            }}
                                        >
                                            {totalXp.toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                {/* XP bar — full width, clean */}
                                <div className='mb-2 flex items-center justify-between'>
                                    <span
                                        className='text-4xs font-black tracking-[0.18em] uppercase'
                                        style={{
                                            color: 'var(--color-text-muted)',
                                        }}
                                    >
                                        Progress to Level {level + 1}
                                    </span>
                                    <span
                                        className='text-xs font-black font-mono'
                                        style={{ color: 'var(--color-brand)' }}
                                    >
                                        {pct}%
                                    </span>
                                </div>
                                <div
                                    className='h-3 rounded-full overflow-hidden'
                                    style={{
                                        background: 'var(--color-surface-3)',
                                    }}
                                >
                                    <XPFillBar pct={pct} />
                                </div>
                                <div className='flex justify-between mt-1.5'>
                                    <span
                                        className='text-4xs font-mono'
                                        style={{
                                            color: 'var(--color-text-muted)',
                                        }}
                                    >
                                        {xpInLevel.toLocaleString()} XP
                                    </span>
                                    <span
                                        className='text-4xs font-mono'
                                        style={{
                                            color: 'var(--color-text-muted)',
                                        }}
                                    >
                                        {(
                                            xpNeeded - xpInLevel
                                        ).toLocaleString()}{' '}
                                        XP remaining
                                    </span>
                                </div>
                            </div>

                            {/* Right: streak + snapshot */}
                            <div className='grid grid-cols-2 gap-3'>
                                <div
                                    className='rounded-xl p-5 text-center'
                                    style={{
                                        background: 'var(--color-surface-2)',
                                        border: '1px solid var(--color-glass-border)',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 'var(--text-44)',
                                            filter: `drop-shadow(0 0 14px ${fl?.glow})`,
                                        }}
                                    >
                                        {fl?.emoji}
                                    </div>
                                    <p
                                        className='text-4xl font-black font-mono leading-none mt-1'
                                        style={{ color: fl?.color }}
                                    >
                                        {streak?.currentStreak ?? 0}
                                    </p>
                                    <p
                                        className='text-4xs uppercase tracking-[0.18em] mt-1.5 font-black'
                                        style={{
                                            color: 'var(--color-text-muted)',
                                        }}
                                    >
                                        Streak
                                    </p>
                                </div>
                                <div
                                    className='rounded-xl p-5'
                                    style={{
                                        background: 'var(--color-surface-2)',
                                        border: '1px solid var(--color-glass-border)',
                                    }}
                                >
                                    <div className='flex items-center gap-1.5 mb-3'>
                                        <Sparkles
                                            className='w-3.5 h-3.5'
                                            style={{
                                                color: 'var(--color-brand)',
                                            }}
                                        />
                                        <p
                                            className='text-4xs uppercase tracking-[0.18em] font-black'
                                            style={{
                                                color: 'var(--color-text-muted)',
                                            }}
                                        >
                                            Snapshot
                                        </p>
                                    </div>
                                    <div className='space-y-3'>
                                        <div>
                                            <p className='text-2xl font-black'>
                                                {
                                                    catalog.filter(
                                                        (a) => a.earned,
                                                    ).length
                                                }
                                            </p>
                                            <p
                                                className='text-3xs'
                                                style={{
                                                    color: 'var(--color-text-muted)',
                                                }}
                                            >
                                                Achievements
                                            </p>
                                        </div>
                                        <div>
                                            <p className='text-2xl font-black'>
                                                {Math.round(
                                                    (stats?.totalMinutes ?? 0) /
                                                        60,
                                                )}
                                                h
                                            </p>
                                            <p
                                                className='text-3xs'
                                                style={{
                                                    color: 'var(--color-text-muted)',
                                                }}
                                            >
                                                Focus time
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── Stats row ─────────────────────────────────────────────── */}
                    <section className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                        <StatCard
                            icon={Flame}
                            label='Current Streak'
                            delay={0}
                            value={
                                streak ? (
                                    <span
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.375rem',
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: 'var(--text-26)',
                                                filter: `drop-shadow(0 0 6px ${fl?.glow})`,
                                                animation:
                                                    streak.currentStreak >= 14
                                                        ? 'flameFlicker 1.4s ease-in-out infinite'
                                                        : 'none',
                                                display: 'inline-block',
                                            }}
                                        >
                                            {fl?.emoji}
                                        </span>
                                        <CountUp
                                            target={streak.currentStreak}
                                        />
                                    </span>
                                ) : (
                                    '—'
                                )
                            }
                            sub={
                                streak &&
                                streak.longestStreak > streak.currentStreak
                                    ? `Best: ${streak.longestStreak} days`
                                    : streak?.currentStreak ===
                                            streak?.longestStreak &&
                                        (streak?.currentStreak ?? 0) > 0
                                      ? '🏆 Personal best'
                                      : undefined
                            }
                            color={fl?.color ?? 'var(--color-brand)'}
                        />
                        <StatCard
                            icon={Zap}
                            label='Total XP'
                            delay={0.05}
                            value={<CountUp target={totalXp} />}
                            sub={`Level ${level} · ${getLevelName(level)}`}
                        />
                        <StatCard
                            icon={Clock}
                            label='Hours Studied'
                            delay={0.1}
                            value={
                                <>
                                    <CountUp
                                        target={Math.round(
                                            (stats?.totalMinutes ?? 0) / 60,
                                        )}
                                    />
                                    <span
                                        style={{
                                            fontSize: 'var(--type-h4-size)',
                                            opacity: 0.5,
                                        }}
                                    >
                                        h
                                    </span>
                                </>
                            }
                            sub={`${stats?.totalSessions ?? 0} sessions`}
                        />
                        <StatCard
                            icon={Trophy}
                            label='Achievements'
                            delay={0.15}
                            value={
                                <CountUp
                                    target={
                                        catalog.filter((a) => a.earned).length
                                    }
                                />
                            }
                            sub={`of ${catalog.length} total`}
                        />
                    </section>

                    {/* ── Streak + Goals ────────────────────────────────────────── */}
                    {streak && (
                        <section className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                            <div
                                className='card p-5 animate-fade-up'
                                style={{
                                    borderColor:
                                        streak.currentStreak >= 30
                                            ? flameTier(streak.currentStreak)
                                                  .color + '33'
                                            : undefined,
                                    boxShadow:
                                        streak.currentStreak >= 30
                                            ? `0 0 20px ${flameTier(streak.currentStreak).glow}`
                                            : undefined,
                                    transition:
                                        'border-color 0.4s,box-shadow 0.4s',
                                }}
                            >
                                <p
                                    className='text-3xs font-black tracking-[0.22em] uppercase mb-4'
                                    style={{ color: 'var(--color-brand)' }}
                                >
                                    Streak History
                                </p>
                                <div className='grid grid-cols-2 gap-4'>
                                    {[
                                        {
                                            label: 'Current',
                                            val: streak.currentStreak,
                                            suffix: 'd',
                                            color: fl?.color,
                                        },
                                        {
                                            label: 'Longest',
                                            val: streak.longestStreak,
                                            suffix: 'd',
                                            color: 'var(--color-text)',
                                        },
                                    ].map(({ label, val, suffix, color }) => (
                                        <div
                                            key={label}
                                            className='text-center'
                                        >
                                            <p
                                                className='text-2xl font-black font-mono leading-none'
                                                style={{
                                                    color:
                                                        color ??
                                                        'var(--color-brand)',
                                                }}
                                            >
                                                {val}
                                                {suffix}
                                            </p>
                                            <p
                                                className='text-4xs font-bold uppercase tracking-widest mt-1'
                                                style={{
                                                    color: 'var(--color-text-muted)',
                                                }}
                                            >
                                                {label}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <GoalsPanel goals={goals} />
                        </section>
                    )}

                    {/* ── Achievements ──────────────────────────────────────────── */}
                    <section>
                        <div className='flex flex-wrap items-center justify-between gap-3 mb-5'>
                            <div className='flex items-baseline gap-3'>
                                <h2
                                    className='text-lg font-extrabold tracking-tight uppercase flex items-center gap-1.5'
                                    style={{ color: 'var(--color-text)' }}
                                >
                                    Achievements
                                </h2>
                                <InfoTooltip
                                    content={TOOLTIP_CONTENT.achievementTiers}
                                />
                                <span
                                    className='text-xs font-mono'
                                    style={{ color: 'var(--color-text-muted)' }}
                                >
                                    {catalog.filter((a) => a.earned).length}/
                                    {catalog.length}
                                </span>
                            </div>

                            <div className='flex items-center gap-2 flex-wrap'>
                                {/* Tier filter */}
                                <div
                                    className='flex items-center gap-1 p-1 rounded-lg'
                                    style={{
                                        background: 'var(--color-surface-2)',
                                        border: '1px solid var(--color-glass-border)',
                                    }}
                                >
                                    <button
                                        onClick={() => setTierFilter('all')}
                                        className='px-2 py-1 text-4xs font-black rounded-md cursor-pointer transition-all duration-150'
                                        style={{
                                            background:
                                                tierFilter === 'all'
                                                    ? 'var(--color-brand)'
                                                    : 'transparent',
                                            color:
                                                tierFilter === 'all'
                                                    ? 'var(--color-surface)'
                                                    : 'var(--color-text-faint)',
                                        }}
                                    >
                                        ALL
                                    </button>
                                    {(Object.keys(TIER) as string[]).map(
                                        (t) => (
                                            <button
                                                key={t}
                                                onClick={() =>
                                                    setTierFilter(
                                                        tierFilter === t
                                                            ? 'all'
                                                            : t,
                                                    )
                                                }
                                                className='px-2 py-1 text-4xs font-black rounded-md cursor-pointer transition-all duration-150'
                                                style={{
                                                    background:
                                                        tierFilter === t
                                                            ? TIER[t].bg
                                                            : 'transparent',
                                                    color:
                                                        tierFilter === t
                                                            ? TIER[t].color
                                                            : 'var(--color-text-faint)',
                                                    border:
                                                        tierFilter === t
                                                            ? `1px solid ${TIER[t].color}33`
                                                            : '1px solid transparent',
                                                }}
                                            >
                                                {TIER[t].badge}
                                                {tierCounts[
                                                    t as keyof typeof tierCounts
                                                ] > 0 && (
                                                    <span className='ml-1 opacity-60'>
                                                        {
                                                            tierCounts[
                                                                t as keyof typeof tierCounts
                                                            ]
                                                        }
                                                    </span>
                                                )}
                                            </button>
                                        ),
                                    )}
                                </div>

                                {/* Status filter */}
                                <div
                                    className='flex items-center gap-1 p-1 rounded-lg'
                                    style={{
                                        background: 'var(--color-surface-2)',
                                        border: '1px solid var(--color-glass-border)',
                                    }}
                                >
                                    {(['all', 'earned', 'locked'] as const).map(
                                        (f) => (
                                            <button
                                                key={f}
                                                onClick={() => setFilter(f)}
                                                className='px-3 py-1.5 text-4xs font-black tracking-widest uppercase rounded-md cursor-pointer transition-all duration-150'
                                                style={{
                                                    background:
                                                        filter === f
                                                            ? 'var(--color-brand)'
                                                            : 'transparent',
                                                    color:
                                                        filter === f
                                                            ? 'var(--color-surface)'
                                                            : 'var(--color-text-faint)',
                                                }}
                                            >
                                                {f}
                                            </button>
                                        ),
                                    )}
                                </div>
                            </div>
                        </div>

                        {visibleAchievements.length > 0 ? (
                            <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'>
                                {visibleAchievements.map((a, i) => (
                                    <AchievementTile
                                        key={a.id ?? `hidden-${i}`}
                                        a={a}
                                        idx={i}
                                        stats={stats}
                                        streak={streak}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className='card p-12 text-center'>
                                <span
                                    style={{
                                        fontSize: 'var(--type-h2-size)',
                                        opacity: 0.3,
                                    }}
                                >
                                    🔮
                                </span>
                                <p
                                    className='mt-3 text-sm font-bold'
                                    style={{ color: 'var(--color-text-muted)' }}
                                >
                                    {filter === 'earned'
                                        ? 'No achievements earned yet.'
                                        : 'Nothing matches this filter.'}
                                </p>
                                {filter === 'earned' && (
                                    <p
                                        className='mt-1 text-xs'
                                        style={{
                                            color: 'var(--color-text-faint)',
                                        }}
                                    >
                                        Start a focus session to unlock your
                                        first one.
                                    </p>
                                )}
                            </div>
                        )}
                    </section>
                </div>

                <footer
                    className='mt-auto px-8 py-6 flex justify-between items-center'
                    style={{ borderTop: '1px solid var(--color-glass-border)' }}
                >
                    <span
                        className='text-3xs uppercase tracking-[0.2em]'
                        style={{ color: 'var(--color-text-faint)' }}
                    >
                        © 2026 SEMSYNC
                    </span>
                </footer>
            </div>
        </>
    );
}
