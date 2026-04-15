const Job  = require("../models/Job");
const User = require("../models/User");
const email = require("../services/emailService");
const { notifyMatchingJobseekers } = require("../services/emailService");

/* ===============================
   RECRUITER POSTS JOB
   Verified recruiter → job goes live immediately
   Non-verified recruiter with linkedBusiness → pending_business (legacy)
=============================== */
const createJob = async (req, res) => {
  try {
    console.log("🔥 CREATE JOB - Recruiter:", req.user.id);

    const recruiter = await User.findById(req.user.id).select("name email recruiterProfile");

    const verificationStatus = recruiter.recruiterProfile?.verificationStatus;
    if (verificationStatus !== "approved") {
      return res.status(403).json({
        success: false,
        message:
          verificationStatus === "pending"
            ? "Your profile is awaiting admin verification. You'll be able to post jobs once approved."
            : "Your profile must be verified by admin before you can post jobs. Go to Dashboard → Request Verification.",
        code: "NOT_VERIFIED",
      });
    }

    const { title, location, type, description, skills, isPaid, stipend, stipendPeriod, rounds } = req.body;
    if (!title || !location || !description) {
      return res.status(400).json({
        success: false,
        message: "Title, location and description are required",
        code: "MISSING_FIELDS",
      });
    }

    const skillsArray = Array.isArray(skills)
      ? skills.filter((s) => typeof s === "string" && s.trim())
      : typeof skills === "string"
      ? skills.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const roundsArray = Array.isArray(rounds)
      ? rounds.map((r, i) => ({
          order: r.order || i + 1, type: r.type || "other",
          title: r.title || "", description: r.description || "", duration: r.duration || "",
        }))
      : [];

    const companyName = recruiter.recruiterProfile?.companyName || "Unknown Company";

    const job = await Job.create({
      title:         title.trim(),
      company:       companyName,
      location:      location.trim(),
      type:          type || "Full Time",
      description:   description.trim(),
      skills:        skillsArray,
      isPaid:        isPaid !== false,
      stipend:       isPaid !== false ? (stipend || "").trim() : "",
      stipendPeriod: isPaid !== false ? (stipendPeriod || "monthly") : "",
      rounds:        roundsArray,
      recruiter:     req.user.id,
      status:        "approved",
      isOpen:        true,
      approvedAt:    new Date(),
    });

    console.log("✅ Job created & live:", job._id, "Company:", companyName);

    const adminUsers = await User.find({ role: "admin" }).select("email");
    adminUsers.forEach((admin) => {
      email.sendJobPostedDirectlyEmail(
        admin.email, job.title, recruiter.name, recruiter.email, companyName, job.location, job.type
      ).catch(console.error);
    });

    res.status(201).json({
      success: true,
      message: "Job posted and live immediately! 🎉",
      job: { _id: job._id, title: job.title, company: companyName, status: job.status, isOpen: job.isOpen },
    });

    // Notify matching jobseekers (non-blocking, after response is sent)
    notifyMatchingJobseekers(job).catch(console.error);

  } catch (err) {
    console.error("❌ CREATE JOB ERROR:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(err.errors).map((e) => e.message).join(", "),
        code: "VALIDATION_ERROR",
      });
    }
    res.status(500).json({ success: false, message: err.message || "Failed to create job", code: "SERVER_ERROR" });
  }
};

