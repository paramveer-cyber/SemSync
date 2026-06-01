import { OAuth2Client } from "google-auth-library";
import ApiError from "../../common/utils/api-error.js";
import { generateToken, generateRefreshToken } from "../../common/utils/tokenLogic.js";
import { findUserByGoogleId, insertUser, setUserGoogleRefreshToken, setUserRefreshToken } from "../../db/queries.js";
import { hashPassword } from "../../common/utils/hash.js"

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const generateTokens = async (user) => {
    const accessToken = generateToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);
    await setUserRefreshToken(user.id, await hashPassword(refreshToken));
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

export const verifyGoogleClassroomAuthCode = async (payload) => {
    if (!payload.authCode || !payload.id) throw ApiError.badRequest();

    const data = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            code: payload.authCode,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: "postmessage",
            grant_type: "authorization_code",
        }),
    })
    const { access_token, expires_in, refresh_token } = await data.json();
    if (!access_token || !expires_in || !refresh_token) {
        throw ApiError.unknown("An error occured! Try logging in again")
    }
    await setUserGoogleRefreshToken(payload.id, refresh_token);
    return { access_token, expires_in };
}