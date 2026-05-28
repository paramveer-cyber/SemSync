import { pgTable, uuid, text, timestamp, integer, real, boolean, date, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

const updatedAt = () =>
    timestamp("updated_at")
        .default(sql`now()`)
        .notNull()
        .$onUpdate(() => new Date());

export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    googleId: text("google_id").notNull().unique(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    avatarUrl: text("avatar_url"),
    googleAccessToken: text("google_access_token"),
    googleRefreshToken: text("google_refresh_token"),
    googleTokenExpiry: timestamp("google_token_expiry"),
    refreshToken: text("refresh_token"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: updatedAt(),

});

export const courses = pgTable("courses", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    name: text("name").notNull(),
    credits: integer("credits").default(4).notNull(),
    targetGrade: real("target_grade").notNull().default(50),
    isArchived: boolean("is_archived").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: updatedAt(),

});

export const evaluations = pgTable("evaluations", {
    id: uuid("id").defaultRandom().primaryKey(),
    courseId: uuid("course_id")
        .references(() => courses.id, { onDelete: "cascade" })
        .notNull(),
    title: text("title").notNull(),
    type: text("type").notNull(),
    date: timestamp("date").notNull(),
    weightage: real("weightage").notNull(),
    maxScore: real("max_score").notNull(),
    score: real("score"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: updatedAt(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
    courses: many(courses),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
    user: one(users, { fields: [courses.userId], references: [users.id] }),
    evaluations: many(evaluations),
}));

export const evaluationsRelations = relations(evaluations, ({ one }) => ({
    course: one(courses, { fields: [evaluations.courseId], references: [courses.id] }),
}));



export const events = pgTable("events", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    occurredAt: timestamp("occurred_at").defaultNow().notNull(),
    metadata: jsonb("metadata").notNull().default({}),
}, (t) => [
    index("idx_events_user_type").on(t.userId, t.type),
    index("idx_events_user_time").on(t.userId, t.occurredAt),
]);

export const userStats = pgTable("user_stats", {
    userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
    totalSessions: integer("total_sessions").notNull().default(0),
    totalMinutes: integer("total_minutes").notNull().default(0),
    todayMinutes: integer("today_minutes").notNull().default(0),
    weekMinutes: integer("week_minutes").notNull().default(0),
    totalXp: integer("total_xp").notNull().default(0),
    level: integer("level").notNull().default(1),
    statsDate: date("stats_date"),
    weekStart: date("week_start"),
});

export const userStreaks = pgTable("user_streaks", {
    userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
    currentStreak: integer("current_streak").notNull().default(0),
    longestStreak: integer("longest_streak").notNull().default(0),
    lastActiveDate: date("last_active_date"),
    freezeCount: integer("freeze_count").notNull().default(2),
});

export const userAchievements = pgTable("user_achievements", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    achievementId: text("achievement_id").notNull(),
    tier: text("tier").notNull(),
    xpAwarded: integer("xp_awarded").notNull(),
    earnedAt: timestamp("earned_at").defaultNow().notNull(),
}, (t) => [
    index("idx_achievements_user").on(t.userId),
    uniqueIndex("idx_achievements_user_id_unique").on(t.userId, t.achievementId),
]);

export const dailyGoals = pgTable("daily_goals", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    type: text("type").notNull(),
    title: text("title").notNull(),
    targetValue: integer("target_value").notNull(),
    status: text("status").notNull().default("pending"),
    xpReward: integer("xp_reward").notNull(),
}, (t) => [
    index("idx_daily_goals_user_date").on(t.userId, t.date),
]);

export const eventsRelations = relations(events, ({ one }) => ({
    user: one(users, { fields: [events.userId], references: [users.id] }),
}));

/**
 * timers — server-owned active timer state.
 *
 * One row per active/paused timer per user. Completed or aborted timers are
 * deleted (their outcome is recorded in the events table as session.completed
 * or session.aborted). This keeps the table tiny and queries O(1).
 *
 * Security properties:
 *  - startedAt is set by the server on POST /timer/start — client cannot forge it.
 *  - pausedAt / pausedElapsedSeconds track cumulative paused time so the server
 *    can compute exact elapsed study time = (now - startedAt) - pausedElapsedSeconds.
 *  - status is the authoritative phase: 'running' | 'paused'.
 *  - plannedMinutes is stored at start so the server controls the duration contract.
 *  - nonce is a per-start random token returned to the client; used as an idempotency
 *    key on /timer/end so duplicate end requests are ignored.
 */
export const timers = pgTable("timers", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" })
        .unique(), // enforce one active timer per user at DB level
    status: text("status").notNull().default("running"), // 'running' | 'paused'
    startedAt: timestamp("started_at").defaultNow().notNull(),
    plannedMinutes: integer("planned_minutes").notNull(),
    pausedAt: timestamp("paused_at"),                        // set when paused
    pausedElapsedSeconds: integer("paused_elapsed_seconds").notNull().default(0), // cumulative pause time
    // Optional link metadata (stored for session.completed event, not used for auth)
    linkedTaskId: text("linked_task_id"),
    linkedEvalId: text("linked_eval_id"),
    linkedEvalDueDate: timestamp("linked_eval_due_date"),
    quickTitle: text("quick_title"),
    quickCategory: text("quick_category"),
    // Anti-replay nonce: returned to client on start, must match on end
    nonce: text("nonce").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: updatedAt(),
}, (t) => [
    index("idx_timers_user").on(t.userId),
]);
