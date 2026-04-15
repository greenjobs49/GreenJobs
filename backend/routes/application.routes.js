const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const authorizeRoles = require("../middleware/role");

// ── Recruiter / jobseeker / admin controllers ────────────────
const {
  submitApplication,
  getMyApplications,
  withdrawApplication,
  getRecruiterApplications,
  getApplicationDetail,
  shortlistApplicant,
  proceedToNextRound,
  finalShortlist,
  updateRoundResult,
  rejectApplicant,
  updateApplicationNotes,
  getAllApplications,
  checkApplied,
} = require("../controllers/application.controller");

// ── Business owner application controllers ───────────────────
const {
  getBusinessOwnApplications,
  getBusinessApplicationDetail,
  businessShortlistApplicant,
  businessProceedToNextRound,
  businessFinalShortlist,
  businessRejectApplicant,
  businessRejectAtRound,
  businessUpdateApplicationNotes,
} = require("../controllers/businessApplication.controller");

// ─────────────────────────────────────────────────────────────
// CRITICAL: All fixed-path routes MUST come before /:applicationId
// Express matches top-to-bottom — a wildcard param like /:applicationId
// will swallow any fixed segment registered after it.
// ─────────────────────────────────────────────────────────────

// ── Jobseeker ─────────────────────────────────────────────────
router.post(
  "/",
  protect,
  authorizeRoles("jobseeker"),
  submitApplication
);

router.get(
  "/my",
  protect,
  authorizeRoles("jobseeker"),
  getMyApplications
);

// /check/:jobId must be before /:applicationId
router.get(
  "/check/:jobId",
  protect,
  authorizeRoles("jobseeker"),
  checkApplied
);

router.patch(
  "/:applicationId/withdraw",
  protect,
  authorizeRoles("jobseeker"),
  withdrawApplication
);

// ── Recruiter — fixed paths first ─────────────────────────────
router.get(
  "/recruiter",
  protect,
  authorizeRoles("recruiter"),
  getRecruiterApplications
);

// ── Business Owner — fixed paths (all before /:applicationId) ─
router.get(
  "/business/own",
  protect,
  authorizeRoles("business"),
  getBusinessOwnApplications
);

// ── Admin — fixed paths MUST come before /:applicationId ──────
router.get(
  "/admin/all",
  protect,
  authorizeRoles("admin"),
  getAllApplications
);

// ── Wildcard param route — registered LAST among GETs ─────────
// Recruiter views a single application → auto-advances applied → under_review
router.get(
  "/:applicationId",
  protect,
  authorizeRoles("recruiter", "admin"),
  getApplicationDetail
);

// Business owner views a single application → auto-advances applied → under_review
router.get(
  "/:applicationId/business-detail",
  protect,
  authorizeRoles("business"),
  getBusinessApplicationDetail
);

// ── Recruiter PATCH actions ───────────────────────────────────
router.patch(
  "/:applicationId/shortlist",
  protect,
  authorizeRoles("recruiter"),
  shortlistApplicant
);

router.patch(
  "/:applicationId/next-round",
  protect,
  authorizeRoles("recruiter"),
  proceedToNextRound
);

router.patch(
  "/:applicationId/final-shortlist",
  protect,
  authorizeRoles("recruiter"),
  finalShortlist
);

// kept for backwards compatibility with any existing frontend calls
router.patch(
  "/:applicationId/round-result",
  protect,
  authorizeRoles("recruiter"),
  updateRoundResult
);

router.patch(
  "/:applicationId/reject",
  protect,
  authorizeRoles("recruiter"),
  rejectApplicant
);

router.patch(
  "/:applicationId/notes",
  protect,
  authorizeRoles("recruiter"),
  updateApplicationNotes
);

// ── Business Owner PATCH actions ──────────────────────────────
// Full hiring pipeline mirroring the recruiter flow above,
// but scoped to jobs where business === req.user.id.

router.patch(
  "/:applicationId/business-shortlist",
  protect,
  authorizeRoles("business"),
  businessShortlistApplicant
);

router.patch(
  "/:applicationId/business-next-round",
  protect,
  authorizeRoles("business"),
  businessProceedToNextRound
);

router.patch(
  "/:applicationId/business-final-shortlist",
  protect,
  authorizeRoles("business"),
  businessFinalShortlist
);

router.patch(
  "/:applicationId/business-reject",
  protect,
  authorizeRoles("business"),
  businessRejectApplicant
);

// Reject at a specific round with round-failed email
router.patch(
  "/:applicationId/business-reject-round",
  protect,
  authorizeRoles("business"),
  businessRejectAtRound
);

router.patch(
  "/:applicationId/business-notes",
  protect,
  authorizeRoles("business"),
  businessUpdateApplicationNotes
);

module.exports = router;