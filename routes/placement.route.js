import express from "express";
import {
  getplacementElements
} from "../controller/home.controller.js";


const placementRouter = express.Router({
  caseSensitive: true,
  strict: true,
  mergeParams: true,
});

placementRouter.get("/:placement_elements", getplacementElements);

export default placementRouter;
