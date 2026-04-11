import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { fetchCourses, fetchCourse } from '../lib/dataService';
import {
  ChevronLeft, ChevronRight, AlertTriangle, X, Zap, BookOpen,
  CheckSquare, Calendar, Clock, Plus, Trash2, CheckCircle2,
  ChevronDown, Info, Tag, BarChart2
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────

const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const EVAL_TYPES = ['quiz','assignment','lab','project','viva','midsem','endsem','other'] as const;
const LS_KEY = 'semsync_calendar_items';

const TYPE_META: Record<string, { color: string; bg: string; border: string; label: string }> = {
  midsem:     { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.35)',  label: 'Mid Sem'    },
  endsem:     { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.35)',  label: 'End Sem'    },
  quiz:       { color: 'var(--color-brand)', bg: 'var(--color-brand-glow)', border: 'var(--color-brand)', label: 'Quiz' },
  assignment: { color: '#60a5fa', bg: 'rgba(96,165,250,0.10)', border: 'rgba(96,165,250,0.35)', label: 'Assignment' },
  lab:        { color: '#a78bfa', bg: 'rgba(167,139,250,0.10)',border: 'rgba(167,139,250,0.35)',label: 'Lab'        },
  project:    { color: '#06b6d4', bg: 'rgba(6,182,212,0.10)',  border: 'rgba(6,182,212,0.35)',  label: 'Project'    },
  viva:       { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.35)', label: 'Viva'       },
  other:      { color: 'var(--color-text-muted)', bg: 'var(--color-glass)', border: 'var(--color-glass-border)', label: 'Other' },
  task:       { color: '#a78bfa', bg: 'rgba(167,139,250,0.10)',border: 'rgba(167,139,250,0.30)',label: 'Task'       },
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface LocalItem {
  id: string;
  type: 'task' | 'eval';
  title: string;
  date: string;
  courseId?: string;
  courseName?: string;
  evalType?: string;
  weightage?: number;
  note?: string;
  done: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function pad2(n: number) { return String(n).padStart(2, '0'); }
function toISO(d: Date) { return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; }
function loadItems(): LocalItem[] { try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]'); } catch { return []; } }
function saveItems(items: LocalItem[]) { localStorage.setItem(LS_KEY, JSON.stringify(items)); }

function getMeta(e: any) {
  if (e._local) return TYPE_META[e.type === 'task' ? 'task' : (e.evalType ?? 'other')] ?? TYPE_META.other;
  return TYPE_META[e.type] ?? TYPE_META.other;
}

function relativeDay(dateStr: string) {
  const d = new Date(dateStr); d.setHours(0,0,0,0);
  const t = new Date(); t.setHours(0,0,0,0);
  const diff = Math.round((d.getTime() - t.getTime()) / 86400000);
  if (diff === 0) return { label: 'TODAY', urgent: true };
  if (diff === 1) return { label: 'TOMORROW', urgent: true };
  if (diff < 0) return { label: `${Math.abs(diff)}D AGO`, urgent: false };
  if (diff <= 3) return { label: `IN ${diff}D`, urgent: true };
  if (diff <= 7) return { label: `IN ${diff}D`, urgent: false };
  return { label: `${diff}D`, urgent: false };
}

// ── Item Detail Panel ─────────────────────────────────────────────────────────

function ItemDetail({ item, onClose, onToggle, onDelete }: {
  item: any; onClose: () => void; onToggle?: () => void; onDelete?: () => void;
}) {
  const meta = getMeta(item);
  const evalType = item._local ? (item.type === 'task' ? 'task' : item.evalType ?? 'other') : item.type;
  const isCritical = ['midsem','endsem'].includes(evalType);
  const dateStr = item.date ?? '';
  const rel = dateStr ? relativeDay(dateStr) : null;

  return (
    <div style={{ animation: 'slideInRight 0.18s ease' }}>
      <style>{`@keyframes slideInRight { from{opacity:0;transform:translateX(10px)} to{opacity:1;transform:none} }`}</style>
      <div style={{ height: 3, background: `linear-gradient(90deg,${meta.color}66,${meta.color})` }} />

      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-glass-border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5, flexWrap: 'wrap' }}>
            {isCritical && <AlertTriangle style={{ width: 11, height: 11, color: '#ef4444' }} />}
            <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '2px 6px', borderRadius: 5, background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
              {TYPE_META[evalType]?.label ?? evalType}
            </span>
            {rel && <span style={{ fontSize: 9, fontWeight: 700, fontFamily: 'monospace', color: rel.urgent ? '#f59e0b' : 'var(--color-text-faint)' }}>{rel.label}</span>}
          </div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.3, letterSpacing: '-0.01em' }}>{item.title}</p>
        </div>
        <button onClick={onClose} style={{ width: 24, height: 24, flexShrink: 0, borderRadius: 6, border: '1px solid var(--color-glass-border)', background: 'var(--color-glass)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X style={{ width: 11, height: 11, color: 'var(--color-text-muted)' }} />
        </button>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 9 }}>
        {item.courseName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <BookOpen style={{ width: 11, height: 11, color: 'var(--color-text-faint)', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>{item.courseName}</span>
          </div>
        )}
        {dateStr && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Calendar style={{ width: 11, height: 11, color: 'var(--color-text-faint)', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{dateStr.slice(0,10)}</span>
          </div>
        )}
        {item.weightage != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <BarChart2 style={{ width: 11, height: 11, color: 'var(--color-text-faint)', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{item.weightage}% weightage</span>
          </div>
        )}
        {item.score != null && item.maxScore != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Tag style={{ width: 11, height: 11, color: 'var(--color-text-faint)', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
              Score: {item.score}/{item.maxScore} ({((item.score/item.maxScore)*100).toFixed(1)}%)
            </span>
          </div>
        )}
        {item.note && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
            <Info style={{ width: 11, height: 11, color: 'var(--color-text-faint)', flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{item.note}</span>
          </div>
        )}

        {item._local && (
          <div style={{ display: 'flex', gap: 7, marginTop: 4, paddingTop: 10, borderTop: '1px solid var(--color-glass-border)' }}>
            {onToggle && (
              <button onClick={onToggle} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 0', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: item.done ? 'rgba(167,139,250,0.08)' : 'rgba(34,197,94,0.07)', color: item.done ? '#a78bfa' : 'var(--color-brand)', border: `1px solid ${item.done ? 'rgba(167,139,250,0.3)' : 'var(--color-brand)'}` }}>
                <CheckCircle2 style={{ width: 12, height: 12 }} />
                {item.done ? 'Undo' : 'Done'}
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} style={{ width: 33, height: 33, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 7, cursor: 'pointer', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                <Trash2 style={{ width: 12, height: 12 }} />
              </button>
            )}
          </div>
        )}

        {isCritical && !item._local && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 9px', borderRadius: 7, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', marginTop: 4 }}>
            <AlertTriangle style={{ width: 10, height: 10, color: '#ef4444', flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Critical evaluation</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Quick-create modal ────────────────────────────────────────────────────────

interface ModalProps {
  date: Date;
  courses: any[];
  onClose: () => void;
  onSave: (item: LocalItem) => void;
  initialMode?: 'task' | 'eval' | 'choose';
}

function QuickCreateModal({ date, courses, onClose, onSave, initialMode = 'choose' }: ModalProps) {
  const [mode, setMode]         = useState<'choose'|'task'|'eval'>(initialMode);
  const [title, setTitle]       = useState('');
  const [courseId, setCourseId] = useState('');
  const [evalType, setEvalType] = useState<string>('quiz');
  const [weightage, setWeightage] = useState('');
  const [note, setNote]         = useState('');
  const [shake, setShake]       = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (mode !== 'choose') setTimeout(() => titleRef.current?.focus(), 80); }, [mode]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const selectedCourse = courses.find(c => c.id === courseId);

  const handleSave = () => {
    if (!title.trim()) { setShake(true); setTimeout(() => setShake(false), 400); titleRef.current?.focus(); return; }
    const item: LocalItem = {
      id: `local-${Date.now()}`,
      type: mode as 'task'|'eval',
      title: title.trim(),
      date: toISO(date),
      done: false,
      note: note.trim() || undefined,
      ...(mode === 'eval' && courseId ? { courseId, courseName: selectedCourse?.name ?? '', evalType, weightage: weightage ? parseFloat(weightage) : undefined } : {}),
    };
    onSave(item);
    onClose();
  };

  const label = MONTHS[date.getMonth()].slice(0,3) + ' ' + pad2(date.getDate()) + ', ' + date.getFullYear();
  const accent = mode === 'eval' ? 'var(--color-brand)' : '#a78bfa';

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(16px) scale(0.98)} to{opacity:1;transform:none} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
        .modal-shake { animation: shake 0.35s ease; }
        .qc-input:focus { outline: none; }
        .mode-card:hover { transform: translateY(-2px); }
      `}</style>
      <div onClick={e => e.stopPropagation()} style={{ width: 460, borderRadius: 18, background: 'var(--color-surface-1)', border: `1px solid ${accent}33`, boxShadow: `0 32px 80px rgba(0,0,0,0.65)`, animation: 'slideUp 0.2s cubic-bezier(0.34,1.56,0.64,1)', overflow: 'hidden' }}>
        <div style={{ height: 3, background: mode === 'choose' ? 'linear-gradient(90deg,#a78bfa,var(--color-brand))' : mode === 'task' ? 'linear-gradient(90deg,#7c3aed,#a78bfa)' : 'linear-gradient(90deg,var(--color-brand-dim),var(--color-brand))' }} />

        <div style={{ padding: '18px 22px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${accent}18`, border: `1px solid ${accent}33` }}>
              {mode === 'choose' ? <Zap style={{ width: 16, height: 16, color: accent }} /> : mode === 'task' ? <CheckSquare style={{ width: 16, height: 16, color: accent }} /> : <BookOpen style={{ width: 16, height: 16, color: accent }} />}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
                {mode === 'choose' ? 'Add to Calendar' : mode === 'task' ? 'New Task' : 'New Evaluation'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Calendar style={{ width: 10, height: 10, color: 'var(--color-text-faint)' }} />
                <span style={{ fontSize: 10, color: 'var(--color-text-faint)', fontWeight: 600 }}>{label}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--color-glass-border)', background: 'var(--color-glass)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X style={{ width: 13, height: 13, color: 'var(--color-text-muted)' }} />
          </button>
        </div>

        <div style={{ padding: '20px 22px 22px' }}>
          {mode === 'choose' && (
            <>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                {([
                  { m: 'task' as const, icon: CheckSquare, label: 'Task', sub: 'Personal to-do', color: '#a78bfa', bg: 'rgba(167,139,250,0.07)' },
                  { m: 'eval' as const, icon: BookOpen, label: 'Evaluation', sub: 'Course assessment', color: 'var(--color-brand)', bg: 'var(--color-active-bg)' },
                ]).map(({ m, icon: Icon, label, sub, color, bg }) => (
                  <button key={m} className="mode-card" onClick={() => setMode(m)} style={{ flex: 1, padding: '16px 12px', borderRadius: 12, cursor: 'pointer', background: bg, border: `1px solid ${color}33`, textAlign: 'center', transition: 'all 0.15s' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                      <Icon style={{ width: 18, height: 18, color }} />
                    </div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--color-text)' }}>{label}</p>
                    <p style={{ margin: '3px 0 0', fontSize: 10, color: 'var(--color-text-muted)' }}>{sub}</p>
                  </button>
                ))}
              </div>
              <p style={{ textAlign: 'center', fontSize: 10, color: 'var(--color-text-faint)' }}>Press <kbd style={{ padding: '1px 5px', borderRadius: 4, background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)', fontSize: 10 }}>Esc</kbd> to dismiss</p>
            </>
          )}

          {mode !== 'choose' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                  {mode === 'task' ? 'Task Name' : 'Evaluation Title'} <span style={{ color: accent }}>*</span>
                </label>
                <input ref={titleRef} type="text" className={`qc-input${shake ? ' modal-shake' : ''}`} value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSave()} placeholder={mode === 'task' ? 'e.g. Read chapter 5...' : 'e.g. Mid-semester exam...'} maxLength={80}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 9, fontSize: 13, fontWeight: 500, background: 'var(--color-surface-2)', border: `1px solid ${accent}55`, color: 'var(--color-text)', outline: 'none' }} />
              </div>

              {mode === 'eval' && (
                <>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                      Course <span style={{ color: 'var(--color-text-faint)', fontWeight: 400, textTransform: 'none' }}>(optional)</span>
                    </label>
                    <select className="qc-input" value={courseId} onChange={e => setCourseId(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 9, fontSize: 12, fontWeight: 500, background: 'var(--color-surface-2)', border: '1px solid var(--color-glass-border)', color: courseId ? 'var(--color-text)' : 'var(--color-text-muted)', cursor: 'pointer', outline: 'none' }}>
                      <option value="">— No course —</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Type</label>
                      <select className="qc-input" value={evalType} onChange={e => setEvalType(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 9, fontSize: 12, fontWeight: 500, background: 'var(--color-surface-2)', border: '1px solid var(--color-glass-border)', color: 'var(--color-text)', cursor: 'pointer', outline: 'none' }}>
                        {EVAL_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                      </select>
                    </div>
                    <div style={{ width: 110 }}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Weight %</label>
                      <input type="number" className="qc-input" value={weightage} onChange={e => setWeightage(e.target.value)} placeholder="0–100" min={0} max={100} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 9, fontSize: 12, fontWeight: 500, background: 'var(--color-surface-2)', border: '1px solid var(--color-glass-border)', color: 'var(--color-text)', outline: 'none' }} />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                  Note <span style={{ color: 'var(--color-text-faint)', fontWeight: 400, textTransform: 'none' }}>(optional)</span>
                </label>
                <textarea className="qc-input" value={note} onChange={e => setNote(e.target.value)} placeholder="Add a quick note..." rows={2} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 9, fontSize: 12, background: 'var(--color-surface-2)', border: '1px solid var(--color-glass-border)', color: 'var(--color-text)', resize: 'none', fontFamily: 'inherit', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setMode('choose')} style={{ padding: '10px 16px', borderRadius: 9, fontSize: 11, fontWeight: 700, background: 'var(--color-glass)', color: 'var(--color-text-muted)', border: '1px solid var(--color-glass-border)', cursor: 'pointer' }}>← Back</button>
                <button onClick={handleSave} style={{ flex: 1, padding: '10px 0', borderRadius: 9, fontSize: 12, fontWeight: 800, background: `linear-gradient(135deg, ${mode === 'task' ? '#7c3aed, #a78bfa' : 'var(--color-brand-dim), var(--color-brand)'})`, color: '#fff', border: 'none', cursor: 'pointer', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {mode === 'task' ? 'Create Task' : 'Create Evaluation'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main CalendarPage ─────────────────────────────────────────────────────────

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [allEvals, setAllEvals]   = useState<any[]>([]);
  const [courses, setCourses]     = useState<any[]>([]);
  const [selected, setSelected]   = useState<number | null>(today.getDate());
  const [localItems, setLocalItems] = useState<LocalItem[]>(() => loadItems());
  const [modal, setModal]       = useState<{ date: Date; mode?: 'task'|'eval'|'choose' } | null>(null);
  const [activeItem, setActiveItem] = useState<any | null>(null);
  const [sideTab, setSideTab]   = useState<'day'|'upcoming'>('day');
  const [upcomingFilter, setUpcomingFilter] = useState<'all'|'week'|'month'>('all');
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const courseList = await fetchCourses();
      setCourses(courseList);
      // Fetch ALL evals (including past) by pulling course details
      const details = await Promise.all(courseList.map((c: any) => fetchCourse(c.id).catch(() => null)));
      const gathered: any[] = [];
      details.forEach((d, i) => {
        if (!d) return;
        (d.evaluations ?? []).forEach((ev: any) => {
          gathered.push({ ...ev, courseName: courseList[i]?.name ?? '' });
        });
      });
      setAllEvals(gathered);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); };

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();

  const evalsOnDay = (day: number) => {
    const target = new Date(year, month, day);
    const remote = allEvals.filter(e => {
      if (!e.date) return false;
      const ed = new Date(e.date);
      return ed.getFullYear() === target.getFullYear() && ed.getMonth() === target.getMonth() && ed.getDate() === target.getDate();
    });
    const local = localItems.filter(item => {
      const [y2,m2,d2] = item.date.split('-').map(Number);
      return y2 === target.getFullYear() && m2-1 === target.getMonth() && d2 === target.getDate();
    });
    return { remote, local, all: [...remote, ...local.map(l => ({ ...l, _local: true }))] };
  };

  const selectedData = selected ? evalsOnDay(selected) : { remote: [], local: [], all: [] };
  const isToday = (day: number) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  const isPast  = (day: number) => { const d = new Date(year, month, day); d.setHours(0,0,0,0); const t = new Date(); t.setHours(0,0,0,0); return d < t; };

  const handleDayClick = (day: number) => {
    setActiveItem(null);
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      setSelected(day);
      setSideTab('day');
      setModal({ date: new Date(year, month, day) });
    } else {
      setSelected(day);
      setSideTab('day');
      clickTimer.current = setTimeout(() => { clickTimer.current = null; }, 300);
    }
  };

  const handleSaveItem = (item: LocalItem) => {
    const updated = [...localItems, item];
    setLocalItems(updated);
    saveItems(updated);
  };

  const handleToggleDone = (id: string) => {
    const updated = localItems.map(i => i.id === id ? { ...i, done: !i.done } : i);
    setLocalItems(updated);
    saveItems(updated);
    setActiveItem((prev: any) => prev?.id === id ? { ...prev, done: !prev.done } : prev);
  };

  const handleDeleteLocal = (id: string) => {
    const updated = localItems.filter(i => i.id !== id);
    setLocalItems(updated);
    saveItems(updated);
    setActiveItem(null);
  };

  const upcomingEvals = [...allEvals]
    .filter(e => e.date)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .filter(e => {
      const d = new Date(e.date); d.setHours(0,0,0,0);
      const t = new Date(); t.setHours(0,0,0,0);
      if (upcomingFilter === 'week') { const w = new Date(t); w.setDate(t.getDate()+7); return d >= t && d <= w; }
      if (upcomingFilter === 'month') { const m = new Date(t); m.setDate(t.getDate()+30); return d >= t && d <= m; }
      return d >= t;
    });

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-surface)' }}>
      <Sidebar />
      <main className="grow flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <header className="border-b border-[var(--color-glass-border)] px-6 py-4 flex justify-between items-center shrink-0" style={{ background: 'var(--color-surface-1)' }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-brand)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 2 }}>// ACADEMIC_CALENDAR</p>
            <h2 className="text-2xl font-extrabold uppercase tracking-tighter" style={{ color: 'var(--color-text)' }}>
              {MONTHS[month]} <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>{year}</span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="w-9 h-9 border border-[var(--color-glass-border)] flex items-center justify-center hover:border-[var(--color-text-muted)] transition-colors rounded-lg" style={{ background: 'var(--color-glass)' }}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()); setSelected(today.getDate()); setSideTab('day'); }} className="px-4 py-2 border border-[var(--color-glass-border)] text-[10px] font-bold tracking-widest hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] transition-colors uppercase rounded-lg" style={{ background: 'var(--color-glass)' }}>
              Today
            </button>
            <button onClick={nextMonth} className="w-9 h-9 border border-[var(--color-glass-border)] flex items-center justify-center hover:border-[var(--color-text-muted)] transition-colors rounded-lg" style={{ background: 'var(--color-glass)' }}>
              <ChevronRight className="w-4 h-4" />
            </button>
            {selected && (
              <button onClick={() => setModal({ date: new Date(year, month, selected) })} className="flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-black tracking-widest uppercase cursor-pointer transition-all" style={{ border: '1px solid var(--color-brand)', color: 'var(--color-brand)', background: 'var(--color-active-bg)' }}>
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            )}
          </div>
        </header>

        <div className="flex grow overflow-hidden">

          {/* ── Calendar Grid ── */}
          <div className="grow flex flex-col overflow-y-auto">
            <div className="grid grid-cols-7 border-b border-[var(--color-glass-border)] shrink-0">
              {DAYS.map((d, i) => (
                <div key={d} className="border-r last:border-r-0 border-[var(--color-glass-border)] px-3 py-3 text-[10px] font-extrabold tracking-widest uppercase" style={{ background: 'var(--color-surface-2)', color: i === 0 || i === 6 ? 'var(--color-text-faint)' : 'var(--color-text-muted)' }}>
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 grow">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="border-r border-b border-[var(--color-glass-border)] min-h-28" style={{ background: 'var(--color-surface)', opacity: 0.25 }} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const { all: dayItems } = evalsOnDay(day);
                const isSelected = selected === day;
                const todayCell = isToday(day);
                const past = isPast(day) && !todayCell;

                return (
                  <div
                    key={day}
                    onClick={() => handleDayClick(day)}
                    style={{ userSelect: 'none', opacity: past && dayItems.length === 0 ? 0.4 : 1 }}
                    className={`border-r border-b border-[var(--color-glass-border)] min-h-28 cursor-pointer transition-all duration-100 relative group flex flex-col
                      ${isSelected ? 'bg-[var(--color-surface-2)]' : 'hover:bg-[var(--color-surface-2)]/50'}
                      ${todayCell ? 'ring-1 ring-inset ring-[var(--color-brand)]/60' : ''}`}
                  >
                    <div className="flex justify-between items-start p-2 pb-1">
                      <span style={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, background: todayCell ? 'var(--color-brand)' : 'transparent', color: todayCell ? '#000' : isSelected ? 'var(--color-text)' : past ? 'var(--color-text-faint)' : 'var(--color-text-muted)' }}>
                        {day}
                      </span>
                      {dayItems.length > 0 && (
                        <span style={{ fontSize: 9, fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-text-faint)', paddingTop: 4 }}>{dayItems.length}</span>
                      )}
                    </div>

                    <div className="flex flex-col gap-0.5 px-1.5 pb-1.5 flex-1">
                      {dayItems.slice(0, 3).map((e: any) => {
                        const meta = getMeta(e);
                        return (
                          <div key={e.id} style={{ fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 4, background: meta.bg, color: meta.color, borderLeft: `2px solid ${meta.color}`, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.02em', opacity: e.done ? 0.45 : 1 }}>
                            {e.title}
                          </div>
                        );
                      })}
                      {dayItems.length > 3 && (
                        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-text-faint)', paddingLeft: 5 }}>+{dayItems.length - 3} more</div>
                      )}
                    </div>

                    <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <span style={{ fontSize: 7, fontWeight: 800, color: 'var(--color-text-faint)', textTransform: 'uppercase', background: 'var(--color-surface-1)', padding: '1px 4px', borderRadius: 3, border: '1px solid var(--color-glass-border)' }}>dbl+</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Right Sidebar ── */}
          <aside className="w-80 border-l border-[var(--color-glass-border)] flex flex-col shrink-0" style={{ background: 'var(--color-surface-1)' }}>

            <div className="flex border-b border-[var(--color-glass-border)] shrink-0">
              {(['day', 'upcoming'] as const).map(tab => (
                <button key={tab} onClick={() => { setSideTab(tab); setActiveItem(null); }} style={{ flex: 1, padding: '12px 0', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', cursor: 'pointer', background: 'transparent', border: 'none', borderBottom: `2px solid ${sideTab === tab ? 'var(--color-brand)' : 'transparent'}`, color: sideTab === tab ? 'var(--color-brand)' : 'var(--color-text-faint)', transition: 'all 0.15s' }}>
                  {tab === 'day' ? 'Day View' : 'Upcoming'}
                </button>
              ))}
            </div>

            {activeItem ? (
              <div className="overflow-y-auto flex-1">
                <ItemDetail
                  item={activeItem}
                  onClose={() => setActiveItem(null)}
                  onToggle={activeItem._local ? () => handleToggleDone(activeItem.id) : undefined}
                  onDelete={activeItem._local ? () => handleDeleteLocal(activeItem.id) : undefined}
                />
              </div>
            ) : sideTab === 'day' ? (
              <div className="flex-1 overflow-y-auto">
                <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--color-glass-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      {selected && <p style={{ fontSize: 10, color: 'var(--color-text-faint)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>{DAYS[new Date(year,month,selected).getDay()]}</p>}
                      <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
                        {selected ? `${MONTHS[month].slice(0,3)} ${pad2(selected)}` : 'Select a day'}
                      </p>
                    </div>
                    {selected && (
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button onClick={() => setModal({ date: new Date(year, month, selected), mode: 'task' })} title="Add task" style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(167,139,250,0.4)', background: 'rgba(167,139,250,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
                          <CheckSquare style={{ width: 12, height: 12 }} />
                        </button>
                        <button onClick={() => setModal({ date: new Date(year, month, selected), mode: 'eval' })} title="Add eval" style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--color-brand)', background: 'var(--color-active-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-brand)' }}>
                          <BookOpen style={{ width: 12, height: 12 }} />
                        </button>
                      </div>
                    )}
                  </div>
                  {selectedData.all.length > 0 && (
                    <p style={{ fontSize: 10, color: 'var(--color-text-faint)', marginTop: 5 }}>
                      {selectedData.all.length} item{selectedData.all.length !== 1 ? 's' : ''} · tap to view details
                    </p>
                  )}
                </div>

                {selectedData.all.length === 0 ? (
                  <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                    <Calendar style={{ width: 26, height: 26, color: 'var(--color-text-faint)', margin: '0 auto 10px' }} />
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Nothing here</p>
                    <p style={{ fontSize: 10, color: 'var(--color-text-faint)' }}>Double-click to add</p>
                  </div>
                ) : (
                  <div style={{ padding: '8px 10px' }}>
                    {selectedData.all.map((e: any) => {
                      const meta = getMeta(e);
                      const evalType = e._local ? (e.type === 'task' ? 'task' : e.evalType ?? 'other') : e.type;
                      const isCritical = ['midsem','endsem'].includes(evalType);
                      const isActive = activeItem?.id === e.id;
                      return (
                        <button
                          key={e.id}
                          onClick={() => setActiveItem(isActive ? null : e)}
                          style={{ width: '100%', textAlign: 'left', marginBottom: 6, padding: '10px 12px', borderRadius: 10, background: isActive ? meta.bg : 'var(--color-surface-2)', border: `1px solid ${isActive ? meta.border : 'var(--color-glass-border)'}`, cursor: 'pointer', transition: 'all 0.12s', opacity: e.done ? 0.55 : 1 }}
                          onMouseEnter={el => { if (!isActive) { (el.currentTarget as HTMLElement).style.borderColor = meta.border; (el.currentTarget as HTMLElement).style.background = meta.bg; } }}
                          onMouseLeave={el => { if (!isActive) { (el.currentTarget as HTMLElement).style.borderColor = 'var(--color-glass-border)'; (el.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)'; } }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                                {isCritical && <AlertTriangle style={{ width: 9, height: 9, color: '#ef4444', flexShrink: 0 }} />}
                                <span style={{ fontSize: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '1px 5px', borderRadius: 4, background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
                                  {TYPE_META[evalType]?.label ?? evalType}
                                </span>
                                {e.weightage != null && <span style={{ fontSize: 8, color: 'var(--color-text-faint)', fontFamily: 'monospace' }}>{e.weightage}%</span>}
                                {e.done && <span style={{ fontSize: 8, color: '#a78bfa', fontWeight: 700 }}>✓</span>}
                              </div>
                              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: e.done ? 'line-through' : 'none' }}>{e.title}</p>
                              {e.courseName && <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--color-text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.courseName}</p>}
                            </div>
                            <ChevronDown style={{ width: 11, height: 11, color: 'var(--color-text-faint)', flexShrink: 0, transform: isActive ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s' }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto flex flex-col">
                <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-glass-border)', display: 'flex', gap: 5 }}>
                  {(['all','week','month'] as const).map(f => (
                    <button key={f} onClick={() => setUpcomingFilter(f)} style={{ flex: 1, padding: '5px 0', borderRadius: 6, fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', background: upcomingFilter === f ? 'var(--color-active-bg)' : 'transparent', color: upcomingFilter === f ? 'var(--color-brand)' : 'var(--color-text-faint)', border: `1px solid ${upcomingFilter === f ? 'var(--color-brand)' : 'var(--color-glass-border)'}`, transition: 'all 0.12s' }}>
                      {f === 'all' ? 'All' : f === 'week' ? '7 days' : '30 days'}
                    </button>
                  ))}
                </div>

                {upcomingEvals.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <Clock style={{ width: 26, height: 26, color: 'var(--color-text-faint)', margin: '0 auto 10px' }} />
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>All clear!</p>
                  </div>
                ) : (
                  <div style={{ padding: '8px 10px' }}>
                    {upcomingEvals.map(e => {
                      const meta = TYPE_META[e.type] ?? TYPE_META.other;
                      const rel = relativeDay(e.date);
                      const isCritical = ['midsem','endsem'].includes(e.type);
                      return (
                        <button key={e.id} onClick={() => { setActiveItem(e); setSideTab('day'); }}
                          style={{ width: '100%', textAlign: 'left', marginBottom: 6, padding: '10px 12px', borderRadius: 10, background: 'var(--color-surface-2)', border: `1px solid ${isCritical ? 'rgba(239,68,68,0.25)' : 'var(--color-glass-border)'}`, cursor: 'pointer', transition: 'all 0.12s' }}
                          onMouseEnter={el => { (el.currentTarget as HTMLElement).style.borderColor = meta.border; (el.currentTarget as HTMLElement).style.background = meta.bg; }}
                          onMouseLeave={el => { (el.currentTarget as HTMLElement).style.borderColor = isCritical ? 'rgba(239,68,68,0.25)' : 'var(--color-glass-border)'; (el.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)'; }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                                <span style={{ fontSize: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '1px 5px', borderRadius: 4, background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>{meta.label}</span>
                                {e.weightage != null && <span style={{ fontSize: 8, color: 'var(--color-text-faint)', fontFamily: 'monospace' }}>{e.weightage}%</span>}
                              </div>
                              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</p>
                              {e.courseName && <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--color-text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.courseName}</p>}
                            </div>
                            <span style={{ fontSize: 9, fontWeight: 800, fontFamily: 'monospace', color: rel.urgent ? '#f59e0b' : 'var(--color-text-faint)', flexShrink: 0, paddingTop: 2 }}>{rel.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      </main>

      {modal && (
        <QuickCreateModal
          date={modal.date}
          courses={courses}
          initialMode={modal.mode ?? 'choose'}
          onClose={() => setModal(null)}
          onSave={handleSaveItem}
        />
      )}
    </div>
  );
}
