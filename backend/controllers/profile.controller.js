const User = require("../models/User");
const RecruiterBusinessLink = require("../models/RecruiterBusinessLink");
const s3 = require("../config/s3");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const email = require("../services/emailService");

const calculateProgress = (requiredFields, data) => {
  const filled = requiredFields.filter(
    (f) => data[f] && data[f].toString().trim() !== ""
  ).length;
  return Math.round((filled / requiredFields.length) * 100);
};

/* =========================================================
   COMPLETE PROFILE
========================================================= */
exports.completeProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const data = req.body;
    if (data.skills && Array.isArray(data.skills) && data.skills.length === 0) {
  return res.status(400).json({ success: false, message: "Please add at least one skill" });
}

// Also fix the calculateProgress check for arrays:
const calculateProgress = (requiredFields, data) => {
  const filled = requiredFields.filter((f) => {
    if (Array.isArray(data[f])) return data[f].length > 0;
    return data[f] && data[f].toString().trim() !== "";
  }).length;
  return Math.round((filled / requiredFields.length) * 100);
};
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    let required = [];
    let progress  = 0;

    if (user.role === "jobseeker") {
      required = ["fullName", "mobile", "city", "education", "skills", "experience", "resume"];
      progress  = calculateProgress(required, data);
      if (progress < 100) return res.status(400).json({ success: false, message: "Fill all required fields" });
      if (!data.fullName || data.fullName.trim() === "") {
  data.fullName = `${data.firstName || ""} ${data.lastName || ""}`.trim();
}
      await User.updateOne(
        { _id: user._id },
        { $set: { jobSeekerProfile: { ...user.jobSeekerProfile, ...data }, profileCompleted: true, profileProgress: progress } }
      );
    }

    if (user.role === "recruiter") {
      required = ["companyName", "companyWebsite", "companyDescription", "companyLocation", "contactNumber", "companyLogo", "industryType"];
      progress  = calculateProgress(required, data);
      if (progress < 100) return res.status(400).json({ success: false, message: "Fill all required fields" });

      const existing = user.recruiterProfile || {};
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            recruiterProfile: {
              ...existing,
              ...data,
              verificationStatus:      existing.verificationStatus      || undefined,
              verificationRequestedAt: existing.verificationRequestedAt || undefined,
              verificationReviewedAt:  existing.verificationReviewedAt  || undefined,
              rejectionReason:         existing.rejectionReason         || undefined,
            },
            profileCompleted: true,
            profileProgress:  progress,
          },
        }
      );
    }

    if (user.role === "business") {
      required = ["businessName", "category", "address", "contactDetails", "description", "images"];
      progress  = calculateProgress(required, data);
      if (!data.images || !Array.isArray(data.images) || data.images.length < 1) {
        return res.status(400).json({ success: false, message: "At least one image URL required" });
      }
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            businessProfile:  { ...user.businessProfile, ...data, 
              street:  data.street  || "",
              city:    data.city    || "",
              state:   data.state   || "",
              pincode: data.pincode || "", status: "pending" },
            profileCompleted: true,
            profileProgress:  progress,
          },
        }
      );
    }

    if (user.role === "admin") {
      progress = 100;
      await User.updateOne({ _id: user._id }, { $set: { profileCompleted: true, profileProgress: 100 } });
    }

    const updatedUser = await User.findById(user._id).select("-password");
    res.json({ success: true, message: "Profile completed successfully", user: updatedUser, progress });
  } catch (err) {
    console.error("COMPLETE PROFILE ERROR:", err);
    res.status(500).json({ success: false, message: err.message || "Profile update failed" });
  }
};

/* =========================================================
   GET MY PROFILE
========================================================= */
exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (err) {
    console.error("GET PROFILE ERROR:", err);
    res.status(500).json({ success: false, message: "Profile fetch failed" });
  }
};

