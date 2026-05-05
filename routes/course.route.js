import express from "express";
import {
  getAllCourses,
  getCourseByName,
  getSpecializationByName,
  getUniversityBySpecializations,
  getCoursesByUniversityAndBranch,
} from "../controller/course.controller.js";

const courseRouter = express.Router({
  caseSensitive: true,
  strict: true,
  mergeParams: true,
});

// Get all courses cards
courseRouter.get("/", getAllCourses);
//Get all courses by university and branch
courseRouter.get("/university-branch", getCoursesByUniversityAndBranch);
// Get course landing page by course name
courseRouter.get("/:course_name", getCourseByName);
// Get universities by specialization name (form )
courseRouter.get(
  "/form/:specializationInternalName",
  getUniversityBySpecializations,
);
// go to specialization landing page
courseRouter.get(
  "/:course_name/specializations/:specialization_name",
  getSpecializationByName,
);

export default courseRouter;
