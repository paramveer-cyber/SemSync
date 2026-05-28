import { verifyGoogleToken, findOrCreateUser, generateTokens } from "./auth.services.js";
import { verifyRefreshToken } from "../../common/utils/tokenLogic.js";
import {
    findUserById,
    findUserByRefreshToken,
    setUserRefreshToken,
    setUserGoogleToken,
    clearUserGoogleToken,
    deleteUserById,
} from "../../db/queries.js";
import ApiError from "../../common/utils/api-error.js";

const COOKIE_OPTS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

const formatUser = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
});

export const googleAuth = async (req, res) => {
    try {
        const { idToken } = req.body;
        const payload = await verifyGoogleToken(idToken);
        const { user, accessToken, refreshToken } = await findOrCreateUser(payload);
        res.cookie("refreshToken", refreshToken, COOKIE_OPTS);
        return res.status(200).json({ token: accessToken, user: formatUser(user) });
    } catch (err) {
        console.error("[auth/google]", err.message);
        if (err instanceof ApiError) return res.status(err.statusCode).json({ message: err.message });
        return res.status(401).json({ message: "Invalid Google token" });
    }
};

export const refresh = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;
        if (!token) return res.status(401).json({ message: "No refresh token" });

        let decoded;
        try { decoded = verifyRefreshToken(token); }
        catch { return res.status(401).json({ message: "Invalid or expired refresh token" }); }

        const user = await findUserById(decoded.userId);
        if (!user) return res.status(401).json({ message: "User not found" });

        if (user.refreshToken !== token) {
            await setUserRefreshToken(user.id, null);
            res.clearCookie("refreshToken");
            return res.status(401).json({ message: "Refresh token reuse detected" });
        }

        const { accessToken, refreshToken } = await generateTokens(user);
        res.cookie("refreshToken", refreshToken, COOKIE_OPTS);
        return res.status(200).json({ token: accessToken });
    } catch (err) {
        console.error("[auth/refresh]", err.message);
        return res.status(500).json({ message: "Failed to refresh token" });
    }
};

export const getMe = async (req, res) => {
    try {
        const user = await findUserById(req.user.userId);
        if (!user) return res.status(404).json({ message: "User not found" });
        return res.status(200).json({ user: formatUser(user) });
    } catch (err) {
        console.error("[auth/me]", err.message);
        if (err instanceof ApiError) return res.status(err.statusCode).json({ message: err.message });
        return res.status(500).json({ message: "Failed to fetch user" });
    }
};

export const logout = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;
        if (token) {
            const user = await findUserByRefreshToken(token);
            if (user) await setUserRefreshToken(user.id, null);
        }
        res.clearCookie("refreshToken");
        return res.status(200).json({ message: "Logged out" });
    } catch (err) {
        console.error("[auth/logout]", err.message);
        return res.status(500).json({ message: "Failed to logout" });
    }
};

export const getClassroomToken = async (req, res) => {
    try {
        const user = await findUserById(req.user.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const { googleAccessToken, googleTokenExpiry } = user;
        if (!googleAccessToken || !googleTokenExpiry) return res.status(200).json({ token: null, expiry: null });
        if (new Date(googleTokenExpiry).getTime() < Date.now()) return res.status(200).json({ token: null, expiry: null });

        return res.status(200).json({ token: googleAccessToken, expiry: new Date(googleTokenExpiry).getTime() });
    } catch (err) {
        console.error("[auth/classroom-token GET]", err.message);
        return res.status(500).json({ message: "Failed to fetch classroom token" });
    }
};

export const saveClassroomToken = async (req, res) => {
    try {
        const { accessToken, expiresIn } = req.body;
        const expiry = new Date(Date.now() + (expiresIn ?? 3600) * 1000);
        await setUserGoogleToken(req.user.userId, accessToken, expiry);
        return res.status(200).json({ ok: true, expiry: expiry.getTime() });
    } catch (err) {
        console.error("[auth/classroom-token POST]", err.message);
        return res.status(500).json({ message: "Failed to save classroom token" });
    }
};

export const clearClassroomToken = async (req, res) => {
    try {
        await clearUserGoogleToken(req.user.userId);
        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error("[auth/classroom-token DELETE]", err.message);
        return res.status(500).json({ message: "Failed to clear classroom token" });
    }
};

export const deleteAccount = async (req, res) => {
    try {
        const { userId } = req.user;
        const user = await findUserById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });
        await deleteUserById(userId);
        res.clearCookie("refreshToken");
        return res.status(200).json({ message: "Account deleted" });
    } catch (err) {
        console.error("[auth/delete-account]", err.message);
        return res.status(500).json({ message: "Failed to delete account" });
    }
};
