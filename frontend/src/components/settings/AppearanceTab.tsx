import { useEffect, useState } from 'react';
import {
    Monitor,
    Moon,
    Palette,
    Pencil,
    Plus,
    Sparkles,
    Sun,
    Type,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { THEMES } from '../../data/Themes';
import { useTypography } from '../../context/TypographyContext';
import { experienceAchievement } from '../../lib/api';
import {
    SectionHeader,
    ThemeSwatch,
    TypographyCard,
    ThemeBuilder,
} from './settingsHelpers';

const PREVIEW_TIERS = [
    { id: 'bronze', label: 'Bronze', color: '#c0a8ff' },
    { id: 'silver', label: 'Silver', color: '#c0a8ff' },
    { id: 'gold', label: 'Gold', color: '#c0a8ff' },
    { id: 'platinum', label: 'Platinum', color: '#c0a8ff' },
    { id: 'legendary', label: 'Legendary', color: '#ff9a3c' },
    { id: 'hidden', label: 'Hidden', color: '#60a5fa' },
] as const;

export default function AppearanceTab() {
    const {
        theme,
        setTheme,
        customThemes,
        addCustomTheme,
        updateCustomTheme,
        deleteCustomTheme,
    } = useTheme();
    const {
        typography,
        setTypography,
        presets: typographyPresets,
    } = useTypography();
    const [builderMode, setBuilderMode] = useState<'create' | 'edit' | null>(
        null,
    );
    const [editingTheme, setEditingTheme] = useState<{
        id: string;
        name: string;
        brandHex: string;
        dark: boolean;
    } | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [modeFilter, setModeFilter] = useState<'dark' | 'light' | 'system'>(
        'dark',
    );
    const [previewTier, setPreviewTier] =
        useState<(typeof PREVIEW_TIERS)[number]['id']>('platinum');
    const [previewSending, setPreviewSending] = useState(false);

    const handleExperienceAchievement = async () => {
        setPreviewSending(true);
        try {
            await experienceAchievement(previewTier);
        } catch {}
        setPreviewSending(false);
    };

    useEffect(() => {
        const PREVIEW_LINK_ID = 'semsync-typography-preview-link';
        const families = Array.from(
            new Set(
                typographyPresets.flatMap((p) =>
                    p.googleFamilies.map((f) => f.split(':')[0]),
                ),
            ),
        );
        if (!families.length) return;
        const href = `https://fonts.googleapis.com/css2?${families
            .map((f) => `family=${f}:wght@700`)
            .join('&')}&display=swap`;
        const link = document.createElement('link');
        link.id = PREVIEW_LINK_ID;
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
        return () => {
            link.remove();
        };
    }, [typographyPresets]);

    const systemIsDark = window.matchMedia(
        '(prefers-color-scheme: dark)',
    ).matches;
    const effectiveDark =
        modeFilter === 'system' ? systemIsDark : modeFilter === 'dark';
    const visibleThemes = THEMES.filter((t) => t.dark === effectiveDark);

    const customDark = customThemes.filter((t) => t.dark);
    const customLight = customThemes.filter((t) => !t.dark);

    const handleSaveTheme = (name: string, brandHex: string, dark: boolean) => {
        if (builderMode === 'create') {
            const newTheme = addCustomTheme(name, brandHex, dark);
            setTheme(newTheme.id);
        } else if (builderMode === 'edit' && editingTheme) {
            updateCustomTheme(editingTheme.id, name, brandHex, dark);
        }
        setBuilderMode(null);
        setEditingTheme(null);
    };

    const handleEditTheme = (t: (typeof customThemes)[number]) => {
        setEditingTheme({
            id: t.id,
            name: t.name,
            brandHex: t.vars['--color-brand'],
            dark: t.dark,
        });
        setBuilderMode('edit');
    };

    const handleDeleteTheme = (id: string) => {
        if (deleteConfirm === id) {
            deleteCustomTheme(id);
            setDeleteConfirm(null);
        } else {
            setDeleteConfirm(id);
            setTimeout(
                () => setDeleteConfirm((c) => (c === id ? null : c)),
                3000,
            );
        }
    };

    return (
        <div
            className='p-6 grid grid-cols-1 sm:grid-cols-2'
            style={{
                gap: '0.75rem',
                maxWidth: '68.75rem',
            }}
        >
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
                    icon={Palette}
                    title='Appearance'
                    color='var(--color-brand)'
                />
                <div
                    className='px-5 py-4 space-y-4'
                    style={{
                        background: 'var(--color-surface-1)',
                        flex: 1,
                        overflowY: 'auto',
                    }}
                >
                    {/* mode picker */}
                    <div style={{ display: 'flex', gap: 4 }}>
                        {(
                            [
                                {
                                    id: 'dark',
                                    Icon: Moon,
                                    label: 'Dark',
                                },
                                {
                                    id: 'light',
                                    Icon: Sun,
                                    label: 'Light',
                                },
                                {
                                    id: 'system',
                                    Icon: Monitor,
                                    label: 'System',
                                },
                            ] as const
                        ).map(({ id, Icon, label }) => (
                            <button
                                key={id}
                                onClick={() => setModeFilter(id)}
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
                                    gap: '0.25rem',
                                    background:
                                        modeFilter === id
                                            ? 'var(--color-active-bg)'
                                            : 'var(--color-glass)',
                                    border:
                                        modeFilter === id
                                            ? '1px solid var(--color-brand)'
                                            : '1px solid var(--color-glass-border)',
                                    color:
                                        modeFilter === id
                                            ? 'var(--color-brand)'
                                            : 'var(--color-text-muted)',
                                    transition: 'all 0.15s',
                                }}
                            >
                                <Icon
                                    style={{
                                        width: '0.6875rem',
                                        height: 11,
                                    }}
                                />
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* filtered theme list */}
                    <div className='space-y-1.5'>
                        {visibleThemes.map((t) => (
                            <ThemeSwatch
                                key={t.id}
                                themeId={t.id}
                                name={t.name}
                                dark={t.dark}
                                vars={t.vars}
                                selected={theme.id === t.id}
                                onClick={() => setTheme(t.id)}
                            />
                        ))}
                    </div>

                    {/* custom themes — always visible */}
                    {customThemes.length > 0 && (
                        <div>
                            <div className='flex items-center gap-2 mb-2'>
                                <Pencil
                                    className='w-3 h-3'
                                    style={{
                                        color: 'var(--color-brand)',
                                    }}
                                />
                                <p
                                    className='text-xs font-semibold uppercase tracking-widest'
                                    style={{
                                        color: 'var(--color-brand)',
                                    }}
                                >
                                    Custom
                                </p>
                                <p
                                    className='text-xs font-semibold tracking-normal'
                                    style={{
                                        color: 'var(--color-brand-dim)',
                                    }}
                                >
                                    [All Colors are not configured, some might
                                    break!]
                                </p>
                            </div>
                            <div className='space-y-1.5'>
                                {customThemes.map((t) => (
                                    <ThemeSwatch
                                        key={t.id}
                                        themeId={t.id}
                                        name={t.name}
                                        dark={t.dark}
                                        vars={t.vars}
                                        selected={theme.id === t.id}
                                        onClick={() => setTheme(t.id)}
                                        custom
                                        onEdit={() => handleEditTheme(t)}
                                        onDelete={() => handleDeleteTheme(t.id)}
                                    />
                                ))}
                            </div>
                            {deleteConfirm && (
                                <p
                                    style={{
                                        fontSize: 'var(--text-3xs)',
                                        color: '#f87171',
                                        marginTop: '0.25rem',
                                        textAlign: 'right',
                                    }}
                                >
                                    Click 🗑️ again to confirm deletion
                                </p>
                            )}
                        </div>
                    )}

                    {builderMode ? (
                        <ThemeBuilder
                            editing={
                                builderMode === 'edit' ? editingTheme : null
                            }
                            onSave={handleSaveTheme}
                            onCancel={() => {
                                setBuilderMode(null);
                                setEditingTheme(null);
                            }}
                        />
                    ) : (
                        <button
                            onClick={() => setBuilderMode('create')}
                            style={{
                                width: '100%',
                                padding: '8px 0',
                                borderRadius: '0.5rem',
                                fontSize: 'var(--text-2xs)',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.07em',
                                background: 'var(--color-active-bg)',
                                color: 'var(--color-brand)',
                                border: '1px dashed var(--color-brand)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.3125rem',
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => {
                                (
                                    e.currentTarget as HTMLElement
                                ).style.background = 'var(--color-glass-hover)';
                            }}
                            onMouseLeave={(e) => {
                                (
                                    e.currentTarget as HTMLElement
                                ).style.background = 'var(--color-active-bg)';
                            }}
                        >
                            <Plus style={{ width: '0.75rem', height: 12 }} />
                            Create Custom Theme
                        </button>
                    )}
                </div>
            </div>

            <div
                style={{
                    border: '1px solid var(--color-glass-border)',
                    borderRadius: '0.625rem',
                    overflow: 'hidden',
                }}
            >
                <SectionHeader
                    icon={Type}
                    title='Typography'
                    color='var(--color-brand)'
                />
                <div
                    className='px-5 py-4 grid grid-cols-1 sm:grid-cols-2'
                    style={{
                        background: 'var(--color-surface-1)',
                        gap: '0.75rem',
                    }}
                >
                    {typographyPresets.map((p) => (
                        <TypographyCard
                            key={p.id}
                            name={p.name}
                            headingFont={p.headingFont}
                            bodyFont={p.bodyFont}
                            selected={typography.id === p.id}
                            onClick={() => setTypography(p.id)}
                        />
                    ))}
                </div>
            </div>

            <div
                className='sm:col-span-2'
                style={{
                    border: '1px solid var(--color-glass-border)',
                    borderRadius: '0.625rem',
                    overflow: 'hidden',
                }}
            >
                <SectionHeader
                    icon={Sparkles}
                    title='Achievement Preview'
                    color='var(--color-brand)'
                />
                <div
                    className='px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3'
                    style={{
                        background: 'var(--color-surface-1)',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 4,
                            flex: 1,
                        }}
                    >
                        {PREVIEW_TIERS.map(({ id, label, color }) => (
                            <button
                                key={id}
                                onClick={() => setPreviewTier(id)}
                                style={{
                                    flex: '1 1 5rem',
                                    padding: '6px 0',
                                    borderRadius: '0.375rem',
                                    fontSize: 'var(--text-2xs)',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    background:
                                        previewTier === id
                                            ? 'var(--color-active-bg)'
                                            : 'var(--color-glass)',
                                    border:
                                        previewTier === id
                                            ? `1px solid ${color}`
                                            : '1px solid var(--color-glass-border)',
                                    color:
                                        previewTier === id
                                            ? color
                                            : 'var(--color-text-muted)',
                                    transition: 'all 0.15s',
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleExperienceAchievement}
                        disabled={previewSending}
                        className='w-full sm:w-auto'
                        style={{
                            padding: '8px 16px',
                            borderRadius: '0.5rem',
                            fontSize: 'var(--text-2xs)',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.07em',
                            background: 'var(--color-active-bg)',
                            color: 'var(--color-brand)',
                            border: '1px dashed var(--color-brand)',
                            cursor: previewSending ? 'default' : 'pointer',
                            opacity: previewSending ? 0.6 : 1,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        Experience Achievement
                    </button>
                </div>
            </div>
        </div>
    );
}
