const SeoMeta = require("../models/SeoMeta");
const Job     = require("../models/Job");
const User    = require("../models/User");

// ── Default page seeds ────────────────────────────────────────────────────────
const DEFAULT_PAGES = [
  {
    pageKey:           "home",
    pageLabel:         "Home Page",
    pageType:          "static",
    sitemapPriority:   1.0,
    sitemapChangefreq: "daily",
  },
  {
    pageKey:           "jobs",
    pageLabel:         "Jobs Listing",
    pageType:          "static",
    sitemapPriority:   0.9,
    sitemapChangefreq: "hourly",
  },
  {
    pageKey:           "businesses",
    pageLabel:         "Businesses Listing",
    pageType:          "static",
    sitemapPriority:   0.8,
    sitemapChangefreq: "daily",
  },
  {
    pageKey:           "about",
    pageLabel:         "About Us",
    pageType:          "static",
    sitemapPriority:   0.6,
    sitemapChangefreq: "monthly",
  },
  {
    pageKey:           "contact",
    pageLabel:         "Contact Us",
    pageType:          "static",
    sitemapPriority:   0.5,
    sitemapChangefreq: "monthly",
  },
  {
    pageKey:           "job-detail",
    pageLabel:         "Job Detail (dynamic)",
    pageType:          "dynamic",
    sitemapPriority:   0.8,
    sitemapChangefreq: "weekly",
  },
  {
    pageKey:           "company-detail",
    pageLabel:         "Company Detail (dynamic)",
    pageType:          "dynamic",
    sitemapPriority:   0.7,
    sitemapChangefreq: "weekly",
  },
  {
    pageKey:          "robots-txt",
    pageLabel:        "Robots.txt",
    pageType:         "static",
    includeInSitemap: false,
    robotsTxtContent: [
      "User-agent: *",
      "Allow: /",
      "Disallow: /admin/",
      "Disallow: /api/",
      "",
      `Sitemap: ${process.env.SITE_URL || "https://jobs.solarismypassion.com"}/sitemap.xml`,
    ].join("\n"),
  },
];

// Runs once per cold start — $setOnInsert means existing docs are never overwritten
let _seeded = false;
async function seedDefaults() {
  if (_seeded) return;
  await Promise.all(
    DEFAULT_PAGES.map((page) =>
      SeoMeta.findOneAndUpdate(
        { pageKey: page.pageKey },
        { $setOnInsert: page },
        { upsert: true, new: false }
      )
    )
  );
  _seeded = true;
}

// ── XSS-safe escaper used inside the bot HTML shell ──────────────────────────
const esc = (str = "") =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/* =========================================================
   PUBLIC — GET SEO FOR ONE PAGE
   GET /api/seo/:pageKey
========================================================= */
exports.getPublicSeo = async (req, res) => {
  try {
    const meta = await SeoMeta.findOne({ pageKey: req.params.pageKey }).lean();
    return res.json({ success: true, meta: meta || null });
  } catch (err) {
    console.error("[SEO] getPublicSeo error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to fetch SEO meta" });
  }
};

