import { useState } from 'react';
import { Check, Moon, Pencil, Sun, Trash2, X } from 'lucide-react';
import { buildCustomThemeVars } from '../../data/Themes';

export function Toggle({
    on,
    onChange,
}: {
    on: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <button
            onClick={() => onChange(!on)}
            className='relative flex items-center shrink-0 transition-all duration-200'
            style={{
                width: '2.75rem',
                minWidth: '2.75rem',
                height: '1.5rem',
                boxSizing: 'border-box',
                background: on
                    ? `linear-gradient(135deg,var(--color-brand),var(--color-brand-dim))`
                    : 'var(--color-glass)',
                border: on
                    ? '1px solid var(--color-brand)'
                    : '1px solid var(--color-glass-border)',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                boxShadow: on ? '0 0 10px var(--color-brand-glow)' : 'none',
            }}
        >
            <div
                className='absolute transition-all duration-200'
                style={{
                    width: '1rem',
                    height: '1rem',
                    borderRadius: 'var(--radius-full)',
                    background: on
                        ? 'var(--color-surface)'
                        : 'var(--color-text-muted)',
                    left: on ? 20 : 4,
                }}
            />
        </button>
    );
}

export function SectionHeader({
    icon: Icon,
    title,
    color,
}: {
    icon: any;
    title: string;
    color: string;
}) {
    return (
        <div
            className='flex items-center gap-3 px-5 py-3.5'
            style={{
                borderBottom: '1px solid var(--color-glass-border)',
                background: 'var(--color-glass)',
            }}
        >
            <div
                className='w-1 self-stretch rounded-full'
                style={{ background: color }}
            />
            <Icon className='w-4 h-4' style={{ color }} />
            <h3
                className='text-sm font-bold tracking-wide'
                style={{ color: 'var(--color-text)' }}
            >
                {title}
            </h3>
        </div>
    );
}

