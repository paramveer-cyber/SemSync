import { OAuth2Client } from "google-auth-library";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import ApiError from "../../common/utils/api-error.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const verifyGoogleToken = async (idToken) => {
    const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
};

export const findOrCreateUser = async (payload) => {
    const { sub: googleId, email, name, picture } = payload;

    const blockedDomains = [
        "gmail.com",
        "yahoo.com",
        "outlook.com",
        "hotmail.com",
        "icloud.com"
    ];

    const domain = email.split("@")[1];

    if (blockedDomains.includes(domain)) {
        throw ApiError.unAuthorized("Kindly use your school/college mail")
    }

    try {
        const existing = await db.query.users.findFirst({
            where: eq(users.googleId, googleId),
        });

        if (existing) return existing;

        const [newUser] = await db
            .insert(users)
            .values({ googleId, email, name, avatarUrl: picture ?? null })
            .returning();

        return newUser;
    } catch (err) {
        console.error("FULL ERROR:", err);  
        throw ApiError.unknown("Unknown Error Occured!");
    }
};