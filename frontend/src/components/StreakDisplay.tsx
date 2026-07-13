import { useEffect, useState, useRef, useId } from 'react';
import { useMotionDisabled } from '../context/AnimationPreferenceContext';

const flameParticleOffsets = [-6, 5, -3, 7, -8, 2, 6, -4, 3];

interface StreakProps {
    current: number;
    longest: number;
    lastActiveDate?: string | null;
    compact?: boolean;
}

function flameTier(n: number) {
    if (n >= 90)
        return {
            emoji: '🌟',
            color: '#c0a8ff',
            glow: 'rgba(192,168,255,0.55)',
            size: 36,
        };
    if (n >= 30)
        return {
            emoji: '🔥',
            color: '#FFD700',
            glow: 'rgba(255,215,0,0.45)',
            size: 34,
        };
    if (n >= 14)
        return {
            emoji: '🔥',
            color: '#ff6b00',
            glow: 'rgba(255,107,0,0.35)',
            size: 32,
        };
    if (n >= 7)
        return {
            emoji: '🔥',
            color: '#ff9500',
            glow: 'rgba(255,149,0,0.25)',
            size: 30,
        };
    return {
        emoji: '🔥',
        color: 'rgba(255,149,0,0.4)',
        glow: 'transparent',
        size: 28,
    };
}

function Flame({ streak }: { streak: number }) {
    const t = flameTier(streak);
    const motionDisabled = useMotionDisabled();
    const isActive = streak > 0;
    const shouldAnimate = isActive && !motionDisabled;
    const gooFilterId = useId();

    if (!shouldAnimate) {
        return (
            <span
                style={{
                    fontSize: t.size,
                    display: 'inline-block',
                    filter:
                        streak >= 7 ? `drop-shadow(0 0 8px ${t.glow})` : 'none',
                }}
            >
                {t.emoji}
            </span>
        );
    }

    return (
        <span
            className='flame-icon'
            style={{
                width: t.size,
                height: t.size,
                filter: streak >= 7 ? `drop-shadow(0 0 8px ${t.glow})` : 'none',
            }}
        >
            <svg width='0' height='0' style={{ position: 'absolute' }}>
                <filter id={gooFilterId} colorInterpolationFilters='sRGB'>
                    <feGaussianBlur
                        in='SourceGraphic'
                        stdDeviation={t.size / 16}
                        result='blur'
                    />
                    <feColorMatrix
                        in='blur'
                        mode='matrix'
                        values='1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7'
                    />
                </filter>
            </svg>
            <span
                className='flame-goo'
                style={{ filter: `url(#${gooFilterId})` }}
            >
                <span className='flame-base' style={{ background: t.color }} />
                {flameParticleOffsets.map((offsetX, index) => (
                    <span
                        key={index}
                        className='flame-particle'
                        style={
                            {
                                background: t.color,
                                animationDelay: `${index * 0.13}s`,
                                '--flame-dx': `${offsetX}px`,
                            } as React.CSSProperties
                        }
                    />
                ))}
            </span>
        </span>
    );
}

function CountUp({
    target,
    duration = 600,
}: {
    target: number;
    duration?: number;
}) {
    const [val, setVal] = useState(target);
    const mounted = useRef(false);
    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true;
            return;
        }
        let i = 0;
        const steps = 20;
        const iv = setInterval(() => {
            i++;
            setVal(Math.round(target * (i / steps)));
            if (i >= steps) clearInterval(iv);
        }, duration / steps);
        return () => clearInterval(iv);
    }, [target, duration]);
    return <>{val}</>;
}

export default function StreakDisplay({
    current,
    longest,
    lastActiveDate,
    compact = false,
}: StreakProps) {
    const [atRisk, setAtRisk] = useState(false);

    useEffect(() => {
        const today = new Date().toISOString().slice(0, 10);
        const studiedToday = lastActiveDate === today;
        const hour = new Date().getHours();
        setAtRisk(!studiedToday && current > 0 && hour >= 18 && hour < 23);
    }, [current, lastActiveDate]);

    const t = flameTier(current);
    const isNewPB = current > 0 && current === longest && current >= 7;
    const isPBPending = longest > current;

    if (compact) {
        return (
            <div className='flex items-center gap-2 px-4 py-2'>
                <Flame streak={current} />
                <div>
                    <span
                        className='text-lg font-black font-mono'
                        style={{
                            color: atRisk ? '#ef4444' : 'var(--color-text)',
                            animation: atRisk
                                ? 'riskGlow 2s ease-in-out infinite'
                                : 'none',
                        }}
                    >
                        {current}
                    </span>
                    <span
                        className='text-3xs font-bold ml-1 uppercase tracking-widest'
                        style={{ color: 'var(--color-text-muted)' }}
                    >
                        day streak
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div
            className='card p-5'
            style={{
                borderColor: atRisk
                    ? 'rgba(239,68,68,0.4)'
                    : isNewPB
                      ? t.color + '55'
                      : undefined,
                boxShadow: isNewPB ? `0 0 28px ${t.glow}` : undefined,
                transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
            }}
        >
            <div className='flex items-center justify-between mb-3'>
                <span
                    className='text-3xs font-black tracking-[0.25em] uppercase'
                    style={{ color: 'var(--color-brand)' }}
                >
                    // STREAK
                </span>
                <div className='flex items-center gap-2'>
                    {atRisk && (
                        <span
                            className='text-3xs font-black px-2 py-0.5 rounded-full'
                            style={{
                                background: 'rgba(239,68,68,0.08)',
                                border: '1px solid rgba(239,68,68,0.35)',
                                color: '#ef4444',
                            }}
                        >
                            AT RISK
                        </span>
                    )}
                </div>
            </div>

            <div className='flex items-center gap-3 mb-3'>
                <Flame streak={current} />
                <span
                    className='text-5xl font-black font-mono tracking-tighter leading-none'
                    style={{
                        color: atRisk ? '#ef4444' : 'var(--color-text)',
                        animation: atRisk
                            ? 'riskGlow 2s ease-in-out infinite'
                            : 'none',
                        textShadow:
                            current >= 30 ? `0 0 24px ${t.glow}` : 'none',
                    }}
                >
                    <CountUp target={current} />
                </span>
                <span
                    className='text-sm font-bold uppercase tracking-widest'
                    style={{ color: 'var(--color-text-muted)' }}
                >
                    days
                </span>
            </div>

            {isNewPB && (
                <p
                    className='text-3xs font-bold animate-fade-up'
                    style={{ color: t.color }}
                >
                    🏆 New personal best!
                </p>
            )}
            {isPBPending && (
                <p
                    className='text-3xs font-mono'
                    style={{ color: 'var(--color-text-faint)' }}
                >
                    Best: {longest} days
                </p>
            )}

            {atRisk && (
                <div
                    className='mt-3 px-3 py-2.5 rounded-lg text-xs font-bold animate-fade-up'
                    style={{
                        background: 'rgba(239,68,68,0.07)',
                        border: '1px solid rgba(239,68,68,0.28)',
                        color: '#ef4444',
                    }}
                >
                    🔥 Your {current}-day streak is still alive — one session
                    keeps it going.
                </div>
            )}
        </div>
    );
}
