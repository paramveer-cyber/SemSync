import { db } from "../../db/index.js";
import { evaluations, courses } from "../../db/schema.js";
import { eq, and, gte, asc } from "drizzle-orm";
import ApiError from "../../common/utils/api-error.js";

const VALID_TYPES = ["quiz", "midsem", "endsem", "assignment", "lab", "project", "viva", "other"];

const assertCourseOwnership = async (courseId, userId) => {
    const course = await db.query.courses.findFirst({
        where: and(eq(courses.id, courseId), eq(courses.userId, userId)),
    });
    if (!course) throw ApiError.notFound("Course not found");
    return course;
};

export const getEvalsByCourse = async (courseId, userId) => {
    await assertCourseOwnership(courseId, userId);
    return db.query.evaluations.findMany({
        where: eq(evaluations.courseId, courseId),
        orderBy: (e, { asc }) => [asc(e.date)],
    });
};

export const createEval = async (courseId, userId, data) => {
    await assertCourseOwnership(courseId, userId);

    const { title, type, date, weightage, maxScore, score } = data;

    if (!title?.trim())                                                     throw ApiError.badRequest("title is required");
    if (!VALID_TYPES.includes(type))                                        throw ApiError.badRequest(`type must be one of: ${VALID_TYPES.join(", ")}`);
    if (!date || isNaN(new Date(date)))                                     throw ApiError.badRequest("date must be a valid ISO date");
    if (typeof weightage !== "number" || weightage <= 0 || weightage > 100) throw ApiError.badRequest("weightage must be a number between 0 and 100");
    if (typeof maxScore  !== "number" || maxScore  <= 0)                    throw ApiError.badRequest("maxScore must be a positive number");
    if (score !== undefined && score !== null) {
        if (typeof score !== "number" || score < 0) throw ApiError.badRequest("score must be a non-negative number");
        if (score > maxScore)                       throw ApiError.badRequest("score cannot exceed maxScore");
    }

    const [created] = await db
        .insert(evaluations)
        .values({ courseId, title: title.trim(), type, date: new Date(date), weightage, maxScore, score: score ?? null })
        .returning();
    return created;
};

export const updateEval = async (evalId, userId, data) => {
    const existing = await db.query.evaluations.findFirst({
        where: eq(evaluations.id, evalId),
        with: { course: true },
    });
    if (!existing)                         throw ApiError.notFound("Evaluation not found");
    if (existing.course.userId !== userId) throw ApiError.forbidden("Access denied");

    const allowed = {};
    if (data.title     !== undefined) allowed.title = data.title.trim();
    if (data.type      !== undefined) {
        if (!VALID_TYPES.includes(data.type)) throw ApiError.badRequest(`type must be one of: ${VALID_TYPES.join(", ")}`);
        allowed.type = data.type;
    }
    if (data.date      !== undefined) {
        if (isNaN(new Date(data.date))) throw ApiError.badRequest("date must be a valid ISO date");
        allowed.date = new Date(data.date);
    }
    if (data.weightage !== undefined) {
        if (typeof data.weightage !== "number" || data.weightage <= 0 || data.weightage > 100)
            throw ApiError.badRequest("weightage must be a number between 0 and 100");
        allowed.weightage = data.weightage;
    }
    if (data.maxScore  !== undefined) {
        if (typeof data.maxScore !== "number" || data.maxScore <= 0)
            throw ApiError.badRequest("maxScore must be a positive number");
        allowed.maxScore = data.maxScore;
    }
    if (data.score !== undefined) {
        const effectiveMax = allowed.maxScore ?? existing.maxScore;
        if (data.score !== null) {
            if (typeof data.score !== "number" || data.score < 0) throw ApiError.badRequest("score must be a non-negative number");
            if (data.score > effectiveMax)                         throw ApiError.badRequest("score cannot exceed maxScore");
        }
        allowed.score = data.score;
    }

    if (Object.keys(allowed).length === 0) throw ApiError.badRequest("No valid fields to update");

    const [updated] = await db
        .update(evaluations)
        .set(allowed)
        .where(eq(evaluations.id, evalId))
        .returning();
    return updated;
};

export const deleteEval = async (evalId, userId) => {
    const existing = await db.query.evaluations.findFirst({
        where: eq(evaluations.id, evalId),
        with: { course: true },
    });
    if (!existing)                         throw ApiError.notFound("Evaluation not found");
    if (existing.course.userId !== userId) throw ApiError.forbidden("Access denied");
    await db.delete(evaluations).where(eq(evaluations.id, evalId));
};

export const getUpcomingEvals = async (userId) => {
    const now = new Date();
    const userCourses = await db.query.courses.findMany({
        where: eq(courses.userId, userId),
        with: {
            evaluations: {
                where: gte(evaluations.date, now),
                orderBy: [asc(evaluations.date)],
            },
        },
        orderBy: (c, { asc }) => [asc(c.name)],
    });

    const upcoming = [];
    for (const course of userCourses) {
        for (const e of course.evaluations) {
            upcoming.push({ ...e, courseName: course.name, courseId: course.id });
        }
    }
    upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
    return upcoming;
};