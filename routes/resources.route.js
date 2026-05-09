import express from "express";
import {
  getResourceByName,
} from "../controller/home.controller.js";


const resourcesRouter = express.Router({
  caseSensitive: true,
  strict: true,
  mergeParams: true,
});

resourcesRouter.get("/:resource_name", getResourceByName);

export default resourcesRouter;
