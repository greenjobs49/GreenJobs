import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import {
  Calendar, Clock, ArrowLeft, Share2,
  Heart, BookOpen, ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import API_BASE_URL from "../../config/api";

/* ─── Normalize ad from DB (same helper used in homepage) ─── */
const normalizeDbAd = (ad) => ({
  ...ad,
  accent:      ad.accentColor || "#10b981",
  accentLight: (ad.accentColor || "#10b981") + "33",
  cta:         ad.ctaText  || "Learn More",
  image:       ad.imageUrl || "",
  ctaUrl:      ad.ctaUrl   || "/jobs",
  objectFit:      ad.objectFit      || "cover",
  objectPosition: ad.objectPosition || "center",
});

const SideAdCard = ({ ad, onClick }) => {
  const accent = ad.accent || "#10b981";

  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 14,
        overflow: "hidden",
        border: `1.5px solid ${accent}33`,
        cursor: "pointer",
        background: "white",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        transition: "all 0.22s",
        position: "relative",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = `0 8px 28px ${accent}22`;
        e.currentTarget.style.borderColor = accent;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)";
        e.currentTarget.style.borderColor = `${accent}33`;
      }}
    >
      {/* Ad image */}
      {ad.image ? (
        <div style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16/9",
          overflow: "hidden",
          background: "#f8fafc",
          borderBottom: `1px solid ${accent}18`,
        }}>
          <img
            src={ad.image}
            alt={ad.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "center",
              display: "block",
              padding: "12px",
            }}
            onError={e => {
              e.target.parentElement.style.background = `linear-gradient(135deg, ${accent}22, ${accent}11)`;
              e.target.style.display = "none";
            }}
          />
          {/* Tag badge */}
          {ad.tag && (
            <div style={{
              position: "absolute", top: 8, left: 8,
              background: accent, color: "white",
              padding: "3px 10px", borderRadius: 100,
              fontSize: 10, fontWeight: 800, letterSpacing: "0.8px", textTransform: "uppercase",
            }}>
              {ad.tag}
            </div>
          )}
        </div>
      ) : (
        /* No image fallback */
        <div style={{
          padding: "20px 16px",
          background: `linear-gradient(135deg, ${accent}18, ${accent}08)`,
          borderBottom: `1px solid ${accent}22`,
        }}>
          {ad.tag && (
            <div style={{
              display: "inline-block", background: accent, color: "white",
              padding: "2px 10px", borderRadius: 100,
              fontSize: 10, fontWeight: 800, letterSpacing: "0.8px",
              textTransform: "uppercase", marginBottom: 8,
            }}>
              {ad.tag}
            </div>
          )}
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>
            {ad.title}
          </div>
        </div>
      )}

      {/* Body — title always shown here, below the image */}
      <div style={{ padding: "12px 14px 14px" }}>
        <div style={{
          fontSize: 13, fontWeight: 700, color: "#0f172a",
          lineHeight: 1.4, marginBottom: ad.subtitle ? 6 : 12,
        }}>
          {ad.title}
        </div>
        {ad.subtitle && (
          <p style={{
            fontSize: 12, color: "#64748b", lineHeight: 1.55,
            marginBottom: 12,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {ad.subtitle}
          </p>
        )}
        <button
          style={{
            width: "100%", padding: "8px 0",
            background: accent, color: "white",
            border: "none", borderRadius: 8,
            fontSize: 12, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            fontFamily: "Inter, sans-serif", transition: "filter 0.18s",
          }}
          onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.12)"; }}
          onMouseLeave={e => { e.currentTarget.style.filter = ""; }}
        >
          {ad.cta} <ExternalLink size={11} />
        </button>
      </div>

      {/* Sponsored label */}
      <div style={{
        position: "absolute", top: 8, right: 8,
        background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
        color: "rgba(255,255,255,0.75)",
        padding: "2px 7px", borderRadius: 100,
        fontSize: 9, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase",
      }}>
        Ad
      </div>
    </div>
  );
};

/* ─── Sidebar skeleton loader ─── */
const AdSkeleton = () => (
  <div style={{
    borderRadius: 14, overflow: "hidden",
    border: "1.5px solid #e2e8f0", background: "white",
  }}>
    <div style={{
      width: "100%", aspectRatio: "4/3",
      background: "linear-gradient(90deg, #f1f5f9 0%, #e8eef4 50%, #f1f5f9 100%)",
      backgroundSize: "400px 100%",
      animation: "bd-shimmer 1.4s infinite linear",
    }} />
    <div style={{ padding: "12px 14px 14px" }}>
      <div style={{ height: 10, borderRadius: 6, background: "#f1f5f9", marginBottom: 8, width: "80%" }} />
      <div style={{ height: 10, borderRadius: 6, background: "#f1f5f9", marginBottom: 8, width: "60%" }} />
      <div style={{ height: 30, borderRadius: 8, background: "#f1f5f9", marginTop: 12 }} />
    </div>
  </div>
);