/* =========================================================
   REQUEST ADMIN VERIFICATION (recruiter)
   POST /api/profile/recruiter/request-verification
========================================================= */
exports.requestVerification = async (req, res) => {
  try {
    const recruiter = await User.findById(req.user.id);

    if (!recruiter || recruiter.role !== "recruiter") {
      return res.status(403).json({ success: false, message: "Recruiter account required" });
    }

    if (!recruiter.profileCompleted) {
      return res.status(400).json({
        success: false,
        message: "Complete your profile before requesting verification",
        code: "PROFILE_INCOMPLETE",
      });
    }

    const currentStatus = recruiter.recruiterProfile?.verificationStatus;

    if (currentStatus === "approved") {
      return res.status(400).json({ success: false, message: "Your profile is already verified", code: "ALREADY_VERIFIED" });
    }
    if (currentStatus === "pending") {
      return res.status(400).json({ success: false, message: "Your verification request is already pending admin review", code: "ALREADY_PENDING" });
    }

    await User.findByIdAndUpdate(req.user.id, {
      $set: {
        "recruiterProfile.verificationStatus":      "pending",
        "recruiterProfile.verificationRequestedAt": new Date(),
        "recruiterProfile.rejectionReason":         "",
      },
    });

    const companyName = recruiter.recruiterProfile?.companyName;
    const industry    = recruiter.recruiterProfile?.industryType;
    const location    = recruiter.recruiterProfile?.companyLocation;

    email.sendRecruiterVerificationRequestedEmail(recruiter.email, recruiter.name, companyName).catch(console.error);

    const adminUsers = await User.find({ role: "admin" }).select("email");
    adminUsers.forEach((admin) => {
      email.sendAdminRecruiterVerificationAlert(
        admin.email, recruiter.name, recruiter.email, companyName, industry, location
      ).catch(console.error);
    });

    console.log(`📧 Verification request sent by ${recruiter.name} (${recruiter.email})`);

    res.json({ success: true, message: "Verification request submitted! Admin will review within 24 hours." });
  } catch (err) {
    console.error("REQUEST VERIFICATION ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to submit verification request" });
  }
};

/* =========================================================
   UPLOAD RESUME
========================================================= */
exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No resume file uploaded" });

    const user = await User.findById(req.user.id);
    if (!user || user.role !== "jobseeker") return res.status(403).json({ success: false, message: "Jobseeker profile required" });

    const oldResume = user.jobSeekerProfile?.resume;
    if (oldResume) {
      try {
        const url = new URL(oldResume);
        const key = decodeURIComponent(url.pathname.substring(1));
        await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: key }));
      } catch (e) { console.warn("Skip old resume delete:", e.message); }
    }

    const resumeUrl = req.file.location;
    await User.updateOne(
      { _id: user._id },
      { $set: { "jobSeekerProfile.resume": resumeUrl, profileProgress: 100, profileCompleted: true } }
    );
    res.json({ success: true, resumeUrl, message: "Resume uploaded successfully" });
  } catch (err) {
    console.error("RESUME ERROR:", err);
    res.status(500).json({ success: false, message: err.message || "Resume upload failed" });
  }
};

/* =========================================================
   UPLOAD LOGO
========================================================= */
exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No logo file uploaded" });

    const user = await User.findById(req.user.id);
    if (!user || user.role !== "recruiter") return res.status(403).json({ success: false, message: "Recruiter profile required" });

    const oldLogo = user.recruiterProfile?.companyLogo;
    if (oldLogo) {
      try {
        const url = new URL(oldLogo);
        const key = decodeURIComponent(url.pathname.substring(1));
        await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: key }));
      } catch (e) { console.warn("Skip old logo delete:", e.message); }
    }

    const logoUrl = req.file.location;
    await User.updateOne(
      { _id: user._id },
      { $set: { "recruiterProfile.companyLogo": logoUrl, profileProgress: 100, profileCompleted: true } }
    );
    res.json({ success: true, logoUrl, message: "Logo uploaded successfully" });
  } catch (err) {
    console.error("LOGO ERROR:", err);
    res.status(500).json({ success: false, message: err.message || "Logo upload failed" });
  }
};

