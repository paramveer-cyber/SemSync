import {
    getDashboardData,
    getTimer, startTimer, pauseTimer, resumeTimer,
    extendTimer, syncTimer, endTimer,
} from "./focus.service.js";

export const gamificationDashboard = async (req, res, next) => {
    try {
        const data = await getDashboardData(req.user.userId);
        return res.status(200).json(data);
    } catch (err) { next(err); }
};

export const trackPageVisit = async (req, res, next) => {
    try {
        return res.status(200).json({ newAchievements: [] });
    } catch (err) { next(err); }
};

export const trackTask = async (req, res, next) => {
    try {
        return res.status(200).json({ newAchievements: [] });
    } catch (err) { next(err); }
};

export const timerGet = async (req, res, next) => {
    try {
        const timer = await getTimer(req.user.userId);
        return res.status(200).json({ timer });
    } catch (err) { next(err); }
};

export const timerStart = async (req, res, next) => {
    try {
        const result = await startTimer(req.user.userId, req.body);
        return res.status(200).json(result);
    } catch (err) { next(err); }
};

export const timerPause = async (req, res, next) => {
    try {
        const result = await pauseTimer(req.user.userId);
        if (result.error) return res.status(400).json({ error: result.error });
        return res.status(200).json(result);
    } catch (err) { next(err); }
};

export const timerResume = async (req, res, next) => {
    try {
        const result = await resumeTimer(req.user.userId);
        if (result.error) return res.status(400).json({ error: result.error });
        return res.status(200).json(result);
    } catch (err) { next(err); }
};

export const timerExtend = async (req, res, next) => {
    try {
        const result = await extendTimer(req.user.userId, req.body);
        if (result.error) return res.status(400).json({ error: result.error });
        return res.status(200).json(result);
    } catch (err) { next(err); }
};

export const timerSync = async (req, res, next) => {
    try {
        const result = await syncTimer(req.user.userId);
        return res.status(200).json(result);
    } catch (err) { next(err); }
};

const TIMER_END_ERROR_REASONS = new Set(["no_active_timer", "invalid_nonce"]);

export const timerEnd = async (req, res, next) => {
    try {
        const result = await endTimer(req.user.userId, req.body);
        if (result.dropped) {
            const status = TIMER_END_ERROR_REASONS.has(result.reason) ? 400 : 200;
            return res.status(status).json({ dropped: true, reason: result.reason });
        }
        res.locals.achievementMeta = result.achievementMeta ?? {};
        return res.status(200).json(result);
    } catch (err) { next(err); }
};