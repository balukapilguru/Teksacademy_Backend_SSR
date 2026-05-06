import express from "express";
import {
  getBranchByName
} from "../controller/home.controller.js";


const branchRouter = express.Router({
  caseSensitive: true,
  strict: true,
  mergeParams: true,
});

branchRouter.get("/:branch_name", getBranchByName);

export default branchRouter;
