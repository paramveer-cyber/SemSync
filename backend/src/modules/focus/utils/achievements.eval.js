import {
    insertAchievements,
    getAllSessions, countEventsByType, countHighIntegritySessions,
    sumDeepWorkMinutes, getGoalsInRange,
} from "../../../db/gamification.js";
import { findCoursesByUser, findArchivedCoursesByUser } from "../../../db/queries.js";
import { ACHIEVEMENTS, ACHIEVEMENT_MAP, TRIGGER_INDEX } from "../achievements.js";

export async function evaluateAchievements(userId, ctx, tx) {
    const { stats, streak, earnedSet, sessionMeta, triggerEvent, triggerEvents } = ctx;

    let candidates;
    const triggers = triggerEvents ?? (triggerEvent ? [triggerEvent] : null);
    if (triggers?.length) {
        const ids = new Set();
        for (const t of triggers) {
            for (const id of (TRIGGER_INDEX.get(t) ?? [])) ids.add(id);
        }
        candidates = [...ids]
            .map(id => ACHIEVEMENT_MAP.get(id))
            .filter(a => a && !earnedSet.has(a.id));
    } else {
        candidates = ACHIEVEMENTS.filter(a => !earnedSet.has(a.id));
    }

    if (!candidates.length) return [];

    let _courses = null, _archived = null, _allSessions = null;
    const getCourses = async () => (_courses ??= await findCoursesByUser(userId));
    const getArchived = async () => (_archived ??= await findArchivedCoursesByUser(userId));
    const getSessions = async () => (_allSessions ??= await getAllSessions(userId));
    const evtCount = (type) => countEventsByType(userId, type);

    const unlocked = [];

    for (const a of candidates) {
        const { rule } = a;
        let q = false;

        switch (rule.type) {
            case "stat":
                q = (stats?.[rule.metric] ?? 0) >= rule.gte;
                break;

            case "streak":
                q = (streak?.[rule.metric] ?? 0) >= rule.gte;
                break;

            case "event_count":
                q = (await evtCount(rule.eventType)) >= rule.gte;
                break;

            case "course_count": {
                const [cs, ar] = await Promise.all([getCourses(), getArchived()]);
                q = (cs.length + ar.length) >= rule.gte;
                break;
            }

            case "eval_count": {
                const cs = await getCourses();
                q = cs.reduce((s, c) => s + (c.evaluations?.length ?? 0), 0) >= rule.gte;
                break;
            }

            case "archive_count":
                q = (await getArchived()).length >= rule.gte;
                break;

            case "comeback":
                q = sessionMeta?.daysSinceLastSession !== null &&
                    sessionMeta?.daysSinceLastSession !== undefined &&
                    sessionMeta.daysSinceLastSession >= rule.inactiveDays;
                break;

            case "session_before_eval":
                q = !!(sessionMeta?.hoursBeforeEval && sessionMeta.hoursBeforeEval >= rule.hoursAhead);
                break;

            case "session_meta": {
                const sm = sessionMeta ?? {};
                if (rule.check === "long_high_integrity")
                    q = (sm.actualMinutes ?? 0) >= rule.minMinutes && (sm.integrityScore ?? 0) >= rule.minIntegrity;
                else if (rule.check === "single_session_duration")
                    q = (sm.actualMinutes ?? 0) >= rule.minMinutes;
                else if (rule.check === "hour_range")
                    q = sm.hourOfDay >= rule.hourGte && sm.hourOfDay < rule.hourLt;
                else if (rule.check === "five_sessions_today")
                    q = (sm.todaySessionCount ?? 0) >= 5;
                break;
            }

            case "high_integrity_sessions":
                q = (await countHighIntegritySessions(userId, rule.minIntegrity)) >= rule.count;
                break;

            case "deep_work_hours":
                q = (await sumDeepWorkMinutes(userId, rule.minIntegrity)) / 60 >= rule.hours;
                break;

            case "weekly_sessions":
                q = checkWeeklySessions(await getSessions(), rule.weeks);
                break;

            case "same_window_days":
                q = checkSameWindowDays(await getSessions(), rule.days);
                break;

            case "goal_days":
                q = await checkGoalDays(userId, rule.days, false);
                break;

            case "all_goals_days":
                q = await checkGoalDays(userId, rule.days, true);
                break;

            case "linked_sessions_streak":
                q = checkLinkedSessionsStreak(await getSessions(), rule.days);
                break;

            case "course_above_target": {
                const cs = await getCourses();
                q = cs.some(isAboveTarget);
                break;
            }

            case "all_courses_above_target": {
                const cs = await getCourses();
                q = cs.length > 0 && cs.every(isAboveTarget);
                break;
            }

            case "eval_above_target": {
                const cs = await getCourses();
                q = cs.some(c => (c.evaluations ?? []).some(e =>
                    e.score !== null && (e.score / e.maxScore) * 100 > (c.targetGrade ?? 50)
                ));
                break;
            }

            case "eval_consecutive_above_target": {
                const cs = await getCourses();
                q = cs.some(c => checkConsecutiveAboveTarget(c, rule.count));
                break;
            }

            case "all_evals_scored_in_course": {
                const cs = await getCourses();
                q = cs.some(c => {
                    const evs = c.evaluations ?? [];
                    return evs.length > 0 && evs.every(e => e.score !== null);
                });
                break;
            }

            case "all_evals_above_target_in_course": {
                const cs = await getCourses();
                q = cs.some(c => {
                    const evs = c.evaluations ?? [];
                    return evs.length > 0 &&
                        evs.every(e => e.score !== null) &&
                        evs.every(e => (e.score / e.maxScore) * 100 > (c.targetGrade ?? 50));
                });
                break;
            }

            case "target_grade_set_all": {
                const cs = await getCourses();
                q = cs.length > 0 && cs.every(c => c.targetGrade != null && c.targetGrade > 0);
                break;
            }

            case "evals_total_100": {
                const cs = await getCourses();
                q = cs.some(c => {
                    const total = (c.evaluations ?? []).reduce((s, e) => s + e.weightage, 0);
                    return Math.abs(total - 100) < 0.01;
                });
                break;
            }

            case "all_courses_have_evals": {
                const cs = await getCourses();
                q = cs.length > 0 && cs.every(c => (c.evaluations ?? []).length > 0);
                break;
            }

            case "all_courses_configured": {
                const cs = await getCourses();
                q = cs.length > 0 && cs.every(c =>
                    c.name?.trim() &&
                    c.targetGrade != null && c.targetGrade > 0 &&
                    (c.evaluations ?? []).length >= 2
                );
                break;
            }
        }

        if (q) unlocked.push(a);
    }

    if (!unlocked.length) return [];

    const inserted = await insertAchievements(
        unlocked.map(a => ({ userId, achievementId: a.id, tier: a.tier, xpAwarded: a.xp })),
        tx
    );
    const insertedIds = new Set(inserted.map(r => r.achievementId));
    return unlocked.filter(a => insertedIds.has(a.id));
}

