import { db } from "./index.js";
import { events, userAchievements } from "./schema.js";
import { eq, desc, sql } from "drizzle-orm";

export const insertEvent = (data, tx) =>
    (tx ?? db).insert(events).values(data).returning().then(r => r[0]);

export const getEarnedAchievements = async (userId) => {
    const rows = await db.query.userAchievements.findMany({
        where: eq(userAchievements.userId, userId),
        orderBy: [desc(userAchievements.earnedAt)],
    });
    const seen = new Map();
    for (const row of [...rows].reverse()) seen.set(row.achievementId, row);
    return [...seen.values()];
};

export const addAchievementXp = async (userId, xp, tx) => {
    if (!xp) return null;
    const result = await (tx ?? db).execute(sql`
        INSERT INTO user_stats (user_id, total_xp, level)
        VALUES (${userId}, ${xp}, GREATEST(1, FLOOR(SQRT(${xp} / 100.0))::int + 1))
        ON CONFLICT (user_id) DO UPDATE SET
            total_xp = user_stats.total_xp + ${xp},
            level    = GREATEST(1, FLOOR(SQRT((user_stats.total_xp + ${xp}) / 100.0))::int + 1)
        RETURNING total_xp, level
    `);
    const row = result.rows[0];
    return row ? { totalXp: row.total_xp, level: row.level } : null;
};
