import { useState } from 'react';
import Modal from './Modal';
import { createCourse } from '../../lib/api';

export default function AddCourseModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: any) => void }) {
  const [form, setForm] = useState({ name: '', credits: '', targetGrade: '50' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!form.name.trim()) return setError('Course name is required');
    setLoading(true);
    try {
      const { course } = await createCourse({ name: form.name.trim(), credits: form.credits ? parseInt(form.credits) : undefined, targetGrade: parseFloat(form.targetGrade) || 50 });
      onCreated(course); onClose();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const iCls = "w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none transition-colors";
  const iSty = { background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.09)' };
  const lCls = "block text-xs font-medium mb-1.5";
  const lSty = { color:'rgba(255,255,255,0.45)' };

  return (
    <Modal title="New Course" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div><label className={lCls} style={lSty}>Course Name *</label><input className={iCls} style={iSty} placeholder="e.g. Data Structures" value={form.name} onChange={set('name')} autoFocus /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={lCls} style={lSty}>Credits</label><input className={iCls} style={iSty} type="number" placeholder="4" min="1" max="10" value={form.credits} onChange={set('credits')} /></div>
          <div><label className={lCls} style={lSty}>Target Grade %</label><input className={iCls} style={iSty} type="number" placeholder="50" min="0" max="100" step="0.1" value={form.targetGrade} onChange={set('targetGrade')} /></div>
        </div>
        {error && <p className="text-xs" style={{ color:'#ef4444' }}>{error}</p>}
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-medium" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.5)' }}>Cancel</button>
          <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-40" style={{ background:'linear-gradient(135deg,#22c55e,#15803d)', color:'#000' }}>{loading ? 'Creating…' : 'Create Course'}</button>
        </div>
      </form>
    </Modal>
  );
}