/* ===============================
   BUSINESS OWNER — POST JOB
   Approved business → job goes live immediately, no approval needed
=============================== */
const createBusinessJob = async (req, res) => {
  try {
    console.log("CREATE BUSINESS JOB - Owner:", req.user.id);

    const owner = await User.findById(req.user.id).select("name email businessProfile");
    if (!owner) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const bizStatus = owner.businessProfile?.status;
    if (bizStatus !== "approved") {
      return res.status(403).json({
        success: false,
        message:
          bizStatus === "pending"
            ? "Your business is awaiting admin approval. You can post jobs once approved."
            : "Your business must be approved by admin before you can post jobs.",
        code: "BUSINESS_NOT_APPROVED",
      });
    }

    const { title, location, type, description, skills, isPaid, stipend, stipendPeriod, rounds } = req.body;
    if (!title || !location || !description) {
      return res.status(400).json({
        success: false,
        message: "Title, location and description are required",
        code: "MISSING_FIELDS",
      });
    }

    const skillsArray = Array.isArray(skills)
      ? skills.filter((s) => typeof s === "string" && s.trim())
      : typeof skills === "string"
      ? skills.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const roundsArray = Array.isArray(rounds)
      ? rounds.map((r, i) => ({
          order: r.order || i + 1, type: r.type || "other",
          title: r.title || "", description: r.description || "", duration: r.duration || "",
        }))
      : [];

    const companyName = owner.businessProfile?.businessName || "Unknown Business";

    const job = await Job.create({
      title:            title.trim(),
      company:          companyName,
      location:         location.trim(),
      type:             type || "Full Time",
      description:      description.trim(),
      skills:           skillsArray,
      isPaid:           isPaid !== false,
      stipend:          isPaid !== false ? (stipend || "").trim() : "",
      stipendPeriod:    isPaid !== false ? (stipendPeriod || "monthly") : "",
      rounds:           roundsArray,
      postedByBusiness: true,
      businessOwner:    req.user.id,
      business:         req.user.id,
      status:           "approved",
      isOpen:           true,
      approvedAt:       new Date(),
    });

    console.log("Business job created & live:", job._id, "Business:", companyName);

    const adminUsers = await User.find({ role: "admin" }).select("email");
    adminUsers.forEach((admin) => {
      email.sendJobPostedDirectlyEmail(
        admin.email, job.title, owner.name, owner.email, companyName, job.location, job.type
      ).catch(console.error);
    });

    res.status(201).json({
      success: true,
      message: "Job posted and live immediately! 🎉",
      job: { _id: job._id, title: job.title, company: companyName, status: job.status, isOpen: job.isOpen },
    });

    // Notify matching jobseekers (non-blocking, after response is sent)
    notifyMatchingJobseekers(job).catch(console.error);

  } catch (err) {
    console.error("❌ CREATE BUSINESS JOB ERROR:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(err.errors).map((e) => e.message).join(", "),
        code: "VALIDATION_ERROR",
      });
    }
    res.status(500).json({ success: false, message: err.message || "Failed to create job", code: "SERVER_ERROR" });
  }
};

/* ===============================
   BUSINESS OWNER — GET OWN JOBS
=============================== */
const getBusinessOwnJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ businessOwner: req.user.id, postedByBusiness: true })
      .sort({ createdAt: -1 });
    res.json({ success: true, jobs });
  } catch (err) {
    console.error("❌ GET BUSINESS OWN JOBS ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to fetch jobs" });
  }
};

/* ===============================
   BUSINESS OWNER — UPDATE JOB
=============================== */
const updateBusinessJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findOne({ _id: jobId, businessOwner: req.user.id, postedByBusiness: true });

    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    if (job.status === "taken_down") {
      return res.status(400).json({ success: false, message: "Cannot edit a taken-down job. Repost it instead." });
    }

    const { title, location, type, description, skills, isPaid, stipend, stipendPeriod, rounds } = req.body;

    const skillsArray = Array.isArray(skills)
      ? skills.filter((s) => s.trim())
      : typeof skills === "string"
      ? skills.split(",").map((s) => s.trim()).filter(Boolean)
      : job.skills;

    const roundsArray = Array.isArray(rounds)
      ? rounds.map((r, i) => ({
          order: r.order || i + 1, type: r.type || "other",
          title: r.title || "", description: r.description || "", duration: r.duration || "",
        }))
      : job.rounds;

    const updated = await Job.findByIdAndUpdate(
      jobId,
      {
        title:         (title       || job.title).trim(),
        location:      (location    || job.location).trim(),
        type:          type         || job.type,
        description:   (description || job.description).trim(),
        skills:        skillsArray,
        isPaid:        isPaid !== undefined ? isPaid : job.isPaid,
        stipend:       isPaid !== false ? (stipend || "").trim() : "",
        stipendPeriod: isPaid !== false ? (stipendPeriod || job.stipendPeriod) : "",
        rounds:        roundsArray,
        status:        "approved",
        updatedAt:     new Date(),
      },
      { new: true }
    );

    res.json({ success: true, message: "Job updated and live.", job: updated });
  } catch (err) {
    console.error("❌ UPDATE BUSINESS JOB ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to update job" });
  }
};

