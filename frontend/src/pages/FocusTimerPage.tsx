import { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import {
  Timer, Play, Pause, RotateCcw, X, Plus, Zap, Coffee,
  ChevronDown, CheckCircle2, Link2, Target, AlertCircle
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
type TimerPhase = 'focus' | 'break' | 'idle';
type TimerStatus = 'running' | 'paused' | 'idle';

interface FocusSession {
  id: string;
  date: string;
  durationMinutes: number;
  taskTitle?: string;
  taskCategory?: string;
  completedAt: number;
}

interface TimerTask {
  id: string;
  title: string;
  category: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  'Reading', 'Note Making', 'Question Solving', 'Coding', 'Debugging',
  'Writing', 'Planning', 'Reviewing', 'Research', 'General'
];

const SESSIONS_KEY = 'focus_sessions_v1';
const TASKS_KEY = 'architect_tasks_v1';

function loadSessions(): FocusSession[] {
  try { const r = localStorage.getItem(SESSIONS_KEY); return r ? JSON.parse(r) : []; } catch { return []; }
}
function saveSessions(s: FocusSession[]) {
  try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(s)); } catch { /* noop */ }
}
function loadTasks(): TimerTask[] {
  try {
    const r = localStorage.getItem(TASKS_KEY);
    if (!r) return [];
    const tasks = JSON.parse(r);
    return tasks.map((t: any) => ({ id: t.id, title: t.title, category: t.course || 'General' }));
  } catch { return []; }
}

