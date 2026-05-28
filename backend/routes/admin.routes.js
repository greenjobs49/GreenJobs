const express = require("express");
const router  = express.Router();

const protect        = require("../middleware/auth");
const authorizeRoles = require("../middleware/role");
const uploadBanner   = require("../middleware/uploadBanner");

const { sendProfileReminders } = require("../controllers/reminderController");

const {
  getStats,
  getPublicStats,
  getUsers,
  getUserById,
  deleteUser,
  getJobs,
  updateJobStatus,
  deleteJob,
  approveBusiness,
  getBusinesses,
  rejectBusiness,
  revokeBusiness,
  getPendingVerificationRecruiters,
  verifyRecruiter,
  createAdmin,
  revokeJob,
  restoreJob,
  getNavbarBanner,
  updateNavbarBanner,
  uploadNavbarBannerImage,
  toggleBannerStatus,
} = require("../controllers/admin.controller");

// ── ADD THIS IMPORT ────────────────────────────────────────────────────────
const {
  getTopCompanies,
  getAllTopCompanies,
  updateTopCompany,
  batchUpdateTopCompanies,
} = require("../controllers/topCompany.controller");

// ── Profile reminders ──────────────────────────────────────────────────────
router.post("/send-profile-reminders", protect, authorizeRoles("admin"), sendProfileReminders);

// ── Stats ──────────────────────────────────────────────────────────────────
router.get("/stats", protect, authorizeRoles("admin"), getStats);
router.get("/stats/public", getPublicStats);

// ── Users ──────────────────────────────────────────────────────────────────
router.get("/users",        protect, authorizeRoles("admin"), getUsers);
router.get("/users/:id",    protect, authorizeRoles("admin"), getUserById);
router.delete("/users/:id", protect, authorizeRoles("admin"), deleteUser);

// ── Jobs ───────────────────────────────────────────────────────────────────
router.get("/jobs",               protect, authorizeRoles("admin"), getJobs);
router.patch("/jobs/:id/status",  protect, authorizeRoles("admin"), updateJobStatus);
router.delete("/jobs/:id",        protect, authorizeRoles("admin"), deleteJob);
router.patch("/jobs/:id/revoke",  protect, authorizeRoles("admin"), revokeJob);
router.patch("/jobs/:id/restore", protect, authorizeRoles("admin"), restoreJob);

// ── Businesses ─────────────────────────────────────────────────────────────
router.get("/businesses",               protect, authorizeRoles("admin"), getBusinesses);
router.patch("/businesses/:id/approve", protect, authorizeRoles("admin"), approveBusiness);
router.patch("/businesses/:id/reject",  protect, authorizeRoles("admin"), rejectBusiness);
router.patch("/businesses/:id/revoke",  protect, authorizeRoles("admin"), revokeBusiness);

// ── Recruiter Verifications ────────────────────────────────────────────────
router.get("/recruiters/pending-verification", protect, authorizeRoles("admin"), getPendingVerificationRecruiters);
router.patch("/recruiters/:id/verify",         protect, authorizeRoles("admin"), verifyRecruiter);

// ── Admin Management ───────────────────────────────────────────────────────
router.post("/create-admin", protect, authorizeRoles("admin"), createAdmin);

// ── Navbar Banner ──────────────────────────────────────────────────────────
router.get("/navbar-banner", getNavbarBanner);

router.post(
  "/navbar-banner/upload",
  protect,
  authorizeRoles("admin"),
  uploadBanner.single("bannerImage"),
  uploadNavbarBannerImage
);

router.put("/navbar-banner",           protect, authorizeRoles("admin"), updateNavbarBanner);
router.patch("/navbar-banner/toggle",  protect, authorizeRoles("admin"), toggleBannerStatus);

// ── Top Companies ──────────────────────────────────────────────────────────
// NOTE: /top-companies/batch and /top-companies/all must come BEFORE
// /top-companies/:id to avoid "batch" and "all" being swallowed as :id param.

// Public — homepage fetches this (no token required)
router.get("/top-companies",        getTopCompanies);

// Admin — get all businesses with featured meta
router.get("/top-companies/all",    protect, authorizeRoles("admin"), getAllTopCompanies);

// Admin — batch save order + featured for all at once
router.post("/top-companies/batch", protect, authorizeRoles("admin"), batchUpdateTopCompanies);

// Admin — update a single company
router.patch("/top-companies/:id",  protect, authorizeRoles("admin"), updateTopCompany);

module.exports = router;