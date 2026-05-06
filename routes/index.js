import { Router } from "express";
import seoRouter from "./seo.route.js";

const indexRouter = Router({ strict: true, caseSensitive: true })
import courseRouter from "./course.route.js";
import universityRouter from "./university.route.js";
import homeRouter from  "./home.route.js"
import branchRouter from "./branch.route.js";
import discoverRouter from "./discover.route.js";


indexRouter.use("/", seoRouter);
indexRouter.use("/courses", courseRouter); //all courses related routes
indexRouter.use("/university", universityRouter); //all universities related routes
indexRouter.use('/home',homeRouter) //all home related routes
indexRouter.use('/branch', branchRouter) //all branch related routes
indexRouter.use('/discover', discoverRouter) //all discover related routes
export default indexRouter