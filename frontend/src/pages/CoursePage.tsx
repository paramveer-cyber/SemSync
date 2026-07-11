import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AddEvalModal from '../components/modals/AddEvalModal';
import EditEvalModal from '../components/modals/EditEvalModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import { deleteEval, deleteCourse, archiveCourse } from '../lib/api';
import {
    fetchCourse,
    invalidateCourseDetail,
    invalidateAllCourseData,
} from '../lib/dataService';
import { AlertTriangle, Plus, Pencil, Trash2, Archive } from 'lucide-react';
import { LineChart } from '@mui/x-charts';

const TYPE_COLOR: Record<string, string> = {
    midsem: 'text-[var(--color-danger)] border-[var(--color-danger)]',
    endsem: 'text-[var(--color-danger)] border-[var(--color-danger)]',
    quiz: 'text-[var(--color-brand)] border-[var(--color-brand)]',
    assignment:
        'text-[var(--color-text-muted)] border-[var(--color-glass-border)]',
    lab: 'text-[var(--color-brand)] border-[var(--color-brand)]',
    project:
        'text-[var(--color-text-muted)] border-[var(--color-glass-border)]',
    viva: 'text-[var(--color-text-muted)] border-[var(--color-glass-border)]',
    other: 'text-[var(--color-text-faint)] border-[var(--color-glass-border)]',
};
const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

