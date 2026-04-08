import {
    getAllCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    computeStats,
} from "./courses.services.js";
import ApiError from "../../common/utils/api-error.js";

export const listCourses = async (req, res, next) => {
    try {
        const data = await getAllCourses(req.user.userId);
        return res.status(200).json({ courses: data });
    } catch (err) { next(err); }
};
export const getCourse = async (req, res, next) => {
    try {
        const course = await getCourseById(req.params.id, req.user.userId);
        const { evaluations, ...rest } = course;
        const stats = computeStats(rest, evaluations);
        return res.status(200).json({ course: rest, evaluations, stats });
    } catch (err) { next(err); }
};

export const addCourse = async (req, res, next) => {
    try {
        const { name, credits, targetGrade } = req.body;
        if (!name || typeof name !== "string" || !name.trim())
            throw ApiError.badRequest("Course name is required");
        if (targetGrade !== undefined && (typeof targetGrade !== "number" || targetGrade < 0 || targetGrade > 100))
            throw ApiError.badRequest("targetGrade must be a number between 0 and 100");

        const course = await createCourse(req.user.userId, { name: name.trim(), credits, targetGrade });
        return res.status(201).json({ course });
    } catch (err) { next(err); }
};

export const editCourse = async (req, res, next) => {
    try {
        const { targetGrade } = req.body;
        if (targetGrade !== undefined && (typeof targetGrade !== "number" || targetGrade < 0 || targetGrade > 100))
            throw ApiError.badRequest("targetGrade must be a number between 0 and 100");

        const course = await updateCourse(req.params.id, req.user.userId, req.body);
        return res.status(200).json({ course });
    } catch (err) { next(err); }
};

export const removeCourse = async (req, res, next) => {
    try {
        await deleteCourse(req.params.id, req.user.userId);
        return res.status(200).json({ message: "Course deleted" });
    } catch (err) { next(err); }
};
