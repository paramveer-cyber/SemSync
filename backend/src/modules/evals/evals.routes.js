import { Router } from "express";
import { listEvals, addEval, editEval, removeEval, upcomingEvals } from "./evals.controller.js";
import { validate } from "../../common/middlewares/validate.js";
import { createEvalBody, updateEvalBody } from "./evals.model.js";

const router = Router({ mergeParams: true });

router.get("/", listEvals);
router.post("/", validate(createEvalBody), addEval);

export const evalStandaloneRouter = Router();

evalStandaloneRouter.patch("/:id", validate(updateEvalBody), editEval);
evalStandaloneRouter.delete("/:id", removeEval);
evalStandaloneRouter.get("/upcoming", upcomingEvals);

export default router;
