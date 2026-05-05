import rateLimit from "express-rate-limit";

const json = (res, status, message) => res.status(status).json({ message });

export const googleAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => json(res, 429, "Too many login attempts. Try again in 15 minutes."),
});

export const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => json(res, 429, "Too many refresh attempts. Try again shortly."),
});

export const logoutLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => json(res, 429, "Too many logout requests."),
});

export const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => json(res, 429, "Too many requests. Slow down."),
});