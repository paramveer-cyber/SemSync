import express from "express";
import {
    googleAuth,
    getMe,
    logout,
    getClassroomToken,
    clearClassroomToken,
    refresh,
    deleteAccount,
    connectingClassroom,
    exportUserData,
} from "./auth.controller.js";
import { authMiddleware } from "./auth.middleware.js";
import {
    googleAuthLimiter,
    refreshLimiter,
    logoutLimiter,
} from "../../common/middlewares/rateLimiter.js";
import { validate } from "../../common/middlewares/validate.js";
import { googleAuthBody } from "./auth.model.js";
import { eventObserver } from "../achievements/achievement.middleware.js";

const router = express.Router();

router.post("/google", googleAuthLimiter, validate(googleAuthBody), googleAuth);
router.post("/refresh", refreshLimiter, refresh);
router.post("/logout", logoutLimiter, logout);

router.get("/me", authMiddleware, getMe);

router.post("/classroom-connect", authMiddleware, eventObserver("classroom.linked", "Classroom Linked"), connectingClassroom)
router.get("/classroom-token", authMiddleware, getClassroomToken);
router.delete("/classroom-token", authMiddleware, eventObserver("classroom.delinked", "Classroom Delinked"), clearClassroomToken);

router.delete("/account", authMiddleware, deleteAccount);
router.get("/export", authMiddleware, eventObserver("general.dataexport", "Data Exported"), exportUserData);

export default router;