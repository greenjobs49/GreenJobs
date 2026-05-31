const mongoose = require("mongoose");

const seoMetaSchema = new mongoose.Schema(
  {
    pageKey: {
      type: String,
      required: true,
      unique: true,  // this already creates the index — no need for .index({ pageKey: 1 }) below
      trim: true,
    },
    pageLabel: {
      type: String,
      trim: true,
      default: "",
    },
    pageType: {
      type: String,
      enum: ["static", "dynamic"],
      default: "static",
    },

    // ── Core meta ────────────────────────────────────────────────────────────
    title:       { type: String, trim: true, default: "", maxlength: 160 },
    description: { type: String, trim: true, default: "", maxlength: 320 },
    keywords:    { type: [String], default: [] },
    canonical:   { type: String, trim: true, default: "" },
    robots:      { type: String, trim: true, default: "index,follow" },

    // ── Open Graph ───────────────────────────────────────────────────────────
    ogTitle:       { type: String, trim: true, default: "", maxlength: 160 },
    ogDescription: { type: String, trim: true, default: "", maxlength: 320 },
    ogImage:       { type: String, trim: true, default: "" },
    ogType:        { type: String, trim: true, default: "website" },

    // ── Twitter Card ─────────────────────────────────────────────────────────
    twitterCard: {
      type: String,
      enum: ["summary", "summary_large_image"],
      default: "summary_large_image",
    },
    twitterTitle:       { type: String, trim: true, default: "", maxlength: 160 },
    twitterDescription: { type: String, trim: true, default: "", maxlength: 320 },
    twitterImage:       { type: String, trim: true, default: "" },

    // ── JSON-LD Schema ───────────────────────────────────────────────────────
    schemaMarkup: { type: String, trim: true, default: "" },

    // ── Sitemap control ──────────────────────────────────────────────────────
    includeInSitemap:  { type: Boolean, default: true },
    sitemapPriority:   { type: Number, min: 0.0, max: 1.0, default: 0.8 },
    sitemapChangefreq: {
      type: String,
      enum: ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"],
      default: "weekly",
    },

    // ── Robots.txt (only used on pageKey "robots-txt") ───────────────────────
    robotsTxtContent: { type: String, default: "" },

    // ── Audit ────────────────────────────────────────────────────────────────
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// ── Only pageType needs an explicit index — pageKey is covered by unique:true above
seoMetaSchema.index({ pageType: 1 });

module.exports = mongoose.model("SeoMeta", seoMetaSchema);