import { verifyGoogleToken, findOrCreateUser } from "./auth.services.js";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { generateToken } from "../../common/utils/tokenLogic.js";
import ApiError from "../../common/utils/api-error.js";

const formatUser = (user) => ({
    id:        user.id,
    name:      user.name,
    email:     user.email,
    avatarUrl: user.avatarUrl,
});

export const googleAuth = async (req, res) => {
    try {
        const { idToken, accessToken, refreshToken } = req.body;
        if (!idToken) return res.status(400).json({ message: "idToken is required" });

        const payload = await verifyGoogleToken(idToken);
        const user    = await findOrCreateUser(payload, accessToken, refreshToken);
        const token   = generateToken(user);

        return res.status(200).json({ token, user: formatUser(user) });
    } catch (err) {
        console.error("[auth/google]", err.message);
        if (err instanceof ApiError) {
            return res.status(err.statusCode).json({ message: err.message });
        }
        return res.status(401).json({ message: "Invalid Google token" });
    }
};

export const getMe = async (req, res) => {
    try {
        const user = await db.query.users.findFirst({
            where: eq(users.id, req.user.userId),
        });
        if (!user) return res.status(404).json({ message: "User not found" });
        return res.status(200).json({ user: formatUser(user) });
    } catch (err) {
        console.error("[auth/me]", err.message);
        if (err instanceof ApiError) {
            return res.status(err.statusCode).json({ message: err.message });
        }
        return res.status(500).json({ message: "Failed to fetch user" });
    }
};

export const logout = (_req, res) => {
    return res.status(200).json({ message: "Logged out" });
};

export const getClassroomToken = async (req, res) => {
    try {
        const user = await db.query.users.findFirst({
            where: eq(users.id, req.user.userId),
        });
        if (!user) return res.status(404).json({ message: "User not found" });

        const { googleAccessToken, googleTokenExpiry } = user;

        if (!googleAccessToken || !googleTokenExpiry) {
            return res.status(200).json({ token: null, expiry: null });
        }

        // Check expiry
        if (new Date(googleTokenExpiry).getTime() < Date.now()) {
            return res.status(200).json({ token: null, expiry: null });
        }

        return res.status(200).json({
            token:  googleAccessToken,
            expiry: new Date(googleTokenExpiry).getTime(),
        });
    } catch (err) {
        console.error("[auth/classroom-token GET]", err.message);
        return res.status(500).json({ message: "Failed to fetch classroom token" });
    }
};

export const saveClassroomToken = async (req, res) => {
    try {
        const { accessToken, expiresIn } = req.body;
        if (!accessToken) return res.status(400).json({ message: "accessToken is required" });

        const expiry = new Date(Date.now() + (expiresIn ?? 3600) * 1000);

        await db.update(users)
            .set({ googleAccessToken: accessToken, googleTokenExpiry: expiry })
            .where(eq(users.id, req.user.userId));

        return res.status(200).json({ ok: true, expiry: expiry.getTime() });
    } catch (err) {
        console.error("[auth/classroom-token POST]", err.message);
        return res.status(500).json({ message: "Failed to save classroom token" });
    }
};

export const clearClassroomToken = async (req, res) => {
    try {
        await db.update(users)
            .set({ googleAccessToken: null, googleTokenExpiry: null })
            .where(eq(users.id, req.user.userId));

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error("[auth/classroom-token DELETE]", err.message);
        return res.status(500).json({ message: "Failed to clear classroom token" });
    }
};
