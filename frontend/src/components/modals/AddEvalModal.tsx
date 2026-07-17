import { useState } from 'react';
import Modal from './Modal';
import { createEval } from '../../lib/api';
import { Plus } from 'lucide-react';

const TYPES = [
    'quiz',
    'midsem',
    'endsem',
    'assignment',
    'lab',
    'project',
    'viva',
    'other',
];

export default function AddEvalModal({
    courseId,
    onClose,
    onCreated,
    existingWeight = 0,
}: {
    courseId: string;
    onClose: () => void;
    onCreated: (e: any) => void;
    existingWeight?: number;
}) {
    const today = new Date().toISOString().slice(0, 10);
    const [form, setForm] = useState({
        title: '',
        type: 'assignment',
        date: today,
        weightage: '',
        maxScore: '100',
        score: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const set =
        (k: string) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
            setForm((f) => ({ ...f, [k]: e.target.value }));

    const r1 = (n: number) => Math.round(n * 10) / 10;
    const remainingWeight = r1(100 - r1(existingWeight));

    const handleSubmit = async (
        e: React.FormEvent,
        requestClose: () => void,
    ) => {
        e.preventDefault();
        setError('');
        if (!form.title.trim()) return setError('Title is required');
        if (!form.weightage) return setError('Weightage is required');
        const newWeight = parseFloat(form.weightage);
        if (isNaN(newWeight) || newWeight <= 0)
            return setError('Weightage must be greater than 0');
        if (r1(newWeight) > remainingWeight)
            return setError(
                `Weightage exceeds available weight. You can add at most ${remainingWeight}% more.`,
            );
        const score = form.score !== '' ? parseFloat(form.score) : null;
        const maxScore = parseFloat(form.maxScore);
        if (score !== null && score > maxScore)
            return setError('Score cannot exceed Max Score');
        setLoading(true);
        try {
            const { evaluation } = await createEval(courseId, {
                title: form.title.trim(),
                type: form.type,
                date: new Date(form.date).toISOString(),
                weightage: parseFloat(form.weightage),
                maxScore: parseFloat(form.maxScore),
                score: form.score !== '' ? parseFloat(form.score) : null,
            });
            onCreated(evaluation);
            requestClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const iCls =
        'w-full px-4 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text)]/25 focus:outline-none focus-ring transition-colors duration-150';
    const iSty = {
        background: 'var(--color-glass)',
        border: '1px solid var(--color-glass-border)',
    };
    const lCls = 'block text-xs font-medium mb-1.5';
    const lSty = { color: 'var(--color-text-muted)' };

    return (
        <Modal title='Add Evaluation' onClose={onClose}>
            {(requestClose) => (
                <form
                    onSubmit={(e) => handleSubmit(e, requestClose)}
                    className='space-y-4'
                >
                    <div>
                        <label
                            htmlFor='eval-title'
                            className={lCls}
                            style={lSty}
                        >
                            Title *
                        </label>
                        <input
                            id='eval-title'
                            className={iCls}
                            style={iSty}
                            placeholder='e.g. Midsem Exam'
                            value={form.title}
                            onChange={set('title')}
                            autoFocus
                        />
                    </div>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                        <div>
                            <label
                                htmlFor='eval-type'
                                className={lCls}
                                style={lSty}
                            >
                                Type
                            </label>
                            <select
                                id='eval-type'
                                className={iCls}
                                style={{ ...iSty, cursor: 'pointer' }}
                                value={form.type}
                                onChange={set('type')}
                            >
                                {TYPES.map((t) => (
                                    <option
                                        key={t}
                                        value={t}
                                        className='bg-[var(--color-surface-2)]'
                                    >
                                        {t.toUpperCase()}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label
                                htmlFor='eval-date'
                                className={lCls}
                                style={lSty}
                            >
                                Date
                            </label>
                            <input
                                id='eval-date'
                                className={iCls}
                                style={iSty}
                                type='date'
                                value={form.date}
                                onChange={set('date')}
                            />
                        </div>
                    </div>
                    <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                        <div>
                            <label
                                htmlFor='eval-weight'
                                className={lCls}
                                style={lSty}
                            >
                                Weight %{' '}
                                <span
                                    style={{
                                        color:
                                            remainingWeight <= 10
                                                ? 'var(--color-danger)'
                                                : 'var(--color-text-faint)',
                                        fontWeight: 'normal',
                                    }}
                                >
                                    ({remainingWeight}% left)
                                </span>
                            </label>
                            <input
                                id='eval-weight'
                                className={iCls}
                                style={iSty}
                                type='number'
                                placeholder='20'
                                min='0.1'
                                max={remainingWeight}
                                step='0.1'
                                value={form.weightage}
                                onChange={set('weightage')}
                            />
                        </div>
                        <div>
                            <label
                                htmlFor='eval-max-score'
                                className={lCls}
                                style={lSty}
                            >
                                Max Score
                            </label>
                            <input
                                id='eval-max-score'
                                className={iCls}
                                style={iSty}
                                type='number'
                                placeholder='100'
                                min='0.1'
                                step='0.1'
                                value={form.maxScore}
                                onChange={set('maxScore')}
                            />
                        </div>
                        <div>
                            <label
                                htmlFor='eval-score'
                                className={lCls}
                                style={lSty}
                            >
                                Score
                            </label>
                            <input
                                id='eval-score'
                                className={iCls}
                                style={iSty}
                                type='number'
                                placeholder='—'
                                min='0'
                                step='0.1'
                                value={form.score}
                                onChange={set('score')}
                            />
                        </div>
                    </div>

                    {error && (
                        <p
                            className='text-xs font-semibold'
                            style={{ color: 'var(--color-danger)' }}
                        >
                            {error}
                        </p>
                    )}

                    <div className='flex gap-3 pt-1'>
                        {/* Cancel — neutral ghost */}
                        <button
                            type='button'
                            onClick={requestClose}
                            className='flex-1 py-3 text-sm font-semibold cursor-pointer transition-all duration-150'
                            style={{
                                background: 'var(--color-glass-border)',
                                border: '1px solid var(--color-glass-border)',
                                color: 'var(--color-text-muted)',
                            }}
                            onMouseEnter={(e) => {
                                (
                                    e.currentTarget as HTMLButtonElement
                                ).style.background =
                                    'var(--color-glass-border)';
                                (
                                    e.currentTarget as HTMLButtonElement
                                ).style.color = 'var(--color-text)';
                            }}
                            onMouseLeave={(e) => {
                                (
                                    e.currentTarget as HTMLButtonElement
                                ).style.background =
                                    'var(--color-glass-border)';
                                (
                                    e.currentTarget as HTMLButtonElement
                                ).style.color = 'var(--color-text-muted)';
                            }}
                        >
                            Cancel
                        </button>

                        {/* Submit — Joy → green */}
                        <button
                            type='submit'
                            disabled={loading}
                            className='flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold uppercase tracking-widest cursor-pointer transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed'
                            style={{
                                background: 'var(--color-brand)',
                                border: '1px solid var(--color-brand)',
                                color: 'var(--color-surface)',
                            }}
                            onMouseEnter={(e) => {
                                if (!loading)
                                    (
                                        e.currentTarget as HTMLButtonElement
                                    ).style.background =
                                        'var(--color-brand-dim)';
                            }}
                            onMouseLeave={(e) => {
                                (
                                    e.currentTarget as HTMLButtonElement
                                ).style.background = 'var(--color-brand)';
                            }}
                        >
                            {loading ? (
                                'Adding…'
                            ) : (
                                <>
                                    <Plus className='w-4 h-4' /> Add Evaluation
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
}
