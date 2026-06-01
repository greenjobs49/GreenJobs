import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../../../components/common/Navbar";
import { Edit2, Trash2, Plus, Search, FileText, ChevronRight, LayoutGrid, List, Eye, Sparkles, Image } from "lucide-react";
import toast from "react-hot-toast";
import API_BASE_URL from "../../../config/api";
import { useAuth } from "../../../context/AuthContext";

export default function AdminBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list");

  const { token } = useAuth();

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/blogs/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBlogs(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load blog posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const deleteBlog = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/blogs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Blog post deleted successfully");
      fetchBlogs();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete blog post");
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      published: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0", dot: "#10b981", label: "Published" },
      draft: { bg: "#fffbeb", color: "#b45309", border: "#fde68a", dot: "#f59e0b", label: "Draft" },
      archived: { bg: "#f1f5f9", color: "#475569", border: "#e2e8f0", dot: "#94a3b8", label: "Archived" }
    };
    const config = configs[status] || configs.draft;
    
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: "6px",
        padding: "4px 10px", borderRadius: "100px", fontSize: "12px",
        fontWeight: "700", backgroundColor: config.bg, color: config.color,
        border: `1px solid ${config.border}`
      }}>
        <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: config.dot }}></span>
        {config.label}
      </span>
    );
  };

  const filteredBlogs = blogs.filter((b) =>
    b.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        
        .admin-blogs-page { font-family: 'Inter', sans-serif; background: #f8fafc; min-height: 100vh; padding-bottom: 80px; }
        
        .ab-container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
        
        .ab-top-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; flex-wrap: wrap; gap: 16px; }
        
        .ab-breadcrumbs { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #64748b; margin-bottom: 8px; }
        .ab-breadcrumbs a { color: #64748b; text-decoration: none; transition: color 0.2s; }
        .ab-breadcrumbs a:hover { color: #10b981; }
        
        .ab-page-title {
          font-family: 'Outfit', sans-serif; font-size: 32px; font-weight: 800; color: #0f172a;
          display: flex; align-items: center; gap: 12px; letter-spacing: -0.5px; margin: 0;
        }
        
        .ab-create-btn {
          display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #10b981, #059669);
          padding: 12px 24px; border-radius: 12px; font-size: 14px; font-weight: 700; color: white;
          text-decoration: none; transition: all 0.2s; box-shadow: 0 4px 12px rgba(16,185,129,0.25);
          font-family: 'Outfit', sans-serif; letter-spacing: 0.2px;
        }
        .ab-create-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(16,185,129,0.35); }
        
        .ab-toolbar {
          background: white; border-radius: 16px; border: 1px solid #e2e8f0; padding: 16px 20px;
          display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.02); flex-wrap: wrap; gap: 16px;
        }
        
        .ab-search { position: relative; width: 100%; max-width: 400px; }
        .ab-search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
        .ab-search-input {
          width: 100%; padding: 12px 16px 12px 48px; background: #f8fafc; border: 1px solid #e2e8f0;
          border-radius: 10px; font-size: 14px; color: #0f172a; outline: none; transition: all 0.2s;
        }
        .ab-search-input:focus { background: white; border-color: #34d399; box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }
        
        .ab-controls { display: flex; align-items: center; gap: 24px; }
        
        .ab-view-toggle {
          display: flex; background: #f1f5f9; padding: 4px; border-radius: 10px; border: 1px solid #e2e8f0;
        }
        .ab-view-btn {
          width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
          border-radius: 8px; border: none; background: transparent; color: #64748b; cursor: pointer; transition: all 0.2s;
        }
        .ab-view-btn.active { background: white; color: #059669; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        
        .ab-count { font-size: 13px; font-weight: 600; color: #64748b; }
        
        /* Table View */
        .ab-table-wrap {
          background: white; border-radius: 16px; border: 1px solid #e2e8f0;
          box-shadow: 0 4px 10px rgba(0,0,0,0.02); overflow: hidden;
        }
        .ab-table { width: 100%; border-collapse: collapse; text-align: left; }
        .ab-table th { padding: 16px 24px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        .ab-table td { padding: 16px 24px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .ab-table tr:last-child td { border-bottom: none; }
        .ab-table tr:hover { background: #f8fafc; }
        
        .td-post-info { display: flex; align-items: center; gap: 16px; }
        .td-thumb { width: 72px; height: 48px; border-radius: 8px; background: #f1f5f9; overflow: hidden; border: 1px solid #e2e8f0; flex-shrink: 0; }
        .td-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .td-thumb-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #cbd5e1; }
        
        .td-title { font-family: 'Outfit', sans-serif; font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 4px; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
        .td-slug { font-size: 12px; color: #94a3b8; font-weight: 500; }
        .td-date { font-size: 13px; color: #475569; font-weight: 600; }
        
        /* Grid View */
        .ab-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
        .ab-grid-card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.02); overflow: hidden; display: flex; flex-direction: column; transition: all 0.2s; }
        .ab-grid-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.06); border-color: #cbd5e1; }
        
        .gc-thumb { width: 100%; aspect-ratio: 16/9; background: #f1f5f9; position: relative; overflow: hidden; }
        .gc-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .gc-status { position: absolute; top: 12px; left: 12px; }
        
        .gc-content { padding: 20px; flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
        .gc-title { font-family: 'Outfit', sans-serif; font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 8px; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .gc-slug { font-size: 12px; color: #94a3b8; margin-bottom: 16px; }
        
        .gc-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 16px; border-top: 1px solid #f1f5f9; }
        .gc-date { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
        
        /* Actions */
        .action-btns { display: flex; align-items: center; gap: 6px; justify-content: flex-end; }
        .action-btn { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; border: none; background: transparent; }
        .action-btn.view { color: #64748b; } .action-btn.view:hover { background: #f1f5f9; color: #0f172a; }
        .action-btn.edit { color: #64748b; } .action-btn.edit:hover { background: #ecfdf5; color: #059669; }
        .action-btn.delete { color: #64748b; } .action-btn.delete:hover { background: #fef2f2; color: #ef4444; }
        
        /* Empty State */
        .ab-empty { background: white; border-radius: 16px; border: 1px solid #e2e8f0; padding: 60px 20px; text-align: center; }
        .ab-empty-icon { width: 80px; height: 80px; background: #f8fafc; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: #94a3b8; }
        .ab-empty-title { font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
        .ab-empty-desc { font-size: 14px; color: #64748b; max-width: 300px; margin: 0 auto 24px; }
      `}</style>

      <div className="admin-blogs-page">
        <Navbar />
        
        <div className="ab-container">
          
          <div className="ab-top-bar">
            <div>
              <div className="ab-breadcrumbs">
                <Link to="/admin/dashboard">Admin</Link>
                <ChevronRight size={14} />
                <span>Blogs</span>
              </div>
              <h1 className="ab-page-title">
                <FileText size={28} color="#10b981" /> Blog Post Management
              </h1>
            </div>
            <Link to="/admin/blogs/new" className="ab-create-btn">
              <Plus size={18} /> Create New Post
            </Link>
          </div>

          <div className="ab-toolbar">
            <div className="ab-search">
              <Search className="ab-search-icon" size={18} />
              <input
                type="text"
                className="ab-search-input"
                placeholder="Search posts by title or slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="ab-controls">
              <div className="ab-view-toggle">
                <button onClick={() => setViewMode("list")} className={`ab-view-btn ${viewMode === "list" ? "active" : ""}`} title="List View">
                  <List size={18} />
                </button>
                <button onClick={() => setViewMode("grid")} className={`ab-view-btn ${viewMode === "grid" ? "active" : ""}`} title="Grid View">
                  <LayoutGrid size={18} />
                </button>
              </div>
              <div className="ab-count">
                Showing {filteredBlogs.length} of {blogs.length}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="ab-empty">
              <div className="ab-empty-icon" style={{ animation: 'spin 2s linear infinite' }}>
                <div style={{ width: 40, height: 40, border: '4px solid #10b981', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
              </div>
              <h3 className="ab-empty-title">Loading Articles</h3>
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="ab-empty">
              <div className="ab-empty-icon"><FileText size={32} /></div>
              <h3 className="ab-empty-title">No blog posts found</h3>
              <p className="ab-empty-desc">
                {searchTerm ? "No posts match your search query." : "You haven't written any blog posts yet."}
              </p>
              {!searchTerm && (
                <Link to="/admin/blogs/new" className="ab-create-btn" style={{ padding: "10px 20px", display: "inline-flex" }}>
                  <Plus size={16} /> Write First Post
                </Link>
              )}
            </div>
          ) : viewMode === "list" ? (
            <div className="ab-table-wrap">
              <div style={{ overflowX: 'auto' }}>
                <table className="ab-table">
                  <thead>
                    <tr>
                      <th>Thumbnail & Title</th>
                      <th>Status</th>
                      <th>Date Created</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBlogs.map((blog) => (
                      <tr key={blog._id}>
                        <td>
                          <div className="td-post-info">
                            <div className="td-thumb">
                              {blog.thumbnail ? (
                                <img src={blog.thumbnail} alt="" />
                              ) : (
                                <div className="td-thumb-placeholder"><Image size={20} /></div>
                              )}
                            </div>
                            <div>
                              <div className="td-title">{blog.title}</div>
                              <div className="td-slug">/blog/{blog.slug}</div>
                            </div>
                          </div>
                        </td>
                        <td>{getStatusBadge(blog.status)}</td>
                        <td className="td-date">
                          {new Date(blog.createdAt).toLocaleDateString(undefined, {
                            month: "short", day: "numeric", year: "numeric",
                          })}
                        </td>
                        <td>
                          <div className="action-btns">
                            <Link to={`/blog/${blog.slug}`} target="_blank" className="action-btn view" title="Preview"><Eye size={18} /></Link>
                            <Link to={`/admin/blogs/edit/${blog._id}`} className="action-btn edit" title="Edit"><Edit2 size={18} /></Link>
                            <button onClick={() => deleteBlog(blog._id, blog.title)} className="action-btn delete" title="Delete"><Trash2 size={18} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="ab-grid">
              {filteredBlogs.map((blog) => (
                <div key={blog._id} className="ab-grid-card">
                  <div className="gc-thumb">
                    {blog.thumbnail ? (
                      <img src={blog.thumbnail} alt="" />
                    ) : (
                      <div className="td-thumb-placeholder"><Image size={32} /></div>
                    )}
                    <div className="gc-status">{getStatusBadge(blog.status)}</div>
                  </div>
                  
                  <div className="gc-content">
                    <div>
                      <div className="gc-title">{blog.title}</div>
                      <div className="gc-slug">/blog/{blog.slug}</div>
                    </div>
                    
                    <div className="gc-footer">
                      <div className="gc-date">
                        {new Date(blog.createdAt).toLocaleDateString(undefined, {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </div>
                      <div className="action-btns">
                        <Link to={`/blog/${blog.slug}`} target="_blank" className="action-btn view"><Eye size={16} /></Link>
                        <Link to={`/admin/blogs/edit/${blog._id}`} className="action-btn edit"><Edit2 size={16} /></Link>
                        <button onClick={() => deleteBlog(blog._id, blog.title)} className="action-btn delete"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
        </div>
      </div>
    </>
  );
}