import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = "7d";

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
