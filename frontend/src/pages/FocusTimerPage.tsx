import { useState, useEffect, useRef, useCallback } from 'react';
import Header from '../components/Header';
import { getConfiguration } from '../lib/localConfiguration';
import { motion } from 'motion/react';
import { useDelayedSkeleton } from '../hooks/useDelayedSkeleton';
import { fetchCourses, Course, Evaluation } from '../lib/dataService';
import {
    Timer,
    Play,
    Pause,
    RotateCcw,
    X,
    Plus,
    Zap,
    Coffee,
    ChevronDown,
    CheckCircle2,
    XCircle,
    Link2,
    Target,
    AlertCircle,
    BookOpen,
} from 'lucide-react';
import {
    timerGet,
    timerStart,
    timerPause,
    timerResume,
    timerExtend,
    timerSync,
    timerEnd,
    getGamificationDashboard,
} from '../lib/api';
import SessionComplete from '../components/SessionComplete';
import DailyGoals from '../components/DailyGoals';
import StreakDisplay from '../components/StreakDisplay';
import FocusHeatmap from '../components/FocusHeatMap';
import InfoTooltip from '../components/InfoTooltip';
import { TOOLTIP_CONTENT } from '../data/TooltipContent';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

interface ServerTimer {
    id: string;
    status: 'running' | 'paused';
    startedAt: string;
    plannedMinutes: number;
    elapsedSeconds: number;
    remainingSeconds: number;
    nonce: string;
    linkedTaskId: string | null;
    linkedEvalId: string | null;
    quickTitle: string | null;
    quickCategory: string | null;
}
type UIPhase = 'idle' | 'focus' | 'break';
interface TimerTask {
    id: string;
    title: string;
    category: string;
}
interface EvalItem {
    id: string;
    title: string;
    courseName?: string;
    type?: string;
    date?: string;
    weightage?: number;
}

const CATEGORIES = [
    'Reading',
    'Note Making',
    'Question Solving',
    'Coding',
    'Debugging',
    'Writing',
    'Planning',
    'Reviewing',
    'Research',
    'General',
];
const BREAK_MINUTES = 3;
const SYNC_INTERVAL_MS = 30_000;
const QUOTES = [
    {
        text: 'The secret of getting ahead is getting started.',
        author: 'Mark Twain',
    },
    {
        text: 'Focus is the art of knowing what to ignore.',
        author: 'James Clear',
    },
    {
        text: 'Deep work is the superpower of the 21st century.',
        author: 'Cal Newport',
    },
    {
        text: 'Do the hard thing first. Everything after is easy.',
        author: 'Brian Tracy',
    },
    {
        text: 'Energy, not time, is the fundamental currency of high performance.',
        author: 'Jim Loehr',
    },
    {
        text: "You don't rise to the level of your goals. You fall to the level of your systems.",
        author: 'James Clear',
    },
    {
        text: 'The difference between ordinary and extraordinary is that little extra.',
        author: 'Jimmy Johnson',
    },
    {
        text: "It's not about having time. It's about making time.",
        author: 'Unknown',
    },
    {
        text: 'The successful warrior is the average person with laser-like focus.',
        author: 'Bruce Lee',
    },
];

function QuoteCard() {
    const [idx] = useState(() => Math.floor(Math.random() * QUOTES.length));
    const q = QUOTES[idx];
    return (
        <div
            className='flex flex-col justify-between rounded-lg'
            style={{
                border: '1px solid var(--color-brand)',
                background: 'var(--color-active-bg)',
                padding: '20px 24px',
            }}
        >
            <div className='flex items-start gap-3 mb-3'>
                <Zap
                    className='w-4 h-4 shrink-0 mt-0.5'
                    style={{ color: 'var(--color-brand)' }}
                />
                <span
                    className='text-3xs font-black tracking-[0.25em] uppercase'
                    style={{ color: 'var(--color-brand)' }}
                >
                    FOCUS PROTOCOL
                </span>
            </div>
            <p className='text-sm font-bold leading-relaxed text-[var(--color-text)] mb-3 italic'>
                "{q.text}"
            </p>
            <p className='text-3xs font-mono tracking-widest uppercase text-[var(--color-text-muted)]'>
                — {q.author}
            </p>
        </div>
    );
}

function TimerArc({ progress, phase }: { progress: number; phase: UIPhase }) {
    const r = 130;
    const cx = 150;
    const cy = 150;
    const startAngle = -220;
    const endAngle = 40;
    const totalAngle = endAngle - startAngle;
    const polarToXY = (angle: number) => {
        const rad = (angle * Math.PI) / 180;
        return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    };
    const describeArc = (fa: number, ta: number) => {
        const s = polarToXY(fa);
        const e = polarToXY(ta);
        const la = ta - fa > 180 ? 1 : 0;
        return `M ${s.x} ${s.y} A ${r} ${r} 0 ${la} 1 ${e.x} ${e.y}`;
    };
    const fillAngle = startAngle + totalAngle * (1 - progress);
    const color =
        phase === 'break' ? 'var(--color-info)' : 'var(--color-brand)';
    return (
        <svg width='100%' height='100%' viewBox='0 0 300 300' fill='none'>
            <path
                d={describeArc(startAngle, endAngle)}
                stroke='var(--color-glass-border)'
                strokeWidth='12'
                fill='none'
                strokeLinecap='round'
            />
            {progress > 0 && (
                <path
                    d={describeArc(startAngle, fillAngle)}
                    stroke={color}
                    strokeWidth='12'
                    fill='none'
                    strokeLinecap='round'
                    style={{
                        filter: `drop-shadow(0 0 8px ${color}88)`,
                        transition: 'all 1s linear',
                    }}
                />
            )}
            {progress > 0 &&
                (() => {
                    const dot = polarToXY(fillAngle);
                    return (
                        <circle
                            cx={dot.x}
                            cy={dot.y}
                            r='6'
                            fill={color}
                            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
                        />
                    );
                })()}
        </svg>
    );
}

