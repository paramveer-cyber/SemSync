import { useState, useEffect } from 'react';
import { createCourse, createEval } from '../../lib/api';
import { X, GraduationCap, AlertTriangle, Plus, Trash2, Download, ClipboardList } from 'lucide-react';

interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  coursework: { id: string; title: string; dueDate: string | null; maxPoints?: number; workType: string }[];
  gradedSubmissions: { courseWorkId: string; assignedGrade: number; updateTime: string }[];
}

interface WeightRow {
  id: string;
  type: string;
  label: string;
  weight: string;
  count: string;
  date: string;
}

const EVAL_TYPES = [
  { value: 'midsem', label: 'Mid Sem' },
  { value: 'endsem', label: 'End Sem' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'lab', label: 'Lab' },
  { value: 'project', label: 'Project' },
  { value: 'viva', label: 'Viva' },
  { value: 'other', label: 'Other' },
];

const SEG_COLORS: Record<string, string> = {
  midsem: '#3b82f6', endsem: '#8b5cf6', quiz: '#f59e0b',
  assignment: '#22c55e', lab: '#06b6d4', project: '#ec4899',
  viva: '#f97316', other: '#6b7280',
};

function uid() { return Math.random().toString(36).slice(2, 9); }

const field: React.CSSProperties = {
  background: 'var(--color-glass)',
  border: '1px solid var(--color-glass-border)',
  color: 'white',
  outline: 'none',
  borderRadius: 0,
};

