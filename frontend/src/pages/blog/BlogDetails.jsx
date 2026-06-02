import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import {
  Calendar, Clock, ArrowLeft, Share2,
  Heart, BookOpen,
} from "lucide-react";
import toast from "react-hot-toast";
import API_BASE_URL from "../../config/api";

export default function BlogDetails() {
  const { slug } = useParams();
  const [blog,    setBlog]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked,   setLiked]   = useState(false);

  /* ── Fetch post ── */
  useEffect(() => {
    setLoading(true);
    axios
      .get(`${API_BASE_URL}/api/blogs/${slug}`)
      .then((res) => setBlog(res.data))
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load blog post");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  /* ── Dynamic SEO ── */
  useEffect(() => {
    if (!blog) return;

    const prevTitle = document.title;
    document.title = blog.metaTitle || blog.title || "GreenJobs Blog";

    const setMeta = (attrName, attrValue, content, isProp = false) => {
      const sel = isProp ? `meta[property="${attrValue}"]` : `meta[name="${attrValue}"]`;
      let el = document.querySelector(sel);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(isProp ? "property" : "name", attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
      return el;
    };

    const fallbackDesc = blog.content
      ? blog.content.replace(/<[^>]*>/g, "").slice(0, 160) + "..."
      : "Read the latest sustainable development and green job career tips.";

    const desc = blog.metaDescription || fallbackDesc;

    setMeta("name", "description",  desc);
    setMeta("name", "robots",       blog.robots || "index, follow");
    setMeta("prop", "og:title",       blog.ogTitle       || blog.title,     true);
    setMeta("prop", "og:description", blog.ogDescription || desc,           true);
    setMeta("prop", "og:image",       blog.ogImage       || blog.thumbnail  || "", true);
    setMeta("prop", "og:url",         window.location.href,                  true);

    if (blog.canonicalUrl) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", blog.canonicalUrl);
    }

    return () => {
      document.title = prevTitle;
    };
  }, [blog]);

  /* ── Helpers ── */
  const getReadTime = (html) => {
    if (!html) return "2 min read";
    const words = html.replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length;
    return `${Math.max(1, Math.ceil(words / 200))} min read`;
  };

  const handleShare = () => {
    const shareData = {
      title: blog?.title,
      text:  `Read ${blog?.title} on GreenJobs`,
      url:   window.location.href,
    };
    if (navigator.share) {
      navigator.share(shareData).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
        <Navbar />
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", minHeight: "60vh", textAlign: "center",
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            border: "4px solid #10b981", borderTopColor: "transparent",
            animation: "bd-spin 1s linear infinite", marginBottom: 16,
          }} />
          <p style={{ color: "#64748b", fontWeight: 600, fontSize: 16 }}>Reading article...</p>
        </div>
        <style>{`@keyframes bd-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  /* ── Not found ── */
  if (!blog) {
    return (
      <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
        <Navbar />
        <div style={{
          maxWidth: 480, margin: "60px auto", padding: "48px 24px",
          background: "white", borderRadius: 20, border: "1px solid #e2e8f0",
          boxShadow: "0 4px 12px rgba(0,0,0,0.04)", textAlign: "center",
        }}>
          <BookOpen size={48} color="#cbd5e1" style={{ margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
            Article Not Found
          </h2>
          <p style={{ color: "#64748b", fontSize: 15, marginBottom: 24 }}>
            This article may have been archived or removed.
          </p>
          <Link
            to="/blog"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "10px 22px", background: "#059669", color: "white",
              borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none",
            }}
          >
            ← Back to Blog
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
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
        }

        .bd-back {
          display: inline-flex; align-items: center; gap: 8px;
          color: #64748b; font-family: 'Inter', sans-serif;
          font-size: 14px; font-weight: 600; text-decoration: none; transition: color 0.2s;
        }
        .bd-back:hover { color: #0f172a; }

        .bd-actions { display: flex; gap: 10px; }
        .bd-btn {
          width: 40px; height: 40px; border-radius: 12px; background: white;
          border: 1px solid #e2e8f0; display: flex; align-items: center;
          justify-content: center; cursor: pointer; color: #64748b;
          transition: all 0.2s; flex-shrink: 0;
        }
        .bd-btn:hover  { background: #f1f5f9; color: #0f172a; border-color: #cbd5e1; }
        .bd-btn.liked  { background: #fef2f2; border-color: #fecaca; color: #ef4444; }

        .bd-article {
          background: white; border-radius: 24px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.04);
          overflow: hidden; border: 1px solid #f1f5f9;
        }

        .bd-cover { width: 100%; aspect-ratio: 21/9; background: #f1f5f9; overflow: hidden; }
        .bd-cover img { width: 100%; height: 100%; object-fit: cover; display: block; }

        .bd-content-wrap { padding: 36px 32px; }
        @media (min-width: 768px) { .bd-content-wrap { padding: 56px 72px; } }

        .bd-meta {
          display: flex; flex-wrap: wrap; align-items: center; gap: 14px;
          margin-bottom: 20px; font-family: 'Outfit', sans-serif;
          font-size: 14px; font-weight: 600; color: #64748b;
        }
        .bd-meta-item { display: flex; align-items: center; gap: 6px; }
        .bd-dot { width: 5px; height: 5px; border-radius: 50%; background: #cbd5e1; }

        .bd-title {
          font-family: 'Outfit', sans-serif;
          font-size: 34px; font-weight: 800; color: #0f172a;
          line-height: 1.2; letter-spacing: -0.4px; margin-bottom: 28px;
        }
        @media (min-width: 768px) { .bd-title { font-size: 44px; } }

        .bd-divider { height: 1px; background: #f1f5f9; margin: 36px 0; }

        /* Article body typography */
        .article-content {
          font-family: 'Lora', serif;
          font-size: 18px;
          line-height: 1.85;
          color: #334155;
        }
        .article-content p  { margin-bottom: 22px; }
        .article-content h1,
        .article-content h2,
        .article-content h3,
        .article-content h4 {
          font-family: 'Outfit', sans-serif;
          font-weight: 800; color: #0f172a;
          margin-top: 44px; margin-bottom: 18px; line-height: 1.3;
        }
        .article-content h1 { font-size: 34px; }
        .article-content h2 { font-size: 28px; }
        .article-content h3 { font-size: 22px; }
        .article-content a {
          color: #059669; text-decoration: underline;
          text-underline-offset: 3px; font-weight: 500; transition: color 0.2s;
        }
        .article-content a:hover { color: #047857; }
        .article-content img {
          max-width: 100%; height: auto; border-radius: 14px;
          margin: 28px 0; border: 1px solid #f1f5f9; display: block;
        }
        .article-content ul,
        .article-content ol  { margin-bottom: 22px; padding-left: 24px; }
        .article-content li  { margin-bottom: 10px; }
        .article-content blockquote {
          margin: 28px 0; padding: 20px 28px;
          background: #f8fafc; border-left: 4px solid #10b981;
          border-radius: 0 14px 14px 0;
          font-size: 20px; font-style: italic; color: #0f172a;
        }
        .article-content pre {
          background: #0f172a; color: #f8fafc;
          padding: 18px; border-radius: 12px;
          overflow-x: auto; margin-bottom: 22px;
          font-size: 14px; font-family: monospace; line-height: 1.6;
        }
        .article-content code {
          background: #f1f5f9; color: #ef4444;
          padding: 2px 6px; border-radius: 4px;
          font-size: 14px; font-family: monospace;
        }
        .article-content pre code {
          background: transparent; color: inherit; padding: 0;
        }

        /* Footer */
        .bd-footer {
          background: #f8fafc; border-top: 1px solid #f1f5f9;
          padding: 28px 32px;
          display: flex; flex-direction: column;
          gap: 20px; align-items: center; justify-content: space-between;
        }
        @media (min-width: 640px) {
          .bd-footer { flex-direction: row; padding: 28px 56px; }
        }

        .bd-author { display: flex; align-items: center; gap: 14px; }
        .bd-avatar {
          width: 46px; height: 46px; border-radius: 50%;
          background: #d1fae5; color: #065f46;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 17px;
          flex-shrink: 0;
        }
        .bd-author-role { font-size: 12px; color: #64748b; font-weight: 500; margin-bottom: 2px; }
        .bd-author-name { font-size: 15px; color: #0f172a; font-weight: 700; }

        .bd-share-big {
          display: inline-flex; align-items: center; gap: 10px;
          background: white; border: 1px solid #e2e8f0;
          padding: 11px 22px; border-radius: 100px;
          font-family: 'Inter', sans-serif; font-weight: 600; font-size: 14px;
          color: #334155; cursor: pointer; transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02); white-space: nowrap;
        }
        .bd-share-big:hover {
          background: #f8fafc; border-color: #cbd5e1; transform: translateY(-2px);
        }

        @keyframes bd-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
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
                onClick={() => setLiked((v) => !v)}
                className={`bd-btn${liked ? " liked" : ""}`}
                title={liked ? "Liked" : "Like Article"}
              >
                <Heart size={18} fill={liked ? "currentColor" : "none"} />
              </button>
              <button onClick={handleShare} className="bd-btn" title="Share Article">
                <Share2 size={18} />
              </button>
            </div>
          </div>

          <article className="bd-article">

            {blog.thumbnail && (
              <div className="bd-cover">
                <img src={blog.thumbnail} alt={blog.title} />
              </div>
            )}

            <div className="bd-content-wrap">

              <div className="bd-meta">
                <span className="bd-meta-item">
                  <Calendar size={15} />
                  {new Date(blog.createdAt).toLocaleDateString(undefined, {
                    weekday: "long", year: "numeric", month: "long", day: "numeric",
                  })}
                </span>
                <span className="bd-dot" />
                <span className="bd-meta-item">
                  <Clock size={15} />
                  {getReadTime(blog.content)}
                </span>
              </div>

              <h1 className="bd-title">{blog.title}</h1>

              <div className="bd-divider" />

              <div
                className="article-content"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />

            </div>

            <div className="bd-footer">
              <div className="bd-author">
                <div className="bd-avatar">GJ</div>
                <div>
                  <div className="bd-author-role">Published by</div>
                  <div className="bd-author-name">GreenJobs Editorial</div>
                </div>
              </div>
              <button onClick={handleShare} className="bd-share-big">
                <Share2 size={15} /> Share this article
              </button>
            </div>

          </article>

        </div>
      </div>
    </>
  );
}