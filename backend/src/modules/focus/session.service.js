import { db } from "../../db/index.js";
import { events, userStats, userStreaks } from "../../db/schema.js";
import { eq, and } from "drizzle-orm";
import {
    insertEvent, upsertStats, getStats, getStreak, getEarnedAchievements,
    upsertStreak, getLastSessionDate, countTodaySessions,
    countEventsByType, countEventsByTypeAndDate, countRecentEventsByType,
} from "../../db/gamification.js";
import { getISTContext } from "../../common/utils/dates.js";
import { computeIntegrityScore, computeXP, awardAchievementXpIdempotent } from "../../common/utils/xp.js";
import { checkAndCompleteGoals } from "./utils/goals.js";
import { evaluateAchievements } from "./utils/achievements.eval.js";
import { pushAchievements } from "../../common/sse.js";

export async function startSession(userId) {
    const event = await insertEvent({
        userId,
        type: "session.start",
        metadata: { consumed: false },
    });
    return { serverToken: event.id, startedAt: event.occurredAt };
}

export async function endSession(userId, body) {
    const {
        serverToken,
        plannedMinutes: rawPlanned,
        actualMinutes: clientActualMinutes,
        invisibleSeconds: rawInvis = 0,
        interactionCount: rawInteractions = 0,
        linkedTaskId, linkedEvalId, linkedEvalDueDate,
    } = body;

    let actualMinutes = Math.min(Math.max(Math.floor(Number(clientActualMinutes) || 0), 0), 240);
    let startEvent = null;

    if (serverToken) {
        startEvent = await db.query.events.findFirst({
            where: and(eq(events.userId, userId), eq(events.type, "session.start"), eq(events.id, serverToken)),
        });
        if (!startEvent) return { dropped: true, reason: "invalid_token" };
        if (startEvent.metadata?.consumed) return { dropped: true, reason: "duplicate_session" };

        const wallClockMinutes = Math.floor((Date.now() - new Date(startEvent.occurredAt).getTime()) / 60_000);
        actualMinutes = Math.min(wallClockMinutes, rawPlanned, 240);
    }

    if (actualMinutes < 10) return { dropped: true, reason: "session_too_short" };

    const { today, yesterday, weekStart, hourOfDay } = getISTContext();

    const [todayCount, lastSessionDate, existingStreak, earned] = await Promise.all([
        countTodaySessions(userId, today),
        getLastSessionDate(userId),
        getStreak(userId),
        getEarnedAchievements(userId),
    ]);

    if (todayCount >= 20) return { dropped: true, reason: "daily_cap_reached" };

    const maxInvisibleSeconds = actualMinutes * 60;
    const invisibleSeconds = Math.min(Math.max(Math.floor(Number(rawInvis) || 0), 0), maxInvisibleSeconds);
    const interactionCount = Math.min(Math.max(Math.floor(Number(rawInteractions) || 0), 0), maxInvisibleSeconds * 5);
    const plannedMinutes = Math.min(Math.max(rawPlanned, 1), 360);
    actualMinutes = Math.min(actualMinutes, plannedMinutes);

    const isFullyInvisible = invisibleSeconds >= maxInvisibleSeconds * 0.95;
    const integrityScore = isFullyInvisible
        ? 0
        : computeIntegrityScore({ plannedMinutes, actualMinutes, invisibleSeconds, interactionCount });
    const rawXp = computeXP({ actualMinutes, integrityScore, plannedMinutes });

    const daysSinceLastSession = lastSessionDate
        ? Math.floor((Date.now() - new Date(lastSessionDate).getTime()) / 86400000)
        : null;
    const hoursBeforeEval = parseHoursBeforeEval(linkedEvalDueDate);
    const earnedSet = new Set(earned.map(e => e.achievementId));

    const specialEventTypes = await collectSpecialEventTypes(userId, {
        existingStreak, daysSinceLastSession, hourOfDay, today,
    });

    const isLinked = !!(linkedTaskId || linkedEvalId);
    const isComeback = daysSinceLastSession !== null && daysSinceLastSession >= 3;
    const allTriggerEvents = [
        "session.completed",
        ...(isLinked ? ["session.linked_completed"] : []),
        ...(isComeback ? ["session.comeback"] : []),
        ...specialEventTypes,
    ];

    const { streakStatus, newAchievements, finalStats, finalStreak, goalsCompleted } = await db.transaction(async (tx) => {
        if (startEvent) {
            await tx.update(events)
                .set({ metadata: { ...startEvent.metadata, consumed: true, consumedAt: new Date().toISOString() } })
                .where(eq(events.id, serverToken));
        }

        const [statsRow, txStreakStatus] = await Promise.all([
            upsertStats(userId, actualMinutes, rawXp, today, weekStart, true, tx),
            upsertStreak(userId, today, yesterday, tx),
        ]);

        await writeSessionEvents(userId, tx, {
            actualMinutes, plannedMinutes, integrityScore, rawXp,
            invisibleSeconds, interactionCount, hourOfDay, today,
            daysSinceLastSession, linkedTaskId, linkedEvalId,
            specialEventTypes, streakStatus: txStreakStatus,
        });

        const updatedStreak = {
            currentStreak: txStreakStatus.currentStreak,
            longestStreak: existingStreak?.longestStreak ?? txStreakStatus.currentStreak,
        };

        const txAchievements = await evaluateAchievements(userId, {
            stats: statsRow,
            streak: updatedStreak,
            earnedSet,
            sessionMeta: {
                actualMinutes, integrityScore, hourOfDay,
                daysSinceLastSession, hoursBeforeEval,
                todaySessionCount: todayCount + 1,
            },
            triggerEvents: allTriggerEvents,
        }, tx);

        const completedGoals = await checkAndCompleteGoals(userId, today, actualMinutes, txStreakStatus, tx);

        if (txAchievements.length) {
            await awardAchievementXpIdempotent(userId, txAchievements, today, weekStart, tx);
        }

        const txFinalStreak = await tx.query.userStreaks.findFirst({
            where: (t, { eq }) => eq(t.userId, userId),
        });

        return {
            streakStatus: txStreakStatus,
            newAchievements: txAchievements,
            finalStats: statsRow,
            finalStreak: txFinalStreak,
            goalsCompleted: completedGoals,
        };
    });

    pushAchievements(userId, newAchievements);

    return {
        xp: rawXp,
        integrityScore: Math.round(integrityScore * 100) / 100,
        newAchievements: newAchievements.map(a => ({ ...a })),
        streakStatus,
        goalsCompleted,
        stats: finalStats,
        streak: finalStreak,
        dropped: false,
    };
}

