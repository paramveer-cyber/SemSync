import express from "express";
import helmet from "helmet";
import authRoutes from "./modules/auth/auth.routes.js";
import courseRoutes from "./modules/courses/courses.routes.js";
import evalCourseRoutes from "./modules/evals/evals.routes.js";
import { evalStandaloneRouter } from "./modules/evals/evals.routes.js";
import { authMiddleware } from "./modules/auth/auth.middleware.js";
import focusRoutes from "./modules/focus/focus.routes.js";
import { apiLimiter } from "./common/middlewares/rateLimiter.js";
import errorHandler from "./common/middlewares/error.middleware.js";
import eventsRouter from "./modules/events/events.routes.js";

import cors from "cors";
import cookieparser from "cookie-parser";

const app = express();

app.use(helmet());
app.use(express.json());
app.use(cookieparser());
app.use(cors({
  origin: ["http://localhost:5173", "https://semsync.pages.dev"],
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/events", eventsRouter);

app.use("/auth", authRoutes);
app.use("/courses", authMiddleware, apiLimiter, courseRoutes);
app.use("/courses/:courseId/evaluations", authMiddleware, apiLimiter, evalCourseRoutes);
app.use("/evaluations", authMiddleware, apiLimiter, evalStandaloneRouter);
app.use("/focus", authMiddleware, apiLimiter, focusRoutes);

app.use((_req, res) => res.status(404).json({ message: "Route not found" }));
app.use(errorHandler);

export default app;