const express = require("express");
const router = express.Router();

const protect        = require("../middleware/auth");
const authorizeRoles = require("../middleware/role");
const { sendProfileReminders } = require("../controllers/reminderController");

router.post(
  "/send-profile-reminders",
  protect,
  authorizeRoles("admin"),
  sendProfileReminders
);
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
  createAdmin            
} = require("../controllers/admin.controller");

// ── Stats ──────────────────────────────────────────────────
router.get("/stats", protect, authorizeRoles("admin"), getStats);

// ── Users ──────────────────────────────────────────────────
router.get("/users",        protect, authorizeRoles("admin"), getUsers);
router.get("/users/:id",    protect, authorizeRoles("admin"), getUserById);
router.delete("/users/:id", protect, authorizeRoles("admin"), deleteUser);

// ── Jobs ───────────────────────────────────────────────────
router.get("/jobs",              protect, authorizeRoles("admin"), getJobs);
router.patch("/jobs/:id/status", protect, authorizeRoles("admin"), updateJobStatus);
router.delete("/jobs/:id",       protect, authorizeRoles("admin"), deleteJob);

// ── Businesses ─────────────────────────────────────────────
router.get("/businesses",               protect, authorizeRoles("admin"), getBusinesses);
router.patch("/businesses/:id/approve", protect, authorizeRoles("admin"), approveBusiness);
router.patch("/businesses/:id/reject",  protect, authorizeRoles("admin"), rejectBusiness);
router.patch("/businesses/:id/revoke",  protect, authorizeRoles("admin"), revokeBusiness);

// ── Recruiter Verifications ← NEW ──────────────────────────
// GET  /api/admin/recruiters/pending-verification  → list all pending
// PATCH /api/admin/recruiters/:id/verify           → approve or reject
router.get(
  "/recruiters/pending-verification",
  protect,
  authorizeRoles("admin"),
  getPendingVerificationRecruiters
);
router.patch(
  "/recruiters/:id/verify",
  protect,
  authorizeRoles("admin"),
  verifyRecruiter
);
router.post("/create-admin", protect, authorizeRoles("admin"), createAdmin);
module.exports = router;