export default function CoursePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [course, setCourse] = useState<any>(null);
    const [evals, setEvals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [confirmDeleteEval, setConfirmDeleteEval] = useState<{
        id: string;
        title: string;
    } | null>(null);
    const [confirmDeleteCourse, setConfirmDeleteCourse] = useState(false);
    const [confirmArchiveCourse, setConfirmArchiveCourse] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const { course: c, evaluations: e } = await fetchCourse(id!);
            setCourse(c);
            const sorted = [...e].sort((a, b) => {
                const aEval = a.score !== null && a.score !== undefined;
                const bEval = b.score !== null && b.score !== undefined;
                if (aEval !== bEval) return aEval ? 1 : -1;
                return a.title.localeCompare(b.title);
            });
            setEvals(sorted);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    const computedStats = course
        ? (() => {
              const normalizeWeights = (es: any[]): number[] => {
                  const ws = es.map((e) => Math.round(e.weightage * 10) / 10);
                  let sum = Math.round(ws.reduce((s, w) => s + w, 0) * 10) / 10;
                  let excess = Math.round((sum - 100) * 10);
                  if (excess > 0) {
                      for (let i = 0; i < ws.length && excess > 0; i++) {
                          if (ws[i] % 1 !== 0) {
                              ws[i] = Math.round((ws[i] - 0.1) * 10) / 10;
                              excess--;
                          }
                      }
                  }
                  return ws;
              };
              const weights = normalizeWeights(evals);
              const totalAllocated =
                  Math.round(weights.reduce((s, w) => s + w, 0) * 10) / 10;
              const evaluatedWeight =
                  Math.round(
                      evals.reduce(
                          (s, e, i) => (e.score ? s + weights[i] : s),
                          0,
                      ) * 10,
                  ) / 10;
              const earnedSoFar =
                  Math.round(
                      evals.reduce((s, e, i) => {
                          if (e.score == null || !e.maxScore) return s;
                          return s + (e.score / e.maxScore) * weights[i];
                      }, 0) * 10,
                  ) / 10;
              const remaining = Math.max(
                  0,
                  Math.round((100 - evaluatedWeight) * 10) / 10,
              );
              const needToScore =
                  Math.round((course.targetGrade - earnedSoFar) * 10) / 10;
              if (needToScore < 0)
                  return {
                      currentGrade: earnedSoFar,
                      totalWeight: 100,
                      totalAllocated,
                      remaining,
                      needToScore: 0,
                  };
              return {
                  currentGrade: earnedSoFar,
                  totalWeight: 100,
                  totalAllocated,
                  remaining,
                  needToScore,
              };
          })()
        : null;

    useEffect(() => {
        load();
    }, [load]);

    const doDeleteEval = async (evalId: string) => {
        try {
            await deleteEval(evalId);
            invalidateCourseDetail(id!);
            load();
        } catch (err: any) {
            alert('Failed: ' + err.message);
            throw err;
        }
    };

    const doDeleteCourse = async () => {
        try {
            await deleteCourse(id!);
            invalidateAllCourseData();
            navigate('/courses');
        } catch (err: any) {
            alert('Failed: ' + err.message);
            throw err;
        }
    };

    const doArchiveCourse = async () => {
        try {
            await archiveCourse(id!);
            invalidateAllCourseData();
            navigate('/courses');
        } catch (err: any) {
            alert('Failed: ' + err.message);
            throw err;
        }
    };

    return (
        <div
            className='flex min-h-screen'
            style={{ background: 'var(--color-surface)' }}
        >
            <Sidebar />
            <main className='grow flex flex-col'>
                <Header
                    title={course?.name ?? 'Course'}
                    subtitle='Track_Detail'
                />
                <div className='p-8'>
                    <div className='mb-8'>
                        <Link
                            to='/courses'
                            className='text-[10px] font-bold tracking-[0.2em] text-[var(--color-text-faint)] hover:text-[var(--color-text)] uppercase transition-colors cursor-pointer'
                        >
                            ← Back to Directory
                        </Link>
                    </div>

                    {error && (
                        <div className='border border-[var(--color-danger)] bg-[rgba(239,68,68,0.05)] px-6 py-4 flex items-center space-x-3 mb-8'>
                            <AlertTriangle className='w-4 h-4 text-[var(--color-danger)] shrink-0' />
                            <span className='text-[11px] font-bold text-[var(--color-danger)] uppercase tracking-widest'>
                                {error}
                            </span>
                        </div>
                    )}

                    {loading ? (
                        <div className='flex items-center space-x-4 py-20'>
                            <div className='w-px h-8 bg-[var(--color-brand)] animate-pulse' />
                            <span className='text-[10px] font-bold tracking-[0.3em] text-[var(--color-text-faint)] uppercase'>
                                Loading track data…
                            </span>
                        </div>
                    ) : (
                        course && (
                            <>
                                {course.isArchived && (
                                    <div
                                        className='px-5 py-3 mb-6 flex items-center gap-3 rounded-lg'
                                        style={{
                                            border: '1px solid rgba(161,161,170,0.4)',
                                            background:
                                                'rgba(161,161,170,0.08)',
                                        }}
                                    >
                                        <Archive
                                            className='w-4 h-4 shrink-0'
                                            style={{ color: '#a1a1aa' }}
                                        />
                                        <span
                                            className='text-[10px] font-black tracking-[0.3em] uppercase'
                                            style={{ color: '#a1a1aa' }}
                                        >
                                            Archived — Read Only
                                        </span>
                                    </div>
                                )}
                                <div className='flex items-start justify-between mb-10 border border-[var(--color-glass-border)] p-6'>
                                    <div className='flex items-center space-x-8'>
                                        {course.credits && (
                                            <div>
                                                <p className='text-[9px] font-bold text-[var(--color-text-faint)] tracking-[0.2em] uppercase mb-1'>
                                                    Credits
                                                </p>
                                                <p className='text-2xl font-extrabold font-mono text-[var(--color-text)]'>
                                                    {course.credits}
                                                </p>
                                            </div>
                                        )}
                                        <div>
                                            <p className='text-[9px] font-bold text-[var(--color-text-faint)] tracking-[0.2em] uppercase mb-1'>
                                                Target
                                            </p>
                                            <p className='text-2xl font-extrabold font-mono text-[var(--color-text)]'>
                                                {course.targetGrade}%
                                            </p>
                                        </div>
                                    </div>

                                    <div className='flex items-center gap-3'>
                                        {!course.isArchived && (
                                            <button
                                                onClick={() =>
                                                    setConfirmArchiveCourse(
                                                        true,
                                                    )
                                                }
                                                className='flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-widest cursor-pointer transition-all duration-150'
                                                style={{
                                                    border: '1px solid rgba(161,161,170,0.35)',
                                                    color: '#a1a1aa',
                                                    background:
                                                        'rgba(161,161,170,0.06)',
                                                }}
                                                onMouseEnter={(e) => {
                                                    (
                                                        e.currentTarget as HTMLButtonElement
                                                    ).style.background =
                                                        'rgba(161,161,170,0.18)';
                                                    (
                                                        e.currentTarget as HTMLButtonElement
                                                    ).style.borderColor =
                                                        '#a1a1aa';
                                                }}
                                                onMouseLeave={(e) => {
                                                    (
                                                        e.currentTarget as HTMLButtonElement
                                                    ).style.background =
                                                        'rgba(161,161,170,0.06)';
                                                    (
                                                        e.currentTarget as HTMLButtonElement
                                                    ).style.borderColor =
                                                        'rgba(161,161,170,0.35)';
                                                }}
                                            >
                                                <Archive className='w-4 h-4' />
                                                Archive
                                            </button>
                                        )}
                                        <button
                                            onClick={() =>
                                                setConfirmDeleteCourse(true)
                                            }
                                            className='flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-widest cursor-pointer transition-all duration-150'
                                            style={{
                                                border: '1px solid rgba(239,68,68,0.4)',
                                                color: '#ef4444',
                                                background:
                                                    'rgba(239,68,68,0.08)',
                                            }}
                                            onMouseEnter={(e) => {
                                                (
                                                    e.currentTarget as HTMLButtonElement
                                                ).style.background = '#ef4444';
                                                (
                                                    e.currentTarget as HTMLButtonElement
                                                ).style.color = '#fff';
                                                (
                                                    e.currentTarget as HTMLButtonElement
                                                ).style.borderColor = '#ef4444';
                                                (
                                                    e.currentTarget as HTMLButtonElement
                                                ).style.boxShadow =
                                                    '0 4px 18px rgba(239,68,68,0.35)';
                                            }}
                                            onMouseLeave={(e) => {
                                                (
                                                    e.currentTarget as HTMLButtonElement
                                                ).style.background =
                                                    'rgba(239,68,68,0.08)';
                                                (
                                                    e.currentTarget as HTMLButtonElement
                                                ).style.color = '#ef4444';
                                                (
                                                    e.currentTarget as HTMLButtonElement
                                                ).style.borderColor =
                                                    'rgba(239,68,68,0.4)';
                                                (
                                                    e.currentTarget as HTMLButtonElement
                                                ).style.boxShadow = 'none';
                                            }}
                                        >
                                            <Trash2 className='w-4 h-4' />
                                            Terminate Course
                                        </button>
                                    </div>
                                </div>

                                {computedStats && (
                                    <div className='grid grid-cols-2 md:grid-cols-4 border border-[var(--color-glass-border)] mb-10'>
                                        {[
                                            {
                                                label: 'Grade Earned',
                                                value: `${computedStats.currentGrade}%`,
                                                sub: `out of ${computedStats.totalWeight}% total`,
                                                accent: true,
                                                warn: false,
                                            },
                                            {
                                                label: 'Weight Allocated',
                                                value: `${computedStats.totalAllocated}%`,
                                                sub: `across ${evals.length} evaluation${evals.length !== 1 ? 's' : ''}`,
                                                accent: false,
                                                warn: false,
                                            },
                                            {
                                                label: 'Remaining Weight',
                                                value: `${computedStats.remaining}%`,
                                                sub: 'Yet to be assessed',
                                                accent: false,
                                                warn: false,
                                            },
                                            {
                                                label: 'Need to Score',
                                                value: `${parseFloat(computedStats.needToScore.toFixed(2))}%`,
                                                sub:
                                                    computedStats.needToScore ==
                                                    0
                                                        ? 'Target Acheived'
                                                        : computedStats.needToScore >
                                                            100
                                                          ? 'Target unreachable — beyond 100%'
                                                          : 'Needed to complete target grade!',
                                                accent: false,
                                                warn:
                                                    computedStats.needToScore >
                                                    100,
                                            },
                                        ].map((s, i) => (
                                            <div
                                                key={s.label}
                                                className={`p-6 ${i < 3 ? 'border-r border-[var(--color-glass-border)]' : ''} ${s.accent ? 'bg-[var(--color-brand-glow)]' : ''}`}
                                            >
                                                <p className='text-[9px] font-bold text-[var(--color-text-faint)] tracking-[0.2em] uppercase mb-2'>
                                                    {s.label}
                                                </p>
                                                <p
                                                    className={`text-3xl font-extrabold font-mono ${s.accent ? 'text-[var(--color-brand)]' : s.warn ? 'text-[var(--color-danger)]' : 'text-[var(--color-text)]'}`}
                                                >
                                                    {s.value}
                                                </p>
                                                <p className='text-[12px] mt-1 leading-snug text-[var(--color-text-faint)]'>
                                                    {s.sub}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {(() => {
                                    const graded = evals
                                        .filter(
                                            (e) =>
                                                e.score !== null &&
                                                e.score !== undefined &&
                                                e.maxScore,
                                        )
                                        .sort(
                                            (a, b) =>
                                                new Date(a.date).getTime() -
                                                new Date(b.date).getTime(),
                                        );

                                    if (graded.length < 1) return null;

                                    let cumWeight = 0;
                                    let cumEarned = 0;
                                    const points: {
                                        x: number;
                                        y: number;
                                        label: string;
                                    }[] = [{ x: 0, y: 0, label: 'Start' }];
                                    graded.forEach((e) => {
                                        cumWeight =
                                            Math.round(
                                                (cumWeight + e.weightage) * 10,
                                            ) / 10;
                                        cumEarned =
                                            Math.round(
                                                (cumEarned +
                                                    (e.score / e.maxScore) *
                                                        e.weightage) *
                                                    10,
                                            ) / 10;
                                        points.push({
                                            x: cumWeight,
                                            y: cumEarned,
                                            label: e.title,
                                        });
                                    });

                                    const xVals = points.map((p) => p.x);
                                    const yVals = points.map((p) => p.y);

                                    const targetY = points.map(
                                        () => course.targetGrade,
                                    );

                                    const C_EARNED = '#4ade80';
                                    const C_TARGET = '#fb923c';

                                    return (
                                        <div
                                            className='mb-10 border border-[var(--color-glass-border)]'
                                            style={{
                                                background:
                                                    'var(--color-surface-1)',
                                            }}
                                        >
                                            <div className='px-6 pt-5 pb-4 border-b border-[var(--color-glass-border)] flex items-start justify-between'>
                                                <div>
                                                    <p
                                                        className='text-[9px] font-black tracking-[0.25em] uppercase mb-0.5'
                                                        style={{
                                                            color: 'var(--color-brand)',
                                                        }}
                                                    >
                                                        // GRADE_CURVE
                                                    </p>
                                                    <h4
                                                        className='text-sm font-extrabold tracking-tight uppercase'
                                                        style={{
                                                            color: 'var(--color-text)',
                                                        }}
                                                    >
                                                        Cumulative Grade Curve
                                                    </h4>
                                                </div>
                                                <div className='flex items-center gap-5 mt-1'>
                                                    {[
                                                        {
                                                            color: C_EARNED,
                                                            label: 'Earned',
                                                        },
                                                        {
                                                            color: C_TARGET,
                                                            label: `Target (${course.targetGrade}%)`,
                                                        },
                                                    ].map(
                                                        ({ color, label }) => (
                                                            <div
                                                                key={label}
                                                                className='flex items-center gap-1.5'
                                                            >
                                                                <div
                                                                    style={{
                                                                        width: 20,
                                                                        height: 2,
                                                                        background:
                                                                            color,
                                                                        borderRadius: 1,
                                                                    }}
                                                                />
                                                                <span
                                                                    className='text-[9px] font-bold tracking-widest uppercase font-mono'
                                                                    style={{
                                                                        color: 'var(--color-text-faint)',
                                                                    }}
                                                                >
                                                                    {label}
                                                                </span>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </div>

                                            <LineChart
                                                xAxis={[
                                                    {
                                                        data: xVals,
                                                        label: 'Weight Assessed (%)',
                                                        min: 0,
                                                        max: Math.max(
                                                            ...xVals,
                                                            100,
                                                        ),
                                                        tickLabelStyle: {
                                                            fontSize: 10,
                                                            fill: '#71717a',
                                                            fontFamily:
                                                                'monospace',
                                                        },
                                                        labelStyle: {
                                                            fontSize: 12,
                                                            fill: '#52525b',
                                                            fontFamily:
                                                                'monospace',
                                                        },
                                                        valueFormatter: (
                                                            v: number,
                                                        ) => `${v}%`,
                                                        tickNumber: 10,
                                                    },
                                                ]}
                                                yAxis={[
                                                    {
                                                        min: 0,
                                                        max: Math.max(
                                                            ...xVals,
                                                            100,
                                                        ),
                                                        label: 'Grade Earned (%)',
                                                        tickLabelStyle: {
                                                            fontSize: 10,
                                                            fill: '#71717a',
                                                            fontFamily:
                                                                'monospace',
                                                        },
                                                        labelStyle: {
                                                            fontSize: 12,
                                                            fill: '#52525b',
                                                            fontFamily:
                                                                'monospace',
                                                        },
                                                        valueFormatter: (
                                                            v: number,
                                                        ) => `${v}%`,
                                                        tickNumber: 10,
                                                    },
                                                ]}
                                                series={[
                                                    {
                                                        data: yVals,
                                                        label: 'Earned',
                                                        color: C_EARNED,
                                                        showMark: true,
                                                        curve: 'linear',
                                                        valueFormatter: (
                                                            v: number | null,
                                                        ) =>
                                                            v !== null
                                                                ? `${v}%`
                                                                : '',
                                                    },
                                                    {
                                                        data: targetY,
                                                        label: `Target (${course.targetGrade}%)`,
                                                        color: C_TARGET,
                                                        showMark: false,
                                                        curve: 'linear',
                                                        valueFormatter: (
                                                            v: number | null,
                                                        ) =>
                                                            v !== null
                                                                ? `${v}%`
                                                                : '',
                                                    },
                                                ]}
                                                height={380}
                                                margin={{
                                                    top: 20,
                                                    right: 32,
                                                    bottom: 56,
                                                    left: 64,
                                                }}
                                                grid={{
                                                    vertical: true,
                                                    horizontal: true,
                                                }}
                                                sx={{
                                                    // Axis lines & ticks
                                                    '& .MuiChartsAxis-line': {
                                                        stroke: '#3f3f46',
                                                    },
                                                    '& .MuiChartsAxis-tick': {
                                                        stroke: '#3f3f46',
                                                    },
                                                    '& .MuiChartsGrid-line': {
                                                        stroke: '#27272a',
                                                        strokeDasharray: '4 4',
                                                    },
                                                    '& .MuiChartsLegend-root': {
                                                        display: 'none',
                                                    },
                                                    '& .MuiLineElement-series-auto-generated-id-0':
                                                        {
                                                            strokeWidth: 2.5,
                                                            filter: `drop-shadow(0 0 6px ${C_EARNED}88)`,
                                                        },
                                                    '& .MuiLineElement-series-auto-generated-id-2':
                                                        {
                                                            strokeWidth: 1.5,
                                                            strokeDasharray:
                                                                '6 4',
                                                        },
                                                    '& .MuiMarkElement-root': {
                                                        stroke: C_EARNED,
                                                        fill: '#18181b',
                                                        strokeWidth: 2,
                                                        r: '5',
                                                        filter: `drop-shadow(0 0 4px ${C_EARNED}99)`,
                                                    },
                                                }}
                                            />
                                        </div>
                                    );
                                })()}

                                <div className='flex items-center justify-between mb-6'>
                                    <h3 className='text-sm font-extrabold tracking-widest uppercase'>
                                        Evaluations ({evals.length})
                                    </h3>

                                    {!course.isArchived && (
                                        <button
                                            onClick={() => setShowAdd(true)}
                                            className='flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-widest cursor-pointer transition-all duration-150'
                                            style={{
                                                border: '1px solid rgba(34,197,94,0.35)',
                                                color: 'var(--color-brand)',
                                                background:
                                                    'var(--color-active-bg)',
                                            }}
                                            onMouseEnter={(e) => {
                                                (
                                                    e.currentTarget as HTMLButtonElement
                                                ).style.background =
                                                    'rgba(34,197,94,0.18)';
                                                (
                                                    e.currentTarget as HTMLButtonElement
                                                ).style.borderColor =
                                                    'var(--color-brand)';
                                                (
                                                    e.currentTarget as HTMLButtonElement
                                                ).style.boxShadow =
                                                    '0 4px 14px rgba(34,197,94,0.22)';
                                            }}
                                            onMouseLeave={(e) => {
                                                (
                                                    e.currentTarget as HTMLButtonElement
                                                ).style.background =
                                                    'rgba(34,197,94,0.08)';
                                                (
                                                    e.currentTarget as HTMLButtonElement
                                                ).style.borderColor =
                                                    'rgba(34,197,94,0.35)';
                                                (
                                                    e.currentTarget as HTMLButtonElement
                                                ).style.boxShadow = 'none';
                                            }}
                                        >
                                            <Plus className='w-4 h-4' />
                                            Add Evaluation
                                        </button>
                                    )}
                                </div>

                                {evals.length === 0 ? (
                                    <div className='border border-dashed border-[var(--color-glass-border)] p-16 text-center'>
                                        <p className='text-[10px] font-bold tracking-[0.3em] text-[var(--color-text-faint)] uppercase mb-6'>
                                            No evaluations logged
                                        </p>
                                        {!course.isArchived && (
                                            <button
                                                onClick={() => setShowAdd(true)}
                                                className='px-8 py-3 text-sm font-black tracking-widest cursor-pointer transition-all duration-150 uppercase'
                                                style={{
                                                    border: '1px solid var(--color-brand)',
                                                    color: 'var(--color-brand)',
                                                    background:
                                                        'var(--color-active-bg)',
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
                                                        'rgba(34,197,94,0.08)';
                                                    (
                                                        e.currentTarget as HTMLButtonElement
                                                    ).style.color =
                                                        'var(--color-brand)';
                                                }}
                                            >
                                                Log First Evaluation
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className='border border-[var(--color-glass-border)] overflow-hidden'>
                                        <div className='grid grid-cols-12 border-b border-[var(--color-glass-border)] bg-[var(--color-surface-2)]/50 px-6 py-3'>
                                            {[
                                                'Title',
                                                'Type',
                                                'Date',
                                                'Weight',
                                                'Score',
                                                'Earned',
                                                '',
                                            ].map((h, i) => (
                                                <div
                                                    key={h}
                                                    className={`text-[9px] font-black tracking-[0.2em] uppercase text-[var(--color-text-faint)] ${
                                                        i === 0
                                                            ? 'col-span-3'
                                                            : i === 6
                                                              ? 'col-span-1 text-right'
                                                              : 'col-span-2 text-right'
                                                    }`}
                                                >
                                                    {h}
                                                </div>
                                            ))}
                                        </div>
                                        {evals.map((e) => {
                                            const earned =
                                                e.score !== null &&
                                                e.score !== undefined
                                                    ? (
                                                          (e.score /
                                                              e.maxScore) *
                                                          e.weightage
                                                      ).toFixed(2)
                                                    : null;
                                            return (
                                                <div
                                                    key={e.id}
                                                    className='grid grid-cols-12 border-b border-[var(--color-glass-border)] px-6 py-4 hover:bg-[var(--color-surface-2)]/30 transition-colors group items-center'
                                                >
                                                    <div className='col-span-3'>
                                                        <p className='text-sm font-bold text-[var(--color-text)] uppercase tracking-tight'>
                                                            {e.title}
                                                        </p>
                                                    </div>
                                                    <div className='col-span-2 text-right'>
                                                        <span
                                                            className={`text-[9px] font-black tracking-widest border px-2 py-0.5 uppercase ${TYPE_COLOR[e.type] ?? TYPE_COLOR.other}`}
                                                        >
                                                            {e.type}
                                                        </span>
                                                    </div>
                                                    <div className='col-span-2 text-right'>
                                                        <span className='text-[12px] text-[var(--color-text-faint)] font-mono'>
                                                            {fmtDate(e.date)}
                                                        </span>
                                                    </div>
                                                    <div className='col-span-2 text-right'>
                                                        <span className='text-[11.5px] font-mono text-[var(--color-text)]'>
                                                            {e.weightage}%
                                                        </span>
                                                    </div>
                                                    <div className='col-span-1 text-right'>
                                                        {e.score !== null &&
                                                        e.score !==
                                                            undefined ? (
                                                            <span className='text-[11.5px] font-mono text-[var(--color-text)]'>
                                                                {e.score}/
                                                                {e.maxScore}
                                                            </span>
                                                        ) : (
                                                            <span className='text-[11.5px] font-mono text-[var(--color-text-faint)]'>
                                                                —
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className='col-span-1 text-right'>
                                                        {earned !== null ? (
                                                            <span className='text-[11.5px] font-mono text-[var(--color-brand)] font-bold'>
                                                                {earned}%
                                                            </span>
                                                        ) : (
                                                            <span className='text-[11.5px] font-mono text-[var(--color-text-faint)]'>
                                                                —
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className='col-span-1 text-right flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                                                        {!course.isArchived && (
                                                            <>
                                                                <button
                                                                    onClick={() =>
                                                                        setEditing(
                                                                            e,
                                                                        )
                                                                    }
                                                                    title='Edit evaluation'
                                                                    className='flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all duration-150'
                                                                    style={{
                                                                        background:
                                                                            'rgba(59,130,246,0.12)',
                                                                        color: '#3b82f6',
                                                                        border: '1px solid rgba(59,130,246,0.25)',
                                                                    }}
                                                                    onMouseEnter={(
                                                                        el,
                                                                    ) => {
                                                                        (
                                                                            el.currentTarget as HTMLButtonElement
                                                                        ).style.background =
                                                                            'rgba(59,130,246,0.25)';
                                                                        (
                                                                            el.currentTarget as HTMLButtonElement
                                                                        ).style.borderColor =
                                                                            '#3b82f6';
                                                                    }}
                                                                    onMouseLeave={(
                                                                        el,
                                                                    ) => {
                                                                        (
                                                                            el.currentTarget as HTMLButtonElement
                                                                        ).style.background =
                                                                            'rgba(59,130,246,0.12)';
                                                                        (
                                                                            el.currentTarget as HTMLButtonElement
                                                                        ).style.borderColor =
                                                                            'rgba(59,130,246,0.25)';
                                                                    }}
                                                                >
                                                                    <Pencil className='w-4 h-4' />
                                                                </button>

                                                                <button
                                                                    onClick={() =>
                                                                        setConfirmDeleteEval(
                                                                            {
                                                                                id: e.id,
                                                                                title: e.title,
                                                                            },
                                                                        )
                                                                    }
                                                                    title='Delete evaluation'
                                                                    className='flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all duration-150'
                                                                    style={{
                                                                        background:
                                                                            'rgba(239,68,68,0.10)',
                                                                        color: '#ef4444',
                                                                        border: '1px solid rgba(239,68,68,0.22)',
                                                                    }}
                                                                    onMouseEnter={(
                                                                        el,
                                                                    ) => {
                                                                        (
                                                                            el.currentTarget as HTMLButtonElement
                                                                        ).style.background =
                                                                            'rgba(239,68,68,0.22)';
                                                                        (
                                                                            el.currentTarget as HTMLButtonElement
                                                                        ).style.borderColor =
                                                                            '#ef4444';
                                                                    }}
                                                                    onMouseLeave={(
                                                                        el,
                                                                    ) => {
                                                                        (
                                                                            el.currentTarget as HTMLButtonElement
                                                                        ).style.background =
                                                                            'rgba(239,68,68,0.10)';
                                                                        (
                                                                            el.currentTarget as HTMLButtonElement
                                                                        ).style.borderColor =
                                                                            'rgba(239,68,68,0.22)';
                                                                    }}
                                                                >
                                                                    <Trash2 className='w-4 h-4' />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )
                    )}
                </div>
            </main>

            {showAdd && (
                <AddEvalModal
                    courseId={id!}
                    onClose={() => setShowAdd(false)}
                    onCreated={() => {
                        invalidateCourseDetail(id!);
                        load();
                    }}
                    existingWeight={computedStats?.totalAllocated ?? 0}
                />
            )}
            {editing && (
                <EditEvalModal
                    evaluation={editing}
                    onClose={() => setEditing(null)}
                    onUpdated={() => {
                        invalidateCourseDetail(id!);
                        load();
                    }}
                    existingWeight={computedStats?.totalAllocated ?? 0}
                />
            )}
            {confirmDeleteEval && (
                <ConfirmModal
                    title='Delete evaluation'
                    message={
                        <>
                            Delete{' '}
                            <strong style={{ color: 'var(--color-text)' }}>
                                {confirmDeleteEval.title}
                            </strong>
                            ? This cannot be undone.
                        </>
                    }
                    variant='delete'
                    onConfirm={() => doDeleteEval(confirmDeleteEval.id)}
                    onClose={() => setConfirmDeleteEval(null)}
                />
            )}
            {confirmDeleteCourse && (
                <ConfirmModal
                    title='Delete course'
                    message={
                        <>
                            Delete{' '}
                            <strong style={{ color: 'var(--color-text)' }}>
                                {course?.name}
                            </strong>
                            ? All evaluations will be removed. This cannot be
                            undone.
                        </>
                    }
                    variant='delete'
                    onConfirm={doDeleteCourse}
                    onClose={() => setConfirmDeleteCourse(false)}
                />
            )}
            {confirmArchiveCourse && (
                <ConfirmModal
                    title='Archive course'
                    message={
                        <>
                            Archive{' '}
                            <strong style={{ color: 'var(--color-text)' }}>
                                {course?.name}
                            </strong>
                            ? It becomes read-only permanently.
                        </>
                    }
                    variant='archive'
                    confirmLabel='Archive'
                    onConfirm={doArchiveCourse}
                    onClose={() => setConfirmArchiveCourse(false)}
                />
            )}
        </div>
    );
}
