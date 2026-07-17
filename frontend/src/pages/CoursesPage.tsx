import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import InfoTooltip from '../components/InfoTooltip';
import { TOOLTIP_CONTENT } from '../data/TooltipContent';
import AddCourseModal from '../components/modals/AddCourseModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import { deleteCourse } from '../lib/api';
import {
    fetchCourses,
    fetchArchivedCourses,
    invalidateAllCourseData,
} from '../lib/dataService';
import { Plus, AlertTriangle, Trash2, Archive } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const deleteStyle = {
    base: {
        background: 'rgba(239,68,68,0.10)',
        color: '#ef4444',
        border: '1px solid rgba(239,68,68,0.22)',
    },
    hover: { background: '#ef4444', color: '#fff', borderColor: '#ef4444' },
    leave: {
        background: 'rgba(239,68,68,0.10)',
        color: '#ef4444',
        borderColor: 'rgba(239,68,68,0.22)',
    },
};

export default function CoursesPage() {
    useDocumentTitle('Courses');
    const [tab, setTab] = useState<'active' | 'past'>('active');
    const [courses, setCourses] = useState<any[]>([]);
    const [archived, setArchived] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<{
        id: string;
        name: string;
    } | null>(null);

    const loadActive = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const c = await fetchCourses();
            setCourses(c);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadArchived = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const c = await fetchArchivedCourses();
            setArchived(c);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadActive();
    }, [loadActive]);
    useEffect(() => {
        if (tab === 'past') loadArchived();
    }, [tab, loadArchived]);

    const handleDelete = useCallback(
        async (id: string) => {
            setDeleting(id);
            try {
                await deleteCourse(id);
                invalidateAllCourseData();
                if (tab === 'active')
                    setCourses((p) => p.filter((c) => c.id !== id));
                else setArchived((p) => p.filter((c) => c.id !== id));
            } catch (err: any) {
                alert('Failed: ' + err.message);
                throw err;
            } finally {
                setDeleting(null);
            }
        },
        [tab],
    );

    const displayList = useMemo(
        () => (tab === 'active' ? courses : archived),
        [tab, courses, archived],
    );

    const nodeCount = tab === 'active' ? courses.length : archived.length;

    return (
        <>
            <div className='grow flex flex-col'>
                <Header title='Academic Tracks' subtitle='Directory_V2.0' />
                <div className='p-4 sm:p-8 lg:p-12'>
                    <div className='flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-16 gap-6'>
                        <div>
                            <span
                                className='font-bold text-xs tracking-[0.3em] uppercase mb-2 flex items-center gap-1.5'
                                style={{ color: 'var(--color-brand)' }}
                            >
                                // DIRECTORY_V2.0
                                <InfoTooltip
                                    content={TOOLTIP_CONTENT.targetGrade}
                                />
                            </span>
                            <h2
                                className='text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tighter uppercase leading-none'
                                style={{ color: 'var(--color-text)' }}
                            >
                                Academic Tracks
                            </h2>
                        </div>
                        <div className='flex flex-wrap items-center gap-4'>
                            <div
                                className='p-4 flex items-center space-x-4 rounded-lg'
                                style={{
                                    border: '1px solid var(--color-glass-border)',
                                }}
                            >
                                <div
                                    className='w-2 h-2 animate-pulse rounded-full'
                                    style={{
                                        background:
                                            tab === 'active'
                                                ? 'var(--color-brand)'
                                                : '#a1a1aa',
                                    }}
                                />
                                <span
                                    className='text-3xs font-bold tracking-widest uppercase'
                                    style={{ color: 'var(--color-text-muted)' }}
                                >
                                    {nodeCount}{' '}
                                    {tab === 'active' ? 'ACTIVE' : 'ARCHIVED'}{' '}
                                    NODES
                                </span>
                            </div>
                            {tab === 'active' && (
                                <button
                                    onClick={() => setShowAdd(true)}
                                    className='flex items-center gap-2 px-6 py-4 text-sm font-black tracking-widest uppercase cursor-pointer transition-all duration-150 rounded-lg'
                                    style={{
                                        border: '1px solid var(--color-brand)',
                                        color: 'var(--color-brand)',
                                        background: 'var(--color-active-bg)',
                                    }}
                                    onMouseEnter={(e) => {
                                        (
                                            e.currentTarget as HTMLButtonElement
                                        ).style.background =
                                            'var(--color-brand)';
                                        (
                                            e.currentTarget as HTMLButtonElement
                                        ).style.color = 'var(--color-surface)';
                                        (
                                            e.currentTarget as HTMLButtonElement
                                        ).style.boxShadow =
                                            '0 4px 18px var(--color-brand-glow)';
                                    }}
                                    onMouseLeave={(e) => {
                                        (
                                            e.currentTarget as HTMLButtonElement
                                        ).style.background =
                                            'var(--color-active-bg)';
                                        (
                                            e.currentTarget as HTMLButtonElement
                                        ).style.color = 'var(--color-brand)';
                                        (
                                            e.currentTarget as HTMLButtonElement
                                        ).style.boxShadow = 'none';
                                    }}
                                >
                                    <Plus className='w-4 h-4' />
                                    New Node
                                </button>
                            )}
                        </div>
                    </div>

                    <div
                        className='flex gap-1 mb-10 p-1 rounded-lg w-fit'
                        style={{
                            background: 'var(--color-surface-1)',
                            border: '1px solid var(--color-glass-border)',
                        }}
                    >
                        {(['active', 'past'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className='px-6 py-2 text-3xs font-black tracking-[0.2em] uppercase rounded-md cursor-pointer transition-all duration-150'
                                style={{
                                    background:
                                        tab === t
                                            ? 'var(--color-surface-2)'
                                            : 'transparent',
                                    color:
                                        tab === t
                                            ? 'var(--color-text)'
                                            : 'var(--color-text-faint)',
                                    border:
                                        tab === t
                                            ? '1px solid var(--color-glass-border)'
                                            : '1px solid transparent',
                                }}
                            >
                                {t === 'active' ? 'Active Nodes' : 'Past Nodes'}
                            </button>
                        ))}
                    </div>

                    {error && (
                        <div
                            className='px-6 py-4 flex items-center space-x-3 mb-8 rounded-lg'
                            style={{
                                border: '1px solid var(--color-danger)',
                                background: 'rgba(239,68,68,0.05)',
                            }}
                        >
                            <AlertTriangle
                                className='w-4 h-4 shrink-0'
                                style={{ color: 'var(--color-danger)' }}
                            />
                            <span
                                className='text-2xs font-bold uppercase tracking-widest'
                                style={{ color: 'var(--color-danger)' }}
                            >
                                {error}
                            </span>
                        </div>
                    )}

                    {loading ? (
                        <div className='flex items-center space-x-4 py-20'>
                            <div
                                className='w-px h-8 animate-pulse'
                                style={{ background: 'var(--color-brand)' }}
                            />
                            <span
                                className='text-3xs font-bold tracking-[0.3em] uppercase'
                                style={{ color: 'var(--color-text-faint)' }}
                            >
                                Scanning nodes…
                            </span>
                        </div>
                    ) : displayList.length === 0 ? (
                        <div
                            className='border border-dashed p-20 text-center rounded-lg'
                            style={{ borderColor: 'var(--color-glass-border)' }}
                        >
                            <p
                                className='text-3xs font-bold tracking-[0.3em] uppercase mb-6'
                                style={{ color: 'var(--color-text-faint)' }}
                            >
                                {tab === 'active'
                                    ? 'No course nodes initialized'
                                    : 'No archived courses'}
                            </p>
                            {tab === 'active' && (
                                <button
                                    onClick={() => setShowAdd(true)}
                                    className='px-10 py-3 text-sm font-black tracking-widest uppercase cursor-pointer transition-all duration-150 rounded-lg'
                                    style={{
                                        border: '1px solid var(--color-brand)',
                                        color: 'var(--color-brand)',
                                        background: 'var(--color-active-bg)',
                                    }}
                                    onMouseEnter={(e) => {
                                        (
                                            e.currentTarget as HTMLButtonElement
                                        ).style.background =
                                            'var(--color-brand)';
                                        (
                                            e.currentTarget as HTMLButtonElement
                                        ).style.color = 'var(--color-surface)';
                                    }}
                                    onMouseLeave={(e) => {
                                        (
                                            e.currentTarget as HTMLButtonElement
                                        ).style.background =
                                            'var(--color-active-bg)';
                                        (
                                            e.currentTarget as HTMLButtonElement
                                        ).style.color = 'var(--color-brand)';
                                    }}
                                >
                                    Initialize First Course
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                            {displayList.map((course, i) => {
                                const isBeingDeleted = deleting === course.id;
                                return (
                                    <div
                                        key={course.id}
                                        className='p-8 group transition-all rounded-lg relative'
                                        style={{
                                            border: '1px solid var(--color-glass-border)',
                                            background:
                                                'var(--color-surface-1)',
                                            opacity: isBeingDeleted
                                                ? 0.5
                                                : tab === 'past'
                                                  ? 0.8
                                                  : 1,
                                            pointerEvents: isBeingDeleted
                                                ? 'none'
                                                : undefined,
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isBeingDeleted)
                                                (
                                                    e.currentTarget as HTMLElement
                                                ).style.background =
                                                    'var(--color-surface-2)';
                                        }}
                                        onMouseLeave={(e) =>
                                            ((
                                                e.currentTarget as HTMLElement
                                            ).style.background =
                                                'var(--color-surface-1)')
                                        }
                                    >
                                        {isBeingDeleted && (
                                            <div
                                                className='absolute inset-0 flex items-center justify-center rounded-lg z-10'
                                                style={{
                                                    background:
                                                        'var(--color-surface-1)',
                                                }}
                                            >
                                                <div className='flex items-center gap-3'>
                                                    <div className='w-4 h-4 border border-red-500/30 border-t-red-500 animate-spin rounded-full' />
                                                    <span className='text-3xs font-bold tracking-widest uppercase text-red-400'>
                                                        Deleting…
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        <div className='flex justify-between items-start mb-14'>
                                            <div className='flex items-center gap-3'>
                                                <span
                                                    className='text-3xs font-black tracking-[0.4em] uppercase'
                                                    style={{
                                                        color: 'var(--color-text-muted)',
                                                    }}
                                                >
                                                    {tab === 'past'
                                                        ? 'ARCHIVED'
                                                        : `NODE_${String(i + 1).padStart(2, '0')}`}
                                                </span>
                                                {tab === 'past' && (
                                                    <Archive
                                                        className='w-3 h-3'
                                                        style={{
                                                            color: '#a1a1aa',
                                                        }}
                                                    />
                                                )}
                                            </div>
                                            <button
                                                onClick={() =>
                                                    setConfirmDelete({
                                                        id: course.id,
                                                        name: course.name,
                                                    })
                                                }
                                                title={`Delete ${course.name}`}
                                                className='flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all duration-150 opacity-100 md:opacity-0 md:group-hover:opacity-100'
                                                style={deleteStyle.base}
                                                onMouseEnter={(e) =>
                                                    Object.assign(
                                                        (
                                                            e.currentTarget as HTMLButtonElement
                                                        ).style,
                                                        deleteStyle.hover,
                                                    )
                                                }
                                                onMouseLeave={(e) =>
                                                    Object.assign(
                                                        (
                                                            e.currentTarget as HTMLButtonElement
                                                        ).style,
                                                        deleteStyle.leave,
                                                    )
                                                }
                                            >
                                                <Trash2 className='w-3 h-3' />
                                                Delete
                                            </button>
                                        </div>

                                        <Link to={`/courses/${course.id}`}>
                                            <h3
                                                className='text-2xl font-bold tracking-tighter mb-1 group-hover:text-[var(--color-brand)] transition-colors uppercase'
                                                style={{
                                                    color: 'var(--color-text)',
                                                }}
                                            >
                                                {course.name}
                                            </h3>
                                            <div
                                                className='flex items-center space-x-4 mb-10 text-3xs font-mono'
                                                style={{
                                                    color: 'var(--color-text-muted)',
                                                }}
                                            >
                                                {course.credits && (
                                                    <span>
                                                        {course.credits} CREDITS
                                                    </span>
                                                )}
                                                <span>
                                                    TARGET: {course.targetGrade}
                                                    %
                                                </span>
                                            </div>
                                            <div
                                                className='pt-4'
                                                style={{
                                                    borderTop:
                                                        '1px solid var(--color-glass-border)',
                                                }}
                                            >
                                                <span
                                                    className='text-3xs font-bold tracking-widest uppercase group-hover:text-[var(--color-text)] transition-colors'
                                                    style={{
                                                        color: 'var(--color-brand)',
                                                    }}
                                                >
                                                    {tab === 'past'
                                                        ? '→ View Archive'
                                                        : '→ Access Track'}
                                                </span>
                                            </div>
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <footer
                    className='mt-auto px-8 py-8 flex justify-between items-center'
                    style={{
                        borderTop: '1px solid var(--color-glass-border)',
                        background: 'var(--color-surface)',
                    }}
                >
                    <span
                        className='text-3xs uppercase tracking-[0.2em]'
                        style={{ color: 'var(--color-text-faint)' }}
                    >
                        © 2026 SEMSYNC
                    </span>
                </footer>
            </div>

            {showAdd && (
                <AddCourseModal
                    onClose={() => setShowAdd(false)}
                    onCreated={(c) => {
                        invalidateAllCourseData();
                        setCourses((p) => [...p, c]);
                        setShowAdd(false);
                    }}
                />
            )}
            {confirmDelete && (
                <ConfirmModal
                    title='Delete course'
                    message={
                        <>
                            Delete{' '}
                            <strong style={{ color: 'var(--color-text)' }}>
                                {confirmDelete.name}
                            </strong>
                            ? This cannot be undone.
                        </>
                    }
                    variant='delete'
                    onConfirm={() => handleDelete(confirmDelete.id)}
                    onClose={() => setConfirmDelete(null)}
                />
            )}
        </>
    );
}
