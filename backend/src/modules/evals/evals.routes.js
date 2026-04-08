import express from "express";
import { listEvals, addEval, editEval, removeEval, upcomingEvals } from "./evals.controller.js";

const router = express.Router({ mergeParams: true }); // mergeParams for :courseId from parent

// Mounted under /courses/:courseId/evaluations
router.get("/",  listEvals);
router.post("/", addEval);

// Mounted at root for standalone eval operations
export const evalStandaloneRouter = express.Router();
evalStandaloneRouter.patch("/:id",  editEval);
evalStandaloneRouter.delete("/:id", removeEval);
evalStandaloneRouter.get("/upcoming", upcomingEvals);

export default router;
