import { useState } from 'react';

export const TIER: Record<
    string,
    { color: string; glow: string; badge: string; bg: string }
> = {
    bronze: {
        color: '#CD7F32',
        glow: 'rgba(205,127,50,0.18)',
        badge: 'BRONZE',
        bg: 'rgba(205,127,50,0.07)',
    },
    silver: {
        color: '#C0C0C0',
        glow: 'rgba(192,192,192,0.18)',
        badge: 'SILVER',
        bg: 'rgba(192,192,192,0.07)',
    },
    gold: {
        color: '#FFD700',
        glow: 'rgba(255,215,0,0.22)',
        badge: 'GOLD',
        bg: 'rgba(255,215,0,0.07)',
    },
    platinum: {
        color: '#c0a8ff',
        glow: 'rgba(192,168,255,0.28)',
        badge: 'PLATINUM',
        bg: 'rgba(192,168,255,0.08)',
    },
    legendary: {
        color: '#ff9a3c',
        glow: 'rgba(255,154,60,0.35)',
        badge: 'LEGENDARY',
        bg: 'rgba(255,154,60,0.09)',
    },
};

// Server-shaped catalog entry — what /focus/dashboard sends
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
type AchievementsGridProps = {
    catalog?: CatalogEntry[];
};

export default function AchievementsGrid({
    catalog = [],
}: AchievementsGridProps) {
    const [showAll, setShowAll] = useState(false);
    const [tooltip, setTooltip] = useState<string | null>(null);

    const items: CatalogEntry[] = catalog;

    const sorted = [...items].sort((a, b) => {
        const aR = a.earned ? 0 : a.hidden && !a.earned ? 2 : 1;
        const bR = b.earned ? 0 : b.hidden && !b.earned ? 2 : 1;
        return aR - bR;
    });

    const INITIAL_SHOW = 8;
    const visible = showAll ? sorted : sorted.slice(0, INITIAL_SHOW);
    const moreCount = sorted
        .slice(INITIAL_SHOW)
        .filter((a) => !a.earned).length;

    const earnedCount = items.filter((a) => a.earned).length;
    const totalCount = items.length;
    const progress = Math.round((earnedCount / totalCount) * 100);

    return (
        <div className='card p-5'>
            <div className='flex items-center justify-between mb-1'>
                <span
                    className='text-3xs font-black tracking-[0.25em] uppercase'
                    style={{ color: 'var(--color-brand)' }}
                >
                    // ACHIEVEMENTS
                </span>
                <span
                    className='text-3xs font-bold font-mono'
                    style={{ color: 'var(--color-text-muted)' }}
                >
                    {earnedCount}/{totalCount}
                </span>
            </div>

            <div
                className='h-0.5 rounded-full overflow-hidden mb-4'
                style={{ background: 'var(--color-surface-3)' }}
            >
                <div
                    className='h-full rounded-full'
                    style={{
                        width: `${progress}%`,
                        background: 'var(--color-brand)',
                        transition: 'width 0.9s cubic-bezier(0.22,1,0.36,1)',
                    }}
                />
            </div>

            <div className='grid grid-cols-4 gap-2'>
                {visible.map((a, i) => {
                    const isEarned = !!a.earned;
                    const ts = TIER[a.tier] ?? TIER.bronze;
                    const isHiddenLocked = a.hidden && !isEarned;
                    const isTooltipOpen = tooltip === (a.id ?? `slot-${i}`);

                    return (
                        <div
                            key={a.id ?? `slot-${i}`}
                            className='relative flex flex-col items-center p-3 rounded-lg cursor-default'
                            style={{
                                background: isEarned
                                    ? ts.bg
                                    : 'var(--color-surface-2)',
                                border: `1px solid ${isEarned ? ts.color + '55' : 'var(--color-glass-border)'}`,
                                opacity: isEarned ? 1 : 0.45,
                                transition:
                                    'opacity 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease',
                                boxShadow:
                                    isEarned && isTooltipOpen
                                        ? `0 0 18px ${ts.glow}`
                                        : undefined,
                                transform: isTooltipOpen
                                    ? 'scale(1.06)'
                                    : 'scale(1)',
                                animation: isEarned
                                    ? `fadeUp 0.35s ease ${i * 0.04}s both`
                                    : 'none',
                            }}
                            onMouseEnter={() => setTooltip(a.id ?? `slot-${i}`)}
                            onMouseLeave={() => setTooltip(null)}
                        >
                            <span
                                className='text-2xl mb-1'
                                style={{
                                    filter: isEarned
                                        ? `drop-shadow(0 0 6px ${ts.glow})`
                                        : 'grayscale(1)',
                                    opacity: isHiddenLocked ? 0 : 1,
                                }}
                            >
                                {a.emoji}
                            </span>

                            {isHiddenLocked && (
                                <span className='absolute inset-0 flex items-center justify-center text-xl'>
                                    🔮
                                </span>
                            )}

                            <span
                                className='text-4xs font-black text-center leading-tight'
                                style={{
                                    color: isEarned
                                        ? ts.color
                                        : 'var(--color-text-faint)',
                                }}
                            >
                                {isHiddenLocked ? '???' : a.name}
                            </span>

                            {isEarned && (
                                <span
                                    className='text-5xs font-bold mt-0.5 font-mono'
                                    style={{ color: ts.color }}
                                >
                                    +{a.xpAwarded ?? a.xp}
                                </span>
                            )}

                            {isTooltipOpen && !isHiddenLocked && (
                                <div
                                    className='absolute bottom-full left-1/2 mb-2 z-50 w-36 px-2.5 py-2 rounded-lg text-3xs font-semibold text-center pointer-events-none animate-fade-in'
                                    style={{
                                        transform: 'translateX(-50%)',
                                        background: 'var(--color-surface-3)',
                                        border: `1px solid ${ts.color}55`,
                                        color: 'var(--color-text)',
                                        boxShadow: `0 4px 20px ${ts.glow}`,
                                    }}
                                >
                                    <div
                                        className='font-black mb-0.5'
                                        style={{ color: ts.color }}
                                    >
                                        {a.name}
                                    </div>
                                    <div
                                        style={{
                                            color: 'var(--color-text-muted)',
                                        }}
                                    >
                                        {a.desc}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {earnedCount === 0 && (
                <div className='mt-4 text-center animate-fade-up'>
                    <p
                        className='text-2xs font-bold'
                        style={{ color: 'var(--color-text-faint)' }}
                    >
                        Start a focus session to unlock your first achievement.
                    </p>
                </div>
            )}

            {!showAll && moreCount > 0 && (
                <button
                    onClick={() => setShowAll(true)}
                    className='w-full mt-3 py-2 text-3xs font-bold tracking-widest uppercase cursor-pointer rounded-lg transition-all duration-150'
                    style={{
                        color: 'var(--color-text-faint)',
                        border: '1px solid var(--color-glass-border)',
                        background: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                        (
                            e.currentTarget as HTMLButtonElement
                        ).style.borderColor = 'var(--color-brand)';
                        (e.currentTarget as HTMLButtonElement).style.color =
                            'var(--color-brand)';
                    }}
                    onMouseLeave={(e) => {
                        (
                            e.currentTarget as HTMLButtonElement
                        ).style.borderColor = 'var(--color-glass-border)';
                        (e.currentTarget as HTMLButtonElement).style.color =
                            'var(--color-text-faint)';
                    }}
                >
                    + {moreCount} more to discover
                </button>
            )}
        </div>
    );
}
