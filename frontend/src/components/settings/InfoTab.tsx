import { ExternalLink, Info, Lightbulb, Mail, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SectionHeader } from './settingsHelpers';

export default function InfoTab() {
    return (
        <div
            className='p-6 grid grid-cols-1 sm:grid-cols-2'
            style={{
                gap: '0.75rem',
                maxWidth: '68.75rem',
            }}
        >
            {/* about & legal */}
            <div
                className='sm:col-span-2'
                style={{
                    border: '1px solid var(--color-glass-border)',
                    borderRadius: '0.625rem',
                    overflow: 'hidden',
                }}
            >
                <SectionHeader
                    icon={Info}
                    title='About & Legal'
                    color='#38bdf8'
                />
                <div
                    className='grid grid-cols-1 sm:grid-cols-2'
                    style={{
                        background: 'var(--color-surface-1)',
                        gap: '0.0625rem',
                        backgroundColor: 'var(--color-glass-border)',
                    }}
                >
                    <Link
                        to='/about'
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '14px 20px',
                            background: 'var(--color-surface-1)',
                            textDecoration: 'none',
                            transition: 'background 0.12s',
                        }}
                        onMouseEnter={(e) =>
                            ((e.currentTarget as HTMLElement).style.background =
                                'var(--color-glass)')
                        }
                        onMouseLeave={(e) =>
                            ((e.currentTarget as HTMLElement).style.background =
                                'var(--color-surface-1)')
                        }
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                            }}
                        >
                            <div
                                style={{
                                    width: '2.125rem',
                                    height: '2.125rem',
                                    borderRadius: '0.5625rem',
                                    background: 'rgba(56,189,248,0.1)',
                                    border: '1px solid rgba(56,189,248,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Info
                                    style={{
                                        width: '0.9375rem',
                                        height: '0.9375rem',
                                        color: '#38bdf8',
                                    }}
                                />
                            </div>
                            <div>
                                <p
                                    style={{
                                        fontSize: 'var(--text-13)',
                                        fontWeight: 600,
                                        color: 'var(--color-text)',
                                        margin: 0,
                                    }}
                                >
                                    About SemSync
                                </p>
                                <p
                                    style={{
                                        fontSize: 'var(--text-2xs)',
                                        color: 'var(--color-text-muted)',
                                        margin: 0,
                                        marginTop: '0.125rem',
                                    }}
                                >
                                    What this app is
                                </p>
                            </div>
                        </div>
                        <ExternalLink
                            style={{
                                width: '0.8125rem',
                                height: '0.8125rem',
                                color: 'var(--color-text-faint)',
                            }}
                        />
                    </Link>

                    <Link
                        to='/legal'
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '14px 20px',
                            background: 'var(--color-surface-1)',
                            textDecoration: 'none',
                            transition: 'background 0.12s',
                        }}
                        onMouseEnter={(e) =>
                            ((e.currentTarget as HTMLElement).style.background =
                                'var(--color-glass)')
                        }
                        onMouseLeave={(e) =>
                            ((e.currentTarget as HTMLElement).style.background =
                                'var(--color-surface-1)')
                        }
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                            }}
                        >
                            <div
                                style={{
                                    width: '2.125rem',
                                    height: '2.125rem',
                                    borderRadius: '0.5625rem',
                                    background: 'rgba(148,163,184,0.1)',
                                    border: '1px solid rgba(148,163,184,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Scale
                                    style={{
                                        width: '0.9375rem',
                                        height: '0.9375rem',
                                        color: '#94a3b8',
                                    }}
                                />
                            </div>
                            <div>
                                <p
                                    style={{
                                        fontSize: 'var(--text-13)',
                                        fontWeight: 600,
                                        color: 'var(--color-text)',
                                        margin: 0,
                                    }}
                                >
                                    Legal & Privacy
                                </p>
                                <p
                                    style={{
                                        fontSize: 'var(--text-2xs)',
                                        color: 'var(--color-text-muted)',
                                        margin: 0,
                                        marginTop: '0.125rem',
                                    }}
                                >
                                    Terms of use, privacy policy & data
                                </p>
                            </div>
                        </div>
                        <ExternalLink
                            style={{
                                width: '0.8125rem',
                                height: '0.8125rem',
                                color: 'var(--color-text-faint)',
                            }}
                        />
                    </Link>
                </div>
            </div>

            {/* feature requests */}
            <div
                className='sm:col-span-2'
                style={{
                    border: '1px solid var(--color-glass-border)',
                    borderRadius: '0.625rem',
                    overflow: 'hidden',
                }}
            >
                <SectionHeader
                    icon={Lightbulb}
                    title='Feature Requests'
                    color='#f59e0b'
                />
                <div
                    style={{
                        background: 'var(--color-surface-1)',
                        padding: '20px 20px 24px',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            gap: '1.25rem',
                            alignItems: 'flex-start',
                        }}
                    >
                        <div
                            style={{
                                width: '2.75rem',
                                height: '2.75rem',
                                borderRadius: '0.6875rem',
                                background: 'rgba(245,158,11,0.1)',
                                border: '1px solid rgba(245,158,11,0.25)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                marginTop: '0.125rem',
                            }}
                        >
                            <Lightbulb
                                style={{
                                    width: '1.25rem',
                                    height: '1.25rem',
                                    color: '#f59e0b',
                                }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <p
                                style={{
                                    fontSize: 'var(--text-sm)',
                                    fontWeight: 700,
                                    color: 'var(--color-text)',
                                    margin: '0 0 6px',
                                }}
                            >
                                Got an idea to make SemSync better?
                            </p>
                            <p
                                style={{
                                    fontSize: 'var(--text-13)',
                                    color: 'var(--color-text-muted)',
                                    margin: '0 0 16px',
                                    lineHeight: 1.6,
                                }}
                            >
                                SemSync is built around what students actually
                                need. If there's a feature you'd find useful — a
                                new view, an integration, a workflow tweak —
                                send it over. Good ideas get built.
                            </p>
                            <a
                                href='mailto:paramveer25356@iiitd.ac.in?subject=Feature%20Request'
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.4375rem',
                                    padding: '9px 18px',
                                    borderRadius: '0.4375rem',
                                    textDecoration: 'none',
                                    background: 'rgba(245,158,11,0.1)',
                                    border: '1px solid rgba(245,158,11,0.3)',
                                    color: '#f59e0b',
                                    fontSize: 'var(--text-13)',
                                    fontWeight: 700,
                                    transition: 'all 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                    (
                                        e.currentTarget as HTMLElement
                                    ).style.background = 'rgba(245,158,11,0.2)';
                                    (
                                        e.currentTarget as HTMLElement
                                    ).style.boxShadow =
                                        '0 4px 14px rgba(245,158,11,0.15)';
                                }}
                                onMouseLeave={(e) => {
                                    (
                                        e.currentTarget as HTMLElement
                                    ).style.background = 'rgba(245,158,11,0.1)';
                                    (
                                        e.currentTarget as HTMLElement
                                    ).style.boxShadow = 'none';
                                }}
                            >
                                <Mail
                                    style={{
                                        width: '0.875rem',
                                        height: 14,
                                    }}
                                />
                                Send a Feature Request
                            </a>
                            <p
                                style={{
                                    fontSize: 'var(--text-2xs)',
                                    color: 'var(--color-text-faint)',
                                    margin: '10px 0 0',
                                }}
                            >
                                Opens your mail client
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
