const CONFIGURATION_KEY = 'semsync_configuration';

export interface NotificationSettings {
    enabled: boolean;
    at6h: boolean;
    at12h: boolean;
    at24h: boolean;
    at48h: boolean;
}

export interface XPState {
    totalXp: number;
    level: number;
    currentStreak: number;
}

export interface SemsyncConfiguration {
    theme: string;
    customThemes: unknown[];
    typography: string;
    animationsEnabled: boolean;
    tutorialSeen: boolean;
    lastExportTimestamp: number | null;
    xpState: XPState | null;
    seenAchievements: string[];
    tasks: unknown[];
    calendarItems: unknown[];
    classroomData: unknown[] | null;
    classroomDoneIds: string[];
    syncedClassroomIds: string[];
    notifSettings: NotificationSettings;
    notifFiredIds: string[];
}

const defaultConfiguration: SemsyncConfiguration = {
    theme: 'Default',
    customThemes: [],
    typography: 'default',
    animationsEnabled: true,
    tutorialSeen: false,
    lastExportTimestamp: null,
    xpState: null,
    seenAchievements: [],
    tasks: [],
    calendarItems: [],
    classroomData: null,
    classroomDoneIds: [],
    syncedClassroomIds: [],
    notifSettings: {
        enabled: true,
        at6h: true,
        at12h: true,
        at24h: true,
        at48h: false,
    },
    notifFiredIds: [],
};

export function getConfiguration(): SemsyncConfiguration {
    try {
        const storedValue = localStorage.getItem(CONFIGURATION_KEY);
        if (!storedValue) return { ...defaultConfiguration };
        return { ...defaultConfiguration, ...JSON.parse(storedValue) };
    } catch {
        return { ...defaultConfiguration };
    }
}

export function updateConfiguration(
    changes: Partial<SemsyncConfiguration>,
): SemsyncConfiguration {
    const mergedConfiguration = { ...getConfiguration(), ...changes };
    try {
        localStorage.setItem(
            CONFIGURATION_KEY,
            JSON.stringify(mergedConfiguration),
        );
    } catch {}
    return mergedConfiguration;
}

export function onConfigurationChanged(
    callback: (config: SemsyncConfiguration) => void,
): () => void {
    const handleStorageEvent = (event: StorageEvent) => {
        if (event.key === CONFIGURATION_KEY) callback(getConfiguration());
    };
    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
}

const LEGACY_KEY_MAP: Record<string, keyof SemsyncConfiguration> = {
    semsync_theme: 'theme',
    semsync_custom_themes: 'customThemes',
    semsync_typography: 'typography',
    semsync_animations_enabled: 'animationsEnabled',
    semsync_tutorial_seen: 'tutorialSeen',
    semsync_last_export_ts: 'lastExportTimestamp',
    semsync_xp_state_v1: 'xpState',
    semsync_seen_achievements_v2: 'seenAchievements',
    architect_tasks_v1: 'tasks',
    semsync_calendar_items: 'calendarItems',
    semsync_classroom_data: 'classroomData',
    semsync_classroom_done_ids: 'classroomDoneIds',
    semsync_synced_classroom_ids: 'syncedClassroomIds',
    semsync_notif_settings: 'notifSettings',
    semsync_notif_fired: 'notifFiredIds',
};

function parseLegacyValue(rawValue: string, field: keyof SemsyncConfiguration) {
    if (field === 'theme' || field === 'typography') return rawValue;
    if (field === 'animationsEnabled' || field === 'tutorialSeen')
        return rawValue === 'true';
    if (field === 'lastExportTimestamp') return parseInt(rawValue, 10);
    try {
        return JSON.parse(rawValue);
    } catch {
        return null;
    }
}

export function migrateLegacyLocalStorageKeys() {
    if (localStorage.getItem(CONFIGURATION_KEY)) return;

    const migratedChanges: Partial<SemsyncConfiguration> = {};

    for (const [legacyKey, field] of Object.entries(LEGACY_KEY_MAP)) {
        const rawValue = localStorage.getItem(legacyKey);
        if (rawValue === null) continue;
        const parsedValue = parseLegacyValue(rawValue, field);
        if (parsedValue !== null) (migratedChanges as any)[field] = parsedValue;
    }

    updateConfiguration(migratedChanges);

    Object.keys(LEGACY_KEY_MAP).forEach((legacyKey) =>
        localStorage.removeItem(legacyKey),
    );
}
