import { createContext, useContext, useState, ReactNode } from 'react';
import { useReducedMotion as useOsReducedMotion } from 'motion/react';

const STORAGE_KEY = 'semsync_animations_enabled';

function loadAnimationsEnabled(): boolean {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === 'true';
}

interface AnimationPreferenceCtx {
    animationsEnabled: boolean;
    setAnimationsEnabled: (enabled: boolean) => void;
}

const AnimationPreferenceContext = createContext<AnimationPreferenceCtx | null>(
    null,
);

export function AnimationPreferenceProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [animationsEnabled, setAnimationsEnabledState] = useState<boolean>(
        loadAnimationsEnabled,
    );

    const setAnimationsEnabled = (enabled: boolean) => {
        localStorage.setItem(STORAGE_KEY, String(enabled));
        setAnimationsEnabledState(enabled);
    };

    return (
        <AnimationPreferenceContext.Provider
            value={{ animationsEnabled, setAnimationsEnabled }}
        >
            {children}
        </AnimationPreferenceContext.Provider>
    );
}

export function useAnimationPreference() {
    const ctx = useContext(AnimationPreferenceContext);
    if (!ctx) {
        throw new Error(
            'useAnimationPreference must be used within AnimationPreferenceProvider',
        );
    }
    return ctx;
}

export function useMotionDisabled(): boolean {
    const { animationsEnabled } = useAnimationPreference();
    const osReducedMotion = useOsReducedMotion();
    return !animationsEnabled || !!osReducedMotion;
}
