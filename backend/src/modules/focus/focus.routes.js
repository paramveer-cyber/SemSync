import { Router } from "express";
import { sessionStart, sessionEnd, gamificationDashboard, useFreeze, trackPageVisit, trackTask } from "./focus.controller.js";
import { sessionStartLimiter, sessionEndLimiter, trackTaskLimiter, trackPageLimiter } from "../../common/middlewares/rateLimiter.js";
import { validate } from "../../common/middlewares/validate.js";
import { endSessionBody, trackPageBody, trackTaskBody } from "./focus.model.js";
import timerRoutes from "../timer/timer.routes.js";

const router = Router();

router.post("/session/start", sessionStartLimiter, sessionStart);
router.post("/session/end",   sessionEndLimiter, validate(endSessionBody), sessionEnd);

router.get("/dashboard",      gamificationDashboard);
router.post("/streak/freeze", useFreeze);
router.post("/track/page",    trackPageLimiter, validate(trackPageBody), trackPageVisit);
router.post("/track/task",    trackTaskLimiter, validate(trackTaskBody), trackTask);

router.use("/timer", timerRoutes);

export default router;
