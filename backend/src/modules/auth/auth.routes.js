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

const router = express.Router();

router.post("/google", googleAuth);
router.post("/refresh", refresh);
router.get("/me", authMiddleware, getMe);
router.post("/logout", logout);
router.get("/classroom-token",    authMiddleware, getClassroomToken);
router.post("/classroom-token",   authMiddleware, saveClassroomToken);
router.delete("/classroom-token", authMiddleware, clearClassroomToken);

export default router;
