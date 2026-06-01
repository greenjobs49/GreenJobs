import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import { Calendar, Clock, ArrowLeft, Share2, Globe, Heart, ChevronRight, BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import API_BASE_URL from "../../config/api";

export default function BlogDetails() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${API_BASE_URL}/api/blogs/${slug}`)
      .then((res) => {
        setBlog(res.data);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load blog post");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  // SEO Optimization - Update Document Title & Meta Description tags dynamically
  useEffect(() => {
    if (blog) {
      const originalTitle = document.title;
      document.title = blog.title || "GreenJobs Blog";

      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      const prevDesc = metaDescription.getAttribute('content');
      const excerpt = blog.content ? blog.content.replace(/<[^>]*>/g, "").slice(0, 160) + "..." : "Read the latest sustainable development and green job career tips.";
      metaDescription.setAttribute('content', excerpt);

      return () => {
        document.title = originalTitle;
        if (metaDescription) {
          metaDescription.setAttribute('content', prevDesc || "Find green energy jobs and grow your career.");
        }
      };
    }
  }, [blog]);

  const getReadTime = (text) => {
    if (!text) return "2 min read";
    const words = text.replace(/<[^>]*>/g, "").split(/\s+/).length;
    const time = Math.ceil(words / 200);
    return `${time} min read`;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: blog?.title,
        text: blog?.metaDescription || `Read ${blog?.title} on GreenJobs`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 font-semibold">Reading article...</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="bg-slate-50 min-h-screen">
        <Navbar />
        <div className="max-w-md mx-auto my-16 px-4 text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <BookOpen className="text-slate-300 mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Article Not Found</h2>
          <p className="text-slate-500 mb-6">The article you are looking for might have been archived or removed.</p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm"
          >
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
        
        .blog-details-page { background: #f8fafc; min-height: 100vh; padding-bottom: 80px; }
        
        .bd-container { max-width: 860px; margin: 0 auto; padding: 40px 20px; }
        
        .bd-top-bar {
          display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px;
        }
        
        .bd-back {
          display: inline-flex; align-items: center; gap: 8px; color: #64748b; font-family: 'Inter', sans-serif;
          font-size: 14px; font-weight: 600; text-decoration: none; transition: color 0.2s;
        }
        .bd-back:hover { color: #0f172a; }
        
        .bd-actions { display: flex; gap: 12px; }
        .bd-btn {
          width: 40px; height: 40px; border-radius: 12px; background: white; border: 1px solid #e2e8f0;
          display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b;
          transition: all 0.2s ease;
        }
        .bd-btn:hover { background: #f1f5f9; color: #0f172a; border-color: #cbd5e1; }
        .bd-btn.liked { background: #fef2f2; border-color: #fecaca; color: #ef4444; }
        
        .bd-article {
          background: white; border-radius: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.04);
          overflow: hidden; border: 1px solid #f1f5f9;
        }
        
        .bd-cover { width: 100%; aspect-ratio: 21/9; background: #f1f5f9; position: relative; overflow: hidden; }
        .bd-cover img { width: 100%; height: 100%; object-fit: cover; }
        
        .bd-content-wrap { padding: 40px; }
        @media (min-width: 768px) { .bd-content-wrap { padding: 60px 80px; } }
        
        .bd-meta {
          display: flex; flex-wrap: wrap; align-items: center; gap: 16px; margin-bottom: 24px;
          font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 600; color: #64748b;
        }
        .bd-meta-item { display: flex; align-items: center; gap: 6px; }
        .bd-dot { width: 6px; height: 6px; border-radius: 50%; background: #cbd5e1; }
        
        .bd-title {
          font-family: 'Outfit', sans-serif; font-size: 38px; font-weight: 800; color: #0f172a;
          line-height: 1.2; letter-spacing: -0.5px; margin-bottom: 24px;
        }
        @media (min-width: 768px) { .bd-title { font-size: 48px; } }
        
        .bd-desc-box {
          border-left: 4px solid #10b981; padding: 4px 0 4px 20px; margin-bottom: 40px;
        }
        .bd-desc-box p {
          font-family: 'Lora', serif; font-size: 20px; color: #475569; font-style: italic; line-height: 1.6; margin: 0;
        }
        
        .bd-divider { height: 1px; background: #f1f5f9; margin: 40px 0; }
        
        /* Custom Rich Text Styles */
        .article-content {
          font-family: 'Lora', serif; font-size: 19px; line-height: 1.8; color: #334155;
        }
        
        .article-content p { margin-bottom: 24px; }
        
        .article-content h1, .article-content h2, .article-content h3, .article-content h4, .article-content h5 {
          font-family: 'Outfit', sans-serif; font-weight: 800; color: #0f172a; margin-top: 48px; margin-bottom: 20px; line-height: 1.3;
        }
        .article-content h1 { font-size: 36px; }
        .article-content h2 { font-size: 30px; }
        .article-content h3 { font-size: 24px; }
        
        .article-content a { color: #059669; text-decoration: underline; text-underline-offset: 4px; font-weight: 500; transition: color 0.2s; }
        .article-content a:hover { color: #047857; text-decoration-color: #047857; }
        
        .article-content img {
          max-width: 100%; height: auto; border-radius: 16px; margin: 32px 0; border: 1px solid #f1f5f9;
        }
        
        .article-content ul, .article-content ol { margin-bottom: 24px; padding-left: 24px; }
        .article-content li { margin-bottom: 12px; }
        
        .article-content blockquote {
          margin: 32px 0; padding: 24px 32px; background: #f8fafc; border-left: 4px solid #10b981;
          border-radius: 0 16px 16px 0; font-size: 22px; font-style: italic; color: #0f172a;
        }
        .article-content pre { background: #0f172a; color: #f8fafc; padding: 20px; border-radius: 12px; overflow-x: auto; margin-bottom: 24px; font-size: 15px; font-family: monospace; }
        .article-content code { background: #f1f5f9; color: #ef4444; padding: 2px 6px; border-radius: 4px; font-size: 15px; font-family: monospace; }
        .article-content pre code { background: transparent; color: inherit; padding: 0; }
        
        .bd-footer {
          background: #f8fafc; border-top: 1px solid #f1f5f9; padding: 32px 40px;
          display: flex; flex-direction: column; gap: 20px; align-items: center; justify-content: space-between;
        }
        @media (min-width: 640px) {
          .bd-footer { flex-direction: row; padding: 32px 60px; }
        }
        
        .bd-author { display: flex; align-items: center; gap: 16px; }
        .bd-avatar {
          width: 48px; height: 48px; border-radius: 50%; background: #d1fae5; color: #065f46;
          display: flex; align-items: center; justify-content: center; font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 18px;
        }
        .bd-author-text { font-family: 'Inter', sans-serif; }
        .bd-author-role { font-size: 13px; color: #64748b; font-weight: 500; margin-bottom: 2px; }
        .bd-author-name { font-size: 16px; color: #0f172a; font-weight: 700; }
        
        .bd-share-big {
          display: inline-flex; align-items: center; gap: 10px; background: white; border: 1px solid #e2e8f0;
          padding: 12px 24px; border-radius: 100px; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 14px;
          color: #334155; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .bd-share-big:hover { background: #f8fafc; border-color: #cbd5e1; transform: translateY(-2px); }
      `}</style>

      <div className="blog-details-page">
        <Navbar />

        <div className="bd-container">
          
          <div className="bd-top-bar">
            <Link to="/blog" className="bd-back">
              <ArrowLeft size={18} /> Back to Blog
            </Link>

            <div className="bd-actions">
              <button
                onClick={() => setLiked(!liked)}
                className={`bd-btn ${liked ? "liked" : ""}`}
                title={liked ? "Liked" : "Like Article"}
              >
                <Heart size={20} fill={liked ? "currentColor" : "none"} />
              </button>
              <button onClick={handleShare} className="bd-btn" title="Share Article">
                <Share2 size={20} />
              </button>
            </div>
          </div>

          <article className="bd-article">
            
            {blog.thumbnail && (
              <div className="bd-cover">
                <img src={blog.thumbnail} alt="" />
              </div>
            )}

            <div className="bd-content-wrap">
              
              <div className="bd-meta">
                <span className="bd-meta-item">
                  <Calendar size={16} />
                  {new Date(blog.createdAt).toLocaleDateString(undefined, {
                    weekday: "long", year: "numeric", month: "long", day: "numeric",
                  })}
                </span>
                <span className="bd-dot"></span>
                <span className="bd-meta-item">
                  <Clock size={16} />
                  {getReadTime(blog.content)}
                </span>
              </div>

              <h1 className="bd-title">{blog.title}</h1>



              <div className="bd-divider"></div>

              <div 
                className="article-content"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />

            </div>

            <div className="bd-footer">
              <div className="bd-author">
                <div className="bd-avatar">GJ</div>
                <div className="bd-author-text">
                  <div className="bd-author-role">Published by</div>
                  <div className="bd-author-name">GreenJobs Editorial</div>
                </div>
              </div>

              <button onClick={handleShare} className="bd-share-big">
                <Share2 size={16} /> Share this article
              </button>
            </div>

          </article>

        </div>
      </div>
    </>
  );
}