const express        = require("express");
const router         = express.Router();
const protect        = require("../middleware/auth");
const authorizeRoles = require("../middleware/role");
const uploadAdImage  = require("../middleware/uploadAdImage"); // ← add this

const {
  getPublicAds,
  getAllAds,
  createAd,
  updateAd,
  deleteAd,
  toggleAd,
  reorderAds,
} = require("../controllers/ad.controller");

// ── PUBLIC ──────────────────────────────────────────────────
router.get("/", getPublicAds);

// ── ADMIN ───────────────────────────────────────────────────
router.get(   "/admin",              protect, authorizeRoles("admin"), getAllAds);
router.post(  "/admin",              protect, authorizeRoles("admin"), uploadAdImage.single("adImage"), createAd);
router.patch( "/admin/reorder",      protect, authorizeRoles("admin"), reorderAds);
router.patch( "/admin/:id",          protect, authorizeRoles("admin"), uploadAdImage.single("adImage"), updateAd);
router.patch( "/admin/:id/toggle",   protect, authorizeRoles("admin"), toggleAd);
router.delete("/admin/:id",          protect, authorizeRoles("admin"), deleteAd);

module.exports = router;