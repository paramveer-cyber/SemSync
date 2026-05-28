import express from "express";
import { listCourses, listArchivedCourses, getCourse, addCourse, editCourse, removeCourse, doArchiveCourse } from "./courses.controller.js";
import { validate } from "../../common/middlewares/validate.js";
import { createCourseBody, updateCourseBody } from "./courses.model.js";

const router = express.Router();

router.get("/",             listCourses);
router.get("/archived",     listArchivedCourses);
router.post("/",            validate(createCourseBody), addCourse);
router.get("/:id",          getCourse);
router.patch("/:id",        validate(updateCourseBody), editCourse);
router.delete("/:id",       removeCourse);
router.post("/:id/archive", doArchiveCourse);

export default router;
