import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import AddCourseModal from '../components/modals/AddCourseModal';
import OnboardingTutorial, { hasSeenTutorial, markTutorialSeen } from '../components/OnboardingTutorial';
import { deleteCourse } from '../lib/api';
import { fetchCourses, fetchUpcomingEvals, fetchCourse, invalidateAllCourseData } from '../lib/dataService';
import { Plus, Clock, Trash2, AlertTriangle, GraduationCap, ChevronDown, ChevronUp } from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────

const daysUntil = (d: string) =>
    Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);

const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();

const getWeekLabel = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const week = Math.ceil(((now.getTime() - start.getTime()) / 86_400_000 + start.getDay() + 1) / 7);
    const month = now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
    return { week, month };
};

// Urgency badge — CRITICAL / OPERATIONAL / ROUTINE
const urgencyMeta = (days: number) => {
    if (days <= 2) return { label: 'CRITICAL', color: '#ffffff', bg: '#ef4444', border: '#ef4444' };
    if (days <= 5) return { label: 'OPERATIONAL', color: 'var(--color-brand)', bg: 'transparent', border: 'var(--color-brand)' };
    return { label: 'ROUTINE', color: '#a1a1aa', bg: 'rgba(161,161,170,0.12)', border: 'rgba(161,161,170,0.3)' };
};

// Status dot color based on grade vs target
const statusColor = (current: number, target: number): string => {
    const delta = current - target;
    if (delta >= 0) return '#6BFFAC';
    if (delta >= -10) return '#51C283';
    return '#398F5F';
};

const TYPE_LABEL: Record<string, string> = {
    midsem: 'MID SEM', endsem: 'END SEM', quiz: 'QUIZ',
    assignment: 'ASSIGNMENT', lab: 'LAB', project: 'PROJECT',
    viva: 'VIVA', other: 'OTHER',
};

