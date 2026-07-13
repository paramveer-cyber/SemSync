import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Flame, Target, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMotionDisabled } from '../context/AnimationPreferenceContext';

const STAGGER_STEP_SECONDS = 0.14;

interface SessionResult {
    xp: number;
    incomplete?: boolean;
    streakStatus: {
        currentStreak: number;
        wasIncremented: boolean;
        wasBroken: boolean;
    };
    goalsCompleted: { id: string; title: string; xpReward: number }[];
    stats: {
        totalSessions: number;
        totalMinutes: number;
        level: number;
        totalXp: number;
    } | null;
    actualMinutes: number;
}

interface Props {
    result: SessionResult;
    onContinue: () => void;
    hasAchievements: boolean;
}

function XPRoll({ target }: { target: number }) {
    const [val, setVal] = useState(0);
    useEffect(() => {
        let v = 0;
        const step = Math.max(1, Math.ceil(target / 18));
        const t = setInterval(() => {
            v = Math.min(v + step, target);
            setVal(v);
            if (v >= target) clearInterval(t);
        }, 28);
        return () => clearInterval(t);
    }, [target]);
    return <>{val}</>;
}

function StatCard({
    value,
    label,
    color,
}: {
    value: ReactNode;
    label: string;
    color?: string;
}) {
    return (
        <div
            className='text-center p-3 rounded-lg'
            style={{ background: 'var(--color-surface-2)' }}
        >
            <p
                className='text-xl font-black font-mono'
                style={{ color: color ?? 'var(--color-brand)' }}
            >
                {value}
            </p>
            <p
                className='text-4xs font-bold tracking-widest uppercase mt-0.5'
                style={{ color: 'var(--color-text-muted)' }}
            >
                {label}
            </p>
        </div>
    );
}

export default function SessionComplete({
    result,
    onContinue,
    hasAchievements,
}: Props) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const id = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(id);
    }, []);

    const reducedMotion = useMotionDisabled();

    const containerVariants = {
        hidden: {},
        show: {
            transition: {
                staggerChildren: reducedMotion ? 0 : STAGGER_STEP_SECONDS,
                delayChildren: reducedMotion ? 0 : 0.1,
            },
        },
    };
    const itemVariants = {
        hidden: { opacity: 0, y: reducedMotion ? 0 : 12 },
        show: {
            opacity: 1,
            y: 0,
            transition: {
                duration: reducedMotion ? 0 : 0.28,
                ease: 'easeOut' as const,
            },
        },
    };

    const {
        xp = 0,
        incomplete,
        streakStatus,
        goalsCompleted,
        actualMinutes,
    } = result;

    return (
        <div
            className='fixed inset-0 z-[100] flex items-end justify-center pb-8'
            style={{
                background: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(6px)',
                opacity: visible ? 1 : 0,
                transition: 'opacity 0.25s ease',
            }}
        >
            <div
                className='w-full max-w-md mx-4 rounded-xl overflow-hidden'
                style={{
                    background: 'var(--color-surface-1)',
                    border: '1px solid var(--color-glass-border)',
                    transform: visible ? 'translateY(0)' : 'translateY(48px)',
                    transition:
                        'transform 0.35s cubic-bezier(0.175,0.885,0.32,1.275) 0.08s',
                    boxShadow: '0 -12px 48px rgba(0,0,0,0.5)',
                }}
            >
                {/* header stripe */}
                <div
                    className='px-6 pt-5 pb-4 flex items-center justify-between'
                    style={{
                        borderBottom: '1px solid var(--color-glass-border)',
                    }}
                >
                    <div className='flex items-center gap-2'>
                        {incomplete ? (
                            <XCircle className='w-5 h-5 text-amber-500' />
                        ) : (
                            <CheckCircle2
                                className='w-5 h-5'
                                style={{ color: 'var(--color-brand)' }}
                            />
                        )}
                        <span
                            className='text-sm font-black tracking-widest uppercase'
                            style={{ color: 'var(--color-text)' }}
                        >
                            {incomplete
                                ? 'Session Incomplete'
                                : 'Focus Complete'}
                        </span>
                    </div>
                </div>

                <motion.div
                    className='p-6 space-y-5'
                    variants={containerVariants}
                    initial='hidden'
                    animate={visible ? 'show' : 'hidden'}
                >
                    {/* stats row */}
                    <motion.div
                        className='grid grid-cols-3 gap-3'
                        variants={itemVariants}
                    >
                        <StatCard
                            value={`${actualMinutes}m`}
                            label='Duration'
                        />
                        <StatCard
                            value={<XPRoll target={xp} />}
                            label='XP Earned'
                        />
                        <StatCard
                            value={`${streakStatus?.currentStreak ?? 0}🔥`}
                            label='Streak'
                            color={
                                streakStatus?.currentStreak > 0
                                    ? 'var(--color-brand)'
                                    : 'var(--color-text-muted)'
                            }
                        />
                    </motion.div>

                    {streakStatus?.wasIncremented && (
                        <motion.div
                            className='flex items-center gap-2.5 px-3 py-2.5 rounded-lg'
                            variants={itemVariants}
                            style={{
                                background: 'var(--color-active-bg)',
                                border: '1px solid var(--color-brand)',
                            }}
                        >
                            <Flame
                                className='w-4 h-4 shrink-0'
                                style={{ color: 'var(--color-brand)' }}
                            />
                            <span
                                className='text-xs font-bold'
                                style={{ color: 'var(--color-text)' }}
                            >
                                {streakStatus.currentStreak}-day streak! Keep it
                                going.
                            </span>
                        </motion.div>
                    )}

                    {goalsCompleted?.length > 0 && (
                        <motion.div
                            className='space-y-1.5'
                            variants={itemVariants}
                        >
                            <p
                                className='text-3xs font-black tracking-widest uppercase'
                                style={{ color: 'var(--color-text-muted)' }}
                            >
                                Goals Completed
                            </p>
                            {goalsCompleted.map((g, i) => (
                                <div
                                    key={g.id}
                                    className='flex items-center justify-between px-3 py-2 rounded-lg animate-fade-up'
                                    style={{
                                        background: 'var(--color-active-bg)',
                                        border: '1px solid var(--color-brand)',
                                        animationDelay: `${i * 0.06}s`,
                                    }}
                                >
                                    <div className='flex items-center gap-2'>
                                        <Target
                                            className='w-3 h-3 shrink-0'
                                            style={{
                                                color: 'var(--color-brand)',
                                            }}
                                        />
                                        <span
                                            className='text-xs font-bold'
                                            style={{
                                                color: 'var(--color-text)',
                                            }}
                                        >
                                            {g.title}
                                        </span>
                                    </div>
                                    <span
                                        className='text-3xs font-black font-mono'
                                        style={{ color: 'var(--color-brand)' }}
                                    >
                                        +{g.xpReward} XP
                                    </span>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </motion.div>

                <div className='px-6 pb-5'>
                    <button
                        onClick={onContinue}
                        className='btn-brand w-full justify-center py-3 text-sm'
                    >
                        {hasAchievements ? 'VIEW ACHIEVEMENTS →' : 'CONTINUE'}
                    </button>
                </div>
            </div>
        </div>
    );
}
