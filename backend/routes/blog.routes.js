const router = require("express").Router();

const {
  createBlog,
  getBlogs,
  getPublishedBlogs,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
  uploadBlogThumbnail,
} = require("../controllers/blog.controller");

const protect = require("../middleware/auth");
const authorizeRoles = require("../middleware/role");
const uploadBlogImage = require("../middleware/uploadBlogImage");

// Public routes
router.get("/", getPublishedBlogs);
router.get("/:slug", getBlogBySlug);

// Admin-only routes
router.get("/admin/all", protect, authorizeRoles("admin"), getBlogs);
router.post("/", protect, authorizeRoles("admin"), createBlog);
router.put("/:id", protect, authorizeRoles("admin"), updateBlog);
router.delete("/:id", protect, authorizeRoles("admin"), deleteBlog);
router.post("/upload-thumbnail", protect, authorizeRoles("admin"), uploadBlogImage.single("thumbnail"), uploadBlogThumbnail);

module.exports = router;