const User = require("../models/User");
const Job  = require("../models/Job");
const RecruiterBusinessLink = require("../models/RecruiterBusinessLink");
const NavbarBanner = require("../models/NavbarBanner");
const email = require("../services/emailService");

/* =========================================================
   ADMIN STATS
========================================================= */
exports.getStats = async (req, res) => {
  try {
    const [
      totalUsers, jobseekers, recruiters, businesses, admins,
      approvedBusinesses, pendingBusinesses, rejectedBusinesses,
      liveJobs, pendingJobs, rejectedJobs, profilesCompleted,
      pendingRecruiterVerifications,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: "jobseeker" }),
      User.countDocuments({ role: "recruiter" }),
      User.countDocuments({ role: "business" }),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "business", "businessProfile.status": "approved" }),
      User.countDocuments({ role: "business", "businessProfile.status": "pending" }),
      User.countDocuments({ role: "business", "businessProfile.status": "rejected" }),
      Job.countDocuments({ status: "approved" }),
      Job.countDocuments({ status: "pending_business" }),
      Job.countDocuments({ status: "rejected_business" }),
      User.countDocuments({ profileCompleted: true }),
      User.countDocuments({ role: "recruiter", "recruiterProfile.verificationStatus": "pending" }),
    ]);

    res.json({
      success: true,
      totalUsers, jobseekers, recruiters, businesses, admins,
      approvedBusinesses, pendingBusinesses, rejectedBusinesses,
      liveJobs, pendingJobs, rejectedJobs, profilesCompleted,
      pendingRecruiters: pendingRecruiterVerifications,
    });
  } catch (err) {
    console.error("GET STATS ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
};

/* =========================================================
   GET ALL USERS
========================================================= */
exports.getUsers = async (req, res) => {
  try {
    const { role: roleFilter, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (roleFilter && ["jobseeker", "recruiter", "business", "admin"].includes(roleFilter)) {
      query.role = roleFilter;
    }
    if (search) {
      query.$or = [
        { name:  { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(query).select("-password").sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      users,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error("GET USERS ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

/* =========================================================
   GET USER BY ID
========================================================= */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (err) {
    console.error("GET USER ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to fetch user" });
  }
};

/* =========================================================
   DELETE USER
========================================================= */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.role === "admin") {
      return res.status(403).json({ success: false, message: "Cannot delete admin accounts" });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: `User "${user.name}" deleted successfully` });
  } catch (err) {
    console.error("DELETE USER ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to delete user" });
  }
};

/* =========================================================
   GET ALL JOBS
========================================================= */
exports.getJobs = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title:    { $regex: search, $options: "i" } },
        { company:  { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate("recruiter",    "name email")
        .populate("business",     "name businessProfile")
        .populate("businessOwner","name email businessProfile")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Job.countDocuments(query),
    ]);

    res.json({
      success: true,
      jobs,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error("GET JOBS ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to fetch jobs" });
  }
};

/* =========================================================
   UPDATE JOB STATUS
========================================================= */
exports.updateJobStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["approved", "rejected_business", "pending_business"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });

    if (job.status === "revoked" && status === "approved") {
      job.status    = "pending_business";
      job.approvedAt = null;
    } else {
      job.status = status;
      if (status === "approved") job.approvedAt = new Date();
    }

    await job.save();
    res.json({ success: true, message: `Job status updated to "${job.status}"`, job });
  } catch (err) {
    console.error("UPDATE JOB STATUS ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to update job status" });
  }
};

/* =========================================================
   DELETE JOB
========================================================= */
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    res.json({ success: true, message: `Job "${job.title}" deleted` });
  } catch (err) {
    console.error("DELETE JOB ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to delete job" });
  }
};

