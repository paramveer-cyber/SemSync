import { db } from "./index.js";
import { users, courses, evaluations } from "./schema.js";
import { eq, and, gte, asc } from "drizzle-orm";

export const findUserById = (id) =>
    db.query.users.findFirst({ where: eq(users.id, id) });

export const findUserByGoogleId = (googleId) =>
    db.query.users.findFirst({ where: eq(users.googleId, googleId) });

export const findUserByRefreshToken = (token) =>
    db.query.users.findFirst({ where: eq(users.refreshToken, token) });

export const insertUser = (data) =>
    db.insert(users).values(data).returning().then(r => r[0]);

export const setUserRefreshToken = (id, token) =>
    db.update(users).set({ refreshToken: token }).where(eq(users.id, id));

export const setUserGoogleToken = (id, accessToken, expiry) =>
    db.update(users).set({ googleAccessToken: accessToken, googleTokenExpiry: expiry }).where(eq(users.id, id));

export const setUserGoogleRefreshToken = (id, refreshToken) =>
    db.update(users).set({ googleRefreshToken: refreshToken }).where(eq(users.id, id))

export const clearUserGoogleToken = (id) =>
    db.update(users).set({ googleAccessToken: null, googleTokenExpiry: null, googleRefreshToken: null }).where(eq(users.id, id));

export const findCoursesByUser = (userId) =>
    db.query.courses.findMany({
        where: and(eq(courses.userId, userId), eq(courses.isArchived, false)),
        orderBy: (c, { asc }) => [asc(c.createdAt)],
        with: { evaluations: true },
    });

export const findArchivedCoursesByUser = (userId) =>
    db.query.courses.findMany({
        where: and(eq(courses.userId, userId), eq(courses.isArchived, true)),
        orderBy: (c, { desc }) => [desc(c.updatedAt)],
        with: { evaluations: true },
    });

export const findCourseById = (courseId, userId) =>
    db.query.courses.findFirst({
        where: and(eq(courses.id, courseId), eq(courses.userId, userId)),
    });

export const findCourseWithEvals = (courseId, userId) =>
    db.query.courses.findFirst({
        where: and(eq(courses.id, courseId), eq(courses.userId, userId)),
        with: { evaluations: true },
    });

export const insertCourse = (data) =>
    db.insert(courses).values(data).returning().then(r => r[0]);

export const updateCourseFields = (courseId, userId, fields) =>
    db.update(courses).set(fields).where(and(eq(courses.id, courseId), eq(courses.userId, userId))).returning().then(r => r[0]);

export const setCourseArchived = (courseId, userId) =>
    db.update(courses).set({ isArchived: true }).where(and(eq(courses.id, courseId), eq(courses.userId, userId))).returning().then(r => r[0]);

export const deleteCourseById = (courseId, userId) =>
    db.delete(courses).where(and(eq(courses.id, courseId), eq(courses.userId, userId)));


export const findEvalsByCoure = (courseId) =>
    db.query.evaluations.findMany({
        where: eq(evaluations.courseId, courseId),
        orderBy: (e, { asc }) => [asc(e.date)],
    });

export const findEvalById = (evalId) =>
    db.query.evaluations.findFirst({
        where: eq(evaluations.id, evalId),
        with: { course: true },
    });

export const insertEval = (data) =>
    db.insert(evaluations).values(data).returning().then(r => r[0]);

export const updateEvalFields = (evalId, fields) =>
    db.update(evaluations).set(fields).where(eq(evaluations.id, evalId)).returning().then(r => r[0]);

export const deleteEvalById = (evalId) =>
    db.delete(evaluations).where(eq(evaluations.id, evalId));

export const findUpcomingEvalsByUser = (userId) =>
    db.query.courses.findMany({
        where: and(eq(courses.userId, userId), eq(courses.isArchived, false)),
        with: {
            evaluations: {
                where: gte(evaluations.date, new Date()),
                orderBy: [asc(evaluations.date)],
            },
        },
        orderBy: (c, { asc }) => [asc(c.name)],
    });

export const deleteUserById = (id) =>
    db.delete(users).where(eq(users.id, id));