function checkWeeklySessions(sessions, weeks) {
    if (!sessions.length) return false;
    const weekSet = new Set(sessions.map(s => isoWeek(new Date(s.occurredAt))));
    const sorted = [...weekSet].sort().reverse();
    if (sorted.length < weeks) return false;
    for (let i = 0; i < weeks; i++) {
        if (i > 0 && weekDiff(sorted[0], sorted[i]) !== i) return false;
    }
    return true;
}

function isoWeek(d) {
    const tmp = new Date(d.getTime());
    tmp.setUTCHours(0, 0, 0, 0);
    tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
    const y = tmp.getUTCFullYear();
    const w = Math.ceil(((tmp - new Date(Date.UTC(y, 0, 1))) / 86400000 + 1) / 7);
    return `${y}-W${String(w).padStart(2, "0")}`;
}

function weekDiff(a, b) {
    const parseWeekToAbsolute = s => {
        const [year, week] = s.split("-W").map(Number);
        return year * 54 + week;
    };
    return parseWeekToAbsolute(a) - parseWeekToAbsolute(b);
}

function checkSameWindowDays(sessions, requiredDays) {
    if (!sessions.length) return false;

    const sessionsByDay = new Map();
    for (const session of sessions) {
        const istDate = session.metadata?.local_date
            ?? new Date(session.occurredAt).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
        const istHour = session.metadata?.hour_of_day
            ?? parseInt(new Date(session.occurredAt).toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }), 10);
        const twoHourWindow = Math.floor(istHour / 2);

        if (!sessionsByDay.has(istDate)) sessionsByDay.set(istDate, new Set());
        sessionsByDay.get(istDate).add(twoHourWindow);
    }

    const sortedDays = [...sessionsByDay.keys()].sort().reverse();
    if (sortedDays.length < requiredDays) return false;

    const allWindows = new Set(
        sortedDays.flatMap(day => [...sessionsByDay.get(day)])
    );

    for (const window of allWindows) {
        let consecutiveDays = 0;
        for (let i = 0; i < sortedDays.length; i++) {
            if (i > 0) {
                const dayGap = Math.round(
                    (new Date(sortedDays[i - 1] + "T12:00:00Z") - new Date(sortedDays[i] + "T12:00:00Z")) / 86400000
                );
                if (dayGap !== 1) break;
            }
            if (sessionsByDay.get(sortedDays[i]).has(window)) consecutiveDays++;
            else break;
        }
        if (consecutiveDays >= requiredDays) return true;
    }
    return false;
}

