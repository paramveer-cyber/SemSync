import { OAuth2Client } from "google-auth-library";
import ApiError from "../../common/utils/api-error.js";
import { generateToken, generateRefreshToken } from "../../common/utils/tokenLogic.js";
import { findUserByGoogleId, insertUser, setUserRefreshToken } from "../../db/queries.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const generateTokens = async (user) => {
    const accessToken = generateToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);
    await setUserRefreshToken(user.id, refreshToken);
    return { accessToken, refreshToken };
};

export const verifyGoogleToken = async (idToken) => {
    const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload ||
        !["accounts.google.com", "https://accounts.google.com"].includes(payload.iss) ||
        !payload.email_verified) {
        throw ApiError.badRequest("Invalid token payload");
    }
    return payload;
};

export const findOrCreateUser = async (payload) => {
    const { sub: googleId, email, name, picture } = payload;
    try {
        const existing = await findUserByGoogleId(googleId);
        const user = existing ?? await insertUser({ googleId, email, name, avatarUrl: picture ?? null });
        const { accessToken, refreshToken } = await generateTokens(user);
        return { user, accessToken, refreshToken };
    } catch (err) {
        console.error("Unknown Error Occured:", err);
        throw ApiError.unknown("Unknown Error Occured!");
    }
};
