import express from "express";
import {
    googleAuth,
    getMe,
    logout,
    getClassroomToken,
    saveClassroomToken,
    clearClassroomToken,
    refresh,
} from "./auth.controller.js";
import { authMiddleware } from "./auth.middleware.js";
import {
    googleAuthLimiter,
    refreshLimiter,
    logoutLimiter,
} from "../../common/middlewares/rateLimiter.js";

const router = express.Router();

router.post("/google", googleAuthLimiter, googleAuth);
router.post("/refresh", refreshLimiter, refresh);
router.post("/logout", logoutLimiter, logout);

router.get("/me", authMiddleware, getMe);

router.get("/classroom-token", authMiddleware, getClassroomToken);
router.post("/classroom-token", authMiddleware, saveClassroomToken);
router.delete("/classroom-token", authMiddleware, clearClassroomToken);

export default router;