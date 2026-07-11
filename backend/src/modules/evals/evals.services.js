import ApiError from "../../common/utils/api-error.js";
import {
    findCourseById,
    findEvalsByCoure,
    findEvalById,
    insertEval,
    updateEvalFields,
    deleteEvalById,
    findUpcomingEvalsByUser,
} from "../../db/queries.js";
import { computeAllCoursesAboveTarget } from "../courses/courses.services.js";

const VALID_TYPES = ["quiz", "midsem", "endsem", "assignment", "lab", "project", "viva", "other"];

const assertCourseOwnership = async (courseId, userId, allowArchived = false) => {
    const course = await findCourseById(courseId, userId);
    if (!course) throw ApiError.notFound("Course not found");
    if (!allowArchived && course.isArchived) throw ApiError.forbidden("Course is archived");
    return course;
};

export const getEvalsByCourse = async (courseId, userId) => {
    await assertCourseOwnership(courseId, userId);
    return findEvalsByCoure(courseId);
};

export const createEval = async (courseId, userId, data) => {
    await assertCourseOwnership(courseId, userId);

    const { title, type, date, weightage, maxScore, score } = data;

    if (!title?.trim()) throw ApiError.badRequest("title is required");
    if (!VALID_TYPES.includes(type)) throw ApiError.badRequest(`type must be one of: ${VALID_TYPES.join(", ")}`);
    if (!date || isNaN(new Date(date))) throw ApiError.badRequest("date must be a valid ISO date");
    if (typeof weightage !== "number" || weightage <= 0 || weightage > 100) throw ApiError.badRequest("weightage must be a number between 0 and 100");
    if (typeof maxScore !== "number" || maxScore <= 0) throw ApiError.badRequest("maxScore must be a positive number");
    if (score !== undefined && score !== null) {
        if (typeof score !== "number" || score < 0) throw ApiError.badRequest("score must be a non-negative number");
        if (score > maxScore) throw ApiError.badRequest("score cannot exceed maxScore");
    }

    return insertEval({ courseId, title: title.trim(), type, date: new Date(date), weightage, maxScore, score: score ?? null });
};

export const updateEval = async (evalId, userId, data) => {
    const existing = await findEvalById(evalId);
    if (!existing) throw ApiError.notFound("Evaluation not found");
    if (existing.course.userId !== userId) throw ApiError.forbidden("Access denied");
    if (existing.course.isArchived) throw ApiError.forbidden("Course is archived");

    const allowed = {};
    if (data.title !== undefined) allowed.title = data.title.trim();
    if (data.type !== undefined) {
        if (!VALID_TYPES.includes(data.type)) throw ApiError.badRequest(`type must be one of: ${VALID_TYPES.join(", ")}`);
        allowed.type = data.type;
    }
    if (data.date !== undefined) {
        if (isNaN(new Date(data.date))) throw ApiError.badRequest("date must be a valid ISO date");
        allowed.date = new Date(data.date);
    }
    if (data.weightage !== undefined) {
        if (typeof data.weightage !== "number" || data.weightage <= 0 || data.weightage > 100)
            throw ApiError.badRequest("weightage must be a number between 0 and 100");
        allowed.weightage = data.weightage;
    }
    if (data.maxScore !== undefined) {
        if (typeof data.maxScore !== "number" || data.maxScore <= 0)
            throw ApiError.badRequest("maxScore must be a positive number");
        allowed.maxScore = data.maxScore;
    }
    if (data.score !== undefined) {
        const effectiveMax = allowed.maxScore ?? existing.maxScore;
        if (data.score !== null) {
            if (typeof data.score !== "number" || data.score < 0) throw ApiError.badRequest("score must be a non-negative number");
            if (data.score > effectiveMax) throw ApiError.badRequest("score cannot exceed maxScore");
        }
        allowed.score = data.score;
    }

    if (Object.keys(allowed).length === 0) throw ApiError.badRequest("No valid fields to update");

    return updateEvalFields(evalId, allowed);
};

export const deleteEval = async (evalId, userId) => {
    const existing = await findEvalById(evalId);
    if (!existing) throw ApiError.notFound("Evaluation not found");
    if (existing.course.userId !== userId) throw ApiError.forbidden("Access denied");
    if (existing.course.isArchived) throw ApiError.forbidden("Course is archived");
    return deleteEvalById(evalId);
};

export const getUpcomingEvals = async (userId) => {
    const userCourses = await findUpcomingEvalsByUser(userId);
    const upcoming = [];
    for (const course of userCourses) {
        for (const e of course.evaluations) {
            upcoming.push({ ...e, courseName: course.name, courseId: course.id });
        }
    }
    upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
    return upcoming;
};

const pctOf = (evalRow) => (evalRow.score / evalRow.maxScore) * 100;

export const computeEvalAchievementFlags = async (evalId, userId, scoreEntered) => {
    const evalRow = await findEvalById(evalId);
    if (!evalRow || evalRow.course.userId !== userId) return { scoreEntered };

    const course = evalRow.course;
    const courseEvals = await findEvalsByCoure(course.id);
    const scoredEvals = courseEvals.filter((e) => e.score != null);

    const aboveTarget = evalRow.score != null && pctOf(evalRow) >= course.targetGrade;
    const allEvalsScoredInCourse = courseEvals.length > 0 && courseEvals.every((e) => e.score != null);
    const allScoredEvalsAboveTargetInCourse = scoredEvals.length > 0
        && scoredEvals.every((e) => pctOf(e) >= course.targetGrade);

    const sortedByDateDesc = [...scoredEvals].sort((a, b) => new Date(b.date) - new Date(a.date));
    let consecutiveAboveTargetInCourse = 0;
    for (const e of sortedByDateDesc) {
        if (pctOf(e) >= course.targetGrade) consecutiveAboveTargetInCourse += 1;
        else break;
    }

    let earnedWeight = 0, currentGrade = 0;
    for (const e of courseEvals) {
        if (e.score != null) {
            currentGrade += (e.score / e.maxScore) * e.weightage;
            earnedWeight += e.weightage;
        }
    }
    const courseAboveTargetOverall = earnedWeight > 0 && scoredEvals.length >= 2 && currentGrade >= course.targetGrade;

    const allActiveCoursesAboveTarget = await computeAllCoursesAboveTarget(userId);

    return {
        scoreEntered,
        aboveTarget,
        allEvalsScoredInCourse,
        allScoredEvalsAboveTargetInCourse,
        consecutiveAboveTargetInCourse,
        courseAboveTargetOverall,
        allActiveCoursesAboveTarget,
    };
};
