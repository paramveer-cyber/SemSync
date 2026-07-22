import { ReactNode, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { useMotionDisabled } from '../../context/AnimationPreferenceContext';

const MAGNETIC_PULL_STRENGTH = 0.35;
const SPRING_CONFIG = { stiffness: 200, damping: 15, mass: 0.4 };

interface MagneticButtonProps {
    children: ReactNode;
    className?: string;
}

export default function MagneticButton({
    children,
    className,
}: MagneticButtonProps) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const motionDisabled = useMotionDisabled();

    const rawX = useMotionValue(0);
    const rawY = useMotionValue(0);
    const springX = useSpring(rawX, SPRING_CONFIG);
    const springY = useSpring(rawY, SPRING_CONFIG);

    function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
        if (motionDisabled || !wrapperRef.current) return;
        const bounds = wrapperRef.current.getBoundingClientRect();
        const centerX = bounds.left + bounds.width / 2;
        const centerY = bounds.top + bounds.height / 2;
        rawX.set((event.clientX - centerX) * MAGNETIC_PULL_STRENGTH);
        rawY.set((event.clientY - centerY) * MAGNETIC_PULL_STRENGTH);
    }

    function handleMouseLeave() {
        rawX.set(0);
        rawY.set(0);
    }

    return (
        <motion.div
            ref={wrapperRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ x: springX, y: springY }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
