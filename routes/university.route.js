import express from "express"
import { getUniversities, getSingleUniversity,getOtherUniversity } from "../controller/universities.controller.js"

const universityRouter = express.Router();

//get all universities cards
universityRouter.get("/", getUniversities); 
 //get single university landing page by name
universityRouter.get("/:name", getSingleUniversity);
//get other universities cards except the current university
universityRouter.get("/universitiesCards/:name", getOtherUniversity); 

export default universityRouter;
