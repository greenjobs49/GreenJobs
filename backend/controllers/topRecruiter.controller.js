const User = require("../models/User");
const Job  = require("../models/Job");

const toResult = (r, jobCount = 0, admin = false) => ({
  _id:            r._id,
  name:           r.name,
  companyName:    r.recruiterProfile?.companyName    || "",
  industryType:   r.recruiterProfile?.industryType   || "",
  companyLocation:r.recruiterProfile?.companyLocation|| "",
  // Priority: admin-chosen override → profile picture → company logo → null
  logoUrl:
    r.recruiterProfile?.featuredLogoUrl ||
    r.profilePicture ||
    r.recruiterProfile?.companyLogo ||
    null,
  availableImages: admin
    ? [
        ...(r.profilePicture ? [r.profilePicture] : []),
        ...(r.recruiterProfile?.companyLogo ? [r.recruiterProfile.companyLogo] : []),
      ].filter(Boolean)
    : undefined,
  order:              r.recruiterProfile?.featuredOrder      ?? 0,
  isFeatured:         r.recruiterProfile?.isFeatured         ?? false,
  verificationStatus: r.recruiterProfile?.verificationStatus || "none",
  jobCount,
});

// ── Public — homepage ─────────────────────────────────────────────────────────
exports.getTopRecruiters = async (req, res) => {
  try {
    const recruiters = await User.find({
      role: "recruiter",
      "recruiterProfile.isFeatured": true,
    })
      .select("name profilePicture recruiterProfile")
      .sort({ "recruiterProfile.featuredOrder": 1, createdAt: 1 });

    // attach live job counts
    const ids = recruiters.map(r => r._id);
    const counts = await Job.aggregate([
      { $match: { recruiter: { $in: ids }, status: "approved" } },
      { $group: { _id: "$recruiter", count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map(c => [c._id.toString(), c.count]));

    res.json({
      success: true,
      recruiters: recruiters.map(r => toResult(r, countMap[r._id.toString()] || 0)),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch recruiters" });
  }
};

// ── Admin — all verified recruiters ──────────────────────────────────────────
exports.getAllTopRecruiters = async (req, res) => {
  try {
    const recruiters = await User.find({
      role: "recruiter",
    })
      .select("name profilePicture recruiterProfile")
      .sort({ "recruiterProfile.featuredOrder": 1, createdAt: -1 });

    const ids = recruiters.map(r => r._id);
    const counts = await Job.aggregate([
      { $match: { recruiter: { $in: ids }, status: "approved" } },
      { $group: { _id: "$recruiter", count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map(c => [c._id.toString(), c.count]));

    res.json({
      success: true,
      recruiters: recruiters.map(r => toResult(r, countMap[r._id.toString()] || 0, true)),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch recruiters" });
  }
};

// ── Admin — update single recruiter ──────────────────────────────────────────
exports.updateTopRecruiter = async (req, res) => {
  try {
    const { isFeatured, order, featuredLogoUrl } = req.body;
    const user = await User.findOne({ _id: req.params.id, role: "recruiter" });
    if (!user) return res.status(404).json({ success: false, message: "Recruiter not found" });

    if (isFeatured !== undefined)
      user.recruiterProfile.isFeatured = isFeatured === "true" || isFeatured === true;
    if (order !== undefined)
      user.recruiterProfile.featuredOrder = parseInt(order, 10);

    if (featuredLogoUrl !== undefined) {
      const allowed = [
        user.profilePicture,
        user.recruiterProfile?.companyLogo,
      ].filter(Boolean);
      if (featuredLogoUrl === "" || allowed.includes(featuredLogoUrl)) {
        user.recruiterProfile.featuredLogoUrl = featuredLogoUrl;
      } else {
        return res.status(400).json({ success: false, message: "Invalid image URL" });
      }
    }

    await user.save();
    res.json({ success: true, message: "Updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to update" });
  }
};

// ── Admin — batch update ──────────────────────────────────────────────────────
exports.batchUpdateTopRecruiters = async (req, res) => {
  try {
    const { updates } = req.body;
    if (!Array.isArray(updates) || updates.length === 0)
      return res.status(400).json({ success: false, message: "updates array required" });

    const ops = updates.map(({ id, isFeatured, order, featuredLogoUrl }) => ({
      updateOne: {
        filter: { _id: id, role: "recruiter" },
        update: {
          $set: {
            ...(isFeatured      !== undefined && { "recruiterProfile.isFeatured":     isFeatured }),
            ...(order           !== undefined && { "recruiterProfile.featuredOrder":  parseInt(order, 10) }),
            ...(featuredLogoUrl !== undefined && { "recruiterProfile.featuredLogoUrl": featuredLogoUrl }),
          },
        },
      },
    }));

    await User.bulkWrite(ops);
    res.json({ success: true, message: `${updates.length} recruiters updated` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Batch update failed" });
  }
};