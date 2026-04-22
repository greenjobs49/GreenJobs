import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import axios from "axios";
import API_BASE_URL from "../config/api";
import {
  Building2, MapPin, Phone, Star, ArrowLeft, CheckCircle,
  ExternalLink, Globe, Mail, Briefcase, Users, Shield,
  ChevronLeft, ChevronRight, X, Loader2, Tag
} from "lucide-react";

export default function BusinessDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightboxIdx, setLightboxIdx] = useState(null);

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/profile/business/approved`);
        const found = res.data.find(b => b._id === id);
        if (found) {
          setBusiness(found);
        } else {
          setError("Business not found.");
        }
      } catch (err) {
        console.error(err);
        setError("Could not load business details.");
      } finally {
        setLoading(false);
      }
    };
    fetchBusiness();
  }, [id]);

  useEffect(() => {
    if (lightboxIdx === null) return;
    const handler = (e) => {
      const images = business?.businessProfile?.images || [];
      if (e.key === "ArrowRight") setLightboxIdx(i => (i + 1) % images.length);
      if (e.key === "ArrowLeft")  setLightboxIdx(i => (i - 1 + images.length) % images.length);
      if (e.key === "Escape")     setLightboxIdx(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIdx, business]);

  const profile = business?.businessProfile || {};
  const images  = profile.images || [];

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
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse   { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes spin    { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes lbIn    { from { opacity: 0; } to { opacity: 1; } }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        .bd-page { min-height: 100vh; background: #f8fafc; width: 100%; overflow-x: hidden; }

        /* ══ HERO BANNER ══ */
        .bd-hero {
          background: linear-gradient(160deg, #052e16 0%, #14532d 50%, #166534 100%);
          padding: 48px 24px 88px;
          position: relative;
          overflow: hidden;
          width: 100%;
        }
        .bd-hero::before {
          content: '';
          position: absolute;
          width: 500px; height: 500px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.06);
          top: -200px; left: -180px;
          pointer-events: none;
        }
        .bd-hero::after {
          content: '';
          position: absolute;
          width: 350px; height: 350px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.06);
          top: 40px; right: -120px;
          pointer-events: none;
        }
        .bd-hero-glow {
          position: absolute; inset: 0;
          background: radial-gradient(circle at 70% 20%, rgba(16,185,129,0.15) 0%, transparent 60%);
          pointer-events: none;
        }

        .bd-back-btn {
          display: inline-flex; align-items: center; gap: 6px;
          color: #86efac; font-size: 13px; font-weight: 500;
          background: none; border: none; cursor: pointer;
          font-family: 'Inter', sans-serif; margin-bottom: 28px;
          transition: color 0.15s; padding: 0;
          position: relative; z-index: 1;
        }
        .bd-back-btn:hover { color: #ffffff; }

        .bd-hero-inner {
          max-width: 900px; margin: 0 auto;
          display: flex; align-items: flex-start; gap: 24px;
          position: relative; z-index: 1;
          flex-wrap: wrap;
        }

        /* Logo / avatar */
        .bd-logo-wrap {
          width: 88px; height: 88px; border-radius: 18px;
          background: rgba(255,255,255,0.08);
          border: 2px solid rgba(16,185,129,0.3);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; overflow: hidden;
          box-shadow: 0 8px 24px rgba(0,0,0,0.25);
        }
        .bd-logo-wrap img { width: 100%; height: 100%; object-fit: cover; }
        .bd-logo-fallback { color: #86efac; }

        .bd-hero-text { flex: 1; min-width: 200px; }
        .bd-hero-tags { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }

        .bd-tag {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 11px; border-radius: 6px;
          font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
        }
        .bd-tag-verified {
          background: rgba(16,185,129,0.15);
          color: #10b981;
          border: 1px solid rgba(16,185,129,0.3);
        }
        .bd-tag-cat {
          background: rgba(255,255,255,0.08);
          color: #94a3b8;
          border: 1px solid rgba(255,255,255,0.12);
        }

        .bd-hero-name {
          font-size: 32px; font-weight: 800; color: white;
          margin-bottom: 10px; line-height: 1.15; letter-spacing: -0.5px;
          word-break: break-word;
        }

        .bd-hero-meta { display: flex; gap: 20px; flex-wrap: wrap; }
        .bd-hero-meta-item {
          display: flex; align-items: center; gap: 6px;
          font-size: 13.5px; color: #94a3b8; font-weight: 500;
        }
        .bd-hero-meta-item svg { color: #10b981; flex-shrink: 0; }

        /* ══ MAIN LAYOUT ══ */
        .bd-main {
          max-width: 900px; margin: -32px auto 0;
          padding: 0 24px 80px;
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 24px;
          align-items: start;
          position: relative; z-index: 2;
        }

        /* ══ SECTIONS ══ */
        .bd-section {
          background: white; border: 1px solid #e2e8f0;
          border-radius: 12px; overflow: hidden; margin-bottom: 20px;
          animation: fadeUp 0.4s ease both;
          min-width: 0;
        }
        .bd-section:nth-child(1) { animation-delay: 0.05s; }
        .bd-section:nth-child(2) { animation-delay: 0.10s; }
        .bd-section:nth-child(3) { animation-delay: 0.15s; }
        .bd-section:nth-child(4) { animation-delay: 0.20s; }

        .bd-section-header {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 20px;
          background: #f0fdf4;
          border-bottom: 1px solid #d1fae5;
          border-left: 3px solid #10b981;
        }
        .bd-section-icon {
          width: 30px; height: 30px; border-radius: 8px;
          background: #d1fae5; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .bd-section-title { font-size: 14px; font-weight: 700; color: #065f46; }

        .bd-section-body { padding: 20px; }

        /* Description */
        .bd-desc {
          font-size: 14.5px; color: #334155; line-height: 1.75;
          font-weight: 400; white-space: pre-wrap; word-break: break-word;
        }

        /* Info grid */
        .bd-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 0;
        }
        .bd-info-item {
          padding: 14px 20px; border-bottom: 1px solid #f8fafc;
        }
        .bd-info-item:last-child { border-bottom: none; }
        .bd-info-label {
          font-size: 11px; font-weight: 700; color: #10b981;
          text-transform: uppercase; letter-spacing: 0.5px;
          margin-bottom: 5px; display: flex; align-items: center; gap: 4px;
        }
        .bd-info-value {
          font-size: 14px; font-weight: 500; color: #0f172a; word-break: break-word;
        }
        .bd-info-value a {
          color: #10b981; text-decoration: none;
          display: inline-flex; align-items: center; gap: 4px;
        }
        .bd-info-value a:hover { text-decoration: underline; }
        .bd-info-empty { color: #cbd5e1; font-style: italic; font-size: 13px; font-weight: 400; }

        /* ── Image gallery ── */
        .bd-gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 10px;
        }
        .bd-gallery-thumb {
          width: 100%; aspect-ratio: 4/3;
          object-fit: cover; border-radius: 8px;
          border: 1px solid #e2e8f0; cursor: pointer;
          transition: all 0.2s;
        }
        .bd-gallery-thumb:hover {
          transform: scale(1.03);
          box-shadow: 0 4px 16px rgba(16,185,129,0.15);
          border-color: #10b981;
        }

        /* ══ SIDEBAR ══ */
        .bd-sidebar { position: sticky; top: 96px; min-width: 0; }

        /* Status card */
        .bd-status-card {
          background: #f0fdf4;
          border: 1px solid #d1fae5;
          border-radius: 12px;
          padding: 16px; margin-bottom: 16px;
          animation: fadeUp 0.4s ease 0.05s both;
        }
        .bd-status-row { display: flex; align-items: center; gap: 10px; }
        .bd-status-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #10b981; animation: pulse 2s infinite; flex-shrink: 0;
        }
        .bd-status-label { font-size: 13px; font-weight: 700; color: #065f46; }
        .bd-status-sub { font-size: 12px; color: #16a34a; margin-top: 4px; margin-left: 18px; }

        /* Contact card */
        .bd-contact-card {
          background: white; border: 1px solid #e2e8f0; border-radius: 12px;
          overflow: hidden; margin-bottom: 16px;
          animation: fadeUp 0.4s ease 0.1s both;
        }
        .bd-contact-header {
          padding: 14px 18px;
          background: linear-gradient(160deg, #052e16 0%, #14532d 100%);
          display: flex; align-items: center; gap: 10px;
        }
        .bd-contact-header-title { font-size: 14px; font-weight: 700; color: white; }

        .bd-contact-body { padding: 16px; display: flex; flex-direction: column; gap: 12px; }

        .bd-contact-item {
          display: flex; align-items: center; gap: 10px;
          font-size: 13.5px; color: #374151; font-weight: 500;
          min-width: 0;
        }
        .bd-contact-icon {
          width: 34px; height: 34px; border-radius: 9px;
          background: #f0fdf4; border: 1px solid #d1fae5;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; color: #10b981;
        }
        .bd-contact-item span {
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0;
        }
        .bd-contact-item a { color: #374151; text-decoration: none; }
        .bd-contact-item a:hover { color: #10b981; }

        /* CTA buttons */
        .bd-jobs-btn {
          width: 100%; padding: 13px 16px;
          background: linear-gradient(135deg, #16a34a, #10b981);
          color: white; border: none; border-radius: 10px;
          font-size: 14px; font-weight: 700; cursor: pointer;
          transition: all 0.2s; font-family: 'Inter', sans-serif;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 3px 12px rgba(16,185,129,0.3);
          margin-bottom: 10px;
        }
        .bd-jobs-btn:hover {
          background: linear-gradient(135deg, #15803d, #059669);
          box-shadow: 0 5px 18px rgba(16,185,129,0.4);
          transform: translateY(-1px);
        }

        .bd-back-link {
          width: 100%; padding: 11px 16px;
          background: white; color: #475569;
          border: 1.5px solid #e2e8f0; border-radius: 10px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          transition: all 0.18s; font-family: 'Inter', sans-serif;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .bd-back-link:hover { border-color: #10b981; background: #f0fdf4; color: #065f46; }

        /* ══ LIGHTBOX ══ */
        .bd-lightbox {
          position: fixed; inset: 0; z-index: 99999;
          background: rgba(0,0,0,0.92); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          animation: lbIn 0.2s ease;
        }
        .bd-lb-img {
          max-width: 90vw; max-height: 85vh;
          border-radius: 12px; object-fit: contain;
          box-shadow: 0 24px 80px rgba(0,0,0,0.6);
        }
        .bd-lb-close {
          position: absolute; top: 20px; right: 20px;
          background: rgba(255,255,255,0.1); border: none; border-radius: 50%;
          width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: white; transition: background 0.15s;
        }
        .bd-lb-close:hover { background: rgba(255,255,255,0.2); }
        .bd-lb-prev, .bd-lb-next {
          position: absolute; top: 50%; transform: translateY(-50%);
          background: rgba(255,255,255,0.1); border: none; border-radius: 50%;
          width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: white; transition: background 0.15s;
        }
        .bd-lb-prev { left: 20px; }
        .bd-lb-next { right: 20px; }
        .bd-lb-prev:hover, .bd-lb-next:hover { background: rgba(16,185,129,0.3); }
        .bd-lb-counter {
          position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
          color: rgba(255,255,255,0.6); font-size: 13px; font-weight: 500;
        }

        /* ══ LOADING / ERROR ══ */
        .bd-center {
          min-height: calc(100vh - 82px);
          display: flex; align-items: center; justify-content: center;
          flex-direction: column; gap: 16px; padding: 40px;
          text-align: center;
        }
        .bd-state-icon {
          width: 64px; height: 64px; background: #f0fdf4;
          border: 1px solid #d1fae5;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center; margin: 0 auto;
        }
        .bd-state-title { font-size: 20px; font-weight: 600; color: #0f172a; }
        .bd-state-desc  { font-size: 14px; color: #64748b; }
        .bd-btn-back {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 24px;
          background: linear-gradient(135deg, #16a34a, #10b981);
          color: white;
          border: none; border-radius: 8px; font-size: 14px; font-weight: 600;
          cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.2s;
          box-shadow: 0 3px 12px rgba(16,185,129,0.3);
        }
        .bd-btn-back:hover { background: linear-gradient(135deg, #15803d, #059669); }
        .spinner { animation: spin 1s linear infinite; }

        /* ══ RESPONSIVE — tablet ══ */
        @media (max-width: 900px) {
          .bd-hero-name { font-size: 26px; }
          .bd-main { grid-template-columns: 1fr 240px; }
        }

        /* ══ RESPONSIVE — mobile ══ */
        @media (max-width: 768px) {
          .bd-hero { padding: 36px 16px 72px; }
          .bd-hero-name { font-size: 22px; }
          .bd-hero-meta { gap: 12px; }
          .bd-hero-meta-item { font-size: 13px; }

          .bd-main {
            grid-template-columns: 1fr;
            margin-top: -24px;
            padding: 0 16px 60px;
            gap: 0;
          }
          .bd-sidebar { position: static; margin-top: 0; }

          .bd-gallery-grid { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); }
          .bd-info-grid { grid-template-columns: 1fr; }

          .bd-logo-wrap { width: 72px; height: 72px; border-radius: 14px; }
        }

        /* ══ RESPONSIVE — small mobile ══ */
        @media (max-width: 480px) {
          .bd-hero { padding: 28px 16px 64px; }
          .bd-hero-name { font-size: 20px; }
          .bd-hero-inner { gap: 16px; }
          .bd-logo-wrap { width: 60px; height: 60px; border-radius: 12px; }
          .bd-section-body { padding: 16px; }
          .bd-info-item { padding: 12px 16px; }
          .bd-gallery-grid { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 8px; }
        }
      `}</style>

      <Navbar />

      <div className="bd-page">

        {/* ── Loading ── */}
        {loading && (
          <div className="bd-center">
            <Loader2 size={36} color="#10b981" className="spinner" />
            <p style={{ color: "#64748b", fontSize: 14 }}>Loading business details...</p>
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div className="bd-center">
            <div className="bd-state-icon"><Building2 size={32} color="#10b981" /></div>
            <h3 className="bd-state-title">{error}</h3>
            <p className="bd-state-desc">The business you're looking for may not exist.</p>
            <button className="bd-btn-back" onClick={() => navigate("/businesses")}>
              <ArrowLeft size={15} /> Back to Companies
            </button>
          </div>
        )}

        {/* ── Content ── */}
        {!loading && business && (
          <>
            {/* HERO */}
            <div className="bd-hero">
              <div className="bd-hero-glow" />
              <div style={{ maxWidth: 900, margin: "0 auto", position: "relative", zIndex: 1 }}>
                <button className="bd-back-btn" onClick={() => navigate("/businesses")}>
                  <ArrowLeft size={14} /> Back to Companies
                </button>
              </div>
              <div className="bd-hero-inner">
                {/* Logo */}
                <div className="bd-logo-wrap">
                  {business.profilePicture ? (
                    <img src={business.profilePicture} alt={profile.businessName} />
                  ) : profile.images?.[0] ? (
                    <img src={profile.images[0]} alt={profile.businessName} />
                  ) : (
                    <Building2 size={38} className="bd-logo-fallback" />
                  )}
                </div>

                <div className="bd-hero-text">
                  <div className="bd-hero-tags">
                    <span className="bd-tag bd-tag-verified">
                      <Star size={10} fill="currentColor" />
                      Verified
                    </span>
                    {profile.category && (
                      <span className="bd-tag bd-tag-cat">
                        <Tag size={10} />
                        {profile.category}
                      </span>
                    )}
                    {profile.status === "approved" && (
                      <span className="bd-tag bd-tag-verified">
                        <CheckCircle size={10} />
                        Approved
                      </span>
                    )}
                  </div>

                  <h1 className="bd-hero-name">{profile.businessName || "Business"}</h1>

                  <div className="bd-hero-meta">
                    {profile.address && (
                      <div className="bd-hero-meta-item">
                        <MapPin size={14} />
                        {profile.address}
                      </div>
                    )}
                    {profile.contactDetails && (
                      <div className="bd-hero-meta-item">
                        <Phone size={14} />
                        {profile.contactDetails}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* MAIN + SIDEBAR */}
            <div className="bd-main">

              {/* ── LEFT COLUMN ── */}
              <div>

                {/* About */}
                {profile.description && (
                  <div className="bd-section">
                    <div className="bd-section-header">
                      <div className="bd-section-icon"><Building2 size={15} color="#10b981" /></div>
                      <span className="bd-section-title">About this Business</span>
                    </div>
                    <div className="bd-section-body">
                      <p className="bd-desc">{profile.description}</p>
                    </div>
                  </div>
                )}

                {/* Business details */}
                <div className="bd-section">
                  <div className="bd-section-header">
                    <div className="bd-section-icon"><Shield size={15} color="#10b981" /></div>
                    <span className="bd-section-title">Business Information</span>
                  </div>
                  <div className="bd-info-grid">
                    {[
                      { label: "Business Name", value: profile.businessName,    icon: Building2 },
                      { label: "Category",      value: profile.category,         icon: Tag },
                      { label: "Address",       value: profile.address,          icon: MapPin },
                      { label: "Contact",       value: profile.contactDetails,   icon: Phone },
                      { label: "Verified",      value: profile.verified ? "Yes ✓" : "Pending", icon: CheckCircle },
                      { label: "Status",        value: profile.status ? profile.status.charAt(0).toUpperCase() + profile.status.slice(1) : null, icon: Shield },
                    ].map(({ label, value, icon: Icon }) => (
                      <div className="bd-info-item" key={label}>
                        <div className="bd-info-label"><Icon size={10} />{label}</div>
                        <div className="bd-info-value">
                          {value ? value : <span className="bd-info-empty">Not provided</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Photo gallery */}
                {images.length > 0 && (
                  <div className="bd-section">
                    <div className="bd-section-header">
                      <div className="bd-section-icon"><Globe size={15} color="#10b981" /></div>
                      <span className="bd-section-title">Photos · {images.length}</span>
                    </div>
                    <div className="bd-section-body">
                      <div className="bd-gallery-grid">
                        {images.map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt={`${profile.businessName} ${i + 1}`}
                            className="bd-gallery-thumb"
                            onClick={() => setLightboxIdx(i)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* ── SIDEBAR ── */}
              <div className="bd-sidebar">

                {/* Verification status */}
                <div className="bd-status-card">
                  <div className="bd-status-row">
                    <div className="bd-status-dot" />
                    <span className="bd-status-label">Verified Business</span>
                  </div>
                  <p className="bd-status-sub">Reviewed and approved by GreenJobs team</p>
                </div>

                {/* Contact card */}
                <div className="bd-contact-card">
                  <div className="bd-contact-header">
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Phone size={14} color="#10b981" />
                    </div>
                    <span className="bd-contact-header-title">Contact Details</span>
                  </div>
                  <div className="bd-contact-body">
                    {profile.contactDetails ? (
                      <div className="bd-contact-item">
                        <div className="bd-contact-icon"><Phone size={14} /></div>
                        <span>{profile.contactDetails}</span>
                      </div>
                    ) : null}
                    {profile.address ? (
                      <div className="bd-contact-item">
                        <div className="bd-contact-icon"><MapPin size={14} /></div>
                        <span>{profile.address}</span>
                      </div>
                    ) : null}
                    {!profile.contactDetails && !profile.address && (
                      <p style={{ fontSize: 13, color: "#94a3b8", fontStyle: "italic" }}>No contact details provided.</p>
                    )}
                  </div>
                </div>

                {/* CTA buttons */}
                <button
                  className="bd-jobs-btn"
                  onClick={() => navigate(`/jobs?company=${encodeURIComponent(profile.businessName || "")}`)}
                >
                  <Briefcase size={15} />
                  View Jobs from This Company
                </button>

                <button className="bd-back-link" onClick={() => navigate("/businesses")}>
                  <ArrowLeft size={14} />
                  All Companies
                </button>

              </div>
            </div>
          </>
        )}
      </div>

      {/* ══ LIGHTBOX ══ */}
      {lightboxIdx !== null && images.length > 0 && (
        <div className="bd-lightbox" onClick={() => setLightboxIdx(null)}>
          <button className="bd-lb-close" onClick={() => setLightboxIdx(null)}><X size={18} /></button>

          {images.length > 1 && (
            <button className="bd-lb-prev" onClick={(e) => { e.stopPropagation(); setLightboxIdx(i => (i - 1 + images.length) % images.length); }}>
              <ChevronLeft size={22} />
            </button>
          )}

          <img
            src={images[lightboxIdx]}
            alt={`Photo ${lightboxIdx + 1}`}
            className="bd-lb-img"
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <button className="bd-lb-next" onClick={(e) => { e.stopPropagation(); setLightboxIdx(i => (i + 1) % images.length); }}>
              <ChevronRight size={22} />
            </button>
          )}

          {images.length > 1 && (
            <div className="bd-lb-counter">{lightboxIdx + 1} / {images.length}</div>
          )}
        </div>
      )}
    </>
  );
}