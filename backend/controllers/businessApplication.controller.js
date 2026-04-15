const Application = require("../models/Application");
const Job = require("../models/Job");
const User = require("../models/User");
const {
  sendApplicationConfirmation,
  sendNewApplicationAlert,
  sendShortlistEmail,
  sendRoundPassedEmail,
  sendRoundRejectedEmail,
  sendRejectionEmail,
  sendHiredEmail,
  sendApplicationWithdrawnNotice,
} = require("../services/emailService");

/* ─────────────────────────────────────────────────────────────
   HELPER — resolve company name for business-posted jobs.
   Mirrors the same helper in application.controller.js.
───────────────────────────────────────────────────────────── */
function resolveCompanyName(job, owner) {
  return (
    owner?.businessProfile?.businessName ||
    job?.company ||
    "the company"
  );
}

/* ─────────────────────────────────────────────────────────────
   HELPER — verify the requesting user owns this application's job.
   Returns the application (populated) or null.
───────────────────────────────────────────────────────────── */
async function findBusinessApplication(applicationId, businessOwnerId) {
  return Application.findOne({
    _id:      applicationId,
    business: businessOwnerId,   // set at submit time from job.businessOwner
  })
    .populate("job",       "title company rounds businessOwner")
    .populate("jobseeker", "name email jobSeekerProfile");
}

/* =========================================================
   BUSINESS OWNER — GET ALL APPLICATIONS FOR OWN JOBS
   (replaces the inline version in application.controller.js)
========================================================= */
exports.getBusinessOwnApplications = async (req, res) => {
  try {
    const { status, jobId } = req.query;
    const filter = { business: req.user.id };
    if (status) filter.status = status;
    if (jobId)  filter.job    = jobId;

    const applications = await Application.find(filter)
      .populate("job",       "title location type company rounds isOpen status")
      .populate("jobseeker", "name email jobSeekerProfile")
      .sort({ createdAt: -1 });

    res.json({ success: true, applications, count: applications.length });
  } catch (err) {
    console.error("GET BUSINESS OWN APPLICATIONS ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to fetch applications" });
  }
};

/* =========================================================
   BUSINESS OWNER — GET SINGLE APPLICATION DETAIL
   Auto-advances status from "applied" → "under_review" on first open.
========================================================= */
exports.getBusinessApplicationDetail = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await findBusinessApplication(applicationId, req.user.id);
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    if (application.status === "applied") {
      application.status     = "under_review";
      application.reviewedAt = new Date();
      await application.save();
    }

    res.json({ success: true, application });
  } catch (err) {
    console.error("GET BUSINESS APP DETAIL ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to fetch application" });
  }
};

/* =========================================================
   BUSINESS OWNER — SHORTLIST INTO ROUND 1
   Mirrors recruiter shortlistApplicant; notifies jobseeker.
========================================================= */
exports.businessShortlistApplicant = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { note } = req.body;

    const application = await findBusinessApplication(applicationId, req.user.id);
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    if (application.status === "rejected") {
      return res.status(400).json({ success: false, message: "Cannot shortlist a rejected application" });
    }

    application.status        = "shortlisted";
    application.shortlistedAt = new Date();
    application.currentRound  = 1;

    const firstRound = application.job.rounds?.[0];
    if (firstRound) {
      application.roundUpdates.push({
        roundNumber: 1,
        roundTitle:  firstRound.title || firstRound.type,
        roundType:   firstRound.type,
        result:      "scheduled",
        note:
          note ||
          `You have been shortlisted for ${application.job.title}. Your first round is ${firstRound.title || firstRound.type}.`,
        updatedAt: new Date(),
      });
    }

    await application.save();

    // Resolve business owner for company name
    const owner       = await User.findById(req.user.id).select("businessProfile");
    const companyName = resolveCompanyName(application.job, owner);
    const applicantName =
      application.jobseeker?.jobSeekerProfile?.fullName || application.jobseeker?.name;

    sendShortlistEmail(
      application.jobseeker.email,
      applicantName,
      application.job.title,
      companyName,
      firstRound ? firstRound.title || firstRound.type : null,
      note
    ).catch(console.error);

    res.json({ success: true, message: "Applicant shortlisted for Round 1", application });
  } catch (err) {
    console.error("BUSINESS SHORTLIST ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to shortlist applicant" });
  }
};

