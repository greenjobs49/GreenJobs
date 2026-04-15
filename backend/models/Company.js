const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
  name: String,
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  verified: { type: Boolean, default: false },
  logoUrl: String
}, { timestamps: true });

module.exports = mongoose.model("Company", companySchema);
