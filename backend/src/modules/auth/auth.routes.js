import express from "express";
import {
    googleAuth,
    getMe,
    logout,
    getClassroomToken,
    saveClassroomToken,
    clearClassroomToken,
    refresh,
    deleteAccount,
} from "./auth.controller.js";
import { authMiddleware } from "./auth.middleware.js";
import {
    googleAuthLimiter,
    refreshLimiter,
    logoutLimiter,
} from "../../common/middlewares/rateLimiter.js";
import { validate } from "../../common/middlewares/validate.js";
import { googleAuthBody, saveClassroomTokenBody } from "./auth.model.js";

const router = express.Router();

router.post("/google", googleAuthLimiter, validate(googleAuthBody), googleAuth);
router.post("/refresh", refreshLimiter, refresh);
router.post("/logout", logoutLimiter, logout);

router.get("/me", authMiddleware, getMe);

router.get("/classroom-token", authMiddleware, getClassroomToken);
router.post("/classroom-token", authMiddleware, validate(saveClassroomTokenBody), saveClassroomToken);
router.delete("/classroom-token", authMiddleware, clearClassroomToken);

router.delete("/account", authMiddleware, deleteAccount);

export default router;
