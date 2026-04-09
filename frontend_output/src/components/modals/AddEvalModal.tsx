import { useState } from 'react';
import Modal from './Modal';
import { createEval } from '../../lib/api';
import { Plus } from 'lucide-react';

const TYPES = ['quiz','midsem','endsem','assignment','lab','project','viva','other'];

export default function AddEvalModal({ courseId, onClose, onCreated }: { courseId: string; onClose: () => void; onCreated: (e: any) => void }) {
  const today = new Date().toISOString().slice(0,10);
  const [form, setForm] = useState({ title:'', type:'assignment', date:today, weightage:'', maxScore:'100', score:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!form.title.trim()) return setError('Title is required');
    if (!form.weightage)    return setError('Weightage is required');
    setLoading(true);
    try {
      const { evaluation } = await createEval(courseId, {
        title: form.title.trim(), type: form.type,
        date: new Date(form.date).toISOString(),
        weightage: parseFloat(form.weightage),
        maxScore: parseFloat(form.maxScore),
        score: form.score !== '' ? parseFloat(form.score) : null,
      });
      onCreated(evaluation); onClose();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const iCls = "w-full px-4 py-2.5 rounded-xl text-sm text-[var(--color-text)] placeholder:text-[var(--color-text)]/25 focus:outline-none transition-colors duration-150";
  const iSty = { background: 'var(--color-glass-border)', border: '1px solid var(--color-glass-border)' };
  const lCls = "block text-xs font-medium mb-1.5";
  const lSty = { color: 'var(--color-text-muted)' };

  return (
    <Modal title="Add Evaluation" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={lCls} style={lSty}>Title *</label>
          <input className={iCls} style={iSty} placeholder="e.g. Midsem Exam" value={form.title} onChange={set('title')} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lCls} style={lSty}>Type</label>
            <select className={iCls} style={{ ...iSty, background: 'var(--color-glass-border)', cursor: 'pointer' }} value={form.type} onChange={set('type')}>
              {TYPES.map(t => <option key={t} value={t} className="bg-[var(--color-surface-2)]">{t.toUpperCase()}</option>)}
            </select>
          </div>
          <div>
            <label className={lCls} style={lSty}>Date</label>
            <input className={iCls} style={iSty} type="date" value={form.date} onChange={set('date')} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={lCls} style={lSty}>Weight %</label>
            <input className={iCls} style={iSty} type="number" placeholder="20" min="0.1" max="100" step="0.1" value={form.weightage} onChange={set('weightage')} />
          </div>
          <div>
            <label className={lCls} style={lSty}>Max Score</label>
            <input className={iCls} style={iSty} type="number" placeholder="100" min="0.1" step="0.1" value={form.maxScore} onChange={set('maxScore')} />
          </div>
          <div>
            <label className={lCls} style={lSty}>Score</label>
            <input className={iCls} style={iSty} type="number" placeholder="—" min="0" step="0.1" value={form.score} onChange={set('score')} />
          </div>
        </div>

        {error && <p className="text-xs font-semibold" style={{ color: '#ef4444' }}>{error}</p>}

        <div className="flex gap-3 pt-1">
          {/* Cancel — neutral ghost */}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-150"
            style={{ background: 'var(--color-glass-border)', border: '1px solid var(--color-glass-border)', color: 'var(--color-text-muted)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-glass-border)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-glass-border)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)';
            }}>
            Cancel
          </button>

          {/* Submit — Joy → green */}
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold cursor-pointer transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg,var(--color-brand),#16a34a)', color: '#000', boxShadow: '0 4px 16px rgba(34,197,94,0.28)' }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 22px rgba(34,197,94,0.48)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(34,197,94,0.28)'; }}>
            {loading ? 'Adding…' : <><Plus className="w-4 h-4" /> Add Evaluation</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}