/* ===============================
   BUSINESS OWNER — TOGGLE JOB STATUS
=============================== */
const toggleBusinessJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { isOpen } = req.body;

    if (typeof isOpen !== "boolean") {
      return res.status(400).json({ success: false, message: "isOpen must be true or false" });
    }

    const job = await Job.findOne({
      _id: jobId,
      businessOwner: req.user.id,
      postedByBusiness: true,
      status: "approved",
    });

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found or you don't own it" });
    }

    job.isOpen   = isOpen;
    job.closedAt = isOpen ? null : new Date();
    await job.save();

    res.json({
      success: true,
      message: isOpen ? "Job reopened successfully!" : "Job closed successfully!",
      job: { _id: job._id, title: job.title, isOpen: job.isOpen, status: job.status },
    });
  } catch (err) {
    console.error("❌ TOGGLE BUSINESS JOB ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to toggle job status" });
  }
};

/* ===============================
   BUSINESS OWNER — TAKE DOWN JOB
=============================== */
const takedownBusinessJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findOneAndUpdate(
      { _id: jobId, businessOwner: req.user.id, postedByBusiness: true, status: "approved" },
      { status: "taken_down", takenDownAt: new Date() },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found, not live, or you don't have permission" });
    }

    res.json({ success: true, message: "Job taken offline.", job: { _id: job._id, title: job.title, status: job.status } });
  } catch (err) {
    console.error("❌ TAKEDOWN BUSINESS JOB ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to take down job" });
  }
};

/* ===============================
   RECRUITER - UPDATE JOB
=============================== */
const updateJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findOne({ _id: jobId, recruiter: req.user.id });

    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    if (job.status === "taken_down") {
      return res.status(400).json({ success: false, message: "Cannot edit a taken-down job. Repost it instead." });
    }
    if (job.status === "revoked") {
      return res.status(400).json({ success: false, message: "This job was revoked and cannot be edited.", code: "JOB_REVOKED" });
    }

    const recruiter = await User.findById(req.user.id).select("recruiterProfile");
    const verificationStatus = recruiter.recruiterProfile?.verificationStatus;

    const { title, location, type, description, skills, isPaid, stipend, stipendPeriod, rounds } = req.body;

    const skillsArray = Array.isArray(skills)
      ? skills.filter((s) => s.trim())
      : typeof skills === "string"
      ? skills.split(",").map((s) => s.trim()).filter(Boolean)
      : job.skills;

    const roundsArray = Array.isArray(rounds)
      ? rounds.map((r, i) => ({
          order: r.order || i + 1, type: r.type || "other",
          title: r.title || "", description: r.description || "", duration: r.duration || "",
        }))
      : job.rounds;

    const newStatus = verificationStatus === "approved" ? "approved" : "pending_business";

    const updated = await Job.findByIdAndUpdate(
      jobId,
      {
        title:         (title       || job.title).trim(),
        location:      (location    || job.location).trim(),
        type:          type         || job.type,
        description:   (description || job.description).trim(),
        skills:        skillsArray,
        isPaid:        isPaid !== undefined ? isPaid : job.isPaid,
        stipend:       isPaid !== false ? (stipend || "").trim() : "",
        stipendPeriod: isPaid !== false ? (stipendPeriod || job.stipendPeriod) : "",
        rounds:        roundsArray,
        isOpen:        job.isOpen,
        status:        newStatus,
        updatedAt:     new Date(),
      },
      { new: true }
    );

    res.json({
      success: true,
      message: newStatus === "approved" ? "Job updated and live." : "Job updated and resubmitted for approval.",
      job: updated,
    });
  } catch (err) {
    console.error("❌ UPDATE JOB ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to update job" });
  }
};

