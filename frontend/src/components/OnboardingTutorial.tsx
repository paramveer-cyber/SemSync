import { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import {
    getConfiguration,
    updateConfiguration,
} from '../lib/localConfiguration';
import { STEPS } from '../data/OnboardingContent';

export function hasSeenTutorial(): boolean {
    return getConfiguration().tutorialSeen;
}
export function markTutorialSeen() {
    updateConfiguration({ tutorialSeen: true });
}
export function resetTutorial() {
    updateConfiguration({ tutorialSeen: false });
}

interface CaricatureProps {
    faceFill: string;
    faceBorder: string;
    imageSrc: string;
    imageAlt: string;
}

function Caricature({
    faceFill,
    faceBorder,
    imageSrc,
    imageAlt,
}: CaricatureProps) {
    return (
        <div
            style={{
                width: '100%',
                aspectRatio: '365 / 451',
                borderRadius: '1rem',
                background: faceFill,
                border: `2px solid ${faceBorder}`,
                overflow: 'hidden',
                boxShadow: `0 12px 36px ${faceFill}`,
            }}
        >
            <img
                src={imageSrc}
                alt={imageAlt}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                }}
            />
        </div>
    );
}

interface OnboardingTutorialProps {
    onClose: () => void;
}

export default function OnboardingTutorial({
    onClose,
}: OnboardingTutorialProps) {
    const [step, setStep] = useState(0);
    const [canProceed, setCanProceed] = useState(false);
    const [countdown, setCountdown] = useState(3);
    const [exiting, setExiting] = useState(false);
    const [contentVisible, setContentVisible] = useState(true);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (step === 0) {
            setCanProceed(false);
            setCountdown(3);
            timerRef.current = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current!);
                        setCanProceed(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => {
                if (timerRef.current) clearInterval(timerRef.current);
            };
        } else {
            setCanProceed(true);
        }
    }, [step]);

    const isLast = step === STEPS.length - 1;
    const current = STEPS[step];

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
            setTimeout(() => {
                markTutorialSeen();
                onClose();
            }, 280);
        } else {
            setContentVisible(false);
            setTimeout(() => {
                setStep((s) => s + 1);
                setContentVisible(true);
            }, 150);
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.88)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                opacity: exiting ? 0 : 1,
                transition: 'opacity 0.28s ease',
            }}
        >
            <div
                style={{
                    width: '75vw',
                    height: '78vh',
                    minWidth: '47.5rem',
                    maxWidth: '75rem',
                    background: 'var(--color-surface-1)',
                    border: `1px solid ${current.border}`,
                    borderRadius: '1rem',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: `0 0 80px ${current.accent}, 0 32px 80px rgba(0,0,0,0.7)`,
                    transform: exiting
                        ? 'scale(0.97) translateY(14px)'
                        : 'scale(1) translateY(0)',
                    transition:
                        'transform 0.28s ease, box-shadow 0.4s ease, border-color 0.4s ease',
                }}
            >
                <div
                    style={{
                        height: '0.1875rem',
                        flexShrink: 0,
                        background: `linear-gradient(90deg, ${current.iconColor} 0%, ${current.iconColor}44 55%, transparent 100%)`,
                        transition: 'background 0.4s ease',
                    }}
                />

                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    <div
                        style={{
                            width: '13.125rem',
                            flexShrink: 0,
                            borderRight: '1px solid var(--color-glass-border)',
                            background: 'var(--color-surface)',
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '24px 0',
                        }}
                    >
                        <div
                            style={{
                                padding: '0 20px 18px',
                                borderBottom:
                                    '1px solid var(--color-glass-border)',
                            }}
                        >
                            <p
                                style={{
                                    fontSize: 'var(--text-4xs)',
                                    fontWeight: 900,
                                    letterSpacing: '0.28em',
                                    color: 'var(--color-text-faint)',
                                    textTransform: 'uppercase',
                                    marginBottom: '0.1875rem',
                                    margin: '0 0 3px',
                                }}
                            >
                                SEMSYNC
                            </p>
                            <p
                                style={{
                                    fontSize: 'var(--text-13)',
                                    fontWeight: 700,
                                    color: 'var(--color-text)',
                                    margin: 0,
                                }}
                            >
                                Getting Started
                            </p>
                        </div>

                        <div
                            style={{
                                padding: '12px 10px',
                                flex: 1,
                                overflowY: 'auto',
                            }}
                        >
                            {STEPS.map((s, i) => {
                                const SIcon = s.icon;
                                const isActive = i === step;
                                const isDone = i < step;
                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => goToStep(i)}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.625rem',
                                            padding: '9px 10px',
                                            borderRadius: '0.5rem',
                                            marginBottom: '0.125rem',
                                            border: isActive
                                                ? `1px solid ${s.border}`
                                                : '1px solid transparent',
                                            background: isActive
                                                ? s.accent
                                                : 'transparent',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'all 0.18s ease',
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: '1.75rem',
                                                height: '1.75rem',
                                                borderRadius: '0.4375rem',
                                                flexShrink: 0,
                                                background: isActive
                                                    ? s.accent
                                                    : isDone
                                                      ? 'rgba(34,197,94,0.12)'
                                                      : 'var(--color-surface-2)',
                                                border: `1px solid ${isActive ? s.border : isDone ? 'rgba(34,197,94,0.25)' : 'var(--color-glass-border)'}`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            {isDone ? (
                                                <span
                                                    style={{
                                                        fontSize:
                                                            'var(--text-xs)',
                                                        color: '#22c55e',
                                                    }}
                                                >
                                                    ✓
                                                </span>
                                            ) : (
                                                <SIcon
                                                    style={{
                                                        width: '0.8125rem',
                                                        height: '0.8125rem',
                                                        color: isActive
                                                            ? s.iconColor
                                                            : 'var(--color-text-faint)',
                                                    }}
                                                />
                                            )}
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <p
                                                style={{
                                                    fontSize: 'var(--text-xs)',
                                                    margin: 0,
                                                    lineHeight: 1.2,
                                                    fontWeight: isActive
                                                        ? 700
                                                        : 500,
                                                    color: isActive
                                                        ? 'var(--color-text)'
                                                        : isDone
                                                          ? 'var(--color-text-muted)'
                                                          : 'var(--color-text-faint)',
                                                }}
                                            >
                                                {s.label}
                                            </p>
                                            {isActive && (
                                                <p
                                                    style={{
                                                        fontSize:
                                                            'var(--text-4xs)',
                                                        color: s.iconColor,
                                                        fontWeight: 700,
                                                        letterSpacing: '0.15em',
                                                        textTransform:
                                                            'uppercase',
                                                        margin: '2px 0 0',
                                                    }}
                                                >
                                                    Active
                                                </p>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div
                            style={{
                                padding: '14px 20px 0',
                                borderTop:
                                    '1px solid var(--color-glass-border)',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: 6,
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 'var(--text-4xs)',
                                        fontWeight: 700,
                                        letterSpacing: '0.2em',
                                        color: 'var(--color-text-faint)',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    Progress
                                </span>
                                <span
                                    style={{
                                        fontSize: 'var(--text-4xs)',
                                        fontWeight: 700,
                                        color: 'var(--color-text-faint)',
                                        fontFamily: 'monospace',
                                    }}
                                >
                                    {step + 1}/{STEPS.length}
                                </span>
                            </div>
                            <div
                                style={{
                                    height: '0.1875rem',
                                    background: 'var(--color-glass-border)',
                                    borderRadius: 'var(--radius-full)',
                                    overflow: 'hidden',
                                }}
                            >
                                <div
                                    style={{
                                        height: '100%',
                                        width: `${((step + 1) / STEPS.length) * 100}%`,
                                        background: current.iconColor,
                                        borderRadius: 'var(--radius-full)',
                                        transition:
                                            'width 0.4s ease, background 0.4s ease',
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            opacity: contentVisible ? 1 : 0,
                            transform: contentVisible
                                ? 'translateX(0)'
                                : 'translateX(10px)',
                            transition:
                                'opacity 0.15s ease, transform 0.15s ease',
                        }}
                    >
                        <div
                            style={{
                                padding: '28px 36px 22px',
                                borderBottom:
                                    '1px solid var(--color-glass-border)',
                                flexShrink: 0,
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 24,
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <p
                                        style={{
                                            fontSize: 'var(--text-3xs)',
                                            fontWeight: 900,
                                            letterSpacing: '0.28em',
                                            color: current.iconColor,
                                            textTransform: 'uppercase',
                                            margin: '0 0 5px',
                                        }}
                                    >
                                        {current.tagline}
                                    </p>
                                    <h2
                                        style={{
                                            fontSize: 'var(--type-h2-size)',
                                            fontWeight: 800,
                                            color: 'var(--color-text)',
                                            margin: 0,
                                            letterSpacing: '-0.02em',
                                            lineHeight: 1.1,
                                        }}
                                    >
                                        {current.title}
                                    </h2>
                                </div>

                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '0.3125rem',
                                        paddingTop: 6,
                                    }}
                                >
                                    {STEPS.map((_, i) => (
                                        <div
                                            key={i}
                                            onClick={() => goToStep(i)}
                                            style={{
                                                width: i === step ? 22 : 7,
                                                height: '0.4375rem',
                                                borderRadius:
                                                    'var(--radius-full)',
                                                cursor: 'pointer',
                                                background:
                                                    i === step
                                                        ? current.iconColor
                                                        : i < step
                                                          ? 'var(--color-text-faint)'
                                                          : 'var(--color-glass-border)',
                                                transition: 'all 0.3s ease',
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <p
                                style={{
                                    fontSize: 'var(--text-15)',
                                    lineHeight: 1.7,
                                    color: 'var(--color-text-muted)',
                                    margin: '18px 0 0',
                                    maxWidth: 600,
                                }}
                            >
                                {current.description}
                            </p>
                        </div>

                        <div
                            style={{
                                flex: 1,
                                display: 'grid',
                                gridTemplateColumns: '15rem 1fr',
                                overflow: 'hidden',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '28px 24px',
                                    borderRight:
                                        '1px solid var(--color-glass-border)',
                                    background: 'var(--color-surface)',
                                }}
                            >
                                <Caricature
                                    faceFill={current.accent}
                                    faceBorder={current.border}
                                    imageSrc={current.caricatureImage}
                                    imageAlt={current.label}
                                />
                            </div>

                            <div
                                style={{
                                    flex: 1,
                                    overflowY: 'auto',
                                    padding: '22px 36px',
                                }}
                            >
                                <p
                                    style={{
                                        fontSize: 'var(--text-3xs)',
                                        fontWeight: 900,
                                        letterSpacing: '0.22em',
                                        color: 'var(--color-text-faint)',
                                        textTransform: 'uppercase',
                                        margin: '0 0 12px',
                                    }}
                                >
                                    How it works
                                </p>

                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 9,
                                    }}
                                >
                                    {current.details.map((d, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: '0.875rem',
                                                padding: '14px 18px',
                                                background:
                                                    'var(--color-surface)',
                                                border: '1px solid var(--color-glass-border)',
                                                borderLeft: `3px solid ${current.border}`,
                                                borderRadius: '0.625rem',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: 'var(--text-xl)',
                                                    flexShrink: 0,
                                                    lineHeight: 1.3,
                                                }}
                                            >
                                                {d.icon}
                                            </span>
                                            <div>
                                                <p
                                                    style={{
                                                        fontSize:
                                                            'var(--text-xs)',
                                                        fontWeight: 700,
                                                        color: 'var(--color-text)',
                                                        margin: '0 0 4px',
                                                        letterSpacing: '0.02em',
                                                    }}
                                                >
                                                    {d.heading}
                                                </p>
                                                <p
                                                    style={{
                                                        fontSize:
                                                            'var(--text-13)',
                                                        color: 'var(--color-text-muted)',
                                                        margin: 0,
                                                        lineHeight: 1.55,
                                                    }}
                                                >
                                                    {d.body}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div
                                    style={{
                                        marginTop: '0.875rem',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '0.75rem',
                                        padding: '14px 18px',
                                        background: current.accent,
                                        border: `1px solid ${current.border}`,
                                        borderRadius: '0.625rem',
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 'var(--type-h4-size)',
                                            flexShrink: 0,
                                            lineHeight: 1.3,
                                        }}
                                    >
                                        💡
                                    </span>
                                    <div>
                                        <p
                                            style={{
                                                fontSize: 'var(--text-3xs)',
                                                fontWeight: 900,
                                                letterSpacing: '0.2em',
                                                color: current.iconColor,
                                                textTransform: 'uppercase',
                                                margin: '0 0 4px',
                                            }}
                                        >
                                            Pro Tip
                                        </p>
                                        <p
                                            style={{
                                                fontSize: 'var(--text-13)',
                                                color: 'var(--color-text-muted)',
                                                margin: 0,
                                                lineHeight: 1.55,
                                            }}
                                        >
                                            {current.tip}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            style={{
                                padding: '14px 36px',
                                borderTop:
                                    '1px solid var(--color-glass-border)',
                                background: 'var(--color-glass)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexShrink: 0,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 'var(--text-2xs)',
                                    color: 'var(--color-text-faint)',
                                    fontFamily: 'monospace',
                                }}
                            >
                                Step {step + 1} of {STEPS.length} —{' '}
                                {current.label}
                            </span>

                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                }}
                            >
                                {step > 0 && (
                                    <button
                                        onClick={() => goToStep(step - 1)}
                                        style={{
                                            padding: '9px 18px',
                                            background: 'transparent',
                                            color: 'var(--color-text-faint)',
                                            border: '1px solid var(--color-glass-border)',
                                            borderRadius: '0.4375rem',
                                            fontSize: 'var(--text-2xs)',
                                            fontWeight: 700,
                                            letterSpacing: '0.1em',
                                            textTransform: 'uppercase',
                                            cursor: 'pointer',
                                            transition: 'all 0.18s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                            (
                                                e.currentTarget as HTMLElement
                                            ).style.color = 'var(--color-text)';
                                            (
                                                e.currentTarget as HTMLElement
                                            ).style.borderColor =
                                                'var(--color-text-muted)';
                                        }}
                                        onMouseLeave={(e) => {
                                            (
                                                e.currentTarget as HTMLElement
                                            ).style.color =
                                                'var(--color-text-faint)';
                                            (
                                                e.currentTarget as HTMLElement
                                            ).style.borderColor =
                                                'var(--color-glass-border)';
                                        }}
                                    >
                                        ← Back
                                    </button>
                                )}

                                <button
                                    onClick={handleNext}
                                    disabled={!canProceed}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '9px 24px',
                                        minWidth: '8.125rem',
                                        justifyContent: 'center',
                                        background: canProceed
                                            ? current.iconColor
                                            : 'var(--color-surface-2)',
                                        color: canProceed
                                            ? '#000'
                                            : 'var(--color-text-faint)',
                                        border: canProceed
                                            ? `1px solid ${current.iconColor}`
                                            : '1px solid var(--color-glass-border)',
                                        borderRadius: '0.4375rem',
                                        fontSize: 'var(--text-xs)',
                                        fontWeight: 800,
                                        letterSpacing: '0.12em',
                                        textTransform: 'uppercase',
                                        cursor: canProceed
                                            ? 'pointer'
                                            : 'not-allowed',
                                        transition: 'all 0.22s ease',
                                        boxShadow: canProceed
                                            ? `0 4px 18px ${current.accent}`
                                            : 'none',
                                    }}
                                >
                                    {!canProceed ? (
                                        <>
                                            <span
                                                style={{
                                                    display: 'inline-block',
                                                    width: '0.875rem',
                                                    height: '0.875rem',
                                                    border: '2px solid var(--color-glass-border)',
                                                    borderTopColor:
                                                        'var(--color-text-faint)',
                                                    borderRadius: '50%',
                                                    animation:
                                                        'tutSpin 0.75s linear infinite',
                                                }}
                                            />
                                            {countdown}s
                                        </>
                                    ) : isLast ? (
                                        <>Let&apos;s Go ✓</>
                                    ) : (
                                        <>
                                            Next{' '}
                                            <ChevronRight
                                                style={{
                                                    width: '0.875rem',
                                                    height: 14,
                                                }}
                                            />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
