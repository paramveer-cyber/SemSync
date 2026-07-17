import { useEffect, useState, useCallback, ReactNode } from 'react';
import { motion, Variants } from 'motion/react';
import { X } from 'lucide-react';
import { useMotionDisabled } from '../../context/AnimationPreferenceContext';

const SPRING_VARIANTS: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { type: 'spring', stiffness: 350, damping: 28 },
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        transition: { duration: 0.15, ease: 'easeOut' },
    },
};

const FLAT_VARIANTS: Variants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.16, ease: 'easeOut' },
    },
    exit: {
        opacity: 0,
        scale: 0.98,
        transition: { duration: 0.12, ease: 'easeOut' },
    },
};

type ModalChildren = ReactNode | ((requestClose: () => void) => ReactNode);

export default function Modal({
    title,
    onClose,
    children,
    calm = false,
}: {
    title: string;
    onClose: () => void;
    children: ModalChildren;
    calm?: boolean;
}) {
    const motionDisabled = useMotionDisabled();
    const [isExiting, setIsExiting] = useState(false);

    const requestClose = useCallback(() => {
        if (motionDisabled) {
            onClose();
            return;
        }
        setIsExiting(true);
    }, [motionDisabled, onClose]);

    useEffect(() => {
        const handleKeydown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') requestClose();
        };
        window.addEventListener('keydown', handleKeydown);
        return () => window.removeEventListener('keydown', handleKeydown);
    }, [requestClose]);

    const cardVariants = calm ? FLAT_VARIANTS : SPRING_VARIANTS;
    const content =
        typeof children === 'function' ? children(requestClose) : children;

    return (
        <div
            className='fixed inset-0 z-50 flex items-center justify-center px-4'
            style={{
                background: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(8px)',
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) requestClose();
            }}
        >
            <motion.div
                className='w-full max-w-md max-h-[90vh] flex flex-col'
                style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-glass-border)',
                    borderRadius: 0,
                    overflow: 'hidden',
                }}
                initial={motionDisabled ? false : 'hidden'}
                animate={isExiting ? 'exit' : 'visible'}
                variants={motionDisabled ? undefined : cardVariants}
                onAnimationComplete={(definition) => {
                    if (definition === 'exit') onClose();
                }}
            >
                {/* Header */}
                <div
                    className='flex items-center justify-between px-7 py-5 shrink-0'
                    style={{
                        borderBottom: '1px solid var(--color-glass-border)',
                    }}
                >
                    <span className='text-sm font-semibold text-[var(--color-text)] font-headline'>
                        {title}
                    </span>
                    <button
                        onClick={requestClose}
                        title='Close'
                        className='w-8 h-8 flex items-center justify-center cursor-pointer transition-all duration-150'
                        style={{
                            background: 'var(--color-glass)',
                            color: 'var(--color-text-muted)',
                            border: '1px solid var(--color-glass-border)',
                            borderRadius: 0,
                        }}
                        onMouseEnter={(e) => {
                            (
                                e.currentTarget as HTMLButtonElement
                            ).style.background = 'var(--color-glass-hover)';
                            (e.currentTarget as HTMLButtonElement).style.color =
                                'var(--color-danger)';
                            (
                                e.currentTarget as HTMLButtonElement
                            ).style.borderColor = 'var(--color-danger)';
                        }}
                        onMouseLeave={(e) => {
                            (
                                e.currentTarget as HTMLButtonElement
                            ).style.background = 'var(--color-glass)';
                            (e.currentTarget as HTMLButtonElement).style.color =
                                'var(--color-text-muted)';
                            (
                                e.currentTarget as HTMLButtonElement
                            ).style.borderColor = 'var(--color-glass-border)';
                        }}
                    >
                        <X className='w-4 h-4' />
                    </button>
                </div>
                <div className='p-7 overflow-y-auto'>{content}</div>
            </motion.div>
        </div>
    );
}