/* ===============================
   RECRUITER - TOGGLE JOB STATUS
=============================== */
const toggleJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { isOpen } = req.body;

    if (typeof isOpen !== "boolean") {
      return res.status(400).json({ success: false, message: "isOpen must be true or false" });
    }

    const job = await Job.findOne({ _id: jobId, recruiter: req.user.id, status: "approved" });
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found, not approved, or you don't own it" });
    }

    job.isOpen   = isOpen;
    job.closedAt = isOpen ? null : new Date();
    await job.save();

    res.json({
      success: true,
      message: isOpen ? "Job reopened successfully!" : "Job closed successfully!",
      job: { _id: job._id, title: job.title, isOpen: job.isOpen, status: job.status },
    });
  } catch (err) {
    console.error("❌ TOGGLE JOB ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to toggle job status" });
  }
};

/* ===============================
   RECRUITER - TAKE DOWN LIVE JOB
=============================== */
const takedownJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findOneAndUpdate(
      { _id: jobId, recruiter: req.user.id, status: "approved" },
      { status: "taken_down", takenDownAt: new Date() },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found, not live, or you don't have permission" });
    }

    res.json({ success: true, message: "Job taken offline successfully.", job: { _id: job._id, title: job.title, status: job.status } });
  } catch (err) {
    console.error("❌ TAKEDOWN JOB ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to take down job" });
  }
};

/* ===============================
   RECRUITER - GET SINGLE JOB
=============================== */
const getJobById = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.jobId, recruiter: req.user.id })
      .populate("business", "businessProfile.businessName name");
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    res.json({ success: true, job });
  } catch (err) {
    console.error("❌ GET JOB ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to fetch job" });
  }
};

/* ===============================
   BUSINESS OWNER - PENDING JOBS (from linked recruiters, legacy)
=============================== */
const getBusinessPendingJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ business: req.user.id, status: "pending_business", postedByBusiness: { $ne: true } })
      .populate("recruiter", "name email recruiterProfile.companyName")
      .sort({ createdAt: -1 });
    res.json({ success: true, jobs, count: jobs.length });
  } catch (err) {
    console.error("❌ GET PENDING JOBS ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to fetch jobs" });
  }
};

/* ===============================
   BUSINESS OWNER - APPROVE JOB (legacy recruiter flow)
=============================== */
const businessApproveJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findOneAndUpdate(
      { _id: jobId, business: req.user.id, status: "pending_business" },
      { status: "approved", approvedAt: new Date() },
      { new: true }
    ).populate("recruiter", "name email");

    if (!job) return res.status(404).json({ success: false, message: "Job not found or already processed" });

    const biz     = await User.findById(req.user.id).select("name businessProfile");
    const bizName = biz.businessProfile?.businessName || biz.name;

    email.sendJobApprovedEmail(job.recruiter.email, job.recruiter.name, job.title, bizName).catch(console.error);

    const adminUsers = await User.find({ role: "admin" }).select("email");
    adminUsers.forEach((admin) => {
      email.sendAdminJobLiveAlert(admin.email, job.title, bizName, job.recruiter.name, job.location, job.type).catch(console.error);
    });

    res.json({ success: true, message: "Job approved and LIVE!", job });
  } catch (err) {
    console.error("❌ APPROVE JOB ERROR:", err);
    res.status(500).json({ success: false, message: "Approval failed" });
  }
};

