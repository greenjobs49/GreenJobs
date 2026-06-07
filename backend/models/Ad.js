const mongoose = require("mongoose");

const adSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      maxlength: 120,
      // optional — not required
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    tag: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    ctaText: {
      type: String,
      default: "Learn More",
      trim: true,
      maxlength: 40,
    },
    ctaUrl: {
      type: String,
      default: "/jobs",
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    accentColor: {
      type: String,
      default: "#10b981",
      match: /^#[0-9a-fA-F]{3,6}$/,
    },
    bannerType: {
      type: String,
      enum: ["full_banner", "spotlight"],
      default: "spotlight",
    },
    // Kept in schema for backward-compat but no longer used on frontend
    bannerHeadline: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    bannerDescription: {
      type: String,
      trim: true,
      maxlength: 600,
    },
    imageSize: {
      type: String,
      enum: ["small", "medium", "large"],
      default: "medium",
    },
    objectFit: {
      type: String,
      enum: ["cover", "contain", "fill"],
      default: "cover",
    },
    objectPosition: {
      type: String,
      default: "center top",
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ad", adSchema);