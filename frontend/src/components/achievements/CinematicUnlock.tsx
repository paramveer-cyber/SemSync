/**
 * CinematicUnlock — prestige achievement presentation
 * For: Platinum / Legendary / Hidden achievements ONLY
 * Feel: rare, precious, premium. NOT: gacha or gaming RGB.
 */
import { useState, useEffect, useCallback } from 'react';
import { useAchievements, CINEMATIC_TIERS } from '../../context/AchievementContext';
import type { AchievementEntry } from '../../context/AchievementContext';

const TIER_PALETTE: Record<string, {
  primary: string; glow: string; dimBg: string; label: string;
}> = {
  platinum: {
    primary: '#c0a8ff',
    glow: 'rgba(192,168,255,0.45)',
    dimBg: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(192,168,255,0.09) 0%, rgba(0,0,0,0.95) 65%)',
    label: 'PLATINUM',
  },
  legendary: {
    primary: '#ff9a3c',
    glow: 'rgba(255,154,60,0.50)',
    dimBg: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(255,154,60,0.10) 0%, rgba(0,0,0,0.96) 65%)',
    label: 'LEGENDARY',
  },
  hidden: {
    primary: '#60a5fa',
    glow: 'rgba(96,165,250,0.45)',
    dimBg: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(96,165,250,0.09) 0%, rgba(0,0,0,0.95) 65%)',
    label: 'HIDDEN',
  },
};

type Phase = 'hidden' | 'reveal' | 'content' | 'done';

function XPCounter({ target }: { target: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let v = 0;
    const step = Math.ceil(target / 24);
    const iv = setInterval(() => {
      v = Math.min(v + step, target);
      setN(v);
      if (v >= target) clearInterval(iv);
    }, 30);
    return () => clearInterval(iv);
  }, [target]);
  return <>+{n} XP</>;
}

function SingleCinematic({
  achievement,
  onDone,
}: {
  achievement: AchievementEntry;
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<Phase>('hidden');
  const palette = TIER_PALETTE[achievement.tier] ?? TIER_PALETTE.platinum;

  useEffect(() => {
    const t0 = setTimeout(() => setPhase('reveal'), 60);
    const t1 = setTimeout(() => setPhase('content'), 520);
    const t2 = setTimeout(() => setPhase('done'), 1100);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const nameChars = achievement.name.split('');
  const visible = phase !== 'hidden';
  const showContent = phase === 'content' || phase === 'done';

  return (
    <div
      onClick={phase === 'done' ? onDone : undefined}
      style={{
        position: 'fixed', inset: 0, zIndex: 9100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#000000',
        cursor: phase === 'done' ? 'pointer' : 'default',
      }}
    >
      {/* Color tint overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: visible ? palette.dimBg : 'transparent',
        transition: 'background 0.55s ease',
      }} />
      {/* Pulse rings */}
      {visible && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: `${26 + i * 13}vmin`, height: `${26 + i * 13}vmin`,
              borderRadius: '50%',
              border: `1px solid ${palette.primary}`,
              opacity: showContent ? (0.14 - i * 0.04) : 0,
              transition: `opacity 0.7s ease ${i * 0.14}s`,
              animation: showContent ? `cinematic-ring 3.8s ease-in-out ${i * 0.45}s infinite` : 'none',
            }} />
          ))}
        </div>
      )}

      {/* Card */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        maxWidth: 380, width: '100%', padding: '0 24px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.96)',
        transition: 'opacity 0.4s ease, transform 0.42s cubic-bezier(0.22,1,0.36,1)',
      }}>
        {/* Tier label */}
        <div style={{
          marginBottom: 24, padding: '5px 16px', borderRadius: 100,
          border: `1px solid ${palette.primary}44`, background: `${palette.primary}0e`,
          fontSize: 9, fontWeight: 900, letterSpacing: '0.32em', textTransform: 'uppercase',
          color: palette.primary,
          opacity: visible ? 1 : 0, transition: 'opacity 0.4s ease 0.1s',
        }}>
          {palette.label} ACHIEVEMENT
        </div>

        {/* Emoji */}
        <div style={{
          fontSize: 72, lineHeight: 1, marginBottom: 24,
          filter: `drop-shadow(0 0 28px ${palette.glow})`,
          transform: visible ? 'scale(1)' : 'scale(0.5)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.5s cubic-bezier(0.175,0.885,0.32,1.275) 0.1s, opacity 0.4s ease 0.1s',
        }}>
          {achievement.emoji}
        </div>

        {/* Name — character reveal */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
          gap: 2, marginBottom: 12, minHeight: '2.8rem',
        }}>
          {nameChars.map((ch, i) => (
            <span key={i} style={{
              fontSize: 32, fontWeight: 900, lineHeight: 1.25,
              color: palette.primary, textShadow: `0 0 18px ${palette.glow}`,
              opacity: showContent ? 1 : 0,
              transform: showContent ? 'translateY(0)' : 'translateY(10px)',
              transition: `opacity 0.2s ease ${0.05 + i * 0.04}s, transform 0.2s ease ${0.05 + i * 0.04}s`,
              display: 'inline-block',
            }}>
              {ch === ' ' ? '\u00A0' : ch}
            </span>
          ))}
        </div>

        {/* Description */}
        <p style={{
          fontSize: 13, lineHeight: 1.6,
          color: 'rgba(180,180,200,0.7)',
          marginBottom: 20, maxWidth: 300,
          opacity: showContent ? 1 : 0,
          transition: 'opacity 0.35s ease 0.25s',
        }}>
          {achievement.desc}
        </p>

        {/* XP counter */}
        <div style={{
          fontSize: 24, fontWeight: 900, fontFamily: 'monospace',
          color: palette.primary, textShadow: `0 0 22px ${palette.glow}`,
          marginBottom: 32,
          opacity: showContent ? 1 : 0,
          transform: showContent ? 'scale(1)' : 'scale(0.8)',
          transition: 'opacity 0.3s ease 0.3s, transform 0.35s cubic-bezier(0.175,0.885,0.32,1.275) 0.3s',
        }}>
          {showContent && <XPCounter target={achievement.xp} />}
        </div>

        {/* Continue button */}
        <button
          onClick={onDone}
          style={{
            padding: '10px 28px', fontSize: 10, fontWeight: 800,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            border: `1px solid ${palette.primary}55`, color: palette.primary,
            background: `${palette.primary}0d`, borderRadius: 6, cursor: 'pointer',
            opacity: phase === 'done' ? 1 : 0,
            transition: 'opacity 0.3s ease, background 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = `${palette.primary}22`;
            (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 20px ${palette.glow}`;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = `${palette.primary}0d`;
            (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
          }}
        >
          CONTINUE
        </button>
      </div>

      <style>{`
        @keyframes cinematic-ring {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: var(--ring-op, 0.1); }
          50% { transform: translate(-50%, -50%) scale(1.06); opacity: calc(var(--ring-op, 0.1) * 0.5); }
        }
      `}</style>
    </div>
  );
}

export default function CinematicUnlock() {
  const { pendingUnlocks, dismissUnlock } = useAchievements();

  const cinematic = pendingUnlocks.find(a => CINEMATIC_TIERS.has(a.tier));

  const handleDone = useCallback(() => {
    if (cinematic) dismissUnlock(cinematic.id);
  }, [cinematic, dismissUnlock]);

  if (!cinematic) return null;

  return <SingleCinematic key={cinematic.id} achievement={cinematic} onDone={handleDone} />;
}