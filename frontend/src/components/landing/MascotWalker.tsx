import { useState } from 'react';
import {
    motion,
    useScroll,
    useTransform,
    useMotionValueEvent,
} from 'motion/react';
import { TRAIL_RANGE_START, TRAIL_RANGE_END } from './ProgressTrail';

type WalkerPose = 'walk' | 'run' | 'celebrate';

function WalkPose() {
    return (
        <>
            <circle cx='12' cy='4' r='3' />
            <path d='M12 7 L12 15' />
            <path d='M12 9 L6 12' />
            <path d='M12 9 L18 6' />
            <path d='M12 15 L7 22' />
            <path d='M12 15 L17 21' />
        </>
    );
}

function RunPose() {
    return (
        <>
            <circle cx='12' cy='4' r='3' />
            <path d='M12 7 L13 15' />
            <path d='M13 9 L20 7' />
            <path d='M13 9 L7 13' />
            <path d='M13 15 L20 18' />
            <path d='M13 15 L8 21' />
        </>
    );
}

function CelebratePose() {
    return (
        <>
            <circle cx='12' cy='4' r='3' />
            <path d='M12 7 L12 15' />
            <path d='M12 9 L5 3' />
            <path d='M12 9 L19 3' />
            <path d='M12 15 L8 22' />
            <path d='M12 15 L16 22' />
        </>
    );
}

const POSE_BY_STAGE = {
    walk: WalkPose,
    run: RunPose,
    celebrate: CelebratePose,
};

export default function MascotWalker() {
    const { scrollYProgress } = useScroll();
    const topPosition = useTransform(
        scrollYProgress,
        [0, 1],
        [`${TRAIL_RANGE_START}%`, `${TRAIL_RANGE_END}%`],
    );
    const [pose, setPose] = useState<WalkerPose>('walk');

    useMotionValueEvent(scrollYProgress, 'change', (progress) => {
        if (progress > 0.85) setPose('celebrate');
        else if (progress > 0.4) setPose('run');
        else setPose('walk');
    });

    const PoseShape = POSE_BY_STAGE[pose];

    return (
        <motion.svg
            className='hidden md:block fixed left-4 z-40 pointer-events-none'
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='var(--color-brand)'
            strokeWidth='1.6'
            strokeLinecap='round'
            style={{ top: topPosition, mixBlendMode: 'difference' }}
        >
            <PoseShape />
        </motion.svg>
    );
}
