const mongoose = require('mongoose');

const recruiterBusinessLinkSchema = new mongoose.Schema({
  recruiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'unlinked', 'removed_by_business'],
    default: 'pending'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  },
  rejectedReason: {
    type: String
  },
  unlinkedAt: {
    type: Date
  },
  removedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
recruiterBusinessLinkSchema.index({ recruiter: 1, business: 1 });
recruiterBusinessLinkSchema.index({ status: 1 });

module.exports = mongoose.model('RecruiterBusinessLink', recruiterBusinessLinkSchema);