export default function FocusTimerPage() {
    useDocumentTitle('Focus Timer');
    const FOCUS_CHIPS = [15, 30, 45, 60];

    const [serverTimer, setServerTimer] = useState<ServerTimer | null>(null);
    const [timerLoaded, setTimerLoaded] = useState(false);
    const showSkeleton = useDelayedSkeleton(!timerLoaded);
    const [displaySeconds, setDisplaySeconds] = useState(0);
    const localTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const pendingOpRef = useRef<string | null>(null);
    const rollbackRef = useRef<{
        timer: ServerTimer | null;
        display: number;
    } | null>(null);
    const [finalizing, setFinalizing] = useState(false);

    const [breakPhase, setBreakPhase] = useState(false);
    const [breakSecondsLeft, setBreakSecondsLeft] = useState(
        BREAK_MINUTES * 60,
    );
    const breakIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
        null,
    );

    const [sessionResult, setSessionResult] = useState<any>(null);
    const [showSessionComplete, setShowSessionComplete] = useState(false);
    const [gamifData, setGamifData] = useState<any>(null);

    const [evals, setEvals] = useState<EvalItem[]>([]);
    const [tasks] = useState<TimerTask[]>(() => {
        try {
            return (getConfiguration().tasks as any[]).map((t: any) => ({
                id: t.id,
                title: t.title,
                category: t.course || 'General',
            }));
        } catch {
            return [];
        }
    });
    const [linkedTask, setLinkedTask] = useState<TimerTask | null>(null);
    const [linkedEval, setLinkedEval] = useState<EvalItem | null>(null);
    const [quickTitle, setQuickTitle] = useState('');
    const [quickCategory, setQuickCategory] = useState(CATEGORIES[0]);
    const [draftTitle, setDraftTitle] = useState('');
    const [draftCategory, setDraftCategory] = useState(CATEGORIES[0]);
    const [showTaskPicker, setShowTaskPicker] = useState(false);
    const [showEvalPicker, setShowEvalPicker] = useState(false);
    const [showQuickTask, setShowQuickTask] = useState(false);
    const [taskError, setTaskError] = useState(false);
    const [selectedMinutes, setSelectedMinutes] = useState(25);

    const audioCtxRef = useRef<AudioContext | null>(null);
    const playTone = (
        freq: number,
        dur: number,
        type: OscillatorType = 'sine',
        gain = 0.25,
    ) => {
        try {
            if (!audioCtxRef.current)
                audioCtxRef.current = new (
                    window.AudioContext || (window as any).webkitAudioContext
                )();
            const ctx = audioCtxRef.current;
            const osc = ctx.createOscillator();
            const gn = ctx.createGain();
            osc.connect(gn);
            gn.connect(ctx.destination);
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            osc.type = type;
            gn.gain.setValueAtTime(0, ctx.currentTime);
            gn.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.01);
            gn.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
            osc.start();
            osc.stop(ctx.currentTime + dur);
        } catch {
            /* noop */
        }
    };
    const playSessionComplete = () => {
        playTone(523, 0.15);
        setTimeout(() => playTone(659, 0.15), 150);
        setTimeout(() => playTone(784, 0.3), 300);
    };

    // Apply server timer → set display
    function applyServerTimer(t: ServerTimer) {
        setServerTimer(t);
        setDisplaySeconds(Math.max(0, t.remainingSeconds));
    }

    // Load active timer on mount
    useEffect(() => {
        timerGet()
            .then((res: any) => {
                if (res?.timer) applyServerTimer(res.timer);
                setTimerLoaded(true);
            })
            .catch(() => setTimerLoaded(true));
        getGamificationDashboard()
            .then((d: any) => setGamifData(d))
            .catch(() => {});
        if ('Notification' in window && Notification.permission === 'default')
            Notification.requestPermission();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const cl = await fetchCourses();
                const g: EvalItem[] = [];
                cl.forEach((c: Course) => {
                    (c.evaluations ?? []).forEach((ev: Evaluation) =>
                        g.push({
                            id: ev.id,
                            title: ev.title,
                            courseName: c.name ?? '',
                            type: ev.type,
                            date: ev.date,
                            weightage: ev.weightage,
                        }),
                    );
                });
                setEvals(g);
            } catch {}
        })();
    }, []);

    // handleTimerExpired defined with useCallback, ref-forwarded into tick
    const handleTimerExpiredRef = useRef<(() => Promise<void>) | undefined>(
        undefined,
    );
    const handleTimerExpired = useCallback(async () => {
        if (!serverTimer) return;
        setServerTimer(null);
        setDisplaySeconds(0);
        setFinalizing(true);
        try {
            const result: any = await timerEnd({
                nonce: serverTimer.nonce,
            });
            setFinalizing(false);
            if (result && !result.dropped) {
                playSessionComplete();
                setSessionResult({
                    ...result,
                    actualMinutes: result.actualMinutes,
                });
                setShowSessionComplete(true);
                setGamifData((prev: any) => ({
                    ...prev,
                    stats: result.stats ?? prev?.stats,
                    streak: result.streak ?? prev?.streak,
                    recentSessions: [result, ...(prev?.recentSessions ?? [])],
                }));
                getGamificationDashboard()
                    .then((d: any) =>
                        setGamifData((prev: any) => ({
                            ...prev,
                            goals: d.goals ?? prev?.goals,
                        })),
                    )
                    .catch(() => {});
            }
            if (
                'Notification' in window &&
                Notification.permission === 'granted'
            )
                new Notification('Focus Complete!', {
                    body: 'Great work! Take a break 🌱',
                });
            setBreakPhase(true);
        } catch {
            setFinalizing(false);
            setBreakPhase(true);
        }
    }, [serverTimer]);
    useEffect(() => {
        handleTimerExpiredRef.current = handleTimerExpired;
    }, [handleTimerExpired]);

    // Local tick
    useEffect(() => {
        if (localTickRef.current) clearInterval(localTickRef.current);
        if (!serverTimer || serverTimer.status !== 'running') return;
        localTickRef.current = setInterval(() => {
            setDisplaySeconds((prev) => {
                const next = Math.max(0, prev - 1);
                if (next === 0) {
                    clearInterval(localTickRef.current!);
                    localTickRef.current = null;
                    handleTimerExpiredRef.current?.();
                }
                return next;
            });
        }, 1000);
        return () => {
            if (localTickRef.current) clearInterval(localTickRef.current);
        };
    }, [serverTimer?.id, serverTimer?.status]);

    // Server sync heartbeat
    useEffect(() => {
        if (!serverTimer) return;
        const id = setInterval(async () => {
            try {
                const res: any = await timerSync();
                if (res?.timer) applyServerTimer(res.timer);
                else {
                    setServerTimer(null);
                    setDisplaySeconds(0);
                }
            } catch {
                /* keep local tick */
            }
        }, SYNC_INTERVAL_MS);
        return () => clearInterval(id);
    }, [serverTimer?.id]);

    // Break countdown
    useEffect(() => {
        if (!breakPhase) {
            if (breakIntervalRef.current)
                clearInterval(breakIntervalRef.current);
            return;
        }
        setBreakSecondsLeft(BREAK_MINUTES * 60);
        breakIntervalRef.current = setInterval(() => {
            setBreakSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(breakIntervalRef.current!);
                    setBreakPhase(false);
                    if (
                        'Notification' in window &&
                        Notification.permission === 'granted'
                    )
                        new Notification('Break Over!', {
                            body: 'Ready to focus again?',
                        });
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => {
            if (breakIntervalRef.current)
                clearInterval(breakIntervalRef.current);
        };
    }, [breakPhase]);

    // ── Actions ────────────────────────────────────────────────────────────────
    const acquireOp = (op: string) => {
        if (pendingOpRef.current) return false;
        pendingOpRef.current = op;
        return true;
    };
    const releaseOp = () => {
        pendingOpRef.current = null;
    };

    const saveRollback = (timer: ServerTimer | null, display: number) => {
        rollbackRef.current = { timer, display };
    };
    const rollback = () => {
        if (!rollbackRef.current) return;
        const { timer, display } = rollbackRef.current;
        setServerTimer(timer);
        setDisplaySeconds(display);
        rollbackRef.current = null;
    };

    const start = async () => {
        if (!linkedEval && !linkedTask && !quickTitle.trim()) {
            setTaskError(true);
            setTimeout(() => setTaskError(false), 3000);
            return;
        }
        if (!acquireOp('start')) return;
        const optimisticTimer: ServerTimer = {
            id: 'optimistic',
            status: 'running',
            startedAt: new Date().toISOString(),
            plannedMinutes: selectedMinutes,
            elapsedSeconds: 0,
            remainingSeconds: selectedMinutes * 60,
            nonce: 'optimistic',
            linkedTaskId: linkedTask?.id ?? null,
            linkedEvalId: linkedEval?.id ?? null,
            quickTitle: quickTitle || null,
            quickCategory: quickCategory || null,
        };
        saveRollback(null, selectedMinutes * 60);
        applyServerTimer(optimisticTimer);
        try {
            const res: any = await timerStart({
                plannedMinutes: selectedMinutes,
                linkedTaskId: linkedTask?.id ?? null,
                linkedEvalId: linkedEval?.id ?? null,
                linkedEvalDueDate: linkedEval?.date ?? null,
                quickTitle: quickTitle || null,
                quickCategory: quickCategory || null,
            });
            if (res?.timer) applyServerTimer(res.timer);
            rollbackRef.current = null;
        } catch {
            rollback();
        } finally {
            releaseOp();
        }
    };

    const pause = async () => {
        if (!serverTimer || serverTimer.status !== 'running') return;
        if (!acquireOp('pause')) return;
        saveRollback(serverTimer, displaySeconds);
        const optimistic = {
            ...serverTimer,
            status: 'paused' as const,
            remainingSeconds: displaySeconds,
        };
        setServerTimer(optimistic);
        if (localTickRef.current) clearInterval(localTickRef.current);
        try {
            const res: any = await timerPause();
            if (res?.timer) applyServerTimer(res.timer);
            rollbackRef.current = null;
        } catch {
            rollback();
        } finally {
            releaseOp();
        }
    };

    const resume = async () => {
        if (!serverTimer || serverTimer.status !== 'paused') return;
        if (!acquireOp('resume')) return;
        saveRollback(serverTimer, displaySeconds);
        const optimistic = { ...serverTimer, status: 'running' as const };
        setServerTimer(optimistic);
        try {
            const res: any = await timerResume();
            if (res?.timer) applyServerTimer(res.timer);
            rollbackRef.current = null;
        } catch {
            rollback();
        } finally {
            releaseOp();
        }
    };

    const extend = async () => {
        if (!serverTimer || serverTimer.status !== 'running') return;
        if (!acquireOp('extend')) return;
        saveRollback(serverTimer, displaySeconds);
        const optimistic = {
            ...serverTimer,
            plannedMinutes: serverTimer.plannedMinutes + 5,
            remainingSeconds: displaySeconds + 300,
        };
        setServerTimer(optimistic);
        setDisplaySeconds((prev) => prev + 300);
        try {
            const res: any = await timerExtend(5);
            if (res?.timer) applyServerTimer(res.timer);
            rollbackRef.current = null;
        } catch {
            rollback();
        } finally {
            releaseOp();
        }
    };

    const dismiss = async () => {
        if (!serverTimer) return;
        if (!acquireOp('dismiss')) return;
        saveRollback(serverTimer, displaySeconds);
        if (localTickRef.current) {
            clearInterval(localTickRef.current);
            localTickRef.current = null;
        }
        const snap = { nonce: serverTimer.nonce };
        setServerTimer(null);
        setDisplaySeconds(0);
        try {
            const result: any = await timerEnd(snap);
            rollbackRef.current = null;
            if (result && !result.dropped) {
                playSessionComplete();
                setSessionResult({
                    ...result,
                    actualMinutes: result.actualMinutes,
                });
                setShowSessionComplete(true);
                setGamifData((prev: any) => ({
                    ...prev,
                    stats: result.stats ?? prev?.stats,
                    streak: result.streak ?? prev?.streak,
                    recentSessions: [result, ...(prev?.recentSessions ?? [])],
                }));
            }
        } catch {
            rollback();
        } finally {
            releaseOp();
        }
    };

    const reset = async () => {
        if (!acquireOp('reset')) return;
        if (localTickRef.current) {
            clearInterval(localTickRef.current);
            localTickRef.current = null;
        }
        const snapTimer = serverTimer;
        saveRollback(serverTimer, displaySeconds);
        setServerTimer(null);
        setDisplaySeconds(selectedMinutes * 60);
        try {
            if (snapTimer) await timerEnd({ nonce: snapTimer.nonce });
            rollbackRef.current = null;
        } catch {
            rollback();
        } finally {
            releaseOp();
        }
    };

    const commitQuickTask = () => {
        if (draftTitle.trim()) {
            setQuickTitle(draftTitle.trim());
            setQuickCategory(draftCategory);
            setShowQuickTask(false);
            setTaskError(false);
        }
    };
    const clearQuickTask = () => {
        setQuickTitle('');
        setQuickCategory(CATEGORIES[0]);
        setDraftTitle('');
        setDraftCategory(CATEGORIES[0]);
    };
    const selectChip = (min: number) => {
        if (serverTimer) return;
        setSelectedMinutes(min);
        setDisplaySeconds(min * 60);
    };

    // ── Derived display ────────────────────────────────────────────────────────
    const isRunning = !!serverTimer && serverTimer.status === 'running';
    const isPaused = !!serverTimer && serverTimer.status === 'paused';
    const isActive = !!serverTimer;
    const liveRemaining = isPaused
        ? (serverTimer?.remainingSeconds ?? 0)
        : displaySeconds;
    const totalSecs = (serverTimer?.plannedMinutes ?? selectedMinutes) * 60;
    const progress = totalSecs > 0 ? liveRemaining / totalSecs : 1;
    const mins = Math.floor(liveRemaining / 60);
    const secs = liveRemaining % 60;
    const phase: UIPhase = breakPhase ? 'break' : isActive ? 'focus' : 'idle';
    const phaseColor = phase === 'break' ? '#3b82f6' : 'var(--color-brand)';
    const phaseLabel =
        phase === 'idle'
            ? 'STANDBY'
            : phase === 'break'
              ? 'BREAK'
              : 'DEEP_FOCUS';
    const taskLabel = serverTimer?.linkedEvalId
        ? (evals.find((e) => e.id === serverTimer.linkedEvalId)?.title ??
          serverTimer.linkedEvalId)
        : serverTimer?.linkedTaskId
          ? (tasks.find((t) => t.id === serverTimer.linkedTaskId)?.title ??
            serverTimer.linkedTaskId)
          : (serverTimer?.quickTitle ?? null);

    if (!timerLoaded && !showSkeleton) {
        return null;
    }

    if (!timerLoaded) {
        return (
            <motion.main
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
                className='grow flex flex-col overflow-hidden p-8 space-y-8'
            >
                <div className='h-9 w-64 bg-[var(--color-surface-2)] animate-pulse' />
                <div className='h-72 bg-[var(--color-surface-2)] animate-pulse border border-[var(--color-glass-border)] rounded-xl' />
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className='h-24 bg-[var(--color-surface-2)] animate-pulse border border-[var(--color-glass-border)]'
                        />
                    ))}
                </div>
            </motion.main>
        );
    }

    return (
        <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className='grow flex flex-col overflow-hidden'
        >
            <Header title='Focus Timer' subtitle='Focus_Protocol_V2' />

            {showSessionComplete && sessionResult && (
                <SessionComplete
                    result={sessionResult}
                    hasAchievements={false}
                    onContinue={() => setShowSessionComplete(false)}
                />
            )}

            <div className='grow overflow-y-auto p-8'>
                <div className='mb-8'>
                    <span
                        className='text-3xs font-black tracking-[0.3em] uppercase block mb-2'
                        style={{ color: 'var(--color-brand)' }}
                    >
                        // FOCUS_PROTOCOL_V2
                    </span>
                    <h2 className='text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tighter uppercase leading-none text-[var(--color-text)]'>
                        Focus Timer
                    </h2>
                </div>

                <div className='grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6'>
                    <div className='flex flex-col gap-5'>
                        <QuoteCard />

                        <div
                            className='relative'
                            style={{
                                border: '1px solid var(--color-glass-border)',
                                background: 'var(--color-surface-1)',
                                padding: '2rem',
                                borderRadius: '0.5rem',
                            }}
                        >
                            <div className='flex items-center justify-between mb-8'>
                                <div className='flex items-center gap-3 mt-2'>
                                    <div
                                        className='w-2 h-2 rounded-full animate-pulse'
                                        style={{ background: phaseColor }}
                                    />
                                    <span
                                        className='text-3xs font-black tracking-[0.3em] uppercase'
                                        style={{ color: phaseColor }}
                                    >
                                        {phaseLabel}
                                    </span>
                                </div>
                                {phase === 'break' && (
                                    <span className='text-3xs font-mono px-3 py-1 text-blue-400 border border-blue-500/40 bg-blue-500/10 rounded-lg'>
                                        <Coffee className='w-3 h-3 inline mr-1' />
                                        TOUCH GRASS 🌱
                                    </span>
                                )}
                                {phase === 'focus' && taskLabel && (
                                    <span className='flex items-center gap-1.5 text-3xs font-mono px-3 py-1 truncate max-w-xs text-green-400 border border-green-500/40 bg-green-500/10 rounded-lg'>
                                        <Link2 className='w-3 h-3 shrink-0' />
                                        {taskLabel}
                                    </span>
                                )}
                            </div>

                            <div className='flex items-center justify-center mb-8'>
                                <div className='relative w-[18.75rem] h-[18.75rem]'>
                                    <TimerArc
                                        progress={
                                            breakPhase
                                                ? breakSecondsLeft /
                                                  (BREAK_MINUTES * 60)
                                                : progress
                                        }
                                        phase={phase}
                                    />
                                    <div className='absolute inset-0 flex flex-col items-center justify-center'>
                                        <span className='text-3xs font-mono tracking-[0.2em] uppercase mb-1 text-[var(--color-text-muted)]'>
                                            CYCLE TIME
                                        </span>
                                        <span
                                            className='text-7xl font-black font-mono tracking-tighter text-[var(--color-text)]'
                                            style={{
                                                textShadow: `0 0 30px ${phaseColor}44`,
                                            }}
                                        >
                                            {breakPhase
                                                ? `${String(Math.floor(breakSecondsLeft / 60)).padStart(2, '0')}:${String(breakSecondsLeft % 60).padStart(2, '0')}`
                                                : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`}
                                        </span>
                                        {phase === 'focus' && (
                                            <span className='text-3xs font-mono tracking-widest mt-2 text-[var(--color-text-muted)]'>
                                                {Math.round(
                                                    (1 - progress) * 100,
                                                )}
                                                % COMPLETE
                                            </span>
                                        )}
                                        {isPaused && (
                                            <span className='text-3xs font-mono tracking-widest mt-1 text-amber-500'>
                                                PAUSED
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {!isActive && !breakPhase && (
                                <div className='flex items-center justify-center gap-3 mb-8'>
                                    {FOCUS_CHIPS.map((m) => (
                                        <button
                                            key={m}
                                            onClick={() => selectChip(m)}
                                            className='px-5 py-2 rounded-lg text-sm font-black tracking-widest uppercase transition-all duration-150 cursor-pointer'
                                            style={
                                                selectedMinutes === m
                                                    ? {
                                                          border: '1px solid var(--color-brand)',
                                                          color: 'var(--color-brand)',
                                                          background:
                                                              'rgba(34,197,94,0.15)',
                                                      }
                                                    : {
                                                          border: '1px solid var(--color-glass-border)',
                                                          color: 'var(--color-text)',
                                                          background:
                                                              'transparent',
                                                      }
                                            }
                                        >
                                            {m}m
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className='flex items-center justify-center gap-3'>
                                {!isActive && !breakPhase && (
                                    <button
                                        onClick={start}
                                        disabled={finalizing}
                                        className='flex items-center gap-2 px-8 py-3 rounded-lg font-black tracking-widest uppercase text-sm cursor-pointer transition-all duration-150'
                                        style={{
                                            border: '1px solid var(--color-brand)',
                                            color: 'var(--color-brand)',
                                            background: finalizing
                                                ? 'var(--color-glass-border)'
                                                : 'var(--color-active-bg)',
                                        }}
                                        onMouseEnter={(e) => {
                                            (
                                                e.currentTarget as HTMLButtonElement
                                            ).style.background =
                                                'var(--color-brand)';
                                            (
                                                e.currentTarget as HTMLButtonElement
                                            ).style.color = '#000';
                                        }}
                                        onMouseLeave={(e) => {
                                            (
                                                e.currentTarget as HTMLButtonElement
                                            ).style.background =
                                                'rgba(34,197,94,0.12)';
                                            (
                                                e.currentTarget as HTMLButtonElement
                                            ).style.color =
                                                'var(--color-brand)';
                                        }}
                                    >
                                        <Play className='w-4 h-4' />
                                        INITIATE
                                    </button>
                                )}
                                {isPaused && (
                                    <button
                                        onClick={resume}
                                        className='flex items-center gap-2 px-8 py-3 rounded-lg font-black tracking-widest uppercase text-sm cursor-pointer'
                                        style={{
                                            border: '1px solid var(--color-brand)',
                                            color: 'var(--color-brand)',
                                            background:
                                                'var(--color-active-bg)',
                                        }}
                                    >
                                        <Play className='w-4 h-4' />
                                        RESUME
                                    </button>
                                )}
                                {breakPhase && (
                                    <button
                                        disabled
                                        className='flex items-center gap-2 px-8 py-3 rounded-lg font-black tracking-widest uppercase text-sm opacity-50 cursor-not-allowed text-blue-400 border border-blue-500/40 bg-blue-500/10'
                                    >
                                        <Coffee className='w-4 h-4' />
                                        3M BREAK
                                    </button>
                                )}
                                {isRunning && (
                                    <button
                                        onClick={pause}
                                        className='flex items-center gap-2 px-8 py-3 rounded-lg font-black tracking-widest uppercase text-sm cursor-pointer text-[var(--color-text)] border border-[var(--color-glass-border)] bg-[var(--color-surface-3)]/50'
                                    >
                                        <Pause className='w-4 h-4' />
                                        SUSPEND
                                    </button>
                                )}
                                {isRunning && (
                                    <button
                                        onClick={extend}
                                        className='flex items-center gap-1.5 px-4 py-3 rounded-lg font-black tracking-widest uppercase text-sm cursor-pointer text-amber-500 border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20'
                                    >
                                        <Plus className='w-4 h-4' />
                                        5M
                                    </button>
                                )}
                                {isActive && (
                                    <button
                                        onClick={dismiss}
                                        className='flex items-center gap-1.5 px-4 py-3 rounded-lg font-black tracking-widest uppercase text-sm cursor-pointer text-red-500 border border-red-500/40 bg-red-500/10 hover:bg-red-500/20'
                                    >
                                        <X className='w-4 h-4' />
                                        STOP
                                    </button>
                                )}
                                {!isActive &&
                                    !breakPhase &&
                                    displaySeconds > 0 &&
                                    displaySeconds !== selectedMinutes * 60 && (
                                        <button
                                            onClick={reset}
                                            className='flex items-center gap-1.5 px-4 py-3 rounded-lg font-black tracking-widest uppercase text-sm cursor-pointer text-[var(--color-text-muted)] border border-[var(--color-glass-border)] hover:bg-[var(--color-surface-3)]/50'
                                        >
                                            <RotateCcw className='w-4 h-4' />
                                            RESET
                                        </button>
                                    )}
                            </div>
                        </div>

                        <FocusHeatmap data={gamifData?.heatmap ?? []} />
                    </div>

                    {/* Right column */}
                    <div className='flex flex-col gap-5'>
                        {gamifData?.streak && (
                            <StreakDisplay
                                current={gamifData.streak.currentStreak ?? 0}
                                longest={gamifData.streak.longestStreak ?? 0}
                                lastActiveDate={
                                    gamifData.streak.lastActiveDate ?? null
                                }
                            />
                        )}
                        {gamifData?.goals && (
                            <DailyGoals goals={gamifData.goals} />
                        )}
                        {!isActive && !breakPhase && (
                            <div
                                style={{
                                    border: taskError
                                        ? '1px solid #ef4444'
                                        : '1px solid var(--color-glass-border)',
                                    background: 'var(--color-surface-1)',
                                    padding: '1.5rem',
                                    borderRadius: '5px',
                                    transition: 'border-color 0.3s ease',
                                }}
                            >
                                <div className='flex items-center justify-between mb-5'>
                                    <div className='flex items-center gap-2'>
                                        <Target
                                            className='w-4 h-4'
                                            style={{
                                                color: 'var(--color-brand)',
                                            }}
                                        />
                                        <span
                                            className='text-3xs font-black tracking-[0.25em] uppercase flex items-center gap-1.5'
                                            style={{
                                                color: 'var(--color-brand)',
                                            }}
                                        >
                                            LINK TASK
                                            <InfoTooltip
                                                content={
                                                    TOOLTIP_CONTENT.sessionLinking
                                                }
                                            />
                                        </span>
                                    </div>
                                    {taskError && (
                                        <AlertCircle className='w-4 h-4 text-red-500 animate-pulse' />
                                    )}
                                </div>

                                {linkedEval ? (
                                    <div className='mb-4 p-3 border border-[var(--color-brand)]/40 bg-[var(--color-brand-glow)] rounded-lg'>
                                        <div className='flex items-start justify-between gap-2'>
                                            <div className='min-w-0'>
                                                <div className='flex items-center gap-1.5 mb-0.5'>
                                                    <span
                                                        className='text-5xs font-black uppercase tracking-widest px-1.5 py-0.5 rounded'
                                                        style={{
                                                            background:
                                                                'var(--color-active-bg)',
                                                            color: 'var(--color-brand)',
                                                            border: '1px solid var(--color-brand)',
                                                        }}
                                                    >
                                                        {linkedEval.type ??
                                                            'eval'}
                                                    </span>
                                                </div>
                                                <p className='text-xs font-black uppercase text-[var(--color-text)] truncate'>
                                                    {linkedEval.title}
                                                </p>
                                                <p className='text-3xs font-mono mt-0.5 text-[var(--color-text-muted)]'>
                                                    {linkedEval.courseName ??
                                                        '—'}
                                                    {linkedEval.weightage !=
                                                    null
                                                        ? ` · ${linkedEval.weightage}%`
                                                        : ''}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    setLinkedEval(null)
                                                }
                                                className='shrink-0 cursor-pointer text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                                            >
                                                <X className='w-3.5 h-3.5' />
                                            </button>
                                        </div>
                                    </div>
                                ) : linkedTask ? (
                                    <div className='mb-4 p-3 border border-green-500/40 bg-green-500/10 rounded-lg'>
                                        <div className='flex items-start justify-between gap-2'>
                                            <div className='min-w-0'>
                                                <p className='text-xs font-black uppercase text-[var(--color-text)] truncate'>
                                                    {linkedTask.title}
                                                </p>
                                                <p className='text-3xs font-mono mt-0.5 text-[var(--color-text-muted)]'>
                                                    {linkedTask.category}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    setLinkedTask(null)
                                                }
                                                className='shrink-0 cursor-pointer text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                                            >
                                                <X className='w-3.5 h-3.5' />
                                            </button>
                                        </div>
                                    </div>
                                ) : quickTitle ? (
                                    <div className='mb-4 p-3 border border-blue-500/40 bg-blue-500/10 rounded-lg'>
                                        <div className='flex items-start justify-between gap-2'>
                                            <div className='min-w-0'>
                                                <p className='text-xs font-black uppercase text-[var(--color-text)] truncate'>
                                                    {quickTitle}
                                                </p>
                                                <p className='text-3xs font-mono mt-0.5 text-[var(--color-text-muted)]'>
                                                    {quickCategory}
                                                </p>
                                            </div>
                                            <button
                                                onClick={clearQuickTask}
                                                className='shrink-0 cursor-pointer text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                                            >
                                                <X className='w-3.5 h-3.5' />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className='space-y-2'>
                                        {evals.length > 0 && (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        setShowEvalPicker(
                                                            (p) => !p,
                                                        );
                                                        setShowTaskPicker(
                                                            false,
                                                        );
                                                        setShowQuickTask(false);
                                                    }}
                                                    className='w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-black tracking-widest uppercase cursor-pointer border border-[var(--color-glass-border)] text-[var(--color-text-muted)]'
                                                >
                                                    <span className='flex items-center gap-2'>
                                                        <BookOpen className='w-3.5 h-3.5' />
                                                        Link Eval
                                                    </span>
                                                    <ChevronDown
                                                        className={`w-3.5 h-3.5 transition-transform ${showEvalPicker ? 'rotate-180' : ''}`}
                                                    />
                                                </button>
                                                {showEvalPicker && (
                                                    <div className='overflow-y-auto max-h-48 space-y-1 border border-[var(--color-glass-border)] bg-[var(--color-surface-1)] rounded-lg'>
                                                        {evals.map((ev) => (
                                                            <button
                                                                key={ev.id}
                                                                onClick={() => {
                                                                    setLinkedEval(
                                                                        ev,
                                                                    );
                                                                    setShowEvalPicker(
                                                                        false,
                                                                    );
                                                                    setTaskError(
                                                                        false,
                                                                    );
                                                                }}
                                                                className='w-full text-left px-4 py-3 text-xs cursor-pointer border-b border-[var(--color-glass-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-active-bg)] hover:text-[var(--color-text)] last:border-0'
                                                            >
                                                                <div className='flex items-center gap-1.5 mb-0.5'>
                                                                    <span
                                                                        className='text-5xs font-bold uppercase px-1 py-0.5 rounded'
                                                                        style={{
                                                                            background:
                                                                                'var(--color-active-bg)',
                                                                            color: 'var(--color-brand)',
                                                                        }}
                                                                    >
                                                                        {ev.type ??
                                                                            'eval'}
                                                                    </span>
                                                                    {ev.weightage !=
                                                                        null && (
                                                                        <span className='text-5xs font-mono text-[var(--color-text-faint)]'>
                                                                            {
                                                                                ev.weightage
                                                                            }
                                                                            %
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className='font-bold uppercase truncate'>
                                                                    {ev.title}
                                                                </p>
                                                                <p className='text-3xs font-mono mt-0.5'>
                                                                    {ev.courseName ??
                                                                        '—'}
                                                                </p>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        {tasks.length > 0 && (
                                            <button
                                                onClick={() => {
                                                    setShowTaskPicker(
                                                        (p) => !p,
                                                    );
                                                    setShowEvalPicker(false);
                                                    setShowQuickTask(false);
                                                }}
                                                className='w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-black tracking-widest uppercase cursor-pointer border border-[var(--color-glass-border)] text-[var(--color-text-muted)]'
                                            >
                                                <span className='flex items-center gap-2'>
                                                    <Link2 className='w-3.5 h-3.5' />
                                                    Link Task
                                                </span>
                                                <ChevronDown
                                                    className={`w-3.5 h-3.5 transition-transform ${showTaskPicker ? 'rotate-180' : ''}`}
                                                />
                                            </button>
                                        )}
                                        {showTaskPicker && (
                                            <div className='overflow-y-auto max-h-48 space-y-1 border border-[var(--color-glass-border)] bg-[var(--color-surface-1)] rounded-lg'>
                                                {tasks.map((t) => (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => {
                                                            setLinkedTask(t);
                                                            setShowTaskPicker(
                                                                false,
                                                            );
                                                            setTaskError(false);
                                                        }}
                                                        className='w-full text-left px-4 py-3 text-xs cursor-pointer border-b border-[var(--color-glass-border)] text-[var(--color-text-muted)] hover:bg-green-500/10 hover:text-[var(--color-text)] last:border-0'
                                                    >
                                                        <p className='font-bold uppercase truncate'>
                                                            {t.title}
                                                        </p>
                                                        <p className='text-3xs font-mono mt-0.5'>
                                                            {t.category}
                                                        </p>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        <button
                                            onClick={() => {
                                                setShowQuickTask((p) => !p);
                                                setShowTaskPicker(false);
                                                setShowEvalPicker(false);
                                            }}
                                            className='w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-black tracking-widest uppercase cursor-pointer border border-[var(--color-glass-border)] text-[var(--color-text-muted)]'
                                        >
                                            <span className='flex items-center gap-2'>
                                                <Plus className='w-3.5 h-3.5' />
                                                Quick Task
                                            </span>
                                            <ChevronDown
                                                className={`w-3.5 h-3.5 transition-transform ${showQuickTask ? 'rotate-180' : ''}`}
                                            />
                                        </button>
                                        {showQuickTask && (
                                            <div className='p-3 space-y-2 border border-[var(--color-glass-border)] bg-[var(--color-surface-1)] rounded-lg'>
                                                <input
                                                    className='w-full px-3 py-2 text-xs placeholder:text-[var(--color-text-faint)] focus:outline-none focus-ring border border-[var(--color-glass-border)] bg-[var(--color-surface-2)] text-[var(--color-text)] rounded-lg'
                                                    placeholder='Task title...'
                                                    value={draftTitle}
                                                    onChange={(e) =>
                                                        setDraftTitle(
                                                            e.target.value,
                                                        )
                                                    }
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter')
                                                            commitQuickTask();
                                                    }}
                                                />
                                                <select
                                                    className='w-full px-3 py-2 text-xs focus:outline-none focus-ring appearance-none border border-[var(--color-glass-border)] bg-[var(--color-surface-2)] text-[var(--color-text)] rounded-lg'
                                                    value={draftCategory}
                                                    onChange={(e) =>
                                                        setDraftCategory(
                                                            e.target.value,
                                                        )
                                                    }
                                                >
                                                    {CATEGORIES.map((c) => (
                                                        <option
                                                            key={c}
                                                            value={c}
                                                            style={{
                                                                background:
                                                                    'var(--color-surface-1)',
                                                            }}
                                                        >
                                                            {c}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    type='button'
                                                    onClick={commitQuickTask}
                                                    className='w-full py-2 text-xs font-black tracking-widest uppercase cursor-pointer border border-green-500 text-green-500 bg-green-500/10 hover:bg-green-500 rounded-lg'
                                                >
                                                    SET TASK
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {taskError && (
                                    <p className='text-xs font-bold text-red-500 mt-3 animate-pulse'>
                                        ⚠ Task selection is mandatory to
                                        initiate focus.
                                    </p>
                                )}
                                {(linkedEval || linkedTask || quickTitle) && (
                                    <p className='text-3xs font-mono mt-3 text-[var(--color-text-muted)]'>
                                        Session will be logged under this{' '}
                                        {linkedEval ? 'eval' : 'task'}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Active session info */}
                        {(isActive || finalizing) && (
                            <div
                                style={{
                                    border: '1px solid var(--color-glass-border)',
                                    background: 'var(--color-surface-1)',
                                    padding: '1.5rem',
                                    borderRadius: '0.5rem',
                                }}
                            >
                                <span className='text-3xs font-black tracking-[0.25em] uppercase block mb-4 text-[var(--color-text-muted)]'>
                                    // SESSION INFO
                                </span>
                                {finalizing ? (
                                    <div className='flex items-center gap-2 text-2xs font-mono text-amber-400'>
                                        <span className='w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0' />
                                        Finalizing...
                                    </div>
                                ) : (
                                    <div className='space-y-2 text-2xs font-mono text-[var(--color-text-muted)]'>
                                        <div className='flex justify-between'>
                                            <span>Planned</span>
                                            <span className='text-[var(--color-text)]'>
                                                {serverTimer?.plannedMinutes}m
                                            </span>
                                        </div>
                                        <div className='flex justify-between'>
                                            <span>Elapsed</span>
                                            <span className='text-[var(--color-text)]'>
                                                {Math.floor(
                                                    (serverTimer?.elapsedSeconds ??
                                                        0) / 60,
                                                )}
                                                m{' '}
                                                {(serverTimer?.elapsedSeconds ??
                                                    0) % 60}
                                                s
                                            </span>
                                        </div>
                                        <div className='flex justify-between'>
                                            <span>Status</span>
                                            <span
                                                className={
                                                    isPaused
                                                        ? 'text-amber-500'
                                                        : 'text-green-500'
                                                }
                                            >
                                                {isPaused
                                                    ? 'PAUSED'
                                                    : 'RUNNING'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Recent sessions from backend */}
                        <div
                            style={{
                                border: '1px solid var(--color-glass-border)',
                                background: 'var(--color-surface-1)',
                                padding: '1.5rem',
                                borderRadius: '0.5rem',
                            }}
                        >
                            <span className='text-3xs font-black tracking-[0.25em] uppercase block mb-4 text-[var(--color-text-muted)]'>
                                // RECENT SESSIONS
                            </span>
                            {!gamifData?.recentSessions?.length ? (
                                <div className='flex flex-col items-center justify-center py-8 border border-dashed border-[var(--color-glass-border)] rounded-lg'>
                                    <Timer className='w-8 h-8 mb-2 text-[var(--color-text-faint)]' />
                                    <p className='text-3xs font-bold tracking-widest uppercase text-[var(--color-text-faint)]'>
                                        No sessions yet
                                    </p>
                                </div>
                            ) : (
                                <div
                                    className='space-y-2 max-h-64 overflow-y-auto pr-1'
                                    tabIndex={0}
                                >
                                    {(gamifData.recentSessions as any[])
                                        .slice(0, 20)
                                        .map((s: any) => {
                                            const isIncomplete =
                                                s.metadata?.status ===
                                                'incomplete';
                                            return (
                                                <div
                                                    key={s.id}
                                                    className='flex items-center justify-between px-3 py-2.5 border border-[var(--color-glass-border)] bg-[var(--color-surface-2)]/50 rounded-lg'
                                                >
                                                    <div className='min-w-0'>
                                                        <div className='flex items-center gap-1.5'>
                                                            <p className='text-xs font-bold uppercase text-[var(--color-text)] truncate'>
                                                                {s.metadata
                                                                    ?.quick_title ||
                                                                    'Focus Session'}
                                                            </p>
                                                            {isIncomplete && (
                                                                <span className='text-4xs font-black tracking-wider uppercase px-1.5 py-0.5 rounded border border-amber-500/40 text-amber-500 shrink-0'>
                                                                    Incomplete
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className='text-3xs font-mono mt-0.5 text-[var(--color-text-muted)]'>
                                                            {s.metadata
                                                                ?.local_date ??
                                                                ''}
                                                        </p>
                                                    </div>
                                                    <div className='flex items-center gap-1.5 shrink-0 ml-3'>
                                                        {isIncomplete ? (
                                                            <XCircle className='w-3 h-3 text-amber-500' />
                                                        ) : (
                                                            <CheckCircle2 className='w-3 h-3 text-green-500' />
                                                        )}
                                                        <span
                                                            className={`text-xs font-black font-mono ${
                                                                isIncomplete
                                                                    ? 'text-amber-500'
                                                                    : 'text-green-500'
                                                            }`}
                                                        >
                                                            {s.metadata
                                                                ?.duration_minutes ??
                                                                '?'}
                                                            m
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.main>
    );
}
