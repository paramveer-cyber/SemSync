import express from "express";
import authRoutes from "./modules/auth/auth.routes.js";
import courseRoutes from "./modules/courses/courses.routes.js";
import evalCourseRoutes from "./modules/evals/evals.routes.js";
import { evalStandaloneRouter } from "./modules/evals/evals.routes.js";
import { authMiddleware } from "./common/middlewares/auth.middleware.js";
import errorHandler from "./common/middlewares/error.middleware.js";
import cors from "cors";

const app = express();

app.use(express.json());

app.use(cors({
  origin: ["http://localhost:5173","https://semsync.vercel.app","https://semsync.pages.dev"],
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use("/auth", authRoutes);

app.use("/courses", authMiddleware, courseRoutes);
app.use("/courses/:courseId/evaluations", authMiddleware, evalCourseRoutes);
app.use("/evaluations", authMiddleware, evalStandaloneRouter);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use((_req, res) => res.status(404).json({ message: "Route not found" }));

app.use(errorHandler);

export default app;