const TYPE_ICON: Record<string, string> = {
    midsem: '📋', endsem: '📋', quiz: '⚡',
    assignment: '📝', lab: '🔬', project: '🗂️',
    viva: '🎤', other: '📌',
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface CourseWithStats {
    id: string; name: string; credits?: number; targetGrade: number;
    currentGrade: number; totalWeight: number; remainingWeight: number;
    requiredAvg: number | null;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
    const [courses, setCourses] = useState<CourseWithStats[]>([]);
    const [upcoming, setUpcoming] = useState<any[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [showTutorial, setShowTutorial] = useState(false);

    // Show tutorial on first-ever dashboard load
    useEffect(() => {
        if (!hasSeenTutorial()) {
            setShowTutorial(true);
        }
    }, []);

    const load = useCallback(async () => {
        setLoading(true); setError('');
        try {
            // Both calls use the session cache — only the very first
            // page load in this session actually hits the network.
            const [rawCourses, upcomingEvals] = await Promise.all([
                fetchCourses(),
                fetchUpcomingEvals(),
            ]);

            // Per-course stats are also cached after the first load
            const withStats: CourseWithStats[] = await Promise.all(
                rawCourses.map(async (c: any) => {
                    try {
                        const { stats, evaluations } = await fetchCourse(c.id);
                        // Normalize weights same way as CoursePage to keep grades consistent
                        const normalizeWeights = (es: any[]): number[] => {
                            const ws = es.map((e: any) => Math.round(e.weightage * 10) / 10);
                            let excess = Math.round((ws.reduce((s: number, w: number) => s + w, 0) - 100) * 10);
                            if (excess > 0) {
                                for (let i = 0; i < ws.length && excess > 0; i++) {
                                    if (ws[i] % 1 !== 0) { ws[i] = Math.round((ws[i] - 0.1) * 10) / 10; excess--; }
                                }
                            }
                            return ws;
                        };
                        const weights = normalizeWeights(evaluations);
                        const currentGrade = Math.round(evaluations.reduce((s: number, e: any, i: number) => {
                            if (e.score == null || !e.maxScore) return s;
                            return s + (e.score / e.maxScore) * weights[i];
                        }, 0) * 100) / 100;
                        return { ...c, ...stats, currentGrade };
                    } catch {
                        return { ...c, currentGrade: 0, totalWeight: 0, remainingWeight: 0, requiredAvg: null };
                    }
                })
            );

            setCourses(withStats);
            setUpcoming(upcomingEvals);
        } catch (err: any) { setError(err.message); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete "${name}"? All evaluations will also be deleted.`)) return;
        setDeleting(id);
        try {
            await deleteCourse(id);
            invalidateAllCourseData();
            setCourses(p => p.filter(c => c.id !== id));
            setUpcoming(p => p.filter((e: any) => e.courseId !== id));
        } catch (err: any) { alert('Failed: ' + err.message); }
        finally { setDeleting(null); }
    };

    // ── Classroom cross-course upcoming ──────────────────────────────────────
    const [classroomLinked] = useState(() => {
        try { return !!localStorage.getItem('semsync_classroom_data'); } catch { return false; }
    });
    const [classroomExpanded, setClassroomExpanded] = useState(true);
    const classroomUpcoming = (() => {
        if (!classroomLinked) return [];
        try {
            const data: any[] = JSON.parse(localStorage.getItem('semsync_classroom_data') ?? '[]');
            const doneIds: Set<string> = new Set(JSON.parse(localStorage.getItem('semsync_classroom_done_ids') ?? '[]'));
            const items: { id: string; title: string; courseName: string; dueDate: string; days: number; hue: number }[] = [];
            data.forEach((course: any) => {
                const hue = course.name.split('').reduce((h: number, c: string) => (h * 31 + c.charCodeAt(0)) % 360, 0);
                (course.coursework ?? []).forEach((cw: any) => {
                    if (!cw.dueDate) return;
                    const days = Math.ceil((new Date(cw.dueDate + 'T23:59:59').getTime() - Date.now()) / 86400000);
                    if (days < 0 || days > 14) return;
                    if (course.turnedInIds?.includes(cw.id)) return;
                    if (doneIds.has(cw.id)) return;
                    items.push({ id: cw.id, title: cw.title, courseName: course.name, dueDate: cw.dueDate, days, hue });
                });
            });
            return items.sort((a, b) => a.days - b.days).slice(0, 10);
        } catch { return []; }
    })();

    // ── Upcoming filter: this week first, fallback to all ─────────────────────
    const thisWeek = upcoming.filter(e => { const d = daysUntil(e.date); return d >= 0 && d <= 7; });
    const displayUpcoming = thisWeek.length > 0 ? thisWeek : upcoming.slice(0, 6);
    const isFallback = thisWeek.length === 0 && upcoming.length > 0;

    const { week, month } = getWeekLabel();

    // ── Skeleton ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex min-h-screen" style={{ background: 'var(--color-surface)' }}>
                <Sidebar />
                <main className="grow p-8 space-y-14">
                    <div>
                        <div className="flex justify-between items-baseline mb-8">
                            <div className="h-12 w-72 bg-[var(--color-surface-2)] animate-pulse" />
                            <div className="h-4 w-40 bg-[var(--color-surface-2)] animate-pulse" />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            {[0, 1, 2].map(i => <div key={i} className="h-52 bg-[var(--color-surface-2)] animate-pulse border border-[var(--color-glass-border)]" />)}
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-8">
                            <div className="h-8 w-64 bg-[var(--color-surface-2)] animate-pulse" />
                            <div className="h-9 w-32 bg-[var(--color-surface-2)] animate-pulse" />
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            {[0, 1, 2, 3].map(i => <div key={i} className="h-44 bg-[var(--color-surface-2)] animate-pulse border border-[var(--color-glass-border)]" />)}
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // ── Main render ───────────────────────────────────────────────────────────
    return (
        <div className="flex min-h-screen" style={{ background: 'var(--color-surface)' }}>
            <Sidebar />

            <main className="grow flex flex-col overflow-y-auto">
                <div className="p-8 space-y-14">

                    {error && (
                        <div className="border border-red-500/30 bg-red-500/5 px-6 py-4 flex items-center gap-3 rounded-lg">
                            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                            <span className="text-xs font-bold text-red-400 uppercase tracking-widest">{error}</span>
                        </div>
                    )}

                    {/* ════════════════════════════════════════════
              WEEKLY FOCUS
          ════════════════════════════════════════════ */}
                    <section>
                        {/* Section header */}
                        <div className="flex items-baseline justify-between mb-8">
                            <h2 className="text-5xl font-extrabold tracking-tighter uppercase text-[var(--color-text)]">
                                Weekly Focus
                            </h2>
                            <span className="text-sm font-mono tracking-[0.15em]" style={{ color: 'var(--color-text-faint)' }}>
                                WEEK {week} — {month}
                            </span>
                        </div>

                        {displayUpcoming.length === 0 ? (
                            <div className="border border-dashed border-[var(--color-glass-border)] p-16 text-center rounded-lg">
                                <p className="text-xs font-bold tracking-[0.3em] text-[var(--color-text-faint)] uppercase">
                                    No upcoming evaluations
                                </p>
                            </div>
                        ) : (
                            <>
                                {isFallback && (
                                    <p className="text-[10px] font-bold tracking-[0.25em] text-[var(--color-text-faint)] uppercase mb-4">
                                        Nothing this week, showing next upcoming
                                    </p>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {displayUpcoming.map(e => {
                                        const days = daysUntil(e.date);
                                        const urg = urgencyMeta(days);

                                        const timeStr = days === 0 ? 'TODAY'
                                            : days === 1 ? 'TOMORROW'
                                                : `${days} DAYS`;

                                        return (
                                            <div
                                                key={e.id}
                                                className=" rounded-[var(--radius-card)] flex flex-col justify-between transition-colors duration-200 hover:bg-[var(--color-surface-2)]"
                                                style={{
                                                    background: 'var(--color-surface-1)',
                                                    border: '1px solid var(--color-glass-border)',
                                                    padding: '24px',
                                                    minHeight: '210px',
                                                    borderRadius: 8,
                                                }}>

                                                {/* Badge row */}
                                                <div className="flex items-center justify-between mb-6">
                                                    <span
                                                        className="text-[10px] font-black tracking-[0.2em] px-3 py-1 uppercase"
                                                        style={{
                                                            color: urg.color,
                                                            background: urg.bg,
                                                            border: `1px solid ${urg.border}`,
                                                        }}>
                                                        {urg.label}
                                                    </span>
                                                    <span className="text-xs font-mono tracking-widest" style={{ color: 'var(--color-text-faint)' }}>
                                                        {fmtDate(e.date)}
                                                    </span>
                                                </div>

                                                {/* Title */}
                                                <div className="grow  rounded-[var(--radius-card)] ">
                                                    <h3 className="text-2xl font-extrabold tracking-tight text-[var(--color-text)] leading-snug uppercase mb-2">
                                                        {e.title}
                                                    </h3>
                                                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                                                        {e.courseName}
                                                    </p>
                                                </div>

                                                {/* Footer row */}
                                                <div
                                                    className="flex items-center justify-between mt-5 pt-4"
                                                    style={{ borderTop: '1px solid var(--color-glass-border)' }}>
                                                    <span
                                                        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                                                        style={{ color: 'var(--color-text-muted)' }}>
                                                        <span>{TYPE_ICON[e.type] ?? '📌'}</span>
                                                        {TYPE_LABEL[e.type] ?? e.type.toUpperCase()}
                                                    </span>
                                                    <span
                                                        className="flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase"
                                                        style={{ color: urg.label === 'CRITICAL' ? 'var(--color-brand)' : 'var(--color-text-faint)' }}>
                                                        <Clock className="w-3 h-3" />
                                                        {timeStr}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </section>

                    {/* ════════════════════════════════════════════
              COURSE NODES
          ════════════════════════════════════════════ */}
                    <section>
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-baseline gap-4">
                                <h2 className="text-2xl font-extrabold tracking-tight uppercase text-[var(--color-text)]">
                                    Course Nodes
                                </h2>
                                <span className="text-xs font-mono tracking-widest" style={{ color: 'var(--color-text-faint)' }}>
                                    [ {String(courses.length).padStart(2, '0')} Nodes Active ]
                                </span>
                            </div>

                            <button
                                onClick={() => setShowAdd(true)}
                                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-widest cursor-pointer transition-all duration-150"
                                style={{ border: '1px solid var(--color-brand)', color: 'var(--color-brand)', background: 'var(--color-active-bg)' }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-brand-glow)';
                                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-brand)';
                                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 14px rgba(34,197,94,0.22)';
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-active-bg)';
                                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-brand)';
                                    (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                                }}>
                                <Plus className="w-4 h-4" /> New Course
                            </button>
                        </div>

                        {courses.length === 0 ? (
                            <div className="border border-dashed border-[var(--color-glass-border)] p-16 flex flex-col items-center gap-4 rounded-lg">
                                <p className="text-xs font-bold tracking-[0.3em] text-[var(--color-text-faint)] uppercase">No courses initialized</p>
                                <button
                                    onClick={() => setShowAdd(true)}
                                    className="px-8 py-3 text-sm font-black tracking-widest uppercase cursor-pointer transition-all duration-150"
                                    style={{ border: '1px solid var(--color-brand)', color: 'var(--color-brand)', background: 'var(--color-active-bg)' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-brand)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-surface)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-active-bg)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-brand)'; }}>
                                    Initialize First Course
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {courses.map(course => {
                                    const dot = statusColor(course.currentGrade, course.targetGrade);
                                    const delta = parseFloat((course.currentGrade - course.targetGrade).toFixed(2));
                                    // bar fills proportionally up to target; overshoot shown as full bar
                                    const barPct = Math.min(100, course.targetGrade > 0
                                        ? (course.currentGrade / course.targetGrade) * 100
                                        : 0);
                                    const isDeleting = deleting === course.id;

                                    return (
                                        <div
                                            key={course.id}
                                            className="relative group flex flex-col transition-colors duration-200"
                                            style={{
                                                background: 'var(--color-surface-1)',
                                                border: '1px solid var(--color-glass-border)',
                                            }}>

                                            {/* Deleting overlay */}
                                            {isDeleting && (
                                                <div className="absolute inset-0 bg-[var(--color-surface)]/80 flex flex-col items-center justify-center gap-3 z-20">
                                                    <div className="w-5 h-5 border border-red-500/30 border-t-red-500 animate-spin" />
                                                    <span className="text-[9px] text-red-400 font-bold tracking-widest uppercase">Deleting…</span>
                                                </div>
                                            )}

                                            {/* Full-card link with glitch hover */}
                                            <Link
                                                to={`/courses/${course.id}`}
                                                className="block relative overflow-hidden flex-1 transition-all duration-150"
                                                style={{ padding: '20px 20px 18px', cursor: 'pointer', textDecoration: 'none' }}
                                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-surface)'; }}
                                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                                            >
                                                {/* Scan-line overlay */}
                                                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                                    style={{ background: 'repeating-linear-gradient(0deg,transparent,transparent 2px,var(--color-brand-glow) 2px,var(--color-brand-glow) 4px)' }} />
                                                {/* Green left accent bar */}
                                                <div className="absolute left-0 top-0 bottom-0 w-0.5 opacity-0 group-hover:opacity-100 transition-all duration-150"
                                                    style={{ background: 'linear-gradient(180deg,var(--color-brand),var(--color-brand-glow))' }} />

                                                {/* Header row: name + status dot + delete btn */}
                                                <div className="flex items-center justify-between mb-1 gap-2">
                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                        <p className="text-xs font-black tracking-[0.15em] uppercase text-[var(--color-text)] truncate group-hover:text-[var(--color-brand)] transition-colors">
                                                            {course.name}
                                                        </p>
                                                        <div
                                                            className="w-2 h-2 rounded-full shrink-0"
                                                            style={{ background: dot, boxShadow: `0 0 5px ${dot}99` }}
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={ev => { ev.preventDefault(); ev.stopPropagation(); handleDelete(course.id, course.name); }}
                                                        disabled={!!deleting}
                                                        title="Delete course"
                                                        className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-6 h-6 rounded cursor-pointer transition-all duration-150 shrink-0 disabled:cursor-not-allowed"
                                                        style={{ background: 'rgba(239,68,68,0.10)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.22)', position: 'relative', zIndex: 10 }}
                                                        onMouseEnter={el => { if (!deleting) { (el.currentTarget as HTMLButtonElement).style.background = '#ef4444'; (el.currentTarget as HTMLButtonElement).style.color = '#fff'; } }}
                                                        onMouseLeave={el => { (el.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.10)'; (el.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}>
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>

                                                {/* Progress label */}
                                                <p className="text-[9px] font-bold tracking-[0.25em] uppercase mt-4 mb-1.5 group-hover:text-[var(--color-brand)] transition-colors" style={{ color: 'var(--color-text-faint)' }}>
                                                    Current Progress
                                                </p>

                                                {/* Big number */}
                                                <p className="text-4xl font-extrabold leading-none text-[var(--color-text)] mb-4 tracking-tight group-hover:text-[var(--color-brand)] transition-colors">
                                                    {course.currentGrade.toFixed(1)}
                                                    <span className="text-xl" style={{ color: 'var(--color-text-muted)' }}>%</span>
                                                </p>

                                                {/* Progress bar */}
                                                <div className="w-full mb-4 overflow-hidden"
                                                    style={{ height: '2px', background: 'var(--color-glass-border)' }}>
                                                    <div className="h-full transition-all duration-700"
                                                        style={{ width: `${barPct}%`, background: dot }} />
                                                </div>

                                                {/* Footer */}
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[9px] font-mono transition-colors group-hover:text-[var(--color-brand)]" style={{ color: 'var(--color-text-faint)' }}>
                                                        TARGET: {course.targetGrade}%
                                                    </span>
                                                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-brand)' }}>
                                                        → Open
                                                    </span>
                                                </div>
                                            </Link>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* ════════════════════════════════════════════
                      CLASSROOM UPCOMING (only if linked)
                    ════════════════════════════════════════════ */}
                    {classroomLinked && classroomUpcoming.length > 0 && (
                        <section>
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <GraduationCap className="w-5 h-5" style={{ color: 'var(--color-brand)' }} />
                                    <h2 className="text-xl font-extrabold tracking-tight uppercase" style={{ color: 'var(--color-text)' }}>
                                        Classroom · Next 14 Days
                                    </h2>
                                    <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: 'var(--color-active-bg)', color: 'var(--color-brand)', border: '1px solid var(--color-brand)', letterSpacing: '0.05em' }}>
                                        {classroomUpcoming.length}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Link to="/classroom" style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-faint)', textDecoration: 'none', letterSpacing: '0.08em', textTransform: 'uppercase' }}
                                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--color-brand)'}
                                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--color-text-faint)'}
                                    >View All →</Link>
                                    <button onClick={() => setClassroomExpanded(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)', color: 'var(--color-text-muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                                        {classroomExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                        {classroomExpanded ? 'Collapse' : 'Expand'}
                                    </button>
                                </div>
                            </div>
                            {classroomExpanded && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                                    {classroomUpcoming.map(item => {
                                        const urgent = item.days === 0 ? { label: 'TODAY', color: '#E24B4A' } : item.days === 1 ? { label: 'TOMORROW', color: '#EF9F27' } : item.days <= 3 ? { label: `${item.days}d`, color: '#EF9F27' } : { label: `${item.days}d`, color: 'var(--color-text-faint)' };
                                        return (
                                            <Link key={item.id} to="/classroom" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--color-surface-1)', border: '1px solid var(--color-glass-border)', borderLeft: `3px solid hsl(${item.hue},60%,50%)`, borderRadius: 8, transition: 'background 0.12s' }}
                                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-glass)'}
                                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-1)'}
                                            >
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                                                    <p style={{ fontSize: 11, color: 'var(--color-text-faint)', margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.courseName}</p>
                                                </div>
                                                <span style={{ fontSize: 11, fontWeight: 800, color: urgent.color, fontFamily: 'monospace', flexShrink: 0 }}>{urgent.label}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    )}

                </div>

                <footer className="mt-auto px-8 py-6 flex justify-between items-center" style={{ borderTop: '1px solid var(--color-glass-border)' }}>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-faint)]">© 2026 SEMSYNC</span>
                    <div className="flex gap-8">
                        <a href="#" className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-faint)] hover:text-[var(--color-text)] cursor-pointer transition-colors">TERMS</a>
                        <a href="#" className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-faint)] hover:text-[var(--color-text)] cursor-pointer transition-colors">PRIVACY</a>
                    </div>
                </footer>
            </main>

            {showAdd && (
                <AddCourseModal
                    onClose={() => setShowAdd(false)}
                    onCreated={c => { invalidateAllCourseData(); setCourses(p => [...p, { ...c, currentGrade: 0, totalWeight: 0, remainingWeight: 0, requiredAvg: null }]); }}
                />
            )}

            {showTutorial && (
                <OnboardingTutorial onClose={() => setShowTutorial(false)} />
            )}
        </div>
    );
}