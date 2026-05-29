import { db } from "./index.js";
import { events, userStats, userStreaks, userAchievements, dailyGoals } from "./schema.js";
import { eq, and, gte, desc, sql } from "drizzle-orm";

export const getStats = (userId) =>
    db.query.userStats.findFirst({ where: eq(userStats.userId, userId) });

export const getStreak = (userId) =>
    db.query.userStreaks.findFirst({ where: eq(userStreaks.userId, userId) });

export const getEarnedAchievements = async (userId) => {
    const rows = await db.query.userAchievements.findMany({
        where: eq(userAchievements.userId, userId),
        orderBy: [desc(userAchievements.earnedAt)],
    });
    const seen = new Map();
    for (const row of [...rows].reverse()) seen.set(row.achievementId, row);
    return [...seen.values()];
};

export const getTodayGoals = (userId, today) =>
    db.query.dailyGoals.findMany({ where: and(eq(dailyGoals.userId, userId), eq(dailyGoals.date, today)) });

export const insertEvent = (data, tx) =>
    (tx ?? db).insert(events).values(data).returning().then(r => r[0]);

export const insertAchievements = async (rows, tx) => {
    if (!rows.length) return [];
    return (tx ?? db).insert(userAchievements)
        .values(rows)
        .onConflictDoNothing({ target: [userAchievements.userId, userAchievements.achievementId] })
        .returning();
};

export const countEventsByType = async (userId, type, tx) => {
    const result = await (tx ?? db).select({ count: sql`count(*)` })
        .from(events)
        .where(and(eq(events.userId, userId), eq(events.type, type)));
    return Number(result[0]?.count ?? 0);
};

export const countEventsByTypeAndDate = async (userId, type, dateStr) => {
    const result = await db.select({ count: sql`count(*)` })
        .from(events)
        .where(and(
            eq(events.userId, userId),
            eq(events.type, type),
            sql`metadata->>'date' = ${dateStr}`
        ));
    return Number(result[0]?.count ?? 0);
};

export const countScoreEventsForEval = async (userId, evalId) => {
    const result = await db.select({ count: sql`count(*)` })
        .from(events)
        .where(and(
            eq(events.userId, userId),
            eq(events.type, "eval.score_entered"),
            sql`metadata->>'eval_id' = ${evalId}`
        ));
    return Number(result[0]?.count ?? 0);
};

export const countTodaySessions = async (userId, todayStr, tx) => {
    const result = await (tx ?? db).select({ count: sql`count(*)` })
        .from(events)
        .where(and(
            eq(events.userId, userId),
            eq(events.type, "session.completed"),
            sql`metadata->>'local_date' = ${todayStr}`
        ));
    return Number(result[0]?.count ?? 0);
};

export const getLastSessionDate = async (userId) => {
    const result = await db.query.events.findFirst({
        where: and(eq(events.userId, userId), eq(events.type, "session.completed")),
        orderBy: [desc(events.occurredAt)],
    });
    return result?.occurredAt ?? null;
};

export const upsertStats = async (userId, minutes, xp, today, weekStart, isNewSession = true, tx) => {
    const sessionIncrement = isNewSession ? 1 : 0;
    const result = await (tx ?? db).execute(sql`
        INSERT INTO user_stats (user_id, total_sessions, total_minutes, today_minutes, week_minutes, total_xp, stats_date, week_start)
        VALUES (${userId}, ${sessionIncrement}, ${minutes}, ${minutes}, ${minutes}, ${xp}, ${today}, ${weekStart})
        ON CONFLICT (user_id) DO UPDATE SET
            total_sessions = user_stats.total_sessions + ${sessionIncrement},
            total_minutes  = user_stats.total_minutes + ${minutes},
            today_minutes  = CASE WHEN user_stats.stats_date = ${today}
                             THEN user_stats.today_minutes + ${minutes} ELSE ${minutes} END,
            week_minutes   = CASE WHEN user_stats.week_start = ${weekStart}
                             THEN user_stats.week_minutes + ${minutes} ELSE ${minutes} END,
            total_xp       = user_stats.total_xp + ${xp},
            level          = GREATEST(1, FLOOR(SQRT((user_stats.total_xp + ${xp}) / 100.0))::int + 1),
            stats_date     = ${today},
            week_start     = ${weekStart}
        RETURNING *
    `);
    const row = result.rows[0];
    if (!row) return null;
    return {
        userId: row.user_id,
        totalSessions: row.total_sessions,
        totalMinutes: row.total_minutes,
        todayMinutes: row.today_minutes,
        weekMinutes: row.week_minutes,
        totalXp: row.total_xp,
        level: row.level,
        statsDate: row.stats_date,
        weekStart: row.week_start,
    };
};

