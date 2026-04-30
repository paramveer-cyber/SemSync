import {Router} from "express";
import { listEvals, addEval, editEval, removeEval, upcomingEvals } from "./evals.controller.js";

const router = Router({ mergeParams: true });

router.get("/",  listEvals);
router.post("/", addEval);

export const evalStandaloneRouter = Router();
evalStandaloneRouter.patch("/:id",  editEval);
evalStandaloneRouter.delete("/:id", removeEval);
evalStandaloneRouter.get("/upcoming", upcomingEvals);

export default router;