function parseHoursBeforeEval(linkedEvalDueDate) {
    if (!linkedEvalDueDate) return null;
    const parsed = new Date(linkedEvalDueDate);
    return isNaN(parsed.getTime()) ? null : (parsed.getTime() - Date.now()) / 3600000;
}

function computeStreakStatus(streak, today, yesterday) {
    if (!streak) return { currentStreak: 1, wasIncremented: true, wasBroken: false };
    if (streak.lastActiveDate === today) return { currentStreak: streak.currentStreak, wasIncremented: false, wasBroken: false };
    if (streak.lastActiveDate === yesterday) return { currentStreak: streak.currentStreak + 1, wasIncremented: true, wasBroken: false, previousStreak: streak.currentStreak };
    return { currentStreak: 1, wasIncremented: false, wasBroken: true, previousStreak: streak.currentStreak };
}

async function collectSpecialEventTypes(userId, { existingStreak, daysSinceLastSession, hourOfDay, today }) {
    const specialTypes = [];
    const checks = [];

    if (existingStreak?.currentStreak >= 14 && (existingStreak.longestStreak ?? 0) >= 21) {
        checks.push(
            countEventsByType(userId, "streak.broken").then(brokenCount => {
                if (brokenCount > 0) specialTypes.push("achievement.phoenix_qualified");
            })
        );
    }

    if (existingStreak?.currentStreak >= 21) {
        checks.push(
            countEventsByType(userId, "session.comeback").then(count => {
                if (count > 0) specialTypes.push("achievement.rebuilt_qualified");
            })
        );
    }

    checks.push(
        countRecentEventsByType(userId, "achievement.spite_mode_trigger", 86400).then(count => {
            if (count > 0) specialTypes.push("achievement.spite_mode_qualified");
        })
    );

    checks.push(
        Promise.all([
            countEventsByTypeAndDate(userId, "achievement.morning_session", today),
            countEventsByTypeAndDate(userId, "achievement.evening_session", today),
        ]).then(([morningCount, eveningCount]) => {
            const morningTotal = hourOfDay < 8 ? morningCount + 1 : morningCount;
            const eveningTotal = hourOfDay >= 21 ? eveningCount + 1 : eveningCount;
            if (morningTotal > 0 && eveningTotal > 0) specialTypes.push("achievement.both_barrels_qualified");
        })
    );

    await Promise.all(checks);
    return specialTypes;
}

async function writeSessionEvents(userId, tx, ctx) {
    const {
        actualMinutes, plannedMinutes, integrityScore, rawXp,
        invisibleSeconds, interactionCount, hourOfDay, today,
        daysSinceLastSession, linkedTaskId, linkedEvalId,
        specialEventTypes, streakStatus,
    } = ctx;

    const isLinked = !!(linkedTaskId || linkedEvalId);
    const eventRows = [];

    if (daysSinceLastSession !== null && daysSinceLastSession >= 3) {
        eventRows.push({ userId, type: "session.comeback", metadata: { days_away: daysSinceLastSession } });
    }
    if (streakStatus?.wasBroken && streakStatus.previousStreak > 0) {
        eventRows.push({ userId, type: "streak.broken", metadata: { previous_streak: streakStatus.previousStreak, days_away: daysSinceLastSession } });
    }
    if (isLinked) {
        eventRows.push({ userId, type: "session.linked_completed", metadata: { linked_task: linkedTaskId, linked_eval: linkedEvalId } });
    }
    if (hourOfDay < 8) {
        eventRows.push({ userId, type: "achievement.morning_session", metadata: { date: today } });
    } else if (hourOfDay >= 21) {
        eventRows.push({ userId, type: "achievement.evening_session", metadata: { date: today } });
    }

    eventRows.push({
        userId, type: "session.completed",
        metadata: {
            duration_minutes: actualMinutes,
            planned_minutes: plannedMinutes,
            integrity_score: Math.round(integrityScore * 100) / 100,
            xp_awarded: rawXp,
            invisible_seconds: invisibleSeconds,
            interaction_count: interactionCount,
            hour_of_day: hourOfDay,
            linked: isLinked,
            local_date: today,
        },
    });

    for (const type of specialEventTypes) {
        eventRows.push({ userId, type, metadata: {} });
    }

    await tx.insert(events).values(eventRows);
}