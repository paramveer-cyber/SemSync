import { useState, useEffect, useCallback } from 'react';
import {
    useAchievements,
    CINEMATIC_TIERS,
} from '../../context/AchievementContext';
import { playDismiss } from '../../lib/sound';

const TIER_COLOR: Record<
    string,
    { accent: string; bg: string; border: string; glow: string }
> = {
    bronze: {
        accent: '#D47F46',
        bg: 'rgba(212,127,70,0.05)',
        border: 'rgba(212,127,70,0.2)',
        glow: 'rgba(212,127,70,0.15)',
    },
    silver: {
        accent: '#B8B8CC',
        bg: 'rgba(184,184,204,0.05)',
        border: 'rgba(184,184,204,0.2)',
        glow: 'rgba(184,184,204,0.15)',
    },
    gold: {
        accent: '#FFD700',
        bg: 'rgba(255,215,0,0.08)',
        border: 'rgba(255,215,0,0.3)',
        glow: 'rgba(255,215,0,0.25)',
    },
};

const AUTO_DISMISS_MS = 4000;

interface ToastItemProps {
    id: string;
    name: string;
    emoji: string;
    tier: string;
    xp: number;
    desc: string;
    onDismiss: (id: string) => void;
}

function ToastItem({
    id,
    name,
    emoji,
    tier,
    xp,
    desc,
    onDismiss,
}: ToastItemProps) {
    const [visible, setVisible] = useState(false);
    const [exiting, setExiting] = useState(false);
    const c = TIER_COLOR[tier] ?? TIER_COLOR.bronze;

    const dismiss = useCallback(() => {
        if (exiting) return;
        setExiting(true);
        playDismiss();
        setTimeout(() => onDismiss(id), 400); // Increased for smoother exit
    }, [exiting, id, onDismiss]);

    useEffect(() => {
        const t0 = requestAnimationFrame(() =>
            requestAnimationFrame(() => setVisible(true)),
        );
        const t1 = setTimeout(dismiss, AUTO_DISMISS_MS);
        return () => {
            cancelAnimationFrame(t0);
            clearTimeout(t1);
        };
    }, [dismiss]);

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '16px 24px',
                minWidth: '21.25rem',
                maxWidth: '26.25rem',
                background: `linear-gradient(135deg, rgba(14,14,20,0.98) 0%, rgba(18,18,26,0.95) 100%)`,
                border: `1px solid ${c.border}`,
                borderLeft: `4px solid ${c.accent}`,
                borderRadius: '0.75rem',
                boxShadow: `0 12px 40px rgba(0,0,0,0.6), 0 0 20px ${c.glow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
                backdropFilter: 'blur(24px)',
                cursor: 'pointer',
                opacity: visible && !exiting ? 1 : 0,
                transform:
                    visible && !exiting
                        ? 'translateX(0) scale(1) translateY(0)'
                        : exiting
                          ? 'translateX(40px) scale(0.95) translateY(-10px)'
                          : 'translateX(40px) scale(0.95) translateY(10px)',
                transition: exiting
                    ? 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
                    : 'all 0.5s cubic-bezier(0.2, 1.2, 0.3, 1)',
                willChange: 'opacity, transform',
            }}
            onClick={dismiss}
        >
            {/* Icon */}
            <div
                style={{
                    fontSize: 'var(--text-38)',
                    lineHeight: 1,
                    flexShrink: 0,
                    filter: `drop-shadow(0 4px 12px ${c.glow})`,
                }}
            >
                {emoji}
            </div>

            {/* Content */}
            <div
                style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                }}
            >
                <div
                    style={{
                        fontSize: 'var(--text-4xs)',
                        fontWeight: 800,
                        letterSpacing: '0.25em',
                        textTransform: 'uppercase',
                        color: c.accent,
                        opacity: 0.9,
                    }}
                >
                    Achievement Unlocked
                </div>
                <div
                    style={{
                        fontSize: 'var(--type-body-size)',
                        fontWeight: 800,
                        color: '#ffffff',
                        letterSpacing: '0.01em',
                        lineHeight: 1.2,
                    }}
                >
                    {name}
                </div>
                <div
                    style={{
                        fontSize: 'var(--text-13)',
                        color: 'rgba(200,200,220,0.7)',
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                    }}
                >
                    {desc}
                </div>
            </div>

            {/* XP Badge */}
            <div
                style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 800,
                    fontFamily:
                        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    color: c.accent,
                    flexShrink: 0,
                    background: c.bg,
                    padding: '6px 10px',
                    borderRadius: '0.5rem',
                    border: `1px solid ${c.border}`,
                    alignSelf: 'flex-start',
                    marginTop: -2,
                }}
            >
                +{xp}
            </div>
        </div>
    );
}

export default function AchievementToastStack() {
    const { pendingUnlocks, dismissUnlock } = useAchievements();

    const toasts = pendingUnlocks.filter((a) => !CINEMATIC_TIERS.has(a.tier));

    if (!toasts.length) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: '2rem',
                right: '2rem',
                zIndex: 8900,
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                pointerEvents: 'none',
            }}
        >
            {toasts.slice(0, 4).map((a) => (
                <div key={a.id} style={{ pointerEvents: 'auto' }}>
                    <ToastItem
                        id={a.id}
                        name={a.name}
                        emoji={a.emoji}
                        tier={a.tier}
                        xp={a.xp}
                        desc={a.desc}
                        onDismiss={dismissUnlock}
                    />
                </div>
            ))}
        </div>
    );
}
