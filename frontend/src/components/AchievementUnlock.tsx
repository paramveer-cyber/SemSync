import { useState, useEffect } from 'react';

const TIER_COLORS: Record<string, { bg: string; glow: string; text: string; border: string; nameColor: string }> = {
  bronze:   { bg: '#CD7F32',  glow: 'rgba(205,127,50,0.45)',  text: '#fff8f0', border: '#CD7F32',  nameColor: '#CD7F32' },
  silver:   { bg: '#C0C0C0',  glow: 'rgba(192,192,192,0.45)', text: '#1a1a2e', border: '#C0C0C0',  nameColor: '#C0C0C0' },
  gold:     { bg: 'linear-gradient(135deg,#FFD700,#FFA500)', glow: 'rgba(255,215,0,0.55)', text: '#1a0a00', border: '#FFD700', nameColor: '#FFD700' },
  platinum: { bg: 'linear-gradient(135deg,#e0e8ff,#b0c4de,#9370db,#b0c4de,#e0e8ff)', glow: 'rgba(180,150,255,0.65)', text: '#0a0014', border: '#c0a8ff', nameColor: '#c0a8ff' },
};

interface Achievement { id: string; name: string; emoji: string; tier: string; xp: number; desc: string; hidden?: boolean; }
interface Props { achievements: Achievement[]; onDone: () => void; }

function XPCounter({ target }: { target: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let s = 0;
    const step = Math.ceil(target / 22);
    const t = setInterval(() => {
      s = Math.min(s + step, target);
      setN(s);
      if (s >= target) clearInterval(t);
    }, 28);
    return () => clearInterval(t);
  }, [target]);
  return <span>+{n} XP</span>;
}

type Phase = 'enter' | 'badge' | 'name' | 'desc' | 'xp' | 'spark' | 'ready';

function AchievementCard({ a, onNext, isLast }: { a: Achievement; onNext: () => void; isLast: boolean }) {
  const [phase, setPhase] = useState<Phase>('enter');
  const c = TIER_COLORS[a.tier] ?? TIER_COLORS.bronze;
  const isPlatinum = a.tier === 'platinum';

  useEffect(() => {
    const seq: [Phase, number][] = [
      ['badge', 100], ['name', 320], ['desc', 520], ['xp', 680], ['spark', 860], ['ready', 1100],
    ];
    const timers = seq.map(([p, ms]) => setTimeout(() => setPhase(p), ms));
    return () => timers.forEach(clearTimeout);
  }, []);

  const show = (p: Phase) => {
    const order: Phase[] = ['enter','badge','name','desc','xp','spark','ready'];
    return order.indexOf(phase) >= order.indexOf(p);
  };

  const nameChars = a.name.split('');

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{
        background: show('badge')
          ? `radial-gradient(ellipse 65% 65% at 50% 50%, ${c.glow} 0%, rgba(0,0,0,0.93) 70%)`
          : 'rgba(0,0,0,0.93)',
        transition: 'background 0.6s ease',
      }}
    >
      {/* platinum rings */}
      {isPlatinum && show('spark') && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_,i) => (
            <div key={i} className="absolute animate-ping"
              style={{
                width:`${22+i*10}%`, height:`${22+i*10}%`,
                top:'50%', left:'50%', transform:'translate(-50%,-50%)',
                border:`1px solid ${c.border}28`, borderRadius:'50%',
                animationDelay:`${i*0.18}s`, animationDuration:'2.2s',
              }}
            />
          ))}
        </div>
      )}

      {/* content */}
      <div
        className="relative flex flex-col items-center text-center max-w-sm w-full mx-6"
        style={{
          opacity: show('badge') ? 1 : 0,
          transform: show('badge') ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.175,0.885,0.32,1.275)',
          animation: !show('badge') ? 'achievementBurst 0.5s cubic-bezier(0.175,0.885,0.32,1.275) forwards' : 'none',
        }}
      >
        {/* tier badge pill */}
        <div
          className="mb-5 px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.3em] uppercase"
          style={{
            background: c.bg.includes('gradient') ? undefined : c.bg,
            backgroundImage: c.bg.includes('gradient') ? c.bg : undefined,
            color: c.text,
            boxShadow: `0 0 24px ${c.glow}`,
            opacity: show('badge') ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        >
          {a.tier.toUpperCase()} ACHIEVEMENT
        </div>

        {/* emoji */}
        <div
          className="text-7xl mb-5"
          style={{
            filter: `drop-shadow(0 0 22px ${c.glow})`,
            transform: show('badge') ? 'scale(1)' : 'scale(0.4)',
            transition: 'transform 0.4s cubic-bezier(0.175,0.885,0.32,1.275) 0.08s',
          }}
        >
          {a.emoji}
        </div>

        {/* name — letter reveal */}
        <div className="flex flex-wrap justify-center gap-[2px] mb-2 overflow-hidden" style={{ minHeight: '2.8rem' }}>
          {nameChars.map((ch, i) => (
            <span key={i} className="text-4xl font-black leading-tight"
              style={{
                color: c.nameColor,
                opacity: show('name') ? 1 : 0,
                transform: show('name') ? 'translateY(0)' : 'translateY(12px)',
                transition: `opacity 0.2s ease ${0.04 + i * 0.045}s, transform 0.2s ease ${0.04 + i * 0.045}s`,
                textShadow: `0 0 22px ${c.glow}`,
                display: 'inline-block',
              }}
            >
              {ch === ' ' ? '\u00A0' : ch}
            </span>
          ))}
        </div>

        {/* desc */}
        <p className="text-sm mb-5 leading-relaxed" style={{
          color: 'var(--color-text-muted)',
          opacity: show('desc') ? 1 : 0,
          transition: 'opacity 0.35s ease',
        }}>
          {a.desc}
        </p>

        {/* XP */}
        <div className="text-3xl font-black font-mono mb-7" style={{
          color: c.nameColor,
          textShadow: `0 0 32px ${c.glow}`,
          opacity: show('xp') ? 1 : 0,
          transform: show('xp') ? 'scale(1)' : 'scale(0.7)',
          transition: 'opacity 0.3s ease, transform 0.35s cubic-bezier(0.175,0.885,0.32,1.275)',
        }}>
          {show('xp') && <XPCounter target={a.xp} />}
        </div>

        {/* particle sparks */}
        {show('spark') && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(8)].map((_,i) => (
              <div key={i}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{
                  background: c.nameColor,
                  top:'50%', left:'50%',
                  animation: `p${i} 1.3s ease-out ${i*0.07}s forwards`,
                  boxShadow: `0 0 6px ${c.glow}`,
                }}
              />
            ))}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={onNext}
          className="btn-brand"
          style={{
            borderColor: c.border,
            color: c.nameColor,
            background: `${c.glow.replace('0.', '0.1')}`,
            opacity: show('ready') ? 1 : 0,
            transition: 'opacity 0.3s ease, background 0.15s, box-shadow 0.15s, transform 0.1s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 24px ${c.glow}`; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}
        >
          {isLast ? 'CONTINUE' : 'NEXT →'}
        </button>
      </div>
    </div>
  );
}

export default function AchievementUnlock({ achievements, onDone }: Props) {
  const [idx, setIdx] = useState(0);
  if (!achievements.length) return null;
  const current = achievements[idx];
  const isLast = idx === achievements.length - 1;
  const next = () => isLast ? onDone() : setIdx(i => i + 1);
  return <AchievementCard key={current.id} a={current} onNext={next} isLast={isLast} />;
}