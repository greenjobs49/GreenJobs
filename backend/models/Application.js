const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    jobseeker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Personal snapshot at time of application
    applicantSnapshot: {
      fullName: String,
      email: String,
      mobile: String,
      city: String,
      education: String,
      experience: String,
      linkedin: String,
      portfolio: String,
    },

    // Skills selected by jobseeker matching the job
    selectedSkills: {
      type: [String],
      default: [],
    },

    coverLetter: {
      type: String,
      default: "", // Makes it optional and defaults to empty string
      maxlength: [2000, "Cover letter cannot exceed 2000 characters"],
    },

    // Resume used for this application (can be their uploaded resume URL)
    resumeUrl: {
      type: String,
      required: [true, "Resume is required to apply"],
    },

    // Overall status
    status: {
      type: String,
      enum: [
        "applied",        // Just submitted
        "under_review",   // Recruiter opened/viewed
        "shortlisted",    // Moving forward
        "round_update",   // Round-level progress
        "rejected",       // Rejected at any stage
        "hired",          // Final offer accepted
        "withdrawn",      // Jobseeker withdrew
      ],
      default: "applied",
    },

    // Round-level tracking
    currentRound: {
      type: Number,
      default: 0, // 0 = not in rounds yet
    },

    roundUpdates: [
      {
        roundNumber: Number,
        roundTitle: String,
        roundType: String,
        result: {
          type: String,
          enum: ["scheduled", "passed", "failed", "pending"],
          default: "scheduled",
        },
        note: String,       // Recruiter note to candidate
        updatedAt: { type: Date, default: Date.now },
      },
    ],

    // Recruiter-facing notes (not shown to applicant)
    internalNotes: {
      type: String,
      maxlength: 1000,
    },

    // Rating (1-5) by recruiter
    recruiterRating: {
      type: Number,
      min: 1,
      max: 5,
    },

    // Timestamps for status changes
    reviewedAt: Date,
    shortlistedAt: Date,
    rejectedAt: Date,
    hiredAt: Date,
    withdrawnAt: Date,

    rejectionReason: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);
applicationSchema.pre("validate", function () {
  if (!this.recruiter && !this.business) {
    this.invalidate(
      "recruiter",
      "Application must belong to either a recruiter or a business"
    );
  }
});
// Compound index: one application per jobseeker per job
applicationSchema.index({ job: 1, jobseeker: 1 }, { unique: true });
applicationSchema.index({ recruiter: 1, status: 1 });
applicationSchema.index({ jobseeker: 1, status: 1 });
applicationSchema.index({ job: 1, status: 1 });

module.exports = mongoose.model("Application", applicationSchema);