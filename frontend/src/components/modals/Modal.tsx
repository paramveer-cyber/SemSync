import { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';

export default function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="w-full max-w-md animate-fade-up"
        style={{ background: 'rgba(18,18,26,0.98)', border: '1px solid var(--color-glass-border)', borderRadius: '20px', overflow: 'hidden' }}>
        {/* Header */}
        <div
          className="flex items-center justify-between px-7 py-5"
          style={{ borderBottom: '1px solid var(--color-glass-border)' }}>
          <span className="text-sm font-semibold text-[var(--color-text)] font-headline">{title}</span>
          <button
            onClick={onClose}
            title="Close"
            className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-150"
            style={{ background: 'rgba(239,68,68,0.10)', color: 'rgba(239,68,68,0.7)', border: '1px solid rgba(239,68,68,0.2)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.22)';
              (e.currentTarget as HTMLButtonElement).style.color = '#ef4444';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.5)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.10)';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(239,68,68,0.7)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.2)';
            }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-7">{children}</div>
      </div>
    </div>
  );
}
