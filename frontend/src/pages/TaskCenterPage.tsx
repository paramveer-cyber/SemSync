import { useState, useRef, useCallback, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Plus, Calendar, GripVertical, X, CheckCircle2, Clock, Circle, AlertCircle, Pencil, Save } from 'lucide-react';

type Priority = 'low' | 'medium' | 'high';
type Status   = 'upcoming' | 'active' | 'done';

interface Task {
    id: string; title: string; description: string; course: string;
    dueDate: string; priority: Priority; status: Status; progress?: number;
}

const STORAGE_KEY = 'architect_tasks_v1';
const loadTasks  = (): Task[] => { try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : []; } catch { return []; } };
const saveTasks  = (t: Task[]) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(t)); } catch { /* noop */ } };

const COLUMNS: { id: Status; label: string; tag: string; color: string; border: string; bg: string }[] = [
    { id: 'upcoming', label: 'Upcoming', tag: 'QUEUED',  color: '#3b82f6', border: 'rgba(59,130,246,0.35)',  bg: 'rgba(59,130,246,0.06)'  },
    { id: 'active',   label: 'Active',   tag: 'IN_PROG', color: '#f59e0b', border: 'rgba(245,158,11,0.35)',  bg: 'rgba(245,158,11,0.06)'  },
    { id: 'done',     label: 'Done',     tag: 'CLOSED',  color: 'var(--color-brand)', border: 'rgba(34,197,94,0.35)',   bg: 'rgba(34,197,94,0.06)'   },
];

const PRIORITY_META: Record<Priority, { label: string; color: string; Icon: React.FC<any> }> = {
    high:   { label: 'HIGH', color: '#ef4444', Icon: AlertCircle },
    medium: { label: 'MED',  color: '#f59e0b', Icon: Clock       },
    low:    { label: 'LOW',  color: 'var(--color-brand)', Icon: Circle      },
};

function uid()    { return Math.random().toString(36).slice(2, 10); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase(); }
function daysUntil(d: string) { return Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000); }

/* ── Shared field styles (matches app theme) ── */
const fieldStyle = { background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)', color: 'white' };
const inputCls   = 'w-full px-4 py-3 text-sm placeholder:text-[var(--color-text)]/25 focus:outline-none transition-colors';
const labelCls   = 'block text-[10px] font-black tracking-[0.25em] uppercase mb-2';
const labelStyle = { color: 'var(--color-text-muted)' };

