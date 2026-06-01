import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import axios from "axios";                          // ← was imported as axiosInstance
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import Navbar from "../../../components/common/Navbar";
import {
  ArrowLeft, Image, Upload, Settings,
  ChevronRight, Loader2, Sparkles, CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import API_BASE_URL from "../../../config/api";

export default function EditBlog() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title:     "",
    thumbnail: "",
    status:    "draft",
  });
  const [content, setContent] = useState("");

  /* ── Fetch blog by id ── */
  const fetchBlog = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/blogs/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const blog = (res.data || []).find((b) => b._id === id);
      if (!blog) {
        toast.error("Blog post not found");
        navigate("/admin/blogs");
        return;
      }

      setForm({
        title:     blog.title     || "",
        thumbnail: blog.thumbnail || "",
        status:    blog.status    || "draft",
      });
      setContent(blog.content || "");
    } catch (err) {
      console.error(err);
      toast.error("Failed to load blog post");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchBlog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  /* ── Thumbnail upload ── */
  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("thumbnail", file);

    try {
      setUploading(true);
      const res = await axios.post(
        `${API_BASE_URL}/api/blogs/upload-thumbnail`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setForm((prev) => ({ ...prev, thumbnail: res.data.url }));
      toast.success("Thumbnail uploaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Thumbnail upload failed");
    } finally {
      setUploading(false);
    }
  };

  /* ── Submit update ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title is required");   return; }
    if (!content.trim())    { toast.error("Content is required"); return; }

    try {
      setSaving(true);
      await axios.put(
        `${API_BASE_URL}/api/blogs/${id}`,
        { ...form, content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Blog post updated successfully");
      navigate("/admin/blogs");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update blog");
    } finally {
      setSaving(false);
    }
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image"],
      ["clean"],
    ],
  };

  const formats = [
    "header", "bold", "italic", "underline", "strike", "blockquote",
    "list", "bullet", "link", "image",
  ];

  /* ── Loading state ── */
  if (loading) {
    return (
      <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
        <Navbar />
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", minHeight: "60vh", textAlign: "center",
        }}>
          <Loader2
            size={40}
            color="#10b981"
            style={{ marginBottom: 16, animation: "eb-spin 1s linear infinite" }}
          />
          <p style={{ color: "#64748b", fontWeight: 600, fontSize: 16 }}>
            Loading blog details...
          </p>
        </div>
        <style>{`@keyframes eb-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');

        .edit-blog-page {
          font-family: 'Inter', sans-serif;
          background: #f8fafc;
          min-height: 100vh;
          padding-bottom: 80px;
        }

        .eb-container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }

        .eb-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .eb-breadcrumbs {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 8px;
        }
        .eb-breadcrumbs a { color: #64748b; text-decoration: none; transition: color 0.2s; }
        .eb-breadcrumbs a:hover { color: #10b981; }

        .eb-page-title {
          font-family: 'Outfit', sans-serif;
          font-size: 32px;
          font-weight: 800;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 12px;
          letter-spacing: -0.5px;
          margin: 0;
        }

        .eb-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: white;
          border: 1px solid #e2e8f0;
          padding: 10px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          color: #334155;
          text-decoration: none;
          transition: all 0.2s;
        }
        .eb-back-btn:hover { background: #f1f5f9; border-color: #cbd5e1; transform: translateY(-1px); }

        /* 2-column grid */
        .eb-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
          align-items: start;
        }
        @media (min-width: 1024px) {
          .eb-grid { grid-template-columns: 2fr 1fr; }
        }

        .eb-main    { display: flex; flex-direction: column; gap: 0; }
        .eb-sidebar { display: flex; flex-direction: column; gap: 0; }

        .eb-card {
          background: white;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 30px rgba(0,0,0,0.03);
          overflow: hidden;
          margin-bottom: 24px;
        }

        .eb-card-header {
          padding: 20px 24px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .eb-card-title {
          font-family: 'Outfit', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }
        .eb-card-icon { color: #94a3b8; }

        .eb-card-body { padding: 24px; }

        .eb-form-group { margin-bottom: 20px; }
        .eb-form-group:last-child { margin-bottom: 0; }

        .eb-label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }

        .eb-input {
          width: 100%;
          padding: 12px 16px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          font-size: 15px;
          color: #0f172a;
          font-family: 'Inter', sans-serif;
          transition: all 0.2s;
          outline: none;
          box-sizing: border-box;
        }
        .eb-input:focus {
          background: white;
          border-color: #34d399;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }
        .eb-input::placeholder { color: #94a3b8; }

        .eb-title-input {
          font-size: 22px;
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          padding: 14px 18px;
        }

        /* Quill */
        .quill {
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          background: #f8fafc;
        }
        .ql-toolbar.ql-snow {
          border: none !important;
          border-bottom: 1px solid #e2e8f0 !important;
          background: white;
          padding: 10px !important;
          flex-shrink: 0;
        }
        .ql-container.ql-snow {
          border: none !important;
          background: white;
          font-family: 'Inter', sans-serif;
          font-size: 15px;
        }
        .ql-editor { min-height: 380px; padding: 20px; line-height: 1.7; }
        .quill:focus-within { border-color: #34d399; box-shadow: 0 0 0 4px rgba(16,185,129,0.1); }

        .eb-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          background-size: 16px;
          cursor: pointer;
        }

        .eb-upload-area {
          border: 2px dashed #cbd5e1;
          border-radius: 14px;
          padding: 32px 16px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: #f8fafc;
          display: block;
        }
        .eb-upload-area:hover { border-color: #10b981; background: #f0fdf4; }
        .eb-upload-icon { color: #94a3b8; margin: 0 auto 12px; display: block; transition: all 0.2s; }
        .eb-upload-area:hover .eb-upload-icon { color: #10b981; transform: translateY(-3px); }
        .eb-upload-title { font-size: 14px; font-weight: 700; color: #334155; margin-bottom: 4px; }
        .eb-upload-desc  { font-size: 12px; color: #94a3b8; }

        .eb-image-preview {
          width: 100%;
          aspect-ratio: 16/9;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
          border: 1px solid #e2e8f0;
        }
        .eb-image-preview img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .eb-image-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          opacity: 0;
          transition: opacity 0.2s;
          backdrop-filter: blur(3px);
        }
        .eb-image-preview:hover .eb-image-overlay { opacity: 1; }

        .eb-overlay-btn {
          padding: 7px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          font-family: 'Inter', sans-serif;
          transition: background 0.15s;
        }
        .eb-overlay-btn-white { background: white; color: #0f172a; }
        .eb-overlay-btn-white:hover { background: #f1f5f9; }
        .eb-overlay-btn-red { background: #ef4444; color: white; }
        .eb-overlay-btn-red:hover { background: #dc2626; }

        .eb-submit-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #10b981, #059669);
          border: none;
          border-radius: 12px;
          color: white;
          font-family: 'Outfit', sans-serif;
          font-size: 17px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        .eb-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
        }
        .eb-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        @keyframes eb-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: eb-spin 1s linear infinite; }
      `}</style>

      <div className="edit-blog-page">
        <Navbar />

        <div className="eb-container">
          <div className="eb-top-bar">
            <div>
              <div className="eb-breadcrumbs">
                <Link to="/admin/dashboard">Admin</Link>
                <ChevronRight size={14} />
                <Link to="/admin/blogs">Blogs</Link>
                <ChevronRight size={14} />
                <span>Edit Post</span>
              </div>
              <h1 className="eb-page-title">
                 Edit Blog Post
              </h1>
            </div>
            <Link to="/admin/blogs" className="eb-back-btn">
              <ArrowLeft size={16} /> Back to Blogs
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="eb-grid">

            {/* ── Main column ── */}
            <div className="eb-main">
              <div className="eb-card">
                <div className="eb-card-body">
                  <div className="eb-form-group">
                    <label className="eb-label">Post Title</label>
                    <input
                      type="text"
                      className="eb-input eb-title-input"
                      placeholder="Enter a catchy title..."
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                  </div>

                  <div className="eb-form-group">
                    <label className="eb-label">Body Content</label>
                    <ReactQuill
                      theme="snow"
                      modules={modules}
                      formats={formats}
                      value={content}
                      onChange={setContent}
                      placeholder="Write your story here..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Sidebar column ── */}
            <div className="eb-sidebar">

              {/* Publish Options */}
              <div className="eb-card">
                <div className="eb-card-header">
                  <Settings className="eb-card-icon" size={20} />
                  <h3 className="eb-card-title">Publish Options</h3>
                </div>
                <div className="eb-card-body">
                  <div className="eb-form-group">
                    <label className="eb-label">Post Status</label>
                    <select
                      className="eb-input eb-select"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <button type="submit" disabled={saving} className="eb-submit-btn">
                    {saving ? (
                      <><Loader2 className="animate-spin" size={18} /> Updating Post...</>
                    ) : (
                      <>Save Changes <CheckCircle size={18} /></>
                    )}
                  </button>
                </div>
              </div>

              {/* Featured Image */}
              <div className="eb-card">
                <div className="eb-card-header">
                  <Image className="eb-card-icon" size={20} />
                  <h3 className="eb-card-title">Featured Image</h3>
                </div>
                <div className="eb-card-body">
                  <div className="eb-form-group">
                    {form.thumbnail ? (
                      <div className="eb-image-preview">
                        <img src={form.thumbnail} alt="Preview" />
                        <div className="eb-image-overlay">
                          <label className="eb-overlay-btn eb-overlay-btn-white">
                            Change
                            <input
                              type="file"
                              style={{ display: "none" }}
                              accept="image/*"
                              onChange={handleThumbnailUpload}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, thumbnail: "" }))}
                            className="eb-overlay-btn eb-overlay-btn-red"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="eb-upload-area">
                        {uploading ? (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <Loader2
                              className="animate-spin"
                              size={30}
                              color="#10b981"
                              style={{ marginBottom: 10 }}
                            />
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>
                              Uploading image...
                            </span>
                          </div>
                        ) : (
                          <>
                            <Upload className="eb-upload-icon" size={32} />
                            <div className="eb-upload-title">Upload featured image</div>
                            <div className="eb-upload-desc">PNG, JPG, WEBP up to 5MB</div>
                          </>
                        )}
                        <input
                          type="file"
                          style={{ display: "none" }}
                          accept="image/*"
                          onChange={handleThumbnailUpload}
                          disabled={uploading}
                        />
                      </label>
                    )}
                  </div>

                  <div className="eb-form-group">
                    <label className="eb-label">Or enter Image URL</label>
                    <input
                      type="text"
                      className="eb-input"
                      placeholder="https://example.com/image.jpg"
                      value={form.thumbnail}
                      onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                    />
                  </div>
                </div>
              </div>

            </div>
          </form>
        </div>
      </div>
    </>
  );
}