/* =========================================================
   APPROVE BUSINESS
========================================================= */
exports.approveBusiness = async (req, res) => {
  try {
    const { id } = req.params;

    const businessBefore = await User.findOne({ _id: id, role: "business" });
    if (!businessBefore) return res.status(404).json({ success: false, message: "Business not found" });

    const wasRevoked = await RecruiterBusinessLink.exists({
      business: id,
      status: "removed_by_business",
    });

    const business = await User.findOneAndUpdate(
      { _id: id, role: "business" },
      { "businessProfile.status": "approved", "businessProfile.verified": true },
      { new: true }
    );

    const linkedRecruiters = await User.find({
      role: "recruiter",
      "recruiterProfile.linkedBusiness": id,
    }).select("_id name");

    const recruiterIds = linkedRecruiters.map(r => r._id);
    let jobsRestored = 0;

    if (recruiterIds.length > 0) {
      const jobResult = await Job.updateMany(
        { recruiter: { $in: recruiterIds }, status: "revoked" },
        { $set: { status: "pending_business" } }
      );
      jobsRestored = jobResult.modifiedCount;
    }

    const businessName = businessBefore.businessProfile?.businessName || businessBefore.name;

    if (wasRevoked) {
      await email.sendBusinessReApprovedEmail(
        businessBefore.email, businessBefore.name, businessName, jobsRestored
      ).catch(err => console.error("❌ Re-approval email failed:", err));
    } else {
      await email.sendBusinessApprovedEmail(
        businessBefore.email, businessBefore.name, businessName
      ).catch(err => console.error("❌ Approval email failed:", err));
    }

    res.json({
      success: true,
      message: `"${businessName}" approved. ${jobsRestored} revoked job(s) restored.`,
      business,
      jobsRestored,
    });
  } catch (err) {
    console.error("APPROVE BUSINESS ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to approve business" });
  }
};

/* =========================================================
   GET ALL BUSINESSES
========================================================= */
exports.getBusinesses = async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = { role: "business" };

    if (status) query["businessProfile.status"] = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { "businessProfile.businessName": { $regex: search, $options: "i" } },
      ];
    }

    const businesses = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(500);

    res.json({ success: true, businesses });
  } catch (err) {
    console.error("GET BUSINESSES ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to fetch businesses" });
  }
};

/* =========================================================
   REJECT BUSINESS
========================================================= */
exports.rejectBusiness = async (req, res) => {
  try {
    const { reason } = req.body;

    const business = await User.findOneAndUpdate(
      { _id: req.params.id, role: "business" },
      { "businessProfile.status": "rejected", "businessProfile.verified": false },
      { new: true }
    ).select("-password");

    if (!business) return res.status(404).json({ success: false, message: "Business not found" });

    const businessName = business.businessProfile?.businessName || business.name;

    email.sendBusinessRejectedEmail(business.email, business.name, businessName, reason).catch(console.error);

    res.json({ success: true, message: `"${businessName}" rejected.`, business });
  } catch (err) {
    console.error("REJECT BUSINESS ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to reject business" });
  }
};

/* =========================================================
   REVOKE BUSINESS
========================================================= */
exports.revokeBusiness = async (req, res) => {
  try {
    const { id } = req.params;

    const business = await User.findOneAndUpdate(
      { _id: id, role: "business" },
      { "businessProfile.status": "pending", "businessProfile.verified": false },
      { new: true }
    ).select("-password");

    if (!business) return res.status(404).json({ success: false, message: "Business not found" });

    const businessName = business.businessProfile?.businessName || business.name;

    const linkedRecruiters = await User.find({
      role: "recruiter",
      "recruiterProfile.linkedBusiness": id,
    }).select("_id name email");

    const recruiterIds = linkedRecruiters.map(r => r._id);
    let jobsRevoked = 0;

    if (recruiterIds.length > 0) {
      const jobResult = await Job.updateMany(
        { recruiter: { $in: recruiterIds }, status: { $in: ["approved", "pending_business"] } },
        { $set: { status: "revoked" } }
      );
      jobsRevoked = jobResult.modifiedCount;

      await User.updateMany(
        { _id: { $in: recruiterIds } },
        { $unset: { "recruiterProfile.linkedBusiness": "" } }
      );

      await RecruiterBusinessLink.updateMany(
        { recruiter: { $in: recruiterIds }, business: id, status: "approved" },
        { $set: { status: "removed_by_business", removedAt: new Date() } }
      );

      linkedRecruiters.forEach(recruiter => {
        email.sendRecruiterJobsRevokedEmail(
          recruiter.email, recruiter.name, businessName, jobsRevoked
        ).catch(console.error);
      });
    }

    email.sendBusinessRevokedEmail(business.email, business.name, businessName).catch(console.error);

    res.json({
      success: true,
      message: `"${businessName}" revoked. ${recruiterIds.length} recruiter(s) unlinked, ${jobsRevoked} job(s) revoked.`,
      business,
      jobsRevoked,
      recruitersUnlinked: recruiterIds.length,
    });
  } catch (err) {
    console.error("REVOKE BUSINESS ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to revoke business" });
  }
};