/* =========================================================
   UPLOAD PROFILE PICTURE (Avatar)
========================================================= */
exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No image file uploaded" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Role check (Recruiter and Business only)
    if (user.role !== "recruiter" && user.role !== "business") {
      return res.status(403).json({ success: false, message: "Access restricted to recruiters and businesses" });
    }

    const oldAvatar = user.profilePicture;
    if (oldAvatar) {
      try {
        const url = new URL(oldAvatar);
        const key = decodeURIComponent(url.pathname.substring(1));
        await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: key }));
      } catch (e) { console.warn("Skip old avatar delete:", e.message); }
    }

    const avatarUrl = req.file.location;
    await User.updateOne(
      { _id: user._id },
      { $set: { profilePicture: avatarUrl } }
    );

    res.json({ success: true, avatarUrl, message: "Profile picture updated successfully" });
  } catch (err) {
    console.error("AVATAR UPLOAD ERROR:", err);
    res.status(500).json({ success: false, message: err.message || "Avatar upload failed" });
  }
};

/* =========================================================
   UPLOAD BUSINESS IMAGES
========================================================= */
exports.uploadBusinessImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, message: "No images uploaded" });

    const user = await User.findById(req.user.id);
    if (!user || user.role !== "business") return res.status(403).json({ success: false, message: "Business profile required" });

    const newUrls        = req.files.map((f) => f.location);
    const existingImages = user.businessProfile?.images || [];
    const allImages      = [...existingImages, ...newUrls];

    await User.updateOne(
      { _id: user._id },
      { $set: { "businessProfile.images": allImages, "businessProfile.status": "pending", profileProgress: 100, profileCompleted: true } }
    );
    res.json({ success: true, images: newUrls, totalImages: allImages.length, message: `${newUrls.length} images uploaded` });
  } catch (err) {
    console.error("BUSINESS IMAGES ERROR:", err);
    res.status(500).json({ success: false, message: err.message || "Upload failed" });
  }
};

