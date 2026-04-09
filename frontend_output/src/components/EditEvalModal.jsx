import { useState } from 'react';
import Modal from './Modal';
import { updateEval } from '../lib/api';

const TYPES = ['quiz', 'midsem', 'endsem', 'assignment', 'lab', 'project', 'viva', 'other'];

const EditEvalModal = ({ evaluation, onClose, onUpdated }) => {
  const [form, setForm] = useState({
    title:     evaluation.title,
    type:      evaluation.type,
    date:      evaluation.date?.slice(0, 10) ?? '',
    weightage: String(evaluation.weightage),
    maxScore:  String(evaluation.maxScore),
    score:     evaluation.score !== null && evaluation.score !== undefined ? String(evaluation.score) : '',
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    setLoading(true);
    try {
      const payload = {
        title:     form.title.trim(),
        type:      form.type,
        date:      new Date(form.date).toISOString(),
        weightage: parseFloat(form.weightage),
        maxScore:  parseFloat(form.maxScore),
        score:     form.score !== '' ? parseFloat(form.score) : null,
      };
      const { evaluation: updated } = await updateEval(evaluation.id, payload);
      onUpdated(updated);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Edit Evaluation" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
          <input className="input" value={form.title} onChange={set('title')} autoFocus />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
            <select className="input" value={form.type} onChange={set('type')}>
              {TYPES.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
            <input className="input" type="date" value={form.date} onChange={set('date')} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Weightage %</label>
            <input className="input" type="number" min="0.1" max="100" step="0.1"
              value={form.weightage} onChange={set('weightage')} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Max Score</label>
            <input className="input" type="number" min="0.1" step="0.1"
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
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditEvalModal;
