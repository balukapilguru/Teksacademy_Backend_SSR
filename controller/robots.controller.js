export const getRobots = (req, res) => {
    const SITE_URL = process.env.SITE_URL || "https://teksversity.com";

    res.setHeader("Content-Type", "text/plain");
    res.send(
        `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml`
    );
};
