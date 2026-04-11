import { pgTable, uuid, text, timestamp, integer, real, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
    id:                   uuid("id").defaultRandom().primaryKey(),
    googleId:             text("google_id").notNull().unique(),
    email:                text("email").notNull().unique(),
    name:                 text("name").notNull(),
    avatarUrl:            text("avatar_url"),
    googleAccessToken:    text("google_access_token"),
    googleRefreshToken:   text("google_refresh_token"),
    googleTokenExpiry:    timestamp("google_token_expiry"),
    createdAt:            timestamp("created_at").defaultNow().notNull(),
});

export const courses = pgTable("courses", {
    id:          uuid("id").defaultRandom().primaryKey(),
    userId:      uuid("user_id")
                     .references(() => users.id, { onDelete: "cascade" })
                     .notNull(),
    name:        text("name").notNull(),
    credits:     integer("credits"),
    targetGrade: real("target_grade").notNull().default(50),
    createdAt:   timestamp("created_at").defaultNow().notNull(),
});

export const evaluations = pgTable("evaluations", {
    id:        uuid("id").defaultRandom().primaryKey(),
    courseId:  uuid("course_id")
                   .references(() => courses.id, { onDelete: "cascade" })
                   .notNull(),
    title:     text("title").notNull(),
    type:      text("type").notNull(),
    date:      timestamp("date").notNull(),
    weightage: real("weightage").notNull(),
    maxScore:  real("max_score").notNull(),
    score:     real("score"),               // nullable — not yet graded
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Caches classroom data per user to avoid hammering the Google API on every load
export const classroomCache = pgTable("classroom_cache", {
    id:        uuid("id").defaultRandom().primaryKey(),
    userId:    uuid("user_id")
                   .references(() => users.id, { onDelete: "cascade" })
                   .notNull().unique(),
    data:      jsonb("data").notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Relations (used by Drizzle relational queries) ────────────────────────────

export const usersRelations = relations(users, ({ many, one }) => ({
    courses:        many(courses),
    classroomCache: one(classroomCache, { fields: [users.id], references: [classroomCache.userId] }),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
    user:        one(users, { fields: [courses.userId],    references: [users.id] }),
    evaluations: many(evaluations),
}));

export const evaluationsRelations = relations(evaluations, ({ one }) => ({
    course: one(courses, { fields: [evaluations.courseId], references: [courses.id] }),
}));

export const classroomCacheRelations = relations(classroomCache, ({ one }) => ({
    user: one(users, { fields: [classroomCache.userId], references: [users.id] }),
}));