/* ── Task Card ─────────────────────────────────────────────────────────────── */
function TaskCard({ task, onDelete, onEdit, dragging, onDragStart, onDragEnd }: {
    task: Task; onDelete: (id: string) => void; onEdit: (task: Task) => void;
    dragging: boolean; onDragStart: () => void; onDragEnd: () => void;
}) {
    const days         = daysUntil(task.dueDate);
    const pm           = PRIORITY_META[task.priority];
    const PIc          = pm.Icon;
    const urgencyColor = days <= 0 ? '#ef4444' : days <= 3 ? '#f59e0b' : 'var(--color-text-muted)';
    const urgencyLabel = days === 0 ? 'TODAY' : days < 0 ? 'OVERDUE' : days === 1 ? 'TOMORROW' : `${days}D`;

    return (
        <div
            draggable onDragStart={onDragStart} onDragEnd={onDragEnd}
            className={`group relative flex flex-col cursor-grab active:cursor-grabbing transition-all duration-200 select-none hover:bg-[var(--color-surface-2)] ${dragging ? 'opacity-40 scale-95' : ''}`}
            style={{ background: 'var(--color-surface-1)', border: '1px solid var(--color-glass-border)', padding: '18px 20px 16px' }}>

            {/* Top row: course + priority + actions */}
            <div className="flex items-center justify-between mb-4">
                <span className="text-[9px] font-black tracking-[0.3em] uppercase" style={{ color: 'var(--color-text-muted)' }}>
                    {task.course.toUpperCase()}
                </span>
                <div className="flex items-center gap-2">
                    {task.status === 'done'
                        ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--color-brand)' }} />
                        : <span className="flex items-center gap-1 text-[9px] font-black tracking-widest uppercase px-2 py-0.5"
                            style={{ color: pm.color, border: `1px solid ${pm.color}33`, background: `${pm.color}12` }}>
                            <PIc className="w-2.5 h-2.5" />{pm.label}
                          </span>
                    }
                    {/* Edit button */}
                    <button
                        onClick={e => { e.stopPropagation(); onEdit(task); }}
                        className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-6 h-6 transition-all duration-150 cursor-pointer"
                        style={{ background: 'rgba(59,130,246,0.10)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.22)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.25)'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#3b82f6'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.10)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(59,130,246,0.22)'; }}>
                        <Pencil className="w-3 h-3" />
                    </button>
                    {/* Delete button */}
                    <button
                        onClick={e => { e.stopPropagation(); onDelete(task.id); }}
                        className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-6 h-6 transition-all duration-150 cursor-pointer"
                        style={{ background: 'rgba(239,68,68,0.10)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.22)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.10)'; (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}>
                        <X className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Title */}
            <p className="text-sm font-extrabold tracking-tight uppercase leading-snug mb-2"
                style={{ color: task.status === 'done' ? 'var(--color-text-muted)' : 'white', textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>
                {task.title}
            </p>
            {task.description && (
                <p className="text-[11px] leading-relaxed mb-3" style={{ color: 'var(--color-text-muted)' }}>{task.description}</p>
            )}

            {/* Footer */}
            <div className="mt-auto pt-3" style={{ borderTop: '1px solid var(--color-glass-border)' }}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5" style={{ color: 'var(--color-text-faint)' }}>
                        <Calendar className="w-3 h-3" />
                        <span className="text-[10px] font-mono">{fmtDate(task.dueDate)}</span>
                    </div>
                    {task.status !== 'done' && (
                        <span className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5"
                            style={{ color: urgencyColor, border: `1px solid ${urgencyColor}44` }}>
                            {urgencyLabel}
                        </span>
                    )}
                </div>
            </div>
            <GripVertical className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 opacity-0 group-hover:opacity-20 transition-opacity" style={{ color: 'white' }} />
        </div>
    );
}

/* ── Task Form Modal (shared by New + Edit) ──────────────────────────────────── */
function TaskModal({
    mode, initial, onClose, onSave,
}: {
    mode: 'new' | 'edit';
    initial?: Task;
    onClose: () => void;
    onSave: (t: Task) => void;
}) {
    const today = new Date().toISOString().slice(0, 10);
    const [form, setForm] = useState({
        title:       initial?.title       ?? '',
        description: initial?.description ?? '',
        course:      initial?.course      ?? '',
        dueDate:     initial?.dueDate     ?? today,
        priority:    (initial?.priority   ?? 'medium') as Priority,
        status:      (initial?.status     ?? 'upcoming') as Status,
    });

    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [onClose]);

    const set = (k: string) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
            setForm(f => ({ ...f, [k]: e.target.value }));

    const handleSave = () => {
        if (!form.title.trim()) return;
        onSave({
            id:          initial?.id ?? uid(),
            title:       form.title.trim(),
            description: form.description.trim(),
            course:      form.course || 'General',
            dueDate:     form.dueDate,
            priority:    form.priority,
            status:      form.status,
            progress:    form.status === 'done' ? 100 : (initial?.progress ?? 0),
        });
        onClose();
    };

    const isEdit = mode === 'edit';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

            <div className="w-full max-w-md overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-glass-border)' }}>

                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6"
                    style={{ borderBottom: '1px solid var(--color-glass-border)' }}>
                    <div>
                        <span className="text-[10px] font-black tracking-[0.3em] uppercase block mb-1"
                            style={{ color: isEdit ? '#3b82f6' : 'var(--color-brand)' }}>
                            {isEdit ? '// EDIT_TASK' : '// TASK_CENTER'}
                        </span>
                        <h3 className="text-xl font-extrabold tracking-tighter uppercase text-[var(--color-text)]">
                            {isEdit ? 'Edit Task' : 'New Task'}
                        </h3>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center cursor-pointer transition-colors"
                        style={{ border: '1px solid var(--color-glass-border)', background: 'var(--color-glass)', color: 'var(--color-text-muted)' }}
                        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = 'white'}
                        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)'}>
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-8 space-y-5">
                    <div>
                        <label className={labelCls} style={labelStyle}>Task Title *</label>
                        <input autoFocus className={inputCls} style={fieldStyle}
                            placeholder="e.g. Chapter 5 Problem Set"
                            value={form.title} onChange={set('title')}
                            onKeyDown={e => { if (e.key === 'Enter') handleSave(); }} />
                    </div>
                    <div>
                        <label className={labelCls} style={labelStyle}>Description</label>
                        <textarea className={inputCls} style={{ ...fieldStyle, resize: 'none', minHeight: '72px' }}
                            placeholder="Optional notes…"
                            value={form.description} onChange={set('description')} />
                    </div>
                    <div>
                        <label className={labelCls} style={labelStyle}>Course / Module</label>
                        <input className={inputCls} style={fieldStyle}
                            placeholder="e.g. Physics 301"
                            value={form.course} onChange={set('course')} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls} style={labelStyle}>Due Date</label>
                            <input type="date" className={inputCls} style={fieldStyle}
                                value={form.dueDate} onChange={set('dueDate')} />
                        </div>
                        <div>
                            <label className={labelCls} style={labelStyle}>Priority</label>
                            <select className={inputCls} style={fieldStyle} value={form.priority} onChange={set('priority')}>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className={labelCls} style={labelStyle}>Status</label>
                        <select className={inputCls} style={fieldStyle} value={form.status} onChange={set('status')}>
                            <option value="upcoming">Upcoming</option>
                            <option value="active">Active</option>
                            <option value="done">Done</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button onClick={onClose}
                            className="flex-1 py-3 text-sm font-black tracking-widest uppercase cursor-pointer transition-all duration-150"
                            style={{ background: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-glass-border)' }}
                            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-outline-variant)'}
                            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-glass-border)'}>
                            Cancel
                        </button>
                        <button
                            disabled={!form.title.trim()}
                            onClick={handleSave}
                            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-black tracking-widest uppercase cursor-pointer transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                            style={isEdit
                                ? { border: '1px solid #3b82f6', color: '#3b82f6', background: 'rgba(59,130,246,0.08)' }
                                : { border: '1px solid var(--color-brand)', color: 'var(--color-brand)', background: 'var(--color-active-bg)' }}
                            onMouseEnter={e => {
                                if (form.title.trim()) {
                                    const el = e.currentTarget as HTMLButtonElement;
                                    el.style.background = isEdit ? '#3b82f6' : 'var(--color-brand)';
                                    el.style.color = '#000';
                                    el.style.boxShadow = isEdit ? '0 4px 18px rgba(59,130,246,0.35)' : '0 4px 18px rgba(34,197,94,0.35)';
                                }
                            }}
                            onMouseLeave={e => {
                                const el = e.currentTarget as HTMLButtonElement;
                                el.style.background = isEdit ? 'rgba(59,130,246,0.08)' : 'rgba(34,197,94,0.08)';
                                el.style.color = isEdit ? '#3b82f6' : 'var(--color-brand)';
                                el.style.boxShadow = 'none';
                            }}>
                            {isEdit ? <><Save className="w-4 h-4" /> Save Changes</> : <><Plus className="w-4 h-4" /> Initialize Task</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Main Page ──────────────────────────────────────────────────────────────── */
export default function TaskCenterPage() {
    const [tasks, setTasks]           = useState<Task[]>(loadTasks);
    const [showNew, setShowNew]       = useState(false);
    const [editing, setEditing]       = useState<Task | null>(null);
    const [draggingId, setDragging]   = useState<string | null>(null);
    const [dragOverCol, setDragOverCol] = useState<Status | null>(null);
    const dragItem = useRef<string | null>(null);

    useEffect(() => { saveTasks(tasks); }, [tasks]);

    const addTask    = useCallback((t: Task) => setTasks(p => [t, ...p]), []);
    const deleteTask = useCallback((id: string) => setTasks(p => p.filter(t => t.id !== id)), []);
    const editTask   = useCallback((updated: Task) => setTasks(p => p.map(t => t.id === updated.id ? updated : t)), []);

    const onDragStart = (id: string) => { dragItem.current = id; setDragging(id); };
    const onDragEnd   = () => { setDragging(null); setDragOverCol(null); dragItem.current = null; };
    const onDrop      = (status: Status) => {
        if (!dragItem.current) return;
        setTasks(p => p.map(t => t.id === dragItem.current
            ? { ...t, status, progress: status === 'done' ? 100 : status === 'active' && t.progress === undefined ? 0 : t.progress }
            : t));
        onDragEnd();
    };

    useEffect(() => {
        const h = () => { setDragging(null); setDragOverCol(null); dragItem.current = null; };
        window.addEventListener('dragend', h);
        return () => window.removeEventListener('dragend', h);
    }, []);

    return (
        <div className="flex min-h-screen" style={{ background: 'var(--color-surface)' }}>
            <Sidebar />
            <main className="grow flex flex-col overflow-hidden">
                <Header title="Task Center" subtitle="Ops_Board_V1" />

                <div className="grow overflow-hidden flex flex-col p-8 gap-8">

                    {/* Page header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0">
                        <div>
                            <span className="text-[10px] font-black tracking-[0.3em] uppercase block mb-2" style={{ color: 'var(--color-brand)' }}>// OPS_BOARD_V1</span>
                            <h2 className="text-7xl font-extrabold tracking-tighter uppercase leading-none text-[var(--color-text)]">Task Center</h2>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-4 px-5 py-3" style={{ border: '1px solid var(--color-glass-border)', borderRadius: 8 }}>
                                <div className="w-2 h-2 bg-green-500 animate-pulse" />
                                <span className="text-[10px] font-bold tracking-widest text-[var(--color-text-muted)] uppercase">{tasks.length} TASK NODE${
                                (tasks.length > 1) ? "S" : ""}</span>
                            </div>
                            <button onClick={() => setShowNew(true)}
                                className="flex items-center gap-2 px-6 py-3 text-sm font-black tracking-widest uppercase cursor-pointer transition-all duration-150"
                                style={{ border: '1px solid var(--color-brand)', color: 'var(--color-brand)', background: 'var(--color-active-bg)' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-brand)'; (e.currentTarget as HTMLButtonElement).style.color = '#000'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 18px rgba(34,197,94,0.35)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.08)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-brand)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}>
                                <Plus className="w-4 h-4" />New Task
                            </button>
                        </div>
                    </div>

                    {/* Column summary strip */}
                    <div className="flex items-center shrink-0" style={{ border: '1px solid var(--color-glass-border)', borderRadius: 8 }}>
                        {COLUMNS.map((col, i) => {
                            const count = tasks.filter(t => t.status === col.id).length;
                            return (
                                <div key={col.id} className="flex-1 flex items-center justify-between px-6 py-3"
                                    style={{ borderRight: i < COLUMNS.length - 1 ? '1px solid var(--color-glass-border)' : 'none' }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5" style={{ background: col.color }} />
                                        <span className="text-[10px] font-black tracking-[0.25em] uppercase" style={{ color: 'var(--color-text-muted)' }}>{col.label}</span>
                                    </div>
                                    <span className="text-[10px] font-black font-mono tracking-widest" style={{ color: col.color }}>{String(count).padStart(2, '0')}</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Kanban board */}
                    <div className="grid grid-cols-3 gap-5 grow min-h-0">
                        {COLUMNS.map(col => {
                            const colTasks = tasks.filter(t => t.status === col.id);
                            const isOver   = dragOverCol === col.id;
                            return (
                                <div key={col.id}
                                    className="flex flex-col overflow-hidden transition-all duration-200"
                                    style={{ border: isOver ? `1px solid ${col.color}` : '1px solid var(--color-glass-border)', background: isOver ? col.bg : 'transparent', transform: isOver ? 'scale(1.01)' : 'scale(1)' }}
                                    onDragOver={e => { e.preventDefault(); setDragOverCol(col.id); }}
                                    onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCol(null); }}
                                    onDrop={() => onDrop(col.id)}>

                                    {/* Column header */}
                                    <div className="flex items-center justify-between px-5 py-4 shrink-0"
                                        style={{ borderBottom: '1px solid var(--color-glass-border)' }}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-6" style={{ background: col.color }} />
                                            <div>
                                                <p className="text-xs font-extrabold tracking-widest uppercase text-[var(--color-text)]">{col.label}</p>
                                                <p className="text-[9px] font-mono tracking-[0.2em]" style={{ color: 'var(--color-text-muted)' }}>{col.tag}</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black font-mono px-3 py-1"
                                            style={{ color: col.color, border: `1px solid ${col.border}`, background: col.bg }}>
                                            {String(colTasks.length).padStart(2, '0')}
                                        </span>
                                    </div>

                                    {/* Tasks */}
                                    <div className="grow overflow-y-auto p-3 space-y-2">
                                        {colTasks.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-28 border border-dashed" style={{ borderColor: 'var(--color-glass-border)' }}>
                                                <p className="text-[12px] font-bold tracking-[0.15em] uppercase" style={{ color: 'var(--color-text-faint)' }}>No tasks</p>
                                                <p className="text-[11px] font-mono mt-1" style={{ color: 'var(--color-text-muted)' }}>Drag here or add new</p>
                                            </div>
                                        ) : colTasks.map(task => (
                                            <TaskCard key={task.id} task={task}
                                                onDelete={deleteTask}
                                                onEdit={t => setEditing(t)}
                                                dragging={draggingId === task.id}
                                                onDragStart={() => onDragStart(task.id)}
                                                onDragEnd={onDragEnd} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>

            {showNew && (
                <TaskModal mode="new" onClose={() => setShowNew(false)} onSave={addTask} />
            )}
            {editing && (
                <TaskModal mode="edit" initial={editing} onClose={() => setEditing(null)} onSave={editTask} />
            )}
        </div>
    );
}
