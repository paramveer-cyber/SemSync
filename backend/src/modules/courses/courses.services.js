import { db } from "../../db/index.js";
import { courses } from "../../db/schema.js";
import { eq, and } from "drizzle-orm";
import ApiError from "../../common/utils/api-error.js";

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
        currentGrade:    parseFloat(currentGrade.toFixed(2)),
        earnedWeight:    parseFloat(earnedWeight.toFixed(2)),
        totalWeight:     parseFloat(totalWeight.toFixed(2)),
        remainingWeight: parseFloat(remainingWeight.toFixed(2)),
        requiredAvg:     requiredAvg !== null ? parseFloat(requiredAvg.toFixed(2)) : null,
    };
};

export const getAllCourses = async (userId) => {
    return db.query.courses.findMany({
        where: eq(courses.userId, userId),
        orderBy: (c, { asc }) => [asc(c.createdAt)],
    });
};

export const getCourseById = async (courseId, userId) => {
    const course = await db.query.courses.findFirst({
        where: and(eq(courses.id, courseId), eq(courses.userId, userId)),
        with: { evaluations: true },
    });
    if (!course) throw ApiError.notFound("Course not found");
    return course;
};

export const createCourse = async (userId, data) => {
    const { name, credits, targetGrade } = data;
    const [course] = await db
        .insert(courses)
        .values({ userId, name, credits: credits ?? null, targetGrade: targetGrade ?? 50 })
        .returning();
    return course;
};

export const updateCourse = async (courseId, userId, data) => {
    const existing = await db.query.courses.findFirst({
        where: and(eq(courses.id, courseId), eq(courses.userId, userId)),
    });
    if (!existing) throw ApiError.notFound("Course not found");

    const allowed = {};
    if (data.name        !== undefined) allowed.name        = data.name;
    if (data.credits     !== undefined) allowed.credits     = data.credits;
    if (data.targetGrade !== undefined) allowed.targetGrade = data.targetGrade;

    if (Object.keys(allowed).length === 0) throw ApiError.badRequest("No valid fields to update");

    const [updated] = await db
        .update(courses)
        .set(allowed)
        .where(and(eq(courses.id, courseId), eq(courses.userId, userId)))
        .returning();
    return updated;
};

export const deleteCourse = async (courseId, userId) => {
    const existing = await db.query.courses.findFirst({
        where: and(eq(courses.id, courseId), eq(courses.userId, userId)),
    });
    if (!existing) throw ApiError.notFound("Course not found");
    await db.delete(courses).where(and(eq(courses.id, courseId), eq(courses.userId, userId)));
};