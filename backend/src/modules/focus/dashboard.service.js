import {
    getStats, getStreak, getEarnedAchievements, getTodayGoals, getRecentSessions,
} from "../../db/gamification.js";
import { ACHIEVEMENTS } from "./achievements.js";
import { getISTDateStr } from "../../common/utils/dates.js";
import { generateDailyGoals } from "./utils/goals.js";

export async function getDashboardData(userId) {
    const [stats, streak, earned, recentSessions] = await Promise.all([
        getStats(userId),
        getStreak(userId),
        getEarnedAchievements(userId),
        getRecentSessions(userId, 20),
    ]);

    const today = getISTDateStr();
    let goals = await getTodayGoals(userId, today);
    if (!goals.length) {
        goals = await generateDailyGoals(userId, stats, streak, today);
    }

    const catalog = buildCatalog(earned);

    return { stats, streak, earned, goals, recentSessions, catalog };
}

/**
 * Build the achievement catalog for the client.
 * Hidden unearned achievements are fully masked — no id/name/desc/emoji/tier/xp.
 */
function buildCatalog(earned) {
    const earnedMap = new Map(earned.map(e => [e.achievementId, e]));

    return ACHIEVEMENTS.map(a => {
        const earnedRow = earnedMap.get(a.id);

        if (earnedRow) {
            return {
                id: a.id, name: a.name, desc: a.desc, emoji: a.emoji,
                tier: a.tier, xp: a.xp, hidden: a.hidden,
                earned: true, earnedAt: earnedRow.earnedAt, xpAwarded: earnedRow.xpAwarded,
            };
        }

        if (a.hidden) {
            return { id: null, tier: a.tier, hidden: true, locked: true, earned: false };
        }

        return {
            id: a.id, name: a.name, desc: a.desc, emoji: a.emoji,
            tier: a.tier, xp: a.xp, hidden: false, locked: true, earned: false,
        };
    });
}
