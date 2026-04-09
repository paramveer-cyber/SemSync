import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { fetchUpcomingEvals, fetchCourses } from '../lib/dataService';
import { ChevronLeft, ChevronRight, AlertTriangle, X, Zap, BookOpen, CheckSquare, Calendar, Clock } from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_COLOR: Record<string, string> = {
  midsem:     'border-l-tertiary bg-[rgba(239,68,68,0.10)] text-[var(--color-danger)]',
  endsem:     'border-l-tertiary bg-[rgba(239,68,68,0.10)] text-[var(--color-danger)]',
  quiz:       'border-l-secondary bg-[var(--color-brand-glow)] text-[var(--color-brand)]',
  assignment: 'border-l-[var(--color-glass-border)] bg-[var(--color-surface-2)] text-[var(--color-text-muted)]',
  lab:        'border-l-secondary bg-[var(--color-brand-glow)] text-[var(--color-brand)]',
  project:    'border-l-[var(--color-glass-border)] bg-[var(--color-surface-2)] text-[var(--color-text-muted)]',
  viva:       'border-l-[var(--color-glass-border)] bg-[var(--color-surface-2)] text-[var(--color-text-muted)]',
  other:      'border-l-[var(--color-glass-border)] bg-[var(--color-glass)] text-[var(--color-text-faint)]',
  task:       'border-l-[#a78bfa] bg-[rgba(167,139,250,0.10)] text-[#a78bfa]',
};

const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const EVAL_TYPES = ['quiz','assignment','lab','project','viva','midsem','endsem','other'] as const;

const LS_KEY = 'semsync_calendar_items';

// ── LocalStorage helpers ──────────────────────────────────────────────────────

interface LocalItem {
  id: string;
  type: 'task' | 'eval';
  title: string;
  date: string;           // ISO yyyy-mm-dd
  courseId?: string;
  courseName?: string;
  evalType?: string;
  weightage?: number;
  note?: string;
  done: boolean;
}

function loadItems(): LocalItem[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]'); } catch { return []; }
}
function saveItems(items: LocalItem[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(items));
}

// ── Eval Picker Modal (shown on double-click when cell has evals) ─────────────

interface EvalPickerModalProps {
  date: Date;
  evals: any[];
  onClose: () => void;
  onAddNew: () => void;
}

