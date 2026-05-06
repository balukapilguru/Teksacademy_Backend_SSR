import express from "express";
import {
  getAllCourses,
  getCourseByName,
  getSpecializationByName,
  getUniversityBySpecializations,
  getCoursesByUniversityAndBranch,
} from "../controller/course.controller.js";

const coursesRouter = express.Router({
  caseSensitive: true,
  strict: true,
  mergeParams: true,
});

// Get all courses cards
coursesRouter.get("/", getAllCourses);
//Get all courses by university and branch
coursesRouter.get("/university-branch", getCoursesByUniversityAndBranch);
// Get course landing page by course name
coursesRouter.get("/:course_name", getCourseByName);
// Get universities by specialization name (form )
coursesRouter.get(
  "/form/:specializationInternalName",
  getUniversityBySpecializations,
);
// go to specialization landing page
coursesRouter.get(
  "/:course_name/specializations/:specialization_name",
  getSpecializationByName,
);

export default coursesRouter;
