import crypto from "crypto";
import { insertEvent, getEarnedAchievements } from "../../db/gamification.js";
import { getISTContext } from "../../common/utils/dates.js";
import { computeXP } from "../../common/utils/xp.js";
import { findUpcomingEvalsByUser } from "../../db/queries.js";
import {
    getStats, getStreak, getTodayGoals, countTodaySessions, getLastSessionDate,
    upsertStats, upsertStreak, updateGoalStatus, insertGoals,
    getRecentSessions, get7DayAvgMinutes, getGoalCompletionRate,
    runInTransaction, getActiveTimer, insertTimer, updateTimer, deleteTimer,
    getWeekSessionDates, getTodaySessionHours, findRecentBelowTargetEval, getTodayMinutesTotal,
    insertSessionEvents, findFinalStreak,
} from "./focus.db.js";

async function completeSession(userId, { actualMinutes, plannedMinutes, linkedTaskId, linkedEvalId, linkedEvalDueDate }) {
    const { today, yesterday, weekStart, hourOfDay } = getISTContext();

    const [todayCount, lastSessionDate] = await Promise.all([
        countTodaySessions(userId, today),
        getLastSessionDate(userId),
    ]);

    const daysSinceLastSession = lastSessionDate
        ? Math.floor((Date.now() - new Date(lastSessionDate).getTime()) / 86400000)
        : null;

    const rawXp = computeXP({ actualMinutes, plannedMinutes });
    const isLinked = !!(linkedTaskId || linkedEvalId);

    const { streakStatus, finalStats, finalStreak, goalsCompleted, allTodayGoalsCompleted } = await runInTransaction(async (tx) => {
        const [statsRow, txStreakStatus] = await Promise.all([
            upsertStats(userId, actualMinutes, rawXp, today, weekStart, true, tx),
            upsertStreak(userId, today, yesterday, tx),
        ]);

        const eventRows = [];
        if (daysSinceLastSession !== null && daysSinceLastSession >= 3) {
            eventRows.push({ userId, type: "session.comeback", metadata: { days_away: daysSinceLastSession } });
        }
        if (txStreakStatus?.wasBroken && txStreakStatus.previousStreak > 0) {
            eventRows.push({ userId, type: "streak.broken", metadata: { previous_streak: txStreakStatus.previousStreak, days_away: daysSinceLastSession } });
        }
        if (isLinked) {
            eventRows.push({ userId, type: "session.linked_completed", metadata: { linked_task: linkedTaskId, linked_eval: linkedEvalId } });
        }
        eventRows.push({
            userId, type: "session.completed",
            metadata: {
                duration_minutes: actualMinutes,
                planned_minutes: plannedMinutes,
                xp_awarded: rawXp,
                hour_of_day: hourOfDay,
                linked: isLinked,
                local_date: today,
                status: "completed",
            },
        });
        await insertSessionEvents(tx, eventRows);

        const cumulativeMinutes = await getTodayMinutesTotal(userId, today, tx);
        const { completed, allCompleted } = await checkAndCompleteGoals(userId, today, cumulativeMinutes, txStreakStatus, tx);

        const txFinalStreak = await findFinalStreak(tx, userId);

        return {
            streakStatus: txStreakStatus,
            finalStats: statsRow,
            finalStreak: txFinalStreak,
            goalsCompleted: completed,
            allTodayGoalsCompleted: allCompleted,
        };
    });

    const [weekDates, todayHours, hadRecentBadGrade] = await Promise.all([
        getWeekSessionDates(userId, weekStart),
        getTodaySessionHours(userId, today),
        findRecentBelowTargetEval(userId, new Date(Date.now() - 24 * 3600000)),
    ]);

    const distinctDaysThisWeek = new Set(weekDates).size;
    const weekdayOf = (dateStr) => new Date(`${dateStr}T12:00:00Z`).getUTCDay();
    const weekendBoth = weekDates.some((d) => weekdayOf(d) === 6) && weekDates.some((d) => weekdayOf(d) === 0);
    const bookendToday = todayHours.some((h) => h < 8) && todayHours.some((h) => h >= 21);

    let linkedEvalHoursAhead = null;
    if (linkedEvalId && linkedEvalDueDate) {
        linkedEvalHoursAhead = (new Date(linkedEvalDueDate).getTime() - Date.now()) / 3600000;
    }

    const achievementMeta = {
        totalSessions: finalStats?.totalSessions ?? 0,
        currentStreak: finalStreak?.currentStreak ?? 0,
        longestStreak: finalStreak?.longestStreak ?? 0,
        level: finalStats?.level ?? 1,
        actualMinutes,
        plannedMinutes,
        linked: isLinked,
        hourOfDay,
        daysSinceLastSession,
        distinctDaysThisWeek,
        weekConsistent: distinctDaysThisWeek >= 5,
        weekendBoth,
        bookendToday,
        sessionsToday: todayCount + 1,
        spiteSession: hadRecentBadGrade,
        allTodayGoalsCompleted,
        linkedEvalHoursAhead,
    };

    return {
        xp: rawXp,
        streakStatus,
        goalsCompleted,
        stats: finalStats,
        streak: finalStreak,
        dropped: false,
        incomplete: false,
        achievementMeta,
    };
}

