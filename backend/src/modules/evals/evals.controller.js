import {
    getEvalsByCourse, createEval, updateEval, deleteEval, getUpcomingEvals,
} from "./evals.services.js";
import { onEvalCreated, onEvalScoreUpdated } from "../focus/focus.service.js";
import { findEvalById } from "../../db/queries.js";

export const listEvals = async (req, res, next) => {
    try {
        const data = await getEvalsByCourse(req.params.courseId, req.user.userId);
        return res.status(200).json({ evaluations: data });
    } catch (err) { next(err); }
};

export const addEval = async (req, res, next) => {
    try {
        const created = await createEval(req.params.courseId, req.user.userId, req.body);
        onEvalCreated(req.user.userId, created).catch(() => {});
        return res.status(201).json({ evaluation: created });
    } catch (err) { next(err); }
};

export const editEval = async (req, res, next) => {
    try {
        const prev = await findEvalById(req.params.id);
        const prevScore = prev?.score ?? null;
        const updated = await updateEval(req.params.id, req.user.userId, req.body);
        if ("score" in req.body && req.body.score !== prevScore) {
            onEvalScoreUpdated(req.user.userId, { ...updated, course: prev?.course }, prevScore).catch(() => {});
        }
        return res.status(200).json({ evaluation: updated });
    } catch (err) { next(err); }
};

export const removeEval = async (req, res, next) => {
    try {
        await deleteEval(req.params.id, req.user.userId);
        return res.status(200).json({ message: "Evaluation deleted" });
    } catch (err) { next(err); }
};

export const upcomingEvals = async (req, res, next) => {
    try {
        const data = await getUpcomingEvals(req.user.userId);
        return res.status(200).json({ evaluations: data });
    } catch (err) { next(err); }
};
