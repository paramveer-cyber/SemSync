import { useState } from 'react';

export const TIER: Record<string, { color: string; glow: string; badge: string; bg: string }> = {
  bronze:   { color: '#CD7F32', glow: 'rgba(205,127,50,0.18)',   badge: 'BRONZE',   bg: 'rgba(205,127,50,0.07)' },
  silver:   { color: '#C0C0C0', glow: 'rgba(192,192,192,0.18)',  badge: 'SILVER',   bg: 'rgba(192,192,192,0.07)' },
  gold:     { color: '#FFD700', glow: 'rgba(255,215,0,0.22)',    badge: 'GOLD',     bg: 'rgba(255,215,0,0.07)' },
  platinum: { color: '#c0a8ff', glow: 'rgba(192,168,255,0.28)', badge: 'PLATINUM', bg: 'rgba(192,168,255,0.08)' },
  legendary:{ color: '#ff9a3c', glow: 'rgba(255,154,60,0.35)',  badge: 'LEGENDARY',bg: 'rgba(255,154,60,0.09)' },
};

export const ALL_ACHIEVEMENTS = [
  // Onboarding
  { id:'first_light',       emoji:'🌅', tier:'bronze',    xp:50,   name:'First Light',          desc:'Complete your first focus session',                                          hidden:false },
  { id:'the_contract',      emoji:'🤝', tier:'bronze',    xp:75,   name:'The Contract',         desc:'Complete 3 focus sessions',                                                  hidden:false },
  { id:'enrolled',          emoji:'📋', tier:'bronze',    xp:40,   name:'Enrolled',             desc:'Add your first course',                                                      hidden:false },
  { id:'on_the_record',     emoji:'📝', tier:'bronze',    xp:40,   name:'On the Record',        desc:'Create your first evaluation',                                               hidden:false },
  { id:'marked',            emoji:'✅', tier:'bronze',    xp:50,   name:'Marked',               desc:'Enter your first evaluation score',                                          hidden:false },
  { id:'first_order',       emoji:'🗒️', tier:'bronze',    xp:30,   name:'First Order',          desc:'Create your first task',                                                     hidden:false },
  { id:'full_picture',      emoji:'📊', tier:'bronze',    xp:25,   name:'Full Picture',         desc:'Open the Progress page for the first time',                                  hidden:false },
  { id:'system_online',     emoji:'🔗', tier:'bronze',    xp:60,   name:'System Online',        desc:'Complete a focus session linked to a task or evaluation',                    hidden:false },
  // Streak
  { id:'kindling',          emoji:'🔥', tier:'bronze',    xp:60,   name:'Kindling',             desc:'Reach a 3-day streak',                                                       hidden:false },
  { id:'ritual',            emoji:'⚡', tier:'silver',    xp:150,  name:'Ritual',               desc:'Reach a 14-day streak',                                                      hidden:false },
  { id:'no_days_off',       emoji:'📅', tier:'silver',    xp:250,  name:'No Days Off',          desc:'Reach a 30-day streak',                                                      hidden:false },
  { id:'unbroken',          emoji:'🧱', tier:'gold',      xp:500,  name:'Unbroken',             desc:'Reach a 60-day streak',                                                      hidden:false },
  { id:'the_iron_standard', emoji:'⚙️', tier:'platinum',  xp:1000, name:'The Iron Standard',    desc:'Reach a 100-day streak',                                                     hidden:false },
  { id:'weekly_anchor',     emoji:'⚓', tier:'silver',    xp:200,  name:'Weekly Anchor',        desc:'Study at least once every week for 8 consecutive weeks',                     hidden:false },
  { id:'clockwork',         emoji:'🕐', tier:'silver',    xp:175,  name:'Clockwork',            desc:'Study in the same 2-hour window for 10 consecutive days',                    hidden:false },
  { id:'daily_driver',      emoji:'🎯', tier:'silver',    xp:200,  name:'Daily Driver',         desc:'Complete at least one daily goal every day for 14 days straight',            hidden:false },
  { id:'perfect_briefing',  emoji:'🗂️', tier:'gold',      xp:400,  name:'Perfect Briefing',     desc:'Complete all daily goals for 7 consecutive days',                            hidden:false },
  // Deep Work
  { id:'flow_state',        emoji:'🧠', tier:'silver',    xp:200,  name:'Flow State',           desc:'Complete a 90-minute session with integrity ≥ 0.85',                         hidden:false },
  { id:'signal_noise',      emoji:'📡', tier:'silver',    xp:175,  name:'Signal/Noise',         desc:'Complete 5 sessions with integrity ≥ 0.9',                                   hidden:false },
  { id:'the_monolith',      emoji:'🗿', tier:'gold',      xp:350,  name:'The Monolith',         desc:'Complete a single 3-hour focus session',                                     hidden:false },
  { id:'surgeons_hours',    emoji:'🔬', tier:'gold',      xp:400,  name:'Surgeon\'s Hours',     desc:'Complete 10 sessions each with integrity ≥ 0.9',                             hidden:false },
  { id:'the_depth_protocol',emoji:'🌊', tier:'platinum',  xp:750,  name:'The Depth Protocol',   desc:'Log 50 hours of high-integrity work (integrity ≥ 0.8)',                      hidden:false },
  { id:'traceable',         emoji:'🔎', tier:'silver',    xp:225,  name:'Traceable',            desc:'Link every session to a task or eval for 14 consecutive days',               hidden:false },
  { id:'the_compound',      emoji:'📈', tier:'gold',      xp:400,  name:'The Compound',         desc:'Complete 200 total focus sessions',                                          hidden:false },
  // Evaluation
  { id:'the_setup',         emoji:'🎯', tier:'bronze',    xp:75,   name:'The Setup',            desc:'Study for an evaluation at least 72h before its deadline',                   hidden:false },
  { id:'above_target',      emoji:'🏹', tier:'silver',    xp:150,  name:'Above Target',         desc:'Score above your target grade on any evaluation',                            hidden:false },
  { id:'holding_the_line',  emoji:'🛡️', tier:'silver',    xp:250,  name:'Holding the Line',     desc:'Beat your target grade on 3 consecutive evaluations in one course',          hidden:false },
  { id:'course_complete',   emoji:'📚', tier:'silver',    xp:200,  name:'Course Complete',      desc:'Enter scores for every evaluation in a course',                              hidden:false },
  { id:'clean_sheet',       emoji:'✨', tier:'gold',      xp:400,  name:'Clean Sheet',          desc:'Score above target on every evaluation in a course',                         hidden:false },
  { id:'on_track',          emoji:'📊', tier:'bronze',    xp:80,   name:'On Track',             desc:'Maintain a course average at or above your target grade',                    hidden:false },
  { id:'no_surprises',      emoji:'🗓️', tier:'silver',    xp:125,  name:'No Surprises',         desc:'Study for an eval at least 72 hours before it is due',                       hidden:false },
  { id:'the_standard',      emoji:'🌟', tier:'gold',      xp:500,  name:'The Standard',         desc:'Keep every active course at or above its target grade simultaneously',       hidden:false },
  // Course / Planning
  { id:'the_curriculum',    emoji:'🗂️', tier:'bronze',    xp:60,   name:'The Curriculum',       desc:'Add 3 or more courses',                                                      hidden:false },
  { id:'course_closed',     emoji:'🔒', tier:'silver',    xp:150,  name:'Course Closed',        desc:'Archive your first completed course',                                        hidden:false },
  { id:'no_loose_ends',     emoji:'🧵', tier:'silver',    xp:150,  name:'No Loose Ends',        desc:'Add at least one weighted evaluation to every active course',                hidden:false },
  { id:'architect',         emoji:'📐', tier:'silver',    xp:175,  name:'Architect',            desc:'Fully configure every active course (name, target grade, 2+ evals)',        hidden:false },
  { id:'the_blueprint',     emoji:'🏗️', tier:'gold',      xp:300,  name:'The Blueprint',        desc:'Configure all courses and evals before logging your first session',          hidden:false },
  { id:'self_aware',        emoji:'🎯', tier:'bronze',    xp:50,   name:'Self-Aware',           desc:'Set target grades for all active courses',                                   hidden:false },
  { id:'fully_loaded',      emoji:'💯', tier:'silver',    xp:125,  name:'Fully Loaded',         desc:'Make evaluations in a course total exactly 100% weightage',                  hidden:false },
  // Comeback
  { id:'scar_tissue',       emoji:'🩹', tier:'silver',    xp:150,  name:'Scar Tissue',          desc:'Return after 5+ days of inactivity',                                         hidden:false },
  { id:'still_here',        emoji:'👋', tier:'bronze',    xp:75,   name:'Still Here',           desc:'Return after a 7-day break',                                                 hidden:false },
  { id:'phoenix_protocol',  emoji:'🔥', tier:'gold',      xp:350,  name:'Phoenix Protocol',     desc:'Build a 14-day streak after previously breaking a streak of 21+',            hidden:false },
  { id:'resilience_index',  emoji:'💪', tier:'gold',      xp:300,  name:'Resilience Index',     desc:'Return from a 3+ day gap on 3 separate occasions',                           hidden:false },
  { id:'rebuilt',           emoji:'🏛️', tier:'gold',      xp:450,  name:'Rebuilt',              desc:'Reach a 21-day streak after previously breaking one of 21+',                hidden:false },
  // Hidden achievements intentionally omitted from this bundle.
  // Metadata only served by backend after unlock — never shipped to client.
  // Legendary
  { id:'chronos',           emoji:'⏳', tier:'legendary', xp:2500, name:'Chronos',              desc:'Maintain a 365-day streak',                                                  hidden:false },
  { id:'valedictorian',     emoji:'🎓', tier:'legendary', xp:2000, name:'Valedictorian',        desc:'Master every system: 200+ sessions, 100+ tasks completed, all courses above target', hidden:false },
];

