import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import axios from "axios";
import {
  Building2, MapPin, Phone, Star, ArrowRight, Search,
  ChevronDown, X, CheckCircle, Filter, Loader2
} from "lucide-react";
import API_BASE_URL from "../config/api";

export default function Businesses() {
  const navigate = useNavigate();
  const [biz, setBiz] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { fetchBusinesses(); }, []);

  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest(".biz-dropdown-wrap")) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/profile/business/approved`);
      setBiz(res.data);
    } catch (err) {
      console.error("Failed to fetch businesses:", err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ["All", ...new Set(biz.map(b => b.businessProfile?.category).filter(Boolean))];

  const filtered = biz.filter(b => {
    const matchSearch =
      b.businessProfile?.businessName?.toLowerCase().includes(search.toLowerCase()) ||
      b.businessProfile?.description?.toLowerCase().includes(search.toLowerCase()) ||
      b.businessProfile?.address?.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "All" || b.businessProfile?.category === activeCategory;
    return matchSearch && matchCat;
  });

  const goToDetail = (id) => navigate(`/businesses/${id}`);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        /* ── Reset & Base ── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { overflow-x: hidden; }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #f8fafc;
          color: #0f172a;
          overflow-x: hidden;
        }

        /* ── Animations ── */
        @keyframes pulse  { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes spin   { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        /* ── Wrapper ── */
        .biz-wrapper {
          background: #f8fafc;
          min-height: 100vh;
          width: 100%;
          overflow-x: hidden;
        }

        /* ══ HERO ══ */
        .biz-hero {
          background: linear-gradient(160deg, #052e16 0%, #14532d 50%, #166534 100%);
          padding: 64px 24px 88px;
          position: relative;
          overflow: visible;
          width: 100%;
        }
        .biz-hero::before {
          content: '';
          position: absolute;
          width: 500px; height: 500px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.06);
          top: -200px; left: -180px;
          pointer-events: none;
        }
        .biz-hero::after {
          content: '';
          position: absolute;
          width: 350px; height: 350px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.06);
          top: 40px; right: -120px;
          pointer-events: none;
        }
        .biz-hero-glow {
          position: absolute; inset: 0;
          background: radial-gradient(circle at 70% 20%, rgba(16,185,129,0.15) 0%, transparent 60%);
          pointer-events: none;
        }
        .biz-hero-inner {
          max-width: 900px;
          margin: 0 auto;
          text-align: center;
          position: relative;
          z-index: 1;
        }

        .biz-hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 16px;
          background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2);
          border-radius: 50px; color: #10b981; font-size: 13px; font-weight: 600;
          margin-bottom: 24px;
        }
        .biz-hero-badge-dot {
          width: 6px; height: 6px; background: #10b981; border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .biz-hero-title {
          font-size: 40px; font-weight: 800; color: white;
          margin-bottom: 16px; line-height: 1.15; letter-spacing: -0.5px;
        }
        .biz-hero-title span { color: #10b981; }

        .biz-hero-subtitle {
          font-size: 17px; color: #94a3b8; max-width: 520px;
          margin: 0 auto 40px; line-height: 1.6; font-weight: 400;
        }

        /* ── Search container ── */
        .biz-search-container {
          max-width: 900px;
          margin: 0 auto;
          position: relative;
          z-index: 999;
          width: 100%;
        }
        .biz-search-box {
          background: white; border-radius: 12px; padding: 8px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          display: flex; gap: 8px; flex-wrap: wrap;
          width: 100%;
        }
        .biz-search-wrap {
          flex: 1 1 200px;
          position: relative;
          min-width: 0;
        }
        .biz-search-icon {
          position: absolute; left: 16px; top: 50%;
          transform: translateY(-50%);
          color: #94a3b8; pointer-events: none;
          z-index: 1;
        }
        .biz-search-input {
          width: 100%; padding: 13px 16px 13px 48px;
          font-size: 14px; font-family: 'Inter', sans-serif;
          background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
          outline: none; transition: all 0.2s; color: #0f172a;
        }
        .biz-search-input:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
          background: white;
        }
        .biz-search-input::placeholder { color: #94a3b8; }
        .biz-search-clear {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: #f1f5f9; border: none; border-radius: 50%;
          width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #64748b; transition: all 0.15s;
        }
        .biz-search-clear:hover { background: #e2e8f0; color: #0f172a; }

        /* ── Category dropdown ── */
        .biz-dropdown-wrap {
          position: relative;
          flex: 0 0 auto;
          z-index: 9999;
        }
        .biz-dropdown-btn {
          display: flex; align-items: center; justify-content: space-between; gap: 8px;
          padding: 13px 14px; width: 100%;
          font-size: 14px; font-weight: 600; font-family: 'Inter', sans-serif;
          background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
          color: #475569; cursor: pointer; transition: all 0.2s; white-space: nowrap;
          min-width: 0;
        }
        .biz-dropdown-btn:hover, .biz-dropdown-btn.open { border-color: #10b981; color: #10b981; background: #f0fdf4; }
        .biz-dropdown-btn.has-value { border-color: #6ee7b7; background: #d1fae5; color: #065f46; }
        .biz-dd-chevron { transition: transform 0.2s; color: #94a3b8; flex-shrink: 0; }
        .biz-dropdown-btn.open .biz-dd-chevron { transform: rotate(180deg); color: #10b981; }

        .biz-dropdown-panel {
          position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 9999;
          background: white; border: 1px solid #e2e8f0; border-radius: 12px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.05);
          overflow: hidden; max-height: 260px; overflow-y: auto;
          animation: dropIn 0.16s cubic-bezier(0.16,1,0.3,1);
          scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent;
          min-width: 180px;
        }
        .biz-dropdown-panel::-webkit-scrollbar { width: 4px; }
        .biz-dropdown-panel::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }

        .biz-dd-item {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 14px; font-size: 13.5px; font-weight: 500;
          color: #374151; cursor: pointer; transition: background 0.12s;
          border: none; background: none; width: 100%; text-align: left;
          font-family: 'Inter', sans-serif;
        }
        .biz-dd-item:hover { background: #f8fafc; color: #111827; }
        .biz-dd-item.active { background: #d1fae5; color: #065f46; font-weight: 700; }
        .biz-dd-check { width: 16px; height: 16px; border-radius: 50%; background: #10b981; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .biz-dd-check::after { content: ''; width: 4px; height: 8px; border: 2px solid white; border-top: none; border-left: none; transform: rotate(45deg) translateY(-1px); display: block; }
        .biz-dd-divider { height: 1px; background: #f1f5f9; margin: 4px 0; }

        /* ── Filter / Clear buttons ── */
        .biz-filter-btn {
          flex: 0 0 auto;
          display: flex; align-items: center; gap: 6px;
          padding: 13px 16px; font-size: 14px; font-weight: 600;
          color: #475569; background: #f8fafc; border: 1px solid #e2e8f0;
          border-radius: 8px; cursor: pointer; font-family: 'Inter', sans-serif;
          transition: all 0.2s; white-space: nowrap;
        }
        .biz-filter-btn:hover, .biz-filter-btn.active { border-color: #10b981; color: #10b981; background: #f0fdf4; }
        .biz-clear-btn {
          flex: 0 0 auto;
          padding: 13px 18px; font-size: 14px; font-weight: 600;
          color: #64748b; background: white; border: 1px solid #e2e8f0; border-radius: 8px;
          cursor: pointer; display: flex; align-items: center; gap: 6px;
          transition: background 0.2s, color 0.2s; font-family: 'Inter', sans-serif;
          white-space: nowrap;
        }
        .biz-clear-btn:hover { background: #f8fafc; color: #475569; }

        /* ── Stats bar ── */
        .biz-stats-bar {
          max-width: 1200px;
          margin: -24px auto 36px;
          padding: 0 24px;
          position: relative;
          z-index: 5;
        }
        .biz-stats-card {
          background: white; border: 1px solid #e2e8f0; border-radius: 10px;
          padding: 14px 20px; display: flex; align-items: center; gap: 14px;
          flex-wrap: wrap; font-size: 14px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .biz-stat-item { color: #64748b; white-space: nowrap; }
        .biz-stat-value { font-weight: 700; color: #0f172a; }
        .biz-stat-divider { color: #e2e8f0; }
        .biz-verified-badge {
          margin-left: auto; color: #10b981; font-weight: 600;
          display: flex; align-items: center; gap: 6px; font-size: 13px;
          white-space: nowrap;
        }

        /* ══ BODY ══ */
        .biz-body { padding: 0 0 80px; }
        .biz-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          width: 100%;
        }

        .biz-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        /* ── Card ── */
        .biz-card {
          background: white; border: 1px solid #e2e8f0; border-radius: 12px;
          overflow: hidden; transition: all 0.2s; cursor: pointer;
          display: flex; flex-direction: column;
          animation: fadeUp 0.3s ease both;
          min-width: 0;
        }
        .biz-card:hover { border-color: #10b981; box-shadow: 0 4px 20px rgba(16,185,129,0.1); transform: translateY(-2px); }

        .biz-card-img-wrap {
          position: relative; height: 190px; overflow: hidden;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          flex-shrink: 0;
        }
        .biz-card-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.5s ease; }
        .biz-card:hover .biz-card-img { transform: scale(1.04); }
        .biz-card-img-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.18) 0%, transparent 50%); }

        .biz-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          color: #86efac;
        }

        .biz-card-tags { position: absolute; top: 12px; left: 12px; display: flex; gap: 6px; }
        .biz-tag {
          padding: 4px 10px; border-radius: 6px;
          font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
          backdrop-filter: blur(8px);
        }
        .biz-tag-verified { background: rgba(255,255,255,0.9); color: #065f46; display: flex; align-items: center; gap: 4px; }
        .biz-tag-cat { background: rgba(15,23,42,0.7); color: #94a3b8; }

        .biz-img-count {
          position: absolute; bottom: 10px; right: 12px;
          background: rgba(0,0,0,0.55); backdrop-filter: blur(4px);
          color: white; padding: 3px 10px; border-radius: 20px;
          font-size: 12px; font-weight: 600;
        }

        .biz-card-body { padding: 20px 20px 16px; flex: 1; display: flex; flex-direction: column; min-width: 0; }

        .biz-card-name {
          font-size: 17px; font-weight: 700; color: #0f172a; margin-bottom: 10px;
          line-height: 1.35; transition: color 0.2s;
          word-break: break-word;
        }
        .biz-card:hover .biz-card-name { color: #10b981; }

        .biz-card-desc {
          font-size: 13.5px; color: #64748b; line-height: 1.65; margin-bottom: 14px;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
          font-weight: 400;
        }

        .biz-card-divider { height: 1px; background: #f1f5f9; margin-bottom: 14px; }

        .biz-card-meta { display: flex; flex-direction: column; gap: 7px; margin-bottom: 16px; }
        .biz-card-meta-item {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; color: #64748b; min-width: 0;
        }
        .biz-card-meta-item svg { flex-shrink: 0; color: #10b981; }
        .biz-card-meta-item span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .biz-card-cta {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 11px 16px; margin-top: auto;
          background: #0f172a; color: white; border: none; border-radius: 8px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          transition: background 0.2s; font-family: 'Inter', sans-serif;
          white-space: nowrap;
        }
        .biz-card-cta:hover { background: #10b981; }
        .biz-cta-arrow { transition: transform 0.2s; }
        .biz-card-cta:hover .biz-cta-arrow { transform: translateX(3px); }

        /* ── Skeletons ── */
        .biz-loading-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }
        .biz-skeleton { background: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
        .biz-skeleton-img {
          height: 190px;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%; animation: shimmer 1.5s infinite;
        }
        .biz-skeleton-body { padding: 20px; display: flex; flex-direction: column; gap: 10px; }
        .biz-skeleton-line {
          height: 13px; border-radius: 6px;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%; animation: shimmer 1.5s infinite;
        }

        /* ── Empty / error ── */
        .biz-empty {
          text-align: center; padding: 80px 24px;
          background: white; border: 1px solid #e2e8f0; border-radius: 12px;
        }
        .biz-state-icon {
          width: 64px; height: 64px; margin: 0 auto 20px;
          background: #f1f5f9; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }
        .biz-state-title { font-size: 20px; font-weight: 600; color: #0f172a; margin-bottom: 8px; }
        .biz-state-desc  { font-size: 15px; color: #64748b; margin-bottom: 24px; }
        .biz-btn-action {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 24px; background: #10b981; color: white;
          font-size: 14px; font-weight: 600; border: none; border-radius: 8px;
          cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif;
        }
        .biz-btn-action:hover { background: #059669; }

        /* ══ RESPONSIVE — tablet ══ */
        @media (max-width: 900px) {
          .biz-hero-title { font-size: 32px; }
          .biz-grid,
          .biz-loading-grid { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
        }

        /* ══ RESPONSIVE — mobile ══ */
        @media (max-width: 768px) {
          .biz-hero { padding: 36px 16px 72px; }
          .biz-hero-title { font-size: 26px; }
          .biz-hero-subtitle { font-size: 15px; margin-bottom: 28px; }

          .biz-search-container { padding: 0; }
          .biz-search-box { flex-direction: column; gap: 8px; border-radius: 10px; }
          .biz-search-wrap { flex: 1 1 auto; width: 100%; }
          .biz-dropdown-wrap { width: 100%; }
          .biz-dropdown-btn { width: 100%; }
          .biz-filter-btn { width: 100%; justify-content: center; }
          .biz-clear-btn { width: 100%; justify-content: center; }

          .biz-stats-bar { margin: -20px auto 28px; padding: 0 16px; }
          .biz-stats-card { padding: 12px 16px; gap: 8px; font-size: 13px; flex-wrap: wrap; }
          .biz-stat-divider { display: none; }
          .biz-verified-badge { margin-left: 0; }

          .biz-container { padding: 0 16px; }
          .biz-grid,
          .biz-loading-grid { grid-template-columns: 1fr; gap: 14px; }

          .biz-card-body { padding: 16px; }
          .biz-card-name { font-size: 16px; }
        }

        /* ══ RESPONSIVE — small mobile ══ */
        @media (max-width: 480px) {
          .biz-hero-title { font-size: 22px; }
          .biz-hero-badge { font-size: 12px; padding: 5px 12px; }
          .biz-hero-subtitle { font-size: 14px; }
          .biz-stats-card { flex-direction: column; align-items: flex-start; gap: 6px; }
          .biz-verified-badge { width: auto; }
          .biz-search-box { padding: 6px; }
        }
      `}</style>

      <Navbar />

      <div className="biz-wrapper">

        {/* ══ HERO ══ */}
        <div className="biz-hero">
          <div className="biz-hero-glow" />
          <div className="biz-hero-inner">
            <div className="biz-hero-badge">
              <span className="biz-hero-badge-dot" />
              {filtered.length} verified {filtered.length === 1 ? "company" : "companies"}
            </div>
            <h1 className="biz-hero-title">
              Find your next <span>Green Company</span>
            </h1>
            <p className="biz-hero-subtitle">
              Every business here has been carefully vetted and approved. Discover companies building India's renewable future.
            </p>
          </div>

          <div className="biz-search-container">
            <div className="biz-search-box">
              <div className="biz-search-wrap">
                <Search className="biz-search-icon" size={18} />
                <input
                  className="biz-search-input"
                  placeholder="Search companies, locations..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button className="biz-search-clear" onClick={() => setSearch("")}>
                    <X size={12} />
                  </button>
                )}
              </div>

              <div className="biz-dropdown-wrap">
                <button
                  className={`biz-dropdown-btn${dropdownOpen ? " open" : ""}${activeCategory !== "All" ? " has-value" : ""}`}
                  onClick={() => setDropdownOpen(v => !v)}
                >
                  <span>{activeCategory === "All" ? "All Categories" : activeCategory}</span>
                  <ChevronDown size={15} className="biz-dd-chevron" />
                </button>
                {dropdownOpen && (
                  <div className="biz-dropdown-panel">
                    {categories.map((cat, idx) => (
                      <React.Fragment key={cat}>
                        {idx === 1 && <div className="biz-dd-divider" />}
                        <button
                          className={`biz-dd-item${activeCategory === cat ? " active" : ""}`}
                          onClick={() => { setActiveCategory(cat); setDropdownOpen(false); }}
                        >
                          <span>{cat === "All" ? "All Categories" : cat}</span>
                          {activeCategory === cat && <span className="biz-dd-check" />}
                        </button>
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>

              <button
                className={`biz-filter-btn${showFilters ? " active" : ""}`}
                onClick={() => setShowFilters(v => !v)}
              >
                <Filter size={15} />
                Filters
              </button>

              {(search || activeCategory !== "All") && (
                <button
                  className="biz-clear-btn"
                  onClick={() => { setSearch(""); setActiveCategory("All"); }}
                >
                  <X size={15} />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ══ STATS BAR ══ */}
        <div className="biz-stats-bar">
          <div className="biz-stats-card">
            <span className="biz-stat-item"><span className="biz-stat-value">{filtered.length}</span> companies</span>
            <span className="biz-stat-divider">|</span>
            <span className="biz-stat-item"><span className="biz-stat-value">{categories.length - 1}</span> categories</span>
            <span className="biz-stat-divider">|</span>
            <span className="biz-stat-item"><span className="biz-stat-value">{biz.length}</span> total verified</span>
            <span className="biz-verified-badge">
              <CheckCircle size={14} />
              Approved businesses
            </span>
          </div>
        </div>

        {/* ══ BODY ══ */}
        <div className="biz-body">
          <div className="biz-container">

            {loading ? (
              <div className="biz-loading-grid">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="biz-skeleton" style={{ animationDelay: `${i * 0.07}s` }}>
                    <div className="biz-skeleton-img" />
                    <div className="biz-skeleton-body">
                      <div className="biz-skeleton-line" style={{ width: "40%" }} />
                      <div className="biz-skeleton-line" style={{ width: "75%", height: 18 }} />
                      <div className="biz-skeleton-line" style={{ width: "90%" }} />
                      <div className="biz-skeleton-line" style={{ width: "60%" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="biz-empty">
                <div className="biz-state-icon">
                  <Building2 size={32} color="#cbd5e1" />
                </div>
                <h3 className="biz-state-title">
                  {search ? `No results for "${search}"` : "No businesses yet"}
                </h3>
                <p className="biz-state-desc">
                  {search ? "Try a different search term or category." : "Verified businesses will appear here soon."}
                </p>
                {(search || activeCategory !== "All") && (
                  <button className="biz-btn-action" onClick={() => { setSearch(""); setActiveCategory("All"); }}>
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="biz-grid">
                {filtered.map((b, idx) => (
                  <div
                    key={b._id}
                    className="biz-card"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                    onClick={() => goToDetail(b._id)}
                  >
                    {/* Image */}
                    <div className="biz-card-img-wrap">
                      {b.profilePicture ? (
                        <>
                          <img
                            src={b.profilePicture}
                            alt={b.businessProfile?.businessName}
                            className="biz-card-img"
                          />
                          <div className="biz-card-img-overlay" />
                        </>
                      ) : b.businessProfile?.images?.[0] ? (
                        <>
                          <img
                            src={b.businessProfile.images[0]}
                            alt={b.businessProfile.businessName}
                            className="biz-card-img"
                          />
                          <div className="biz-card-img-overlay" />
                          {b.businessProfile.images.length > 1 && (
                            <div className="biz-img-count">+{b.businessProfile.images.length - 1} photos</div>
                          )}
                        </>
                      ) : (
                        <div className="biz-placeholder">
                          <Building2 size={48} />
                        </div>
                      )}
                      <div className="biz-card-tags">
                        <span className="biz-tag biz-tag-verified">
                          <Star size={10} fill="currentColor" />
                          Verified
                        </span>
                        {b.businessProfile?.category && (
                          <span className="biz-tag biz-tag-cat">{b.businessProfile.category}</span>
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="biz-card-body">
                      <h3 className="biz-card-name">{b.businessProfile?.businessName}</h3>

                      {b.businessProfile?.description && (
                        <p className="biz-card-desc">{b.businessProfile.description}</p>
                      )}

                      <div className="biz-card-divider" />

                      <div className="biz-card-meta">
                        {b.businessProfile?.address && (
                          <div className="biz-card-meta-item">
                            <MapPin size={13} />
                            <span>{b.businessProfile.address}</span>
                          </div>
                        )}
                        {b.businessProfile?.contactDetails && (
                          <div className="biz-card-meta-item">
                            <Phone size={13} />
                            <span>{b.businessProfile.contactDetails}</span>
                          </div>
                        )}
                      </div>

                      <button
                        className="biz-card-cta"
                        onClick={(e) => { e.stopPropagation(); goToDetail(b._id); }}
                      >
                        View Details
                        <ArrowRight size={15} className="biz-cta-arrow" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}