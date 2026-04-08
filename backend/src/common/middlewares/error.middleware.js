import ApiError from "../utils/api-error.js";

const errorHandler = (err, req, res, _next) => {
    if (err instanceof ApiError && err.isOperational) {
        console.log(ApiError)
        return res.status(err.statusCode).json({ message: err.message });
    }

    if (err.code === "23505") {
        return res.status(409).json({ message: "A record with that value already exists" });
    }
    if (err.code === "23503") {
        return res.status(400).json({ message: "Invalid reference — related record does not exist" });
    }
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
    console.error("[Unhandled Error]", err);
    return res.status(500).json({ message: "Internal server error" });
};

export default errorHandler;
