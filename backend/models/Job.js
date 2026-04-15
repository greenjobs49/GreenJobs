const mongoose = require('mongoose');

const roundSchema = new mongoose.Schema({
  order: { type: Number, required: true },
  type: {
    type: String,
    enum: [
      'resume_screening', 'online_test', 'aptitude_test',
      'technical_interview', 'hr_interview', 'group_discussion',
      'assignment', 'final_interview', 'offer', 'other'
    ],
    default: 'other'
  },
  title:       { type: String, trim: true, default: '' },
  description: { type: String, trim: true, default: '' },
  duration:    { type: String, trim: true, default: '' },
}, { _id: true });

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Job title is required"],
    trim: true,
    minlength: [3, "Title must be at least 3 characters"]
  },
  company: String,
  description: {
    type: String,
    required: [true, "Job description is required"],
    minlength: [50, "Description must be at least 50 characters"]
  },
  location: {
    type: String,
    required: [true, "Location is required"]
  },
  salary: String,
  type: {
    type: String,
    enum: ['Full Time', 'Part Time', 'Contract', 'Internship', 'Remote', 'Freelance'],
    default: 'Full Time'
  },
  skills: [{ type: String, trim: true }],

  // ── Compensation ─────────────────────────────────────────────────────────
  isPaid:        { type: Boolean, default: true },
  stipend:       { type: String, trim: true, default: '' },
  stipendPeriod: {
    type: String,
    enum: ['monthly', 'yearly', 'weekly', 'hourly', 'project', ''],
    default: 'monthly'
  },

  // ── Open / Closed toggle ──────────────────────────────────────────────────
  isOpen:   { type: Boolean, default: true },
  closedAt: Date,

  // ── Hiring pipeline ───────────────────────────────────────────────────────
  rounds: [roundSchema],

  // ── Relations ─────────────────────────────────────────────────────────────
  // For recruiter-posted jobs
  recruiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // Legacy: recruiter linked to a business
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null,
  },

  // ── Business-owner-posted jobs ────────────────────────────────────────────
  // When a business owner posts directly, this flag is true and
  // businessOwner holds their User _id (same as `business` conceptually,
  // but kept separate so existing recruiter queries are unaffected).
  postedByBusiness: { type: Boolean, default: false },
  businessOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['pending_business', 'approved', 'rejected_business', 'taken_down', 'revoked'],
    default: 'pending_business'
  },
  approvedAt:     Date,
  rejectedAt:     Date,
  rejectedReason: String,
  takenDownAt:    Date,
}, {
  timestamps: true
});

// ── Indexes ───────────────────────────────────────────────────────────────────
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ status: 1, isOpen: 1, createdAt: -1 });
jobSchema.index({ skills: 1 });
jobSchema.index({ businessOwner: 1, postedByBusiness: 1 });
jobSchema.index({ recruiter: 1 });

module.exports = mongoose.model('Job', jobSchema);