export async function checkAndCompleteGoals(userId, today, cumulativeMinutes, streakStatus, tx) {
    const goals = await getTodayGoals(userId, today);
    const completed = [];

    for (const g of goals) {
        if (g.status !== "pending") continue;
        let done = false;
        if (g.type === "session_duration" && cumulativeMinutes >= g.targetValue) done = true;
        if (g.type === "streak_maintain" && streakStatus.currentStreak > 0) done = true;
        if (g.type === "eval_prep" && cumulativeMinutes >= g.targetValue) done = true;
        if (g.type === "stretch" && cumulativeMinutes >= g.targetValue) done = true;
        if (done) {
            await updateGoalStatus(g.id, "completed", tx);
            completed.push(g);
        }
    }

    const allCompleted = goals.length > 0 && goals.every(
        (g) => g.status === "completed" || completed.some((c) => c.id === g.id),
    );

    return { completed, allCompleted };
}

export async function generateDailyGoals(userId, stats, streak, today) {
    const isNewUser = (stats?.totalSessions ?? 0) < 5;
    const [avgMinutes, completionRate, yesterdayRate] = await Promise.all([
        get7DayAvgMinutes(userId),
        getGoalCompletionRate(userId, 3),
        getGoalCompletionRate(userId, 1),
    ]);

    let baseline;
    if (isNewUser) baseline = 15;
    else if (yesterdayRate === 0) baseline = Math.max(15, Math.round(avgMinutes * 0.6));
    else if (completionRate >= 1.0) baseline = Math.round((avgMinutes || 20) * 0.9);
    else baseline = avgMinutes > 0 ? Math.round(avgMinutes * 0.8) : 20;

    const maxGoals = isNewUser || yesterdayRate === 0 ? 2 : 3;
    const goals = [
        { userId, date: today, type: "session_duration", title: `Study for ${baseline} minutes today`, targetValue: baseline, xpReward: 30 },
    ];

    if (goals.length < maxGoals) {
        const upcoming = await findUpcomingEvalsByUser(userId);
        const soon = upcoming
            .flatMap(c => (c.evaluations ?? []).map(e => ({ ...e, courseName: c.name })))
            .filter(e => {
                const d = Math.ceil((new Date(e.date).getTime() - Date.now()) / 86400000);
                return d >= 0 && d <= 3;
            });

        if (soon[0]) {
            goals.push({ userId, date: today, type: "eval_prep", title: `Prepare for ${soon[0].title}`, targetValue: baseline, xpReward: 50 });
        } else if ((streak?.currentStreak ?? 0) > 0) {
            goals.push({ userId, date: today, type: "streak_maintain", title: `Keep your ${streak.currentStreak}-day streak alive 🔥`, targetValue: 1, xpReward: 40 });
        }
    }

    if (goals.length < maxGoals && completionRate >= 1.0) {
        goals.push({ userId, date: today, type: "stretch", title: `Push to ${baseline + 20} min — you've been on a roll`, targetValue: baseline + 20, xpReward: 60 });
    }

    return insertGoals(goals.slice(0, maxGoals));
}

function normalizeStreakFreshness(streak, today, yesterday) {
    if (!streak) return streak;
    const streakStillAlive = streak.lastActiveDate === today || streak.lastActiveDate === yesterday;
    if (streakStillAlive) return streak;
    return { ...streak, currentStreak: 0 };
}

export async function getDashboardData(userId) {
    const { today, yesterday } = getISTContext();
    const [stats, rawStreak, earned, recentSessions] = await Promise.all([
        getStats(userId),
        getStreak(userId),
        getEarnedAchievements(userId),
        getRecentSessions(userId, 20),
    ]);

    const streak = normalizeStreakFreshness(rawStreak, today, yesterday);

    let goals = await getTodayGoals(userId, today);
    if (!goals.length) {
        goals = await generateDailyGoals(userId, stats, streak, today);
    }

    return { stats, streak, earned, goals, recentSessions };
}

function computeElapsedSeconds(timer) {
    const baseMs = Date.now() - new Date(timer.startedAt).getTime();
    const baseSeconds = Math.floor(baseMs / 1000);
    const paused = timer.pausedElapsedSeconds ?? 0;
    if (timer.status === "paused" && timer.pausedAt) {
        const pausedMs = Date.now() - new Date(timer.pausedAt).getTime();
        return Math.max(0, baseSeconds - paused - Math.floor(pausedMs / 1000));
    }
    return Math.max(0, baseSeconds - paused);
}

function serializeTimer(timer) {
    if (!timer) return null;
    const elapsedSeconds = Math.min(computeElapsedSeconds(timer), timer.plannedMinutes * 60);
    return {
        id: timer.id,
        status: timer.status,
        startedAt: timer.startedAt,
        plannedMinutes: timer.plannedMinutes,
        elapsedSeconds,
        remainingSeconds: Math.max(0, timer.plannedMinutes * 60 - elapsedSeconds),
        nonce: timer.nonce,
        linkedTaskId: timer.linkedTaskId ?? null,
        linkedEvalId: timer.linkedEvalId ?? null,
        quickTitle: timer.quickTitle ?? null,
        quickCategory: timer.quickCategory ?? null,
    };
}