/* =========================================================
   BUSINESS — GET PENDING LIST
========================================================= */
exports.getPendingBusinesses = async (req, res) => {
  try {
    const list = await User.find({ role: "business", "businessProfile.status": "pending" })
      .select("name email businessProfile");
    res.json(list);
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =========================================================
   BUSINESS — APPROVE
========================================================= */
exports.approveBusiness = async (req, res) => {
  try {
    const businessBefore = await User.findOne({ _id: req.params.id, role: "business" });
    if (!businessBefore) return res.status(404).json({ success: false, message: "Business not found" });

    const wasRevoked = await RecruiterBusinessLink.exists({
      business: req.params.id,
      status: "removed_by_business",
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { "businessProfile.status": "approved", "businessProfile.verified": true },
      { new: true }
    ).select("-password");

    const businessName = businessBefore.businessProfile?.businessName || businessBefore.name;

    if (wasRevoked) {
      await email.sendBusinessReApprovedEmail(businessBefore.email, businessBefore.name, businessName, 0).catch((err) => console.error("❌ Re-approval email failed:", err));
    } else {
      await email.sendBusinessApprovedEmail(businessBefore.email, businessBefore.name, businessName).catch((err) => console.error("❌ Approval email failed:", err));
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error("APPROVE BUSINESS ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =========================================================
   BUSINESS — REJECT
========================================================= */
exports.rejectBusiness = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { "businessProfile.status": "rejected" },
      { new: true }
    ).select("-password");
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =========================================================
   GET APPROVED BUSINESSES
========================================================= */
exports.getApprovedBusinesses = async (req, res) => {
  try {
    const list = await User.find({ role: "business", "businessProfile.status": "approved" })
      .select("businessProfile name");
    res.json(list);
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =========================================================
   RECRUITER — REQUEST BUSINESS LINK (kept for backward compat)
========================================================= */
exports.requestBusinessLink = async (req, res) => {
  try {
    const { businessId } = req.body;
    const recruiterId    = req.user.id;

    if (!businessId) return res.status(400).json({ success: false, message: "Business ID is required" });

    const recruiter = await User.findById(recruiterId).select("name email recruiterProfile");
    if (!recruiter) return res.status(404).json({ success: false, message: "Recruiter not found" });

    const existingLink = await RecruiterBusinessLink.findOne({
      recruiter: recruiterId,
      business:  businessId,
      status:    { $in: ["pending", "approved"] },
    });

    if (existingLink) {
      if (existingLink.status === "approved") return res.json({ success: true, message: "Already linked", status: "approved" });
      if (existingLink.status === "pending")  return res.status(400).json({ success: false, message: "Request already pending ⏳" });
    }

    const business = await User.findById(businessId).select("name email businessProfile role");
    if (!business || business.role !== "business" || business.businessProfile?.status !== "approved") {
      return res.status(400).json({ success: false, message: "Invalid or unapproved business" });
    }

    const businessName = business.businessProfile?.businessName || business.name;

    const oldLink = await RecruiterBusinessLink.findOne({
      recruiter: recruiterId,
      business:  businessId,
      status:    { $in: ["rejected", "unlinked", "removed_by_business"] },
    });

    if (oldLink) {
      oldLink.status         = "pending";
      oldLink.requestedAt    = new Date();
      oldLink.approvedAt     = null;
      oldLink.rejectedAt     = null;
      oldLink.rejectedReason = null;
      oldLink.unlinkedAt     = null;
      oldLink.removedAt      = null;
      await oldLink.save();

      email.sendRecruiterRequestConfirmation(recruiter.email, recruiter.name, businessName).catch(console.error);
      email.sendRecruiterRequestToBusiness(business.email, business.name, businessName, recruiter.name, recruiter.email, recruiter.recruiterProfile?.companyName).catch(console.error);

      return res.json({ success: true, message: "Link request sent!", status: "pending", requestId: oldLink._id });
    }

    const linkRequest = new RecruiterBusinessLink({ recruiter: recruiterId, business: businessId, status: "pending" });
    await linkRequest.save();

    email.sendRecruiterRequestConfirmation(recruiter.email, recruiter.name, businessName).catch(console.error);
    email.sendRecruiterRequestToBusiness(business.email, business.name, businessName, recruiter.name, recruiter.email, recruiter.recruiterProfile?.companyName).catch(console.error);

    res.json({ success: true, message: "Link request sent!", status: "pending", requestId: linkRequest._id });
  } catch (err) {
    console.error("Request link ERROR:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to send request" });
  }
};

/* =========================================================
   GET PENDING RECRUITERS (business owner or recruiter view)
========================================================= */
exports.getPendingRecruiters = async (req, res) => {
  try {
    const userId = req.user.id;
    const user   = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    let requests = [];

    if (user.role === "business") {
      requests = await RecruiterBusinessLink.find({ business: userId, status: "pending" })
        .populate("recruiter", "name email recruiterProfile")
        .sort({ requestedAt: -1 });
    } else if (user.role === "recruiter") {
      requests = await RecruiterBusinessLink.find({ recruiter: userId, status: "pending" })
        .populate("business", "name businessProfile")
        .sort({ requestedAt: -1 });
    }

    res.json(requests);
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =========================================================
   GET LINKED RECRUITERS (business owner)
========================================================= */
exports.getLinkedRecruiters = async (req, res) => {
  try {
    const businessId = req.user.id;
    const user       = await User.findById(businessId);

    if (!user || user.role !== "business") {
      return res.status(403).json({ success: false, message: "Business account required" });
    }

    const approvedLinks = await RecruiterBusinessLink.find({ business: businessId, status: "approved" })
      .populate("recruiter", "name email recruiterProfile")
      .sort({ approvedAt: -1 });

    const recruiters = approvedLinks.map((l) => l.recruiter).filter(Boolean);
    res.json(recruiters);
  } catch (err) {
    console.error("Get linked recruiters ERROR:", err);
    res.status(500).json({ success: false, message: "Server error: " + err.message });
  }
};

/* =========================================================
   APPROVE RECRUITER LINK (business owner)
========================================================= */
exports.approveRecruiterLink = async (req, res) => {
  try {
    const { requestId } = req.params;
    const businessId    = req.user.id;

    const linkRequest = await RecruiterBusinessLink.findOne({
      _id:      requestId,
      business: businessId,
      status:   "pending",
    }).populate("recruiter", "name email recruiterProfile");

    if (!linkRequest) {
      return res.status(404).json({ success: false, message: "Request not found or already processed" });
    }

    const business     = await User.findById(businessId).select("businessProfile name role email");
    const businessName = business.businessProfile?.businessName || business.name;

    const syncedCompanyDetails = {
      "recruiterProfile.linkedBusiness":     businessId,
      "recruiterProfile.companyName":        businessName,
      "recruiterProfile.companyWebsite":     business.businessProfile?.contactDetails || "",
      "recruiterProfile.companyLocation":    business.businessProfile?.address        || "",
      "recruiterProfile.companyDescription": business.businessProfile?.description    || "",
    };

    linkRequest.status     = "approved";
    linkRequest.approvedAt = new Date();
    await linkRequest.save();

    await User.findByIdAndUpdate(linkRequest.recruiter._id, { $set: syncedCompanyDetails });

    const Job = require("../models/Job");
    const restoredJobs = await Job.updateMany(
      { recruiter: linkRequest.recruiter._id, business: businessId, status: "revoked" },
      { $set: { status: "pending_business", business: businessId } }
    );

    email.sendRecruiterApprovedEmail(
      linkRequest.recruiter.email, linkRequest.recruiter.name, businessName, restoredJobs.modifiedCount
    ).catch(console.error);

    if (restoredJobs.modifiedCount > 0) {
      email.sendRestoredJobsNotification(
        business.email, business.name, businessName, linkRequest.recruiter.name, restoredJobs.modifiedCount
      ).catch(console.error);
    }

    res.json({
      success: true,
      message: `${linkRequest.recruiter.name} linked successfully! ${restoredJobs.modifiedCount} job(s) restored.`,
      recruiter:         linkRequest.recruiter,
      syncedCompanyName: businessName,
      jobsRestored:      restoredJobs.modifiedCount,
    });
  } catch (err) {
    console.error("Approve recruiter ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =========================================================
   REJECT RECRUITER LINK (business owner)
========================================================= */
exports.rejectRecruiterLink = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason }    = req.body;
    const businessId    = req.user.id;

    const linkRequest = await RecruiterBusinessLink.findOne({
      _id:      requestId,
      business: businessId,
      status:   "pending",
    }).populate("recruiter", "name email");

    if (!linkRequest) return res.status(404).json({ success: false, message: "Request not found" });

    linkRequest.status         = "rejected";
    linkRequest.rejectedAt     = new Date();
    linkRequest.rejectedReason = reason || "No reason provided";
    await linkRequest.save();

    const business     = await User.findById(businessId).select("name businessProfile");
    const businessName = business?.businessProfile?.businessName || business?.name || "the business";

    email.sendRecruiterRejectedEmail(
      linkRequest.recruiter.email, linkRequest.recruiter.name, businessName, reason
    ).catch(console.error);

    res.json({ success: true, message: "Recruiter request rejected" });
  } catch (err) {
    console.error("Reject recruiter ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =========================================================
   LINK RECRUITER TO BUSINESS (direct link, no request)
========================================================= */
exports.linkRecruiterToBusiness = async (req, res) => {
  try {
    const { businessId } = req.body;
    if (!businessId || !req.user.id) return res.status(400).json({ success: false, message: "Missing businessId or user ID" });

    const recruiter = await User.findById(req.user.id);
    if (!recruiter || recruiter.role !== "recruiter") return res.status(403).json({ success: false, message: "Recruiter account required" });

    if (recruiter.recruiterProfile?.linkedBusiness) {
      return res.status(400).json({ success: false, message: "Already linked. Unlink first." });
    }

    const business = await User.findById(businessId);
    if (!business || business.role !== "business" || business.businessProfile?.status !== "approved") {
      return res.status(400).json({ success: false, message: "Invalid or unapproved business" });
    }

    await RecruiterBusinessLink.findOneAndUpdate(
      { recruiter: req.user.id, business: businessId },
      { recruiter: req.user.id, business: businessId, status: "approved", approvedAt: new Date() },
      { upsert: true, new: true }
    );

    await User.findByIdAndUpdate(req.user.id, { $set: { "recruiterProfile.linkedBusiness": businessId } });

    res.json({ success: true, message: "Linked to business!", linkedBusiness: businessId });
  } catch (err) {
    console.error("Link business ERROR:", err);
    res.status(500).json({ success: false, message: "Server error: " + err.message });
  }
};

/* =========================================================
   UNLINK RECRUITER FROM BUSINESS
========================================================= */
exports.unlinkRecruiterBusiness = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const recruiter   = await User.findById(recruiterId);

    if (!recruiter || recruiter.role !== "recruiter") return res.status(403).json({ success: false, message: "Recruiter account required" });

    const linkedBusinessId = recruiter.recruiterProfile?.linkedBusiness;
    if (!linkedBusinessId) return res.status(400).json({ success: false, message: "No business currently linked" });

    await User.findByIdAndUpdate(recruiterId, { $unset: { "recruiterProfile.linkedBusiness": "" } });

    await RecruiterBusinessLink.updateMany(
      { recruiter: recruiterId, business: linkedBusinessId, status: "approved" },
      { $set: { status: "unlinked", unlinkedAt: new Date() } }
    );

    res.json({ success: true, message: "Business unlinked.", unlinkedBusinessId: linkedBusinessId });
  } catch (err) {
    console.error("Unlink business ERROR:", err);
    res.status(500).json({ success: false, message: "Server error: " + err.message });
  }
};

/* =========================================================
   REMOVE RECRUITER FROM BUSINESS (business owner action)
========================================================= */
exports.removeRecruiterFromBusiness = async (req, res) => {
  try {
    const businessId  = req.user.id;
    const recruiterId = req.params.recruiterId;

    if (!recruiterId) return res.status(400).json({ success: false, message: "Recruiter ID missing" });

    const business  = await User.findById(businessId).select("name email businessProfile role");
    if (!business || business.role !== "business") return res.status(403).json({ success: false, message: "Business account required" });

    const recruiter = await User.findById(recruiterId).select("name email role recruiterProfile");
    if (!recruiter || recruiter.role !== "recruiter") return res.status(404).json({ success: false, message: "Recruiter not found" });

    if (recruiter.recruiterProfile?.linkedBusiness?.toString() !== businessId) {
      return res.status(400).json({ success: false, message: "This recruiter is not linked to your business" });
    }

    await User.findByIdAndUpdate(recruiterId, { $unset: { "recruiterProfile.linkedBusiness": "" } });

    await RecruiterBusinessLink.updateMany(
      { recruiter: recruiterId, business: businessId, status: "approved" },
      { $set: { status: "removed_by_business", removedAt: new Date() } }
    );

    const businessName = business.businessProfile?.businessName || business.name;

    email.sendRecruiterRemovedEmail(recruiter.email, recruiter.name, businessName).catch(console.error);
    email.sendBusinessRecruiterRemovedConfirmation(business.email, business.name, businessName, recruiter.name).catch(console.error);

    res.json({ success: true, message: "Recruiter removed successfully", recruiterId });
  } catch (err) {
    console.error("Remove recruiter ERROR:", err);
    res.status(500).json({ success: false, message: "Server error: " + err.message });
  }
};

/* =========================================================
   GET LINKED BUSINESS DETAILS (recruiter view)
========================================================= */
exports.getLinkedBusinessDetails = async (req, res) => {
  try {
    const recruiter = await User.findById(req.user.id);
    if (!recruiter || recruiter.role !== "recruiter") return res.status(403).json({ success: false, message: "Recruiter account required" });

    const linkedBusinessId = recruiter.recruiterProfile?.linkedBusiness;
    if (!linkedBusinessId) return res.json({ success: true, linked: false, business: null });

    const business = await User.findById(linkedBusinessId).select("name businessProfile");
    if (!business) return res.json({ success: true, linked: false, business: null });

    res.json({
      success: true,
      linked:  true,
      business: {
        _id:            business._id,
        name:           business.businessProfile?.businessName || business.name,
        location:       business.businessProfile?.address,
        category:       business.businessProfile?.category,
        description:    business.businessProfile?.description,
        contactDetails: business.businessProfile?.contactDetails,
      },
    });
  } catch (err) {
    console.error("Get linked business ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = exports;