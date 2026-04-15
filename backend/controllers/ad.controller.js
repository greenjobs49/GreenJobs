const Ad  = require("../models/Ad");
const Job = require("../models/Job");
const User = require("../models/User");
const email = require("../services/emailService");

/* =========================================================
   PUBLIC — GET ACTIVE ADS
   GET /api/ads
========================================================= */
exports.getPublicAds = async (req, res) => {
  try {
    const { type } = req.query; // ?type=spotlight | full_banner | (all if omitted)
    const filter = { isActive: true };
    if (type) filter.bannerType = type;

    const ads = await Ad.find(filter).sort({ order: 1, createdAt: -1 });
    res.json({ success: true, ads });
  } catch (err) {
    console.error("GET PUBLIC ADS ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to fetch ads" });
  }
};

/* =========================================================
   ADMIN — GET ALL ADS
   GET /api/ads/admin
========================================================= */
exports.getAllAds = async (req, res) => {
  try {
    const ads = await Ad.find({})
      .populate("createdBy", "name email")
      .sort({ order: 1, createdAt: -1 });
    res.json({ success: true, ads });
  } catch (err) {
    console.error("GET ALL ADS ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to fetch ads" });
  }
};

/* =========================================================
   ADMIN — CREATE AD
   POST /api/ads/admin
========================================================= */
exports.createAd = async (req, res) => {
  try {
    const {
      title, subtitle, tag, ctaText, ctaUrl,
      imageUrl, accentColor, bannerType,
      bannerHeadline, bannerDescription, order, isActive,
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    // S3 upload takes priority; fall back to manual URL from body
    const resolvedImageUrl = req.file?.location ?? imageUrl?.trim() ?? "";

    const ad = await Ad.create({
      title:             title.trim(),
      subtitle:          subtitle?.trim(),
      tag:               tag?.trim(),
      ctaText:           ctaText?.trim()     || "Learn More",
      ctaUrl:            ctaUrl?.trim()      || "/jobs",
      imageUrl:          resolvedImageUrl,
      accentColor:       accentColor         || "#10b981",
      bannerType:        bannerType          || "spotlight",
      bannerHeadline:    bannerHeadline?.trim(),
      bannerDescription: bannerDescription?.trim(),
      order:             order ?? 0,
      isActive:          isActive !== false,
      createdBy:         req.user.id,
    });

    res.status(201).json({ success: true, message: "Ad created successfully", ad });
  } catch (err) {
    console.error("CREATE AD ERROR:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(err.errors).map(e => e.message).join(", "),
      });
    }
    res.status(500).json({ success: false, message: "Failed to create ad" });
  }
};

/* =========================================================
   ADMIN — UPDATE AD
   PATCH /api/ads/admin/:id
========================================================= */
exports.updateAd = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.status(404).json({ success: false, message: "Ad not found" });

    // If a new file was uploaded, overwrite imageUrl (old S3 key is left to age out
    // or you can delete it explicitly — see optional block below)
    if (req.file?.location) {
      // Optional: delete old image from S3
      if (ad.imageUrl) {
        const oldKey = ad.imageUrl.split(".amazonaws.com/")[1];
        if (oldKey) {
          const s3 = require("../config/s3");
          s3.deleteObject(
            { Bucket: process.env.AWS_S3_BUCKET_NAME, Key: oldKey },
            (err) => { if (err) console.warn("S3 delete old ad image failed:", err); }
          );
        }
      }
      ad.imageUrl = req.file.location;
    }

    const fields = [
      "title", "subtitle", "tag", "ctaText", "ctaUrl",
      "accentColor", "bannerType", "bannerHeadline", "bannerDescription",
      "order", "isActive",
    ];
    // imageUrl handled above via file upload; still allow manual URL if no file
    if (!req.file && req.body.imageUrl !== undefined) {
      ad.imageUrl = req.body.imageUrl;
    }

    fields.forEach(f => {
      if (req.body[f] !== undefined) ad[f] = req.body[f];
    });

    await ad.save();
    res.json({ success: true, message: "Ad updated", ad });
  } catch (err) {
    console.error("UPDATE AD ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to update ad" });
  }
};

/* =========================================================
   ADMIN — DELETE AD
   DELETE /api/ads/admin/:id
========================================================= */
exports.deleteAd = async (req, res) => {
  try {
    const ad = await Ad.findByIdAndDelete(req.params.id);
    if (!ad) return res.status(404).json({ success: false, message: "Ad not found" });

    // Delete image from S3 if it was an uploaded file
    if (ad.imageUrl?.includes(".amazonaws.com/")) {
      const oldKey = ad.imageUrl.split(".amazonaws.com/")[1];
      if (oldKey) {
        const s3 = require("../config/s3");
        s3.deleteObject(
          { Bucket: process.env.AWS_S3_BUCKET_NAME, Key: oldKey },
          (err) => { if (err) console.warn("S3 delete on ad delete failed:", err); }
        );
      }
    }

    res.json({ success: true, message: `Ad "${ad.title}" deleted` });
  } catch (err) {
    console.error("DELETE AD ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to delete ad" });
  }
};