export async function getTimer(userId) {
    const timer = await getActiveTimer(userId);
    return serializeTimer(timer);
}

export async function startTimer(userId, body) {
    const existing = await getActiveTimer(userId);
    if (existing) {
        return { timer: serializeTimer(existing), alreadyActive: true };
    }

    const plannedMinutes = body.plannedMinutes;
    const nonce = crypto.randomBytes(16).toString("hex");

    const timer = await insertTimer({
        userId,
        status: "running",
        plannedMinutes,
        pausedElapsedSeconds: 0,
        linkedTaskId: body.linkedTaskId ?? null,
        linkedEvalId: body.linkedEvalId ?? null,
        linkedEvalDueDate: body.linkedEvalDueDate ? new Date(body.linkedEvalDueDate) : null,
        quickTitle: body.quickTitle ?? null,
        quickCategory: body.quickCategory ?? null,
        nonce,
    });

    return { timer: serializeTimer(timer), alreadyActive: false };
}

export async function pauseTimer(userId) {
    const timer = await getActiveTimer(userId);
    if (!timer) return { error: "no_active_timer" };
    if (timer.status === "paused") return { timer: serializeTimer(timer) };

    const updated = await updateTimer(userId, {
        status: "paused",
        pausedAt: new Date(),
    });
    return { timer: serializeTimer(updated) };
}

export async function resumeTimer(userId) {
    const timer = await getActiveTimer(userId);
    if (!timer) return { error: "no_active_timer" };
    if (timer.status === "running") return { timer: serializeTimer(timer) };

    const additionalPausedSec = timer.pausedAt
        ? Math.floor((Date.now() - new Date(timer.pausedAt).getTime()) / 1000)
        : 0;

    const updated = await updateTimer(userId, {
        status: "running",
        pausedAt: null,
        pausedElapsedSeconds: (timer.pausedElapsedSeconds ?? 0) + additionalPausedSec,
    });
    return { timer: serializeTimer(updated) };
}

export async function extendTimer(userId, body) {
    const timer = await getActiveTimer(userId);
    if (!timer) return { error: "no_active_timer" };
    if (timer.status !== "running") return { error: "timer_not_running" };

    const addMinutes = Math.min(Math.max(Math.floor(Number(body.addMinutes) || 5), 1), 30);
    const newPlanned = Math.min(timer.plannedMinutes + addMinutes, 240);

    const updated = await updateTimer(userId, { plannedMinutes: newPlanned });
    return { timer: serializeTimer(updated) };
}

export async function syncTimer(userId) {
    const timer = await getActiveTimer(userId);
    return { timer: serializeTimer(timer) };
}

async function settleIncompleteSession(userId, { actualMinutes, plannedMinutes, linkedTaskId, linkedEvalId }) {
    const { today, hourOfDay } = getISTContext();
    const isLinked = !!(linkedTaskId || linkedEvalId);

    await insertEvent({
        userId,
        type: "session.incomplete",
        metadata: {
            duration_minutes: actualMinutes,
            planned_minutes: plannedMinutes,
            hour_of_day: hourOfDay,
            linked: isLinked,
            linked_task: linkedTaskId ?? null,
            linked_eval: linkedEvalId ?? null,
            local_date: today,
            status: "incomplete",
        },
    });

    const cumulativeMinutes = await getTodayMinutesTotal(userId, today);
    await checkAndCompleteGoals(userId, today, cumulativeMinutes, { currentStreak: 0 });

    return { actualMinutes, plannedMinutes, linked: isLinked, hourOfDay };
}

export async function endTimer(userId, body) {
    const timer = await getActiveTimer(userId);
    if (!timer) return { dropped: true, reason: "no_active_timer" };
    if (body.nonce !== timer.nonce) return { dropped: true, reason: "invalid_nonce" };

    const plannedMinutes = timer.plannedMinutes;
    const cappedElapsedSeconds = Math.min(computeElapsedSeconds(timer), plannedMinutes * 60);
    const actualMinutes = Math.floor(cappedElapsedSeconds / 60);

    await deleteTimer(userId);

    if (actualMinutes < 1) {
        return { dropped: true, reason: "session_too_short" };
    }

    const linkedTaskId = timer.linkedTaskId ?? null;
    const linkedEvalId = timer.linkedEvalId ?? null;
    const linkedEvalDueDate = timer.linkedEvalDueDate?.toISOString() ?? null;

    if (actualMinutes >= plannedMinutes) {
        const result = await completeSession(userId, { actualMinutes, plannedMinutes, linkedTaskId, linkedEvalId, linkedEvalDueDate });
        return { ...result, actualMinutes };
    }

    if (actualMinutes > 3) {
        const achievementMeta = await settleIncompleteSession(userId, { actualMinutes, plannedMinutes, linkedTaskId, linkedEvalId });
        return { dropped: false, incomplete: true, actualMinutes, plannedMinutes, achievementMeta };
    }

    return { dropped: true, reason: "session_too_short" };
}