/* =========================================================
   PUBLIC — SITEMAP XML
   GET /sitemap.xml
========================================================= */
exports.getSitemap = async (req, res) => {
  try {
    const siteUrl = process.env.SITE_URL || "https://jobs.solarismypassion.com";
    const now     = new Date().toISOString();

    // Fetch everything in parallel — jobSeo and companySeo share the first query
    const [seoPages, liveJobs, approvedCompanies, jobSeo, companySeo] =
      await Promise.all([
        SeoMeta.find({
          includeInSitemap: true,
          pageKey:  { $ne: "robots-txt" },
          pageType: "static",
        }).lean(),
        Job.find({ status: "approved" })
          .select("_id updatedAt")
          .lean(),
        User.find({
          role: "business",
          "businessProfile.status": "approved",
        })
          .select("_id updatedAt")
          .lean(),
        SeoMeta.findOne({ pageKey: "job-detail" }).lean(),
        SeoMeta.findOne({ pageKey: "company-detail" }).lean(),
      ]);

    const xmlUrl = (loc, lastmod, changefreq, priority) => `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

    let urls = "";

    // Static pages
    for (const p of seoPages) {
      urls += xmlUrl(
        `${siteUrl}/${p.pageKey === "home" ? "" : p.pageKey}`,
        p.updatedAt ? new Date(p.updatedAt).toISOString() : now,
        p.sitemapChangefreq || "weekly",
        p.sitemapPriority   ?? 0.8
      );
    }

    // Dynamic job pages
    if (jobSeo?.includeInSitemap !== false) {
      for (const job of liveJobs) {
        urls += xmlUrl(
          `${siteUrl}/jobs/${job._id}`,
          job.updatedAt ? new Date(job.updatedAt).toISOString() : now,
          jobSeo?.sitemapChangefreq || "weekly",
          jobSeo?.sitemapPriority   ?? 0.8
        );
      }
    }

    // Dynamic company pages
    if (companySeo?.includeInSitemap !== false) {
      for (const c of approvedCompanies) {
        urls += xmlUrl(
          `${siteUrl}/businesses/${c._id}`,
          c.updatedAt ? new Date(c.updatedAt).toISOString() : now,
          companySeo?.sitemapChangefreq || "weekly",
          companySeo?.sitemapPriority   ?? 0.7
        );
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

    res
      .set("Content-Type", "application/xml")
      // Cache sitemap for 1 hour — reduces DB load from frequent crawler hits
      .set("Cache-Control", "public, max-age=3600")
      .send(xml);
  } catch (err) {
    console.error("[SEO] getSitemap error:", err.message);
    res.status(500).send("Failed to generate sitemap");
  }
};

/* =========================================================
   PUBLIC — ROBOTS.TXT
   GET /robots.txt
========================================================= */
exports.getRobotsTxt = async (req, res) => {
  try {
    const doc = await SeoMeta.findOne({ pageKey: "robots-txt" }).lean();
    const content =
      doc?.robotsTxtContent ||
      [
        "User-agent: *",
        "Allow: /",
        "Disallow: /admin/",
        "Disallow: /api/",
        "",
        `Sitemap: ${process.env.SITE_URL || "https://jobs.solarismypassion.com"}/sitemap.xml`,
      ].join("\n");

    res
      .set("Content-Type", "text/plain")
      .set("Cache-Control", "public, max-age=86400") // cache for 24 h
      .send(content);
  } catch (err) {
    console.error("[SEO] getRobotsTxt error:", err.message);
    res.status(500).send("Failed to fetch robots.txt");
  }
};

/* =========================================================
   BOT — HTML SHELL FOR SOCIAL CRAWLERS
   Called by the bot-detection middleware in server.js.
   Returns a lightweight page with correct OG tags so that
   Facebook / WhatsApp / LinkedIn / Slack unfurl correctly.
========================================================= */
exports.buildBotShell = ({ title, description, image, url }) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${esc(title)}</title>
  <meta name="description"         content="${esc(description)}" />
  <meta property="og:title"        content="${esc(title)}" />
  <meta property="og:description"  content="${esc(description)}" />
  <meta property="og:image"        content="${esc(image)}" />
  <meta property="og:url"          content="${esc(url)}" />
  <meta property="og:type"         content="website" />
  <meta name="twitter:card"         content="summary_large_image" />
  <meta name="twitter:title"        content="${esc(title)}" />
  <meta name="twitter:description"  content="${esc(description)}" />
  <meta name="twitter:image"        content="${esc(image)}" />
  <meta http-equiv="refresh" content="0;url=${esc(url)}" />
</head>
<body></body>
</html>`;

/* =========================================================
   ADMIN — LIST ALL SEO PAGES
   GET /api/admin/seo
========================================================= */
exports.getAllSeoPages = async (req, res) => {
  try {
    await seedDefaults();
    const pages = await SeoMeta.find({})
      .populate("updatedBy", "name email")
      .sort({ pageType: 1, pageKey: 1 })
      .lean();
    return res.json({ success: true, pages });
  } catch (err) {
    console.error("[SEO] getAllSeoPages error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to fetch SEO pages" });
  }
};

/* =========================================================
   ADMIN — GET ONE PAGE
   GET /api/admin/seo/:pageKey
========================================================= */
exports.getSeoPage = async (req, res) => {
  try {
    const meta = await SeoMeta.findOne({ pageKey: req.params.pageKey })
      .populate("updatedBy", "name email")
      .lean();
    if (!meta)
      return res.status(404).json({ success: false, message: "Page not found" });
    return res.json({ success: true, meta });
  } catch (err) {
    console.error("[SEO] getSeoPage error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to fetch page" });
  }
};

