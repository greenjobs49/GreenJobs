const mongoose = require("mongoose");

const adSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
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
    // Either an external image URL or uploaded image path
    imageUrl: {
      type: String,
      trim: true,
    },
    // Accent color (hex)
    accentColor: {
      type: String,
      default: "#10b981",
      match: /^#[0-9a-fA-F]{3,6}$/,
    },
    // Full-banner vs spotlight card
    bannerType: {
      type: String,
      enum: ["full_banner", "spotlight"],
      default: "spotlight",
    },
    // Full banner extra fields
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
    // Display order (lower = shown first)
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