import {
    getTodayGoals, insertGoals, updateGoalStatus,
    get7DayAvgMinutes, getGoalCompletionRate,
} from "../../../db/gamification.js";
import { findUpcomingEvalsByUser } from "../../../db/queries.js";

export async function checkAndCompleteGoals(userId, today, actualMinutes, streakStatus, tx) {
    const goals = await getTodayGoals(userId, today);
    const completed = [];

    for (const g of goals) {
        if (g.status !== "pending") continue;
        let done = false;
        if (g.type === "session_duration" && actualMinutes >= g.targetValue) done = true;
        if (g.type === "streak_maintain" && streakStatus.currentStreak > 0) done = true;
        if (g.type === "eval_prep" && actualMinutes >= g.targetValue) done = true;
        if (g.type === "stretch" && actualMinutes >= g.targetValue) done = true;
        if (done) {
            await updateGoalStatus(g.id, "completed", tx);
            completed.push(g);
        }
    }

    return completed;
}

export async function generateDailyGoals(userId, stats, streak, today) {
    const isNewUser = (stats?.totalSessions ?? 0) < 5;
    const [avgMinutes, completionRate, yesterdayRate] = await Promise.all([
        get7DayAvgMinutes(userId),
        getGoalCompletionRate(userId, 3),
        getGoalCompletionRate(userId, 1),
    ]);

    let baseline;
    if (isNewUser)               baseline = 15;
    else if (yesterdayRate === 0) baseline = Math.max(15, Math.round(avgMinutes * 0.6));
    else if (completionRate >= 1.0) baseline = Math.round((avgMinutes || 20) * 0.9);
    else                          baseline = avgMinutes > 0 ? Math.round(avgMinutes * 0.8) : 20;

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
