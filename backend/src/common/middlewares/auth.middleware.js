import { verifyToken } from "../../common/utils/tokenLogic.js";

export const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const token = authHeader.split(" ")[1];

        try {
            const decoded = verifyToken(token);
            req.user = decoded;
            return next();
        } catch (err) {
            if (err.name === "TokenExpiredError") {
                return res.status(401).json({ message: "Token expired", code: "TOKEN_EXPIRED" });
            }
            return res.status(401).json({ message: "Invalid token" });
        }

    } catch {
        return res.status(401).json({ message: "Unauthorized" });
    }
};