/* =========================================================
   ADMIN — UPSERT PAGE SEO
   PUT /api/admin/seo/:pageKey
========================================================= */
exports.upsertSeoPage = async (req, res) => {
  try {
    const { pageKey } = req.params;
    const {
      pageLabel,
      title,
      description,
      keywords,
      canonical,
      robots,
      ogTitle,
      ogDescription,
      ogImage,
      ogType,
      twitterCard,
      twitterTitle,
      twitterDescription,
      twitterImage,
      schemaMarkup,
      includeInSitemap,
      sitemapPriority,
      sitemapChangefreq,
      robotsTxtContent,
    } = req.body;

    // Validate JSON-LD before touching the DB
    if (schemaMarkup?.trim()) {
      try {
        JSON.parse(schemaMarkup);
      } catch {
        return res.status(400).json({
          success: false,
          message: "Schema markup is not valid JSON — fix it before saving.",
        });
      }
    }

    // Only include fields that were actually sent — avoids wiping fields
    // the admin didn't touch in a partial update
    const update = {
      ...(pageLabel          !== undefined && { pageLabel }),
      ...(title              !== undefined && { title }),
      ...(description        !== undefined && { description }),
      ...(keywords           !== undefined && {
        keywords: Array.isArray(keywords)
          ? keywords
          : keywords.split(",").map((k) => k.trim()).filter(Boolean),
      }),
      ...(canonical          !== undefined && { canonical }),
      ...(robots             !== undefined && { robots }),
      ...(ogTitle            !== undefined && { ogTitle }),
      ...(ogDescription      !== undefined && { ogDescription }),
      ...(ogImage            !== undefined && { ogImage }),
      ...(ogType             !== undefined && { ogType }),
      ...(twitterCard        !== undefined && { twitterCard }),
      ...(twitterTitle       !== undefined && { twitterTitle }),
      ...(twitterDescription !== undefined && { twitterDescription }),
      ...(twitterImage       !== undefined && { twitterImage }),
      ...(schemaMarkup       !== undefined && { schemaMarkup }),
      ...(includeInSitemap   !== undefined && { includeInSitemap }),
      ...(sitemapPriority    !== undefined && {
        sitemapPriority: parseFloat(sitemapPriority),
      }),
      ...(sitemapChangefreq  !== undefined && { sitemapChangefreq }),
      ...(robotsTxtContent   !== undefined && { robotsTxtContent }),
      updatedBy: req.user.id,
    };

    const meta = await SeoMeta.findOneAndUpdate(
      { pageKey },
      { $set: update },
      { upsert: true, new: true, runValidators: true }
    ).populate("updatedBy", "name email");

    console.log(`[SEO] "${pageKey}" updated by admin ${req.user.id}`);
    return res.json({ success: true, message: `SEO for "${pageKey}" saved.`, meta });
  } catch (err) {
    console.error("[SEO] upsertSeoPage error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to save SEO settings" });
  }
};

/* =========================================================
   ADMIN — BULK UPSERT
   POST /api/admin/seo/bulk
========================================================= */
exports.bulkUpsertSeo = async (req, res) => {
  try {
    const { pages } = req.body;
    if (!Array.isArray(pages) || pages.length === 0)
      return res.status(400).json({ success: false, message: "pages array is required" });

    const ops = pages.map((p) => ({
      updateOne: {
        filter: { pageKey: p.pageKey },
        update: { $set: { ...p, updatedBy: req.user.id } },
        upsert: true,
      },
    }));
    await SeoMeta.bulkWrite(ops);
    return res.json({ success: true, message: `${pages.length} pages updated.` });
  } catch (err) {
    console.error("[SEO] bulkUpsertSeo error:", err.message);
    return res.status(500).json({ success: false, message: "Bulk update failed" });
  }
};