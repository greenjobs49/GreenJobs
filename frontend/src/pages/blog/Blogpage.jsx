import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import { Search, Calendar, Clock, ArrowRight, Share2, Sparkles, BookOpen, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import API_BASE_URL from "../../config/api";

export default function BlogPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${API_BASE_URL}/api/blogs`)
      .then((res) => {
        setBlogs(res.data);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load blog posts");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const getReadTime = (text) => {
    if (!text) return "2 min read";
    const words = text.replace(/<[^>]*>/g, "").split(/\s+/).length;
    const time = Math.ceil(words / 200);
    return `${time} min read`;
  };

  const handleShare = (e, blog) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: blog.title,
        text: blog.metaDescription || `Read ${blog.title} on GreenJobs`,
        url: `${window.location.origin}/blog/${blog.slug}`,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/blog/${blog.slug}`);
      toast.success("Link copied to clipboard!");
    }
  };

  const filteredBlogs = blogs.filter((b) =>
    b.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const featuredPost = filteredBlogs.length > 0 ? filteredBlogs[0] : null;
  const standardPosts = filteredBlogs.length > 1 ? filteredBlogs.slice(1) : [];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        
        .blog-page { font-family: 'Inter', sans-serif; background: #f8fafc; min-height: 100vh; }
        
        .blog-hero {
          position: relative;
          background: linear-gradient(135deg, #022c22 0%, #064e3b 50%, #0f766e 100%);
          padding: 80px 20px 100px;
          color: white;
          overflow: hidden;
        }
        
        .blog-hero::before {
          content: ''; position: absolute; inset: 0;
          background-image: radial-gradient(circle at 80% 20%, rgba(52,211,153,0.15) 0%, transparent 50%);
          pointer-events: none;
        }
        
        .hero-content {
          max-width: 1100px; margin: 0 auto; position: relative; z-index: 10;
        }
        
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(52, 211, 153, 0.3);
          padding: 6px 14px; border-radius: 100px; font-family: 'Outfit', sans-serif;
          font-weight: 700; font-size: 13px; color: #6ee7b7; text-transform: uppercase;
          letter-spacing: 1px; margin-bottom: 24px;
        }
        
        .hero-title {
          font-family: 'Outfit', sans-serif; font-size: 52px; font-weight: 800;
          line-height: 1.1; margin-bottom: 20px; max-width: 700px; letter-spacing: -1px;
        }
        
        .hero-title span {
          background: linear-gradient(to right, #34d399, #10b981);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        
        .hero-desc {
          font-size: 18px; color: #a7f3d0; max-width: 600px; line-height: 1.6;
          margin-bottom: 40px; font-weight: 400;
        }
        
        .search-container {
          position: relative; max-width: 500px;
        }
        
        .search-input {
          width: 100%; padding: 18px 24px 18px 54px;
          background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px; color: white; font-size: 16px;
          transition: all 0.3s ease; backdrop-filter: blur(10px); outline: none;
        }
        
        .search-input::placeholder { color: rgba(255, 255, 255, 0.5); }
        .search-input:focus {
          background: rgba(255, 255, 255, 0.15); border-color: rgba(52, 211, 153, 0.5);
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
        }
        
        .search-icon {
          position: absolute; left: 20px; top: 50%; transform: translateY(-50%);
          color: rgba(255, 255, 255, 0.6);
        }
        
        .main-container { max-width: 1100px; margin: -40px auto 0; padding: 0 20px 80px; position: relative; z-index: 20; }
        
        .featured-card {
          background: white; border-radius: 24px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
          overflow: hidden; display: flex; flex-direction: column; transition: transform 0.3s ease, box-shadow 0.3s ease;
          border: 1px solid #f1f5f9; margin-bottom: 48px;
        }
        @media (min-width: 900px) { .featured-card { flex-direction: row; } }
        
        .featured-card:hover { transform: translateY(-5px); box-shadow: 0 25px 50px rgba(0, 0, 0, 0.12); }
        
        .fc-image { width: 100%; height: 260px; position: relative; overflow: hidden; background: #f1f5f9; }
        @media (min-width: 900px) { .fc-image { width: 55%; height: auto; min-height: 400px; } }
        
        .fc-image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease; }
        .featured-card:hover .fc-image img { transform: scale(1.05); }
        
        .fc-badge {
          position: absolute; top: 20px; left: 20px;
          background: #10b981; color: white; padding: 6px 12px; border-radius: 8px;
          font-weight: 700; font-size: 12px; font-family: 'Outfit', sans-serif;
          box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3); text-transform: uppercase;
        }
        
        .fc-content { padding: 32px; display: flex; flex-direction: column; justify-content: center; width: 100%; }
        @media (min-width: 900px) { .fc-content { width: 45%; padding: 48px; } }
        
        .meta-info {
          display: flex; align-items: center; gap: 16px; color: #64748b;
          font-size: 13px; font-weight: 600; margin-bottom: 16px; font-family: 'Outfit', sans-serif;
        }
        .meta-item { display: flex; align-items: center; gap: 6px; }
        
        .fc-title {
          font-family: 'Outfit', sans-serif; font-size: 32px; font-weight: 800; color: #0f172a;
          line-height: 1.2; margin-bottom: 16px; transition: color 0.2s; text-decoration: none;
        }
        .featured-card:hover .fc-title { color: #047857; }
        
        .fc-desc {
          color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 32px;
          display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden;
        }
        
        .fc-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding-top: 24px; border-top: 1px solid #f1f5f9; margin-top: auto;
        }
        
        .read-btn {
          display: inline-flex; align-items: center; gap: 8px;
          color: #059669; font-weight: 700; font-size: 14px; text-decoration: none;
          font-family: 'Outfit', sans-serif; transition: gap 0.2s;
        }
        .read-btn:hover { gap: 12px; color: #047857; }
        
        .share-btn {
          background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b;
          width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center;
          justify-content: center; cursor: pointer; transition: all 0.2s;
        }
        .share-btn:hover { background: #10b981; border-color: #10b981; color: white; transform: translateY(-2px); }
        
        .section-title {
          font-family: 'Outfit', sans-serif; font-size: 24px; font-weight: 800; color: #0f172a;
          margin-bottom: 24px; display: flex; align-items: center; gap: 12px;
        }
        
        .grid-container {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 32px;
        }
        
        .blog-card {
          background: white; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px rgba(0,0,0,0.02); display: flex; flex-direction: column;
          transition: all 0.3s ease;
        }
        .blog-card:hover {
          transform: translateY(-6px); box-shadow: 0 12px 24px rgba(0,0,0,0.06); border-color: #cbd5e1;
        }
        
        .bc-image { width: 100%; height: 200px; background: #f1f5f9; overflow: hidden; position: relative; }
        .bc-image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }
        .blog-card:hover .bc-image img { transform: scale(1.08); }
        
        .bc-content { padding: 24px; display: flex; flex-direction: column; flex: 1; }
        
        .bc-title {
          font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 800; color: #0f172a;
          line-height: 1.3; margin-bottom: 12px; text-decoration: none;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .blog-card:hover .bc-title { color: #059669; }
        
        .bc-desc {
          color: #64748b; font-size: 14px; line-height: 1.6; margin-bottom: 24px;
          display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
        }
        
        .empty-state {
          background: white; padding: 60px 20px; border-radius: 24px; text-align: center;
          border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,0.03);
        }
        .empty-icon { width: 80px; height: 80px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; color: #94a3b8; }
        .empty-title { font-family: 'Outfit', sans-serif; font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
        .empty-desc { color: #64748b; font-size: 16px; max-width: 400px; margin: 0 auto; }
        
        @media (max-width: 768px) {
          .blog-hero { padding: 60px 20px 80px; }
          .hero-title { font-size: 38px; }
          .main-container { margin-top: -30px; }
          .fc-content { padding: 24px; }
          .fc-title { font-size: 24px; }
        }
      `}</style>
      
      <div className="blog-page">
        <Navbar />

        <div className="blog-hero">
          <div className="hero-content">
            <div className="hero-badge">
              <Sparkles size={14} /> GreenJobs Insights
            </div>
            <h1 className="hero-title">
              Stay Ahead in the <span>Green Economy</span>
            </h1>
            <p className="hero-desc">
              Explore industry updates, career guides, sustainable technology innovations, and expert advice to power your green career.
            </p>
            <div className="search-container">
              <Search className="search-icon" size={20} />
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
          {loading ? (
            <div className="empty-state" style={{ padding: '80px 20px' }}>
              <div className="empty-icon" style={{ animation: 'spin 2s linear infinite' }}>
                <div style={{ width: 40, height: 40, border: '4px solid #10b981', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
              </div>
              <h3 className="empty-title">Fetching Articles</h3>
              <p className="empty-desc">Please wait while we load the latest insights for you.</p>
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><BookOpen size={32} /></div>
              <h3 className="empty-title">No articles found</h3>
              <p className="empty-desc">
                {searchTerm ? "No match for your search. Try different keywords." : "We're preparing new articles. Check back soon!"}
              </p>
            </div>
          ) : (
            <>
              {/* Featured Post */}
              {!searchTerm && featuredPost && (
                <div className="featured-card">
                  <div className="fc-image">
                    {featuredPost.thumbnail ? (
                      <img src={featuredPost.thumbnail} alt={featuredPost.title} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                        <BookOpen size={64} />
                      </div>
                    )}
                    <div className="fc-badge">Featured</div>
                  </div>
                  <div className="fc-content">
                    <div className="meta-info">
                      <span className="meta-item"><Calendar size={14} /> {new Date(featuredPost.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                      <span className="meta-item"><Clock size={14} /> {getReadTime(featuredPost.content)}</span>
                    </div>
                    <Link to={`/blog/${featuredPost.slug}`} className="fc-title">
                      {featuredPost.title}
                    </Link>
                    <p className="fc-desc">
                      {featuredPost.metaDescription || featuredPost.content?.replace(/<[^>]*>/g, "").slice(0, 200) + "..."}
                    </p>
                    <div className="fc-footer">
                      <Link to={`/blog/${featuredPost.slug}`} className="read-btn">
                        Read Full Article <ArrowRight size={16} />
                      </Link>
                      <button className="share-btn" onClick={(e) => handleShare(e, featuredPost)} title="Share">
                        <Share2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Grid Posts */}
              {((!searchTerm && standardPosts.length > 0) || (searchTerm && filteredBlogs.length > 0)) && (
                <div>
                  <h2 className="section-title">Latest Insights</h2>
                  <div className="grid-container">
                    {(searchTerm ? filteredBlogs : standardPosts).map((blog) => (
                      <div className="blog-card" key={blog._id}>
                        <div className="bc-image">
                          {blog.thumbnail ? (
                            <img src={blog.thumbnail} alt={blog.title} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                              <BookOpen size={40} />
                            </div>
                          )}
                        </div>
                        <div className="bc-content">
                          <div className="meta-info" style={{ marginBottom: 12 }}>
                            <span className="meta-item"><Calendar size={13} /> {new Date(blog.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                            <span className="meta-item"><Clock size={13} /> {getReadTime(blog.content)}</span>
                          </div>
                          <Link to={`/blog/${blog.slug}`} className="bc-title">
                            {blog.title}
                          </Link>
                          <p className="bc-desc">
                            {blog.metaDescription || blog.content?.replace(/<[^>]*>/g, "").slice(0, 120) + "..."}
                          </p>
                          <div className="fc-footer">
                            <Link to={`/blog/${blog.slug}`} className="read-btn">
                              Read Article <ArrowRight size={14} />
                            </Link>
                            <button className="share-btn" style={{ width: 32, height: 32 }} onClick={(e) => handleShare(e, blog)} title="Share">
                              <Share2 size={14} />
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