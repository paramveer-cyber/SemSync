import { OAuth2Client } from "google-auth-library";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import ApiError from "../../common/utils/api-error.js";
import { generateToken, generateRefreshToken, verifyRefreshToken } from "../../common/utils/tokenLogic.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const generateTokens = async (user) =>{
    const accessToken = generateToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);
    await db.update(users).set({ refreshToken }).where(eq(users.id, user.id));
    return { accessToken, refreshToken };
}

export const verifyGoogleToken = async (idToken) => {
    const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    console.log(payload)
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
        let user;
        const existing = await db.query.users.findFirst({where: eq(users.googleId, googleId)});
        if (!existing) {
            user = (await db.insert(users).values({ googleId, email, name, avatarUrl: picture ?? null }).returning())[0];
        }
        else{
            user = existing;
        }

        const { accessToken, refreshToken } = await generateTokens(user);
        
        return {user, accessToken, refreshToken};
    } 
    catch (err) {
        console.error("Unknown Error Occured:", err);
        throw ApiError.unknown("Unknown Error Occured!");
    }
};

