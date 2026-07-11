import { Router } from "express";
import {
    gamificationDashboard, trackPageVisit, trackTask,
    timerGet, timerStart, timerPause, timerResume,
    timerExtend, timerSync, timerEnd,
} from "./focus.controller.js";
import { trackTaskLimiter, trackPageLimiter, timerStartLimiter, timerEndLimiter } from "../../common/middlewares/rateLimiter.js";
import { validate } from "../../common/middlewares/validate.js";
import {
    trackPageBody, trackTaskBody,
    startTimerBody, extendTimerBody, endTimerBody,
} from "./focus.model.js";
import { eventObserver } from "../achievements/achievement.middleware.js";

const router = Router();

router.get("/dashboard", gamificationDashboard);
router.post(
    "/track/page",
    trackPageLimiter,
    validate(trackPageBody),
    eventObserver("page.visited", "Page Visited", (req) => ({ page: req.body.page })),
    trackPageVisit,
);
router.post(
    "/track/task",
    trackTaskLimiter,
    validate(trackTaskBody),
    (req, res, next) => {
        const eventSlug = req.body.action === "created" ? "task.created" : "task.updated";
        return eventObserver(eventSlug, "Task Tracked", (r) => ({ action: r.body.action }))(req, res, next);
    },
    trackTask,
);

router.get("/", timerGet);
router.post("/start", timerStartLimiter, validate(startTimerBody), eventObserver("timer.start", "Timer Started"), timerStart);
router.post("/pause", timerPause);
router.post("/resume", timerResume);
router.post("/extend", validate(extendTimerBody), timerExtend);
router.post("/sync", timerSync);
router.post("/end", timerEndLimiter, validate(endTimerBody), eventObserver("timer.end", "Timer Ended", (req, res) => res.locals.achievementMeta ?? {}), timerEnd);

export default router;