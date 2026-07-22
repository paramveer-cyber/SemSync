import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'motion/react';
import { useMotionDisabled } from '../../context/AnimationPreferenceContext';
import { LANDING_TIMELINE_STOPS } from '../../data/LandingData';

const CARD_SPACING = 420;
const ARC_AMPLITUDES = [140, 230, 90, 260, 130, 190];
const CARD_GAP = 30;
const CARD_HEIGHT = 190;
const HALF_TRACK_HEIGHT = Math.max(...ARC_AMPLITUDES) + CARD_GAP + CARD_HEIGHT;
const TRACK_HEIGHT = HALF_TRACK_HEIGHT * 2;
const SCROLL_LENGTH_VH = LANDING_TIMELINE_STOPS.length * 70;

function isPeak(index: number) {
    return index % 2 === 0;
}

const arcPoints = LANDING_TIMELINE_STOPS.map((_, index) => ({
    x: index * CARD_SPACING + CARD_SPACING / 2,
    y: isPeak(index) ? -ARC_AMPLITUDES[index] : ARC_AMPLITUDES[index],
}));

const trackWidth = LANDING_TIMELINE_STOPS.length * CARD_SPACING;

function buildJaggedArcPath() {
    let path = `M ${arcPoints[0].x} ${arcPoints[0].y + HALF_TRACK_HEIGHT}`;
    for (let index = 1; index < arcPoints.length; index++) {
        const currentPoint = arcPoints[index];
        path += ` L ${currentPoint.x} ${currentPoint.y + HALF_TRACK_HEIGHT}`;
    }
    return path;
}

const arcPathData = buildJaggedArcPath();

function DotMarker({
    x,
    y,
    passProgress,
    scrollYProgress,
}: {
    x: number;
    y: number;
    passProgress: number;
    scrollYProgress: MotionValue<number>;
}) {
    const clampedThreshold = Math.max(0, Math.min(1, passProgress));
    const fillOpacity = useTransform(
        scrollYProgress,
        [Math.max(0, clampedThreshold - 0.001), clampedThreshold],
        [0, 1],
    );

    return (
        <>
            <circle
                cx={x}
                cy={y + HALF_TRACK_HEIGHT}
                r={7}
                fill='var(--color-surface)'
                stroke='var(--color-brand)'
                strokeWidth='2'
            />
            <motion.circle
                cx={x}
                cy={y + HALF_TRACK_HEIGHT}
                r={7}
                fill='var(--color-brand)'
                style={{ opacity: fillOpacity }}
            />
        </>
    );
}

function TimelineCard({
    stop,
    point,
}: {
    stop: (typeof LANDING_TIMELINE_STOPS)[number];
    point: { x: number; y: number };
}) {
    const Icon = stop.icon;
    const peak = point.y < 0;
    const cardTop = peak
        ? point.y + HALF_TRACK_HEIGHT - CARD_GAP - CARD_HEIGHT
        : point.y + HALF_TRACK_HEIGHT + CARD_GAP;

    return (
        <div
            className='absolute w-64 -translate-x-1/2'
            style={{ left: point.x, top: cardTop, height: CARD_HEIGHT }}
        >
            <div
                className='p-6 border h-full'
                style={{
                    background: 'var(--color-surface-1)',
                    borderColor: 'var(--color-glass-border)',
                }}
            >
                <div className='flex items-center gap-3 mb-3'>
                    <div
                        className='w-8 h-8 flex items-center justify-center border shrink-0'
                        style={{
                            borderColor: 'var(--color-glass-border)',
                            background: 'var(--color-surface-2)',
                        }}
                    >
                        <Icon
                            size={14}
                            style={{ color: 'var(--color-brand)' }}
                        />
                    </div>
                    <span
                        className='text-3xs font-black tracking-[0.3em]'
                        style={{ color: 'var(--color-brand)' }}
                    >
                        {stop.week}
                    </span>
                </div>
                <h3
                    className='text-sm font-black uppercase tracking-tight mb-2'
                    style={{ color: 'var(--color-text)' }}
                >
                    {stop.title}
                </h3>
                <p
                    className='text-xs leading-relaxed'
                    style={{ color: 'var(--color-text-muted)' }}
                >
                    {stop.desc}
                </p>
            </div>
        </div>
    );
}

