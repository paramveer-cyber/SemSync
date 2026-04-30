import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;
const JWT_EXPIRY = "15m";
const REFRESH_EXPIRY = "7d";

export const generateToken = (id, mail) => {
    if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined");
    return jwt.sign(
        { userId: id, email: mail },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY, issuer: "semTracker" }
    );
};

export const generateRefreshToken = (id) => {
    if (!REFRESH_SECRET) throw new Error("REFRESH_SECRET is not defined");
    return jwt.sign(
        { userId: id },
        REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRY, issuer: "semTracker" }
    );
};

export const verifyToken = (token) => {
    if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined");
    return jwt.verify(token, JWT_SECRET);
};

export const verifyRefreshToken = (token) => {
    if (!REFRESH_SECRET) throw new Error("REFRESH_SECRET is not defined");
    return jwt.verify(token, REFRESH_SECRET);
};