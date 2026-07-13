import { useState } from 'react';
import { Bell, BellOff, PlayCircle, Sparkles } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useAnimationPreference } from '../../context/AnimationPreferenceContext';
import OnboardingTutorial, {
    resetTutorial,
} from '../../components/OnboardingTutorial';
import { SectionHeader, Toggle } from './settingsHelpers';

export default function PreferencesTab() {
    const { settings, updateSettings, permission, requestPermission } =
        useNotifications();
    const { animationsEnabled, setAnimationsEnabled } =
        useAnimationPreference();
    const [showTutorial, setShowTutorial] = useState(false);

    const handleReplayTutorial = () => {
        resetTutorial();
        setShowTutorial(true);
    };

    return (
        <>
            <div
                className='p-6'
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem',
                    maxWidth: '68.75rem',
                }}
            >
                {/* deadline reminders */}
                <div
                    style={{
                        border: '1px solid var(--color-glass-border)',
                        borderRadius: '0.625rem',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <SectionHeader
                        icon={Bell}
                        title='Deadline Reminders'
                        color='var(--color-warn)'
                    />
                    <div
                        className='px-5 py-4 space-y-4'
                        style={{
                            background: 'var(--color-surface-1)',
                            flex: 1,
                        }}
                    >
                        <div className='flex items-center justify-between'>
                            <div>
                                <p
                                    className='text-sm font-medium'
                                    style={{ color: 'var(--color-text)' }}
                                >
                                    Enable Reminders
                                </p>
                                <p
                                    className='text-xs mt-0.5'
                                    style={{
                                        color: 'var(--color-text-muted)',
                                    }}
                                >
                                    Get notified before upcoming evaluations
                                </p>
                            </div>
                            <Toggle
                                on={settings.enabled}
                                onChange={(v) => updateSettings({ enabled: v })}
                            />
                        </div>

                        {permission !== 'granted' &&
                            permission !== 'unsupported' && (
                                <div
                                    className='flex items-start gap-3 px-4 py-3'
                                    style={{
                                        background: 'rgba(245,158,11,0.07)',
                                        border: '1px solid rgba(245,158,11,0.25)',
                                        borderRadius: '0.4375rem',
                                    }}
                                >
                                    <BellOff
                                        className='w-4 h-4 mt-0.5 shrink-0'
                                        style={{ color: '#f59e0b' }}
                                    />
                                    <div className='flex-1'>
                                        <p
                                            className='text-xs font-semibold mb-1'
                                            style={{ color: '#fbbf24' }}
                                        >
                                            Browser notifications{' '}
                                            {permission === 'denied'
                                                ? 'blocked'
                                                : 'not enabled'}
                                        </p>
                                        <p
                                            className='text-xs mb-2'
                                            style={{
                                                color: 'var(--color-text-muted)',
                                            }}
                                        >
                                            {permission === 'denied'
                                                ? 'Enable them in your browser site settings.'
                                                : 'Allow notifications to get alerts when the tab is in background.'}
                                        </p>
                                        {permission !== 'denied' && (
                                            <button
                                                onClick={requestPermission}
                                                className='px-4 py-1.5 text-xs font-bold uppercase tracking-wide cursor-pointer transition-all duration-150'
                                                style={{
                                                    background:
                                                        'rgba(245,158,11,0.15)',
                                                    color: '#f59e0b',
                                                    border: '1px solid rgba(245,158,11,0.35)',
                                                    borderRadius: '0.3125rem',
                                                }}
                                                onMouseEnter={(e) => {
                                                    (
                                                        e.currentTarget as HTMLElement
                                                    ).style.background =
                                                        'rgba(245,158,11,0.28)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    (
                                                        e.currentTarget as HTMLElement
                                                    ).style.background =
                                                        'rgba(245,158,11,0.15)';
                                                }}
                                            >
                                                Enable Browser Notifications
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                        <div
                            className='space-y-2'
                            style={{
                                opacity: settings.enabled ? 1 : 0.4,
                                pointerEvents: settings.enabled
                                    ? 'auto'
                                    : 'none',
                                transition: 'opacity 0.2s',
                            }}
                        >
                            {(
                                [
                                    {
                                        key: 'at6h',
                                        label: 'Remind 6 hours before',
                                        sub: 'Tight deadline alert — fires ~6h out',
                                    },
                                    {
                                        key: 'at12h',
                                        label: 'Remind 12 hours before',
                                        sub: 'Half-day warning before deadline',
                                    },
                                    {
                                        key: 'at24h',
                                        label: 'Remind 24 hours before',
                                        sub: 'Day-before nudge to start preparing',
                                    },
                                    {
                                        key: 'at48h',
                                        label: 'Remind 48 hours before',
                                        sub: 'Two-day heads-up for bigger tasks',
                                    },
                                ] as const
                            ).map((w) => (
                                <div
                                    key={w.key}
                                    className='flex items-center justify-between px-3 py-2.5 transition-colors'
                                    style={{
                                        border: '1px solid var(--color-glass-border)',
                                        borderRadius: '0.4375rem',
                                        background: settings[w.key]
                                            ? 'var(--color-active-bg)'
                                            : 'transparent',
                                    }}
                                >
                                    <div>
                                        <p
                                            className='text-sm font-medium'
                                            style={{
                                                color: 'var(--color-text)',
                                            }}
                                        >
                                            {w.label}
                                        </p>
                                        <p
                                            className='text-xs mt-0.5'
                                            style={{
                                                color: 'var(--color-text-muted)',
                                            }}
                                        >
                                            {w.sub}
                                        </p>
                                    </div>
                                    <Toggle
                                        on={settings[w.key]}
                                        onChange={(v) =>
                                            updateSettings({
                                                [w.key]: v,
                                            } as any)
                                        }
                                    />
                                </div>
                            ))}
                        </div>

                        <p
                            className='text-xs'
                            style={{ color: 'var(--color-text-faint)' }}
                        >
                            SemSync checks for upcoming deadlines every 5
                            minutes while the app is open.
                        </p>
                    </div>
                </div>

                {/* animations */}
                <div
                    style={{
                        gridColumn: 'span 2',
                        border: '1px solid var(--color-glass-border)',
                        borderRadius: '0.625rem',
                        overflow: 'hidden',
                    }}
                >
                    <SectionHeader
                        icon={Sparkles}
                        title='Animations'
                        color='#818cf8'
                    />
                    <div
                        className='px-5 py-4 flex items-center justify-between'
                        style={{ background: 'var(--color-surface-1)' }}
                    >
                        <div style={{ maxWidth: '34rem' }}>
                            <p
                                className='text-sm font-medium'
                                style={{ color: 'var(--color-text)' }}
                            >
                                Enable Animations
                            </p>
                            <p
                                className='text-xs mt-0.5'
                                style={{ color: 'var(--color-text-muted)' }}
                            >
                                Although we have tried to optimize the
                                animations as best as we can, if you still face
                                any issues you may disable animations across the
                                website.
                            </p>
                        </div>
                        <Toggle
                            on={animationsEnabled}
                            onChange={setAnimationsEnabled}
                        />
                    </div>
                </div>

                {/* app guide */}
                <div
                    style={{
                        gridColumn: 'span 2',
                        border: '1px solid var(--color-glass-border)',
                        borderRadius: '0.625rem',
                        overflow: 'hidden',
                    }}
                >
                    <SectionHeader
                        icon={PlayCircle}
                        title='App Guide'
                        color='#818cf8'
                    />
                    <div
                        className='px-5 py-4 flex items-center justify-between'
                        style={{ background: 'var(--color-surface-1)' }}
                    >
                        <div>
                            <p
                                className='text-sm font-medium'
                                style={{ color: 'var(--color-text)' }}
                            >
                                How to Use SemSync
                            </p>
                            <p
                                className='text-xs mt-0.5'
                                style={{ color: 'var(--color-text-muted)' }}
                            >
                                Replay the onboarding walkthrough — covers every
                                section of the app
                            </p>
                        </div>
                        <button
                            onClick={handleReplayTutorial}
                            className='flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-widest cursor-pointer transition-all duration-150'
                            style={{
                                background: 'rgba(129,140,248,0.12)',
                                color: '#818cf8',
                                border: '1px solid rgba(129,140,248,0.35)',
                                borderRadius: '0.4375rem',
                            }}
                            onMouseEnter={(e) => {
                                (
                                    e.currentTarget as HTMLElement
                                ).style.background = 'rgba(129,140,248,0.24)';
                                (
                                    e.currentTarget as HTMLElement
                                ).style.boxShadow =
                                    '0 4px 14px rgba(129,140,248,0.2)';
                            }}
                            onMouseLeave={(e) => {
                                (
                                    e.currentTarget as HTMLElement
                                ).style.background = 'rgba(129,140,248,0.12)';
                                (
                                    e.currentTarget as HTMLElement
                                ).style.boxShadow = 'none';
                            }}
                        >
                            <PlayCircle
                                style={{ width: '0.875rem', height: 14 }}
                            />
                            Replay Tutorial
                        </button>
                    </div>
                </div>
            </div>
            {showTutorial && (
                <OnboardingTutorial onClose={() => setShowTutorial(false)} />
            )}
        </>
    );
}
