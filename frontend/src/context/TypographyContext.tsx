import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { getConfiguration, updateConfiguration } from '../lib/localConfiguration';

export interface TypeScaleLevel {
    size: string;
    weight: number;
    lh: number;
}

export interface TypeScale {
    h1: TypeScaleLevel;
    h2: TypeScaleLevel;
    h3: TypeScaleLevel;
    h4: TypeScaleLevel;
    body: TypeScaleLevel;
}

export interface TypographyPreset {
    id: string;
    name: string;
    headingLabel: string;
    bodyLabel: string;
    monoLabel: string;
    headingFont: string;
    bodyFont: string;
    monoFont: string;
    googleFamilies: string[];
    scale: TypeScale;
}

export const TYPOGRAPHY_PRESETS: TypographyPreset[] = [
    {
        id: 'default',
        name: 'Default',
        headingLabel: 'Movement',
        bodyLabel: 'Poppins',
        monoLabel: 'JetBrains Mono',
        headingFont: '"Movement", sans-serif',
        bodyFont: '"Poppins", ui-sans-serif, system-ui, sans-serif',
        monoFont: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
        googleFamilies: [
            'Poppins:wght@400;500;600',
            'JetBrains+Mono:wght@400;500',
        ],
        scale: {
            h1: { size: '2.25rem', weight: 700, lh: 1.2 },
            h2: { size: '1.75rem', weight: 700, lh: 1.25 },
            h3: { size: '1.375rem', weight: 600, lh: 1.3 },
            h4: { size: '1.125rem', weight: 600, lh: 1.35 },
            body: { size: '1rem', weight: 400, lh: 1.6 },
        },
    },
    {
        id: 'soft-approachable',
        name: 'Soft & Approachable',
        headingLabel: 'Quicksand',
        bodyLabel: 'Roboto Slab',
        monoLabel: 'Roboto Mono',
        headingFont: '"Quicksand", sans-serif',
        bodyFont: '"Roboto Slab", serif',
        monoFont: '"Roboto Mono", monospace',
        googleFamilies: [
            'Quicksand:wght@500;600;700',
            'Roboto+Slab:wght@400;500',
            'Roboto+Mono:wght@400;500',
        ],
        scale: {
            h1: { size: '2.25rem', weight: 700, lh: 1.15 },
            h2: { size: '1.875rem', weight: 600, lh: 1.2 },
            h3: { size: '1.5rem', weight: 600, lh: 1.25 },
            h4: { size: '1.25rem', weight: 500, lh: 1.35 },
            body: { size: '1rem', weight: 400, lh: 1.6 },
        },
    },
    {
        id: 'clean-friendly',
        name: 'Clean & Friendly',
        headingLabel: 'Poppins',
        bodyLabel: 'Open Sans',
        monoLabel: 'Source Code Pro',
        headingFont: '"Poppins", sans-serif',
        bodyFont: '"Open Sans", sans-serif',
        monoFont: '"Source Code Pro", monospace',
        googleFamilies: [
            'Poppins:wght@500;600;700',
            'Open+Sans:wght@400;600',
            'Source+Code+Pro:wght@400;500',
        ],
        scale: {
            h1: { size: '2.25rem', weight: 700, lh: 1.15 },
            h2: { size: '1.875rem', weight: 600, lh: 1.2 },
            h3: { size: '1.5rem', weight: 600, lh: 1.25 },
            h4: { size: '1.25rem', weight: 500, lh: 1.35 },
            body: { size: '1rem', weight: 400, lh: 1.6 },
        },
    },
    {
        id: 'versatile',
        name: 'Versatile',
        headingLabel: 'Roboto',
        bodyLabel: 'Nunito',
        monoLabel: 'JetBrains Mono',
        headingFont: '"Roboto", sans-serif',
        bodyFont: '"Nunito", sans-serif',
        monoFont: '"JetBrains Mono", monospace',
        googleFamilies: [
            'Roboto:wght@600;700',
            'Nunito:wght@400;600',
            'JetBrains+Mono:wght@400;500',
        ],
        scale: {
            h1: { size: '2.25rem', weight: 700, lh: 1.15 },
            h2: { size: '1.875rem', weight: 600, lh: 1.2 },
            h3: { size: '1.5rem', weight: 600, lh: 1.25 },
            h4: { size: '1.25rem', weight: 500, lh: 1.35 },
            body: { size: '1rem', weight: 400, lh: 1.6 },
        },
    },
    {
        id: 'google-classic',
        name: 'Google Classic',
        headingLabel: 'Arvo',
        bodyLabel: 'Lato',
        monoLabel: 'JetBrains Mono',
        headingFont: '"Arvo", serif',
        bodyFont: '"Lato", sans-serif',
        monoFont: '"JetBrains Mono", monospace',
        googleFamilies: [
            'Arvo:wght@400;700',
            'Lato:wght@400;600',
            'JetBrains+Mono:wght@400;500',
        ],
        scale: {
            h1: { size: '2.25rem', weight: 700, lh: 1.2 },
            h2: { size: '1.875rem', weight: 600, lh: 1.25 },
            h3: { size: '1.5rem', weight: 600, lh: 1.3 },
            h4: { size: '1.25rem', weight: 500, lh: 1.35 },
            body: { size: '1rem', weight: 400, lh: 1.65 },
        },
    },
    {
        id: 'bold-playful',
        name: 'Bold & Playful',
        headingLabel: 'Bricolage Grotesque',
        bodyLabel: 'Crimson Text',
        monoLabel: 'Roboto Mono',
        headingFont: '"Bricolage Grotesque", sans-serif',
        bodyFont: '"Crimson Text", serif',
        monoFont: '"Roboto Mono", monospace',
        googleFamilies: [
            'Bricolage+Grotesque:wght@700;800',
            'Crimson+Text:wght@400;700',
            'Roboto+Mono:wght@400;500',
        ],
        scale: {
            h1: { size: '2.75rem', weight: 800, lh: 1.05 },
            h2: { size: '2.25rem', weight: 700, lh: 1.1 },
            h3: { size: '1.75rem', weight: 700, lh: 1.2 },
            h4: { size: '1.25rem', weight: 500, lh: 1.35 },
            body: { size: '1rem', weight: 400, lh: 1.6 },
        },
    },
    {
        id: 'editorial',
        name: 'Editorial',
        headingLabel: 'Playfair Display',
        bodyLabel: 'Inter',
        monoLabel: 'Inconsolata',
        headingFont: '"Playfair Display", serif',
        bodyFont: '"Inter", sans-serif',
        monoFont: '"Inconsolata", monospace',
        googleFamilies: [
            'Playfair+Display:wght@700;800',
            'Inter:wght@400;500;700',
            'Inconsolata:wght@400;500',
        ],
        scale: {
            h1: { size: '2.75rem', weight: 800, lh: 1.05 },
            h2: { size: '2.25rem', weight: 700, lh: 1.1 },
            h3: { size: '1.75rem', weight: 700, lh: 1.2 },
            h4: { size: '1.25rem', weight: 500, lh: 1.35 },
            body: { size: '1rem', weight: 400, lh: 1.6 },
        },
    },
    {
        id: 'academic',
        name: 'Academic',
        headingLabel: 'Lato',
        bodyLabel: 'EB Garamond',
        monoLabel: 'Source Code Pro',
        headingFont: '"Lato", sans-serif',
        bodyFont: '"EB Garamond", serif',
        monoFont: '"Source Code Pro", monospace',
        googleFamilies: [
            'Lato:wght@400;700',
            'EB+Garamond:wght@400;500',
            'Source+Code+Pro:wght@400;500',
        ],
        scale: {
            h1: { size: '2.5rem', weight: 400, lh: 1.15 },
            h2: { size: '2rem', weight: 400, lh: 1.2 },
            h3: { size: '1.5rem', weight: 400, lh: 1.3 },
            h4: { size: '1.25rem', weight: 500, lh: 1.35 },
            body: { size: '1rem', weight: 400, lh: 1.6 },
        },
    },
];

