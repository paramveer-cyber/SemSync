import {
    createContext,
    useContext,
    useCallback,
    useEffect,
    useRef,
    useState,
    ReactNode,
} from 'react';
import { getGamificationDashboard, getAchievementCatalog } from '../lib/api';
import { cacheGet, cacheSet, cacheHas, dedupe, CACHE_KEYS } from '../lib/sessionCache';
import { getToken } from '../lib/tokenStore';
import { getConfiguration, updateConfiguration } from '../lib/localConfiguration';
import { useAuth } from './AuthContext';
import {
    playToastUnlock,
    playCinematicUnlock,
    playXPGain,
    playLevelUp,
    warmAudio,
} from '../lib/sound';

export interface AchievementEntry {
    id: string;
    name: string;
    emoji: string;
    tier: string;
    xp: number;
    desc: string;
    earnedAt?: string;
}

export interface CatalogAchievement {
    id: string;
    name: string;
    emoji?: string;
    tier?: string;
    xp?: number;
    desc?: string;
    earnedAt?: string;
    completed?: boolean;
}

export interface XPState {
    totalXp: number;
    level: number;
    currentStreak: number;
}

interface AchievementCtx {
    pendingUnlocks: AchievementEntry[];
    dismissUnlock: (id: string) => void;
    xpState: XPState | null;
    refresh: () => Promise<void>;
    checkAchievements: () => Promise<void>;
}

export const CINEMATIC_TIERS = new Set(['platinum', 'legendary', 'hidden']);

function loadSeen(): Set<string> {
    return new Set(getConfiguration().seenAchievements);
}
function saveSeen(s: Set<string>) {
    updateConfiguration({ seenAchievements: [...s].slice(-200) });
}
function loadXPState(): XPState | null {
    return getConfiguration().xpState;
}
function saveXPState(s: XPState) {
    updateConfiguration({ xpState: s });
}

const BASE = import.meta.env.VITE_BASE_URL ?? '';
const Ctx = createContext<AchievementCtx | null>(null);

