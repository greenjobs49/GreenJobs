const router  = require("express").Router();
const auth    = require("../middleware/auth");
const role    = require("../middleware/role");

const uploadResume = require("../middleware/uploadResume");
const uploadImage  = require("../middleware/uploadImage");
const uploadLogo   = require("../middleware/uploadLogo");

const {
  completeProfile,
  getMyProfile,
  uploadResume: uploadResumeCtrl,
  uploadLogo: uploadLogoCtrl,
  uploadBusinessImages,
  getPendingBusinesses,
  approveBusiness,
  rejectBusiness,
  getApprovedBusinesses,
  linkRecruiterToBusiness,
  unlinkRecruiterBusiness,
  requestBusinessLink,
  getPendingRecruiters,
  approveRecruiterLink,
  rejectRecruiterLink,
  getLinkedRecruiters,
  removeRecruiterFromBusiness,
  getLinkedBusinessDetails,
  requestVerification,          // ← NEW
} = require("../controllers/profile.controller");

// ── Core profile ────────────────────────────────────────────
router.post("/complete", auth, completeProfile);
router.get("/me",        auth, getMyProfile);

// ── File uploads ────────────────────────────────────────────
router.post("/upload-resume",          auth, role("jobseeker"), uploadResume.single("resume"), uploadResumeCtrl);
router.post("/upload-logo",            auth, role("recruiter"), uploadLogo.single("logo"),     uploadLogoCtrl);
router.post("/upload-business-images", auth, role("business"),  uploadImage.array("images", 5), uploadBusinessImages);

// ── Admin business approval ─────────────────────────────────
router.get("/business/pending",         auth, role("admin"), getPendingBusinesses);
router.patch("/business/approve/:id",   auth, role("admin"), approveBusiness);
router.patch("/business/reject/:id",    auth, role("admin"), rejectBusiness);
router.get("/business/approved",        getApprovedBusinesses);           // public

// ── Recruiter verification  ← NEW ──────────────────────────
// POST /api/profile/recruiter/request-verification
router.post(
  "/recruiter/request-verification",
  auth,
  role("recruiter"),
  requestVerification
);

// ── Recruiter ↔ Business linking (kept for backward compat) ─
router.post("/recruiter/request-business",         auth, role("recruiter"), requestBusinessLink);
router.get("/recruiter/pending-requests",          auth, role("recruiter"), getPendingRecruiters);
router.post("/recruiter/link-business",            auth, role("recruiter"), linkRecruiterToBusiness);
router.post("/recruiter/unlink-business",          auth, role("recruiter"), unlinkRecruiterBusiness);
router.get("/recruiter/linked-business-details",   auth, role("recruiter"), getLinkedBusinessDetails);

// ── Business owner — recruiter management ───────────────────
router.get("/business/pending-recruiters",             auth, role("business"), getPendingRecruiters);
router.get("/business/linked-recruiters",              auth, role("business"), getLinkedRecruiters);
router.patch("/business/approve-recruiter/:requestId", auth, role("business"), approveRecruiterLink);
router.patch("/business/reject-recruiter/:requestId",  auth, role("business"), rejectRecruiterLink);
router.post("/business/remove-recruiter/:recruiterId", auth, role("business"), removeRecruiterFromBusiness);

module.exports = router;