const DEFAULT_ID = 'default';
const ACTIVE_LINK_ID = 'semsync-typography-font-link';

function buildGoogleFontsHref(families: string[]): string {
    if (!families.length) return '';
    const familyParams = families.map((f) => `family=${f}`).join('&');
    return `https://fonts.googleapis.com/css2?${familyParams}&display=swap`;
}

function applyTypography(preset: TypographyPreset) {
    const root = document.documentElement;
    root.style.setProperty('--font-headline', preset.headingFont);
    root.style.setProperty('--font-sans', preset.bodyFont);
    root.style.setProperty('--font-mono', preset.monoFont);

    (Object.keys(preset.scale) as (keyof TypeScale)[]).forEach((level) => {
        const l = preset.scale[level];
        root.style.setProperty(`--type-${level}-size`, l.size);
        root.style.setProperty(`--type-${level}-weight`, String(l.weight));
        root.style.setProperty(`--type-${level}-lh`, String(l.lh));
    });

    root.setAttribute('data-typography', preset.id);

    const href = buildGoogleFontsHref(preset.googleFamilies);
    let link = document.getElementById(
        ACTIVE_LINK_ID,
    ) as HTMLLinkElement | null;

    if (!href) {
        if (link) link.remove();
        return;
    }
    if (!link) {
        link = document.createElement('link');
        link.id = ACTIVE_LINK_ID;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }
    if (link.href !== href) link.href = href;
}

interface TypographyCtx {
    typography: TypographyPreset;
    setTypography: (id: string) => void;
    presets: TypographyPreset[];
}

const TypographyContext = createContext<TypographyCtx | null>(null);

export function TypographyProvider({ children }: { children: ReactNode }) {
    const [presetId, setPresetId] = useState<string>(() => {
        const stored = getConfiguration().typography;
        return TYPOGRAPHY_PRESETS.some((p) => p.id === stored)
            ? stored
            : DEFAULT_ID;
    });

    const preset =
        TYPOGRAPHY_PRESETS.find((p) => p.id === presetId) ??
        TYPOGRAPHY_PRESETS[0];

    useEffect(() => {
        applyTypography(preset);
    }, [preset]);

    const setTypography = (id: string) => {
        const valid = TYPOGRAPHY_PRESETS.some((p) => p.id === id)
            ? id
            : DEFAULT_ID;
        updateConfiguration({ typography: valid });
        setPresetId(valid);
    };

    return (
        <TypographyContext.Provider
            value={{
                typography: preset,
                setTypography,
                presets: TYPOGRAPHY_PRESETS,
            }}
        >
            {children}
        </TypographyContext.Provider>
    );
}

export function useTypography() {
    const ctx = useContext(TypographyContext);
    if (!ctx)
        throw new Error('useTypography must be used within TypographyProvider');
    return ctx;
}
