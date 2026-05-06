import express from "express";
import {
  getAllCourses,
} from "../controller/courseCards.controller.js";


const courseRouter = express.Router({
  caseSensitive: true,
  strict: true,
  mergeParams: true,
});

courseRouter.get("/", getAllCourses);

export default courseRouter;
