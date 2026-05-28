import {
    getAllCourses, getArchivedCourses, getCourseById,
    createCourse, updateCourse, deleteCourse, archiveCourse, computeStats,
} from "./courses.services.js";
import { onCourseCreated, onCourseArchived, onCourseUpdated } from "../focus/focus.service.js";

export const listCourses = async (req, res, next) => {
    try {
        const data = await getAllCourses(req.user.userId);
        return res.status(200).json({ courses: data });
    } catch (err) { next(err); }
};

export const listArchivedCourses = async (req, res, next) => {
    try {
        const data = await getArchivedCourses(req.user.userId);
        return res.status(200).json({ courses: data });
    } catch (err) { next(err); }
};

export const doArchiveCourse = async (req, res, next) => {
    try {
        const course = await archiveCourse(req.params.id, req.user.userId);
        onCourseArchived(req.user.userId).catch(() => {});
        return res.status(200).json({ course });
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
        const course = await createCourse(req.user.userId, { name, credits, targetGrade });
        onCourseCreated(req.user.userId).catch(() => {});
        return res.status(201).json({ course });
    } catch (err) { next(err); }
};

export const editCourse = async (req, res, next) => {
    try {
        const course = await updateCourse(req.params.id, req.user.userId, req.body);
        onCourseUpdated(req.user.userId).catch(() => {});
        return res.status(200).json({ course });
    } catch (err) { next(err); }
};

export const removeCourse = async (req, res, next) => {
    try {
        await deleteCourse(req.params.id, req.user.userId);
        return res.status(200).json({ message: "Course deleted" });
    } catch (err) { next(err); }
};
