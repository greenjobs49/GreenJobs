const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    
    title: {
      type: String,
      required: true,
    },

    slug: {
      type: String,
      unique: true,
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    thumbnail: {
      type: String,
      default: "",
    },
    // after thumbnail field, before status:
metaTitle:       { type: String, default: "" },
metaDescription: { type: String, default: "" },
metaKeywords:    [{ type: String }],
canonicalUrl:    { type: String, default: "" },
ogTitle:         { type: String, default: "" },
ogDescription:   { type: String, default: "" },
ogImage:         { type: String, default: "" },
robots:          { type: String, default: "index, follow" },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Blog", blogSchema);