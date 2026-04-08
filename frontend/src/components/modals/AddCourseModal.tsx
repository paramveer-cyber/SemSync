import { useState } from 'react';
import { createCourse, createEval } from '../../lib/api';
import { Plus, Trash2, ChevronRight, ChevronLeft, AlertTriangle } from 'lucide-react';
import { X } from 'lucide-react';
import { useEffect } from 'react';

/* ── Types ── */
interface StructureRow {
  id: string;
  type: string;
  label: string;
  weight: string;
  count: string; // how many instances, e.g. "3 quizzes"
}

const EVAL_TYPES = [
  { value: 'midsem',     label: 'Mid Semester' },
  { value: 'endsem',     label: 'End Semester' },
  { value: 'quiz',       label: 'Quiz'         },
  { value: 'assignment', label: 'Assignment'   },
  { value: 'lab',        label: 'Lab'          },
  { value: 'project',    label: 'Project'      },
  { value: 'viva',       label: 'Viva'         },
  { value: 'other',      label: 'Other'        },
];

function uid() { return Math.random().toString(36).slice(2, 9); }

/* ── Shared styles (matches app theme) ── */
const fieldStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)',
  color: 'white',
};
const inputCls = 'w-full px-4 py-3 text-sm placeholder:text-white/25 focus:outline-none transition-colors bg-transparent';
const labelCls = 'block text-[10px] font-black tracking-[0.25em] uppercase mb-2';
const labelStyle = { color: 'rgba(255,255,255,0.4)' };

