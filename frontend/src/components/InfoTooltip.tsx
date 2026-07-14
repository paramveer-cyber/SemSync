import { useId, useRef, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { useAnimationPreference } from '../context/AnimationPreferenceContext';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

const positionClasses: Record<TooltipPosition, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

export default function InfoTooltip({
    content,
    position = 'top',
}: {
    content: string;
    position?: TooltipPosition;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const tooltipId = useId();
    const { animationsEnabled } = useAnimationPreference();

    const openTooltip = () => {
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        setIsOpen(true);
    };

    const closeTooltipWithDelay = () => {
        closeTimeoutRef.current = setTimeout(() => setIsOpen(false), 120);
    };

    const toggleTooltip = () => setIsOpen((prev) => !prev);

    return (
        <span className='relative inline-flex items-center'>
            <span
                role='button'
                tabIndex={0}
                aria-label='More info'
                aria-describedby={isOpen ? tooltipId : undefined}
                className='inline-flex items-center justify-center cursor-pointer'
                style={{ color: 'var(--color-info)' }}
                onMouseEnter={openTooltip}
                onMouseLeave={closeTooltipWithDelay}
                onClick={toggleTooltip}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleTooltip();
                    }
                    if (e.key === 'Escape') setIsOpen(false);
                }}
            >
                <HelpCircle className='w-4 h-4' />
            </span>

            {isOpen && (
                <div
                    id={tooltipId}
                    role='tooltip'
                    className={`absolute z-[500] w-56 px-3 py-2 rounded-lg text-xs leading-snug pointer-events-none ${positionClasses[position]} ${animationsEnabled ? 'animate-fade-in' : ''}`}
                    style={{
                        background: 'var(--color-surface-3)',
                        border: '1px solid var(--color-glass-border)',
                        color: 'var(--color-text)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
                        textTransform: 'none',
                        letterSpacing: 'normal',
                        fontWeight: 500,
                    }}
                >
                    {content}
                </div>
            )}
        </span>
    );
}
