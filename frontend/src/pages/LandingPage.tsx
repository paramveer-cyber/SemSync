import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import icon from '/favicon.ico';
import Ticker from '../components/Ticker';
import {
    LayoutDashboard,
    BookOpen,
    Calendar,
    CheckSquare,
    Timer,
    ArrowRight,
    ChevronDown,
} from 'lucide-react';

function FeatureCard({
    index,
    icon: Icon,
    title,
    desc,
}: {
    index: string;
    icon: any;
    title: string;
    desc: string;
}) {
    return (
        <div
            className='group relative p-8 border-b border-r border-[var(--color-glass-border)] hover:border-[var(--color-brand)] transition-colors duration-200 overflow-hidden'
            style={{ background: 'var(--color-surface-1)' }}
        >
            <div
                className='absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none'
                style={{ background: 'var(--color-active-bg)' }}
            />
            <div className='relative z-10'>
                <div className='flex justify-between items-start mb-6'>
                    <div
                        className='w-9 h-9 flex items-center justify-center border border-[var(--color-glass-border)] group-hover:border-[var(--color-brand)] transition-colors'
                        style={{ background: 'var(--color-surface-2)' }}
                    >
                        <Icon
                            size={16}
                            style={{ color: 'var(--color-brand)' }}
                        />
                    </div>
                    <span
                        className='text-4xs font-black tracking-[0.35em]'
                        style={{ color: 'var(--color-text-faint)' }}
                    >
                        {index}
                    </span>
                </div>
                <h3
                    className='text-lg font-black uppercase tracking-tight mb-3'
                    style={{ color: 'var(--color-text)' }}
                >
                    {title}
                </h3>
                <p
                    className='text-sm leading-relaxed'
                    style={{ color: 'var(--color-text-muted)' }}
                >
                    {desc}
                </p>
            </div>
        </div>
    );
}

