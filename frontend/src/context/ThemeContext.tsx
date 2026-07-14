import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from 'react';
import { Theme, THEMES, buildCustomThemeVars } from '../data/Themes';
import { getConfiguration, updateConfiguration } from '../lib/localConfiguration';


function loadCustomThemes(): Theme[] {
    return getConfiguration().customThemes as Theme[];
}

function saveCustomThemes(themes: Theme[]) {
    updateConfiguration({ customThemes: themes });
}

interface ThemeCtx {
    theme: Theme;
    setTheme: (id: string) => void;
    customThemes: Theme[];
    addCustomTheme: (name: string, brandHex: string, dark: boolean) => Theme;
    updateCustomTheme: (
        id: string,
        name: string,
        brandHex: string,
        dark: boolean,
    ) => void;
    deleteCustomTheme: (id: string) => void;
    allThemes: Theme[];
}

const ThemeContext = createContext<ThemeCtx | null>(null);

function applyTheme(theme: Theme) {
    const root = document.documentElement;
    Object.entries(theme.vars).forEach(([k, v]) =>
        root.style.setProperty(k, v),
    );
    root.setAttribute('data-theme', theme.id);
    root.setAttribute('data-dark', theme.dark ? 'true' : 'false');
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [themeId, setThemeId] = useState<string>(() => {
        return getConfiguration().theme;
    });

    const [customThemes, setCustomThemes] = useState<Theme[]>(() =>
        loadCustomThemes(),
    );

    const allThemes = [...THEMES, ...customThemes];
    const theme = allThemes.find((t) => t.id === themeId) ?? THEMES[0];

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    const setTheme = (id: string) => {
        updateConfiguration({ theme: id });
        setThemeId(id);
    };

    const addCustomTheme = (
        name: string,
        brandHex: string,
        dark: boolean,
    ): Theme => {
        const id = `custom-${Date.now()}`;
        const newTheme: Theme = {
            id,
            name: name.trim() || 'My Theme',
            label: dark ? 'Dark' : 'Light',
            dark,
            custom: true,
            vars: buildCustomThemeVars(brandHex, dark),
        };
        const updated = [...customThemes, newTheme];
        setCustomThemes(updated);
        saveCustomThemes(updated);
        return newTheme;
    };

    const updateCustomTheme = (
        id: string,
        name: string,
        brandHex: string,
        dark: boolean,
    ) => {
        const updated = customThemes.map((t) =>
            t.id === id
                ? {
                      ...t,
                      name: name.trim() || t.name,
                      dark,
                      label: dark ? 'Dark' : 'Light',
                      vars: buildCustomThemeVars(brandHex, dark),
                  }
                : t,
        );
        setCustomThemes(updated);
        saveCustomThemes(updated);
        if (themeId === id) {
            const next = updated.find((t) => t.id === id);
            if (next) applyTheme(next);
        }
    };

    const deleteCustomTheme = (id: string) => {
        const updated = customThemes.filter((t) => t.id !== id);
        setCustomThemes(updated);
        saveCustomThemes(updated);
        if (themeId === id) setTheme('Default');
    };

    return (
        <ThemeContext.Provider
            value={{
                theme,
                setTheme,
                customThemes,
                addCustomTheme,
                updateCustomTheme,
                deleteCustomTheme,
                allThemes,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
}
