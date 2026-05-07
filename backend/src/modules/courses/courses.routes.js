import express from "express";
import { listCourses, listArchivedCourses, getCourse, addCourse, editCourse, removeCourse, doArchiveCourse } from "./courses.controller.js";

const router = express.Router();

router.get("/",            listCourses);
router.get("/archived",    listArchivedCourses);
router.post("/",           addCourse);
router.get("/:id",         getCourse);
router.patch("/:id",       editCourse);
router.delete("/:id",      removeCourse);
router.post("/:id/archive", doArchiveCourse);

export default router;
