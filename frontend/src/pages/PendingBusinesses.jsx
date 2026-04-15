import React, { useEffect, useState } from "react";
import Navbar from "../components/common/Navbar";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import {
  CheckCircle, XCircle, Clock, Building2, MapPin,
  Phone, Image, RefreshCw, Loader2, ArrowLeft,
  ChevronLeft, ChevronRight, Eye, ShieldCheck
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api";
export default function PendingBusinesses() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({}); // per-card loading
  const [imageIndexes, setImageIndexes] = useState({});   // per-card image carousel index
  const [lightboxImg, setLightboxImg] = useState(null);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
  `${API_BASE_URL}/api/profile/business/pending`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBusinesses(res.data);
    } catch (err) {
      toast.error("Failed to fetch pending businesses");
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id, name) => {
    try {
      setActionLoading(prev => ({ ...prev, [id]: 'approving' }));
      await axios.patch(
  `${API_BASE_URL}/api/profile/business/approve/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`"${name}" approved successfully!`);
      fetchBusinesses();
    } catch (err) {
      toast.error("Failed to approve business");
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  const reject = async (id, name) => {
    if (!window.confirm(`Reject "${name}"? This action can be reviewed later.`)) return;
    try {
      setActionLoading(prev => ({ ...prev, [id]: 'rejecting' }));
      await axios.patch(
  `${API_BASE_URL}/api/profile/business/reject/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`"${name}" rejected.`);
      fetchBusinesses();
    } catch (err) {
      toast.error("Failed to reject business");
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  const prevImage = (id, total) => {
    setImageIndexes(prev => ({
      ...prev,
      [id]: ((prev[id] || 0) - 1 + total) % total
    }));
  };

  const nextImage = (id, total) => {
    setImageIndexes(prev => ({
      ...prev,
      [id]: ((prev[id] || 0) + 1) % total
    }));
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .pb-page {
          background: #f8fafc;
          min-height: 100vh;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-weight:800;
          color: #0f172a;
        }

        .pb-container {
          max-width: 1320px;
          margin: 0 auto;
          padding: 32px 24px 64px;
        }

        /* ── Header ── */
        .pb-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 36px;
        }

        .pb-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
          margin-bottom: 10px;
          transition: color 0.15s;
        }
        .pb-back:hover { color: #0f172a; }

        .pb-title {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 32px;
          color: #0f172a;
          line-height: 1.15;
        }

        .pb-subtitle {
          font-size: 14px;
          color: #64748b;
          margin-top: 4px;
        }

        .pb-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pb-count-pill {
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #fde68a;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* ── Refresh btn ── */
        .pb-refresh-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .pb-refresh-btn:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #cbd5e1;
          box-shadow: 0 2px 4px rgba(0,0,0,0.04);
        }
        .pb-refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── Grid ── */
        .pb-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 24px;
        }

        /* ── Card ── */
        .pb-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          transition: box-shadow 0.2s, transform 0.2s;
          animation: fadeUp 0.4s ease both;
        }
        .pb-card:hover {
          box-shadow: 0 8px 24px rgba(0,0,0,0.07);
          transform: translateY(-2px);
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* stagger children */
        .pb-card:nth-child(1)  { animation-delay: 0.05s; }
        .pb-card:nth-child(2)  { animation-delay: 0.10s; }
        .pb-card:nth-child(3)  { animation-delay: 0.15s; }
        .pb-card:nth-child(4)  { animation-delay: 0.20s; }
        .pb-card:nth-child(5)  { animation-delay: 0.25s; }
        .pb-card:nth-child(6)  { animation-delay: 0.30s; }

        /* ── Image carousel ── */
        .pb-img-wrap {
          position: relative;
          width: 100%;
          height: 210px;
          background: #f1f5f9;
          overflow: hidden;
        }

        .pb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: opacity 0.3s;
        }

        .pb-img-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #cbd5e1;
          font-size: 13px;
        }

        .pb-carousel-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255,255,255,0.92);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          transition: all 0.15s;
          color: #0f172a;
        }
        .pb-carousel-btn:hover { background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.18); }
        .pb-carousel-btn.prev { left: 10px; }
        .pb-carousel-btn.next { right: 10px; }

        .pb-img-dots {
          position: absolute;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 5px;
        }
        .pb-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,0.5);
          transition: all 0.2s;
          cursor: pointer;
          border: none;
        }
        .pb-dot.active { background: white; width: 18px; border-radius: 3px; }

        .pb-img-counter {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(0,0,0,0.55);
          color: white;
          font-size: 11px;
          font-weight: 600;
          padding: 3px 9px;
          border-radius: 10px;
          backdrop-filter: blur(4px);
        }

        .pb-fullscreen-btn {
          position: absolute;
          top: 10px;
          left: 10px;
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: rgba(0,0,0,0.45);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          transition: background 0.15s;
          backdrop-filter: blur(4px);
        }
        .pb-fullscreen-btn:hover { background: rgba(0,0,0,0.65); }

        .pb-pending-badge {
          position: absolute;
          bottom: 10px;
          left: 10px;
          background: #f59e0b;
          color: white;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          padding: 3px 10px;
          border-radius: 6px;
        }

        /* ── Card body ── */
        .pb-body {
          padding: 20px;
        }

        .pb-biz-name {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-weight: 700;
          font-size: 20px;
          color: #0f172a;
          margin-bottom: 4px;
          line-height: 1.2;
        }

        .pb-category-tag {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #f0fdf4;
          color: #15803d;
          border: 1px solid #bbf7d0;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 14px;
        }

        .pb-description {
          font-size: 13.5px;
          color: #475569;
          line-height: 1.65;
          margin-bottom: 16px;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .pb-meta-row {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
          padding: 14px;
          background: #f8fafc;
          border-radius: 10px;
          border: 1px solid #f1f5f9;
        }

        .pb-meta-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 13px;
          color: #64748b;
        }

        .pb-meta-item svg { flex-shrink: 0; margin-top: 1px; }

        .pb-divider {
          height: 1px;
          background: #f1f5f9;
          margin-bottom: 16px;
        }

        /* ── Action Buttons ── */
        .pb-actions {
          display: flex;
          gap: 10px;
        }

        .pb-btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 11px 16px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .pb-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .pb-btn-approve {
          background: #10b981;
          color: white;
          box-shadow: 0 2px 8px rgba(16,185,129,0.25);
        }
        .pb-btn-approve:hover:not(:disabled) {
          background: #059669;
          box-shadow: 0 4px 12px rgba(16,185,129,0.35);
          transform: translateY(-1px);
        }

        .pb-btn-reject {
          background: white;
          color: #ef4444;
          border: 1.5px solid #fecaca;
        }
        .pb-btn-reject:hover:not(:disabled) {
          background: #fef2f2;
          border-color: #fca5a5;
        }

        /* ── Empty State ── */
        .pb-empty {
          grid-column: 1 / -1;
          text-align: center;
          padding: 80px 24px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
        }

        .pb-empty-icon {
          width: 72px;
          height: 72px;
          margin: 0 auto 20px;
          background: #f0fdf4;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pb-empty-title {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-weight: 700;
          font-size: 22px;
          color: #0f172a;
          margin-bottom: 8px;
        }

        .pb-empty-desc {
          font-size: 14px;
          color: #94a3b8;
        }

        /* ── Loading overlay ── */
        .pb-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 50vh;
          gap: 14px;
          color: #64748b;
          font-size: 15px;
        }

        /* ── Lightbox ── */
        .pb-lightbox {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.88);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: zoom-out;
          backdrop-filter: blur(8px);
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .pb-lightbox img {
          max-width: 90vw;
          max-height: 88vh;
          border-radius: 12px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.5);
          object-fit: contain;
        }

        .pb-lightbox-close {
          position: fixed;
          top: 20px;
          right: 24px;
          background: rgba(255,255,255,0.12);
          border: none;
          color: white;
          font-size: 26px;
          cursor: pointer;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
          line-height: 1;
        }
        .pb-lightbox-close:hover { background: rgba(255,255,255,0.2); }

        /* ── Spin animation ── */
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }

        @media (max-width: 640px) {
          .pb-grid { grid-template-columns: 1fr; }
          .pb-title { font-size: 26px; }
          .pb-actions { flex-direction: column; }
        }
      `}</style>

      <Navbar />

      <div className="pb-page">
        <div className="pb-container">

          {/* Header */}
          <div className="pb-header">
            <div>
              <button className="pb-back" onClick={() => navigate("/admin")}>
                <ArrowLeft size={15} />
                Back to Dashboard
              </button>
              <h1 className="pb-title">Business Verification</h1>
              <p className="pb-subtitle">Review and approve pending business registrations</p>
            </div>

            <div className="pb-header-right">
              {!loading && (
                <div className="pb-count-pill">
                  <Clock size={14} />
                  {businesses.length} pending
                </div>
              )}
              <button
                className="pb-refresh-btn"
                onClick={fetchBusinesses}
                disabled={loading}
              >
                <RefreshCw size={15} className={loading ? "spin" : ""} />
                Refresh
              </button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="pb-loading">
              <Loader2 size={40} color="#3b82f6" className="spin" />
              Loading pending businesses...
            </div>
          ) : (
            <div className="pb-grid">
              {businesses.length === 0 ? (
                <div className="pb-empty">
                  <div className="pb-empty-icon">
                    <ShieldCheck size={32} color="#10b981" />
                  </div>
                  <div className="pb-empty-title">All caught up!</div>
                  <div className="pb-empty-desc">No businesses are currently awaiting approval.</div>
                </div>
              ) : (
                businesses.map((b) => {
                  const imgs   = b.businessProfile?.images || [];
                  const idx    = imageIndexes[b._id] || 0;
                  const name   = b.businessProfile?.businessName || "Unnamed Business";
                  const action = actionLoading[b._id];

                  return (
                    <div key={b._id} className="pb-card">

                      {/* Image Carousel */}
                      <div className="pb-img-wrap">
                        {imgs.length > 0 ? (
                          <>
                            <img
                              src={imgs[idx]}
                              alt={`${name} ${idx + 1}`}
                              className="pb-img"
                            />

                            {/* Fullscreen */}
                            <button
                              className="pb-fullscreen-btn"
                              onClick={() => setLightboxImg(imgs[idx])}
                              title="View full image"
                            >
                              <Eye size={14} />
                            </button>

                            {/* Counter */}
                            {imgs.length > 1 && (
                              <span className="pb-img-counter">
                                {idx + 1} / {imgs.length}
                              </span>
                            )}

                            {/* Prev / Next */}
                            {imgs.length > 1 && (
                              <>
                                <button className="pb-carousel-btn prev" onClick={() => prevImage(b._id, imgs.length)}>
                                  <ChevronLeft size={16} />
                                </button>
                                <button className="pb-carousel-btn next" onClick={() => nextImage(b._id, imgs.length)}>
                                  <ChevronRight size={16} />
                                </button>

                                {/* Dots */}
                                <div className="pb-img-dots">
                                  {imgs.map((_, i) => (
                                    <button
                                      key={i}
                                      className={`pb-dot ${i === idx ? 'active' : ''}`}
                                      onClick={() => setImageIndexes(prev => ({ ...prev, [b._id]: i }))}
                                    />
                                  ))}
                                </div>
                              </>
                            )}
                          </>
                        ) : (
                          <div className="pb-img-placeholder">
                            <Image size={40} />
                            <span>No images uploaded</span>
                          </div>
                        )}

                        <span className="pb-pending-badge">Pending</span>
                      </div>

                      {/* Body */}
                      <div className="pb-body">
                        <div className="pb-biz-name">{name}</div>

                        {b.businessProfile?.category && (
                          <div className="pb-category-tag">
                            <Building2 size={12} />
                            {b.businessProfile.category}
                          </div>
                        )}

                        <p className="pb-description">
                          {b.businessProfile?.description || "No description provided."}
                        </p>

                        <div className="pb-meta-row">
                          {b.businessProfile?.address && (
                            <div className="pb-meta-item">
                              <MapPin size={14} color="#94a3b8" />
                              <span>{b.businessProfile.address}</span>
                            </div>
                          )}
                          {b.businessProfile?.contactDetails && (
                            <div className="pb-meta-item">
                              <Phone size={14} color="#94a3b8" />
                              <span>{b.businessProfile.contactDetails}</span>
                            </div>
                          )}
                          {b.email && (
                            <div className="pb-meta-item">
                              <span style={{ color: "#94a3b8", fontSize: 13 }}>✉</span>
                              <span>{b.email}</span>
                            </div>
                          )}
                        </div>

                        <div className="pb-divider" />

                        <div className="pb-actions">
                          <button
                            className="pb-btn pb-btn-reject"
                            disabled={!!action}
                            onClick={() => reject(b._id, name)}
                          >
                            {action === 'rejecting' ? (
                              <Loader2 size={15} className="spin" />
                            ) : (
                              <XCircle size={15} />
                            )}
                            {action === 'rejecting' ? 'Rejecting…' : 'Reject'}
                          </button>

                          <button
                            className="pb-btn pb-btn-approve"
                            disabled={!!action}
                            onClick={() => approve(b._id, name)}
                            style={{ flex: 2 }}
                          >
                            {action === 'approving' ? (
                              <Loader2 size={15} className="spin" />
                            ) : (
                              <CheckCircle size={15} />
                            )}
                            {action === 'approving' ? 'Approving…' : 'Approve Business'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxImg && (
        <div className="pb-lightbox" onClick={() => setLightboxImg(null)}>
          <button className="pb-lightbox-close" onClick={() => setLightboxImg(null)}>×</button>
          <img src={lightboxImg} alt="Full view" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}