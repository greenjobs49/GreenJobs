import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import axiosInstance from "axios";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import Navbar from "../../../components/common/Navbar";
import { ArrowLeft, Image, Upload, Settings, Globe, ChevronRight, Loader2, Sparkles, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import API_BASE_URL from "../../../config/api";

export default function EditBlog() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    thumbnail: "",
    status: "draft",
  });

  const [content, setContent] = useState("");

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(
        `${API_BASE_URL}/api/blogs/admin/all`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const blogs = res.data;
      const blog = blogs.find((b) => b._id === id);

      if (!blog) {
        toast.error("Blog post not found");
        navigate("/admin/blogs");
        return;
      }

      setForm({
        title: blog.title || "",
        thumbnail: blog.thumbnail || "",
        status: blog.status || "draft",
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
  }, [id, token]);

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("thumbnail", file);

    try {
      setUploading(true);
      const res = await axiosInstance.post(`${API_BASE_URL}/api/blogs/upload-thumbnail`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        }
      });
      setForm(prev => ({ ...prev, thumbnail: res.data.url }));
      toast.success("Thumbnail uploaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Thumbnail upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!content.trim()) {
      toast.error("Content is required");
      return;
    }

    try {
      setSaving(true);
      await axiosInstance.put(
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
      ["clean"]
    ]
  };

  const formats = [
    "header", "bold", "italic", "underline", "strike", "blockquote",
    "list", "bullet", "link", "image"
  ];

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Loader2 className="animate-spin text-emerald-500 mb-4" size={40} />
          <p className="text-slate-600 font-semibold">Loading blog details...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        
        .create-blog-page { font-family: 'Inter', sans-serif; background: #f8fafc; min-height: 100vh; padding-bottom: 80px; }
        
        .cb-container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
        
        .cb-top-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; flex-wrap: wrap; gap: 16px; }
        
        .cb-breadcrumbs { display: flex; items-center; gap: 8px; font-size: 13px; font-weight: 600; color: #64748b; margin-bottom: 8px; }
        .cb-breadcrumbs a { color: #64748b; text-decoration: none; transition: color 0.2s; }
        .cb-breadcrumbs a:hover { color: #10b981; }
        
        .cb-page-title {
          font-family: 'Outfit', sans-serif; font-size: 32px; font-weight: 800; color: #0f172a;
          display: flex; align-items: center; gap: 12px; letter-spacing: -0.5px;
        }
        
        .cb-back-btn {
          display: inline-flex; align-items: center; gap: 8px; background: white; border: 1px solid #e2e8f0;
          padding: 10px 20px; border-radius: 12px; font-size: 14px; font-weight: 700; color: #334155;
          text-decoration: none; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .cb-back-btn:hover { background: #f1f5f9; border-color: #cbd5e1; transform: translateY(-1px); }
        
        .cb-grid { display: grid; grid-template-columns: 1fr; gap: 32px; }
        @media (min-width: 1024px) { .cb-grid { grid-template-columns: 2fr 1fr; } }
        
        .cb-card {
          background: white; border-radius: 20px; border: 1px solid #e2e8f0;
          box-shadow: 0 10px 30px rgba(0,0,0,0.03); overflow: hidden; margin-bottom: 32px;
        }
        
        .cb-card-header {
          padding: 24px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 12px;
        }
        .cb-card-title { font-family: 'Outfit', sans-serif; font-size: 18px; font-weight: 700; color: #0f172a; margin: 0; }
        .cb-card-icon { color: #94a3b8; }
        
        .cb-card-body { padding: 32px 24px; }
        
        .cb-form-group { margin-bottom: 24px; }
        .cb-form-group:last-child { margin-bottom: 0; }
        
        .cb-label {
          display: block; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;
          letter-spacing: 0.05em; margin-bottom: 10px;
        }
        
        .cb-input {
          width: 100%; padding: 14px 16px; background: #f8fafc; border: 1px solid #e2e8f0;
          border-radius: 12px; font-size: 15px; color: #0f172a; font-family: 'Inter', sans-serif;
          transition: all 0.2s; outline: none; box-sizing: border-box;
        }
        .cb-input:focus {
          background: white; border-color: #34d399; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }
        .cb-input::placeholder { color: #94a3b8; }
        
        .cb-title-input { font-size: 24px; font-family: 'Outfit', sans-serif; font-weight: 700; padding: 16px 20px; }
        
        /* React Quill Customization */
        .quill { border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; display: flex; flex-direction: column; background: #f8fafc; }
        .ql-toolbar.ql-snow { border: none !important; border-bottom: 1px solid #e2e8f0 !important; background: white; padding: 12px !important; }
        .ql-container.ql-snow { border: none !important; background: white; min-height: 400px; font-family: 'Inter', sans-serif; font-size: 16px; }
        .ql-editor { min-height: 400px; padding: 24px; line-height: 1.6; }
        .quill:focus-within { border-color: #34d399; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1); }
        
        .cb-slug-wrap { display: flex; align-items: stretch; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; transition: all 0.2s; }
        .cb-slug-wrap:focus-within { border-color: #34d399; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1); }
        .cb-slug-prefix { background: #f1f5f9; padding: 14px 16px; color: #64748b; font-size: 14px; font-weight: 600; border-right: 1px solid #e2e8f0; }
        .cb-slug-input { flex: 1; border: none; padding: 14px 16px; outline: none; background: #f8fafc; font-size: 14px; font-weight: 500; color: #0f172a; }
        .cb-slug-input:focus { background: white; }
        
        .cb-slug-preview { margin-top: 8px; font-size: 12px; color: #94a3b8; }
        .cb-slug-preview span { font-weight: 600; color: #0f172a; }
        
        .cb-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 16px center; background-size: 16px; }
        
        .cb-upload-area {
          border: 2px dashed #cbd5e1; border-radius: 16px; padding: 40px 20px; text-align: center;
          cursor: pointer; transition: all 0.2s; background: #f8fafc;
        }
        .cb-upload-area:hover { border-color: #10b981; background: #f0fdf4; }
        .cb-upload-icon { color: #94a3b8; margin: 0 auto 16px; }
        .cb-upload-area:hover .cb-upload-icon { color: #10b981; transform: translateY(-4px); transition: transform 0.2s; }
        .cb-upload-title { font-size: 15px; font-weight: 700; color: #334155; margin-bottom: 4px; }
        .cb-upload-desc { font-size: 12px; color: #94a3b8; }
        
        .cb-image-preview {
          width: 100%; aspect-ratio: 16/9; border-radius: 12px; overflow: hidden; position: relative; border: 1px solid #e2e8f0;
        }
        .cb-image-preview img { width: 100%; height: 100%; object-fit: cover; }
        .cb-image-overlay {
          position: absolute; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; gap: 12px;
          opacity: 0; transition: opacity 0.2s; backdrop-filter: blur(4px);
        }
        .cb-image-preview:hover .cb-image-overlay { opacity: 1; }
        
        .cb-overlay-btn {
          padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; border: none; font-family: 'Inter', sans-serif;
        }
        .cb-overlay-btn-white { background: white; color: #0f172a; }
        .cb-overlay-btn-white:hover { background: #f1f5f9; }
        .cb-overlay-btn-red { background: #ef4444; color: white; }
        .cb-overlay-btn-red:hover { background: #dc2626; }
        
        .cb-submit-btn {
          width: 100%; padding: 16px; background: linear-gradient(135deg, #10b981, #059669); border: none;
          border-radius: 12px; color: white; font-family: 'Outfit', sans-serif; font-size: 18px; font-weight: 700;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: all 0.2s; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        .cb-submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4); }
        .cb-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
      `}</style>

      <div className="create-blog-page">
        <Navbar />
        
        <div className="cb-container">
          <div className="cb-top-bar">
            <div>
              <div className="cb-breadcrumbs">
                <Link to="/admin/dashboard">Admin</Link>
                <ChevronRight size={14} />
                <Link to="/admin/blogs">Blogs</Link>
                <ChevronRight size={14} />
                <span>Edit Post</span>
              </div>
              <h1 className="cb-page-title">
                <Sparkles size={28} color="#10b981" /> Edit Blog Post
              </h1>
            </div>
            <Link to="/admin/blogs" className="cb-back-btn">
              <ArrowLeft size={16} /> Back to Blogs
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="cb-grid">
            
            <div className="cb-main">
              <div className="cb-card">
                <div className="cb-card-body">
                  <div className="cb-form-group">
                    <label className="cb-label">Post Title</label>
                    <input
                      type="text"
                      className="cb-input cb-title-input"
                      placeholder="Enter a catchy title..."
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                  </div>

                  <div className="cb-form-group">
                    <label className="cb-label">Body Content</label>
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

            <div className="cb-sidebar">
              <div className="cb-card">
                <div className="cb-card-header">
                  <Settings className="cb-card-icon" size={20} />
                  <h3 className="cb-card-title">Publish Options</h3>
                </div>
                <div className="cb-card-body">
                  <div className="cb-form-group">
                    <label className="cb-label">Post Status</label>
                    <select
                      className="cb-input cb-select"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <button type="submit" disabled={saving} className="cb-submit-btn">
                    {saving ? (
                      <><Loader2 className="animate-spin" size={20} /> Updating Post...</>
                    ) : (
                      <>Save Changes <CheckCircle size={20} /></>
                    )}
                  </button>
                </div>
              </div>

              <div className="cb-card">
                <div className="cb-card-header">
                  <Image className="cb-card-icon" size={20} />
                  <h3 className="cb-card-title">Featured Image</h3>
                </div>
                <div className="cb-card-body">
                  <div className="cb-form-group">
                    {form.thumbnail ? (
                      <div className="cb-image-preview">
                        <img src={form.thumbnail} alt="Preview" />
                        <div className="cb-image-overlay">
                          <label className="cb-overlay-btn cb-overlay-btn-white">
                            Change
                            <input type="file" className="hidden" style={{ display: 'none' }} accept="image/*" onChange={handleThumbnailUpload} />
                          </label>
                          <button
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, thumbnail: "" }))}
                            className="cb-overlay-btn cb-overlay-btn-red"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="cb-upload-area">
                        {uploading ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Loader2 className="animate-spin" size={32} color="#10b981" style={{ marginBottom: 12 }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Uploading image...</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="cb-upload-icon" size={36} />
                            <div className="cb-upload-title">Upload featured image</div>
                            <div className="cb-upload-desc">PNG, JPG, WEBP up to 5MB</div>
                          </>
                        )}
                        <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handleThumbnailUpload} disabled={uploading} />
                      </label>
                    )}
                  </div>

                  <div className="cb-form-group">
                    <label className="cb-label">Or enter Image URL</label>
                    <input
                      type="text"
                      className="cb-input"
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