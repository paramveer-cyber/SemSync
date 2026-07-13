import { useEffect, useRef, useState } from 'react';

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
    20: 'Academic',
};

function getLevelName(level: number): string {
    if (level >= 30) return 'Legend';
    if (level >= 20) return 'Academic';
    return LEVEL_NAMES[level] ?? 'Student';
}

function xpForLevel(level: number): number {
    return level * level * 100;
}

export { getLevelName, xpForLevel };

function AnimatedBar({ pct }: { pct: number }) {
    const [width, setWidth] = useState(0);
    const mounted = useRef(false);
    const prevPct = useRef(pct);

    useEffect(() => {
        if (mounted.current) return;
        mounted.current = true;
        const raf1 = requestAnimationFrame(() => {
            const raf2 = requestAnimationFrame(() => setWidth(pct));
            return () => cancelAnimationFrame(raf2);
        });
        return () => cancelAnimationFrame(raf1);
    }, []);

    useEffect(() => {
        if (!mounted.current) return;
        if (prevPct.current === pct) return;
        prevPct.current = pct;
        setWidth(pct);
    }, [pct]);

    return (
        <div className='relative h-full w-full overflow-hidden'>
            <div
                className='h-full rounded-full'
                style={{
                    width: `${width}%`,
                    background:
                        'linear-gradient(90deg, var(--color-brand), var(--color-active-text, var(--color-brand)))',
                    transition: 'width 1s cubic-bezier(0.22,1,0.36,1)',
                    willChange: 'width',
                }}
            />
        </div>
    );
}

interface XPBarProps {
    totalXp: number;
    level: number;
    compact?: boolean;
}

export default function XPBar({ totalXp, level, compact = false }: XPBarProps) {
    const currentLevelXp = xpForLevel(level - 1);
    const nextLevelXp = xpForLevel(level);
    const xpInLevel = totalXp - currentLevelXp;
    const xpNeeded = nextLevelXp - currentLevelXp;
    const pct = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));
    const name = getLevelName(level);
    const nextName = getLevelName(level + 1);

    if (compact) {
        return (
            <div
                className='px-4 py-3'
                style={{ borderTop: '1px solid var(--color-glass-border)' }}
            >
                <div className='flex items-center justify-between mb-1.5'>
                    <span
                        className='text-3xs font-black tracking-widest uppercase'
                        style={{ color: 'var(--color-brand)' }}
                    >
                        Lv.{level} {name}
                    </span>
                    <span
                        className='text-3xs font-mono'
                        style={{ color: 'var(--color-text-muted)' }}
                    >
                        {pct}%
                    </span>
                </div>
                <div
                    className='h-1 rounded-full overflow-hidden'
                    style={{ background: 'var(--color-glass-border)' }}
                >
                    <AnimatedBar pct={pct} />
                </div>
            </div>
        );
    }

    return (
        <div className='card p-4'>
            <div className='flex items-center justify-between mb-2'>
                <div className='flex items-baseline gap-2'>
                    <span
                        className='text-base font-black tracking-tight'
                        style={{ color: 'var(--color-brand)' }}
                    >
                        Lv.{level}
                    </span>
                    <span
                        className='text-sm font-bold'
                        style={{ color: 'var(--color-text)' }}
                    >
                        {name}
                    </span>
                </div>
                <span
                    className='text-xs font-mono'
                    style={{ color: 'var(--color-text-muted)' }}
                >
                    {xpInLevel.toLocaleString()} / {xpNeeded.toLocaleString()}{' '}
                    XP
                </span>
            </div>
            <div
                className='h-2 rounded-full overflow-hidden'
                style={{ background: 'var(--color-surface-3)' }}
            >
                <AnimatedBar pct={pct} />
            </div>
            <div className='flex justify-between mt-1.5'>
                <span
                    className='text-4xs font-mono'
                    style={{ color: 'var(--color-text-faint)' }}
                >
                    {pct}% to {nextName}
                </span>
                <span
                    className='text-4xs font-mono'
                    style={{ color: 'var(--color-text-faint)' }}
                >
                    {(xpNeeded - xpInLevel).toLocaleString()} XP left
                </span>
            </div>
        </div>
    );
}
