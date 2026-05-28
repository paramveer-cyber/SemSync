import {
    startSession, endSession, getDashboardData, freezeStreak,
    onProgressPageVisited, onSettingsPageVisited, onTaskCreated, onTaskCompleted,
} from "./focus.service.js";
import { sanitizeAchievements } from "../../common/utils/sanitize.js";

export const sessionStart = async (req, res, next) => {
    try {
        return res.status(200).json(await startSession(req.user.userId));
    } catch (err) { next(err); }
};

export const sessionEnd = async (req, res, next) => {
    try {
        const result = await endSession(req.user.userId, req.body);
        if (result.dropped) return res.status(200).json({ dropped: true, reason: result.reason ?? "session_too_short" });
        return res.status(200).json({ ...result, newAchievements: sanitizeAchievements(result.newAchievements) });
    } catch (err) { next(err); }
};

export const gamificationDashboard = async (req, res, next) => {
    try {
        const data = await getDashboardData(req.user.userId);
        return res.status(200).json({ ...data, catalog: sanitizeAchievements(data.catalog ?? []) });
    } catch (err) { next(err); }
};

export const useFreeze = async (req, res, next) => {
    try {
        return res.status(200).json(await freezeStreak(req.user.userId));
    } catch (err) { next(err); }
};

export const trackPageVisit = async (req, res, next) => {
    try {
        const { page } = req.body;
        const newAchievements =
            page === "progress" ? await onProgressPageVisited(req.user.userId) :
            page === "settings" ? await onSettingsPageVisited(req.user.userId) : [];
        return res.status(200).json({ newAchievements: sanitizeAchievements(newAchievements) });
    } catch (err) { next(err); }
};

export const trackTask = async (req, res, next) => {
    try {
        const { action } = req.body;
        const newAchievements =
            action === "created"   ? await onTaskCreated(req.user.userId) :
            action === "completed" ? await onTaskCompleted(req.user.userId) : [];
        return res.status(200).json({ newAchievements: sanitizeAchievements(newAchievements) });
    } catch (err) { next(err); }
};
