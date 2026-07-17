import { useState } from 'react';
import { Box, Tooltip } from '@mui/material';

interface DailyFocusMinutes {
    date: string;
    minutes: number;
}
interface FocusHeatmapProps {
    data: DailyFocusMinutes[];
}

const WEEKS_TO_SHOW = 16;
const LEVEL_COLORS = [
    'var(--color-glass-border)',
    'color-mix(in srgb, var(--color-brand) 30%, var(--color-surface-1))',
    'color-mix(in srgb, var(--color-brand) 55%, var(--color-surface-1))',
    'color-mix(in srgb, var(--color-brand) 78%, var(--color-surface-1))',
    'var(--color-brand)',
];
const MONTH_LABELS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateKey(date: Date) {
    return date.toLocaleDateString('en-CA');
}

function buildWeeks(minutesByDate: Map<string, number>) {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const totalDays = WEEKS_TO_SHOW * 7;
    const startOffset = totalDays - 1 - today.getDay();
    const gridStart = new Date(today);
    gridStart.setDate(gridStart.getDate() - startOffset);

    const weeks: { dateKey: string; minutes: number }[][] = [];
    for (let week = 0; week < WEEKS_TO_SHOW; week++) {
        const days = [];
        for (let day = 0; day < 7; day++) {
            const cellDate = new Date(gridStart);
            cellDate.setDate(cellDate.getDate() + week * 7 + day);
            const dateKey = toDateKey(cellDate);
            days.push({ dateKey, minutes: minutesByDate.get(dateKey) ?? 0 });
        }
        weeks.push(days);
    }
    return weeks;
}

function monthLabelsForWeeks(weeks: { dateKey: string; minutes: number }[][]) {
    const labels: (string | null)[] = weeks.map(() => null);
    let lastMonth = -1;
    weeks.forEach((week, weekIndex) => {
        const firstDayMonth = new Date(
            `${week[0].dateKey}T12:00:00Z`,
        ).getUTCMonth();
        if (firstDayMonth !== lastMonth) {
            labels[weekIndex] = MONTH_LABELS[firstDayMonth];
            lastMonth = firstDayMonth;
        }
    });
    return labels;
}

function currentStreak(minutesByDate: Map<string, number>) {
    let streak = 0;
    for (let i = 0; i < 365; i++) {
        const dateKey = toDateKey(new Date(Date.now() - i * 86_400_000));
        if (minutesByDate.get(dateKey)) streak++;
        else if (i > 0) break;
    }
    return streak;
}

function colorForMinutes(minutes: number, maxMinutes: number) {
    if (minutes === 0) return LEVEL_COLORS[0];
    const intensity = minutes / maxMinutes;
    if (intensity < 0.25) return LEVEL_COLORS[1];
    if (intensity < 0.5) return LEVEL_COLORS[2];
    if (intensity < 0.75) return LEVEL_COLORS[3];
    return LEVEL_COLORS[4];
}

function formatCellLabel(dateKey: string, minutes: number) {
    const readableDate = new Date(`${dateKey}T12:00:00Z`).toLocaleDateString(
        'en-US',
        { month: 'short', day: 'numeric', year: 'numeric' },
    );
    if (minutes <= 0) return `${readableDate}: no focus session`;
    const hours = Math.round((minutes / 60) * 10) / 10;
    return `${readableDate}: ${hours}h focused`;
}

