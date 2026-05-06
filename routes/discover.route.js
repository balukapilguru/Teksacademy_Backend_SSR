import express from "express";
import {
  getDiscoverElements
} from "../controller/home.controller.js";


const discoverRouter = express.Router({
  caseSensitive: true,
  strict: true,
  mergeParams: true,
});

discoverRouter.get("/:discovery_elements", getDiscoverElements);

export default discoverRouter;
