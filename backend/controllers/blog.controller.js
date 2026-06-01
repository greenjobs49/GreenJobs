const Blog = require("../models/Blog");
const slugify = require("slugify");

// Helper function to generate unique slug
const getUniqueSlug = async (titleOrSlug, excludeId = null) => {
  let slug = slugify(titleOrSlug, { lower: true, strict: true });
  let uniqueSlug = slug;
  let count = 1;
  while (true) {
    const query = { slug: uniqueSlug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const existing = await Blog.findOne(query);
    if (!existing) break;
    uniqueSlug = `${slug}-${count}`;
    count++;
  }
  return uniqueSlug;
};

// @desc    Create a new blog post (Admin Only)
// @route   POST /api/blogs
exports.createBlog = async (req, res) => {
  try {
    const { title, content, thumbnail, status } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const finalSlug = await getUniqueSlug(title);

    const blog = await Blog.create({
      title,
      slug: finalSlug,
      content,
      thumbnail: thumbnail || "",
      status: status || "draft",
      createdBy: req.user._id,
    });

    res.status(201).json(blog);
  } catch (err) {
    console.error("CREATE BLOG ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all blog posts (Admin View - shows draft, published, archived)
// @route   GET /api/blogs/admin/all
exports.getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });
    res.json(blogs);
  } catch (err) {
    console.error("GET ALL BLOGS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all published blog posts (Public View)
// @route   GET /api/blogs
exports.getPublishedBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ status: "published" })
      .populate("createdBy", "name profilePicture")
      .sort({ createdAt: -1 });
    res.json(blogs);
  } catch (err) {
    console.error("GET PUBLISHED BLOGS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get a single blog post by slug (Public/Admin View)
// @route   GET /api/blogs/:slug
exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug })
      .populate("createdBy", "name profilePicture email");

    if (!blog) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    res.json(blog);
  } catch (err) {
    console.error("GET BLOG BY SLUG ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update a blog post (Admin Only)
// @route   PUT /api/blogs/:id
exports.updateBlog = async (req, res) => {
  try {
    const { title, content, thumbnail, status } = req.body;
    
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    const updateData = {
      content,
      thumbnail,
      status
    };

    if (title) {
      updateData.title = title;
      updateData.slug = await getUniqueSlug(title, blog._id);
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    res.json(updatedBlog);
  } catch (err) {
    console.error("UPDATE BLOG ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Delete a blog post (Admin Only)
// @route   DELETE /api/blogs/:id
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    await Blog.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Blog post deleted successfully"
    });
  } catch (err) {
    console.error("DELETE BLOG ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Upload Blog Thumbnail (Admin Only)
// @route   POST /api/blogs/upload-thumbnail
exports.uploadBlogThumbnail = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file uploaded" });
    }
    res.json({ success: true, url: req.file.location, message: "Thumbnail uploaded successfully" });
  } catch (err) {
    console.error("BLOG THUMBNAIL UPLOAD ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};