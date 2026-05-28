/**
 * focus.service.js — barrel re-export.
 *
 * Preserves the original public API so focus.controller.js and any other
 * callers don't need import-path changes. All logic now lives in focused modules:
 *
 *   session.service.js   — startSession, endSession
 *   dashboard.service.js — getDashboardData
 *   hooks.service.js     — onCourse*, onEval*, onTask*, onPage*
 *   timer.service.js     — server-owned timer lifecycle
 *   xp.js                — computeIntegrityScore, computeXP
 *   goals.js             — generateDailyGoals, checkAndCompleteGoals
 *   achievements.eval.js — evaluateAchievements
 *   dates.js             — IST date helpers
 */

export { startSession, endSession }          from "./session.service.js";
export { getDashboardData }                  from "./dashboard.service.js";
export { computeIntegrityScore }             from "../../common/utils/xp.js";
export {
    onCourseCreated, onCourseArchived, onCourseUpdated,
    onEvalCreated, onEvalScoreUpdated,
    onProgressPageVisited, onSettingsPageVisited,
    onTaskCreated, onTaskCompleted,
}                                            from "./hooks.service.js";
export { freezeStreak }                      from "./streak.js";
