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
        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ message: "idToken is required" });

        const payload = await verifyGoogleToken(idToken);
        const user    = await findOrCreateUser(payload);
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