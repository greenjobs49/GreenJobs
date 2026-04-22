const express = require("express");
const router  = express.Router();

const protect        = require("../middleware/auth");
const authorizeRoles = require("../middleware/role");
const uploadBanner   = require("../middleware/uploadBanner"); // ← must exist at this path

const { sendProfileReminders } = require("../controllers/reminderController");

const {
  getStats,
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

// ── Profile reminders ──────────────────────────────────────────────────────
router.post("/send-profile-reminders", protect, authorizeRoles("admin"), sendProfileReminders);

// ── Stats ──────────────────────────────────────────────────────────────────
router.get("/stats", protect, authorizeRoles("admin"), getStats);

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
// NOTE: specific sub-paths (/upload, /toggle) MUST be defined before any
// parameterised routes to avoid shadowing.

// Public — navbar reads this on every page load, no token required
router.get("/navbar-banner", getNavbarBanner);

// Upload image to S3, returns { imageUrl } — does NOT save to DB yet
router.post(
  "/navbar-banner/upload",
  protect,
  authorizeRoles("admin"),
  uploadBanner.single("bannerImage"),
  uploadNavbarBannerImage
);

// Save banner settings (imageUrl, altText, height, borderRadius) to DB
router.put("/navbar-banner", protect, authorizeRoles("admin"), updateNavbarBanner);

// Toggle isActive on/off
router.patch("/navbar-banner/toggle", protect, authorizeRoles("admin"), toggleBannerStatus);

module.exports = router;