function StaticTimelineFallback() {
    return (
        <div
            className='max-w-2xl mx-auto px-6 py-20 flex flex-col gap-8 border-l'
            style={{ borderColor: 'var(--color-glass-border)' }}
        >
            {LANDING_TIMELINE_STOPS.map((stop) => {
                const Icon = stop.icon;
                return (
                    <div key={stop.week} className='pl-8 relative'>
                        <div
                            className='absolute left-[-9px] top-1 w-4 h-4 rounded-full border-2'
                            style={{
                                background: 'var(--color-brand)',
                                borderColor: 'var(--color-brand)',
                            }}
                        />
                        <div className='flex items-center gap-2 mb-2'>
                            <Icon
                                size={14}
                                style={{ color: 'var(--color-brand)' }}
                            />
                            <span
                                className='text-3xs font-black tracking-[0.3em]'
                                style={{ color: 'var(--color-brand)' }}
                            >
                                {stop.week}
                            </span>
                        </div>
                        <h3
                            className='text-sm font-black uppercase tracking-tight mb-1'
                            style={{ color: 'var(--color-text)' }}
                        >
                            {stop.title}
                        </h3>
                        <p
                            className='text-xs leading-relaxed'
                            style={{ color: 'var(--color-text-muted)' }}
                        >
                            {stop.desc}
                        </p>
                    </div>
                );
            })}
        </div>
    );
}

export default function SemesterTimeline() {
    const motionDisabled = useMotionDisabled();
    const containerRef = useRef<HTMLDivElement>(null);
    const [viewportWidth, setViewportWidth] = useState(0);

    useEffect(() => {
        function updateViewportWidth() {
            setViewportWidth(window.innerWidth);
        }
        updateViewportWidth();
        window.addEventListener('resize', updateViewportWidth);
        return () => window.removeEventListener('resize', updateViewportWidth);
    }, []);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end end'],
    });

    const trackEndX = Math.min(0, -(trackWidth - viewportWidth + 80));
    const trackX = useTransform(scrollYProgress, [0, 1], [0, trackEndX]);

    if (motionDisabled) {
        return (
            <section
                className='border-b border-[var(--color-glass-border)]'
                style={{ background: 'var(--color-surface)' }}
            >
                <StaticTimelineFallback />
            </section>
        );
    }

    return (
        <section
            ref={containerRef}
            className='relative border-b border-[var(--color-glass-border)]'
            style={{ height: `${SCROLL_LENGTH_VH}vh` }}
        >
            <div className='sticky top-0 h-screen overflow-hidden'>
                <span
                    className='absolute top-16 left-1/2 -translate-x-1/2 text-3xs font-bold tracking-[0.35em] uppercase z-10'
                    style={{ color: 'var(--color-brand)' }}
                >
                    THE SEMESTER, MAPPED
                </span>
                <div
                    className='absolute top-1/2 left-0'
                    style={{ transform: 'translateY(-50%)' }}
                >
                    <motion.div
                        className='relative'
                        style={{
                            x: trackX,
                            width: trackWidth,
                            height: TRACK_HEIGHT,
                        }}
                    >
                        <svg
                            className='absolute top-0 left-0 pointer-events-none'
                            width={trackWidth}
                            height={TRACK_HEIGHT}
                            viewBox={`0 0 ${trackWidth} ${TRACK_HEIGHT}`}
                        >
                            <path
                                d={arcPathData}
                                stroke='var(--color-glass-border)'
                                strokeWidth='2'
                                fill='none'
                            />
                            <motion.path
                                d={arcPathData}
                                stroke='var(--color-brand)'
                                strokeWidth='3'
                                strokeLinecap='round'
                                fill='none'
                                style={{ pathLength: scrollYProgress }}
                            />
                            {arcPoints.map((point, index) => (
                                <DotMarker
                                    key={LANDING_TIMELINE_STOPS[index].week}
                                    x={point.x}
                                    y={point.y}
                                    passProgress={point.x / trackWidth}
                                    scrollYProgress={scrollYProgress}
                                />
                            ))}
                        </svg>
                        {LANDING_TIMELINE_STOPS.map((stop, index) => (
                            <TimelineCard
                                key={stop.week}
                                stop={stop}
                                point={arcPoints[index]}
                            />
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
