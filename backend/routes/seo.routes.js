const express = require("express");
const router  = express.Router();
const { getPublicSeo } = require("../controllers/seo.controller");

// GET /api/seo/:pageKey — public, no auth required
router.get("/:pageKey", getPublicSeo);

module.exports = router;