export default function SyncCourseModal({
  course,
  onClose,
  onSynced,
  queueRemaining = 0,
}: {
  course: ClassroomCourse;
  onClose: () => void;
  onSynced: (c: any) => void;
  queueRemaining?: number;
}) {
  const [importMode, setImportMode] = useState<'grades' | 'manual'>('manual');
  const [targetGrade, setTargetGrade] = useState('50');
  const [credits, setCredits] = useState('');
  const [rows, setRows] = useState<WeightRow[]>([
    { id: uid(), type: 'midsem',     label: 'Mid Semester Exam', weight: '25', count: '1', date: '' },
    { id: uid(), type: 'endsem',     label: 'End Semester Exam', weight: '35', count: '1', date: '' },
    { id: uid(), type: 'assignment', label: 'Assignments',       weight: '20', count: '3', date: '' },
    { id: uid(), type: 'quiz',       label: 'Quizzes',           weight: '20', count: '4', date: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const totalWeight = rows.reduce((s, r) => s + (parseFloat(r.weight) || 0), 0);
  const weightOk = Math.abs(totalWeight - 100) < 0.01;

  const updateRow = (id: string, f: keyof WeightRow, value: string) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, [f]: value } : r));
  const addRow = () =>
    setRows(prev => [...prev, { id: uid(), type: 'other', label: '', weight: '', count: '1', date: '' }]);
  const removeRow = (id: string) =>
    setRows(prev => prev.filter(r => r.id !== id));

  const handleSync = async () => {
    setError('');
    if (importMode === 'manual' && !weightOk) {
      setError(`Weights total ${totalWeight.toFixed(1)}% — must equal exactly 100%`);
      return;
    }
    setLoading(true);
    try {
      const { course: created } = await createCourse({
        name: course.name,
        credits: credits ? parseInt(credits) : undefined,
        targetGrade: parseFloat(targetGrade) || 50,
      });

      if (importMode === 'grades') {
        const gradedCw = course.gradedSubmissions
          .map(sub => {
            const cw = course.coursework.find(c => c.id === sub.courseWorkId);
            return cw ? { cw, sub } : null;
          })
          .filter(Boolean) as { cw: typeof course.coursework[0]; sub: typeof course.gradedSubmissions[0] }[];

        if (gradedCw.length === 0) {
          await createEval(created.id, {
            title: 'Total Grade', type: 'other', weightage: 100,
            date: new Date().toISOString(),
          });
        } else {
          const perWeight = parseFloat((100 / gradedCw.length).toFixed(2));
          for (let i = 0; i < gradedCw.length; i++) {
            const { cw, sub } = gradedCw[i];
            const isLast = i === gradedCw.length - 1;
            const w = isLast ? parseFloat((100 - perWeight * (gradedCw.length - 1)).toFixed(2)) : perWeight;
            const maxScore = cw.maxPoints && cw.maxPoints > 0 ? cw.maxPoints : 100;
            await createEval(created.id, {
              title: cw.title,
              type: 'assignment',
              weightage: w,
              score: sub.assignedGrade,
              maxScore,
              date: cw.dueDate ? new Date(cw.dueDate).toISOString() : new Date().toISOString(),
            });
          }
        }
      } else {
        for (const row of rows) {
          const count = Math.max(1, parseInt(row.count) || 1);
          const perW = parseFloat((parseFloat(row.weight) / count).toFixed(4));
          const isoDate = row.date && row.date.trim()
            ? new Date(row.date.trim()).toISOString()
            : new Date().toISOString();
          for (let i = 0; i < count; i++) {
            await createEval(created.id, {
              title: count === 1 ? row.label : `${row.label} ${i + 1}`,
              type: row.type,
              weightage: i === count - 1
                ? parseFloat((parseFloat(row.weight) - perW * (count - 1)).toFixed(4))
                : perW,
              date: isoDate,
            });
          }
        }
      }

      onSynced(created);
      onClose();
    } catch (err: any) {
      const msg = err.message;
      setError(Array.isArray(msg) ? msg[0] : (msg ?? 'Failed to sync'));
    } finally {
      setLoading(false);
    }
  };

  const segments = rows.map(r => ({ type: r.type, pct: parseFloat(r.weight) || 0 }));
  const canSync = importMode === 'grades' || weightOk;

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}
    >
      <div style={{ width: '100%', maxWidth: 560, background: 'var(--color-surface-1)', border: '1px solid var(--color-glass-border)', borderRadius: 2, display: 'flex', flexDirection: 'column', maxHeight: '92vh' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px', borderBottom: '1px solid var(--color-glass-border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <GraduationCap style={{ width: 14, height: 14, color: 'var(--color-brand)', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--color-text-faint)', marginBottom: 2 }}>Sync to Dashboard</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 340 }}>{course.name}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {queueRemaining > 0 && (
              <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: 'var(--color-brand)', letterSpacing: '0.06em' }}>
                +{queueRemaining} queued
              </span>
            )}
            <button onClick={onClose} style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--color-glass-border)', cursor: 'pointer', color: 'var(--color-text-muted)', borderRadius: 2 }}>
              <X style={{ width: 11, height: 11 }} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 20px 4px' }}>

          {/* Credits + Target */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 9, fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 5 }}>Credits (optional)</label>
              <input type="number" min="0" max="20" placeholder="e.g. 4" value={credits} onChange={e => setCredits(e.target.value)}
                style={{ ...field, width: '100%', padding: '9px 12px', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 9, fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 5 }}>Target Grade %</label>
              <input type="number" min="0" max="100" placeholder="e.g. 75" value={targetGrade} onChange={e => setTargetGrade(e.target.value)}
                style={{ ...field, width: '100%', padding: '9px 12px', fontSize: 13 }} />
            </div>
          </div>

          {/* Mode toggle */}
          <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--color-text-faint)', marginBottom: 8 }}>How to set up grades?</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {([
              {
                key: 'manual' as const,
                icon: ClipboardList,
                title: 'Set up structure',
                desc: 'Define components like mid-sem, quizzes, assignments and fill scores as results arrive',
              },
              {
                key: 'grades' as const,
                icon: Download,
                title: 'Import my grades',
                desc: `Pull ${course.gradedSubmissions.length} graded submission${course.gradedSubmissions.length !== 1 ? 's' : ''} directly from Classroom`,
              },
            ]).map(opt => {
              const active = importMode === opt.key;
              return (
                <button key={opt.key} onClick={() => setImportMode(opt.key)} style={{
                  display: 'flex', flexDirection: 'column', gap: 7, padding: '13px', textAlign: 'left', cursor: 'pointer',
                  border: `1.5px solid ${active ? 'var(--color-brand)' : 'var(--color-glass-border)'}`,
                  background: active ? 'rgba(34,197,94,0.06)' : 'var(--color-glass)',
                  borderRadius: 0, transition: 'border-color 0.12s, background 0.12s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <opt.icon style={{ width: 13, height: 13, color: active ? 'var(--color-brand)' : 'var(--color-text-faint)', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 800, color: active ? 'var(--color-brand)' : 'var(--color-text)' }}>{opt.title}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{opt.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Manual structure */}
          {importMode === 'manual' && (
            <div style={{ marginBottom: 4 }}>
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Weight Distribution</span>
                  <span style={{ fontSize: 11, fontWeight: 900, fontFamily: 'monospace', color: weightOk ? 'var(--color-brand)' : totalWeight > 100 ? '#ef4444' : '#f59e0b' }}>
                    {totalWeight.toFixed(1)}% / 100%
                  </span>
                </div>
                <div style={{ height: 5, display: 'flex', overflow: 'hidden', background: 'var(--color-glass-border)', borderRadius: 3 }}>
                  {segments.map((seg, i) => (
                    <div key={i} style={{ height: '100%', width: `${Math.min(seg.pct, 100 - segments.slice(0, i).reduce((s, x) => s + x.pct, 0))}%`, background: SEG_COLORS[seg.type] ?? '#6b7280', transition: 'width 0.25s' }} />
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 60px 44px 90px 26px', gap: 5, marginBottom: 5 }}>
                {['Label', 'Type', 'Wt %', '#', 'Date', ''].map(h => (
                  <span key={h} style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-text-faint)' }}>{h}</span>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 210, overflowY: 'auto', marginBottom: 8 }}>
                {rows.map(row => (
                  <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 60px 44px 90px 26px', gap: 5, alignItems: 'center' }}>
                    <input style={{ ...field, padding: '6px 8px', fontSize: 12 }} placeholder="Label"
                      value={row.label} onChange={e => updateRow(row.id, 'label', e.target.value)} />
                    <select style={{ ...field, padding: '6px 4px', fontSize: 11, cursor: 'pointer' }}
                      value={row.type} onChange={e => updateRow(row.id, 'type', e.target.value)}>
                      {EVAL_TYPES.map(t => <option key={t.value} value={t.value} style={{ background: 'var(--color-surface-2)' }}>{t.label}</option>)}
                    </select>
                    <input type="number" min="0" max="100" step="0.5" placeholder="0"
                      style={{ ...field, padding: '6px 5px', fontSize: 12, textAlign: 'right', fontFamily: 'monospace' }}
                      value={row.weight} onChange={e => updateRow(row.id, 'weight', e.target.value)} />
                    <input type="number" min="1" max="20" placeholder="1"
                      style={{ ...field, padding: '6px 4px', fontSize: 12, textAlign: 'center', fontFamily: 'monospace' }}
                      value={row.count} onChange={e => updateRow(row.id, 'count', e.target.value)} />
                    <input type="date"
                      style={{ ...field, padding: '6px 4px', fontSize: 11, fontFamily: 'monospace', colorScheme: 'dark' }}
                      value={row.date} onChange={e => updateRow(row.id, 'date', e.target.value)} />
                    <button onClick={() => removeRow(row.id)}
                      style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: 'rgba(239,68,68,0.45)', cursor: 'pointer', borderRadius: 0 }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.14)'; (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.06)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(239,68,68,0.45)'; }}>
                      <Trash2 style={{ width: 11, height: 11 }} />
                    </button>
                  </div>
                ))}
              </div>

              <button onClick={addRow} style={{ width: '100%', padding: '7px', fontSize: 10, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', background: 'transparent', border: '1px dashed var(--color-glass-border)', color: 'var(--color-text-faint)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 0, marginBottom: 4 }}>
                <Plus style={{ width: 11, height: 11 }} /> Add Row
              </button>
            </div>
          )}

          {/* Grades preview */}
          {importMode === 'grades' && (
            <div style={{ marginBottom: 4, border: '1px solid var(--color-glass-border)', borderRadius: 0 }}>
              <div style={{ padding: '7px 12px', borderBottom: '1px solid var(--color-glass-border)', background: 'var(--color-glass)' }}>
                <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-text-faint)' }}>
                  {course.gradedSubmissions.length > 0 ? `${course.gradedSubmissions.length} submission${course.gradedSubmissions.length !== 1 ? 's' : ''} to import` : 'No graded submissions yet'}
                </span>
              </div>
              {course.gradedSubmissions.length > 0 ? (
                <div style={{ maxHeight: 150, overflowY: 'auto' }}>
                  {course.gradedSubmissions.slice(0, 8).map(sub => {
                    const cw = course.coursework.find(c => c.id === sub.courseWorkId);
                    const pct = cw?.maxPoints ? Math.round((sub.assignedGrade / cw.maxPoints) * 100) : null;
                    const col = pct == null ? '#f59e0b' : pct >= 70 ? 'var(--color-brand)' : pct >= 50 ? '#f59e0b' : '#ef4444';
                    return (
                      <div key={sub.courseWorkId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', borderBottom: '1px solid var(--color-glass-border)' }}>
                        <span style={{ fontSize: 12, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 290 }}>{cw?.title ?? 'Assignment'}</span>
                        <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: col, flexShrink: 0, marginLeft: 12 }}>
                          {sub.assignedGrade}{cw?.maxPoints ? `/${cw.maxPoints}` : ''}
                        </span>
                      </div>
                    );
                  })}
                  {course.gradedSubmissions.length > 8 && (
                    <div style={{ padding: '6px 12px', fontSize: 10, color: 'var(--color-text-faint)' }}>+{course.gradedSubmissions.length - 8} more</div>
                  )}
                </div>
              ) : (
                <div style={{ padding: '12px', fontSize: 12, color: 'var(--color-text-muted)' }}>
                  A placeholder evaluation will be created and you can fill it in later.
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)', marginBottom: 4, marginTop: 12 }}>
              <AlertTriangle style={{ width: 12, height: 12, color: '#ef4444', flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444' }}>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 8, padding: '14px 20px 18px', flexShrink: 0, borderTop: '1px solid var(--color-glass-border)' }}>
          <button onClick={onClose} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', background: 'transparent', border: '1px solid var(--color-glass-border)', color: 'var(--color-text-muted)', cursor: 'pointer', borderRadius: 0 }}>
            Cancel
          </button>
          <button
            onClick={handleSync}
            disabled={loading || !canSync}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px', fontSize: 12, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', background: canSync && !loading ? 'var(--color-active-bg)' : 'transparent', border: `1px solid ${canSync && !loading ? 'var(--color-brand)' : 'var(--color-glass-border)'}`, color: canSync && !loading ? 'var(--color-brand)' : 'var(--color-text-faint)', cursor: loading || !canSync ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, borderRadius: 0, transition: 'all 0.12s' }}
          >
            {loading ? (
              <>
                <span style={{ width: 11, height: 11, borderRadius: '50%', border: '1.5px solid transparent', borderTopColor: 'var(--color-brand)', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                Syncing…
              </>
            ) : (
              <>
                <GraduationCap style={{ width: 13, height: 13 }} />
                {queueRemaining > 0 ? `Sync & Next (${queueRemaining} left)` : 'Sync to Dashboard'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}