/* =========================================================
   ADMIN — TOGGLE AD ACTIVE STATUS
   PATCH /api/ads/admin/:id/toggle
========================================================= */
exports.toggleAd = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.status(404).json({ success: false, message: "Ad not found" });

    ad.isActive = !ad.isActive;
    await ad.save();
    res.json({
      success: true,
      message: ad.isActive ? "Ad activated" : "Ad deactivated",
      ad,
    });
  } catch (err) {
    console.error("TOGGLE AD ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to toggle ad" });
  }
};

/* =========================================================
   ADMIN — REORDER ADS
   PATCH /api/ads/admin/reorder
   Body: { orders: [{ id, order }, ...] }
========================================================= */
exports.reorderAds = async (req, res) => {
  try {
    const { orders } = req.body;
    if (!Array.isArray(orders)) {
      return res.status(400).json({ success: false, message: "orders array required" });
    }
    await Promise.all(
      orders.map(({ id, order }) => Ad.findByIdAndUpdate(id, { order }))
    );
    res.json({ success: true, message: "Ad order updated" });
  } catch (err) {
    console.error("REORDER ADS ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to reorder ads" });
  }
};

/* =========================================================
   ADMIN — REVOKE A LIVE JOB (fraud / non-applicable)
   PATCH /api/admin/jobs/:id/revoke
========================================================= */
exports.adminRevokeJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = "Flagged by admin for review", revokeType = "fraud" } = req.body;

    const job = await Job.findById(id)
      .populate("recruiter", "name email recruiterProfile")
      .populate("business",  "name email businessProfile");

    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    if (job.status === "revoked") {
      return res.status(400).json({ success: false, message: "Job is already revoked" });
    }

    const prevStatus = job.status;
    job.status          = "revoked";
    job.revokedAt       = new Date();
    job.revokeReason    = reason;
    job.revokeType      = revokeType;  // "fraud" | "non_applicable" | "policy_violation" | "other"
    job.revokedByAdmin  = true;
    await job.save();

    // ── Notify recruiter ───────────────────────────────────
    if (job.recruiter?.email) {
      email.sendJobRevokedByAdminEmail(
        job.recruiter.email,
        job.recruiter.name,
        job.title,
        job.recruiter.recruiterProfile?.companyName || "Your Company",
        reason,
        revokeType
      ).catch(console.error);
    }

    // ── Notify business owner if linked ────────────────────
    if (job.business?.email) {
      email.sendJobRevokedBusinessNotification(
        job.business.email,
        job.business.businessProfile?.businessName || job.business.name,
        job.title,
        job.recruiter?.name || "Associated recruiter",
        reason,
        revokeType
      ).catch(console.error);
    }

    // ── Notify all admins ──────────────────────────────────
    const adminUsers = await User.find({ role: "admin", _id: { $ne: req.user.id } }).select("email name");
    adminUsers.forEach(admin => {
      email.sendAdminJobRevokeAlert(
        admin.email,
        job.title,
        job.recruiter?.name || "Unknown",
        job.recruiter?.email || "—",
        reason,
        revokeType
      ).catch(console.error);
    });

    res.json({
      success: true,
      message: `Job "${job.title}" revoked. Notifications sent.`,
      job: { _id: job._id, title: job.title, status: job.status, revokeType, revokeReason: reason },
    });
  } catch (err) {
    console.error("ADMIN REVOKE JOB ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to revoke job" });
  }
};

/* =========================================================
   ADMIN — RESTORE A REVOKED JOB
   PATCH /api/admin/jobs/:id/restore
========================================================= */
exports.adminRestoreJob = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findById(id)
      .populate("recruiter", "name email recruiterProfile")
      .populate("business",  "name email businessProfile");

    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    if (job.status !== "revoked") {
      return res.status(400).json({ success: false, message: "Job is not revoked" });
    }

    // Restore to approved if it was live, else pending
    job.status         = "approved";
    job.approvedAt     = new Date();
    job.revokedAt      = null;
    job.revokeReason   = "";
    job.revokeType     = "";
    job.revokedByAdmin = false;
    await job.save();

    if (job.recruiter?.email) {
      email.sendJobRestoredEmail(
        job.recruiter.email,
        job.recruiter.name,
        job.title,
        job.recruiter.recruiterProfile?.companyName || "Your Company"
      ).catch(console.error);
    }

    res.json({
      success: true,
      message: `Job "${job.title}" restored to live.`,
      job: { _id: job._id, title: job.title, status: job.status },
    });
  } catch (err) {
    console.error("ADMIN RESTORE JOB ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to restore job" });
  }
};