export const upsertStreak = async (userId, today, yesterday, tx) => {
    const result = await (tx ?? db).execute(sql`
        WITH old AS (
            SELECT current_streak, last_active_date FROM user_streaks WHERE user_id = ${userId}
        )
        INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_active_date, freeze_count)
        VALUES (${userId}, 1, 1, ${today}, 2)
        ON CONFLICT (user_id) DO UPDATE SET
            current_streak   = CASE
                WHEN (SELECT last_active_date FROM old) = ${today}     THEN user_streaks.current_streak
                WHEN (SELECT last_active_date FROM old) = ${yesterday} THEN user_streaks.current_streak + 1
                ELSE 1
            END,
            longest_streak   = CASE
                WHEN (SELECT last_active_date FROM old) = ${today}     THEN user_streaks.longest_streak
                WHEN (SELECT last_active_date FROM old) = ${yesterday} THEN GREATEST(user_streaks.longest_streak, user_streaks.current_streak + 1)
                ELSE GREATEST(user_streaks.longest_streak, 1)
            END,
            last_active_date = ${today}
        RETURNING
            current_streak,
            (SELECT current_streak  FROM old) AS old_streak,
            (SELECT last_active_date FROM old) AS old_date
    `);
    const row = result.rows[0];
    if (!row) return { currentStreak: 1, wasIncremented: true, wasBroken: false };

    const currentStreak = Number(row.current_streak);
    const oldStreak = row.old_streak != null ? Number(row.old_streak) : null;
    const oldDate = row.old_date;

    if (oldDate == null) return { currentStreak: 1, wasIncremented: true, wasBroken: false };
    if (oldDate === today) return { currentStreak, wasIncremented: false, wasBroken: false };
    if (oldDate === yesterday) return { currentStreak, wasIncremented: true, wasBroken: false, previousStreak: oldStreak };
    return { currentStreak: 1, wasIncremented: false, wasBroken: true, previousStreak: oldStreak };
};

export const useStreakFreeze = async (userId) => {
    const streak = await getStreak(userId);
    if (!streak || streak.freezeCount <= 0) return false;
    if (!streak.lastActiveDate) return false;

    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    if (streak.lastActiveDate === today) return false;

    const yesterday = (() => {
        const d = new Date(today + "T12:00:00Z");
        d.setUTCDate(d.getUTCDate() - 1);
        return d.toISOString().slice(0, 10);
    })();

    await db.update(userStreaks)
        .set({ freezeCount: streak.freezeCount - 1, lastActiveDate: yesterday })
        .where(eq(userStreaks.userId, userId));
    return true;
};

export const updateGoalStatus = (goalId, status, tx) =>
    (tx ?? db).update(dailyGoals).set({ status }).where(eq(dailyGoals.id, goalId)).returning();

export const insertGoals = (rows) => db.insert(dailyGoals).values(rows).returning();

export const getRecentSessions = async (userId, limit = 20) =>
    db.query.events.findMany({
        where: and(eq(events.userId, userId), eq(events.type, "session.completed")),
        orderBy: [desc(events.occurredAt)],
        limit,
    });

export const getSessionsInRange = async (userId, from) =>
    db.query.events.findMany({
        where: and(eq(events.userId, userId), eq(events.type, "session.completed"), gte(events.occurredAt, from)),
        orderBy: [desc(events.occurredAt)],
    });

export const get7DayAvgMinutes = async (userId) => {
    const from = new Date(Date.now() - 7 * 86400000);
    const sessions = await getSessionsInRange(userId, from);
    if (!sessions.length) return 0;
    const totalMins = sessions.reduce((s, e) => s + (e.metadata?.duration_minutes ?? 0), 0);
    return Math.round(totalMins / 7);
};

export const getGoalCompletionRate = async (userId, days) => {
    const from = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    const goals = await db.query.dailyGoals.findMany({
        where: and(eq(dailyGoals.userId, userId), gte(dailyGoals.date, from)),
    });
    if (!goals.length) return 0;
    const done = goals.filter(g => g.status === "completed").length;
    return done / goals.length;
};

export const getAllSessions = async (userId) =>
    db.query.events.findMany({
        where: and(eq(events.userId, userId), eq(events.type, "session.completed")),
        orderBy: [desc(events.occurredAt)],
    });

export const countHighIntegritySessions = async (userId, minIntegrity) => {
    const result = await db.select({ count: sql`count(*)` })
        .from(events)
        .where(and(
            eq(events.userId, userId),
            eq(events.type, "session.completed"),
            sql`(metadata->>'integrity_score')::float >= ${minIntegrity}`
        ));
    return Number(result[0]?.count ?? 0);
};

export const sumDeepWorkMinutes = async (userId, minIntegrity) => {
    const result = await db.select({ total: sql`coalesce(sum((metadata->>'duration_minutes')::float), 0)` })
        .from(events)
        .where(and(
            eq(events.userId, userId),
            eq(events.type, "session.completed"),
            sql`(metadata->>'integrity_score')::float >= ${minIntegrity}`
        ));
    return Number(result[0]?.total ?? 0);
};

export const getGoalsInRange = async (userId, fromDate) =>
    db.query.dailyGoals.findMany({
        where: and(eq(dailyGoals.userId, userId), gte(dailyGoals.date, fromDate)),
        orderBy: (g, { asc }) => [asc(g.date)],
    });

export const countRecentEventsByType = async (userId, type, windowSeconds) => {
    const since = new Date(Date.now() - windowSeconds * 1000);
    const result = await db.select({ count: sql`count(*)` })
        .from(events)
        .where(and(
            eq(events.userId, userId),
            eq(events.type, type),
            gte(events.occurredAt, since)
        ));
    return Number(result[0]?.count ?? 0);
};
