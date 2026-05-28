import {
    getTimer, startTimer, pauseTimer, resumeTimer,
    extendTimer, syncTimer, endTimer, abortTimer,
} from "./timer.service.js";
import { sanitizeAchievements } from "../../common/utils/sanitize.js";

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

export const timerEnd = async (req, res, next) => {
    try {
        const result = await endTimer(req.user.userId, req.body);
        if (result.dropped) return res.status(200).json({ dropped: true, reason: result.reason });
        return res.status(200).json({
            ...result,
            newAchievements: sanitizeAchievements(result.newAchievements),
        });
    } catch (err) { next(err); }
};

export const timerAbort = async (req, res, next) => {
    try {
        await abortTimer(req.user.userId, req.body);
        return res.status(200).json({ aborted: true });
    } catch (err) { next(err); }
};
