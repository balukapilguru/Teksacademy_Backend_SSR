import express from "express";
import {
  getAllCourses,
  getCourseByName,
  getSpecializationByName,
} from "../controller/course.controller.js";

const coursesRouter = express.Router({
  caseSensitive: true,
  strict: true,
  mergeParams: true,
});

// Get all courses cards
coursesRouter.get("/", getAllCourses);
// Get course landing page by course name
coursesRouter.get("/:course_name", getCourseByName);
// go to specialization landing page
coursesRouter.get(
  "/:course_name/specializations/:specialization_name",
  getSpecializationByName,
);

export default coursesRouter;
