import express from "express";
import { listCourses, listArchivedCourses, getCourse, addCourse, editCourse, removeCourse, doArchiveCourse } from "./courses.controller.js";
import { validate } from "../../common/middlewares/validate.js";
import { createCourseBody, updateCourseBody } from "./courses.model.js";
import { eventObserver } from "../achievements/achievement.middleware.js";

const router = express.Router();

router.get("/", listCourses);
router.get("/archived", listArchivedCourses);
router.post("/", validate(createCourseBody), eventObserver("course.created", "Course Created", (req, res) => res.locals.achievementMeta ?? {}), addCourse);
router.get("/:id", getCourse);
router.patch("/:id", validate(updateCourseBody), eventObserver("course.updated", "Course Updated", (req, res) => res.locals.achievementMeta ?? {}), editCourse);
router.delete("/:id", eventObserver("course.deleted", "Course Deleted"), removeCourse);
router.post("/:id/archive", eventObserver("course.archived", "Course Archived"), doArchiveCourse);

export default router;
