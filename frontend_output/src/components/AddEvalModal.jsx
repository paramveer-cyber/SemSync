import { useState } from 'react';
import Modal from './Modal';
import { createEval } from '../lib/api';

const TYPES = ['quiz', 'midsem', 'endsem', 'assignment', 'lab', 'project', 'viva', 'other'];

const AddEvalModal = ({ courseId, onClose, onCreated }) => {
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    title: '', type: 'assignment', date: today,
    weightage: '', maxScore: '100', score: '',
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.title.trim())  return setError('Title is required');
    if (!form.weightage)     return setError('Weightage is required');
    if (!form.maxScore)      return setError('Max score is required');

    setLoading(true);
    try {
      const { evaluation } = await createEval(courseId, {
        title:     form.title.trim(),
        type:      form.type,
        date:      new Date(form.date).toISOString(),
        weightage: parseFloat(form.weightage),
        maxScore:  parseFloat(form.maxScore),
        score:     form.score !== '' ? parseFloat(form.score) : null,
      });
      onCreated(evaluation);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Add Evaluation" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
          <input className="input" placeholder="e.g. Quiz 1" value={form.title} onChange={set('title')} autoFocus />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type *</label>
            <select className="input" value={form.type} onChange={set('type')}>
              {TYPES.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
            <input className="input" type="date" value={form.date} onChange={set('date')} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Weightage % *</label>
            <input className="input" type="number" placeholder="20" min="0.1" max="100" step="0.1"
              value={form.weightage} onChange={set('weightage')} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Max Score *</label>
            <input className="input" type="number" placeholder="100" min="0.1" step="0.1"
              value={form.maxScore} onChange={set('maxScore')} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Score</label>
            <input className="input" type="number" placeholder="—" min="0" step="0.1"
              value={form.score} onChange={set('score')} />
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex gap-2 justify-end pt-1">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Adding…' : 'Add Evaluation'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddEvalModal;
