import { db } from "../../db/index.js";
import { timers } from "../../db/schema.js";
import { eq } from "drizzle-orm";

export const getActiveTimer = (userId) =>
    db.query.timers.findFirst({ where: eq(timers.userId, userId) });

export const insertTimer = (data) =>
    db.insert(timers).values(data).returning().then(r => r[0]);

export const updateTimer = (userId, patch) =>
    db.update(timers).set(patch).where(eq(timers.userId, userId)).returning().then(r => r[0]);

export const deleteTimer = (userId) =>
    db.delete(timers).where(eq(timers.userId, userId));
