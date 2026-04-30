import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = process.env.SITE_URL || "https://teksversity.com";
const ASSETS_DIR = path.join(__dirname, "../assets");
const COURSES_DIR = path.join(ASSETS_DIR, "courses");
const UNIVERSITIES_DIR = path.join(ASSETS_DIR, "universities");

// simple in-memory cache (market-standard for sitemap)
let cache = { xml: null, ts: 0 };
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24h

// -------- helpers --------

const formatLastMod = (date) =>
    new Date(date).toISOString().replace("Z", "+00:00");

const urlBlock = ({ loc, lastmod, priority }) => `
<url>
  <loc>${loc}</loc>
  <lastmod>${lastmod}</lastmod>
  <changefreq>daily</changefreq>
  <priority>${priority}</priority>
</url>`.trim();

// -------- controller --------

export const getSitemap = (req, res) => {
    try {
        // serve cache
        if (cache.xml && Date.now() - cache.ts < CACHE_TTL) {
            res.setHeader("Content-Type", "application/xml");
            return res.status(200).send(cache.xml);
        }

        const urls = [];
        const now = formatLastMod(Date.now());

        // ---- static pages ----
        urls.push(urlBlock({ loc: `${SITE_URL}/`, lastmod: now, priority: "1.00" }));
        urls.push(urlBlock({ loc: `${SITE_URL}/courses`, lastmod: now, priority: "0.80" }));
        urls.push(urlBlock({ loc: `${SITE_URL}/university`, lastmod: now, priority: "0.80" }));
        urls.push(urlBlock({ loc: `${SITE_URL}/privacy-policy`, lastmod: now, priority: "0.80" }));
        urls.push(urlBlock({ loc: `${SITE_URL}/terms-conditions`, lastmod: now, priority: "0.80" }));

        // ---- universities ----
        fs.readdirSync(UNIVERSITIES_DIR)
            .filter(f => f.endsWith(".json") && f !== "universities.json")
            .forEach(file => {
                const slug = file.replace(".json", "");
                const stat = fs.statSync(path.join(UNIVERSITIES_DIR, file));

                urls.push(
                    urlBlock({
                        loc: `${SITE_URL}/university/${slug}`,
                        lastmod: formatLastMod(stat.mtime),
                        priority: "0.80"
                    })
                );
            });

        // ---- courses & specializations ----
        fs.readdirSync(COURSES_DIR).forEach(courseSlug => {
            const courseFile = path.join(COURSES_DIR, courseSlug, `${courseSlug}.json`);
            if (!fs.existsSync(courseFile)) return;

            const courseStat = fs.statSync(courseFile);

            // course landing
            urls.push(
                urlBlock({
                    loc: `${SITE_URL}/courses/${courseSlug}`,
                    lastmod: formatLastMod(courseStat.mtime),
                    priority: "0.80"
                })
            );

            // specialization pages
            const specDir = path.join(COURSES_DIR, courseSlug, "specializations");
            if (!fs.existsSync(specDir)) return;

            fs.readdirSync(specDir)
                .filter(f => f.endsWith(".json"))
                .forEach(specFile => {
                    const specSlug = specFile.replace(".json", "");
                    const specStat = fs.statSync(path.join(specDir, specFile));

                    urls.push(
                        urlBlock({
                            loc: `${SITE_URL}/courses/${courseSlug}/${specSlug}`,
                            lastmod: formatLastMod(specStat.mtime),
                            priority: "0.64"
                        })
                    );
                });
        });

        // ---- final XML (EXACT FORMAT) ----
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
      xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

${urls.join("\n\n")}

</urlset>`;

        cache = { xml, ts: Date.now() };

        res.setHeader("Content-Type", "application/xml");
        res.status(200).send(xml);
    } catch (err) {
        console.error("Sitemap generation error:", err);
        res.status(500).end();
    }
};