/* =========================================================
   BUSINESS OWNER — PROCEED TO NEXT ROUND
   Marks current round passed, schedules next, emails jobseeker.
========================================================= */
exports.businessProceedToNextRound = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { note } = req.body;

    const application = await findBusinessApplication(applicationId, req.user.id);
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    if (!["shortlisted", "round_update"].includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: "Application must be shortlisted or in round_update state",
      });
    }

    const rounds           = application.job.rounds || [];
    const currentRoundIdx  = application.currentRound - 1;
    const currentRoundData = rounds[currentRoundIdx];
    const nextRoundData    = rounds[currentRoundIdx + 1];

    if (!nextRoundData) {
      return res.status(400).json({
        success: false,
        message: "Already on the last round. Use 'Final Shortlist' to complete.",
        code: "LAST_ROUND",
      });
    }

    // Mark current round as passed
    const passedEntry = {
      roundNumber: application.currentRound,
      roundTitle:  currentRoundData?.title || currentRoundData?.type || `Round ${application.currentRound}`,
      roundType:   currentRoundData?.type || "other",
      result:      "passed",
      note:        note || "",
      updatedAt:   new Date(),
    };
    const existingIdx = application.roundUpdates.findIndex(
      (r) => r.roundNumber === application.currentRound
    );
    if (existingIdx >= 0) {
      application.roundUpdates[existingIdx] = passedEntry;
    } else {
      application.roundUpdates.push(passedEntry);
    }

    // Schedule next round
    const nextRoundNumber     = application.currentRound + 1;
    application.currentRound  = nextRoundNumber;
    application.status        = "round_update";

    const nextEntry = {
      roundNumber: nextRoundNumber,
      roundTitle:  nextRoundData.title || nextRoundData.type,
      roundType:   nextRoundData.type,
      result:      "scheduled",
      note:        `You have advanced to Round ${nextRoundNumber}: ${nextRoundData.title || nextRoundData.type}`,
      updatedAt:   new Date(),
    };
    const nextExistingIdx = application.roundUpdates.findIndex(
      (r) => r.roundNumber === nextRoundNumber
    );
    if (nextExistingIdx >= 0) {
      application.roundUpdates[nextExistingIdx] = nextEntry;
    } else {
      application.roundUpdates.push(nextEntry);
    }

    await application.save();

    const owner         = await User.findById(req.user.id).select("businessProfile");
    const companyName   = resolveCompanyName(application.job, owner);
    const applicantName =
      application.jobseeker?.jobSeekerProfile?.fullName || application.jobseeker?.name;

    sendRoundPassedEmail(
      application.jobseeker.email,
      applicantName,
      application.job.title,
      companyName,
      passedEntry.roundTitle,
      nextRoundData.title || nextRoundData.type,
      nextRoundNumber,
      note
    ).catch(console.error);

    res.json({
      success: true,
      message: `Candidate advanced to Round ${nextRoundNumber}: ${nextRoundData.title || nextRoundData.type}`,
      application,
    });
  } catch (err) {
    console.error("BUSINESS PROCEED TO NEXT ROUND ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to proceed to next round" });
  }
};

/* =========================================================
   BUSINESS OWNER — FINAL SHORTLIST (HIRED)
   Closes the pipeline; sends offer email to jobseeker.
========================================================= */
exports.businessFinalShortlist = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { note } = req.body;

    const application = await findBusinessApplication(applicationId, req.user.id);
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    if (!["shortlisted", "round_update"].includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: "Application must be shortlisted or in round_update state to finalise",
      });
    }

    const rounds           = application.job.rounds || [];
    const currentRoundIdx  = application.currentRound - 1;
    const currentRoundData = rounds[currentRoundIdx];

    const passedEntry = {
      roundNumber: application.currentRound,
      roundTitle:  currentRoundData?.title || currentRoundData?.type || `Round ${application.currentRound}`,
      roundType:   currentRoundData?.type || "other",
      result:      "passed",
      note:        note || "Congratulations! You have been selected.",
      updatedAt:   new Date(),
    };
    const existingIdx = application.roundUpdates.findIndex(
      (r) => r.roundNumber === application.currentRound
    );
    if (existingIdx >= 0) {
      application.roundUpdates[existingIdx] = passedEntry;
    } else {
      application.roundUpdates.push(passedEntry);
    }

    application.status  = "hired";
    application.hiredAt = new Date();
    await application.save();

    const owner         = await User.findById(req.user.id).select("businessProfile");
    const companyName   = resolveCompanyName(application.job, owner);
    const applicantName =
      application.jobseeker?.jobSeekerProfile?.fullName || application.jobseeker?.name;

    sendHiredEmail(
      application.jobseeker.email,
      applicantName,
      application.job.title,
      companyName,
      note
    ).catch(console.error);

    res.json({
      success: true,
      message: `🏆 ${applicantName} has been officially hired! Offer email sent.`,
      application,
    });
  } catch (err) {
    console.error("BUSINESS FINAL SHORTLIST ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to finalise shortlist" });
  }
};

