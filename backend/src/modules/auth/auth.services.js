import { OAuth2Client } from "google-auth-library";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import ApiError from "../../common/utils/api-error.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const verifyGoogleToken = async (idToken) => {
    // First try verifying as a proper id_token
    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        return ticket.getPayload();
    } catch {
        // Fallback: treat as access_token and fetch userinfo
        const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!res.ok) throw new Error("Invalid token");
        const info = await res.json();
        return { sub: info.sub, email: info.email, name: info.name, picture: info.picture };
    }
};

export const findOrCreateUser = async (payload, accessToken, refreshToken) => {
    const { sub: googleId, email, name, picture } = payload;

    try {
        const existing = await db.query.users.findFirst({
            where: eq(users.googleId, googleId),
        });

        const tokenFields = {
            ...(accessToken  ? { googleAccessToken: accessToken }                        : {}),
            ...(refreshToken ? { googleRefreshToken: refreshToken }                      : {}),
            ...(accessToken  ? { googleTokenExpiry: new Date(Date.now() + 3600 * 1000) } : {}),
        };

        if (existing) {
            if (Object.keys(tokenFields).length > 0) {
                const [updated] = await db.update(users).set(tokenFields).where(eq(users.id, existing.id)).returning();
                return updated;
            }
            return existing;
        }

        const [newUser] = await db
            .insert(users)
            .values({ googleId, email, name, avatarUrl: picture ?? null, ...tokenFields })
            .returning();

        return newUser;
    } catch (err) {
        console.error("FULL ERROR:", err);
        throw ApiError.unknown("Unknown Error Occured!");
    }
};
