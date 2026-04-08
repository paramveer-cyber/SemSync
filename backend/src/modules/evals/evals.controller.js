import {
    getEvalsByCourse,
    createEval,
    updateEval,
    deleteEval,
    getUpcomingEvals,
} from "./evals.services.js";

export const listEvals = async (req, res, next) => {
    try {
        const data = await getEvalsByCourse(req.params.courseId, req.user.userId);
        return res.status(200).json({ evaluations: data });
    } catch (err) {
        next(err);
    }
};

export const addEval = async (req, res, next) => {
    try {
        const created = await createEval(req.params.courseId, req.user.userId, req.body);
        return res.status(201).json({ evaluation: created });
    } catch (err) {
        next(err);
    }
};

export const editEval = async (req, res, next) => {
    try {
        const updated = await updateEval(req.params.id, req.user.userId, req.body);
        return res.status(200).json({ evaluation: updated });
    } catch (err) {
        next(err);
    }
};

export const removeEval = async (req, res, next) => {
    try {
        await deleteEval(req.params.id, req.user.userId);
        return res.status(200).json({ message: "Evaluation deleted" });
    } catch (err) {
        next(err);
    }
};

export const upcomingEvals = async (req, res, next) => {
    try {
        const data = await getUpcomingEvals(req.user.userId);
        return res.status(200).json({ evaluations: data });
    } catch (err) {
        next(err);
    }
};
