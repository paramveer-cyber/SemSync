import {
    getAllCourses, getArchivedCourses, getCourseById,
    createCourse, updateCourse, deleteCourse, archiveCourse, computeStats,
    computeCourseAchievementFlags,
} from "./courses.services.js";

export const listCourses = async (req, res, next) => {
    try {
        const data = await getAllCourses(req.user.userId);
        const withStats = data.map((c) => ({ ...c, stats: computeStats(c, c.evaluations) }));
        return res.status(200).json({ courses: withStats });
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
        res.locals.achievementMeta = await computeCourseAchievementFlags(req.user.userId);
        return res.status(201).json({ course });
    } catch (err) { next(err); }
};

export const editCourse = async (req, res, next) => {
    try {
        const course = await updateCourse(req.params.id, req.user.userId, req.body);
        res.locals.achievementMeta = await computeCourseAchievementFlags(req.user.userId);
        return res.status(200).json({ course });
    } catch (err) { next(err); }
};

export const removeCourse = async (req, res, next) => {
    try {
        await deleteCourse(req.params.id, req.user.userId);
        return res.status(200).json({ message: "Course deleted" });
    } catch (err) { next(err); }
};