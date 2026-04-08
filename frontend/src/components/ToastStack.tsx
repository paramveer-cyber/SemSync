import { X, AlertCircle, Clock, Info } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import type { Toast } from '../context/NotificationContext';

const URGENCY: Record<Toast['urgency'], { color: string; border: string; bg: string; Icon: any }> = {
  high:   { color: '#ef4444', border: 'rgba(239,68,68,0.4)',  bg: 'rgba(239,68,68,0.08)',  Icon: AlertCircle },
  medium: { color: '#f59e0b', border: 'rgba(245,158,11,0.4)', bg: 'rgba(245,158,11,0.06)', Icon: Clock },
  low:    { color: '#22c55e', border: 'rgba(34,197,94,0.35)', bg: 'rgba(34,197,94,0.05)',  Icon: Info },
};

export default function ToastStack() {
  const { toasts, dismissToast } = useNotifications();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 360 }}>
      {toasts.map(t => {
        const u = URGENCY[t.urgency];
        return (
          <div key={t.id}
            className="pointer-events-auto animate-fade-up flex items-start gap-3 px-4 py-3"
            style={{
              background: 'rgba(12,12,18,0.97)',
              border: `1px solid ${u.border}`,
              boxShadow: `0 4px 24px rgba(0,0,0,0.5), inset 0 0 0 1px ${u.bg}`,
              backdropFilter: 'blur(16px)',
            }}>
            <div className="w-0.5 self-stretch shrink-0" style={{ background: u.color }} />
            <u.Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: u.color }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white mb-0.5">{t.title}</p>
              <p className="text-[11px] leading-snug" style={{ color: 'rgba(255,255,255,0.5)' }}>{t.body}</p>
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              className="shrink-0 w-5 h-5 flex items-center justify-center transition-colors"
              style={{ color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
