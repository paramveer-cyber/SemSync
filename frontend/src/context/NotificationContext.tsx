import {
  createContext, useContext, useEffect, useState,
  useCallback, useRef, ReactNode,
} from 'react';
import { getUpcomingEvals } from '../lib/api';

export interface NotifSettings {
  enabled: boolean;
  at6h:    boolean;
  at12h:   boolean;
  at24h:   boolean;
  at48h:   boolean;
}

export interface Toast {
  id:      string;
  title:   string;
  body:    string;
  urgency: 'low' | 'medium' | 'high';
  at:      number;
}

interface NotifCtx {
  settings:         NotifSettings;
  updateSettings:   (s: Partial<NotifSettings>) => void;
  toasts:           Toast[];
  dismissToast:     (id: string) => void;
  permission:       NotificationPermission | 'unsupported';
  requestPermission: () => Promise<void>;
}

const SETTINGS_KEY = 'semsync_notif_settings';
const FIRED_KEY    = 'semsync_notif_fired';

const DEFAULT: NotifSettings = { enabled: true, at6h: true, at12h: true, at24h: true, at48h: false };

const loadSettings = (): NotifSettings => {
  try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }; }
  catch { return DEFAULT; }
};
const saveSettings = (s: NotifSettings) => localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));

const getFired = (): Set<string> => {
  try { return new Set(JSON.parse(localStorage.getItem(FIRED_KEY) || '[]')); }
  catch { return new Set(); }
};
const addFired = (key: string) => {
  const s = getFired(); s.add(key);
  localStorage.setItem(FIRED_KEY, JSON.stringify([...s]));
};

function uid() { return Math.random().toString(36).slice(2, 9); }

const WINDOWS = [
  { key: '6h',  ms: 6  * 3600_000, label: '6 hours'  },
  { key: '12h', ms: 12 * 3600_000, label: '12 hours' },
  { key: '24h', ms: 24 * 3600_000, label: '24 hours' },
  { key: '48h', ms: 48 * 3600_000, label: '2 days'   },
] as const;

const NotifContext = createContext<NotifCtx | null>(null);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [settings,   setSettings  ] = useState<NotifSettings>(loadSettings);
  const [toasts,     setToasts    ] = useState<Toast[]>([]);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateSettings = useCallback((patch: Partial<NotifSettings>) => {
    setSettings(prev => { const next = { ...prev, ...patch }; saveSettings(next); return next; });
  }, []);

  const dismissToast = useCallback((id: string) =>
    setToasts(p => p.filter(t => t.id !== id)), []);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setPermission(result);
  }, []);

  const pushToast = useCallback((title: string, body: string, urgency: Toast['urgency']) => {
    const t: Toast = { id: uid(), title, body, urgency, at: Date.now() };
    setToasts(p => [t, ...p].slice(0, 6));
    setTimeout(() => setToasts(p => p.filter(x => x.id !== t.id)), 8000);
  }, []);

  const fireBrowser = useCallback((title: string, body: string) => {
    if (permission !== 'granted') return;
    try { new Notification(title, { body, icon: '/favicon.svg' }); } catch { /* noop */ }
  }, [permission]);

  const check = useCallback(async () => {
    if (!settings.enabled) return;
    let evals: any[] = [];
    try { const r = await getUpcomingEvals(); evals = r.evaluations ?? []; }
    catch { return; }

    const now   = Date.now();
    const fired = getFired();

    for (const ev of evals) {
      const due   = new Date(ev.date).getTime();
      const delta = due - now;
      if (delta < 0) continue;

      for (const w of WINDOWS) {
        const settingKey = `at${w.key}` as keyof NotifSettings;
        if (!settings[settingKey]) continue;

        const firedKey = `${ev.id}|${w.key}`;
        if (fired.has(firedKey)) continue;

        if (delta <= w.ms) {
          const hrs     = Math.round(delta / 3600_000);
          const msg     = `${ev.title} (${ev.courseName}) is due in ~${hrs}h`;
          const urgency = hrs <= 6 ? 'high' : hrs <= 12 ? 'medium' : 'low';
          pushToast(`⏰ Deadline: ${ev.title}`, msg, urgency);
          fireBrowser(`SemSync — Deadline in ${w.label}`, msg);
          addFired(firedKey);
        }
      }
    }
  }, [settings, pushToast, fireBrowser]);

  useEffect(() => {
    check();
    intervalRef.current = setInterval(check, 5 * 60_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [check]);

  return (
    <NotifContext.Provider value={{ settings, updateSettings, toasts, dismissToast, permission, requestPermission }}>
      {children}
    </NotifContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotifContext);
  if (!ctx) throw new Error('useNotifications must be inside NotificationProvider');
  return ctx;
};
