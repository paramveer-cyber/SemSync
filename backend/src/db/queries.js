import { db } from "./index.js";
import { users, courses, evaluations, userStats, userStreaks, userAchievements, dailyGoals, events } from "./schema.js";
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

export const getUserRoleById = (id) => db.query.users.findFirst({ where: eq(users.id, id) });

export const checkIfAdmin = async (id) => (await getUserRoleById(id)).role === "admin";

export const findAllCoursesByUser = (userId) =>
    db.query.courses.findMany({
        where: eq(courses.userId, userId),
        orderBy: (course, { asc }) => [asc(course.createdAt)],
        with: { evaluations: true },
    });

export const findUserStatsByUser = (userId) =>
    db.select().from(userStats).where(eq(userStats.userId, userId)).then(rows => rows[0] ?? null);

export const findUserStreaksByUser = (userId) =>
    db.select().from(userStreaks).where(eq(userStreaks.userId, userId)).then(rows => rows[0] ?? null);

export const findAchievementsByUser = (userId) =>
    db.select().from(userAchievements).where(eq(userAchievements.userId, userId));

export const findDailyGoalsByUser = (userId) =>
    db.select().from(dailyGoals).where(eq(dailyGoals.userId, userId));

export const findRecentEventsByUser = (userId, limit = 500) =>
    db.select().from(events).where(eq(events.userId, userId)).limit(limit);

export const stampExportRequestedAt = (userId) =>
    db.update(users).set({ exportLastRequestedAt: new Date() }).where(eq(users.id, userId));