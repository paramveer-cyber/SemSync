import {
    LayoutDashboard,
    BookOpen,
    Calendar,
    CheckSquare,
    Timer,
    Trophy,
} from 'lucide-react';

export type LandingFeature = {
    index: string;
    icon: any;
    title: string;
    desc: string;
};

export const LANDING_FEATURES: LandingFeature[] = [
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
        desc: "Add courses with credits and a target grade, or pull them straight from Google Classroom. Log evaluations — quizzes, assignments, labs, projects, midsems, endsems — and track how much weight you've covered.",
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
    {
        index: '06',
        icon: Trophy,
        title: 'XP & Streaks',
        desc: 'Earn XP for focus sessions and keep a streak going. No shame if it breaks, no push notifications, no monetization — just numbers that move when you do the work.',
    },
];

export const LANDING_TICKER_ITEMS: string[] = [
    'COURSE TRACKING',
    'EVALUATION LOGS',
    'FOCUS TIMER',
    'TASK MANAGEMENT',
    'ACADEMIC CALENDAR',
    'CLASSROOM SYNC',
    'XP & STREAKS',
    'GRADE TARGETS',
    'CUSTOM THEMES',
];

export const LANDING_NAV_LINKS: { label: string; href: string }[] = [
    { label: 'FEATURES', href: '#features' },
    { label: 'ABOUT', href: '/about' },
    { label: 'GITHUB', href: 'https://github.com/paramveer-cyber/SemSync' },
];

export type LandingProtocolStep = {
    step: string;
    title: string;
    desc: string;
};

export const LANDING_PROTOCOL_STEPS: LandingProtocolStep[] = [
    {
        step: '01',
        title: 'Add Your Courses',
        desc: "Register each course with its credit weight and the grade you're targeting, or sync them in from Google Classroom. That target drives everything else.",
    },
    {
        step: '02',
        title: 'Log Evaluations',
        desc: 'As quizzes, labs, and assignments happen, log them with their weight and your score. See how much grade is still up for grabs.',
    },
    {
        step: '03',
        title: 'Stay Ahead',
        desc: 'The dashboard surfaces upcoming evals. The calendar keeps dates in sight. The focus timer keeps you in the chair, and XP keeps score.',
    },
];

export type LandingTimelineStop = {
    week: string;
    title: string;
    desc: string;
    icon: any;
};

export const LANDING_TIMELINE_STOPS: LandingTimelineStop[] = [
    {
        week: 'WEEK 01',
        title: 'Add Your Courses',
        desc: 'Register courses with credits and a target grade, or pull them from Google Classroom.',
        icon: BookOpen,
    },
    {
        week: 'WEEK 04',
        title: 'First Evals Logged',
        desc: 'Quizzes and assignments start landing. Log weight and score as they happen.',
        icon: CheckSquare,
    },
    {
        week: 'WEEK 07',
        title: 'Focus Streak Begins',
        desc: 'Timed deep-work sessions start stacking. XP moves when you do the work.',
        icon: Timer,
    },
    {
        week: 'WEEK 10',
        title: 'Midsem Crunch',
        desc: 'The calendar and dashboard keep every upcoming eval in sight, no digging required.',
        icon: Calendar,
    },
    {
        week: 'WEEK 13',
        title: 'XP Climbs',
        desc: 'Streaks hold, achievements unlock, the grind shows up as numbers that move.',
        icon: Trophy,
    },
    {
        week: 'WEEK 16',
        title: 'Endsem, Locked In',
        desc: 'Full semester tracked end to end. Nothing missed, nothing forgotten.',
        icon: LayoutDashboard,
    },
];

export const LANDING_FOOTER_LINKS: { label: string; href: string }[] = [
    { label: 'TERMS', href: '/legal' },
    { label: 'PRIVACY', href: '/legal' },
    { label: 'LEGAL', href: '/legal' },
    { label: 'ABOUT', href: '/about' },
];
