import express from "express";
import {
  getInterviewQuestionByName,
} from "../controller/home.controller.js";


const interviewQuestionsRouter = express.Router({
  caseSensitive: true,
  strict: true,
  mergeParams: true,
});

interviewQuestionsRouter.get("/:interview_question_name", getInterviewQuestionByName);

export default interviewQuestionsRouter;
