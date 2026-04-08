import express from "express";
import { listCourses, getCourse, addCourse, editCourse, removeCourse } from "./courses.controller.js";

const router = express.Router();

router.get("/",     listCourses);
router.post("/",    addCourse);
router.get("/:id",  getCourse);
router.patch("/:id", editCourse);
router.delete("/:id", removeCourse);

export default router;
