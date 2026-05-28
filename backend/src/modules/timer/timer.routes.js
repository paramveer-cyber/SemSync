import { Router } from "express";
import {
    timerGet, timerStart, timerPause, timerResume,
    timerExtend, timerSync, timerEnd, timerAbort,
} from "./timer.controller.js";
import { timerStartLimiter, timerEndLimiter } from "../../common/middlewares/rateLimiter.js";
import { validate } from "../../common/middlewares/validate.js";
import { startTimerBody, extendTimerBody, endTimerBody, abortTimerBody } from "./timer.model.js";

const router = Router();

router.get("/",        timerGet);
router.post("/start",  timerStartLimiter, validate(startTimerBody), timerStart);
router.post("/pause",  timerPause);
router.post("/resume", timerResume);
router.post("/extend", validate(extendTimerBody), timerExtend);
router.post("/sync",   timerSync);
router.post("/end",    timerEndLimiter, validate(endTimerBody), timerEnd);
router.post("/abort",  validate(abortTimerBody), timerAbort);

export default router;
