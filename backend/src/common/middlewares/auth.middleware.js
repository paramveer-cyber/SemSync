import { verifyToken } from "../../common/utils/tokenLogic.js";

export const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = verifyToken(token);

        req.user = decoded; // { userId, email }
        next();

    } catch {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};
