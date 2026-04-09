import { useState, useEffect, useRef } from 'react';
import {
  ChevronRight, LayoutDashboard, BookMarked,
  CalendarDays, CheckSquare, Timer, ZoomIn,
} from 'lucide-react';

// ── localStorage helpers ──────────────────────────────────────────────────────

const STORAGE_KEY = 'semsync_tutorial_seen';

export function hasSeenTutorial(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === 'true'; } catch { return false; }
}
export function markTutorialSeen() {
  try { localStorage.setItem(STORAGE_KEY, 'true'); } catch {}
}
export function resetTutorial() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

// ── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
  {
    id: 'zoom',
    icon: ZoomIn,
    iconColor: '#f59e0b',
    accent: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.3)',
    label: 'Display Setup',
    title: 'Set Your Zoom to 80%',
    tagline: 'DISPLAY / ZOOM',
    description:
      'SemSync is crafted for 80% browser zoom. At 100% things can feel a little cramped. But at 80% every panel breathes and the dashboard grid lines up perfectly.',
    details: [
      { icon: '⌨️', heading: 'Windows / Linux', body: 'Hold Ctrl and press  (minus) until your browser shows 80% in the address bar.' },
      { icon: '⌘', heading: 'macOS', body: 'Hold Cmd and press  (minus) until the zoom level reaches 80%.' },
      { icon: '⚙️', heading: 'Browser Menu', body: 'Click the ⋮ menu → Zoom → set to 80%. This persists across visits to the site.' },
    ],
    tip: 'Your browser will remember this zoom level for the site, you only need to do it once.',
  },
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    iconColor: '#22c55e',
    accent: 'rgba(34,197,94,0.1)',
    border: 'rgba(34,197,94,0.28)',
    label: 'Dashboard',
    title: 'Your Command Center',
    tagline: 'WEEKLY FOCUS',
    description:
      "The Dashboard is the first thing you see every day. It gives you an instant read on what's coming up, evaluations sorted by urgency, and a live grid of all your active courses.",
    details: [
      { icon: '🔴', heading: 'CRITICAL', body: 'Due within 2 days. Shown in red : means drop everything and prep now.' },
      { icon: '🟡', heading: 'OPERATIONAL', body: 'Due within 5 days. Highlighted in your brand color : time to start.' },
      { icon: '⚪', heading: 'ROUTINE', body: 'More than 5 days out. Low urgency, but do not ignore it.' },
    ],
    tip: 'The weekly focus section resets every Monday, pulling in whichever evaluations fall within the next 7 days.',
  },
  {
    id: 'courses',
    icon: BookMarked,
    iconColor: '#818cf8',
    accent: 'rgba(129,140,248,0.1)',
    border: 'rgba(129,140,248,0.28)',
    label: 'Courses',
    title: 'Track Every Course',
    tagline: 'COURSE NODES',
    description:
      'Add each of your subjects as a Course Node. Set a target grade and log evaluations as they happen. SemSync calculates your current grade and tells you exactly what average you need on remaining work.',
    details: [
      { icon: '➕', heading: 'Add a Course', body: 'Hit "New Course" on the Dashboard, enter the name, credits, and your target grade.' },
      { icon: '📊', heading: 'Live Grade Tracking', body: 'Each evaluation you log: quiz, assignment, mid-sem. It updates your current grade instantly.' },
      { icon: '🎯', heading: 'Required Average', body: 'SemSync tells you what average you need across remaining evaluations to hit your target.' },
    ],
    tip: "The green/red status dot on each course card shows whether you're above or below your target grade at a glance.",
  },
  {
    id: 'calendar',
    icon: CalendarDays,
    iconColor: '#38bdf8',
    accent: 'rgba(56,189,248,0.1)',
    border: 'rgba(56,189,248,0.28)',
    label: 'Calendar',
    title: 'Visualise Your Timeline',
    tagline: 'MONTH VIEW',
    description:
      'The Calendar maps every evaluation across the semester on a month grid. See where deadlines cluster, spot dangerous weeks, and plan study sessions around your actual schedule.',
    details: [
      { icon: '📅', heading: 'Month Overview', body: 'Every evaluation is plotted with a colour-coded dot. Each course has its own colour.' },
      { icon: '⚠️', heading: 'Clash Detection', body: 'Weeks with multiple deadlines are visually dense, immediately obvious when to start earlier.' },
      { icon: '🔗', heading: 'Quick Navigation', body: "Click any evaluation dot to jump straight to that course's detail page." },
    ],
    tip: 'Use the Calendar at the start of each month to plan which weeks need the heaviest study blocks.',
  },
  {
    id: 'tasks',
    icon: CheckSquare,
    iconColor: '#34d399',
    accent: 'rgba(52,211,153,0.1)',
    border: 'rgba(52,211,153,0.28)',
    label: 'Task Center',
    title: 'Break Down Your Work',
    tagline: 'TO-DO SYSTEM',
    description:
      'The Task Center turns big evaluations into bite-sized actions. Create tasks, link them to courses, set due dates, and knock them off one by one. Smaller chunks = less cramming.',
    details: [
      { icon: '✅', heading: 'Create Tasks', body: 'Add tasks like "Revise Chapter 4" or "Complete practice problems" and link them to a course.' },
      { icon: '🏷️', heading: 'Course Linking', body: 'Every task can be pinned to a specific course so your workload is always organised by subject.' },
      { icon: '📁', heading: 'Auto Archive', body: 'Completed tasks are automatically archived your history is always accessible, never cluttering your view.' },
    ],
    tip: "The most effective strategy: create tasks for each evaluation the day it's announced, then chip away daily.",
  },
  {
    id: 'timer',
    icon: Timer,
    iconColor: '#f472b6',
    accent: 'rgba(244,114,182,0.1)',
    border: 'rgba(244,114,182,0.28)',
    label: 'Focus Timer',
    title: 'Lock In Deep Work',
    tagline: 'POMODORO ENGINE',
    description:
      'The Focus Timer is a built-in Pomodoro engine. Set your work interval, set your break, start the clock. No tab-switching, no distractions. Just focused blocks of study with earned rests.',
    details: [
      { icon: '⏱️', heading: 'Custom Intervals', body: 'Default is 25 min work / 5 min break. Adjust to whatever rhythm works for you: 60/5, 90/5, anything.' },
      { icon: '🔔', heading: 'Session Alerts', body: 'Audio and visual alerts fire when your work block ends and when your break is over.' },
      { icon: '📈', heading: 'Session Stats', body: 'Every completed session is logged so you can see total focus time per day and per week.' },
    ],
    tip: 'Pair the Focus Timer with a Task Center task. Start a session, work on one task, mark it done when the timer rings.',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

interface OnboardingTutorialProps {
  onClose: () => void;
}

export default function OnboardingTutorial({ onClose }: OnboardingTutorialProps) {
  const [step, setStep] = useState(0);
  const [canProceed, setCanProceed] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [exiting, setExiting] = useState(false);
  const [contentVisible, setContentVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Only step 0 has the 3-second lock
  useEffect(() => {
    if (step === 0) {
      setCanProceed(false);
      setCountdown(3);
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setCanProceed(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    } else {
      setCanProceed(true);
    }
  }, [step]);

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const Icon = current.icon;

  const goToStep = (i: number) => {
    if (i === step) return;
    setContentVisible(false);
    setTimeout(() => {
      setStep(i);
      setContentVisible(true);
    }, 150);
  };

  const handleNext = () => {
    if (!canProceed) return;
    if (isLast) {
      setExiting(true);
      setTimeout(() => { markTutorialSeen(); onClose(); }, 280);
    } else {
      setContentVisible(false);
      setTimeout(() => { setStep(s => s + 1); setContentVisible(true); }, 150);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.88)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        opacity: exiting ? 0 : 1,
        transition: 'opacity 0.28s ease',
      }}
    >
      {/* ── Main panel ── */}
      <div
        style={{
          width: '75vw',
          height: '78vh',
          minWidth: 760,
          maxWidth: 1200,
          background: 'var(--color-surface-1)',
          border: `1px solid ${current.border}`,
          borderRadius: 16,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: `0 0 80px ${current.accent}, 0 32px 80px rgba(0,0,0,0.7)`,
          transform: exiting ? 'scale(0.97) translateY(14px)' : 'scale(1) translateY(0)',
          transition: 'transform 0.28s ease, box-shadow 0.4s ease, border-color 0.4s ease',
        }}
      >
        {/* Top accent bar */}
        <div style={{
          height: 3, flexShrink: 0,
          background: `linear-gradient(90deg, ${current.iconColor} 0%, ${current.iconColor}44 55%, transparent 100%)`,
          transition: 'background 0.4s ease',
        }} />

        {/* Body: sidebar + content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* ── LEFT SIDEBAR ── */}
          <div style={{
            width: 210, flexShrink: 0,
            borderRight: '1px solid var(--color-glass-border)',
            background: 'var(--color-surface)',
            display: 'flex', flexDirection: 'column',
            padding: '24px 0',
          }}>
            {/* Branding */}
            <div style={{ padding: '0 20px 18px', borderBottom: '1px solid var(--color-glass-border)' }}>
              <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.28em', color: 'var(--color-text-faint)', textTransform: 'uppercase', marginBottom: 3, margin: '0 0 3px' }}>
                SEMSYNC
              </p>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                Getting Started
              </p>
            </div>

            {/* Nav items */}
            <div style={{ padding: '12px 10px', flex: 1, overflowY: 'auto' }}>
              {STEPS.map((s, i) => {
                const SIcon = s.icon;
                const isActive = i === step;
                const isDone = i < step;
                return (
                  <button
                    key={s.id}
                    onClick={() => goToStep(i)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 10px', borderRadius: 8, marginBottom: 2,
                      border: isActive ? `1px solid ${s.border}` : '1px solid transparent',
                      background: isActive ? s.accent : 'transparent',
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                      background: isActive ? s.accent : isDone ? 'rgba(34,197,94,0.12)' : 'var(--color-surface-2)',
                      border: `1px solid ${isActive ? s.border : isDone ? 'rgba(34,197,94,0.25)' : 'var(--color-glass-border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isDone
                        ? <span style={{ fontSize: 12, color: '#22c55e' }}>✓</span>
                        : <SIcon style={{ width: 13, height: 13, color: isActive ? s.iconColor : 'var(--color-text-faint)' }} />
                      }
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{
                        fontSize: 12, margin: 0, lineHeight: 1.2,
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? 'var(--color-text)' : isDone ? 'var(--color-text-muted)' : 'var(--color-text-faint)',
                      }}>
                        {s.label}
                      </p>
                      {isActive && (
                        <p style={{ fontSize: 9, color: s.iconColor, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', margin: '2px 0 0' }}>
                          Active
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Progress */}
            <div style={{ padding: '14px 20px 0', borderTop: '1px solid var(--color-glass-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: 'var(--color-text-faint)', textTransform: 'uppercase' }}>Progress</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-text-faint)', fontFamily: 'monospace' }}>{step + 1}/{STEPS.length}</span>
              </div>
              <div style={{ height: 3, background: 'var(--color-glass-border)', borderRadius: 9999, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${((step + 1) / STEPS.length) * 100}%`,
                  background: current.iconColor, borderRadius: 9999,
                  transition: 'width 0.4s ease, background 0.4s ease',
                }} />
              </div>
            </div>
          </div>

          {/* ── RIGHT CONTENT ── */}
          <div
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
              opacity: contentVisible ? 1 : 0,
              transform: contentVisible ? 'translateX(0)' : 'translateX(10px)',
              transition: 'opacity 0.15s ease, transform 0.15s ease',
            }}
          >
            {/* Content header */}
            <div style={{ padding: '28px 36px 22px', borderBottom: '1px solid var(--color-glass-border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                {/* Large icon */}
                <div style={{
                  width: 54, height: 54, borderRadius: 13, flexShrink: 0,
                  background: current.accent, border: `1px solid ${current.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 24px ${current.accent}`,
                }}>
                  <Icon style={{ width: 26, height: 26, color: current.iconColor }} />
                </div>

                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.28em', color: current.iconColor, textTransform: 'uppercase', margin: '0 0 5px' }}>
                    {current.tagline}
                  </p>
                  <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                    {current.title}
                  </h2>
                </div>

                {/* Dot progress */}
                <div style={{ display: 'flex', gap: 5, paddingTop: 6 }}>
                  {STEPS.map((_, i) => (
                    <div
                      key={i}
                      onClick={() => goToStep(i)}
                      style={{
                        width: i === step ? 22 : 7, height: 7, borderRadius: 9999, cursor: 'pointer',
                        background: i === step ? current.iconColor : i < step ? 'var(--color-text-faint)' : 'var(--color-glass-border)',
                        transition: 'all 0.3s ease',
                      }}
                    />
                  ))}
                </div>
              </div>

              <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--color-text-muted)', margin: '18px 0 0', maxWidth: 600 }}>
                {current.description}
              </p>
            </div>

            {/* Detail cards */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '22px 36px' }}>
              <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.22em', color: 'var(--color-text-faint)', textTransform: 'uppercase', margin: '0 0 12px' }}>
                How it works
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {current.details.map((d, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 14,
                      padding: '14px 18px',
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-glass-border)',
                      borderLeft: `3px solid ${current.border}`,
                      borderRadius: 10,
                    }}
                  >
                    <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1.3 }}>{d.icon}</span>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 4px', letterSpacing: '0.02em' }}>{d.heading}</p>
                      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.55 }}>{d.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tip */}
              <div
                style={{
                  marginTop: 14, display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '14px 18px',
                  background: current.accent, border: `1px solid ${current.border}`, borderRadius: 10,
                }}
              >
                <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.3 }}>💡</span>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.2em', color: current.iconColor, textTransform: 'uppercase', margin: '0 0 4px' }}>Pro Tip</p>
                  <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.55 }}>{current.tip}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '14px 36px',
                borderTop: '1px solid var(--color-glass-border)',
                background: 'var(--color-glass)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 11, color: 'var(--color-text-faint)', fontFamily: 'monospace' }}>
                Step {step + 1} of {STEPS.length} — {current.label}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {step > 0 && (
                  <button
                    onClick={() => goToStep(step - 1)}
                    style={{
                      padding: '9px 18px', background: 'transparent',
                      color: 'var(--color-text-faint)', border: '1px solid var(--color-glass-border)',
                      borderRadius: 7, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
                      textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.18s ease',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--color-text)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-text-muted)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--color-text-faint)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-glass-border)'; }}
                  >
                    ← Back
                  </button>
                )}

                <button
                  onClick={handleNext}
                  disabled={!canProceed}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 24px', minWidth: 130, justifyContent: 'center',
                    background: canProceed ? current.iconColor : 'var(--color-surface-2)',
                    color: canProceed ? '#000' : 'var(--color-text-faint)',
                    border: canProceed ? `1px solid ${current.iconColor}` : '1px solid var(--color-glass-border)',
                    borderRadius: 7, fontSize: 12, fontWeight: 800, letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    cursor: canProceed ? 'pointer' : 'not-allowed',
                    transition: 'all 0.22s ease',
                    boxShadow: canProceed ? `0 4px 18px ${current.accent}` : 'none',
                  }}
                >
                  {!canProceed ? (
                    <>
                      <span style={{
                        display: 'inline-block', width: 14, height: 14,
                        border: '2px solid var(--color-glass-border)',
                        borderTopColor: 'var(--color-text-faint)',
                        borderRadius: '50%', animation: 'tutSpin 0.75s linear infinite',
                      }} />
                      {countdown}s
                    </>
                  ) : isLast ? (
                    <>Let&apos;s Go ✓</>
                  ) : (
                    <>Next <ChevronRight style={{ width: 14, height: 14 }} /></>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes tutSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
