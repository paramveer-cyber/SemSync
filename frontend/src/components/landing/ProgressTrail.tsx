import { motion, useScroll } from 'motion/react';

export const TRAIL_RANGE_START = 8;
export const TRAIL_RANGE_END = 96;

export default function ProgressTrail() {
    const { scrollYProgress } = useScroll();

    return (
        <svg
            className='hidden md:block fixed left-6 top-0 h-screen w-6 pointer-events-none z-40'
            viewBox='0 0 24 100'
            preserveAspectRatio='none'
            style={{ mixBlendMode: 'difference' }}
        >
            <path
                d={`M12 ${TRAIL_RANGE_START} L12 ${TRAIL_RANGE_END}`}
                stroke='var(--color-glass-border)'
                strokeWidth='1'
                strokeDasharray='2 3'
            />
            <motion.path
                d={`M12 ${TRAIL_RANGE_START} L12 ${TRAIL_RANGE_END}`}
                stroke='var(--color-brand)'
                strokeWidth='2'
                strokeLinecap='round'
                style={{ pathLength: scrollYProgress }}
            />
        </svg>
    );
}
