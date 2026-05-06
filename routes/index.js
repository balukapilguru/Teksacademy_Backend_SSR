import { Router } from "express";
import seoRouter from "./seo.route.js";

const indexRouter = Router({ strict: true, caseSensitive: true })
import coursesRouter from "./courses.route.js";
import universityRouter from "./university.route.js";
import homeRouter from  "./home.route.js"
import branchRouter from "./branch.route.js";
import discoverRouter from "./discover.route.js";
import placementRouter from "./placement.route.js";
import courseRouter from "./course.route.js";



indexRouter.use("/", seoRouter);
indexRouter.use("/courses", coursesRouter); //all courses related routes
indexRouter.use("/course", courseRouter); //all course related routes
indexRouter.use("/university", universityRouter); //all universities related routes
indexRouter.use('/home',homeRouter) //all home related routes
indexRouter.use('/branch', branchRouter) //all branch related routes
indexRouter.use('/discover', discoverRouter) //all discover related routes
indexRouter.use('/placements', placementRouter) //all placement related routes
export default indexRouter