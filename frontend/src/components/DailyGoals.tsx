import { type ReactNode, useEffect, useRef } from 'react';
import { Target, Flame, Clock, TrendingUp, Zap } from 'lucide-react';

interface Goal {
  id: string; type: string; title: string;
  targetValue: number; status: 'pending' | 'completed' | 'missed';
  xpReward: number;
}

const GOAL_ICONS: Record<string, ReactNode> = {
  session_duration: <Clock className="w-3.5 h-3.5" />,
  streak_maintain:  <Flame className="w-3.5 h-3.5" />,
  eval_prep:        <Target className="w-3.5 h-3.5" />,
  stretch:          <TrendingUp className="w-3.5 h-3.5" />,
};

function GoalRow({ goal, index }: { goal: Goal; index: number }) {
  const isDone   = goal.status === 'completed';
  const isMissed = goal.status === 'missed';

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
      style={{
        background: isDone ? 'var(--color-active-bg)' : 'var(--color-surface-2)',
        border: `1px solid ${isDone ? 'var(--color-brand)' : 'var(--color-glass-border)'}`,
        opacity: isMissed ? 0.38 : 1,
        transition: 'background 0.3s ease, border-color 0.3s ease, opacity 0.3s ease',
        animation: `fadeUp 0.3s ease ${index * 0.06}s both`,
      }}
    >
      {/* check / icon */}
      <span
        style={{
          color: isDone ? 'var(--color-brand)' : 'var(--color-text-faint)',
          animation: isDone ? 'checkBounce 0.4s cubic-bezier(0.175,0.885,0.32,1.275) both' : 'none',
          display: 'inline-block', flexShrink: 0,
        }}
      >
        {isDone
          ? <span style={{ fontSize: 14, fontWeight: 900 }}>✓</span>
          : (GOAL_ICONS[goal.type] ?? <Target className="w-3.5 h-3.5" />)
        }
      </span>

      {/* title */}
      <span
        className="text-xs font-bold flex-1"
        style={{
          textDecoration: isDone ? 'line-through' : 'none',
          color: isDone ? 'var(--color-text-muted)' : 'var(--color-text)',
          transition: 'color 0.2s ease',
        }}
      >
        {goal.title}
      </span>

      {/* XP reward */}
      <span
        className="text-[10px] font-black font-mono shrink-0"
        style={{ color: isDone ? 'var(--color-brand)' : 'var(--color-text-faint)' }}
      >
        +{goal.xpReward}
      </span>
    </div>
  );
}

export default function DailyGoals({ goals, loading }: { goals: Goal[]; loading?: boolean }) {
  if (loading) {
    return (
      <div className="card p-5">
        <div className="h-4 w-32 rounded bg-[var(--color-surface-2)] animate-pulse mb-4" />
        <div className="space-y-3">
          {[0,1,2].map(i => <div key={i} className="h-12 rounded-lg bg-[var(--color-surface-2)] animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!goals?.length) return null;

  const done  = goals.filter(g => g.status === 'completed').length;
  const total = goals.length;
  const allDone = done === total;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div
      className="card p-5"
      style={{
        borderColor: allDone ? 'var(--color-brand)' : undefined,
        boxShadow: allDone ? '0 0 22px var(--color-brand-glow)' : undefined,
        transition: 'border-color 0.5s ease, box-shadow 0.5s ease',
      }}
    >
      {/* header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 shrink-0" style={{ color: 'var(--color-brand)' }} />
          <span className="text-[10px] font-black tracking-[0.25em] uppercase" style={{ color: 'var(--color-brand)' }}>
            Today's Goals
          </span>
        </div>
        <span className="text-[10px] font-black font-mono" style={{ color: allDone ? 'var(--color-brand)' : 'var(--color-text-muted)' }}>
          {done}/{total}
        </span>
      </div>

      {/* progress bar */}
      <div className="h-1 rounded-full overflow-hidden mb-4" style={{ background: 'var(--color-surface-3)' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: 'var(--color-brand)',
            transition: 'width 0.7s cubic-bezier(0.22,1,0.36,1)',
          }}
        />
      </div>

      <div className="space-y-2">
        {goals.map((goal, i) => <GoalRow key={goal.id} goal={goal} index={i} />)}
      </div>

      {/* empty state */}
      {total === 0 && (
        <div className="py-6 text-center animate-fade-up">
          <p className="text-[11px] font-bold" style={{ color: 'var(--color-text-faint)' }}>
            No goals yet — start a session to generate today's targets.
          </p>
        </div>
      )}

      {allDone && (
        <div className="mt-3 text-center animate-scale-in">
          <span className="text-xs font-bold" style={{ color: 'var(--color-brand)' }}>
            All goals complete — you built this. 🎯
          </span>
        </div>
      )}
    </div>
  );
}