/* ===============================
   BUSINESS OWNER - REJECT JOB (legacy recruiter flow)
=============================== */
const businessRejectJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { reason } = req.body;
    const job = await Job.findOneAndUpdate(
      { _id: jobId, business: req.user.id, status: "pending_business" },
      { status: "rejected_business", rejectedAt: new Date() },
      { new: true }
    ).populate("recruiter", "name email");

    if (!job) return res.status(404).json({ success: false, message: "Job not found or already processed" });

    const biz     = await User.findById(req.user.id).select("name businessProfile");
    const bizName = biz.businessProfile?.businessName || biz.name;

    email.sendJobRejectedEmail(job.recruiter.email, job.recruiter.name, job.title, bizName, reason).catch(console.error);

    res.json({ success: true, message: "Job rejected", job });
  } catch (err) {
    console.error("❌ REJECT JOB ERROR:", err);
    res.status(500).json({ success: false, message: "Rejection failed" });
  }
};

/* ===============================
   RECRUITER - MY JOBS
=============================== */
const getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ recruiter: req.user.id })
      .populate("business", "businessProfile.businessName status name")
      .sort({ createdAt: -1 });
    res.json({ success: true, jobs });
  } catch (err) {
    console.error("❌ MY JOBS ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to fetch jobs" });
  }
};

/* ===============================
   JOBSEEKERS - LIVE JOBS (open only)
=============================== */
const getApprovedJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ status: "approved", isOpen: true })
      .populate("business",  "businessProfile.businessName businessProfile.images")
      .populate("recruiter", "recruiterProfile.companyName")
      .sort({ createdAt: -1 });
    res.json({ success: true, jobs });
  } catch (err) {
    console.error("❌ APPROVED JOBS ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to fetch jobs" });
  }
};

/* ===============================
   PUBLIC - LIVE JOBS (paginated, open only)
=============================== */
const getPublicJobs = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip  = (page - 1) * limit;

    const filter = { status: "approved", isOpen: true };
    if (req.query.type)     filter.type     = req.query.type;
    if (req.query.location) filter.location = new RegExp(req.query.location, "i");
    if (req.query.isPaid !== undefined) filter.isPaid = req.query.isPaid === "true";
    if (req.query.skill)    filter.skills   = { $in: [new RegExp(req.query.skill, "i")] };

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate({ path: "business",  select: "businessProfile.businessName businessProfile.images name" })
        .populate({ path: "recruiter", select: "name recruiterProfile.companyName" })
        .select("-__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Job.countDocuments(filter),
    ]);

    res.json({
      success: true, jobs, count: jobs.length, total, page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (err) {
    console.error("❌ PUBLIC JOBS ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to fetch public jobs" });
  }
};

/* ===============================
   PUBLIC - SINGLE LIVE JOB
=============================== */
const getPublicJobById = async (req, res) => {
  try {
    const { jobId } = req.params;
    if (!jobId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: "Invalid job ID" });
    }

    const job = await Job.findOne({ _id: jobId, status: "approved", isOpen: true })
      .populate("business",  "businessProfile.businessName businessProfile.images name")
      .populate("recruiter", "recruiterProfile.companyName name")
      .select("-__v");

    if (!job) return res.status(404).json({ success: false, message: "Job not found or not live" });
    res.json({ success: true, job });
  } catch (err) {
    console.error("❌ PUBLIC JOB DETAIL ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ===============================
   EXPORTS
=============================== */
module.exports = {
  // Recruiter
  createJob,
  updateJob,
  toggleJobStatus,
  takedownJob,
  getJobById,
  getMyJobs,
  // Business owner — own jobs
  createBusinessJob,
  getBusinessOwnJobs,
  updateBusinessJob,
  toggleBusinessJobStatus,
  takedownBusinessJob,
  // Business owner — recruiter job approvals (legacy)
  getBusinessPendingJobs,
  businessApproveJob,
  businessRejectJob,
  // Public
  getApprovedJobs,
  getPublicJobs,
  getPublicJobById,
};