export function ThemeSwatch({
    name,
    dark,
    vars,
    selected,
    onClick,
    custom,
    onEdit,
    onDelete,
}: {
    themeId: string;
    name: string;
    dark: boolean;
    vars: Record<string, string>;
    selected: boolean;
    onClick: () => void;
    custom?: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
}) {
    const brand = vars['--color-brand'];
    const surface = vars['--color-surface'];
    const text = vars['--color-text'];

    return (
        <div
            style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
            }}
        >
            <button
                onClick={onClick}
                title={name}
                style={{
                    flex: 1,
                    padding: '8px 10px',
                    background: vars['--color-surface-1'],
                    border: selected
                        ? `2px solid ${brand}`
                        : `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    transition: 'all 0.15s',
                    boxShadow: selected ? `0 0 0 3px ${brand}33` : 'none',
                }}
            >
                <div
                    style={{
                        width: '1.75rem',
                        height: '1.75rem',
                        borderRadius: '0.375rem',
                        background: surface,
                        flexShrink: 0,
                        position: 'relative',
                        overflow: 'hidden',
                        border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '0.5625rem',
                            background: brand,
                            opacity: 0.85,
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            top: '0.3125rem',
                            left: '0.25rem',
                            width: '0.625rem',
                            height: '0.125rem',
                            borderRadius: '0.125rem',
                            background: text,
                            opacity: 0.5,
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            top: '0.5625rem',
                            left: '0.25rem',
                            width: '0.4375rem',
                            height: '0.125rem',
                            borderRadius: '0.125rem',
                            background: text,
                            opacity: 0.3,
                        }}
                    />
                </div>

                <div style={{ textAlign: 'left', flex: 1 }}>
                    <p
                        style={{
                            fontSize: 'var(--text-xs)',
                            fontWeight: 600,
                            color: text,
                            margin: 0,
                            lineHeight: 1.3,
                        }}
                    >
                        {name}
                    </p>
                    <p
                        style={{
                            fontSize: 'var(--text-3xs)',
                            color: `${text}88`,
                            margin: 0,
                            marginTop: '0.0625rem',
                        }}
                    >
                        {dark ? 'Dark' : 'Light'}
                        {custom ? ' · Custom' : ''}
                    </p>
                </div>

                {selected && (
                    <div
                        style={{
                            width: '1rem',
                            height: '1rem',
                            borderRadius: '50%',
                            background: brand,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <svg width='8' height='7' viewBox='0 0 8 7' fill='none'>
                            <path
                                d='M1 3.5L3 5.5L7 1'
                                stroke='white'
                                strokeWidth='1.4'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                            />
                        </svg>
                    </div>
                )}
            </button>

            {custom && (
                <div
                    style={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                >
                    {onEdit && (
                        <button
                            onClick={onEdit}
                            title='Edit theme'
                            style={{
                                width: '1.5rem',
                                height: '1.5rem',
                                borderRadius: '0.3125rem',
                                border: '1px solid var(--color-glass-border)',
                                background: 'var(--color-glass)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Pencil
                                style={{
                                    width: '0.6875rem',
                                    height: '0.6875rem',
                                    color: 'var(--color-text-muted)',
                                }}
                            />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={onDelete}
                            title='Delete theme'
                            style={{
                                width: '1.5rem',
                                height: '1.5rem',
                                borderRadius: '0.3125rem',
                                border: '1px solid rgba(239,68,68,0.3)',
                                background: 'rgba(239,68,68,0.07)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Trash2
                                style={{
                                    width: '0.6875rem',
                                    height: '0.6875rem',
                                    color: '#f87171',
                                }}
                            />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export function TypographyCard({
    name,
    headingFont,
    bodyFont,
    selected,
    onClick,
}: {
    name: string;
    headingFont: string;
    bodyFont: string;
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            title={name}
            style={{
                position: 'relative',
                padding: '10px 8px',
                background: 'var(--color-surface)',
                border: selected
                    ? '2px solid var(--color-brand)'
                    : '1px solid var(--color-glass-border)',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem',
                minHeight: '4.25rem',
                transition: 'all 0.15s',
                boxShadow: selected
                    ? '0 0 0 3px var(--color-brand-glow)'
                    : 'none',
            }}
        >
            <span
                style={{
                    fontFamily: headingFont,
                    fontWeight: 700,
                    fontSize: 'var(--type-h4-size)',
                    color: 'var(--color-text)',
                    lineHeight: 1,
                }}
            >
                Ag
            </span>
            <span
                style={{
                    fontFamily: bodyFont,
                    fontSize: 'var(--text-4xs)',
                    fontWeight: 600,
                    color: 'var(--color-text-muted)',
                    textAlign: 'center',
                    lineHeight: 1.2,
                }}
            >
                {name}
            </span>

            {selected && (
                <div
                    style={{
                        position: 'absolute',
                        top: '0.3125rem',
                        right: '0.3125rem',
                        width: '0.8125rem',
                        height: '0.8125rem',
                        borderRadius: '50%',
                        background: 'var(--color-brand)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <svg width='7' height='6' viewBox='0 0 8 7' fill='none'>
                        <path
                            d='M1 3.5L3 5.5L7 1'
                            stroke='white'
                            strokeWidth='1.4'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                        />
                    </svg>
                </div>
            )}
        </button>
    );
}

const PRESET_COLORS = [
    '#6366f1',
    '#8b5cf6',
    '#ec4899',
    '#f43f5e',
    '#ef4444',
    '#f97316',
    '#f59e0b',
    '#eab308',
    '#22c55e',
    '#14b8a6',
    '#06b6d4',
    '#3b82f6',
    '#a855f7',
    '#d946ef',
    '#94a3b8',
];

interface ThemeBuilderProps {
    editing?: {
        id: string;
        name: string;
        brandHex: string;
        dark: boolean;
    } | null;
    onSave: (name: string, brandHex: string, dark: boolean) => void;
    onCancel: () => void;
}

export function ThemeBuilder({ editing, onSave, onCancel }: ThemeBuilderProps) {
    const [name, setName] = useState(editing?.name ?? '');
    const [brandHex, setBrandHex] = useState(editing?.brandHex ?? '#6366f1');
    const [dark, setDark] = useState(editing?.dark ?? true);

    const previewVars = buildCustomThemeVars(brandHex, dark);
    const brand = previewVars['--color-brand'];
    const surface = previewVars['--color-surface'];
    const surf1 = previewVars['--color-surface-1'];
    const text = previewVars['--color-text'];
    const textMut = previewVars['--color-text-muted'];
    const border = previewVars['--color-glass-border'];
    const activeBg = previewVars['--color-active-bg'];

    const isValid = /^#[0-9a-fA-F]{6}$/.test(brandHex);

    return (
        <div
            style={{
                border: `1px solid ${brand}55`,
                borderRadius: '0.625rem',
                overflow: 'hidden',
                background: 'var(--color-surface-1)',
                boxShadow: `0 0 0 3px ${brand}18`,
            }}
        >
            <div
                style={{
                    padding: '10px 14px',
                    background: `${brand}0f`,
                    borderBottom: `1px solid ${brand}33`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <p
                    style={{
                        margin: 0,
                        fontSize: 'var(--text-xs)',
                        fontWeight: 700,
                        color: brand,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                    }}
                >
                    {editing ? 'Edit Theme' : 'New Custom Theme'}
                </p>
                <button
                    onClick={onCancel}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.125rem',
                    }}
                >
                    <X
                        style={{
                            width: '0.875rem',
                            height: '0.875rem',
                            color: 'var(--color-text-muted)',
                        }}
                    />
                </button>
            </div>

            <div
                style={{
                    padding: '14px 14px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                }}
            >
                <div>
                    <label
                        style={{
                            fontSize: 'var(--text-3xs)',
                            fontWeight: 600,
                            color: 'var(--color-text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.07em',
                            display: 'block',
                            marginBottom: '0.3125rem',
                        }}
                    >
                        Theme Name
                    </label>
                    <input
                        type='text'
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder='e.g. My Indigo Night'
                        maxLength={32}
                        style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '7px 10px',
                            borderRadius: '0.375rem',
                            fontSize: 'var(--text-xs)',
                            background: 'var(--color-surface-2)',
                            border: '1px solid var(--color-glass-border)',
                            color: 'var(--color-text)',
                            outline: 'none',
                        }}
                    />
                </div>

                <div>
                    <label
                        style={{
                            fontSize: 'var(--text-3xs)',
                            fontWeight: 600,
                            color: 'var(--color-text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.07em',
                            display: 'block',
                            marginBottom: '0.3125rem',
                        }}
                    >
                        Mode
                    </label>
                    <div style={{ display: 'flex', gap: 6 }}>
                        {([true, false] as const).map((isDark) => (
                            <button
                                key={String(isDark)}
                                onClick={() => setDark(isDark)}
                                style={{
                                    flex: 1,
                                    padding: '6px 0',
                                    borderRadius: '0.375rem',
                                    fontSize: 'var(--text-2xs)',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.3125rem',
                                    background:
                                        dark === isDark
                                            ? `${brand}18`
                                            : 'var(--color-glass)',
                                    border:
                                        dark === isDark
                                            ? `1px solid ${brand}`
                                            : '1px solid var(--color-glass-border)',
                                    color:
                                        dark === isDark
                                            ? brand
                                            : 'var(--color-text-muted)',
                                    transition: 'all 0.15s',
                                }}
                            >
                                {isDark ? (
                                    <Moon
                                        style={{
                                            width: '0.6875rem',
                                            height: 11,
                                        }}
                                    />
                                ) : (
                                    <Sun
                                        style={{
                                            width: '0.6875rem',
                                            height: 11,
                                        }}
                                    />
                                )}
                                {isDark ? 'Dark' : 'Light'}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label
                        style={{
                            fontSize: 'var(--text-3xs)',
                            fontWeight: 600,
                            color: 'var(--color-text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.07em',
                            display: 'block',
                            marginBottom: '0.3125rem',
                        }}
                    >
                        Accent Colour
                    </label>
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '0.3125rem',
                            marginBottom: '0.5rem',
                        }}
                    >
                        {PRESET_COLORS.map((hex) => (
                            <button
                                key={hex}
                                onClick={() => setBrandHex(hex)}
                                title={hex}
                                style={{
                                    width: '1.375rem',
                                    height: '1.375rem',
                                    borderRadius: '0.3125rem',
                                    background: hex,
                                    cursor: 'pointer',
                                    border:
                                        brandHex.toLowerCase() ===
                                        hex.toLowerCase()
                                            ? '2px solid var(--color-text)'
                                            : '2px solid transparent',
                                    transition: 'transform 0.1s',
                                    transform:
                                        brandHex.toLowerCase() ===
                                        hex.toLowerCase()
                                            ? 'scale(1.18)'
                                            : 'scale(1)',
                                    boxShadow:
                                        brandHex.toLowerCase() ===
                                        hex.toLowerCase()
                                            ? `0 0 0 1px ${hex}`
                                            : 'none',
                                }}
                            />
                        ))}
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            gap: '0.375rem',
                            alignItems: 'center',
                        }}
                    >
                        <input
                            type='color'
                            value={isValid ? brandHex : '#6366f1'}
                            onChange={(e) => setBrandHex(e.target.value)}
                            style={{
                                width: '2.125rem',
                                height: '1.75rem',
                                borderRadius: '0.3125rem',
                                border: '1px solid var(--color-glass-border)',
                                cursor: 'pointer',
                                padding: '0.125rem',
                                background: 'none',
                            }}
                        />
                        <input
                            type='text'
                            value={brandHex}
                            onChange={(e) => setBrandHex(e.target.value)}
                            placeholder='#6366f1'
                            maxLength={7}
                            style={{
                                flex: 1,
                                padding: '6px 9px',
                                borderRadius: '0.375rem',
                                fontSize: 'var(--text-2xs)',
                                background: 'var(--color-surface-2)',
                                border: `1px solid ${isValid ? 'var(--color-glass-border)' : '#ef4444'}`,
                                color: 'var(--color-text)',
                                outline: 'none',
                                fontFamily: 'monospace',
                            }}
                        />
                    </div>
                </div>

                <div>
                    <label
                        style={{
                            fontSize: 'var(--text-3xs)',
                            fontWeight: 600,
                            color: 'var(--color-text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.07em',
                            display: 'block',
                            marginBottom: '0.3125rem',
                        }}
                    >
                        Preview
                    </label>
                    <div
                        style={{
                            borderRadius: '0.5rem',
                            overflow: 'hidden',
                            border: `1px solid ${border}`,
                            background: surface,
                            fontSize: 'var(--text-2xs)',
                        }}
                    >
                        <div style={{ display: 'flex', height: 70 }}>
                            <div
                                style={{
                                    width: '2.25rem',
                                    background: dark
                                        ? 'rgba(3,3,3,0.98)'
                                        : 'rgba(255,255,255,0.98)',
                                    borderRight: `1px solid ${border}`,
                                    padding: '8px 6px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.25rem',
                                }}
                            >
                                {[brand, textMut, textMut].map((c, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            width: '1.25rem',
                                            height: '0.3125rem',
                                            borderRadius: '0.125rem',
                                            background:
                                                i === 0
                                                    ? activeBg
                                                    : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            paddingLeft: '0.125rem',
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: '0.3125rem',
                                                height: '0.3125rem',
                                                borderRadius: '50%',
                                                background: c,
                                                opacity: i === 0 ? 1 : 0.4,
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div
                                style={{
                                    flex: 1,
                                    background: surf1,
                                    padding: '8px 10px',
                                }}
                            >
                                <div
                                    style={{
                                        width: '60%',
                                        height: '0.3125rem',
                                        borderRadius: '0.125rem',
                                        background: brand,
                                        marginBottom: '0.375rem',
                                    }}
                                />
                                <div
                                    style={{
                                        width: '80%',
                                        height: '0.1875rem',
                                        borderRadius: '0.125rem',
                                        background: text,
                                        opacity: 0.3,
                                        marginBottom: '0.1875rem',
                                    }}
                                />
                                <div
                                    style={{
                                        width: '55%',
                                        height: '0.1875rem',
                                        borderRadius: '0.125rem',
                                        background: text,
                                        opacity: 0.2,
                                        marginBottom: '0.5rem',
                                    }}
                                />
                                <div
                                    style={{
                                        display: 'inline-block',
                                        padding: '3px 8px',
                                        borderRadius: '0.25rem',
                                        background: brand,
                                        fontSize: 'var(--text-4xs)',
                                        color: dark ? '#000' : '#fff',
                                        fontWeight: 700,
                                    }}
                                >
                                    Action
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                    <button
                        onClick={() => isValid && onSave(name, brandHex, dark)}
                        disabled={!isValid}
                        style={{
                            flex: 1,
                            padding: '8px 0',
                            borderRadius: '0.375rem',
                            fontSize: 'var(--text-2xs)',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.07em',
                            background: isValid ? brand : 'var(--color-glass)',
                            color: isValid
                                ? dark
                                    ? '#000'
                                    : '#fff'
                                : 'var(--color-text-muted)',
                            border: 'none',
                            cursor: isValid ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.3125rem',
                            transition: 'all 0.15s',
                        }}
                    >
                        <Check style={{ width: '0.75rem', height: 12 }} />
                        {editing ? 'Save Changes' : 'Create Theme'}
                    </button>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '8px 14px',
                            borderRadius: '0.375rem',
                            fontSize: 'var(--text-2xs)',
                            fontWeight: 600,
                            background: 'var(--color-glass)',
                            color: 'var(--color-text-muted)',
                            border: '1px solid var(--color-glass-border)',
                            cursor: 'pointer',
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
