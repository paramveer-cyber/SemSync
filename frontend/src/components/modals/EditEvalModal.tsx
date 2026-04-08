import { useState } from 'react';
import Modal from './Modal';
import { updateEval } from '../../lib/api';
import { Save } from 'lucide-react';

const TYPES = ['quiz','midsem','endsem','assignment','lab','project','viva','other'];

export default function EditEvalModal({ evaluation, onClose, onUpdated }: { evaluation: any; onClose: () => void; onUpdated: () => void }) {
  const [form, setForm] = useState({
    title:     evaluation.title,
    type:      evaluation.type,
    date:      evaluation.date?.slice(0,10) ?? '',
    weightage: String(evaluation.weightage),
    maxScore:  String(evaluation.maxScore),
    score:     evaluation.score != null ? String(evaluation.score) : '',
  });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await updateEval(evaluation.id, {
        title:     form.title.trim(),
        type:      form.type,
        date:      new Date(form.date).toISOString(),
        weightage: parseFloat(form.weightage),
        maxScore:  parseFloat(form.maxScore),
        score:     form.score !== '' ? parseFloat(form.score) : null,
      });
      onUpdated(); onClose();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const iCls = "w-full px-4 py-2.5 rounded-xl text-sm text-white focus:outline-none transition-colors duration-150";
  const iSty = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' };
  const lCls = "block text-xs font-medium mb-1.5";
  const lSty = { color: 'rgba(255,255,255,0.45)' };

  return (
    <Modal title="Edit Evaluation" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={lCls} style={lSty}>Title</label>
          <input className={iCls} style={iSty} value={form.title} onChange={set('title')} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lCls} style={lSty}>Type</label>
            <select className={iCls} style={{ ...iSty, background: 'rgba(255,255,255,0.06)', cursor: 'pointer' }} value={form.type} onChange={set('type')}>
              {TYPES.map(t => <option key={t} value={t} className="bg-zinc-900">{t.toUpperCase()}</option>)}
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
            <input className={iCls} style={iSty} type="number" min="0.1" max="100" step="0.1" value={form.weightage} onChange={set('weightage')} />
          </div>
          <div>
            <label className={lCls} style={lSty}>Max Score</label>
            <input className={iCls} style={iSty} type="number" min="0.1" step="0.1" value={form.maxScore} onChange={set('maxScore')} />
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
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.10)';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.85)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)';
            }}>
            Cancel
          </button>

          {/* Save — Trust → blue */}
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold cursor-pointer transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: '#fff', boxShadow: '0 4px 16px rgba(59,130,246,0.28)' }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 22px rgba(59,130,246,0.48)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(59,130,246,0.28)'; }}>
            {loading ? 'Saving…' : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}