export default function AddCourseModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (c: any) => void;
}) {
  /* ── Step 1: basic info ── */
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({ name: '', credits: '', targetGrade: '50' });
  const [step1Error, setStep1Error] = useState('');
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  /* ── Step 2: course structure ── */
  const [rows, setRows] = useState<StructureRow[]>([
    { id: uid(), type: 'midsem',     label: 'Mid Semester Exam', weight: '25', count: '1' },
    { id: uid(), type: 'endsem',     label: 'End Semester Exam', weight: '35', count: '1' },
    { id: uid(), type: 'assignment', label: 'Assignments',       weight: '20', count: '3' },
    { id: uid(), type: 'quiz',       label: 'Quizzes',           weight: '20', count: '4' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* Escape key */
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  /* ── Computed total weight ── */
  const totalWeight = rows.reduce((s, r) => s + (parseFloat(r.weight) || 0), 0);
  const weightOk    = Math.abs(totalWeight - 100) < 0.01;

  /* ── Row helpers ── */
  const updateRow = (id: string, field: keyof StructureRow, value: string) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  const addRow = () =>
    setRows(prev => [...prev, { id: uid(), type: 'other', label: '', weight: '', count: '1' }]);
  const removeRow = (id: string) =>
    setRows(prev => prev.filter(r => r.id !== id));

  /* ── Step 1 → 2 ── */
  const goToStep2 = () => {
    if (!form.name.trim()) { setStep1Error('Course name is required'); return; }
    setStep1Error('');
    setStep(2);
  };

  /* ── Final submit ── */
  const handleSubmit = async () => {
    setError('');
    if (!weightOk) { setError('Total weight must equal exactly 100%'); return; }
    setLoading(true);
    try {
      /* 1. Create the course */
      const { course } = await createCourse({
        name:        form.name.trim(),
        credits:     form.credits ? parseInt(form.credits) : undefined,
        targetGrade: parseFloat(form.targetGrade) || 50,
      });

      /* 2. Create evaluations from structure rows */
      const today = new Date().toISOString();
      const evalPromises: Promise<any>[] = [];

      for (const row of rows) {
        const count   = Math.max(1, parseInt(row.count) || 1);
        const weight  = parseFloat(row.weight) || 0;
        const perEval = parseFloat((weight / count).toFixed(2));

        for (let i = 1; i <= count; i++) {
          const title = count === 1 ? row.label.trim() || EVAL_TYPES.find(t => t.value === row.type)?.label || row.type
                                    : `${row.label.trim() || EVAL_TYPES.find(t => t.value === row.type)?.label || row.type} ${i}`;
          evalPromises.push(
            createEval(course.id, {
              title,
              type:      row.type,
              date:      today,
              weightage: perEval,
              maxScore:  100,
              score:     null,
            })
          );
        }
      }

      await Promise.all(evalPromises);
      onCreated(course);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Weight bar segments ── */
  const segments = rows.map(r => ({
    pct:   Math.min(100, parseFloat(r.weight) || 0),
    type:  r.type,
    label: r.label || r.type,
  }));

  const SEG_COLORS: Record<string, string> = {
    midsem: '#f59e0b', endsem: '#ef4444', quiz: '#22c55e',
    assignment: '#3b82f6', lab: '#8b5cf6', project: '#06b6d4',
    viva: '#ec4899', other: '#6b7280',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div
        className="w-full overflow-hidden"
        style={{
          maxWidth: step === 2 ? '680px' : '480px',
          background: '#0a0a0f',
          border: '1px solid rgba(255,255,255,0.1)',
          transition: 'max-width 0.25s ease',
        }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-8 py-6"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <span className="text-[10px] font-black tracking-[0.3em] uppercase block mb-1" style={{ color: '#22c55e' }}>
              // NEW_COURSE_NODE
            </span>
            <h3 className="text-xl font-extrabold tracking-tighter uppercase text-white">
              {step === 1 ? 'Course Info' : 'Course Structure'}
            </h3>
          </div>
          <div className="flex items-center gap-4">
            {/* Step indicators */}
            <div className="flex items-center gap-2">
              {[1, 2].map(s => (
                <div key={s} className="flex items-center gap-2">
                  <div className="w-6 h-6 flex items-center justify-center text-[10px] font-black"
                    style={{
                      border: `1px solid ${step >= s ? '#22c55e' : 'rgba(255,255,255,0.15)'}`,
                      color: step >= s ? '#22c55e' : 'rgba(255,255,255,0.3)',
                      background: step === s ? 'rgba(34,197,94,0.1)' : 'transparent',
                    }}>
                    {s}
                  </div>
                  {s < 2 && <div className="w-4 h-px" style={{ background: step > s ? '#22c55e' : 'rgba(255,255,255,0.12)' }} />}
                </div>
              ))}
            </div>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center cursor-pointer transition-all duration-150"
              style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'white'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)'; }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ══════════════════ STEP 1 ══════════════════ */}
        {step === 1 && (
          <div className="p-8 space-y-5">
            <div>
              <label className={labelCls} style={labelStyle}>Course Name *</label>
              <input autoFocus className={inputCls} style={fieldStyle}
                placeholder="e.g. Data Structures & Algorithms"
                value={form.name} onChange={set('name')}
                onKeyDown={e => { if (e.key === 'Enter') goToStep2(); }} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls} style={labelStyle}>Credits</label>
                <input className={inputCls} style={fieldStyle}
                  type="number" placeholder="4" min="1" max="10"
                  value={form.credits} onChange={set('credits')} />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>Target Grade %</label>
                <input className={inputCls} style={fieldStyle}
                  type="number" placeholder="50" min="0" max="100" step="0.1"
                  value={form.targetGrade} onChange={set('targetGrade')} />
              </div>
            </div>

            {step1Error && (
              <div className="flex items-center gap-2 px-4 py-3"
                style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="text-[11px] font-bold text-red-400 uppercase tracking-widest">{step1Error}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={onClose}
                className="flex-1 py-3 text-sm font-black tracking-widest uppercase cursor-pointer transition-all duration-150"
                style={{ background: 'transparent', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.1)' }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.25)'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'}>
                Cancel
              </button>
              <button onClick={goToStep2}
                className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-black tracking-widest uppercase cursor-pointer transition-all duration-150"
                style={{ border: '1px solid #22c55e', color: '#22c55e', background: 'rgba(34,197,94,0.08)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#22c55e'; (e.currentTarget as HTMLButtonElement).style.color = '#000'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 18px rgba(34,197,94,0.35)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.08)'; (e.currentTarget as HTMLButtonElement).style.color = '#22c55e'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}>
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════ STEP 2 ══════════════════ */}
        {step === 2 && (
          <div className="p-8">

            {/* Course name recap */}
            <div className="flex items-center justify-between mb-6 pb-5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <p className="text-[9px] font-black tracking-[0.3em] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Configuring</p>
                <p className="text-base font-extrabold tracking-tight uppercase text-white">{form.name}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black tracking-widest uppercase mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Target</p>
                <p className="text-base font-extrabold font-mono text-white">{form.targetGrade}%</p>
              </div>
            </div>

            {/* Weight bar */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black tracking-[0.25em] uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Weight Distribution
                </span>
                <span className="text-[11px] font-black font-mono"
                  style={{ color: weightOk ? '#22c55e' : totalWeight > 100 ? '#ef4444' : '#f59e0b' }}>
                  {totalWeight.toFixed(1)}% / 100%
                </span>
              </div>
              <div className="h-2 w-full flex overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                {segments.map((seg, i) => (
                  <div key={i} className="h-full transition-all duration-300"
                    style={{ width: `${Math.min(seg.pct, 100 - segments.slice(0, i).reduce((s, x) => s + x.pct, 0))}%`, background: SEG_COLORS[seg.type] ?? '#6b7280' }} />
                ))}
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                {rows.filter(r => parseFloat(r.weight) > 0).map(r => (
                  <div key={r.id} className="flex items-center gap-1.5">
                    <div className="w-2 h-2" style={{ background: SEG_COLORS[r.type] ?? '#6b7280' }} />
                    <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {r.label || r.type} {r.weight}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Column headers */}
            <div className="grid gap-3 mt-5 mb-2" style={{ gridTemplateColumns: '1fr 140px 80px 64px 32px' }}>
              {['Label', 'Type', 'Weight %', 'Count', ''].map(h => (
                <span key={h} className="text-[9px] font-black tracking-[0.2em] uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>{h}</span>
              ))}
            </div>

            {/* Rows */}
            <div className="space-y-2 mb-4" style={{ maxHeight: '240px', overflowY: 'auto' }}>
              {rows.map(row => (
                <div key={row.id} className="grid gap-3 items-center" style={{ gridTemplateColumns: '1fr 140px 80px 64px 32px' }}>
                  {/* Label */}
                  <input
                    className="w-full px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none transition-colors"
                    style={fieldStyle}
                    placeholder="e.g. Midsem Exam"
                    value={row.label}
                    onChange={e => updateRow(row.id, 'label', e.target.value)}
                  />
                  {/* Type */}
                  <select
                    className="w-full px-3 py-2 text-sm text-white focus:outline-none cursor-pointer"
                    style={fieldStyle}
                    value={row.type}
                    onChange={e => updateRow(row.id, 'type', e.target.value)}>
                    {EVAL_TYPES.map(t => (
                      <option key={t.value} value={t.value} className="bg-zinc-900">{t.label}</option>
                    ))}
                  </select>
                  {/* Weight */}
                  <input
                    className="w-full px-3 py-2 text-sm text-white text-right focus:outline-none transition-colors font-mono"
                    style={fieldStyle}
                    type="number" min="0" max="100" step="0.5"
                    placeholder="0"
                    value={row.weight}
                    onChange={e => updateRow(row.id, 'weight', e.target.value)}
                  />
                  {/* Count */}
                  <input
                    className="w-full px-3 py-2 text-sm text-white text-center focus:outline-none transition-colors font-mono"
                    style={fieldStyle}
                    type="number" min="1" max="20" step="1"
                    placeholder="1"
                    value={row.count}
                    onChange={e => updateRow(row.id, 'count', e.target.value)}
                  />
                  {/* Remove */}
                  <button
                    onClick={() => removeRow(row.id)}
                    className="w-8 h-8 flex items-center justify-center cursor-pointer transition-all duration-150"
                    style={{ color: 'rgba(239,68,68,0.5)', border: '1px solid rgba(239,68,68,0.15)', background: 'rgba(239,68,68,0.06)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.15)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(239,68,68,0.5)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.06)'; }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add row */}
            <button
              onClick={addRow}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-black tracking-widest uppercase cursor-pointer transition-all duration-150 mb-6 w-full justify-center"
              style={{ border: '1px dashed rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.35)', background: 'transparent' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.3)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.6)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.15)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.35)'; }}>
              <Plus className="w-3.5 h-3.5" /> Add Component
            </button>

            {/* Skip hint */}
            <p className="text-[9px] font-mono text-center mb-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Structure is optional — you can add evaluations manually later.
            </p>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 mb-4"
                style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="text-[11px] font-bold text-red-400 uppercase tracking-widest">{error}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)}
                className="flex items-center gap-2 px-6 py-3 text-sm font-black tracking-widest uppercase cursor-pointer transition-all duration-150"
                style={{ background: 'transparent', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.1)' }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.25)'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'}>
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              {/* Skip structure */}
              <button
                onClick={async () => {
                  setError(''); setLoading(true);
                  try {
                    const { course } = await createCourse({ name: form.name.trim(), credits: form.credits ? parseInt(form.credits) : undefined, targetGrade: parseFloat(form.targetGrade) || 50 });
                    onCreated(course); onClose();
                  } catch (err: any) { setError(err.message); } finally { setLoading(false); }
                }}
                disabled={loading}
                className="px-6 py-3 text-sm font-black tracking-widest uppercase cursor-pointer transition-all duration-150 disabled:opacity-40"
                style={{ background: 'transparent', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.1)' }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.25)'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'}>
                Skip
              </button>

              <button
                onClick={handleSubmit}
                disabled={loading || !weightOk}
                className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-black tracking-widest uppercase cursor-pointer transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ border: '1px solid #22c55e', color: '#22c55e', background: 'rgba(34,197,94,0.08)' }}
                onMouseEnter={e => { if (!loading && weightOk) { (e.currentTarget as HTMLButtonElement).style.background = '#22c55e'; (e.currentTarget as HTMLButtonElement).style.color = '#000'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 18px rgba(34,197,94,0.35)'; } }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.08)'; (e.currentTarget as HTMLButtonElement).style.color = '#22c55e'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}>
                {loading ? 'Creating…' : <><Plus className="w-4 h-4" /> Initialize Course</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