/* =========================================================
   GET PENDING RECRUITER VERIFICATIONS
========================================================= */
exports.getPendingVerificationRecruiters = async (req, res) => {
  try {
    const recruiters = await User.find({
      role: "recruiter",
      "recruiterProfile.verificationStatus": "pending",
    })
      .select("-password")
      .sort({ "recruiterProfile.verificationRequestedAt": 1 });

    res.json(recruiters);
  } catch (err) {
    console.error("GET PENDING VERIFICATIONS ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to fetch pending verifications" });
  }
};

/* =========================================================
   VERIFY RECRUITER
   PATCH /api/admin/recruiters/:id/verify
========================================================= */
exports.verifyRecruiter = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be "approved" or "rejected"' });
    }

    const recruiter = await User.findOne({ _id: id, role: "recruiter" });
    if (!recruiter) {
      return res.status(404).json({ success: false, message: "Recruiter not found" });
    }

    const updateFields = {
      "recruiterProfile.verificationStatus":     status,
      "recruiterProfile.verificationReviewedAt": new Date(),
    };

    if (status === "rejected") {
      updateFields["recruiterProfile.rejectionReason"] = reason || "No reason provided";
    } else {
      updateFields["recruiterProfile.rejectionReason"] = "";
    }

    await User.findByIdAndUpdate(id, { $set: updateFields });

    const companyName = recruiter.recruiterProfile?.companyName;

    if (status === "approved") {
      email.sendRecruiterVerifiedEmail(
        recruiter.email, recruiter.name, companyName
      ).catch(console.error);
      console.log(`✅ Recruiter ${recruiter.name} (${recruiter.email}) verified by admin`);
    } else {
      email.sendRecruiterVerificationRejectedEmail(
        recruiter.email, recruiter.name, companyName, reason
      ).catch(console.error);
      console.log(`❌ Recruiter ${recruiter.name} verification rejected by admin`);
    }

    res.json({
      success: true,
      message: status === "approved"
        ? `${recruiter.name} verified — they can now post jobs.`
        : `${recruiter.name}'s verification rejected.`,
      recruiterId: id,
      status,
    });
  } catch (err) {
    console.error("VERIFY RECRUITER ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to update verification status" });
  }
};