export default function FocusHeatmap({ data }: FocusHeatmapProps) {
    const [hovered, setHovered] = useState<{
        date: string;
        minutes: number;
    } | null>(null);
    const minutesByDate = new Map(data.map((d) => [d.date, d.minutes]));
    const weeks = buildWeeks(minutesByDate);
    const monthLabels = monthLabelsForWeeks(weeks);
    const maxMinutes = Math.max(...weeks.flat().map((c) => c.minutes), 1);
    const totalHours =
        Math.round((data.reduce((sum, d) => sum + d.minutes, 0) / 60) * 10) /
        10;
    const activeDays = data.filter((d) => d.minutes > 0).length;
    const streak = currentStreak(minutesByDate);

    return (
        <Box
            sx={{
                border: '1px solid var(--color-glass-border)',
                background: 'var(--color-surface-1)',
                padding: '1.5rem',
                borderRadius: '0.5rem',
            }}
        >
            <Box className='flex items-center justify-between mb-5'>
                <Box>
                    <span
                        className='text-3xs font-black tracking-[0.25em] uppercase block mb-1'
                        style={{ color: 'var(--color-brand)' }}
                    >
                        // FOCUS_LOG
                    </span>
                    <h3 className='text-base font-extrabold tracking-tighter uppercase text-[var(--color-text)]'>
                        Contribution Chart
                    </h3>
                </Box>
                <Box className='flex items-center gap-6'>
                    {[
                        { label: 'TOTAL HRS', value: `${totalHours}h` },
                        { label: 'ACTIVE DAYS', value: activeDays },
                        { label: 'DAY STREAK', value: streak },
                    ].map((m) => (
                        <Box key={m.label} className='text-right'>
                            <p
                                className='text-lg font-black font-mono'
                                style={{ color: 'var(--color-brand)' }}
                            >
                                {m.value}
                            </p>
                            <p className='text-4xs font-bold tracking-[0.2em] uppercase text-[var(--color-text-muted)]'>
                                {m.label}
                            </p>
                        </Box>
                    ))}
                </Box>
            </Box>

            <Box className='flex gap-0.5 mb-1 pl-7'>
                {monthLabels.map((label, weekIndex) => (
                    <span
                        key={weekIndex}
                        className='flex-1 text-4xs font-mono text-[var(--color-text-muted)]'
                    >
                        {label ?? ''}
                    </span>
                ))}
            </Box>

            <Box className='flex gap-1'>
                <Box className='flex flex-col gap-y-1.5 mr-1'>
                    {DAY_LABELS.map((d, i) => (
                        <Box key={d} className='h-3 flex items-center'>
                            <span
                                className='text-5xs font-mono text-[var(--color-text-muted)]'
                                style={{ width: '24px' }}
                            >
                                {d}
                            </span>
                        </Box>
                    ))}
                </Box>
                <Box className='flex gap-0.5 flex-1'>
                    {weeks.map((week, weekIndex) => (
                        <Box
                            key={weekIndex}
                            className='flex flex-col gap-0.5 flex-1'
                        >
                            {week.map((cell) => (
                                <Tooltip
                                    key={cell.dateKey}
                                    title={formatCellLabel(
                                        cell.dateKey,
                                        cell.minutes,
                                    )}
                                    arrow
                                >
                                    <Box
                                        role='img'
                                        aria-label={formatCellLabel(
                                            cell.dateKey,
                                            cell.minutes,
                                        )}
                                        className='rounded-[2px]'
                                        sx={{
                                            height: '12px',
                                            background: colorForMinutes(
                                                cell.minutes,
                                                maxMinutes,
                                            ),
                                            cursor:
                                                cell.minutes > 0
                                                    ? 'pointer'
                                                    : 'default',
                                            transition: 'opacity 0.1s',
                                        }}
                                        onMouseEnter={() =>
                                            setHovered({
                                                date: cell.dateKey,
                                                minutes: cell.minutes,
                                            })
                                        }
                                        onMouseLeave={() => setHovered(null)}
                                    />
                                </Tooltip>
                            ))}
                        </Box>
                    ))}
                </Box>
            </Box>

            <Box className='flex items-center justify-between mt-3'>
                {hovered ? (
                    <span
                        className='text-4xs font-mono'
                        style={{ color: 'var(--color-brand)' }}
                    >
                        {hovered.date} —{' '}
                        {formatCellLabel(hovered.date, hovered.minutes)}
                    </span>
                ) : (
                    <span className='text-4xs font-mono text-[var(--color-text-muted)]'>
                        hover to inspect
                    </span>
                )}
                <Box className='flex items-center gap-1.5'>
                    <span className='text-5xs font-mono text-[var(--color-text-muted)]'>
                        less
                    </span>
                    {LEVEL_COLORS.map((color, level) => (
                        <Box
                            key={level}
                            aria-hidden='true'
                            className='rounded-[2px]'
                            sx={{
                                width: '10px',
                                height: '10px',
                                background: color,
                            }}
                        />
                    ))}
                    <span className='text-5xs font-mono text-[var(--color-text-muted)]'>
                        more
                    </span>
                </Box>
            </Box>
        </Box>
    );
}
