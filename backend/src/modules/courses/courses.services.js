import ApiError from "../../common/utils/api-error.js";
import {
    findCoursesByUser,
    findArchivedCoursesByUser,
    findCourseById,
    findCourseWithEvals,
    insertCourse,
    updateCourseFields,
    setCourseArchived,
    deleteCourseById,
} from "../../db/queries.js";

export const computeStats = (course, evals) => {
    let currentGrade = 0, earnedWeight = 0, totalWeight = 0;

    for (const e of evals) {
        totalWeight += e.weightage;
        if (e.score !== null && e.score !== undefined) {
            currentGrade += (e.score / e.maxScore) * e.weightage;
            earnedWeight += e.weightage;
        }
    }

    const remainingWeight = totalWeight - earnedWeight;
    let requiredAvg = null;
    if (remainingWeight > 0) {
        requiredAvg = ((course.targetGrade - currentGrade) / remainingWeight) * 100;
    }

    return {
        currentGrade: parseFloat(currentGrade.toFixed(2)),
        earnedWeight: parseFloat(earnedWeight.toFixed(2)),
        totalWeight: parseFloat(totalWeight.toFixed(2)),
        remainingWeight: parseFloat(remainingWeight.toFixed(2)),
        requiredAvg: requiredAvg !== null ? parseFloat(requiredAvg.toFixed(2)) : null,
    };
};

export const getAllCourses = (userId) => findCoursesByUser(userId);

export const getArchivedCourses = (userId) => findArchivedCoursesByUser(userId);

export const getCourseById = async (courseId, userId) => {
    const course = await findCourseWithEvals(courseId, userId);
    if (!course) throw ApiError.notFound("Course not found");
    return course;
};

export const createCourse = (userId, data) => {
    const { name, credits, targetGrade } = data;
    return insertCourse({ userId, name, ...(credits !== undefined && { credits }), targetGrade: targetGrade ?? 50 });
};

export const updateCourse = async (courseId, userId, data) => {
    const existing = await findCourseById(courseId, userId);
    if (!existing) throw ApiError.notFound("Course not found");
    if (existing.isArchived) throw ApiError.forbidden("Course is archived");

    const allowed = {};
    if (data.name !== undefined) allowed.name = data.name;
    if (data.credits !== undefined) allowed.credits = data.credits;
    if (data.targetGrade !== undefined) allowed.targetGrade = data.targetGrade;

    if (Object.keys(allowed).length === 0) throw ApiError.badRequest("No valid fields to update");

    return updateCourseFields(courseId, userId, allowed);
};

export const archiveCourse = async (courseId, userId) => {
    const existing = await findCourseById(courseId, userId);
    if (!existing) throw ApiError.notFound("Course not found");
    if (existing.isArchived) throw ApiError.badRequest("Already archived");
    return setCourseArchived(courseId, userId);
};

export const deleteCourse = async (courseId, userId) => {
    const existing = await findCourseById(courseId, userId);
    if (!existing) throw ApiError.notFound("Course not found");
    return deleteCourseById(courseId, userId);
};
