import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AddEvalModal from '../components/modals/AddEvalModal';
import EditEvalModal from '../components/modals/EditEvalModal';
import { deleteEval, deleteCourse } from '../lib/api';
import { fetchCourse, invalidateCourseDetail, invalidateAllCourseData } from '../lib/dataService';
import { AlertTriangle, Plus, Pencil, Trash2 } from 'lucide-react';

const TYPE_COLOR: Record<string, string> = {
    midsem: 'text-[var(--color-danger)] border-[var(--color-danger)]',
    endsem: 'text-[var(--color-danger)] border-[var(--color-danger)]',
    quiz: 'text-[var(--color-brand)] border-[var(--color-brand)]',
    assignment: 'text-[var(--color-text-muted)] border-[var(--color-glass-border)]',
    lab: 'text-[var(--color-brand)] border-[var(--color-brand)]',
    project: 'text-[var(--color-text-muted)] border-[var(--color-glass-border)]',
    viva: 'text-[var(--color-text-muted)] border-[var(--color-glass-border)]',
    other: 'text-[var(--color-text-faint)] border-[var(--color-glass-border)]',
};
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function CoursePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [course, setCourse] = useState<any>(null);
    const [evals, setEvals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [editing, setEditing] = useState<any>(null);

    const load = useCallback(async () => {
        setLoading(true); setError('');
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
        } catch (err: any) { setError(err.message); }
        finally { setLoading(false); }
    }, [id]);

    const computedStats = course ? (() => {
        const normalizeWeights = (es: any[]): number[] => {
            const ws = es.map(e => Math.round(e.weightage * 10) / 10);
            let sum = Math.round(ws.reduce((s, w) => s + w, 0) * 10) / 10;
            let excess = Math.round((sum - 100) * 10); // in units of 0.1
            if (excess > 0) {
                for (let i = 0; i < ws.length && excess > 0; i++) {
                    if (ws[i] % 1 !== 0) { // has decimal
                        ws[i] = Math.round((ws[i] - 0.1) * 10) / 10;
                        excess--;
                    }
                }
            }
            return ws;
        };
        const weights = normalizeWeights(evals);
        const totalAllocated = Math.round(weights.reduce((s, w) => s + w, 0) * 10) / 10;
        const evaluatedWeight = Math.round(
            evals.reduce((s, e, i) => e.score ? s + weights[i] : s, 0) * 10
        ) / 10;
        const earnedSoFar = Math.round(evals.reduce((s, e, i) => {
            if (e.score == null || !e.maxScore) return s;
            return s + (e.score / e.maxScore) * weights[i];
        }, 0) * 10) / 10;
        const remaining = Math.max(0, Math.round((100 - evaluatedWeight) * 10) / 10);
        const needToScore = Math.round((course.targetGrade - earnedSoFar) * 10) / 10;
        return {
            currentGrade: earnedSoFar,
            totalWeight: 100,
            totalAllocated,
            remaining,
            needToScore,
        };
    })() : null;

    useEffect(() => { load(); }, [load]);

    const handleDeleteEval = async (evalId: string) => {
        if (!confirm('Delete this evaluation?')) return;
        try {
            await deleteEval(evalId);
            invalidateCourseDetail(id!); // stale: this course's stats + upcoming evals
            load();
        }
        catch (err: any) { alert('Failed: ' + err.message); }
    };

    const handleDeleteCourse = async () => {
        if (!confirm(`Delete "${course?.name}"? All evaluations will be removed.`)) return;
        try {
            await deleteCourse(id!);
            invalidateAllCourseData(); // courses list is now stale
            navigate('/courses');
        }
        catch (err: any) { alert('Failed: ' + err.message); }
    };

    return (
        <div className="flex min-h-screen" style={{ background: 'var(--color-surface)' }}>
            <Sidebar />
            <main className="grow flex flex-col">
                <Header title={course?.name ?? 'Course'} subtitle="Track_Detail" />
                <div className="p-8">
                    <div className="mb-8">
                        <Link to="/courses" className="text-[10px] font-bold tracking-[0.2em] text-[var(--color-text-faint)] hover:text-[var(--color-text)] uppercase transition-colors cursor-pointer">
                            ← Back to Directory
                        </Link>
                    </div>

                    {error && (
                        <div className="border border-[var(--color-danger)] bg-[rgba(239,68,68,0.05)] px-6 py-4 flex items-center space-x-3 mb-8">
                            <AlertTriangle className="w-4 h-4 text-[var(--color-danger)] shrink-0" />
                            <span className="text-[11px] font-bold text-[var(--color-danger)] uppercase tracking-widest">{error}</span>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex items-center space-x-4 py-20">
                            <div className="w-px h-8 bg-[var(--color-brand)] animate-pulse" />
                            <span className="text-[10px] font-bold tracking-[0.3em] text-[var(--color-text-faint)] uppercase">Loading track data…</span>
                        </div>
                    ) : course && (
                        <>
                            {/* Course header row */}
                            <div className="flex items-start justify-between mb-10 border border-[var(--color-glass-border)] p-6">
                                <div className="flex items-center space-x-8">
                                    {course.credits && (
                                        <div>
                                            <p className="text-[9px] font-bold text-[var(--color-text-faint)] tracking-[0.2em] uppercase mb-1">Credits</p>
                                            <p className="text-2xl font-extrabold font-mono text-[var(--color-text)]">{course.credits}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-[9px] font-bold text-[var(--color-text-faint)] tracking-[0.2em] uppercase mb-1">Target</p>
                                        <p className="text-2xl font-extrabold font-mono text-[var(--color-text)]">{course.targetGrade}%</p>
                                    </div>
                                </div>

                                {/* Terminate — Anger → red */}
                                <button
                                    onClick={handleDeleteCourse}
                                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-widest cursor-pointer transition-all duration-150"
                                    style={{ border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', background: 'rgba(239,68,68,0.08)' }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLButtonElement).style.background = '#ef4444';
                                        (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                                        (e.currentTarget as HTMLButtonElement).style.borderColor = '#ef4444';
                                        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 18px rgba(239,68,68,0.35)';
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)';
                                        (e.currentTarget as HTMLButtonElement).style.color = '#ef4444';
                                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.4)';
                                        (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                                    }}>
                                    <Trash2 className="w-4 h-4" />
                                    Terminate Course
                                </button>
                            </div>

                            {/* Stats */}
                            {computedStats && (
                                <div className="grid grid-cols-2 md:grid-cols-4 border border-[var(--color-glass-border)] mb-10">
                                    {[
                                        { label: 'Grade Earned', value: `${computedStats.currentGrade}%`, sub: `out of ${computedStats.totalWeight}% total`, accent: true, warn: false },
                                        { label: 'Weight Allocated', value: `${computedStats.totalAllocated}%`, sub: `across ${evals.length} evaluation${evals.length !== 1 ? 's' : ''}`, accent: false, warn: false },
                                        { label: 'Remaining Weight', value: `${computedStats.remaining}%`, sub: 'Yet to be assessed', accent: false, warn: false },
                                        {
                                            label: 'Need to Score',
                                            value: `${parseFloat(computedStats.needToScore.toFixed(2))}%`,
                                            sub: computedStats.needToScore > 100
                                                ? 'Target unreachable — beyond 100%'
                                                : 'Needed to complete target grade!',
                                            accent: false,
                                            warn: computedStats.needToScore > 100,
                                        },
                                    ].map((s, i) => (
                                        <div key={s.label} className={`p-6 ${i < 3 ? 'border-r border-[var(--color-glass-border)]' : ''} ${s.accent ? 'bg-[var(--color-brand-glow)]' : ''}`}>
                                            <p className="text-[9px] font-bold text-[var(--color-text-faint)] tracking-[0.2em] uppercase mb-2">{s.label}</p>
                                            <p className={`text-3xl font-extrabold font-mono ${s.accent ? 'text-[var(--color-brand)]' : s.warn ? 'text-[var(--color-danger)]' : 'text-[var(--color-text)]'}`}>{s.value}</p>
                                            <p className="text-[12px] mt-1 leading-snug text-[var(--color-text-faint)]">{s.sub}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Evaluations table */}
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-extrabold tracking-widest uppercase">Evaluations ({evals.length})</h3>

                                {/* Add Evaluation — Anticipation → amber-green */}
                                <button
                                    onClick={() => setShowAdd(true)}
                                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-widest cursor-pointer transition-all duration-150"
                                    style={{ border: '1px solid rgba(34,197,94,0.35)', color: 'var(--color-brand)', background: 'var(--color-active-bg)' }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.18)';
                                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-brand)';
                                        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 14px rgba(34,197,94,0.22)';
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.08)';
                                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(34,197,94,0.35)';
                                        (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                                    }}>
                                    <Plus className="w-4 h-4" />
                                    Add Evaluation
                                </button>
                            </div>

                            {evals.length === 0 ? (
                                <div className="border border-dashed border-[var(--color-glass-border)] p-16 text-center">
                                    <p className="text-[10px] font-bold tracking-[0.3em] text-[var(--color-text-faint)] uppercase mb-6">No evaluations logged</p>
                                    <button
                                        onClick={() => setShowAdd(true)}
                                        className="px-8 py-3 text-sm font-black tracking-widest cursor-pointer transition-all duration-150 uppercase"
                                        style={{ border: '1px solid var(--color-brand)', color: 'var(--color-brand)', background: 'var(--color-active-bg)' }}
                                        onMouseEnter={e => {
                                            (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-brand)';
                                            (e.currentTarget as HTMLButtonElement).style.color = '#000';
                                        }}
                                        onMouseLeave={e => {
                                            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.08)';
                                            (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-brand)';
                                        }}>
                                        Log First Evaluation
                                    </button>
                                </div>
                            ) : (
                                <div className="border border-[var(--color-glass-border)] overflow-hidden">
                                    {/* Table header */}
                                    <div className="grid grid-cols-12 border-b border-[var(--color-glass-border)] bg-[var(--color-surface-2)]/50 px-6 py-3">
                                        {['Title', 'Type', 'Date', 'Weight', 'Score', 'Earned', ''].map((h, i) => (
                                            <div key={h} className={`text-[9px] font-black tracking-[0.2em] uppercase text-[var(--color-text-faint)] ${i === 0 ? 'col-span-3' : i === 6 ? 'col-span-1 text-right' : 'col-span-2 text-right'
                                                }`}>{h}</div>
                                        ))}
                                    </div>
                                    {/* Rows */}
                                    {evals.map(e => {
                                        const earned = e.score !== null && e.score !== undefined
                                            ? ((e.score / e.maxScore) * e.weightage).toFixed(2)
                                            : null;
                                        return (
                                            <div key={e.id} className="grid grid-cols-12 border-b border-[var(--color-glass-border)] px-6 py-4 hover:bg-[var(--color-surface-2)]/30 transition-colors group items-center">
                                                <div className="col-span-3">
                                                    <p className="text-sm font-bold text-[var(--color-text)] uppercase tracking-tight">{e.title}</p>
                                                </div>
                                                <div className="col-span-2 text-right">
                                                    <span className={`text-[9px] font-black tracking-widest border px-2 py-0.5 uppercase ${TYPE_COLOR[e.type] ?? TYPE_COLOR.other}`}>
                                                        {e.type}
                                                    </span>
                                                </div>
                                                <div className="col-span-2 text-right">
                                                    <span className="text-[12px] text-[var(--color-text-faint)] font-mono">{fmtDate(e.date)}</span>
                                                </div>
                                                <div className="col-span-2 text-right">
                                                    <span className="text-[11.5px] font-mono text-[var(--color-text)]">{e.weightage}%</span>
                                                </div>
                                                <div className="col-span-1 text-right">
                                                    {e.score !== null && e.score !== undefined
                                                        ? <span className="text-[11.5px] font-mono text-[var(--color-text)]">{e.score}/{e.maxScore}</span>
                                                        : <span className="text-[11.5px] font-mono text-[var(--color-text-faint)]">—</span>
                                                    }
                                                </div>
                                                <div className="col-span-1 text-right">
                                                    {earned !== null
                                                        ? <span className="text-[11.5px] font-mono text-[var(--color-brand)] font-bold">{earned}%</span>
                                                        : <span className="text-[11.5px] font-mono text-[var(--color-text-faint)]">—</span>
                                                    }
                                                </div>

                                                {/* Row actions — always visible, colored */}
                                                <div className="col-span-1 text-right flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {/* Edit — Trust → blue */}
                                                    <button
                                                        onClick={() => setEditing(e)}
                                                        title="Edit evaluation"
                                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all duration-150"
                                                        style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.25)' }}
                                                        onMouseEnter={el => {
                                                            (el.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.25)';
                                                            (el.currentTarget as HTMLButtonElement).style.borderColor = '#3b82f6';
                                                        }}
                                                        onMouseLeave={el => {
                                                            (el.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.12)';
                                                            (el.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(59,130,246,0.25)';
                                                        }}>
                                                        <Pencil className="w-4 h-4" />
                                                    </button>

                                                    {/* Delete — Anger → red */}
                                                    <button
                                                        onClick={() => handleDeleteEval(e.id)}
                                                        title="Delete evaluation"
                                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all duration-150"
                                                        style={{ background: 'rgba(239,68,68,0.10)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.22)' }}
                                                        onMouseEnter={el => {
                                                            (el.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.22)';
                                                            (el.currentTarget as HTMLButtonElement).style.borderColor = '#ef4444';
                                                        }}
                                                        onMouseLeave={el => {
                                                            (el.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.10)';
                                                            (el.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.22)';
                                                        }}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {showAdd && <AddEvalModal courseId={id!} onClose={() => setShowAdd(false)} onCreated={() => { invalidateCourseDetail(id!); load(); }} existingWeight={computedStats?.totalAllocated ?? 0} />}
            {editing && <EditEvalModal evaluation={editing} onClose={() => setEditing(null)} onUpdated={() => { invalidateCourseDetail(id!); load(); }} existingWeight={computedStats?.totalAllocated ?? 0} />}
        </div>
    );
}