const User = require("../models/User");

// ── helper ────────────────────────────────────────────────────────────────────
const toResult = (c, admin = false) => ({
  _id:            c._id,
  name:           c.businessProfile?.businessName || c.name,
  // Priority: admin-chosen logo → first business image → profile picture → null
  logoUrl:        c.businessProfile?.featuredLogoUrl
                  || c.businessProfile?.images?.[0]
                  || c.profilePicture
                  || null,
  // All S3 images available for admin to choose from
  availableImages: admin
    ? [
        ...( c.businessProfile?.images   || [] ),
        ...( c.profilePicture ? [c.profilePicture] : [] ),
      ].filter(Boolean)
    : undefined,
  order:          c.businessProfile?.featuredOrder ?? 0,
  isFeatured:     c.businessProfile?.isFeatured    ?? false,
  status:         c.businessProfile?.status,
  category:       c.businessProfile?.category,
});

// ── Public — homepage ─────────────────────────────────────────────────────────
exports.getTopCompanies = async (req, res) => {
  try {
    const companies = await User.find({
      role: "business",
      "businessProfile.status":     "approved",
      "businessProfile.isFeatured": true,
    })
      .select("name businessProfile profilePicture")
      .sort({ "businessProfile.featuredOrder": 1, createdAt: 1 });

    res.json({ success: true, companies: companies.map(c => toResult(c)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch companies" });
  }
};

// ── Admin — all businesses with featured meta ─────────────────────────────────
exports.getAllTopCompanies = async (req, res) => {
  try {
    const companies = await User.find({ role: "business" })
      .select("name businessProfile profilePicture")
      .sort({ "businessProfile.featuredOrder": 1, createdAt: -1 });

    res.json({ success: true, companies: companies.map(c => toResult(c, true)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch companies" });
  }
};

// ── Admin — update one company (toggle featured, set order, pick logo) ────────
// PATCH /api/top-companies/:id
// Body: { isFeatured, order, featuredLogoUrl }
//   featuredLogoUrl = one of the existing S3 URLs already on the business profile
exports.updateTopCompany = async (req, res) => {
  try {
    const { isFeatured, order, featuredLogoUrl } = req.body;

    const user = await User.findOne({ _id: req.params.id, role: "business" });
    if (!user) return res.status(404).json({ success: false, message: "Business not found" });

    if (isFeatured !== undefined)
      user.businessProfile.isFeatured = isFeatured === "true" || isFeatured === true;

    if (order !== undefined)
      user.businessProfile.featuredOrder = parseInt(order, 10);

    // featuredLogoUrl must already exist on the business (images[] or profilePicture)
    // We validate it is one of the known S3 URLs so admins can't inject arbitrary URLs
    if (featuredLogoUrl !== undefined) {
      const allowed = [
        ...(user.businessProfile?.images || []),
        user.profilePicture,
      ].filter(Boolean);

      if (featuredLogoUrl === "" || allowed.includes(featuredLogoUrl)) {
        user.businessProfile.featuredLogoUrl = featuredLogoUrl;
      } else {
        return res.status(400).json({
          success: false,
          message: "featuredLogoUrl must be one of the business's existing images",
        });
      }
    }

    await user.save();

    res.json({ success: true, message: "Updated", company: toResult(user, true) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to update" });
  }
};

// ── Admin — batch save order + featured for all companies at once ─────────────
// POST /api/top-companies/batch
// Body: { updates: [{ id, isFeatured, order, featuredLogoUrl }] }
exports.batchUpdateTopCompanies = async (req, res) => {
  try {
    const { updates } = req.body;
    if (!Array.isArray(updates) || updates.length === 0)
      return res.status(400).json({ success: false, message: "updates array required" });

    const ops = updates.map(({ id, isFeatured, order, featuredLogoUrl }) => ({
      updateOne: {
        filter: { _id: id, role: "business" },
        update: {
          $set: {
            ...(isFeatured     !== undefined && { "businessProfile.isFeatured":     isFeatured }),
            ...(order          !== undefined && { "businessProfile.featuredOrder":  parseInt(order, 10) }),
            ...(featuredLogoUrl !== undefined && { "businessProfile.featuredLogoUrl": featuredLogoUrl }),
          },
        },
      },
    }));

    await User.bulkWrite(ops);
    res.json({ success: true, message: `${updates.length} companies updated` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Batch update failed" });
  }
};