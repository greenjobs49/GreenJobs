const mongoose = require("mongoose");

const navbarBannerSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      trim: true,
      required: true,
    },
    altText: {
      type: String,
      trim: true,
      default: "Navbar Banner",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    height: {
      type: String,
      default: "75px",
      trim: true,
    },
    borderRadius: {
      type: String,
      default: "8px",
      trim: true,
    },
    ctaUrl: {           // ← ADD THIS
      type: String,
      trim: true,
      default: "",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    collection: "navbar_banners",
  }
);

module.exports = mongoose.model("NavbarBanner", navbarBannerSchema);