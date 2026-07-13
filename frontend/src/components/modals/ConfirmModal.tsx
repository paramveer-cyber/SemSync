import { useState } from 'react';
import type { ReactNode } from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

type ConfirmVariant = 'delete' | 'archive';

function ScatterMarks({ accent }: { accent: string }) {
    return (
        <div
            className='absolute inset-0 pointer-events-none overflow-hidden'
            aria-hidden='true'
        >
            <div
                style={{
                    position: 'absolute',
                    top: '0.375rem',
                    right: '2.125rem',
                    width: '0.3125rem',
                    height: '0.3125rem',
                    background: accent,
                    opacity: 0.5,
                    transform: 'rotate(12deg)',
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    bottom: '0.5625rem',
                    right: '1rem',
                    width: '0.1875rem',
                    height: '0.1875rem',
                    background: accent,
                    opacity: 0.3,
                    transform: 'rotate(-6deg)',
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    top: '0.875rem',
                    right: '0.75rem',
                    width: '0.125rem',
                    height: '0.125rem',
                    background: accent,
                    opacity: 0.7,
                }}
            />
        </div>
    );
}

export default function ConfirmModal({
    title,
    message,
    confirmLabel,
    cancelLabel = 'Cancel',
    variant = 'delete',
    onConfirm,
    onClose,
}: {
    title: string;
    message: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: ConfirmVariant;
    onConfirm: () => void | Promise<void>;
    onClose: () => void;
}) {
    const [acknowledged, setAcknowledged] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const isArchive = variant === 'archive';
    const accent = isArchive ? 'var(--color-warn)' : 'var(--color-danger)';

    const canConfirm = !submitting && (!isArchive || acknowledged);

    const handleConfirm = async (requestClose: () => void) => {
        if (!canConfirm) return;
        setSubmitting(true);
        try {
            await onConfirm();
            requestClose();
        } catch {
            setSubmitting(false);
        }
    };

    return (
        <Modal title={title} onClose={onClose} calm>
            {(requestClose) => (
                <div className='space-y-5'>
                    <div
                        className='relative flex items-center gap-3 px-5 py-4 rounded-none'
                        style={{
                            border: `1px solid ${accent}`,
                            background: 'var(--color-glass)',
                        }}
                    >
                        <ScatterMarks accent={accent} />
                        <div
                            className='w-1.5 h-1.5 shrink-0 animate-pulse'
                            style={{ background: accent }}
                        />
                        <AlertTriangle
                            className='w-4 h-4 shrink-0'
                            style={{ color: accent }}
                        />
                        <p
                            className='relative text-sm leading-relaxed break-words'
                            style={{ color: 'var(--color-text)' }}
                        >
                            {message}
                        </p>
                    </div>

                    {isArchive && (
                        <label
                            className='flex items-center gap-2.5 px-5 py-3.5 cursor-pointer select-none rounded-none'
                            style={{ border: `1px solid ${accent}` }}
                        >
                            <input
                                type='checkbox'
                                checked={acknowledged}
                                onChange={(e) =>
                                    setAcknowledged(e.target.checked)
                                }
                                className='shrink-0'
                                style={{ accentColor: accent }}
                            />
                            <span
                                className='text-xs font-bold uppercase tracking-widest'
                                style={{ color: 'var(--color-text-muted)' }}
                            >
                                I understand this is permanent
                            </span>
                        </label>
                    )}

                    <div className='flex gap-3 pt-1'>
                        <button
                            type='button'
                            onClick={requestClose}
                            autoFocus
                            className='flex-1 py-3 text-sm font-bold uppercase tracking-widest cursor-pointer transition-all duration-150 rounded-none'
                            style={{
                                border: '1px solid var(--color-glass-border)',
                                color: 'var(--color-text-muted)',
                                background: 'var(--color-glass-border)',
                            }}
                            onMouseEnter={(e) => {
                                (
                                    e.currentTarget as HTMLButtonElement
                                ).style.background = 'var(--color-brand)';
                                (
                                    e.currentTarget as HTMLButtonElement
                                ).style.borderColor = 'var(--color-brand)';
                                (
                                    e.currentTarget as HTMLButtonElement
                                ).style.color = 'var(--color-surface)';
                            }}
                            onMouseLeave={(e) => {
                                (
                                    e.currentTarget as HTMLButtonElement
                                ).style.background =
                                    'var(--color-glass-border)';
                                (
                                    e.currentTarget as HTMLButtonElement
                                ).style.borderColor =
                                    'var(--color-glass-border)';
                                (
                                    e.currentTarget as HTMLButtonElement
                                ).style.color = 'var(--color-text-muted)';
                            }}
                        >
                            {cancelLabel}
                        </button>
                        <button
                            type='button'
                            onClick={() => handleConfirm(requestClose)}
                            disabled={!canConfirm}
                            className='flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold uppercase tracking-widest cursor-pointer transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed rounded-none'
                            style={{
                                border: `1px solid ${accent}`,
                                color: 'var(--color-surface)',
                                background: accent,
                            }}
                            onMouseEnter={(e) => {
                                if (submitting) return;
                                (
                                    e.currentTarget as HTMLButtonElement
                                ).style.background = 'var(--color-brand)';
                                (
                                    e.currentTarget as HTMLButtonElement
                                ).style.borderColor = 'var(--color-brand)';
                            }}
                            onMouseLeave={(e) => {
                                (
                                    e.currentTarget as HTMLButtonElement
                                ).style.background = accent;
                                (
                                    e.currentTarget as HTMLButtonElement
                                ).style.borderColor = accent;
                            }}
                        >
                            {submitting
                                ? 'Working…'
                                : confirmLabel ||
                                  (isArchive ? 'Archive' : 'Delete')}
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
}
