import { db } from "../../db/index.js";
import { events, userStats, userStreaks, dailyGoals, timers, evaluations } from "../../db/schema.js";
import { eq, and, gte, desc, sql, inArray } from "drizzle-orm";

export const incrementEvalMinutesSpent = (evalId, additionalMinutes, tx) =>
    (tx ?? db)
        .update(evaluations)
        .set({ minutesSpent: sql`${evaluations.minutesSpent} + ${additionalMinutes}` })
        .where(eq(evaluations.id, evalId));

export const getStats = (userId) =>
    db.query.userStats.findFirst({ where: eq(userStats.userId, userId) });

export const getStreak = (userId) =>
    db.query.userStreaks.findFirst({ where: eq(userStreaks.userId, userId) });

export const getTodayGoals = (userId, today) =>
    db.query.dailyGoals.findMany({ where: and(eq(dailyGoals.userId, userId), eq(dailyGoals.date, today)) });

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
        INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_active_date)
        VALUES (${userId}, 1, 1, ${today})
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

export const updateGoalStatus = (goalId, status, tx) =>
    (tx ?? db).update(dailyGoals).set({ status }).where(eq(dailyGoals.id, goalId)).returning();

export const insertGoals = (rows) => db.insert(dailyGoals).values(rows).returning();

export const getRecentSessions = async (userId, limit = 20) =>
    db.query.events.findMany({
        where: and(eq(events.userId, userId), inArray(events.type, ["session.completed", "session.incomplete"])),
        orderBy: [desc(events.occurredAt)],
        limit,
    });

export const getDailyFocusMinutes = async (userId, sinceDateStr) => {
    const rows = await db.select({
        localDate: sql`metadata->>'local_date'`,
        minutes: sql`sum((metadata->>'duration_minutes')::int)`,
    })
        .from(events)
        .where(and(
            eq(events.userId, userId),
            inArray(events.type, ["session.completed", "session.incomplete"]),
            sql`metadata->>'local_date' >= ${sinceDateStr}`
        ))
        .groupBy(sql`metadata->>'local_date'`);
    return rows.map((r) => ({ date: r.localDate, minutes: Number(r.minutes) || 0 }));
};

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

export const insertSessionEvents = (tx, rows) => tx.insert(events).values(rows);

export const findFinalStreak = (tx, userId) =>
    tx.query.userStreaks.findFirst({ where: (t, { eq }) => eq(t.userId, userId) });

export const getWeekSessionDates = async (userId, weekStartStr) => {
    const rows = await db.select({ localDate: sql`metadata->>'local_date'` })
        .from(events)
        .where(and(
            eq(events.userId, userId),
            eq(events.type, "session.completed"),
            sql`metadata->>'local_date' >= ${weekStartStr}`
        ));
    return rows.map((row) => row.localDate);
};

export const getTodaySessionHours = async (userId, todayStr) => {
    const rows = await db.select({ hour: sql`(metadata->>'hour_of_day')::int` })
        .from(events)
        .where(and(
            eq(events.userId, userId),
            eq(events.type, "session.completed"),
            sql`metadata->>'local_date' = ${todayStr}`
        ));
    return rows.map((row) => row.hour);
};

export const getTodayMinutesTotal = async (userId, todayStr, tx) => {
    const result = await (tx ?? db).select({ total: sql`COALESCE(SUM((metadata->>'duration_minutes')::int), 0)` })
        .from(events)
        .where(and(
            eq(events.userId, userId),
            inArray(events.type, ["session.completed", "session.incomplete"]),
            sql`metadata->>'local_date' = ${todayStr}`
        ));
    return Number(result[0]?.total ?? 0);
};

export const findRecentBelowTargetEval = async (userId, sinceDate) => {
    const result = await db.execute(sql`
        SELECT e.id FROM evaluations e
        JOIN courses c ON c.id = e.course_id
        WHERE c.user_id = ${userId}
          AND e.score IS NOT NULL
          AND e.updated_at >= ${sinceDate}
          AND (e.score / e.max_score) * 100 < c.target_grade
        LIMIT 1
    `);
    return result.rows.length > 0;
};

export const runInTransaction = (callback) => db.transaction(callback);

export const getActiveTimer = (userId) =>
    db.query.timers.findFirst({ where: eq(timers.userId, userId) });

export const insertTimer = (data) =>
    db.insert(timers).values(data).returning().then(r => r[0]);

export const updateTimer = (userId, patch) =>
    db.update(timers).set(patch).where(eq(timers.userId, userId)).returning().then(r => r[0]);

export const deleteTimer = (userId) =>
    db.delete(timers).where(eq(timers.userId, userId));