/* =========================================================
   BUSINESS OWNER — REJECT APPLICANT OUTRIGHT
   Works at any pre-decision stage; emails jobseeker.
========================================================= */
exports.businessRejectApplicant = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { reason } = req.body;

    const application = await findBusinessApplication(applicationId, req.user.id);
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    if (["rejected", "hired", "withdrawn"].includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: `Application is already ${application.status}`,
      });
    }

    application.status          = "rejected";
    application.rejectedAt      = new Date();
    application.rejectionReason = reason || "Not selected at this time";
    await application.save();

    const owner         = await User.findById(req.user.id).select("businessProfile");
    const companyName   = resolveCompanyName(application.job, owner);
    const applicantName =
      application.jobseeker?.jobSeekerProfile?.fullName || application.jobseeker?.name;

    sendRejectionEmail(
      application.jobseeker.email,
      applicantName,
      application.job.title,
      companyName,
      reason
    ).catch(console.error);

    res.json({ success: true, message: "Applicant rejected", application });
  } catch (err) {
    console.error("BUSINESS REJECT APPLICANT ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to reject applicant" });
  }
};

/* =========================================================
   BUSINESS OWNER — REJECT AT A SPECIFIC ROUND
   Marks the round as failed and closes the application.
========================================================= */
exports.businessRejectAtRound = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { roundNumber, note } = req.body;

    const application = await findBusinessApplication(applicationId, req.user.id);
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    if (["rejected", "hired", "withdrawn"].includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: `Application is already ${application.status}`,
      });
    }

    const rounds    = application.job.rounds || [];
    const roundIdx  = (roundNumber || application.currentRound) - 1;
    const roundData = rounds[roundIdx];

    const failedEntry = {
      roundNumber: roundNumber || application.currentRound,
      roundTitle:  roundData?.title || roundData?.type || `Round ${roundNumber || application.currentRound}`,
      roundType:   roundData?.type || "other",
      result:      "failed",
      note:        note || "",
      updatedAt:   new Date(),
    };
    const existingIdx = application.roundUpdates.findIndex(
      (r) => r.roundNumber === failedEntry.roundNumber
    );
    if (existingIdx >= 0) {
      application.roundUpdates[existingIdx] = failedEntry;
    } else {
      application.roundUpdates.push(failedEntry);
    }

    application.status          = "rejected";
    application.rejectedAt      = new Date();
    application.rejectionReason = note || `Did not pass ${failedEntry.roundTitle}`;
    await application.save();

    const owner         = await User.findById(req.user.id).select("businessProfile");
    const companyName   = resolveCompanyName(application.job, owner);
    const applicantName =
      application.jobseeker?.jobSeekerProfile?.fullName || application.jobseeker?.name;

    sendRoundRejectedEmail(
      application.jobseeker.email,
      applicantName,
      application.job.title,
      companyName,
      failedEntry.roundTitle,
      note
    ).catch(console.error);

    res.json({ success: true, message: "Applicant rejected at this round", application });
  } catch (err) {
    console.error("BUSINESS REJECT AT ROUND ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to reject at round" });
  }
};

/* =========================================================
   BUSINESS OWNER — UPDATE INTERNAL NOTES / RATING
   No email needed; internal only.
========================================================= */
exports.businessUpdateApplicationNotes = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { internalNotes, recruiterRating } = req.body;

    const application = await Application.findOneAndUpdate(
      { _id: applicationId, business: req.user.id },
      {
        $set: {
          ...(internalNotes   !== undefined && { internalNotes }),
          ...(recruiterRating !== undefined && { recruiterRating }),
        },
      },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    res.json({ success: true, message: "Notes updated", application });
  } catch (err) {
    console.error("BUSINESS UPDATE NOTES ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to update notes" });
  }
};