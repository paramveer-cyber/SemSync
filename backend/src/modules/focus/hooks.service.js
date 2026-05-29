import {
    getStats, getStreak, getEarnedAchievements,
    insertEvent, countEventsByType, countScoreEventsForEval, countRecentEventsByType,
} from "../../db/gamification.js";
import { findCoursesByUser } from "../../db/queries.js";
import { getISTContext } from "../../common/utils/dates.js";
import { awardAchievementXpIdempotent } from "../../common/utils/xp.js";
import { evaluateAchievements, isAboveTarget, isCourseConfigured } from "./utils/achievements.eval.js";
import { pushAchievements } from "../../common/sse.js";

async function runEval(userId, triggerEvent, sessionMeta = {}) {
    const { today, weekStart } = getISTContext();
    const [stats, streak, earned] = await Promise.all([
        getStats(userId), getStreak(userId), getEarnedAchievements(userId),
    ]);
    const earnedSet = new Set(earned.map(e => e.achievementId));
    const newAchievements = await evaluateAchievements(userId, { stats, streak, earnedSet, sessionMeta, triggerEvent });
    if (newAchievements.length) {
        await awardAchievementXpIdempotent(userId, newAchievements, today, weekStart);
        pushAchievements(userId, newAchievements);
    }
    return newAchievements;
}

async function emitQualifier(userId, qualifierType, meta = {}) {
    await insertEvent({ userId, type: qualifierType, metadata: meta });
    return runEval(userId, qualifierType);
}

export async function onCourseCreated(userId) {
    const earned = await getEarnedAchievements(userId);
    const earnedSet = new Set(earned.map(e => e.achievementId));

    const sessions = await countEventsByType(userId, "session.completed");
    if (sessions === 0 && !earnedSet.has("the_blueprint")) {
        const courses = await findCoursesByUser(userId);
        if (courses.length > 0 && courses.every(isCourseConfigured)) {
            await emitQualifier(userId, "achievement.blueprint_qualified");
        }
    }

    if (!earnedSet.has("the_optimist")) {
        const courses = await findCoursesByUser(userId);
        if (courses.filter(c => (c.targetGrade ?? 0) >= 90).length >= 3) {
            await emitQualifier(userId, "achievement.optimist_qualified");
        }
    }

    return runEval(userId, "course.created");
}

export async function onCourseArchived(userId) {
    return runEval(userId, "course.archived");
}

export async function onCourseUpdated(userId) {
    const earned = await getEarnedAchievements(userId);
    const earnedSet = new Set(earned.map(e => e.achievementId));

    if (!earnedSet.has("the_optimist")) {
        const courses = await findCoursesByUser(userId);
        if (courses.filter(c => (c.targetGrade ?? 0) >= 90).length >= 3) {
            await emitQualifier(userId, "achievement.optimist_qualified");
        }
    }

    return runEval(userId, "course.updated");
}

export async function onEvalCreated(userId, evalData) {
    const earned = await getEarnedAchievements(userId);
    const earnedSet = new Set(earned.map(e => e.achievementId));

    if (evalData?.date && !earnedSet.has("panic_mode")) {
        const hoursUntil = (new Date(evalData.date).getTime() - Date.now()) / 3600000;
        if (hoursUntil >= 0 && hoursUntil < 24) {
            await emitQualifier(userId, "achievement.panic_mode_qualified");
        }
    }

    const sessions = await countEventsByType(userId, "session.completed");
    if (sessions === 0 && !earnedSet.has("the_blueprint")) {
        const courses = await findCoursesByUser(userId);
        if (courses.length > 0 && courses.every(isCourseConfigured)) {
            await emitQualifier(userId, "achievement.blueprint_qualified");
        }
    }

    return runEval(userId, "eval.created");
}

export async function onEvalScoreUpdated(userId, evalData, prevScore) {
    const isUpdate = prevScore !== null && prevScore !== undefined;

    const priorUpdateCount = isUpdate && evalData?.id
        ? await countScoreEventsForEval(userId, evalData.id)
        : 0;

    await insertEvent({ userId, type: "eval.score_entered", metadata: { eval_id: evalData?.id } });

    const earned = await getEarnedAchievements(userId);
    const earnedSet = new Set(earned.map(e => e.achievementId));

    if (evalData?.date && !earnedSet.has("retroactive")) {
        const daysSince = (Date.now() - new Date(evalData.date).getTime()) / 86400000;
        if (daysSince > 7) {
            await emitQualifier(userId, "achievement.retroactive_qualified");
        }
    }

    if (isUpdate && !earnedSet.has("revisionist") && priorUpdateCount >= 3) {
        await emitQualifier(userId, "achievement.revisionist_qualified");
    }

    if (evalData?.score !== null && evalData?.course?.targetGrade) {
        const pct = (evalData.score / evalData.maxScore) * 100;
        if (pct < evalData.course.targetGrade) {
            await insertEvent({ userId, type: "achievement.spite_mode_trigger", metadata: { eval_id: evalData.id } });
        }
    }

    return runEval(userId, "eval.score_entered");
}

export async function onProgressPageVisited(userId) {
    await insertEvent({ userId, type: "page.progress_visited", metadata: {} });
    return runEval(userId, "page.progress_visited");
}

export async function onSettingsPageVisited(userId) {
    await insertEvent({ userId, type: "page.settings_visited", metadata: {} });
    return runEval(userId, "page.settings_visited");
}

export async function onTaskCreated(userId) {
    await insertEvent({ userId, type: "task.created", metadata: {} });
    return runEval(userId, "task.created");
}

export async function onTaskCompleted(userId) {
    await insertEvent({ userId, type: "task.completed", metadata: {} });

    const earned = await getEarnedAchievements(userId);
    const earnedSet = new Set(earned.map(e => e.achievementId));

    if (!earnedSet.has("no_backlog")) {
        const recent = await countRecentEventsByType(userId, "task.completed", 48 * 3600);
        if (recent >= 10) {
            await emitQualifier(userId, "achievement.no_backlog_qualified");
        }
    }

    if (!earnedSet.has("valedictorian")) {
        const [stats, courses] = await Promise.all([
            getStats(userId), findCoursesByUser(userId),
        ]);
        if (await _checkValedictorian(userId, stats, courses)) {
            await emitQualifier(userId, "achievement.valedictorian_qualified");
        }
    }

    return runEval(userId, "task.completed");
}

export async function onStreakFrozen(userId) {
    await insertEvent({ userId, type: "streak.freeze_used", metadata: {} });
}

export { runEval as runSessionEval };


async function _checkValedictorian(userId, stats, courses) {
    if ((stats?.totalSessions ?? 0) < 200) return false;
    const tasksDone = await countEventsByType(userId, "task.completed");
    if (tasksDone < 100) return false;
    return courses.length > 0 && courses.every(isAboveTarget);
}