// Server-shaped catalog entry — what /focus/dashboard sends
interface CatalogEntry {
  id: string | null; tier: string; hidden: boolean; earned: boolean; locked?: boolean;
  name?: string | null; desc?: string | null; emoji?: string | null;
  xp?: number | null; earnedAt?: string | null; xpAwarded?: number | null;
}
interface EarnedAchievement { achievementId: string; tier: string; xpAwarded: number; earnedAt: string; }
type AchievementsGridProps = { catalog?: CatalogEntry[]; earned?: EarnedAchievement[] };

export default function AchievementsGrid({ catalog, earned = [] }: AchievementsGridProps) {
  const [showAll, setShowAll] = useState(false);
  const [tooltip, setTooltip] = useState<string | null>(null);

  // Prefer server catalog; fall back to local visible-only list merged with earned
  const items: CatalogEntry[] = (() => {
    if (catalog?.length) return catalog;
    const earnedMap = new Map(earned.map(e => [e.achievementId, e]));
    return ALL_ACHIEVEMENTS.map(a => {
      const e = earnedMap.get(a.id);
      return e
        ? { id: a.id, tier: a.tier, hidden: false, earned: true, name: a.name, desc: a.desc, emoji: a.emoji, xp: a.xp, earnedAt: e.earnedAt, xpAwarded: e.xpAwarded }
        : { id: a.id, tier: a.tier, hidden: false, earned: false, locked: true, name: a.name, desc: a.desc, emoji: a.emoji, xp: a.xp };
    });
  })();

  const sorted = [...items].sort((a, b) => {
    const aR = a.earned ? 0 : (a.hidden && !a.earned) ? 2 : 1;
    const bR = b.earned ? 0 : (b.hidden && !b.earned) ? 2 : 1;
    return aR - bR;
  });

  const INITIAL_SHOW = 8;
  const visible = showAll ? sorted : sorted.slice(0, INITIAL_SHOW);
  const moreCount = sorted.slice(INITIAL_SHOW).filter(a => !a.earned).length;

  const earnedCount = items.filter(a => a.earned).length;
  const totalCount  = items.length;
  const progress    = Math.round((earnedCount / totalCount) * 100);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-black tracking-[0.25em] uppercase" style={{ color: 'var(--color-brand)' }}>
          // ACHIEVEMENTS
        </span>
        <span className="text-[10px] font-bold font-mono" style={{ color: 'var(--color-text-muted)' }}>
          {earnedCount}/{totalCount}
        </span>
      </div>

      <div className="h-0.5 rounded-full overflow-hidden mb-4" style={{ background: 'var(--color-surface-3)' }}>
        <div className="h-full rounded-full" style={{ width: `${progress}%`, background: 'var(--color-brand)', transition: 'width 0.9s cubic-bezier(0.22,1,0.36,1)' }} />
      </div>

      <div className="grid grid-cols-4 gap-2">
        {visible.map((a, i) => {
          const isEarned = !!a.earned;
          const ts = TIER[a.tier] ?? TIER.bronze;
          const isHiddenLocked = a.hidden && !isEarned;
          const isTooltipOpen = tooltip === (a.id ?? `slot-${i}`);

          return (
            <div
              key={a.id ?? `slot-${i}`}
              className="relative flex flex-col items-center p-3 rounded-lg cursor-default"
              style={{
                background: isEarned ? ts.bg : 'var(--color-surface-2)',
                border: `1px solid ${isEarned ? ts.color + '55' : 'var(--color-glass-border)'}`,
                opacity: isEarned ? 1 : 0.45,
                transition: 'opacity 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease',
                boxShadow: isEarned && isTooltipOpen ? `0 0 18px ${ts.glow}` : undefined,
                transform: isTooltipOpen ? 'scale(1.06)' : 'scale(1)',
                animation: isEarned ? `fadeUp 0.35s ease ${i * 0.04}s both` : 'none',
              }}
              onMouseEnter={() => setTooltip(a.id ?? `slot-${i}`)}
              onMouseLeave={() => setTooltip(null)}
            >
              <span className="text-2xl mb-1" style={{
                filter: isEarned ? `drop-shadow(0 0 6px ${ts.glow})` : 'grayscale(1)',
                opacity: isHiddenLocked ? 0 : 1,
              }}>
                {a.emoji}
              </span>

              {isHiddenLocked && (
                <span className="absolute inset-0 flex items-center justify-center text-xl">🔮</span>
              )}

              <span className="text-[9px] font-black text-center leading-tight"
                style={{ color: isEarned ? ts.color : 'var(--color-text-faint)' }}>
                {isHiddenLocked ? '???' : a.name}
              </span>

              {isEarned && (
                <span className="text-[8px] font-bold mt-0.5 font-mono" style={{ color: ts.color }}>
                  +{a.xpAwarded ?? a.xp}
                </span>
              )}

              {isTooltipOpen && !isHiddenLocked && (
                <div
                  className="absolute bottom-full left-1/2 mb-2 z-50 w-36 px-2.5 py-2 rounded-lg text-[10px] font-semibold text-center pointer-events-none animate-fade-in"
                  style={{
                    transform: 'translateX(-50%)',
                    background: 'var(--color-surface-3)',
                    border: `1px solid ${ts.color}55`,
                    color: 'var(--color-text)',
                    boxShadow: `0 4px 20px ${ts.glow}`,
                  }}
                >
                  <div className="font-black mb-0.5" style={{ color: ts.color }}>{a.name}</div>
                  <div style={{ color: 'var(--color-text-muted)' }}>{a.desc}</div>
                  {isEarned && earnedData && (
                    <div className="mt-1 font-black" style={{ color: ts.color }}>+{earnedData.xpAwarded} XP</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {earnedCount === 0 && (
        <div className="mt-4 text-center animate-fade-up">
          <p className="text-[11px] font-bold" style={{ color: 'var(--color-text-faint)' }}>
            Start a focus session to unlock your first achievement.
          </p>
        </div>
      )}

      {!showAll && moreCount > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full mt-3 py-2 text-[10px] font-bold tracking-widest uppercase cursor-pointer rounded-lg transition-all duration-150"
          style={{ color: 'var(--color-text-faint)', border: '1px solid var(--color-glass-border)', background: 'transparent' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-brand)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-brand)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-glass-border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-faint)'; }}
        >
          + {moreCount} more to discover
        </button>
      )}
    </div>
  );
}