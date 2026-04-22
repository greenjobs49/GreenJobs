const mongoose = require("mongoose");

const navbarBannerSchema = new mongoose.Schema(
  {
    // Image URL - can be uploaded file path or external URL
    imageUrl: {
      type: String,
      trim: true,
      required: true,
    },
    // ALT text for accessibility
    altText: {
      type: String,
      trim: true,
      default: "Navbar Banner",
    },
    // Status to enable/disable banner
    isActive: {
      type: Boolean,
      default: true,
    },
    // Height of the image (optional, for responsive design)
    height: {
      type: String,
      default: "75px",
      trim: true,
    },
    // Border radius (optional)
    borderRadius: {
      type: String,
      default: "8px",
      trim: true,
    },
    // Updated by (admin who last updated)
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