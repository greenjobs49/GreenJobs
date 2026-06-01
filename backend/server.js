require("dotenv").config();
const express   = require("express");
const cors      = require("cors");
const helmet    = require("helmet");
const connectDB = require("./config/db");

const app = express();

// ── Trust proxy (required for correct IP behind Render / Railway / Nginx) ─
app.set("trust proxy", 1);

// ── Security headers ──────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginOpenerPolicy:   { policy: "same-origin-allow-popups" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// ── CORS ──────────────────────────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://jobs.solarismypassion.com",
  "https://green-jobs-six.vercel.app",
  ...(process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((o) => o.trim())
    : []),
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Allow server-to-server / curl / mobile requests (no Origin header)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin.replace(/\/$/, ""))) {
      return callback(null, true);
    }
    console.warn(`[CORS] Blocked: ${origin}`);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials:    true,
  methods:        ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("/{*path}", cors(corsOptions));

// ── Body parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// ── Static files (og-default.png etc.) ───────────────────────────────────
app.use(express.static("public"));

// ── Database ──────────────────────────────────────────────────────────────
connectDB();

// ── Background jobs ───────────────────────────────────────────────────────
const { startProfileReminderCron } = require("./controllers/profileReminderCron");
startProfileReminderCron();

// ── SEO root-level files (must be before API routes) ─────────────────────
const {
  getSitemap,
  getRobotsTxt,
  buildBotShell,
} = require("./controllers/seo.controller");

app.get("/sitemap.xml", getSitemap);
app.get("/robots.txt",  getRobotsTxt);

// ── Bot-detection helper ──────────────────────────────────────────────────
// Social crawlers (Facebook, WhatsApp, LinkedIn, Slack, Telegram …) can't
// execute JavaScript, so they would get a blank SPA page and no OG tags.
// We detect them by User-Agent and return a pre-built HTML shell with the
// correct meta tags, then let the meta-refresh redirect real browsers.
const BOT_RE =
  /facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|slackbot|telegrambot|googlebot|bingbot|applebot|discordbot|pinterestbot|embedly|quora|outbrain|vkshare|semrushbot|ahrefsbot|rogerbot/i;

const isBot = (req) => BOT_RE.test(req.headers["user-agent"] || "");

const SITE_URL = process.env.FRONTEND_URL|| "https://jobs.solarismypassion.com";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

// ── Bot shell: /jobs/:id ──────────────────────────────────────────────────
app.get("/jobs/:id", async (req, res, next) => {
  if (!isBot(req)) return next();

  try {
    const Job = require("./models/Job");
    const job = await Job.findById(req.params.id)
      .select("title company description business recruiter status")
      .lean();

    // Not found or not approved → fall through to SPA
    if (!job || job.status !== "approved") return next();

    const company =
      job.company ||
      job.business?.businessProfile?.businessName ||
      job.recruiter?.recruiterProfile?.companyName ||
      "GreenJobs";

    const title = `${job.title} at ${company} | GreenJobs`;
    const description = (job.description || "Apply now on GreenJobs")
      .replace(/\n/g, " ")
      .trim()
      .slice(0, 160);
    const image =
      job.business?.profilePicture ||
      job.business?.businessProfile?.images?.[0] ||
      job.recruiter?.recruiterProfile?.companyLogo ||
      DEFAULT_OG_IMAGE;
    const url = `${SITE_URL}/jobs/${job._id}`;

    return res
      .set("Cache-Control", "public, max-age=300") // 5-min crawler cache
      .send(buildBotShell({ title, description, image, url }));
  } catch (err) {
    console.error("[Bot /jobs/:id]", err.message);
    return next(); // always fall through on error — never break real users
  }
});

// ── Bot shell: /businesses/:id ────────────────────────────────────────────
app.get("/businesses/:id", async (req, res, next) => {
  if (!isBot(req)) return next();

  try {
    const User = require("./models/User");
    const biz  = await User.findOne({
      _id:  req.params.id,
      role: "business",
      "businessProfile.status": "approved",
    })
      .select("businessProfile profilePicture")
      .lean();

    if (!biz) return next();

    const p           = biz.businessProfile || {};
    const title       = `${p.businessName || "Company"} | GreenJobs`;
    const description = (p.description || "Discover this company on GreenJobs")
      .replace(/\n/g, " ")
      .trim()
      .slice(0, 160);
    const image =
      biz.profilePicture ||
      p.images?.[0]      ||
      DEFAULT_OG_IMAGE;
    const url = `${SITE_URL}/businesses/${biz._id}`;

    return res
      .set("Cache-Control", "public, max-age=300")
      .send(buildBotShell({ title, description, image, url }));
  } catch (err) {
    console.error("[Bot /businesses/:id]", err.message);
    return next();
  }
});

// ── API routes ────────────────────────────────────────────────────────────
app.use("/api/auth",         require("./routes/auth.routes"));
app.use("/api/profile",      require("./routes/profile.routes"));
app.use("/api/jobs",         require("./routes/job.routes"));
app.use("/api/admin",        require("./routes/admin.routes"));
app.use("/api/applications", require("./routes/application.routes"));
app.use("/api/ads",          require("./routes/ad.routes"));
app.use("/api/seo",          require("./routes/seo.routes"));

// ── Health check ──────────────────────────────────────────────────────────
app.get("/health", (_req, res) =>
  res.json({ success: true, status: "OK", message: "Server is running" })
);

// ── 404 ───────────────────────────────────────────────────────────────────
app.use((_req, res) =>
  res.status(404).json({ success: false, message: "Route not found" })
);

// ── Global error handler ──────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("[Server error]", err);
  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong processing your request"
        : err.message,
  });
});

// ── Start ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, "0.0.0.0", () =>
  console.log(`[Server] Running on port ${PORT}`)
);
server.keepAliveTimeout = 65000;
server.headersTimeout   = 66000;