export default function LandingPage() {
    const { user, loading } = useAuth();

    const features = [
        {
            index: '01',
            icon: LayoutDashboard,
            title: 'Command Dashboard',
            desc: 'A high-level view of your semester. See upcoming evaluations at a glance and all your active courses from a single panel.',
        },
        {
            index: '02',
            icon: BookOpen,
            title: 'Course Management',
            desc: "Add courses with credits and a target grade. Log evaluations — quizzes, assignments, labs, projects, midsems, endsems — and track how much weight you've covered.",
        },
        {
            index: '03',
            icon: Calendar,
            title: 'Academic Calendar',
            desc: 'A full monthly calendar showing all your course evaluations alongside personal tasks. Add, mark done, or remove entries without leaving the view.',
        },
        {
            index: '04',
            icon: CheckSquare,
            title: 'Task Center',
            desc: 'A kanban board for your tasks — queue them, mark active, push to done. Drag to reorder. Attach a course, priority, and due date.',
        },
        {
            index: '05',
            icon: Timer,
            title: 'Focus Timer',
            desc: 'Set a custom focus duration, link it to a task or eval, pick a category like Reading or Coding, and run timed deep-work sessions. Past sessions are saved locally.',
        },
    ];
    const tickerItems = [
        'COURSE TRACKING',
        'EVALUATION LOGS',
        'FOCUS TIMER',
        'TASK MANAGEMENT',
        'ACADEMIC CALENDAR',
        'DEEP WORK SESSIONS',
        'GRADE TARGETS',
        'UPCOMING EVALS',
    ];
    const navLinks = [
        { label: 'FEATURES', href: '#features' },
        { label: 'ABOUT', href: '/about' },
        {
            label: 'GITHUB',
            href: 'https://github.com/paramveer-cyber/SemSync',
        },
    ];
    return (
        <div
            className='min-h-screen flex flex-col'
            style={{ background: 'var(--color-surface)' }}
        >
            <nav
                className='sticky top-0 z-50 border-b border-[var(--color-glass-border)] px-6 py-4 flex justify-between items-center backdrop-blur-md'
                style={{ background: 'var(--color-sidebar-bg)' }}
            >
                <Link to='/' className='flex items-center gap-2'>
                    <img src={icon} width={30} height={30} />
                    <span
                        className='text-base font-black tracking-[0.2em] uppercase'
                        style={{ color: 'var(--color-text)' }}
                    >
                        SEM
                        <span style={{ color: 'var(--color-brand)' }}>
                            SYNC
                        </span>
                    </span>
                </Link>

                <div className='hidden md:flex items-center gap-8'>
                    {navLinks.map(({ label, href }) => (
                        <a
                            key={label}
                            href={href}
                            className='text-2xs font-bold tracking-[0.25em] uppercase transition-colors'
                            style={{ color: 'var(--color-text-muted)' }}
                            onMouseEnter={(e) =>
                                (e.currentTarget.style.color =
                                    'var(--color-brand)')
                            }
                            onMouseLeave={(e) =>
                                (e.currentTarget.style.color =
                                    'var(--color-text-muted)')
                            }
                        >
                            {label}
                        </a>
                    ))}
                </div>

                {loading ? (
                    <div
                        className='w-8 h-8 animate-pulse border border-[var(--color-glass-border)]'
                        style={{ background: 'var(--color-surface-2)' }}
                    />
                ) : user ? (
                    <Link
                        to='/dashboard'
                        className='flex items-center gap-3 group'
                    >
                        <span
                            className='hidden md:block text-3xs font-bold tracking-widest transition-colors'
                            style={{ color: 'var(--color-text-muted)' }}
                            onMouseEnter={(e) =>
                                (e.currentTarget.style.color =
                                    'var(--color-text)')
                            }
                            onMouseLeave={(e) =>
                                (e.currentTarget.style.color =
                                    'var(--color-text-muted)')
                            }
                        >
                            {user.name?.split(' ')[0].toUpperCase()}
                        </span>
                        {user.avatarUrl ? (
                            <img
                                src={user.avatarUrl}
                                alt={user.name}
                                className='w-8 h-8 object-cover border border-[var(--color-glass-border)] group-hover:border-[var(--color-brand)] transition-colors'
                            />
                        ) : (
                            <div
                                className='w-8 h-8 flex items-center justify-center border border-[var(--color-glass-border)] group-hover:border-[var(--color-brand)] transition-colors text-2xs font-black'
                                style={{
                                    background: 'var(--color-active-bg)',
                                    color: 'var(--color-brand)',
                                }}
                            >
                                {user.name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </Link>
                ) : (
                    <Link
                        to='/login'
                        className='px-6 py-2 text-2xs font-bold tracking-[0.2em] uppercase border transition-all'
                        style={{
                            background: 'var(--color-text)',
                            color: 'var(--color-surface)',
                            borderColor: 'var(--color-text)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                                'var(--color-brand)';
                            e.currentTarget.style.borderColor =
                                'var(--color-brand)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                                'var(--color-text)';
                            e.currentTarget.style.borderColor =
                                'var(--color-text)';
                        }}
                    >
                        LOGIN
                    </Link>
                )}
            </nav>

            <main className='grow'>
                <section className='relative min-h-[89vh] flex flex-col justify-center items-center px-6 border-b border-[var(--color-glass-border)] overflow-hidden'>
                    <div
                        className='absolute inset-0 pointer-events-none opacity-[0.035]'
                        style={{
                            backgroundImage:
                                'linear-gradient(var(--color-text) 1px, transparent 1px), linear-gradient(90deg, var(--color-text) 1px, transparent 1px)',
                            backgroundSize: '64px 64px',
                        }}
                    />
                    <div
                        className='absolute inset-0 opacity-17.5 grayscale pointer-events-none'
                        style={{
                            backgroundImage: `url('https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070&auto=format&fit=crop')`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    />
                    <div
                        className='absolute inset-0 pointer-events-none'
                        style={{
                            background:
                                'radial-gradient(ellipse at center, transparent 30%, var(--color-surface) 100%)',
                        }}
                    />

                    <div className='relative z-10 max-w-5xl w-full text-center'>
                        <h1
                            className='text-6xl md:text-8xl font-black tracking-tighter leading-none uppercase mb-6'
                            style={{ color: 'var(--color-text)' }}
                        >
                            The Blueprint
                            <br />
                            For Your Academic
                            <br />
                            <span style={{ color: 'var(--color-brand)' }}>
                                Success.
                            </span>
                        </h1>

                        <p
                            className='text-base md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed'
                            style={{ color: 'var(--color-text-muted)' }}
                        >
                            A streamlined, minimalist tracker for college
                            students to manage courses, deadlines, and deep-work
                            sessions — without the clutter.
                        </p>
                        <p
                            className='text-xs font-bold tracking-[0.4em] uppercase mb-12'
                            style={{ color: 'var(--color-brand)' }}
                        >
                            "If you can measure it, you can improve on it."
                        </p>

                        <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                            {user ? (
                                <Link
                                    to='/dashboard'
                                    className='inline-flex items-center justify-center gap-3 px-10 py-4 font-bold text-sm tracking-[0.2em] uppercase'
                                    style={{
                                        background: 'var(--color-brand)',
                                        color: 'var(--color-surface)',
                                    }}
                                >
                                    <LayoutDashboard size={16} />
                                    Go to Dashboard
                                    <ArrowRight size={16} />
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        to='/login'
                                        className='inline-flex items-center justify-center gap-3 px-10 py-4 font-bold text-sm tracking-[0.2em] uppercase'
                                        style={{
                                            background: 'var(--color-brand)',
                                            color: 'var(--color-surface)',
                                        }}
                                    >
                                        Get Started
                                        <ArrowRight size={16} />
                                    </Link>
                                    <a
                                        href='#features'
                                        className='inline-flex items-center justify-center gap-2 px-10 py-4 font-bold text-sm tracking-[0.2em] uppercase border transition-colors'
                                        style={{
                                            color: 'var(--color-text)',
                                            borderColor:
                                                'var(--color-glass-border)',
                                            background:
                                                'var(--color-surface-1)',
                                        }}
                                    >
                                        Explore Features
                                        <ChevronDown size={16} />
                                    </a>
                                </>
                            )}
                        </div>
                    </div>
                </section>

                <Ticker items={tickerItems} />

                <section
                    id='features'
                    className='border-b border-[var(--color-glass-border)]'
                >
                    <div className='px-8 pt-16 pb-0 max-w-7xl mx-42.5'>
                        <div className='flex items-end justify-between mb-12'>
                            <div>
                                <span
                                    className='text-3xs font-bold tracking-[0.35em] uppercase'
                                    style={{ color: 'var(--color-brand)' }}
                                >
                                    WHAT'S INSIDE
                                </span>
                                <h2
                                    className='text-4xl md:text-5xl font-black uppercase tracking-tighter mt-2'
                                    style={{ color: 'var(--color-text)' }}
                                >
                                    Five Modules.
                                    <br />
                                    One System.
                                </h2>
                            </div>
                            <span
                                className='hidden md:block text-3xs tracking-widest mb-1'
                                style={{ color: 'var(--color-text-faint)' }}
                            >
                                ZERO BLOAT
                            </span>
                        </div>
                    </div>

                    <div className='grid mx-50 grid-cols-1 md:grid-cols-3 border-t border-l border-[var(--color-glass-border)]'>
                        {features.map((f) => (
                            <FeatureCard key={f.index} {...f} />
                        ))}
                        <div
                            className='p-8 border-b border-r border-[var(--color-glass-border)] flex flex-col justify-between'
                            style={{ background: 'var(--color-surface-1)' }}
                        >
                            <p
                                className='text-xs leading-relaxed mb-8'
                                style={{ color: 'var(--color-text-muted)' }}
                            >
                                Built For the specific rhythms of college life.
                                No subscriptions. No tracking. No dark patterns.
                            </p>
                            <Link
                                to='/login'
                                className='inline-flex items-center gap-2 text-2xs font-bold tracking-[0.2em] uppercase'
                                style={{ color: 'var(--color-brand)' }}
                            >
                                Initialize Setup <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>
                </section>

                <section className='border-b border-[var(--color-glass-border)] py-20 px-8'>
                    <div className='max-w-5xl mx-auto'>
                        <span
                            className='text-3xs font-bold tracking-[0.35em] uppercase'
                            style={{ color: 'var(--color-brand)' }}
                        >
                            THE PROTOCOL
                        </span>
                        <h2
                            className='text-4xl md:text-5xl font-black uppercase tracking-tighter mt-2 mb-14'
                            style={{ color: 'var(--color-text)' }}
                        >
                            Three Steps.
                            <br />
                            One Semester.
                        </h2>

                        <div
                            className='grid md:grid-cols-3 gap-px border border-[var(--color-glass-border)]'
                            style={{ background: 'var(--color-glass-border)' }}
                        >
                            {[
                                {
                                    step: '01',
                                    title: 'Add Your Courses',
                                    desc: "Register each course with its credit weight and the grade you're targeting. That target drives everything else.",
                                },
                                {
                                    step: '02',
                                    title: 'Log Evaluations',
                                    desc: 'As quizzes, labs, and assignments happen, log them with their weight and your score. See how much grade is still up for grabs.',
                                },
                                {
                                    step: '03',
                                    title: 'Stay Ahead',
                                    desc: 'The dashboard surfaces upcoming evals. The calendar keeps dates in sight. The focus timer keeps you in the chair.',
                                },
                            ].map(({ step, title, desc }) => (
                                <div
                                    key={step}
                                    className='p-10'
                                    style={{
                                        background: 'var(--color-surface-1)',
                                    }}
                                >
                                    <span
                                        className='text-5xl font-black font-mono leading-none'
                                        style={{ color: 'var(--color-brand)' }}
                                    >
                                        {step}
                                    </span>
                                    <h3
                                        className='text-lg font-black uppercase tracking-tight mt-4 mb-3'
                                        style={{ color: 'var(--color-text)' }}
                                    >
                                        {title}
                                    </h3>
                                    <p
                                        className='text-sm leading-relaxed'
                                        style={{
                                            color: 'var(--color-text-muted)',
                                        }}
                                    >
                                        {desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section
                    className='py-32 px-6 text-center relative overflow-hidden'
                    style={{ background: 'var(--color-brand)' }}
                >
                    <div
                        className='absolute inset-0 pointer-events-none opacity-[0.08]'
                        style={{
                            backgroundImage:
                                'linear-gradient(var(--color-surface) 1px, transparent 1px), linear-gradient(90deg, var(--color-surface) 1px, transparent 1px)',
                            backgroundSize: '44px 44px',
                        }}
                    />
                    <div className='relative z-10'>
                        <h2
                            className='text-5xl md:text-7xl font-black tracking-tighter uppercase mb-6'
                            style={{ color: 'var(--color-surface)' }}
                        >
                            Begin the Protocol.
                        </h2>
                        <p
                            className='text-base max-w-lg mx-auto mb-12 opacity-75'
                            style={{ color: 'var(--color-surface)' }}
                        >
                            Transform your academic output from chaotic to
                            synchronized. Access the system today.
                        </p>
                        {user ? (
                            <Link
                                to='/dashboard'
                                className='inline-flex items-center gap-3 px-12 py-4 font-black tracking-[0.2em] uppercase border-2'
                                style={{
                                    background: 'var(--color-surface)',
                                    color: 'var(--color-brand)',
                                    borderColor: 'var(--color-surface)',
                                }}
                            >
                                <LayoutDashboard size={18} />
                                Open Dashboard
                            </Link>
                        ) : (
                            <Link
                                to='/login'
                                className='inline-flex items-center gap-3 px-12 py-4 font-black tracking-[0.2em] uppercase border-2'
                                style={{
                                    background: 'var(--color-surface)',
                                    color: 'var(--color-brand)',
                                    borderColor: 'var(--color-surface)',
                                }}
                            >
                                Initialize Setup
                                <ArrowRight size={18} />
                            </Link>
                        )}
                    </div>
                </section>
            </main>

            <footer
                className='border-t border-[var(--color-glass-border)] px-8 py-8'
                style={{ background: 'var(--color-surface-1)' }}
            >
                <div className='max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6'>
                    <div className='flex items-center gap-2'>
                        <img
                            src={icon}
                            width={18}
                            height={18}
                            className='opacity-50'
                        />
                        <span
                            className='text-3xs font-bold tracking-[0.25em] uppercase'
                            style={{ color: 'var(--color-text-faint)' }}
                        >
                            © 2026 SEMSYNC
                        </span>
                    </div>
                    <div className='flex items-center gap-8'>
                        {[
                            { label: 'TERMS', href: '/legal' },
                            { label: 'PRIVACY', href: '/legal' },
                            { label: 'LEGAL', href: '/legal' },
                            { label: 'ABOUT', href: '/about' },
                        ].map(({ label, href }) => (
                            <a
                                key={label}
                                href={href}
                                className='text-3xs font-bold tracking-[0.2em] uppercase transition-colors'
                                style={{ color: 'var(--color-text-faint)' }}
                                onMouseEnter={(e) =>
                                    (e.currentTarget.style.color =
                                        'var(--color-text)')
                                }
                                onMouseLeave={(e) =>
                                    (e.currentTarget.style.color =
                                        'var(--color-text-faint)')
                                }
                            >
                                {label}
                            </a>
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    );
}
