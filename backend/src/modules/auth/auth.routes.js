import express from "express";
import { googleAuth, getMe, logout } from "./auth.controller.js";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";

const router = express.Router();

router.post("/google", googleAuth);
router.get("/me", authMiddleware, getMe);
router.post("/logout", logout);

export default router;
