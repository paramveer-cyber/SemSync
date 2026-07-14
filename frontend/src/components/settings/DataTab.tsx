import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertTriangle,
    Check,
    Download,
    ShieldAlert,
    Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { deleteAccount, exportUserData } from '../../lib/api';
import { SectionHeader } from './settingsHelpers';
import { getConfiguration, updateConfiguration } from '../../lib/localConfiguration';

export default function DataTab() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
    const [deleteTypeValue, setDeleteTypeValue] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const [exportLoading, setExportLoading] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);
    const [exportSuccess, setExportSuccess] = useState(false);

    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const DELETE_PHRASE = 'delete my account';

    const getLocalExportTimestamp = (): number | null => {
        return getConfiguration().lastExportTimestamp;
    };

    const buildCSV = (exportData: Record<string, any>): string => {
        const sections: string[] = [];

        sections.push('=== PROFILE ===');
        sections.push('Field,Value');
        Object.entries(exportData.profile ?? {}).forEach(([key, value]) => {
            sections.push(
                `${key},"${String(value ?? '').replace(/"/g, '""')}"`,
            );
        });

        sections.push('');
        sections.push('=== STATS ===');
        sections.push('Field,Value');
        Object.entries(exportData.stats ?? {}).forEach(([key, value]) => {
            sections.push(`${key},"${String(value ?? '')}"`);
        });

        sections.push('');
        sections.push('=== STREAKS ===');
        sections.push('Field,Value');
        Object.entries(exportData.streaks ?? {}).forEach(([key, value]) => {
            sections.push(`${key},"${String(value ?? '')}"`);
        });

        sections.push('');
        sections.push('=== COURSES & EVALUATIONS ===');
        (exportData.courses ?? []).forEach((course: any) => {
            sections.push('');
            sections.push(
                `Course,"${course.name}",Credits,${course.credits},Target Grade,${course.targetGrade},Archived,${course.isArchived},Created At,"${course.createdAt}"`,
            );
            sections.push('Title,Type,Date,Weightage,Max Score,Score');
            (course.evaluations ?? []).forEach((evaluation: any) => {
                sections.push(
                    `"${evaluation.title}","${evaluation.type}","${evaluation.date}",${evaluation.weightage},${evaluation.maxScore},${evaluation.score ?? ''}`,
                );
            });
        });

        sections.push('');
        sections.push('=== ACHIEVEMENTS ===');
        sections.push('Achievement ID,Tier,XP Awarded,Earned At');
        (exportData.achievements ?? []).forEach((achievement: any) => {
            sections.push(
                `"${achievement.achievementId}","${achievement.tier}",${achievement.xpAwarded},"${achievement.earnedAt}"`,
            );
        });

        sections.push('');
        sections.push('=== DAILY GOALS ===');
        sections.push('Date,Type,Title,Target Value,Status,XP Reward');
        (exportData.dailyGoals ?? []).forEach((goal: any) => {
            sections.push(
                `"${goal.date}","${goal.type}","${goal.title}",${goal.targetValue},"${goal.status}",${goal.xpReward}`,
            );
        });

        sections.push('');
        sections.push('=== RECENT EVENTS (last 500) ===');
        sections.push('Type,Occurred At,Metadata');
        (exportData.recentEvents ?? []).forEach((event: any) => {
            sections.push(
                `"${event.type}","${event.occurredAt}","${JSON.stringify(event.metadata).replace(/"/g, '""')}"`,
            );
        });

        return sections.join('\n');
    };

    const handleExportData = async () => {
        setExportError(null);
        setExportSuccess(false);

        const localTimestamp = getLocalExportTimestamp();
        if (localTimestamp && Date.now() - localTimestamp < SEVEN_DAYS_MS) {
            const nextAllowed = new Date(localTimestamp + SEVEN_DAYS_MS);
            setExportError(
                `Export available once every 7 days. Next allowed: ${nextAllowed.toDateString()}`,
            );
            return;
        }

        setExportLoading(true);
        try {
            const exportData = await exportUserData();
            const csvContent = buildCSV(exportData);
            const csvBlob = new Blob([csvContent], {
                type: 'text/csv;charset=utf-8;',
            });
            const downloadUrl = URL.createObjectURL(csvBlob);
            const anchor = document.createElement('a');
            anchor.href = downloadUrl;
            anchor.download = `semsync-export-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            URL.revokeObjectURL(downloadUrl);
            updateConfiguration({ lastExportTimestamp: Date.now() });
            setExportSuccess(true);
            setTimeout(() => setExportSuccess(false), 4000);
        } catch (err: any) {
            setExportError(
                err.message ?? 'Failed to export data. Please try again.',
            );
        } finally {
            setExportLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setDeleteLoading(true);
        setDeleteError(null);
        try {
            localStorage.clear();
            await deleteAccount();
            logout();
            navigate('/');
        } catch (err: any) {
            setDeleteError(
                err.message ?? 'Failed to delete account. Please try again.',
            );
            setDeleteLoading(false);
        }
    };

    return (
        <div
            className='p-6'
            style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                maxWidth: '68.75rem',
            }}
        >
            {/* export data */}
            <div
                style={{
                    gridColumn: 'span 2',
                    border: '1px solid var(--color-glass-border)',
                    borderRadius: '0.625rem',
                    overflow: 'hidden',
                }}
            >
                <SectionHeader
                    icon={Download}
                    title='Export Data'
                    color='#34d399'
                />
                <div
                    className='px-5 py-5'
                    style={{ background: 'var(--color-surface-1)' }}
                >
                    <div className='flex items-start justify-between gap-6'>
                        <div style={{ flex: 1 }}>
                            <p
                                className='text-sm font-semibold'
                                style={{ color: 'var(--color-text)' }}
                            >
                                Download Your Data
                            </p>
                            <p
                                className='text-xs mt-1'
                                style={{
                                    color: 'var(--color-text-muted)',
                                    lineHeight: 1.6,
                                }}
                            >
                                Export a full copy of your SemSync data as a
                                JSON file — courses, evaluations, achievements,
                                streaks, focus stats, and daily goals. To
                                prevent abuse, exports are limited to{' '}
                                <span
                                    style={{
                                        color: 'var(--color-text)',
                                        fontWeight: 600,
                                    }}
                                >
                                    once every 7 days
                                </span>
                                .
                            </p>
                            {exportError && (
                                <p
                                    className='text-xs mt-2'
                                    style={{ color: '#f87171' }}
                                >
                                    {exportError}
                                </p>
                            )}
                            {exportSuccess && (
                                <p
                                    className='text-xs mt-2 flex items-center gap-1.5'
                                    style={{ color: '#34d399' }}
                                >
                                    <Check
                                        style={{
                                            width: '0.75rem',
                                            height: '0.75rem',
                                        }}
                                    />
                                    Export downloaded successfully.
                                </p>
                            )}
                        </div>
                        <button
                            onClick={handleExportData}
                            disabled={exportLoading}
                            className='shrink-0 flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wide cursor-pointer transition-all duration-150'
                            style={{
                                background: exportLoading
                                    ? 'var(--color-glass)'
                                    : 'rgba(52,211,153,0.1)',
                                color: exportLoading
                                    ? 'var(--color-text-muted)'
                                    : '#34d399',
                                border: exportLoading
                                    ? '1px solid var(--color-glass-border)'
                                    : '1px solid rgba(52,211,153,0.35)',
                                borderRadius: '0.4375rem',
                                whiteSpace: 'nowrap',
                                cursor: exportLoading
                                    ? 'not-allowed'
                                    : 'pointer',
                            }}
                            onMouseEnter={(e) => {
                                if (!exportLoading)
                                    (
                                        e.currentTarget as HTMLElement
                                    ).style.background = 'rgba(52,211,153,0.2)';
                            }}
                            onMouseLeave={(e) => {
                                if (!exportLoading)
                                    (
                                        e.currentTarget as HTMLElement
                                    ).style.background = 'rgba(52,211,153,0.1)';
                            }}
                        >
                            {exportLoading ? (
                                <>
                                    <svg
                                        className='animate-spin'
                                        style={{
                                            width: '0.75rem',
                                            height: '0.75rem',
                                        }}
                                        viewBox='0 0 24 24'
                                        fill='none'
                                    >
                                        <circle
                                            cx='12'
                                            cy='12'
                                            r='10'
                                            stroke='currentColor'
                                            strokeWidth='3'
                                            strokeOpacity='0.3'
                                        />
                                        <path
                                            d='M12 2a10 10 0 0 1 10 10'
                                            stroke='currentColor'
                                            strokeWidth='3'
                                            strokeLinecap='round'
                                        />
                                    </svg>
                                    Exporting…
                                </>
                            ) : (
                                <>
                                    <Download
                                        style={{
                                            width: '0.8125rem',
                                            height: '0.8125rem',
                                        }}
                                    />
                                    Export Data
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* delete account */}
            <div
                style={{
                    gridColumn: 'span 2',
                    border: '1px solid rgba(239,68,68,0.25)',
                    borderRadius: '0.625rem',
                    overflow: 'hidden',
                }}
            >
                <div
                    className='flex items-center gap-3 px-5 py-3.5'
                    style={{
                        borderBottom: '1px solid rgba(239,68,68,0.2)',
                        background: 'rgba(239,68,68,0.05)',
                    }}
                >
                    <div
                        className='w-1 self-stretch rounded-full'
                        style={{ background: '#ef4444' }}
                    />
                    <ShieldAlert
                        className='w-4 h-4'
                        style={{ color: '#ef4444' }}
                    />
                    <h3
                        className='text-sm font-bold tracking-wide'
                        style={{ color: 'var(--color-text)' }}
                    >
                        Danger Zone
                    </h3>
                </div>

                <div
                    className='px-5 py-5'
                    style={{ background: 'var(--color-surface-1)' }}
                >
                    {deleteStep === 0 && (
                        <div className='flex items-start justify-between gap-6'>
                            <div>
                                <p
                                    className='text-sm font-semibold'
                                    style={{
                                        color: 'var(--color-text)',
                                    }}
                                >
                                    Delete Account
                                </p>
                                <p
                                    className='text-xs mt-1'
                                    style={{
                                        color: 'var(--color-text-muted)',
                                        lineHeight: 1.6,
                                    }}
                                >
                                    Permanently delete your account and all
                                    associated data — courses, evaluations,
                                    classroom cache, and settings. This cannot
                                    be undone.
                                </p>
                            </div>
                            <button
                                onClick={() => setDeleteStep(1)}
                                className='shrink-0 flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wide cursor-pointer transition-all duration-150'
                                style={{
                                    background: 'rgba(239,68,68,0.08)',
                                    color: '#f87171',
                                    border: '1px solid rgba(239,68,68,0.3)',
                                    borderRadius: '0.4375rem',
                                    whiteSpace: 'nowrap',
                                }}
                                onMouseEnter={(e) => {
                                    (
                                        e.currentTarget as HTMLElement
                                    ).style.background = 'rgba(239,68,68,0.18)';
                                }}
                                onMouseLeave={(e) => {
                                    (
                                        e.currentTarget as HTMLElement
                                    ).style.background = 'rgba(239,68,68,0.08)';
                                }}
                            >
                                <Trash2
                                    style={{
                                        width: '0.8125rem',
                                        height: 13,
                                    }}
                                />
                                Delete Account
                            </button>
                        </div>
                    )}

                    {deleteStep === 1 && (
                        <div
                            style={{
                                background: 'rgba(239,68,68,0.06)',
                                border: '1px solid rgba(239,68,68,0.25)',
                                borderRadius: '0.5625rem',
                                padding: '16px 20px',
                            }}
                        >
                            <div className='flex items-start gap-3 mb-4'>
                                <AlertTriangle
                                    className='w-5 h-5 shrink-0 mt-0.5'
                                    style={{ color: '#f87171' }}
                                />
                                <div>
                                    <p
                                        className='text-sm font-bold mb-1'
                                        style={{ color: '#f87171' }}
                                    >
                                        Are you absolutely sure?
                                    </p>
                                    <p
                                        className='text-xs'
                                        style={{
                                            color: 'var(--color-text-muted)',
                                            lineHeight: 1.7,
                                        }}
                                    >
                                        This will permanently delete{' '}
                                        <span
                                            style={{
                                                color: 'var(--color-text)',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {user?.name}'s
                                        </span>{' '}
                                        account and erase all data:
                                    </p>
                                    <ul
                                        className='text-xs mt-2 space-y-0.5'
                                        style={{
                                            color: 'var(--color-text-muted)',
                                            paddingLeft: '1rem',
                                            listStyleType: 'disc',
                                        }}
                                    >
                                        <li>All courses &amp; evaluations</li>
                                        <li>
                                            Classroom cache &amp; synced data
                                        </li>
                                        <li>
                                            Account preferences &amp; settings
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <div className='flex gap-3'>
                                <button
                                    onClick={() => setDeleteStep(0)}
                                    className='flex-1 py-2 text-xs font-semibold cursor-pointer transition-all duration-150'
                                    style={{
                                        background: 'var(--color-glass)',
                                        color: 'var(--color-text-muted)',
                                        border: '1px solid var(--color-glass-border)',
                                        borderRadius: '0.4375rem',
                                    }}
                                >
                                    No, keep my account
                                </button>
                                <button
                                    onClick={() => setDeleteStep(2)}
                                    className='flex-1 py-2 text-xs font-bold uppercase tracking-wide cursor-pointer transition-all duration-150'
                                    style={{
                                        background: 'rgba(239,68,68,0.15)',
                                        color: '#f87171',
                                        border: '1px solid rgba(239,68,68,0.4)',
                                        borderRadius: '0.4375rem',
                                    }}
                                    onMouseEnter={(e) => {
                                        (
                                            e.currentTarget as HTMLElement
                                        ).style.background =
                                            'rgba(239,68,68,0.28)';
                                    }}
                                    onMouseLeave={(e) => {
                                        (
                                            e.currentTarget as HTMLElement
                                        ).style.background =
                                            'rgba(239,68,68,0.15)';
                                    }}
                                >
                                    Yes, I want to delete
                                </button>
                            </div>
                        </div>
                    )}

                    {deleteStep === 2 && (
                        <div
                            style={{
                                background: 'rgba(239,68,68,0.06)',
                                border: '1px solid rgba(239,68,68,0.3)',
                                borderRadius: '0.5625rem',
                                padding: '16px 20px',
                            }}
                        >
                            <div className='flex items-center gap-2 mb-3'>
                                <AlertTriangle
                                    className='w-4 h-4'
                                    style={{ color: '#f87171' }}
                                />
                                <p
                                    className='text-sm font-bold'
                                    style={{ color: '#f87171' }}
                                >
                                    Final confirmation required
                                </p>
                            </div>
                            <p
                                className='text-xs mb-3'
                                style={{
                                    color: 'var(--color-text-muted)',
                                    lineHeight: 1.7,
                                }}
                            >
                                To confirm deletion, type{' '}
                                <code
                                    style={{
                                        fontFamily: 'monospace',
                                        fontSize: 'var(--text-xs)',
                                        fontWeight: 700,
                                        color: '#f87171',
                                        background: 'rgba(239,68,68,0.12)',
                                        padding: '1px 6px',
                                        borderRadius: '0.25rem',
                                        border: '1px solid rgba(239,68,68,0.25)',
                                        userSelect: 'all',
                                    }}
                                >
                                    {DELETE_PHRASE}
                                </code>{' '}
                                below:
                            </p>
                            <input
                                type='text'
                                value={deleteTypeValue}
                                onChange={(e) => {
                                    setDeleteTypeValue(e.target.value);
                                    setDeleteError(null);
                                }}
                                placeholder={DELETE_PHRASE}
                                autoFocus
                                spellCheck={false}
                                style={{
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    padding: '9px 12px',
                                    borderRadius: '0.4375rem',
                                    fontSize: 'var(--text-13)',
                                    fontFamily: 'monospace',
                                    background: 'var(--color-surface-2)',
                                    border:
                                        deleteTypeValue &&
                                        deleteTypeValue !== DELETE_PHRASE
                                            ? '1px solid rgba(239,68,68,0.5)'
                                            : deleteTypeValue === DELETE_PHRASE
                                              ? '1px solid rgba(34,197,94,0.5)'
                                              : '1px solid var(--color-glass-border)',
                                    color: 'var(--color-text)',
                                    outline: 'none',
                                    marginBottom: '0.75rem',
                                    transition: 'border-color 0.15s',
                                }}
                            />
                            {deleteError && (
                                <p
                                    className='text-xs mb-3'
                                    style={{ color: '#f87171' }}
                                >
                                    {deleteError}
                                </p>
                            )}
                            <div className='flex gap-3'>
                                <button
                                    onClick={() => {
                                        setDeleteStep(0);
                                        setDeleteTypeValue('');
                                        setDeleteError(null);
                                    }}
                                    className='flex-1 py-2 text-xs font-semibold cursor-pointer'
                                    style={{
                                        background: 'var(--color-glass)',
                                        color: 'var(--color-text-muted)',
                                        border: '1px solid var(--color-glass-border)',
                                        borderRadius: '0.4375rem',
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={
                                        deleteTypeValue !== DELETE_PHRASE ||
                                        deleteLoading
                                    }
                                    className='flex-1 py-2 text-xs font-bold uppercase tracking-wide cursor-pointer transition-all duration-150 flex items-center justify-center gap-2'
                                    style={{
                                        background:
                                            deleteTypeValue === DELETE_PHRASE &&
                                            !deleteLoading
                                                ? '#dc2626'
                                                : 'rgba(239,68,68,0.12)',
                                        color:
                                            deleteTypeValue === DELETE_PHRASE &&
                                            !deleteLoading
                                                ? '#fff'
                                                : 'rgba(239,68,68,0.4)',
                                        border: '1px solid rgba(239,68,68,0.4)',
                                        borderRadius: '0.4375rem',
                                        cursor:
                                            deleteTypeValue !== DELETE_PHRASE ||
                                            deleteLoading
                                                ? 'not-allowed'
                                                : 'pointer',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {deleteLoading ? (
                                        <>
                                            <svg
                                                className='animate-spin'
                                                style={{
                                                    width: '0.75rem',
                                                    height: '0.75rem',
                                                }}
                                                viewBox='0 0 24 24'
                                                fill='none'
                                            >
                                                <circle
                                                    cx='12'
                                                    cy='12'
                                                    r='10'
                                                    stroke='currentColor'
                                                    strokeWidth='3'
                                                    strokeOpacity='0.3'
                                                />
                                                <path
                                                    d='M12 2a10 10 0 0 1 10 10'
                                                    stroke='currentColor'
                                                    strokeWidth='3'
                                                    strokeLinecap='round'
                                                />
                                            </svg>
                                            Deleting…
                                        </>
                                    ) : (
                                        <>
                                            <Trash2
                                                style={{
                                                    width: '0.75rem',
                                                    height: '0.75rem',
                                                }}
                                            />
                                            Delete Forever
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