export const AchievementProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();

    const [pendingUnlocks, setPendingUnlocks] = useState<AchievementEntry[]>(
        [],
    );
    const [xpState, setXPState] = useState<XPState | null>(loadXPState);

    const seenRef = useRef<Set<string>>(loadSeen());
    const prevLevelRef = useRef<number>(xpState?.level ?? 0);
    const prevXPRef = useRef<number>(xpState?.totalXp ?? 0);
    const fetchingRef = useRef(false);
    const esRef = useRef<EventSource | null>(null);
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showUnlocks = useCallback(
        (entries: AchievementEntry[], skipSeenCheck = false) => {
            const fresh = skipSeenCheck
                ? entries.filter((a) => {
                      const alreadyPending = pendingUnlocks.find(
                          (p) => p.id === a.id,
                      );
                      return !alreadyPending;
                  })
                : entries.filter((a) => !seenRef.current.has(a.id));

            if (!fresh.length) return;

            fresh.forEach((a) => seenRef.current.add(a.id));
            saveSeen(seenRef.current);

            const toasts = fresh.filter((a) => !CINEMATIC_TIERS.has(a.tier));
            const cinematic = fresh.filter((a) => CINEMATIC_TIERS.has(a.tier));
            const ordered = [...toasts, ...cinematic];

            setPendingUnlocks((prev) => {
                const existingIds = new Set(prev.map((a) => a.id));
                return [
                    ...prev,
                    ...ordered.filter((a) => !existingIds.has(a.id)),
                ];
            });

            const first = ordered[0];
            if (first) {
                if (CINEMATIC_TIERS.has(first.tier)) {
                    playCinematicUnlock(
                        first.tier as 'platinum' | 'legendary' | 'hidden',
                    );
                } else {
                    playToastUnlock();
                }
            }
        },
        [pendingUnlocks],
    );

    const processData = useCallback(
        (d: any, catalogAchievements: CatalogAchievement[] = []) => {
            const newXP: XPState = {
                totalXp: d.stats?.totalXp ?? 0,
                level: d.stats?.level ?? 1,
                currentStreak: d.streak?.currentStreak ?? 0,
            };

            if (prevXPRef.current > 0 && newXP.totalXp > prevXPRef.current)
                playXPGain();
            if (prevLevelRef.current > 0 && newXP.level > prevLevelRef.current)
                playLevelUp();

            prevXPRef.current = newXP.totalXp;
            prevLevelRef.current = newXP.level;
            setXPState(newXP);
            saveXPState(newXP);

            const earnedEntries: AchievementEntry[] = catalogAchievements
                .filter((a) => a.completed && a.name && a.id)
                .map((a) => ({
                    id: a.id,
                    name: a.name,
                    emoji: a.emoji ?? '🏆',
                    tier: a.tier ?? 'bronze',
                    xp: a.xp ?? 0,
                    desc: a.desc ?? '',
                    earnedAt: a.earnedAt,
                }));

            const earned: any[] = d.earned ?? [];
            const earnedFromList: AchievementEntry[] = earned
                .filter(
                    (a) =>
                        a.achievementId &&
                        !catalogAchievements.find(
                            (c) => c.id === a.achievementId,
                        ),
                )
                .map((a) => ({
                    id: a.achievementId,
                    name: a.name ?? 'Achievement',
                    emoji: a.emoji ?? '🏆',
                    tier: a.tier ?? 'bronze',
                    xp: a.xpAwarded ?? 0,
                    desc: a.desc ?? '',
                    earnedAt: a.earnedAt,
                }));

            showUnlocks([...earnedEntries, ...earnedFromList], false);
        },
        [showUnlocks],
    );

    const refresh = useCallback(async () => {
        if (fetchingRef.current) return;
        fetchingRef.current = true;
        try {
            const d = await getGamificationDashboard();
            let catalogAchievements: CatalogAchievement[] = [];
            try {
                if (!cacheHas(CACHE_KEYS.achievementCatalog)) {
                    await dedupe(CACHE_KEYS.achievementCatalog, async () => {
                        const catalogRes = await getAchievementCatalog();
                        cacheSet(CACHE_KEYS.achievementCatalog, catalogRes.achievements ?? []);
                    });
                }
                catalogAchievements = cacheGet<CatalogAchievement[]>(CACHE_KEYS.achievementCatalog) ?? [];
            } catch {}
            processData(d, catalogAchievements);
        } catch {
        } finally {
            fetchingRef.current = false;
        }
    }, [processData]);

    const checkAchievements = refresh;

    const dismissUnlock = useCallback((id: string) => {
        setPendingUnlocks((prev) => prev.filter((a) => a.id !== id));
    }, []);

    const closeSSE = useCallback(() => {
        esRef.current?.close();
        esRef.current = null;
        if (reconnectTimer.current) {
            clearTimeout(reconnectTimer.current);
            reconnectTimer.current = null;
        }
    }, []);

    const openSSERef = useRef<() => void>(() => {});

    const openSSE = useCallback(() => {
        closeSSE();
        const token = getToken();
        if (!token) return;

        const es = new EventSource(
            `${BASE}/events/stream?token=${encodeURIComponent(token)}`,
        );
        esRef.current = es;

        es.addEventListener('achievements', (e: MessageEvent) => {
            try {
                const raw: any[] = JSON.parse(e.data);
                const entries: AchievementEntry[] = raw
                    .filter((a) => a.id && a.name)
                    .map((a) => ({
                        id: a.id,
                        name: a.name,
                        emoji: a.emoji ?? '🏆',
                        tier: a.tier ?? 'bronze',
                        xp: a.xpAwarded ?? a.xp ?? 0,
                        desc: a.desc ?? '',
                    }));
                showUnlocks(entries, true);
                refresh();
            } catch {}
        });

        es.onerror = () => {
            closeSSE();
            reconnectTimer.current = setTimeout(
                () => openSSERef.current(),
                5000,
            );
        };
    }, [closeSSE, showUnlocks, refresh]);

    useEffect(() => {
        openSSERef.current = openSSE;
    }, [openSSE]);

    useEffect(() => {
        if (!user) {
            closeSSE();
            return closeSSE;
        }

        refresh();

        const token = getToken();
        if (token) {
            openSSE();
        } else {
            const waitForToken = () => {
                if (getToken()) {
                    openSSE();
                    window.removeEventListener('auth:login', waitForToken);
                }
            };
            window.addEventListener('auth:login', waitForToken);
            return () => {
                window.removeEventListener('auth:login', waitForToken);
                closeSSE();
            };
        }

        return closeSSE;
    }, [user]);

    useEffect(() => {
        const onTokenRotated = () => {
            openSSERef.current();
        };
        window.addEventListener('auth:login', onTokenRotated);
        return () => window.removeEventListener('auth:login', onTokenRotated);
    }, []);

    useEffect(() => {
        const warm = () => {
            warmAudio();
            document.removeEventListener('click', warm);
        };
        document.addEventListener('click', warm, { once: true });
        return () => document.removeEventListener('click', warm);
    }, []);

    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === 'visible' && user) refresh();
        };
        document.addEventListener('visibilitychange', onVisible);
        return () =>
            document.removeEventListener('visibilitychange', onVisible);
    }, [refresh, user]);

    return (
        <Ctx.Provider
            value={{
                pendingUnlocks,
                dismissUnlock,
                xpState,
                refresh,
                checkAchievements,
            }}
        >
            {children}
        </Ctx.Provider>
    );
};

export const useAchievements = () => {
    const c = useContext(Ctx);
    if (!c)
        throw new Error('useAchievements must be inside AchievementProvider');
    return c;
};
