import { db } from "../../db/index.js";
import { achievementProgress, userAchievements } from "../../db/schema.js";
import { eq, and, inArray, sql } from "drizzle-orm";

export const getCompletedAchievementIds = async (userId, tx) => {
    const rows = await (tx ?? db).query.userAchievements.findMany({
        where: eq(userAchievements.userId, userId),
    });
    return new Set(rows.map((row) => row.achievementId));
};

export const getProgressMap = async (userId, achievementIds, tx) => {
    if (!achievementIds.length) return new Map();
    const rows = await (tx ?? db).select()
        .from(achievementProgress)
        .where(and(
            eq(achievementProgress.userId, userId),
            inArray(achievementProgress.achievementId, achievementIds),
        ));
    return new Map(rows.map((row) => [row.achievementId, row.progressValue]));
};

export const setProgressValue = async (userId, achievementId, progressValue, tx) => {
    const result = await (tx ?? db).execute(sql`
        INSERT INTO achievement_progress (user_id, achievement_id, progress_value)
        VALUES (${userId}, ${achievementId}, ${progressValue})
        ON CONFLICT (user_id, achievement_id) DO UPDATE SET
            progress_value = ${progressValue},
            updated_at = now()
        RETURNING progress_value
    `);
    return Number(result.rows[0]?.progress_value ?? progressValue);
};

export const insertCompletion = async (userId, achievementId, tier, xpAwarded, tx) => {
    const rows = await (tx ?? db).insert(userAchievements)
        .values({ userId, achievementId, tier, xpAwarded })
        .onConflictDoNothing({ target: [userAchievements.userId, userAchievements.achievementId] })
        .returning();
    return rows[0] ?? null;
};

export const runInAchievementTransaction = (callback) => db.transaction(callback);
