import rateLimit from "express-rate-limit";

const json = (res, status, message) => res.status(status).json({ message });

const clientIp = (req) =>
    (req.headers["x-forwarded-for"]?.split(",")[0] ?? req.socket.remoteAddress ?? "unknown").trim();

export const googleAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: clientIp,
    handler: (req, res) => json(res, 429, "Too many login attempts. Try again in 15 minutes."),
});

export const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: clientIp,
    handler: (req, res) => json(res, 429, "Too many refresh attempts. Try again shortly."),
});

export const logoutLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: clientIp,
    handler: (req, res) => json(res, 429, "Too many logout requests."),
});

export const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: clientIp,
    handler: (req, res) => json(res, 429, "Too many requests. Slow down."),
});

export const sessionStartLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: clientIp,
    handler: (req, res) => json(res, 429, "Too many session starts. Wait a moment before trying again."),
});

export const sessionEndLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 25,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: clientIp,
    handler: (req, res) => json(res, 429, "Too many session submissions. Slow down."),
});

export const trackTaskLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: clientIp,
    handler: (req, res) => json(res, 429, "Too many task events. Slow down."),
});

export const trackPageLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: clientIp,
    handler: (req, res) => json(res, 429, "Too many page tracking events."),
});

export const timerStartLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: clientIp,
    handler: (req, res) => json(res, 429, "Too many timer starts. Wait before starting another."),
});

export const timerEndLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: clientIp,
    handler: (req, res) => json(res, 429, "Too many timer end requests. Slow down."),
});