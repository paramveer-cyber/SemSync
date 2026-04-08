import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = "7d";

/**
 * Generate a signed JWT for a user.
 * Only stores the minimum needed — userId and email.
 * Everything else should be fetched from DB when required.
 */
export const generateToken = (user) => {
    if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined");

    return jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
    );
};

export const verifyToken = (token) => {
    if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined");
    return jwt.verify(token, JWT_SECRET);
};
