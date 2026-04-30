// routes/seo.route.js
import { Router } from "express";
import { getSitemap } from "../controller/sitemap.controller.js";
import { getRobots } from "../controller/robots.controller.js";

const router = Router();

router.get("/sitemap.xml", getSitemap);
router.get("/robots.txt", getRobots);

export default router;