function EvalPickerModal({ date, evals, onClose, onAddNew }: EvalPickerModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const label = MONTHS[date.getMonth()].slice(0, 3) + ' ' + pad2(date.getDate()) + ', ' + date.getFullYear();
  const accent = 'var(--color-brand)';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(6px)',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform:translateY(18px) scale(0.97) } to { opacity:1; transform:none } }
      `}</style>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 420, borderRadius: 16,
          background: 'var(--color-surface-1)',
          border: `1px solid ${accent}44`,
          boxShadow: `0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px ${accent}22`,
          animation: 'slideUp 0.2s cubic-bezier(0.34,1.56,0.64,1)',
          overflow: 'hidden',
        }}
      >
        {/* Top stripe */}
        <div style={{ height: 3, background: 'linear-gradient(90deg, var(--color-brand-dim), var(--color-brand))' }} />

        {/* Header */}
        <div style={{ padding: '18px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${accent}18`, border: `1px solid ${accent}44` }}>
              <BookOpen style={{ width: 15, height: 15, color: accent }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>Evaluations</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                <Calendar style={{ width: 10, height: 10, color: 'var(--color-text-faint)' }} />
                <p style={{ margin: 0, fontSize: 10, color: 'var(--color-text-faint)', fontWeight: 600, letterSpacing: '0.03em' }}>{label}</p>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--color-glass-border)', background: 'var(--color-glass)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X style={{ width: 13, height: 13, color: 'var(--color-text-muted)' }} />
          </button>
        </div>

        {/* Eval list */}
        <div style={{ padding: '16px 20px', maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {evals.map((e: any) => {
            const isCritical = ['midsem', 'endsem'].includes(e.type ?? e.evalType ?? '');
            const evalType = e.type ?? e.evalType ?? 'other';
            return (
              <div
                key={e.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: `1px solid ${isCritical ? 'rgba(239,68,68,0.3)' : 'var(--color-glass-border)'}`,
                  background: isCritical ? 'rgba(239,68,68,0.05)' : 'var(--color-surface-2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  {isCritical && <AlertTriangle style={{ width: 11, height: 11, color: 'var(--color-danger)' }} />}
                  <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '1px 6px', borderRadius: 4, background: 'var(--color-active-bg)', color: 'var(--color-brand)', border: '1px solid var(--color-brand)' }}>
                    {evalType}
                  </span>
                  {(e.weightage != null) && (
                    <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--color-text-faint)' }}>{e.weightage}%</span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{e.title}</p>
                {(e.courseName) && (
                  <p style={{ margin: '3px 0 0', fontSize: 10, color: 'var(--color-text-faint)', fontFamily: 'monospace' }}>{e.courseName}</p>
                )}
                {(e.note) && (
                  <p style={{ margin: '3px 0 0', fontSize: 10, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>{e.note}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px 16px', borderTop: '1px solid var(--color-glass-border)', display: 'flex', gap: 8 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '9px 0', borderRadius: 9, fontSize: 11, fontWeight: 700, background: 'var(--color-glass)', color: 'var(--color-text-muted)', border: '1px solid var(--color-glass-border)', cursor: 'pointer' }}
          >
            Close
          </button>
          <button
            onClick={() => { onClose(); onAddNew(); }}
            style={{ flex: 1, padding: '9px 0', borderRadius: 9, fontSize: 11, fontWeight: 800, background: 'var(--color-active-bg)', color: 'var(--color-brand)', border: '1px solid var(--color-brand)', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}
          >
            + Add Task/Eval
          </button>
        </div>
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
}

function pad2(n: number) { return String(n).padStart(2, '0'); }
function toISO(d: Date) { return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; }

function QuickCreateModal({ date, courses, onClose, onSave }: ModalProps) {
  const [mode, setMode]         = useState<'choose' | 'task' | 'eval'>('choose');
  const [title, setTitle]       = useState('');
  const [courseId, setCourseId] = useState('');
  const [evalType, setEvalType] = useState<string>('quiz');
  const [weightage, setWeightage] = useState('');
  const [note, setNote]         = useState('');
  const [shake, setShake]       = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode !== 'choose') setTimeout(() => titleRef.current?.focus(), 80);
  }, [mode]);

  // Trap focus inside modal on mount
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const selectedCourse = courses.find(c => c.id === courseId);

  const handleSave = () => {
    if (!title.trim()) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      titleRef.current?.focus();
      return;
    }
    const item: LocalItem = {
      id: `local-${Date.now()}`,
      type: mode as 'task' | 'eval',
      title: title.trim(),
      date: toISO(date),
      done: false,
      note: note.trim() || undefined,
      ...(mode === 'eval' && courseId ? {
        courseId,
        courseName: selectedCourse?.name ?? '',
        evalType,
        weightage: weightage ? parseFloat(weightage) : undefined,
      } : {}),
    };
    onSave(item);
    onClose();
  };

  const label = MONTHS[date.getMonth()].slice(0,3) + ' ' + pad2(date.getDate()) + ', ' + date.getFullYear();
  const accentTask = '#a78bfa';
  const accentEval = 'var(--color-brand)';
  const accent = mode === 'eval' ? accentEval : accentTask;

  return (
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(6px)',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform:translateY(18px) scale(0.97) } to { opacity:1; transform:none } }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
        .modal-shake { animation: shake 0.35s ease; }
        .quick-input:focus { outline: none; border-color: var(--accent-color) !important; box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-color) 20%, transparent); }
        .mode-btn:hover { transform: translateY(-2px); }
      `}</style>

      {/* Card */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 440, borderRadius: 16,
          background: 'var(--color-surface-1)',
          border: `1px solid ${accent}44`,
          boxShadow: `0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px ${accent}22`,
          animation: 'slideUp 0.2s cubic-bezier(0.34,1.56,0.64,1)',
          overflow: 'hidden',
          '--accent-color': accent,
        } as any}
      >

        {/* Top stripe */}
        <div style={{
          height: 3,
          background: mode === 'choose'
            ? 'linear-gradient(90deg, #a78bfa, var(--color-brand))'
            : mode === 'task'
            ? 'linear-gradient(90deg, #7c3aed, #a78bfa)'
            : 'linear-gradient(90deg, var(--color-brand-dim), var(--color-brand))',
        }} />

        {/* Header */}
        <div style={{ padding: '18px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${accent}18`, border: `1px solid ${accent}44` }}>
              {mode === 'choose' ? <Zap style={{ width: 15, height: 15, color: accent }} />
                : mode === 'task' ? <CheckSquare style={{ width: 15, height: 15, color: accent }} />
                : <BookOpen style={{ width: 15, height: 15, color: accent }} />}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
                {mode === 'choose' ? 'Quick Create' : mode === 'task' ? 'New Task' : 'New Evaluation'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                <Calendar style={{ width: 10, height: 10, color: 'var(--color-text-faint)' }} />
                <p style={{ margin: 0, fontSize: 10, color: 'var(--color-text-faint)', fontWeight: 600, letterSpacing: '0.03em' }}>{label}</p>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--color-glass-border)', background: 'var(--color-glass)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X style={{ width: 13, height: 13, color: 'var(--color-text-muted)' }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px' }}>

          {/* ── Mode chooser ── */}
          {mode === 'choose' && (
            <div style={{ display: 'flex', gap: 10 }}>
              {([
                { m: 'task', icon: CheckSquare, label: 'Task', sub: 'Personal to-do, not course-linked', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
                { m: 'eval', icon: BookOpen,    label: 'Evaluation', sub: 'Linked to a course grade', color: 'var(--color-brand)', bg: 'var(--color-active-bg)' },
              ] as const).map(({ m, icon: Icon, label, sub, color, bg }) => (
                <button
                  key={m}
                  className="mode-btn"
                  onClick={() => setMode(m)}
                  style={{
                    flex: 1, padding: '18px 14px', borderRadius: 12, cursor: 'pointer',
                    background: bg,
                    border: `1px solid ${color}44`,
                    transition: 'all 0.18s ease',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                    <Icon style={{ width: 18, height: 18, color }} />
                  </div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--color-text)' }}>{label}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 10, color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{sub}</p>
                </button>
              ))}
            </div>
          )}

          {/* ── Task / Eval form ── */}
          {mode !== 'choose' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Title */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                  {mode === 'task' ? 'Task Name' : 'Evaluation Title'} <span style={{ color: accent }}>*</span>
                </label>
                <input
                  ref={titleRef}
                  type="text"
                  className={`quick-input${shake ? ' modal-shake' : ''}`}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  placeholder={mode === 'task' ? 'e.g. Read chapter 5...' : 'e.g. Mid-semester exam...'}
                  maxLength={80}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '10px 12px', borderRadius: 9, fontSize: 13, fontWeight: 500,
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-glass-border)',
                    color: 'var(--color-text)',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                />
              </div>

              {/* Eval-only fields */}
              {mode === 'eval' && (
                <>
                  {/* Course selector */}
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                      Course <span style={{ color: 'var(--color-text-faint)', textTransform: 'none', fontWeight: 400 }}>(optional)</span>
                    </label>
                    <select
                      className="quick-input"
                      value={courseId}
                      onChange={e => setCourseId(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 9, fontSize: 12, fontWeight: 500,
                        background: 'var(--color-surface-2)',
                        border: '1px solid var(--color-glass-border)',
                        color: courseId ? 'var(--color-text)' : 'var(--color-text-muted)',
                        cursor: 'pointer',
                        transition: 'border-color 0.15s, box-shadow 0.15s',
                      }}
                    >
                      <option value="">— No course —</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  {/* Eval type + weightage row */}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Type</label>
                      <select
                        className="quick-input"
                        value={evalType}
                        onChange={e => setEvalType(e.target.value)}
                        style={{
                          width: '100%', padding: '10px 12px', borderRadius: 9, fontSize: 12, fontWeight: 500,
                          background: 'var(--color-surface-2)',
                          border: '1px solid var(--color-glass-border)',
                          color: 'var(--color-text)', cursor: 'pointer',
                          transition: 'border-color 0.15s, box-shadow 0.15s',
                        }}
                      >
                        {EVAL_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                      </select>
                    </div>
                    <div style={{ width: 110 }}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Weight %</label>
                      <input
                        type="number"
                        className="quick-input"
                        value={weightage}
                        onChange={e => setWeightage(e.target.value)}
                        placeholder="0–100"
                        min={0} max={100}
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          padding: '10px 12px', borderRadius: 9, fontSize: 12, fontWeight: 500,
                          background: 'var(--color-surface-2)',
                          border: '1px solid var(--color-glass-border)',
                          color: 'var(--color-text)',
                          transition: 'border-color 0.15s, box-shadow 0.15s',
                        }}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Note */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                  Note <span style={{ color: 'var(--color-text-faint)', textTransform: 'none', fontWeight: 400 }}>(optional)</span>
                </label>
                <textarea
                  className="quick-input"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Add a quick note..."
                  rows={2}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '10px 12px', borderRadius: 9, fontSize: 12,
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-glass-border)',
                    color: 'var(--color-text)', resize: 'none',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                <button
                  onClick={() => setMode('choose')}
                  style={{
                    padding: '10px 16px', borderRadius: 9, fontSize: 11, fontWeight: 700,
                    background: 'var(--color-glass)', color: 'var(--color-text-muted)',
                    border: '1px solid var(--color-glass-border)', cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  ← Back
                </button>
                <button
                  onClick={handleSave}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 9, fontSize: 12, fontWeight: 800,
                    background: `linear-gradient(135deg, ${mode === 'task' ? '#7c3aed, #a78bfa' : 'var(--color-brand-dim), var(--color-brand)'})`,
                    color: '#fff',
                    border: 'none', cursor: 'pointer',
                    letterSpacing: '0.04em', textTransform: 'uppercase',
                    boxShadow: mode === 'task' ? '0 4px 18px rgba(139,92,246,0.35)' : '0 4px 18px var(--color-brand-glow)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = mode === 'task' ? '0 6px 22px rgba(139,92,246,0.45)' : '0 6px 22px var(--color-brand-glow)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = mode === 'task' ? '0 4px 18px rgba(139,92,246,0.35)' : '0 4px 18px var(--color-brand-glow)'; }}
                >
                  {mode === 'task' ? 'Create Task' : 'Create Evaluation'}
                </button>
              </div>
            </div>
          )}

          {/* Hint text */}
          {mode === 'choose' && (
            <p style={{ margin: '12px 0 0', textAlign: 'center', fontSize: 10, color: 'var(--color-text-faint)', letterSpacing: '0.03em' }}>
              Press <kbd style={{ padding: '1px 5px', borderRadius: 4, background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)', fontSize: 10 }}>Esc</kbd> to dismiss
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main CalendarPage ─────────────────────────────────────────────────────────

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear]     = useState(today.getFullYear());
  const [month, setMonth]   = useState(today.getMonth());
  const [evals, setEvals]   = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selected, setSelected] = useState<number | null>(today.getDate());
  const [localItems, setLocalItems] = useState<LocalItem[]>(() => loadItems());
  const [modal, setModal]   = useState<Date | null>(null);
  const [evalPickerDate, setEvalPickerDate] = useState<Date | null>(null);
  const [evalPickerItems, setEvalPickerItems] = useState<any[]>([]);

  // double-click timer to distinguish single vs double
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const [evaluations, courseList] = await Promise.all([fetchUpcomingEvals(), fetchCourses()]);
      setEvals(evaluations);
      setCourses(courseList);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const evalsOnDay = (day: number) => {
    const d = new Date(year, month, day);
    const remote = evals.filter(e => {
      const ed = new Date(e.date);
      return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth() && ed.getDate() === d.getDate();
    });
    const local = localItems.filter(item => {
      const [y2, m2, d2] = item.date.split('-').map(Number);
      return y2 === d.getFullYear() && m2 - 1 === d.getMonth() && d2 === d.getDate();
    });
    return { remote, local, all: [...remote, ...local.map(l => ({ ...l, _local: true }))] };
  };

  const selectedData = selected ? evalsOnDay(selected) : { remote: [], local: [], all: [] };
  const isToday = (day: number) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const handleDayClick = (day: number) => {
    if (clickTimer.current) {
      // second click — double-click
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      setSelected(day);
      const { all: dayItems } = evalsOnDay(day);
      // Filter only eval-type items (not tasks)
      const evalItems = dayItems.filter((e: any) => {
        if (e._local) return e.type === 'eval';
        return true; // remote evals are always evals
      });
      if (evalItems.length > 0) {
        // Show eval picker instead of create modal
        setEvalPickerItems(evalItems);
        setEvalPickerDate(new Date(year, month, day));
      } else {
        setModal(new Date(year, month, day));
      }
    } else {
      // first click — wait to see if second arrives
      setSelected(day);
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
  };

  const handleDeleteLocal = (id: string) => {
    const updated = localItems.filter(i => i.id !== id);
    setLocalItems(updated);
    saveItems(updated);
  };

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-surface)' }}>
      <Sidebar />
      <main className="grow flex flex-col overflow-hidden">

        {/* Calendar header */}
        <header
          className="border-b border-[var(--color-glass-border)] px-8 py-6 flex justify-between items-center shrink-0"
          style={{ background: 'var(--color-surface-1)' }}
        >
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-extrabold uppercase tracking-tighter" style={{ color: 'var(--color-text)' }}>
              {MONTHS[month]} {year}
            </h2>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.1em', border: '1px solid var(--color-glass-border)', padding: '3px 8px', borderRadius: 5 }}>
              Double-click any day to add a event!
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={prevMonth} className="w-10 h-10 border border-[var(--color-glass-border)] flex items-center justify-center hover:border-white transition-colors rounded-md">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()); setSelected(today.getDate()); }}
              className="px-6 py-2 border border-[var(--color-glass-border)] text-[10px] font-bold tracking-widest hover:border-white transition-colors uppercase rounded-md"
            >
              Today
            </button>
            <button onClick={nextMonth} className="w-10 h-10 border border-[var(--color-glass-border)] flex items-center justify-center hover:border-white transition-colors rounded-md">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="flex grow overflow-hidden">
          {/* Calendar grid */}
          <div className="grow flex flex-col overflow-y-auto">
            {/* Day labels */}
            <div className="grid grid-cols-7 border-b border-[var(--color-glass-border)] shrink-0">
              {DAYS.map(d => (
                <div key={d} className="border-r last:border-r-0 border-[var(--color-glass-border)] p-4 text-[10px] font-extrabold tracking-widest uppercase" style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
                  {d}
                </div>
              ))}
            </div>
            {/* Day cells */}
            <div className="grid grid-cols-7 grow">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="border-r border-b border-[var(--color-glass-border)] p-4 min-h-30 opacity-20" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const { all: dayItems, local: dayLocal } = evalsOnDay(day);
                const isSelected = selected === day;
                const hasLocal = dayLocal.length > 0;

                return (
                  <div
                    key={day}
                    onClick={() => handleDayClick(day)}
                    title="Double-click to add task or evaluation"
                    style={{ userSelect: 'none' }}
                    className={`border-r border-b border-[var(--color-glass-border)] p-3 min-h-30 cursor-pointer transition-colors relative group
                      ${isSelected ? 'bg-[var(--color-surface-2)]' : ''}
                      ${isToday(day) ? 'ring-1 ring-inset ring-[var(--color-brand)]/50' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold" style={{ color: isToday(day) ? 'var(--color-brand)' : 'var(--color-text-muted)' }}>
                        {String(day).padStart(2, '0')}
                      </span>
                      <div className="flex items-center gap-1">
                        {hasLocal && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#a78bfa', display: 'inline-block' }} title="Has local items" />}
                        {isToday(day) && <span className="w-1.5 h-1.5 bg-[var(--color-brand)] inline-block" />}
                      </div>
                    </div>
                    <div className="space-y-1">
                      {dayItems.slice(0, 2).map((e: any) => (
                        <div
                          key={e.id}
                          className={`text-[9px] font-bold p-1 border-l-2 truncate uppercase ${
                            e._local
                              ? (e.type === 'task' ? 'border-l-[#a78bfa] bg-[rgba(167,139,250,0.10)] text-[#a78bfa]' : TYPE_COLOR[e.evalType ?? 'other'] ?? TYPE_COLOR.other)
                              : TYPE_COLOR[e.type] ?? TYPE_COLOR.other
                          }`}
                        >
                          {e.title}
                        </div>
                      ))}
                      {dayItems.length > 2 && (
                        <div className="text-[9px] text-[var(--color-text-faint)] font-bold uppercase tracking-wider">+{dayItems.length - 2} more</div>
                      )}
                    </div>
                    {/* Double-click hint overlay on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ background: 'rgba(0,0,0,0.04)' }}>
                      <span style={{ fontSize: 8, fontWeight: 800, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'var(--color-surface-1)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--color-glass-border)' }}>
                        dbl-click
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel */}
          <aside className="w-96 border-l border-[var(--color-glass-border)] flex flex-col shrink-0 overflow-y-auto" style={{ background: 'var(--color-surface-1)' }}>
            {/* Selected day */}
            <div className="p-6 border-b border-[var(--color-glass-border)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[18px] font-extrabold tracking-[0.2em] uppercase text-[var(--color-text-faint)]">
                  {selected ? `Day ${String(selected).padStart(2, '0')} / ${MONTHS[month].slice(0, 3).toUpperCase()}` : 'Select a Day'}
                </h3>
                {selected && (
                  <button
                    onClick={() => setModal(new Date(year, month, selected))}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '5px 10px', borderRadius: 7, fontSize: 10, fontWeight: 800,
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      background: 'var(--color-active-bg)', color: 'var(--color-brand)',
                      border: '1px solid var(--color-brand)', cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    title="Add task or evaluation to this day"
                  >
                    <Zap style={{ width: 10, height: 10 }} /> Add
                  </button>
                )}
              </div>

              {selectedData.all.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <Clock style={{ width: 24, height: 24, color: 'var(--color-text-faint)', margin: '0 auto 8px' }} />
                  <p className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase tracking-widest">Nothing here</p>
                  <p style={{ fontSize: 9, color: 'var(--color-text-faint)', marginTop: 4 }}>Double-click the cell to add</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Remote evals */}
                  {selectedData.remote.map(e => {
                    const isCritical = ['midsem', 'endsem'].includes(e.type);
                    return (
                      <div key={e.id} className={`border p-4 space-y-2 rounded-lg ${isCritical ? 'border-red-500/30 bg-red-500/5' : 'border-[var(--color-glass-border)]'}`}>
                        {isCritical && (
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="w-3 h-3 text-[var(--color-danger)]" />
                            <span className="text-[9px] font-bold text-[var(--color-danger)] uppercase tracking-widest">Critical</span>
                          </div>
                        )}
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text)' }}>{e.title}</p>
                        <p className="text-[9px] text-[var(--color-text-faint)] uppercase truncate">{e.courseName}</p>
                        <div className="flex justify-between text-[9px] font-mono text-[var(--color-text-faint)]">
                          <span>{e.type.toUpperCase()}</span>
                          <span>{e.weightage}%</span>
                        </div>
                      </div>
                    );
                  })}
                  {/* Local items */}
                  {selectedData.local.map(item => (
                    <div
                      key={item.id}
                      style={{
                        border: `1px solid ${item.type === 'task' ? 'rgba(167,139,250,0.3)' : 'var(--color-glass-border)'}`,
                        borderRadius: 8, padding: '12px',
                        background: item.done ? 'var(--color-glass)' : (item.type === 'task' ? 'rgba(167,139,250,0.05)' : 'transparent'),
                        opacity: item.done ? 0.6 : 1,
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flex: 1, minWidth: 0 }}>
                          {/* Checkbox / done toggle */}
                          <button
                            onClick={() => handleToggleDone(item.id)}
                            style={{
                              width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 1,
                              border: `1.5px solid ${item.done ? '#a78bfa' : 'var(--color-glass-border)'}`,
                              background: item.done ? '#a78bfa' : 'transparent',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            {item.done && <svg width="8" height="7" viewBox="0 0 8 7" fill="none"><path d="M1 3.5L3 5.5L7 1" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                          </button>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <span style={{ fontSize: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: item.type === 'task' ? '#a78bfa' : 'var(--color-brand)', padding: '1px 5px', borderRadius: 3, background: item.type === 'task' ? 'rgba(167,139,250,0.15)' : 'var(--color-active-bg)' }}>
                                {item.type === 'task' ? 'Task' : (item.evalType ?? 'eval').toUpperCase()}
                              </span>
                              {item.courseName && <span style={{ fontSize: 8, color: 'var(--color-text-faint)', truncate: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 80 }}>{item.courseName}</span>}
                            </div>
                            <p style={{ margin: '4px 0 0', fontSize: 11, fontWeight: 700, color: 'var(--color-text)', textDecoration: item.done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.title}
                            </p>
                            {item.note && <p style={{ margin: '2px 0 0', fontSize: 9, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.note}</p>}
                            {item.weightage != null && (
                              <p style={{ margin: '2px 0 0', fontSize: 9, color: 'var(--color-text-faint)', fontFamily: 'monospace' }}>{item.weightage}% weight</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteLocal(item.id)}
                          style={{ width: 20, height: 20, borderRadius: 5, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                          title="Delete"
                        >
                          <X style={{ width: 9, height: 9, color: '#f87171' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming deadlines */}
            <div className="p-6">
              <h3 className="text-[18px] font-extrabold tracking-[0.2em] uppercase text-[var(--color-text-faint)] mb-4">Upcoming</h3>
              {evals.slice(0, 5).map(e => {
                const days = Math.ceil((new Date(e.date).getTime() - Date.now()) / 86400000);
                return (
                  <div key={e.id} className="flex items-center justify-between py-3 border-b border-[var(--color-glass-border)] last:border-b-0">
                    <div>
                      <p className="text-[10px] font-bold text-[var(--color-text)] uppercase truncate max-w-35">{e.title}</p>
                      <p className="text-[9px] text-[var(--color-text-faint)] uppercase truncate max-w-35">{e.courseName}</p>
                    </div>
                    <span className="text-[9px] font-black font-mono">{days === 0 ? 'TODAY' : `${days}D`}</span>
                  </div>
                );
              })}
              {evals.length === 0 && <p className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase tracking-widest">No upcoming evaluations</p>}
            </div>
          </aside>
        </div>
      </main>

      {/* Quick-create modal */}
      {modal && (
        <QuickCreateModal
          date={modal}
          courses={courses}
          onClose={() => setModal(null)}
          onSave={handleSaveItem}
        />
      )}

      {/* Eval picker modal — shown on double-click when day already has evals */}
      {evalPickerDate && (
        <EvalPickerModal
          date={evalPickerDate}
          evals={evalPickerItems}
          onClose={() => setEvalPickerDate(null)}
          onAddNew={() => setModal(evalPickerDate)}
        />
      )}
    </div>
  );
}