export default function BlogDetails() {
  const { slug } = useParams();
  const [blog,       setBlog]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [liked,      setLiked]      = useState(false);
  const [sideAds,    setSideAds]    = useState([]);
  const [adsLoading, setAdsLoading] = useState(true);

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

  /* ── Fetch ads ── */
  useEffect(() => {
    setAdsLoading(true);
    axios
      .get(`${API_BASE_URL}/api/ads`)
      .then((res) => {
        const all = res.data.ads || [];
        // Use spotlight ads for sidebar; fall back to full_banner if none
        const spotlights = all.filter(a => a.isActive && a.bannerType === "spotlight");
        const banners    = all.filter(a => a.isActive && a.bannerType === "full_banner");
        setSideAds((spotlights.length > 0 ? spotlights : banners).map(normalizeDbAd));
      })
      .catch((err) => console.error("Ads fetch failed:", err))
      .finally(() => setAdsLoading(false));
  }, []);

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

  const handleAdNav = (url) => {
    if (!url) return;
    if (url.startsWith("http")) window.open(url, "_blank");
    else window.location.href = url;
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

        /* ── Two-column layout ── */
        .bd-outer { max-width: 1220px; margin: 0 auto; padding: 40px 20px; }

        .bd-layout {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 32px;
          align-items: start;
        }

        /* Left: article column */
        .bd-main { min-width: 0; }

        /* Right: sticky sidebar */
        .bd-sidebar {
          position: sticky;
          top: 88px; /* adjust to match your navbar height */
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .bd-sidebar-label {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #94a3b8;
          margin-bottom: 2px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .bd-sidebar-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e2e8f0;
        }

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
        @media (min-width: 768px) { .bd-content-wrap { padding: 48px 56px; } }

        .bd-meta {
          display: flex; flex-wrap: wrap; align-items: center; gap: 14px;
          margin-bottom: 20px; font-family: 'Outfit', sans-serif;
          font-size: 14px; font-weight: 600; color: #64748b;
        }
        .bd-meta-item { display: flex; align-items: center; gap: 6px; }
        .bd-dot { width: 5px; height: 5px; border-radius: 50%; background: #cbd5e1; }

        .bd-title {
          font-family: 'Outfit', sans-serif;
          font-size: 30px; font-weight: 800; color: #0f172a;
          line-height: 1.2; letter-spacing: -0.4px; margin-bottom: 28px;
        }
        @media (min-width: 768px) { .bd-title { font-size: 38px; } }

        .bd-divider { height: 1px; background: #f1f5f9; margin: 36px 0; }

        /* Article body typography */
        .article-content {
          font-family: 'Lora', serif;
          font-size: 17px;
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
        .article-content h1 { font-size: 30px; }
        .article-content h2 { font-size: 24px; }
        .article-content h3 { font-size: 20px; }
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

        /* Sidebar browse more CTA */
        .bd-browse-cta {
          border-radius: 14px;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border: 1.5px solid #bbf7d0;
          padding: 18px 16px;
          text-align: center;
        }
        .bd-browse-cta h4 {
          font-family: 'Outfit', sans-serif;
          font-size: 15px; font-weight: 800; color: #0f172a; margin: 0 0 6px;
        }
        .bd-browse-cta p {
          font-size: 12px; color: #64748b; margin: 0 0 12px; line-height: 1.5;
        }
        .bd-browse-cta a {
          display: inline-flex; align-items: center; gap: 6px;
          background: #10b981; color: white;
          padding: 8px 18px; border-radius: 8px;
          font-size: 13px; font-weight: 700; text-decoration: none;
          font-family: 'Inter', sans-serif; transition: background 0.2s;
        }
        .bd-browse-cta a:hover { background: #059669; }

        @keyframes bd-spin    { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bd-shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }

        /* Responsive: collapse sidebar on mobile */
        @media (max-width: 900px) {
          .bd-layout {
            grid-template-columns: 1fr;
          }
          .bd-sidebar {
            position: static;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 14px;
          }
          /* Hide label on mobile grid */
          .bd-sidebar-label { display: none; }
        }
        @media (max-width: 480px) {
          .bd-sidebar {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="blog-details-page">
        <Navbar />

        <div className="bd-outer">
          <div className="bd-layout">

            {/* ══ LEFT: Article ══ */}
            <div className="bd-main">
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

            {/* ══ RIGHT: Sticky Sidebar Ads ══ */}
            <aside className="bd-sidebar">

              {/* Ads */}
              {adsLoading ? (
                <>
                  <div className="bd-sidebar-label">Sponsored</div>
                  <AdSkeleton />
                  <AdSkeleton />
                </>
              ) : sideAds.length > 0 ? (
                <>
                  <div className="bd-sidebar-label">Sponsored</div>
                  {sideAds.slice(0, 4).map((ad) => (
                    <SideAdCard
                      key={ad._id}
                      ad={ad}
                      onClick={() => handleAdNav(ad.ctaUrl)}
                    />
                  ))}
                </>
              ) : null}

            </aside>

          </div>
        </div>
      </div>
    </>
  );
}