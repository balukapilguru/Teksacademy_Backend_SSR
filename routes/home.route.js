import express from "express";
import {getHomeData,getHomeSpecificField , getHomeFranchiseField } from "../controller/home.controller.js";
const homeRouter = express.Router();

// get home data from home.json
homeRouter.get("/", getHomeData); 
//get footer,privacy_policy,terms_conditions,navbar by name for home page
homeRouter.get("/:name", getHomeSpecificField); 
homeRouter.get("/:name/:franchise", getHomeFranchiseField);


export default homeRouter;
