import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import {
  Search, Calendar, Clock, ArrowRight,
  Share2, Sparkles, BookOpen,
} from "lucide-react";
import toast from "react-hot-toast";
import API_BASE_URL from "../../config/api";

export default function BlogPage() {
  const [blogs,      setBlogs]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${API_BASE_URL}/api/blogs`)
      .then((res) => setBlogs(res.data || []))
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load blog posts");
      })
      .finally(() => setLoading(false));
  }, []);

  /* ── Helpers ── */
  const getReadTime = (html) => {
    if (!html) return "2 min read";
    const words = html.replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length;
    return `${Math.max(1, Math.ceil(words / 200))} min read`;
  };

  // Safe excerpt — strips HTML and trims to desired length
  const getExcerpt = (blog, maxLen = 180) => {
    if (blog.metaDescription) return blog.metaDescription;
    if (!blog.content) return "";
    const plain = blog.content.replace(/<[^>]*>/g, "").trim();
    return plain.length > maxLen ? plain.slice(0, maxLen) + "…" : plain;
  };

  const handleShare = (e, blog) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/blog/${blog.slug}`;
    if (navigator.share) {
      navigator.share({ title: blog.title, text: getExcerpt(blog, 100), url }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  const filteredBlogs = blogs.filter(
    (b) =>
      b.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const featuredPost  = filteredBlogs.length > 0 ? filteredBlogs[0] : null;
  const standardPosts = filteredBlogs.length > 1 ? filteredBlogs.slice(1) : [];

  /* ── Placeholder when no thumbnail ── */
  const NoThumb = ({ size = 40 }) => (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg,#ecfdf5,#d1fae5)",
    }}>
      <BookOpen size={size} color="#6ee7b7" />
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');

        .blog-page { font-family: 'Inter', sans-serif; background: #f8fafc; min-height: 100vh; }

        /* ── Hero ── */
        .blog-hero {
          position: relative;
          background: linear-gradient(160deg, #052e16 0%, #14532d 50%, #166534 100%);
          padding: 80px 20px 100px;
          color: white;
          overflow: hidden;
        }
        .blog-hero::before {
          content: '';
          position: absolute; inset: 0;
          background-image: radial-gradient(circle at 80% 20%, rgba(52,211,153,0.15) 0%, transparent 50%);
          pointer-events: none;
        }

        .hero-content { max-width: 1100px; margin: 0 auto; position: relative; z-index: 10; }

        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(16,185,129,0.2); border: 1px solid rgba(52,211,153,0.3);
          padding: 6px 14px; border-radius: 100px;
          font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 12px;
          color: #6ee7b7; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 22px;
        }

        .hero-title {
          font-family: 'Outfit', sans-serif;
          font-size: 50px; font-weight: 800;
          line-height: 1.1; margin-bottom: 18px;
          max-width: 700px; letter-spacing: -1px;
        }
        .hero-title span {
          background: linear-gradient(to right, #34d399, #10b981);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-desc {
          font-size: 17px; color: #a7f3d0;
          max-width: 580px; line-height: 1.65;
          margin-bottom: 36px; font-weight: 400;
        }

        .search-container { position: relative; max-width: 480px; }
        .search-input {
          width: 100%; padding: 16px 22px 16px 52px;
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
          border-radius: 14px; color: white; font-size: 15px;
          transition: all 0.3s; backdrop-filter: blur(10px); outline: none;
          box-sizing: border-box;
        }
        .search-input::placeholder { color: rgba(255,255,255,0.45); }
        .search-input:focus {
          background: rgba(255,255,255,0.15);
          border-color: rgba(52,211,153,0.5);
          box-shadow: 0 0 0 4px rgba(16,185,129,0.2);
        }
        .search-icon {
          position: absolute; left: 18px; top: 50%;
          transform: translateY(-50%); color: rgba(255,255,255,0.55);
        }

        /* ── Main content ── */
        .main-container {
          max-width: 1100px; margin: -40px auto 0;
          padding: 0 20px 80px; position: relative; z-index: 20;
        }

        /* ── Featured card ── */
        .featured-card {
          background: white; border-radius: 24px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.07);
          overflow: hidden;
          display: flex; flex-direction: column;
          transition: transform 0.3s, box-shadow 0.3s;
          border: 1px solid #f1f5f9; margin-bottom: 48px;
        }
        @media (min-width: 900px) { .featured-card { flex-direction: row; } }
        .featured-card:hover { transform: translateY(-5px); box-shadow: 0 24px 48px rgba(0,0,0,0.1); }

        .fc-image {
          width: 100%; height: 260px;
          position: relative; overflow: hidden; background: #f1f5f9;
          flex-shrink: 0;
        }
        @media (min-width: 900px) { .fc-image { width: 55%; height: auto; min-height: 380px; } }
        .fc-image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s; display: block; }
        .featured-card:hover .fc-image img { transform: scale(1.05); }

        .fc-badge {
          position: absolute; top: 18px; left: 18px;
          background: #10b981; color: white;
          padding: 5px 12px; border-radius: 8px;
          font-weight: 700; font-size: 11px; font-family: 'Outfit', sans-serif;
          box-shadow: 0 3px 8px rgba(16,185,129,0.3); text-transform: uppercase;
        }

        .fc-content {
          padding: 28px;
          display: flex; flex-direction: column; justify-content: center;
        }
        @media (min-width: 900px) { .fc-content { padding: 44px; } }

        .meta-info {
          display: flex; align-items: center; gap: 14px;
          color: #64748b; font-size: 13px; font-weight: 600;
          margin-bottom: 14px; font-family: 'Outfit', sans-serif; flex-wrap: wrap;
        }
        .meta-item { display: flex; align-items: center; gap: 5px; }

        .fc-title {
          font-family: 'Outfit', sans-serif;
          font-size: 28px; font-weight: 800; color: #0f172a;
          line-height: 1.2; margin-bottom: 14px;
          transition: color 0.2s; text-decoration: none; display: block;
        }
        .featured-card:hover .fc-title { color: #047857; }

        .fc-desc {
          color: #475569; font-size: 15px; line-height: 1.65; margin-bottom: 28px;
          display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden;
        }

        .fc-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding-top: 20px; border-top: 1px solid #f1f5f9; margin-top: auto;
        }

        .read-btn {
          display: inline-flex; align-items: center; gap: 7px;
          color: #059669; font-weight: 700; font-size: 14px;
          text-decoration: none; font-family: 'Outfit', sans-serif; transition: gap 0.2s;
        }
        .read-btn:hover { gap: 11px; color: #047857; }

        .share-btn {
          background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b;
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s; flex-shrink: 0;
        }
        .share-btn:hover { background: #10b981; border-color: #10b981; color: white; transform: translateY(-2px); }

        /* ── Section title ── */
        .section-title {
          font-family: 'Outfit', sans-serif;
          font-size: 22px; font-weight: 800; color: #0f172a;
          margin-bottom: 22px;
          display: flex; align-items: center; gap: 10px;
        }

        /* ── Grid ── */
        .grid-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 28px;
        }

        .blog-card {
          background: white; border-radius: 20px;
          overflow: hidden; border: 1px solid #e2e8f0;
          box-shadow: 0 3px 6px rgba(0,0,0,0.02);
          display: flex; flex-direction: column;
          transition: all 0.3s;
        }
        .blog-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.06);
          border-color: #cbd5e1;
        }

        .bc-image { width: 100%; height: 200px; background: #f1f5f9; overflow: hidden; }
        .bc-image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; display: block; }
        .blog-card:hover .bc-image img { transform: scale(1.07); }

        .bc-content { padding: 22px; display: flex; flex-direction: column; flex: 1; }

        .bc-title {
          font-family: 'Outfit', sans-serif;
          font-size: 19px; font-weight: 800; color: #0f172a;
          line-height: 1.3; margin-bottom: 10px; text-decoration: none;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .blog-card:hover .bc-title { color: #059669; }

        .bc-desc {
          color: #64748b; font-size: 14px; line-height: 1.6; margin-bottom: 20px;
          display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
          flex: 1;
        }

        /* ── Empty / loading state ── */
        .empty-state {
          background: white; padding: 60px 20px; border-radius: 24px;
          text-align: center; border: 1px solid #e2e8f0;
          box-shadow: 0 10px 30px rgba(0,0,0,0.03);
        }
        .empty-icon {
          width: 80px; height: 80px; background: #f1f5f9; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px; color: #94a3b8;
        }
        .empty-title {
          font-family: 'Outfit', sans-serif; font-size: 22px; font-weight: 800;
          color: #0f172a; margin-bottom: 8px;
        }
        .empty-desc { color: #64748b; font-size: 15px; max-width: 400px; margin: 0 auto; }

        @keyframes bp-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (max-width: 768px) {
          .blog-hero { padding: 56px 20px 72px; }
          .hero-title { font-size: 36px; }
          .main-container { margin-top: -28px; }
          .fc-content { padding: 22px; }
          .fc-title { font-size: 22px; }
        }
      `}</style>

      <div className="blog-page">
        <Navbar />

        <div className="blog-hero">
          <div className="hero-content">
            <div className="hero-badge">
                GreenJobs Insights
            </div>
            <h1 className="hero-title">
              Stay Ahead in the <span>Green Economy</span>
            </h1>
            <p className="hero-desc">
              Explore industry updates, career guides, sustainable technology innovations,
              and expert advice to power your green career.
            </p>
            <div className="search-container">
              <Search className="search-icon" size={19} />
              <input
                type="text"
                placeholder="Search articles, insights, tutorials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
        </div>

        <div className="main-container">

          {/* ── Loading ── */}
          {loading && (
            <div className="empty-state" style={{ padding: "80px 20px" }}>
              <div className="empty-icon">
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  border: "4px solid #10b981", borderTopColor: "transparent",
                  animation: "bp-spin 1s linear infinite",
                }} />
              </div>
              <h3 className="empty-title">Fetching Articles</h3>
              <p className="empty-desc">Please wait while we load the latest insights for you.</p>
            </div>
          )}

          {/* ── No results ── */}
          {!loading && filteredBlogs.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon"><BookOpen size={32} /></div>
              <h3 className="empty-title">No articles found</h3>
              <p className="empty-desc">
                {searchTerm
                  ? "No match for your search. Try different keywords."
                  : "We're preparing new articles. Check back soon!"}
              </p>
            </div>
          )}

          {/* ── Posts ── */}
          {!loading && filteredBlogs.length > 0 && (
            <>
              {/* Featured */}
              {!searchTerm && featuredPost && (
                <div className="featured-card">
                  <div className="fc-image">
                    {featuredPost.thumbnail
                      ? <img src={featuredPost.thumbnail} alt={featuredPost.title} />
                      : <NoThumb size={64} />}
                    <div className="fc-badge">Featured</div>
                  </div>
                  <div className="fc-content">
                    <div className="meta-info">
                      <span className="meta-item">
                        <Calendar size={13} />
                        {new Date(featuredPost.createdAt).toLocaleDateString(undefined, {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </span>
                      <span className="meta-item">
                        <Clock size={13} />
                        {getReadTime(featuredPost.content)}
                      </span>
                    </div>
                    <Link to={`/blog/${featuredPost.slug}`} className="fc-title">
                      {featuredPost.title}
                    </Link>
                    <p className="fc-desc">{getExcerpt(featuredPost, 220)}</p>
                    <div className="fc-footer">
                      <Link to={`/blog/${featuredPost.slug}`} className="read-btn">
                        Read Full Article <ArrowRight size={15} />
                      </Link>
                      <button
                        className="share-btn"
                        onClick={(e) => handleShare(e, featuredPost)}
                        title="Share"
                      >
                        <Share2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Grid */}
              {((!searchTerm && standardPosts.length > 0) ||
                (searchTerm && filteredBlogs.length > 0)) && (
                <div>
                  <h2 className="section-title">Latest Insights</h2>
                  <div className="grid-container">
                    {(searchTerm ? filteredBlogs : standardPosts).map((blog) => (
                      <div className="blog-card" key={blog._id}>
                        <div className="bc-image">
                          {blog.thumbnail
                            ? <img src={blog.thumbnail} alt={blog.title} />
                            : <NoThumb size={36} />}
                        </div>
                        <div className="bc-content">
                          <div className="meta-info" style={{ marginBottom: 10 }}>
                            <span className="meta-item">
                              <Calendar size={12} />
                              {new Date(blog.createdAt).toLocaleDateString(undefined, {
                                month: "short", day: "numeric",
                              })}
                            </span>
                            <span className="meta-item">
                              <Clock size={12} />
                              {getReadTime(blog.content)}
                            </span>
                          </div>
                          <Link to={`/blog/${blog.slug}`} className="bc-title">
                            {blog.title}
                          </Link>
                          <p className="bc-desc">{getExcerpt(blog, 130)}</p>
                          <div className="fc-footer">
                            <Link to={`/blog/${blog.slug}`} className="read-btn">
                              Read Article <ArrowRight size={13} />
                            </Link>
                            <button
                              className="share-btn"
                              style={{ width: 32, height: 32 }}
                              onClick={(e) => handleShare(e, blog)}
                              title="Share"
                            >
                              <Share2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </>
  );
}