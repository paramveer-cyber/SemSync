import type { LucideIcon } from 'lucide-react';
import {
    LayoutDashboard,
    BookMarked,
    CalendarDays,
    CheckSquare,
    Timer,
    Trophy,
    Settings,
} from 'lucide-react';

export interface OnboardingDetail {
    icon: string;
    heading: string;
    body: string;
}

export interface OnboardingStep {
    id: string;
    icon: LucideIcon;
    iconColor: string;
    accent: string;
    border: string;
    label: string;
    title: string;
    tagline: string;
    caricatureImage: string;
    description: string;
    details: OnboardingDetail[];
    tip: string;
}

export const STEPS: OnboardingStep[] = [
    {
        id: 'dashboard',
        icon: LayoutDashboard,
        iconColor: '#22c55e',
        accent: 'rgba(34,197,94,0.1)',
        border: 'rgba(34,197,94,0.28)',
        label: 'Dashboard',
        title: 'Your Daily Snapshot',
        tagline: 'WEEKLY FOCUS',
        caricatureImage: '/Onboarding/01.webp',
        description:
            "This is home base, the first thing you see every login. It reads the room for you: evaluations sorted by urgency, a live grid of every course you're juggling, and no need to go digging for what's actually on fire.",
        details: [
            {
                icon: '🔴',
                heading: 'CRITICAL',
                body: 'Due in 2 days or less. Drop everything, this is the one keeping you up tonight.',
            },
            {
                icon: '🟡',
                heading: 'OPERATIONAL',
                body: 'Due within 5 days. Not an emergency yet, but start circling it.',
            },
            {
                icon: '⚪',
                heading: 'ROUTINE',
                body: "5+ days out. Chill for now, just don't forget it exists.",
            },
        ],
        tip: 'The weekly focus resets every Monday, so treat it as your fresh mission briefing.',
    },
    {
        id: 'courses',
        icon: BookMarked,
        iconColor: '#818cf8',
        accent: 'rgba(129,140,248,0.1)',
        border: 'rgba(129,140,248,0.28)',
        label: 'Courses',
        title: 'Add Your Courses',
        tagline: 'COURSE NODES',
        caricatureImage: '/Onboarding/02.webp',
        description:
            'Every subject becomes a Course Node with a target grade attached. Add them by hand, or connect Google Classroom and let it pull in assignments, due dates, and grades on its own, either way SemSync does the grade math so you never have to.',
        details: [
            {
                icon: '➕',
                heading: 'Manual Add',
                body: "Hit New Course, punch in the name, credits, and the grade you're chasing.",
            },
            {
                icon: '🔗',
                heading: 'Classroom Sync',
                body: 'Connect once, read-only. SemSync watches, it never edits anything on your Classroom.',
            },
            {
                icon: '🎯',
                heading: 'Required Average',
                body: "It tells you exactly what you need on what's left to hit your target.",
            },
        ],
        tip: "Green status dot means on track, red means it's time to actually open the textbook.",
    },
    {
        id: 'tasks',
        icon: CheckSquare,
        iconColor: '#34d399',
        accent: 'rgba(52,211,153,0.1)',
        border: 'rgba(52,211,153,0.28)',
        label: 'Task Center',
        title: 'Break Work Into Tasks',
        tagline: 'TO-DO SYSTEM',
        caricatureImage: '/Onboarding/03.webp',
        description:
            'Big scary evaluation? Chop it into small, boring, easy-to-finish tasks instead. Link each one to a course, drag it across the board as you go, and watch a mountain of work quietly turn into a checklist.',
        details: [
            {
                icon: '✅',
                heading: 'Create & Link',
                body: 'Add a task, tag it to a course, and it slots into the right pile automatically.',
            },
            {
                icon: '📁',
                heading: 'Auto Archive',
                body: 'Finished tasks tuck themselves away, your board stays clean, your history stays put.',
            },
        ],
        tip: 'Make the tasks the day work is announced, then just chip away a little daily.',
    },
    {
        id: 'calendar',
        icon: CalendarDays,
        iconColor: '#38bdf8',
        accent: 'rgba(56,189,248,0.1)',
        border: 'rgba(56,189,248,0.28)',
        label: 'Calendar',
        title: 'See Every Deadline',
        tagline: 'MONTH VIEW',
        caricatureImage: '/Onboarding/04.webp',
        description:
            'Every evaluation across the semester, plotted on one month grid and colour-coded by course. The weeks that are about to ambush you become obvious at a glance, long before they actually do.',
        details: [
            {
                icon: '📅',
                heading: 'Colour Dots',
                body: 'One colour per course, so a crammed week is visually loud, not a nasty surprise.',
            },
            {
                icon: '⚠️',
                heading: 'Clash Detection',
                body: 'Multiple deadlines stacked in one week practically wave a flag at you.',
            },
        ],
        tip: 'Skim it at the start of every month and pencil in your heaviest study blocks early.',
    },
    {
        id: 'timer',
        icon: Timer,
        iconColor: '#f472b6',
        accent: 'rgba(244,114,182,0.1)',
        border: 'rgba(244,114,182,0.28)',
        label: 'Focus Timer',
        title: 'Lock In Deep Work',
        tagline: 'POMODORO ENGINE',
        caricatureImage: '/Onboarding/05.webp',
        description:
            "A built-in Pomodoro clock, nothing fancy, just work intervals and break intervals doing their job. Link a session to a task or evaluation if you want, then let the timer do the nagging so you don't have to.",
        details: [
            {
                icon: '⏱️',
                heading: 'Custom Intervals',
                body: "25 on, 5 off by default. Push it to 90/5 if you're feeling ambitious.",
            },
            {
                icon: '📈',
                heading: 'Session Stats',
                body: 'Every session gets logged, so your focus hours add up somewhere visible.',
            },
        ],
        tip: 'Pair a session with one Task Center task, start the clock, finish the task, repeat.',
    },
    {
        id: 'achievements',
        icon: Trophy,
        iconColor: '#fbbf24',
        accent: 'rgba(251,191,36,0.1)',
        border: 'rgba(251,191,36,0.28)',
        label: 'Achievements',
        title: 'Earn XP, Build Streaks',
        tagline: 'PROGRESS & REWARDS',
        caricatureImage: '/Onboarding/06.webp',
        description:
            "Every task closed, session finished, and evaluation logged quietly earns XP and nudges your level up. It's the app's way of clapping for you, and honestly, it helps more than you'd expect.",
        details: [
            {
                icon: '🏅',
                heading: 'Tiers',
                body: 'Bronze up through Legendary, the rarer the tier, the bigger the unlock moment.',
            },
            {
                icon: '🔥',
                heading: 'Streaks',
                body: 'Show up daily and the streak keeps climbing, miss a day and it resets.',
            },
        ],
        tip: "A few achievements are hidden on purpose, you'll bump into them without trying.",
    },
    {
        id: 'settings',
        icon: Settings,
        iconColor: '#a78bfa',
        accent: 'rgba(167,139,250,0.1)',
        border: 'rgba(167,139,250,0.28)',
        label: 'Settings',
        title: 'Make It Yours',
        tagline: 'PERSONALIZE',
        caricatureImage: '/Onboarding/07.webp',
        description:
            'Pick a theme, pick a font pairing, tune exactly when deadline reminders bug you, and keep full control of your data, export it or wipe it whenever you want.',
        details: [
            {
                icon: '🎨',
                heading: 'Appearance',
                body: 'Use a preset, or build your own custom theme from a single brand colour.',
            },
            {
                icon: '🔔',
                heading: 'Reminders',
                body: 'Toggle alerts at 6h, 12h, 24h, or 48h before something is due.',
            },
        ],
        tip: 'Classroom data and tasks never leave your device, check the Data tab to see for yourself.',
    },
];
