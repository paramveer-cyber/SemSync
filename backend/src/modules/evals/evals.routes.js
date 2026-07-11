import { Router } from "express";
import { listEvals, addEval, editEval, removeEval, upcomingEvals } from "./evals.controller.js";
import { validate } from "../../common/middlewares/validate.js";
import { createEvalBody, updateEvalBody } from "./evals.model.js";
import { eventObserver } from "../achievements/achievement.middleware.js";

const router = Router({ mergeParams: true });

router.get("/", listEvals);
router.post("/", validate(createEvalBody), eventObserver("evaluation.created", "Evaluation Created", (req, res) => res.locals.achievementMeta ?? {}), addEval);

export const evalStandaloneRouter = Router();

evalStandaloneRouter.patch(
    "/:id",
    validate(updateEvalBody),
    eventObserver("evaluation.updated", "Evaluation Updated", (req, res) => res.locals.achievementMeta ?? {}),
    editEval,
);
evalStandaloneRouter.delete("/:id", eventObserver("evaluation.deleted", "Evaluation Deleted"), removeEval);
evalStandaloneRouter.get("/upcoming", upcomingEvals);

export default router;