function toDateStr(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Focus is the art of knowing what to ignore.", author: "James Clear" },
  { text: "Deep work is the superpower of the 21st century.", author: "Cal Newport" },
  { text: "Do the hard thing first. Everything after is easy.", author: "Brian Tracy" },
  { text: "Energy, not time, is the fundamental currency of high performance.", author: "Jim Loehr" },
  { text: "You don't rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
  { text: "The difference between ordinary and extraordinary is that little extra.", author: "Jimmy Johnson" },
  { text: "Concentrate all your thoughts upon the work at hand.", author: "Alexander Graham Bell" },
  { text: "It's not about having time. It's about making time.", author: "Unknown" },
  { text: "The successful warrior is the average person with laser-like focus.", author: "Bruce Lee" },
];

function ContributionChart({ sessions }: { sessions: FocusSession[] }) {
  const weeks = 16;
  const days = 7;
  const today = Date.now();

  const map: Record<string, number> = {};
  sessions.forEach(s => {
    map[s.date] = (map[s.date] || 0) + s.durationMinutes;
  });

  const cells: { date: string; minutes: number; ts: number }[] = [];
  for (let i = weeks * days - 1; i >= 0; i--) {
    const ts = today - i * 86_400_000;
    const date = toDateStr(ts);
    cells.push({ date, minutes: map[date] || 0, ts });
  }

  const maxMinutes = Math.max(...cells.map(c => c.minutes), 1);

  function getColor(minutes: number) {
    if (minutes === 0) return 'rgba(255,255,255,0.1)';
    const intensity = minutes / maxMinutes;
    if (intensity < 0.25) return 'rgba(34,197,94,0.4)';
    if (intensity < 0.5) return 'rgba(34,197,94,0.6)';
    if (intensity < 0.75) return 'rgba(34,197,94,0.8)';
    return '#22c55e';
  }

  const grid: typeof cells[] = [];
  for (let w = 0; w < weeks; w++) {
    grid.push(cells.slice(w * days, w * days + days));
  }

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const totalHours = Math.round(sessions.reduce((a, s) => a + s.durationMinutes, 0) / 60 * 10) / 10;
  const totalSessions = sessions.length;
  const streak = (() => {
    let s = 0;
    for (let i = 0; i < 365; i++) {
      const d = toDateStr(today - i * 86_400_000);
      if (map[d]) s++;
      else if (i > 0) break;
    }
    return s;
  })();

  const [hovered, setHovered] = useState<{ date: string; minutes: number } | null>(null);

  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', padding: '24px', borderRadius: '5px' }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <span className="text-[10px] font-black tracking-[0.25em] uppercase block mb-1" style={{ color: '#22c55e' }}>// FOCUS_LOG</span>
          <h3 className="text-base font-extrabold tracking-tighter uppercase text-zinc-200">Contribution Chart</h3>
        </div>
        <div className="flex items-center gap-6">
          {[
            { label: 'TOTAL HRS', value: `${totalHours}h` },
            { label: 'SESSIONS', value: totalSessions },
            { label: 'DAY STREAK', value: streak },
          ].map(m => (
            <div key={m.label} className="text-right">
              <p className="text-lg font-black font-mono" style={{ color: '#22c55e' }}>{m.value}</p>
              <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-zinc-400">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-0.5 mb-1 pl-7">
        {grid.map((_, wi) => (
          <div key={wi} className="flex-1" />
        ))}
      </div>

      <div className="flex gap-1">
        <div className="flex flex-col gap-0.5 mr-1">
          {dayLabels.map((d, i) => (
            <div key={d} className="h-3 flex items-center">
              {i % 2 === 0 && (
                <span className="text-[8px] font-mono text-zinc-400" style={{ width: '24px' }}>{d}</span>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-0.5 flex-1">
          {grid.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5 flex-1">
              {week.map((cell, di) => (
                <div
                  key={di}
                  className="relative rounded-[2px]"
                  style={{ height: '12px', background: getColor(cell.minutes), cursor: cell.minutes > 0 ? 'pointer' : 'default', transition: 'opacity 0.1s' }}
                  onMouseEnter={() => setHovered({ date: cell.date, minutes: cell.minutes })}
                  onMouseLeave={() => setHovered(null)}
                  title={cell.minutes > 0 ? `${cell.date}: ${Math.round(cell.minutes / 60 * 10) / 10}h` : cell.date}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        {hovered ? (
          <span className="text-[10px] font-mono" style={{ color: '#22c55e' }}>
            {hovered.date} — {hovered.minutes > 0 ? `${Math.round(hovered.minutes / 60 * 10) / 10}h focused` : 'no sessions'}
          </span>
        ) : (
          <span className="text-[10px] font-mono text-zinc-400">hover to inspect</span>
        )}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono text-zinc-400">less</span>
          {['rgba(255,255,255,0.1)', 'rgba(34,197,94,0.4)', 'rgba(34,197,94,0.6)', 'rgba(34,197,94,0.8)', '#22c55e'].map((c, i) => (
            <div key={i} className="rounded-[2px]" style={{ width: 10, height: 10, background: c }} />
          ))}
          <span className="text-[9px] font-mono text-zinc-400">more</span>
        </div>
      </div>
    </div>
  );
}

function QuoteCard() {
  const [idx] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const q = QUOTES[idx];
  return (
    <div className="flex flex-col justify-between rounded-[5px]"
      style={{ border: '1px solid rgba(34,197,94,0.4)', background: 'rgba(34,197,94,0.08)', padding: '20px 24px' }}>
      <div className="flex items-start gap-3 mb-3">
        <Zap className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#22c55e' }} />
        <span className="text-[10px] font-black tracking-[0.25em] uppercase" style={{ color: '#22c55e' }}>FOCUS PROTOCOL</span>
      </div>
      <p className="text-sm font-bold leading-relaxed text-zinc-200 mb-3 italic">"{q.text}"</p>
      <p className="text-[10px] font-mono tracking-widest uppercase text-zinc-400">— {q.author}</p>
    </div>
  );
}

function TimerArc({ progress, phase }: { progress: number; phase: TimerPhase }) {
  const r = 130; 
  const cx = 150;
  const cy = 150;
  const startAngle = -220;
  const endAngle = 40;
  const totalAngle = endAngle - startAngle;

  function polarToXY(angle: number) {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function describeArc(fromAngle: number, toAngle: number) {
    const s = polarToXY(fromAngle);
    const e = polarToXY(toAngle);
    const largeArc = toAngle - fromAngle > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  }

  const fillAngle = startAngle + totalAngle * (1 - progress);
  const color = phase === 'break' ? '#3b82f6' : '#22c55e';

  return (
    <svg width="300" height="300" viewBox="0 0 300 300" fill="none">
      <path d={describeArc(startAngle, endAngle)} stroke="rgba(255,255,255,0.15)" strokeWidth="12" fill="none" strokeLinecap="round" />
      {progress > 0 && (
        <path d={describeArc(startAngle, fillAngle)} stroke={color} strokeWidth="12" fill="none" strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${color}88)`, transition: 'all 1s linear' }} />
      )}
      {progress > 0 && (() => {
        const dot = polarToXY(fillAngle);
        return <circle cx={dot.x} cy={dot.y} r="6" fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />;
      })()}
    </svg>
  );
}

export default function FocusTimerPage() {
  const FOCUS_CHIPS = [25, 45, 60];
  const BREAK_MINUTES = 5;
  const EXTEND_MINUTES = 5;

  const [sessions, setSessions] = useState<FocusSession[]>(loadSessions);
  const [tasks] = useState<TimerTask[]>(loadTasks);
  const [linkedTask, setLinkedTask] = useState<TimerTask | null>(null);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState(CATEGORIES[0]);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [showQuickTask, setShowQuickTask] = useState(false);
  const [taskError, setTaskError] = useState(false);

  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [phase, setPhase] = useState<TimerPhase>('idle');
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [sessionStartMinutes, setSessionStartMinutes] = useState(25);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartRef = useRef<number>(0);

  // Ask for notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const clearTimer = () => { if (intervalRef.current) clearInterval(intervalRef.current); };

  const commitSession = useCallback((minutes: number) => {
    if (minutes < 1) return;
    const newSession: FocusSession = {
      id: Math.random().toString(36).slice(2),
      date: toDateStr(Date.now()),
      durationMinutes: minutes,
      taskTitle: linkedTask?.title ?? (quickTitle || undefined),
      taskCategory: linkedTask?.category ?? (quickCategory || undefined),
      completedAt: Date.now(),
    };
    setSessions(prev => {
      const updated = [newSession, ...prev];
      saveSessions(updated);
      return updated;
    });
  }, [linkedTask, quickTitle, quickCategory]);

  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearTimer();
            if (phase === 'focus') {
              commitSession(sessionStartMinutes);
              setPhase('break');
              setStatus('running');
              const breakSecs = BREAK_MINUTES * 60;
              setTotalSeconds(breakSecs);
              setSecondsLeft(breakSecs);
              
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Focus Complete!', { body: 'Great work! Take a 5 minute break and Touch grass 🌱' });
              }
            } else if (phase === 'break') {
              setPhase('idle');
              setStatus('idle');
              setSecondsLeft(selectedMinutes * 60);
              setTotalSeconds(selectedMinutes * 60);
              
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Break Over!', { body: 'Ready to focus again?' });
              }
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return clearTimer;
  }, [status, phase, selectedMinutes, totalSeconds, sessionStartMinutes, commitSession]);

  const start = () => {
    if (!linkedTask && !quickTitle.trim()) {
      setTaskError(true);
      setTimeout(() => setTaskError(false), 3000);
      return;
    }

    if (status === 'idle' && phase === 'idle') {
      const secs = selectedMinutes * 60;
      setTotalSeconds(secs);
      setSecondsLeft(secs);
      setSessionStartMinutes(selectedMinutes);
      setPhase('focus');
      setStatus('running');
      sessionStartRef.current = Date.now();
    } else if (status === 'paused') {
      setStatus('running');
    }
  };

  const pause = () => { if (status === 'running') setStatus('paused'); };

  const dismiss = () => {
    clearTimer();
    if (phase === 'focus' && status !== 'idle') {
      const elapsed = Math.round((totalSeconds - secondsLeft) / 60);
      if (elapsed >= 1) commitSession(elapsed);
    }
    setPhase('idle');
    setStatus('idle');
    setSecondsLeft(selectedMinutes * 60);
    setTotalSeconds(selectedMinutes * 60);
  };

  const reset = () => {
    clearTimer();
    setPhase('idle');
    setStatus('idle');
    setSecondsLeft(selectedMinutes * 60);
    setTotalSeconds(selectedMinutes * 60);
  };

  const extend = () => {
    if (phase === 'focus') {
      const add = EXTEND_MINUTES * 60;
      setSecondsLeft(p => p + add);
      setTotalSeconds(p => p + add);
      setSessionStartMinutes(p => p + EXTEND_MINUTES);
    }
  };

  const selectChip = (min: number) => {
    if (status === 'running' || phase !== 'idle') return;
    setSelectedMinutes(min);
    setSecondsLeft(min * 60);
    setTotalSeconds(min * 60);
    setStatus('idle');
  };

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 1;

  const phaseColor = phase === 'break' ? '#3b82f6' : '#22c55e';
  const phaseLabel = phase === 'idle' ? 'STANDBY' : phase === 'break' ? 'BREAK' : 'DEEP_FOCUS';

  const taskLabel = linkedTask ? linkedTask.title : quickTitle || null;

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />
      <main className="grow flex flex-col overflow-hidden">
        <Header title="Focus Timer" subtitle="Focus_Protocol_V1" />

        <div className="grow overflow-y-auto p-8">
          <div className="mb-8">
            <span className="text-[10px] font-black tracking-[0.3em] uppercase block mb-2" style={{ color: '#22c55e' }}>// FOCUS_PROTOCOL_V1</span>
            <h2 className="text-7xl font-extrabold tracking-tighter uppercase leading-none text-white">Focus Timer</h2>
          </div>

          <div className="grid grid-cols-[1fr_320px] gap-6">
            <div className="flex flex-col gap-5">
              <QuoteCard />

              <div className="relative" style={{ border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', padding: '32px', borderRadius: '5px' }}>
                
                {/* DEV Button
                <button 
                  onClick={() => setSecondsLeft(1)} 
                  className="absolute top-4 right-4 text-[10px] uppercase tracking-widest font-bold px-2 py-1 bg-zinc-800 text-zinc-400 border border-zinc-600 rounded-[5px] hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer"
                >
                  DEV: Speed Up
                </button> */}

                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3 mt-2">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: phaseColor }} />
                    <span className="text-[10px] font-black tracking-[0.3em] uppercase" style={{ color: phaseColor }}>{phaseLabel}</span>
                  </div>
                  {phase === 'break' && (
                    <span className="text-[10px] font-mono px-3 py-1 text-blue-400 border border-blue-500/40 bg-blue-500/10 rounded-[5px]">
                      <Coffee className="w-3 h-3 inline mr-1" />TOUCH GRASS 🌱
                    </span>
                  )}
                  {phase === 'focus' && taskLabel && (
                    <span className="flex items-center gap-1.5 text-[10px] font-mono px-3 py-1 truncate max-w-xs text-green-400 border border-green-500/40 bg-green-500/10 rounded-[5px]">
                      <Link2 className="w-3 h-3 shrink-0" />{taskLabel}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-center mb-8">
                  <div className="relative w-[300px] h-[300px]">
                    <TimerArc progress={progress} phase={phase} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[10px] font-mono tracking-[0.2em] uppercase mb-1 text-zinc-400">CYCLE TIME</span>
                      <span className="text-7xl font-black font-mono tracking-tighter text-white" style={{ textShadow: `0 0 30px ${phaseColor}44` }}>
                        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                      </span>
                      {phase === 'focus' && (
                        <span className="text-[10px] font-mono tracking-widest mt-2 text-zinc-400">
                          {Math.round((1 - progress) * 100)}% COMPLETE
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {phase === 'idle' && (
                  <div className="flex items-center justify-center gap-3 mb-8">
                    {FOCUS_CHIPS.map(m => (
                      <button key={m} onClick={() => selectChip(m)}
                        className="px-5 py-2 rounded-[5px] text-sm font-black tracking-widest uppercase transition-all duration-150 cursor-pointer"
                        style={selectedMinutes === m
                          ? { border: '1px solid #22c55e', color: '#22c55e', background: 'rgba(34,197,94,0.15)' }
                          : { border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.7)', background: 'transparent' }}>
                        {m}m
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-center gap-3">
                  {status !== 'running' && phase !== 'break' ? (
                    <button onClick={start}
                      className="flex items-center gap-2 px-8 py-3 rounded-[5px] font-black tracking-widest uppercase text-sm cursor-pointer transition-all duration-150"
                      style={{ border: '1px solid #22c55e', color: '#22c55e', background: 'rgba(34,197,94,0.12)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#22c55e'; (e.currentTarget as HTMLButtonElement).style.color = '#000'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.12)'; (e.currentTarget as HTMLButtonElement).style.color = '#22c55e'; }}>
                      <Play className="w-4 h-4" />
                      {status === 'paused' ? 'RESUME' : 'INITIATE'}
                    </button>
                  ) : phase === 'break' ? (
                    <button disabled className="flex items-center gap-2 px-8 py-3 rounded-[5px] font-black tracking-widest uppercase text-sm opacity-50 cursor-not-allowed text-blue-400 border border-blue-500/40 bg-blue-500/10">
                      <Coffee className="w-4 h-4" />MANDATORY 5M DELAY
                    </button>
                  ) : (
                    <button onClick={pause}
                      className="flex items-center gap-2 px-8 py-3 rounded-[5px] font-black tracking-widest uppercase text-sm cursor-pointer transition-all duration-150 text-zinc-200 border border-zinc-500 bg-zinc-800/50 hover:bg-zinc-700/50">
                      <Pause className="w-4 h-4" />SUSPEND
                    </button>
                  )}

                  {phase === 'focus' && (
                    <button onClick={extend}
                      className="flex items-center gap-1.5 px-4 py-3 rounded-[5px] font-black tracking-widest uppercase text-sm cursor-pointer transition-all duration-150 text-amber-500 border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20">
                      <Plus className="w-4 h-4" />5M
                    </button>
                  )}

                  {phase === 'focus' ? (
                    <button onClick={dismiss}
                      className="flex items-center gap-1.5 px-4 py-3 rounded-[5px] font-black tracking-widest uppercase text-sm cursor-pointer transition-all duration-150 text-red-500 border border-red-500/40 bg-red-500/10 hover:bg-red-500/20">
                      <X className="w-4 h-4" />ABORT
                    </button>
                  ) : phase === 'idle' ? (
                    <button onClick={reset}
                      className="flex items-center gap-1.5 px-4 py-3 rounded-[5px] font-black tracking-widest uppercase text-sm cursor-pointer transition-all duration-150 text-zinc-400 border border-zinc-600 hover:bg-zinc-800/50">
                      <RotateCcw className="w-4 h-4" />RESET
                    </button>
                  ) : null}
                </div>
              </div>

              <ContributionChart sessions={sessions} />
            </div>

            <div className="flex flex-col gap-5">
              <div style={{
                border: taskError ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(0,0,0,0.5)',
                padding: '24px',
                borderRadius: '5px',
                transition: 'border-color 0.3s ease'
              }}>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4" style={{ color: '#22c55e' }} />
                    <span className="text-[10px] font-black tracking-[0.25em] uppercase" style={{ color: '#22c55e' }}>LINK TASK</span>
                  </div>
                  {taskError && <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />}
                </div>

                {linkedTask ? (
                  <div className="mb-4 p-3 border border-green-500/40 bg-green-500/10 rounded-[5px]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase text-zinc-100 truncate">{linkedTask.title}</p>
                        <p className="text-[10px] font-mono mt-0.5 text-zinc-400">{linkedTask.category}</p>
                      </div>
                      <button onClick={() => setLinkedTask(null)} className="shrink-0 cursor-pointer text-zinc-400 hover:text-zinc-200">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : quickTitle ? (
                  <div className="mb-4 p-3 border border-blue-500/40 bg-blue-500/10 rounded-[5px]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase text-zinc-100 truncate">{quickTitle}</p>
                        <p className="text-[10px] font-mono mt-0.5 text-zinc-400">{quickCategory}</p>
                      </div>
                      <button onClick={() => { setQuickTitle(''); setQuickCategory(CATEGORIES[0]); }} className="shrink-0 cursor-pointer text-zinc-400 hover:text-zinc-200">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : null}

                {!linkedTask && !quickTitle && (
                  <div className="space-y-2">
                    {tasks.length > 0 && (
                      <button onClick={() => { setShowTaskPicker(p => !p); setShowQuickTask(false); }}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-[5px] text-xs font-black tracking-widest uppercase cursor-pointer transition-all border border-zinc-700 text-zinc-300 hover:border-zinc-500">
                        <span className="flex items-center gap-2"><Link2 className="w-3.5 h-3.5" />Link Task</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showTaskPicker ? 'rotate-180' : ''}`} />
                      </button>
                    )}

                    {showTaskPicker && (
                      <div className="overflow-y-auto max-h-48 space-y-1 border border-zinc-800 bg-[#0a0a0f] rounded-[5px]">
                        {tasks.map(t => (
                          <button key={t.id} onClick={() => { setLinkedTask(t); setShowTaskPicker(false); setTaskError(false); }}
                            className="w-full text-left px-4 py-3 text-xs cursor-pointer transition-all border-b border-zinc-800 text-zinc-400 hover:bg-green-500/10 hover:text-zinc-200 last:border-0">
                            <p className="font-bold uppercase truncate">{t.title}</p>
                            <p className="text-[10px] font-mono mt-0.5">{t.category}</p>
                          </button>
                        ))}
                      </div>
                    )}

                    <button onClick={() => { setShowQuickTask(p => !p); setShowTaskPicker(false); }}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-[5px] text-xs font-black tracking-widest uppercase cursor-pointer transition-all border border-zinc-700 text-zinc-300 hover:border-zinc-500">
                      <span className="flex items-center gap-2"><Plus className="w-3.5 h-3.5" />Quick Task</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showQuickTask ? 'rotate-180' : ''}`} />
                    </button>

                    {showQuickTask && (
                      <div className="p-3 space-y-2 border border-zinc-800 bg-[#0a0a0f] rounded-[5px]">
                        <input
                          className="w-full px-3 py-2 text-xs placeholder:text-zinc-500 focus:outline-none border border-zinc-700 bg-zinc-900 text-zinc-200 rounded-[5px]"
                          placeholder="Task title..."
                          value={quickTitle}
                          onChange={e => setQuickTitle(e.target.value)}
                        />
                        <select
                          className="w-full px-3 py-2 text-xs focus:outline-none appearance-none border border-zinc-700 bg-zinc-900 text-zinc-200 rounded-[5px]"
                          value={quickCategory}
                          onChange={e => setQuickCategory(e.target.value)}
                        >
                          {CATEGORIES.map(c => (
                            <option key={c} value={c} className="bg-[#0a0a0f]">{c}</option>
                          ))}
                        </select>
                        <button onClick={() => { if (quickTitle.trim()) { setShowQuickTask(false); setTaskError(false); } }}
                          className="w-full py-2 text-xs font-black tracking-widest uppercase cursor-pointer transition-all border border-green-500 text-green-500 bg-green-500/10 hover:bg-green-500 hover:text-black rounded-[5px]">
                          SET TASK
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {taskError && (
                  <p className="text-xs font-bold text-red-500 mt-3 animate-pulse">
                    ⚠ Task selection is mandatory to initiate focus.
                  </p>
                )}

                {(linkedTask || quickTitle) && (
                  <p className="text-[10px] font-mono mt-3 text-zinc-400">Session will be logged under this task</p>
                )}
              </div>

              <div style={{ border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', padding: '24px', borderRadius: '5px' }}>
                <span className="text-[10px] font-black tracking-[0.25em] uppercase block mb-4 text-zinc-400">// RECENT SESSIONS</span>
                {sessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 border border-dashed border-zinc-700 rounded-[5px]">
                    <Timer className="w-8 h-8 mb-2 text-zinc-600" />
                    <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">No sessions yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {sessions.slice(0, 20).map(s => (
                      <div key={s.id} className="flex items-center justify-between px-3 py-2.5 border border-zinc-800 bg-zinc-900/50 rounded-[5px]">
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase text-zinc-200 truncate">
                            {s.taskTitle || 'Free Focus'}
                          </p>
                          <p className="text-[10px] font-mono mt-0.5 text-zinc-400">
                            {s.date} · {s.taskCategory || '—'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-3">
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                          <span className="text-xs font-black font-mono text-green-500">{s.durationMinutes}m</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {(() => {
                const todayStr = toDateStr(Date.now());
                const todaySessions = sessions.filter(s => s.date === todayStr);
                const todayMins = todaySessions.reduce((a, s) => a + s.durationMinutes, 0);
                if (todaySessions.length === 0) return null;
                return (
                  <div className="px-5 py-4 flex items-center justify-between border border-green-500/20 bg-green-500/10 rounded-[5px]">
                    <div>
                      <p className="text-[10px] font-black tracking-[0.25em] uppercase mb-1 text-zinc-400">TODAY'S OUTPUT</p>
                      <p className="text-2xl font-black font-mono text-green-500">{Math.round(todayMins / 60 * 10) / 10}h</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black tracking-[0.25em] uppercase mb-1 text-zinc-400">CYCLES</p>
                      <p className="text-2xl font-black font-mono text-green-500">{todaySessions.length}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}