async function checkGoalDays(userId, days, requireAll) {
    const from = new Date(Date.now() - (days + 2) * 86400000).toISOString().slice(0, 10);
    const goals = await getGoalsInRange(userId, from);

    const byDate = new Map();
    for (const g of goals) {
        if (!byDate.has(g.date)) byDate.set(g.date, []);
        byDate.get(g.date).push(g);
    }

    const sortedDates = [...byDate.keys()].sort().reverse();
    let streak = 0;
    for (let i = 0; i < sortedDates.length; i++) {
        if (i > 0) {
            const diff = Math.round((new Date(sortedDates[i - 1] + "T12:00:00Z") - new Date(sortedDates[i] + "T12:00:00Z")) / 86400000);
            if (diff !== 1) break;
        }
        const dayGoals = byDate.get(sortedDates[i]);
        const qualifies = requireAll
            ? dayGoals.every(g => g.status === "completed")
            : dayGoals.some(g => g.status === "completed");
        if (qualifies) streak++;
        else break;
    }
    return streak >= days;
}

function checkLinkedSessionsStreak(sessions, days) {
    if (!sessions.length) return false;
    const dayMap = new Map();
    for (const s of sessions) {
        const d = s.occurredAt.toISOString().slice(0, 10);
        if (!dayMap.has(d)) dayMap.set(d, true);
        if (!s.metadata?.linked) dayMap.set(d, false);
    }

    const sortedDays = [...dayMap.keys()].sort().reverse();
    let streak = 0;
    for (let i = 0; i < sortedDays.length; i++) {
        if (i > 0) {
            const diff = Math.round((new Date(sortedDays[i - 1] + "T12:00:00Z") - new Date(sortedDays[i] + "T12:00:00Z")) / 86400000);
            if (diff !== 1) break;
        }
        if (dayMap.get(sortedDays[i])) streak++;
        else break;
    }
    return streak >= days;
}

export function isAboveTarget(course) {
    const allEvs = course.evaluations ?? [];
    if (!allEvs.length) return false;
    const totalWeight = allEvs.reduce((s, e) => s + e.weightage, 0);
    const scoredEvs = allEvs.filter(e => e.score !== null);
    if (!scoredEvs.length) return false;
    const scoredWeight = scoredEvs.reduce((s, e) => s + e.weightage, 0);
    if (scoredWeight < totalWeight) return false;
    const earned = scoredEvs.reduce((s, e) => s + (e.score / e.maxScore) * e.weightage, 0);
    return totalWeight > 0 && (earned / totalWeight) * 100 >= (course.targetGrade ?? 50);
}

export function isCourseConfigured(c) {
    return !!(c.name?.trim() && c.targetGrade != null && (c.evaluations ?? []).length >= 2);
}

function checkConsecutiveAboveTarget(course, count) {
    const evs = (course.evaluations ?? [])
        .filter(e => e.score !== null)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    let streak = 0, best = 0;
    for (const e of evs) {
        if ((e.score / e.maxScore) * 100 > (course.targetGrade ?? 50)) { streak++; best = Math.max(best, streak); }
        else streak = 0;
    }
    return best >= count;
}