/* =========================================================
   CREATE ADMIN
   POST /api/admin/create-admin
========================================================= */
exports.createAdmin = async (req, res) => {
  try {
    const { name, email: adminEmail, phone } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }
    if (!adminEmail || !adminEmail.trim()) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const normalised = adminEmail.toLowerCase().trim();

    const existing = await User.findOne({ email: normalised });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `An account with the email "${normalised}" already exists (role: ${existing.role})`,
      });
    }

    const crypto = require("crypto");
    const placeholderPassword = crypto.randomBytes(32).toString("hex");

    const newAdmin = await User.create({
      name:             name.trim(),
      email:            normalised,
      mobile:           phone?.trim() || "",
      password:         placeholderPassword,
      role:             "admin",
      isVerified:       true,
      profileCompleted: true,
      profileProgress:  100,
      status:           "active",
      adminProfile: {
        permissions: ["read", "write", "delete", "approve"],
      },
    });

    email.sendAdminWelcomeEmail?.(normalised, name.trim())
      .catch(err => console.warn("Admin welcome email failed (non-fatal):", err.message));

    console.log(`🛡️  New admin created: ${name.trim()} <${normalised}> by admin ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: `Admin account created for ${normalised}. They can sign in immediately via OTP.`,
      admin: {
        id:    newAdmin._id,
        name:  newAdmin.name,
        email: newAdmin.email,
        role:  newAdmin.role,
      },
    });
  } catch (err) {
    console.error("CREATE ADMIN ERROR:", err);
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map(e => e.message).join(", ");
      return res.status(400).json({ success: false, message: messages });
    }
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "An account with this email already exists" });
    }
    res.status(500).json({ success: false, message: "Failed to create admin account" });
  }
};

/* =========================================================
   ADMIN REVOKE JOB
   PATCH /api/admin/jobs/:id/revoke
========================================================= */
exports.revokeJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, revokeType } = req.body;

    // ── Populate ALL possible poster fields up front ────────────────────
    const job = await Job.findById(id)
      .populate("recruiter",     "name email")
      .populate("business",      "name email businessProfile")
      .populate("businessOwner", "name email businessProfile");

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }
    if (job.status === "revoked") {
      return res.status(400).json({ success: false, message: "Job is already revoked" });
    }

    const safeReason = (reason || "").trim() || "Policy violation";
    const safeType   = ["fraud", "non_applicable", "policy_violation", "other"].includes(revokeType)
      ? revokeType
      : "other";

    // Resolve poster BEFORE save (populated refs available here)
    let posterName  = "Unknown";
    let posterEmail = "Unknown";

    if (job.postedByBusiness && job.businessOwner) {
      posterName  = job.businessOwner.name  || "Unknown";
      posterEmail = job.businessOwner.email || "Unknown";
    } else if (job.recruiter) {
      posterName  = job.recruiter.name  || "Unknown";
      posterEmail = job.recruiter.email || "Unknown";
    }

    // ── Persist revoke fields ───────────────────────────────────────────
    job.previousStatus = job.status;
    job.status         = "revoked";
    job.revokedByAdmin = true;
    job.revokeReason   = safeReason;
    job.revokeType     = safeType;
    job.revokedAt      = new Date();
    await job.save();

    const jobTitle    = job.title;
    const companyName = job.company || "Unknown Company";

    // ── Email the poster ────────────────────────────────────────────────
    if (job.postedByBusiness && job.businessOwner) {
      // Direct business-owner post — email the owner only
      email.sendJobRevokedByAdminEmail(
        job.businessOwner.email,
        job.businessOwner.name,
        jobTitle,
        companyName,
        safeReason,
        safeType
      ).catch(err => console.error("❌ Revoke email to business owner failed:", err.message));

    } else if (job.recruiter) {
      // Recruiter post — email the recruiter
      email.sendJobRevokedByAdminEmail(
        job.recruiter.email,
        job.recruiter.name,
        jobTitle,
        companyName,
        safeReason,
        safeType
      ).catch(err => console.error("❌ Revoke email to recruiter failed:", err.message));

      // Also notify the linked business owner if present
      if (job.business) {
        const bizOwner = job.business; // already populated
        email.sendJobRevokedBusinessNotification(
          bizOwner.email,
          bizOwner.businessProfile?.businessName || bizOwner.name,
          jobTitle,
          job.recruiter.name,
          safeReason,
          safeType
        ).catch(err => console.error("❌ Revoke notify to linked business failed:", err.message));
      }
    }

    // ── Audit trail email to all admins ────────────────────────────────
    const adminUsers = await User.find({ role: "admin" }).select("email");
    adminUsers.forEach(admin => {
      email.sendAdminJobRevokeAlert(
        admin.email,
        jobTitle,
        posterName,
        posterEmail,
        safeReason,
        safeType
      ).catch(err => console.error("❌ Admin revoke audit email failed:", err.message));
    });

    res.json({
      success: true,
      message: `"${jobTitle}" revoked. Notification emails sent.`,
      job,
    });
  } catch (err) {
    console.error("REVOKE JOB ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to revoke job" });
  }
};

/* =========================================================
   ADMIN RESTORE JOB
   PATCH /api/admin/jobs/:id/restore
========================================================= */
exports.restoreJob = async (req, res) => {
  try {
    const { id } = req.params;

    // ── Populate ALL possible poster fields up front ────────────────────
    const job = await Job.findById(id)
      .populate("recruiter",     "name email")
      .populate("businessOwner", "name email");

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }
    if (job.status !== "revoked") {
      return res.status(400).json({ success: false, message: "Only revoked jobs can be restored" });
    }

    const jobTitle    = job.title;
    const companyName = job.company || "Unknown Company";

    // ── Restore ─────────────────────────────────────────────────────────
    job.status         = "approved";
    job.revokedByAdmin = false;
    job.revokeReason   = "";
    job.revokeType     = "";
    job.revokedAt      = null;
    job.previousStatus = "";
    job.approvedAt     = new Date();
    await job.save();

    // ── Email the original poster ───────────────────────────────────────
    if (job.postedByBusiness && job.businessOwner) {
      email.sendJobRestoredEmail(
        job.businessOwner.email,
        job.businessOwner.name,
        jobTitle,
        companyName
      ).catch(err => console.error("❌ Restore email to business owner failed:", err.message));

    } else if (job.recruiter) {
      email.sendJobRestoredEmail(
        job.recruiter.email,
        job.recruiter.name,
        jobTitle,
        companyName
      ).catch(err => console.error("❌ Restore email to recruiter failed:", err.message));
    }

    res.json({
      success: true,
      message: `"${jobTitle}" restored to live. Notification email sent.`,
      job,
    });
  } catch (err) {
    console.error("RESTORE JOB ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to restore job" });
  }
};

/* =========================================================
   NAVBAR BANNER MANAGEMENT
========================================================= */

/* GET NAVBAR BANNER */
exports.getNavbarBanner = async (req, res) => {
  try {
    const banner = await NavbarBanner.findOne({ isActive: true });
    
    if (!banner) {
      return res.status(404).json({ 
        success: false, 
        message: "No active banner found",
        banner: null 
      });
    }

    res.json({
      success: true,
      banner: {
        _id: banner._id,
        imageUrl: banner.imageUrl,
        altText: banner.altText,
        height: banner.height,
        borderRadius: banner.borderRadius,
        isActive: banner.isActive,
        updatedAt: banner.updatedAt,
      }
    });
  } catch (err) {
    console.error("GET NAVBAR BANNER ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to fetch banner" });
  }
};

/* UPDATE NAVBAR BANNER (Admin only) */
exports.updateNavbarBanner = async (req, res) => {
  try {
    const { imageUrl, altText, height, borderRadius, isActive } = req.body;

    if (!imageUrl || !imageUrl.trim()) {
      return res.status(400).json({ success: false, message: "Image URL is required" });
    }

    // Find existing banner and update it
    let banner = await NavbarBanner.findOne();

    if (banner) {
      // Update existing
      banner.imageUrl = imageUrl.trim();
      banner.altText = altText?.trim() || "Navbar Banner";
      banner.height = height?.trim() || "75px";
      banner.borderRadius = borderRadius?.trim() || "8px";
      banner.isActive = isActive !== undefined ? isActive : true;
      banner.updatedBy = req.user.id;
      await banner.save();
    } else {
      // Create new if doesn't exist
      banner = await NavbarBanner.create({
        imageUrl: imageUrl.trim(),
        altText: altText?.trim() || "Navbar Banner",
        height: height?.trim() || "75px",
        borderRadius: borderRadius?.trim() || "8px",
        isActive: isActive !== undefined ? isActive : true,
        updatedBy: req.user.id,
      });
    }

    console.log(`✅ Navbar banner updated by admin ${req.user.id}`);

    res.json({
      success: true,
      message: "Navbar banner updated successfully",
      banner: {
        _id: banner._id,
        imageUrl: banner.imageUrl,
        altText: banner.altText,
        height: banner.height,
        borderRadius: banner.borderRadius,
        isActive: banner.isActive,
        updatedAt: banner.updatedAt,
      }
    });
  } catch (err) {
    console.error("UPDATE NAVBAR BANNER ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to update banner" });
  }
};
exports.uploadNavbarBannerImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file uploaded" });
    }
 
    // Delete the old banner image from S3 if it exists and is an S3 URL
    const existing = await NavbarBanner.findOne();
    if (existing?.imageUrl) {
      try {
        const url = new URL(existing.imageUrl);
        // Only delete if it's actually an S3 object (not a local/default path)
        if (url.hostname.includes("amazonaws.com") || url.hostname.includes("s3.")) {
          const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
          const s3 = require("../config/s3");
          const key = decodeURIComponent(url.pathname.substring(1));
          await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: key }));
          console.log(`🗑️  Old banner deleted from S3: ${key}`);
        }
      } catch (e) {
        console.warn("Could not delete old banner from S3 (non-fatal):", e.message);
      }
    }
 
    const imageUrl = req.file.location; // S3 URL from multer-s3
 
    res.json({
      success: true,
      message: "Banner image uploaded successfully",
      imageUrl,
    });
  } catch (err) {
    console.error("UPLOAD BANNER IMAGE ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to upload banner image" });
  }
};

/* TOGGLE BANNER ACTIVE STATUS */
exports.toggleBannerStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    let banner = await NavbarBanner.findOne();

    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }

    banner.isActive = isActive !== undefined ? isActive : !banner.isActive;
    banner.updatedBy = req.user.id;
    await banner.save();

    res.json({
      success: true,
      message: `Banner ${banner.isActive ? "activated" : "deactivated"}`,
      banner: {
        _id: banner._id,
        isActive: banner.isActive,
        imageUrl: banner.imageUrl,
      }
    });
  } catch (err) {
    console.error("TOGGLE BANNER STATUS ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to toggle banner status" });
  }
};