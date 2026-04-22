import React, { useState, useEffect } from "react";
import Navbar from "../components/common/Navbar";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import ApplyModal from "./ApplyModal";
import API_BASE_URL from "../config/api";
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Gift,
  Layers,
  CheckCircle,
  Building2,
  Code2,
  Users,
  ExternalLink,
  Loader2,
  Send,
  X,
  FileText,
  ChevronRight,
  Star,
  AlertCircle,
  BadgeCheck,
} from "lucide-react";

const RupeeIcon = ({ size = 20, color = "#065f46" }) => (
  <span style={{ fontSize: size, fontWeight: 700, color, fontFamily: "'Inter', sans-serif" }}>₹</span>
);

const ROUND_TYPE_LABELS = {
  resume_screening: "Resume Screening",
  online_test: "Online Test",
  aptitude_test: "Aptitude Test",
  technical_interview: "Technical Interview",
  hr_interview: "HR Interview",
  group_discussion: "Group Discussion",
  assignment: "Assignment",
  final_interview: "Final Interview",
  offer: "Offer / Selection",
  other: "Other",
};

/* ── Always return an array of types ── */
const getTypeArr = (type) => {
  if (Array.isArray(type)) return type.filter(Boolean);
  if (typeof type === "string" && type.trim()) return [type.trim()];
  return [];
};

/* ── Per-type colour map ── */
const TYPE_COLORS = {
  "Full Time":  { bg: "rgba(59,130,246,0.15)",  border: "rgba(59,130,246,0.3)",  color: "#93c5fd" },
  "Part Time":  { bg: "rgba(139,92,246,0.15)",  border: "rgba(139,92,246,0.3)",  color: "#c4b5fd" },
  "Internship": { bg: "rgba(245,158,11,0.15)",  border: "rgba(245,158,11,0.3)",  color: "#fcd34d" },
  "Contract":   { bg: "rgba(239,68,68,0.15)",   border: "rgba(239,68,68,0.3)",   color: "#fca5a5" },
  "Remote":     { bg: "rgba(16,185,129,0.15)",  border: "rgba(16,185,129,0.3)",  color: "#6ee7b7" },
  "Freelance":  { bg: "rgba(236,72,153,0.15)",  border: "rgba(236,72,153,0.3)",  color: "#f9a8d4" },
};
const defaultTypeColor = { bg: "rgba(148,163,184,0.15)", border: "rgba(148,163,184,0.3)", color: "rgba(255,255,255,0.6)" };

/* ── Light (card) colour map ── */
const TYPE_COLORS_LIGHT = {
  "Full Time":  { bg: "#dbeafe", color: "#1e40af" },
  "Part Time":  { bg: "#ede9fe", color: "#6d28d9" },
  "Internship": { bg: "#fef3c7", color: "#92400e" },
  "Contract":   { bg: "#fee2e2", color: "#991b1b" },
  "Remote":     { bg: "#d1fae5", color: "#065f46" },
  "Freelance":  { bg: "#fce7f3", color: "#9d174d" },
};
const defaultTypeColorLight = { bg: "#f1f5f9", color: "#475569" };

const JobDetail = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applied, setApplied] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);

  const isJobSeeker = user?.role === "jobseeker";
  const isLoggedIn  = !!token;

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/jobs/public/${jobId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          timeout: 10000,
        });
        const jobData = res.data.job || res.data;
        setJob(jobData);

        if (token && user?.role === "jobseeker") {
          try {
            const checkRes = await axios.get(`${API_BASE_URL}/api/applications/check/${jobId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setApplied(checkRes.data.applied || false);
          } catch { /* silently ignore */ }
        }
      } catch (err) {
        setError(err.response?.data?.message || "Job not found");
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [jobId, token, user]);

  const formatPay = (job) => {
    if (!job) return null;
    if (!job.isPaid) {
      return { label: "Unpaid / Volunteer", color: "#64748b", bg: "#f1f5f9", border: "#e2e8f0", icon: Gift };
    }
    if (job.stipend) {
      const period = { monthly: "per month", yearly: "per year", weekly: "per week", hourly: "per hour", project: "per project" };
      return { label: `${job.stipend} ${period[job.stipendPeriod] || ""}`.trim(), color: "#065f46", bg: "#d1fae5", border: "#6ee7b7", icon: RupeeIcon };
    }
    return { label: "Paid", color: "#065f46", bg: "#d1fae5", border: "#6ee7b7", icon: RupeeIcon };
  };

  const INTER = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

  if (loading) {
    return (
      <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
        <Navbar />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", gap: 16 }}>
          <Loader2 size={40} style={{ color: "#10b981", animation: "spin 1s linear infinite" }} />
          <p style={{ color: "#64748b", fontSize: 16, fontFamily: INTER }}>Loading job details…</p>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
        <Navbar />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", gap: 16, padding: 24 }}>
          <AlertCircle size={48} color="#cbd5e1" />
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", fontFamily: INTER, letterSpacing: "-0.5px" }}>Job not found</h2>
          <p style={{ color: "#64748b", fontSize: 15, fontFamily: INTER }}>{error || "This job may have been removed or is no longer available."}</p>
          <button onClick={() => navigate("/jobs")} style={{ padding: "12px 24px", background: "#10b981", color: "white", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 14, fontFamily: INTER }}>
            ← Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  const pay      = formatPay(job);
  const PayIcon  = pay?.icon || DollarSign;
  const rounds   = job.rounds  || [];
  const skills   = job.skills  || [];
  const typeArr  = getTypeArr(job.type);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        @keyframes spin    { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse   { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.96) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }

        .jd-root { background: #f8fafc; min-height: 100vh; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }

        /* ── Hero banner ── */
        .jd-hero {
          background: linear-gradient(160deg, #052e16 0%, #14532d 50%, #166534 100%);
          padding: 64px 24px 80px; position: relative; overflow: hidden;
        }
        .jd-hero::before { content: ''; position: absolute; width: 600px; height: 600px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.06); top: -200px; left: -200px; pointer-events: none; }
        .jd-hero::after  { content: ''; position: absolute; width: 400px; height: 400px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.06); top: 40px; right: -140px; pointer-events: none; }
        .jd-hero-glow { position: absolute; inset: 0; background-image: radial-gradient(circle at 70% 20%, rgba(16,185,129,0.15) 0%, transparent 60%); pointer-events: none; }
        .jd-hero-inner { max-width: 1100px; margin: 0 auto; position: relative; }

        .jd-back {
          display: inline-flex; align-items: center; gap: 8px;
          color: rgba(255,255,255,0.5); background: none; border: none; cursor: pointer;
          font-size: 14px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          padding: 0; margin-bottom: 32px; transition: color 0.2s;
        }
        .jd-back:hover { color: #6ee7b7; }

        .jd-hero-content {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 32px; flex-wrap: wrap;
        }
        .jd-hero-left { flex: 1; min-width: 0; animation: fadeUp 0.5s ease; }

        /* ── Hero type tags ── */
        .jd-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 20px; align-items: center; }
        .jd-tag {
          padding: 5px 12px; border-radius: 100px;
          font-size: 12px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.5px;
          border: 1px solid transparent;
        }
        .jd-tag-live {
          background: rgba(16,185,129,0.15); border-color: rgba(16,185,129,0.3);
          color: #6ee7b7; display: flex; align-items: center; gap: 5px;
        }
        .live-dot { width: 6px; height: 6px; background: #10b981; border-radius: 50%; animation: pulse 2s infinite; }

        .jd-title {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 42px; font-weight: 800; color: white;
          line-height: 1.15; margin-bottom: 20px; letter-spacing: -1.5px;
        }

        .jd-company-row { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
        .jd-company-logo {
          width: 48px; height: 48px; background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12); border-radius: 10px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .jd-company-name { font-size: 18px; font-weight: 600; color: white; }
        .jd-company-verified { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #10b981; margin-top: 3px; }

        /* ── Meta chips (location, type summary, rounds, skills) ── */
        .jd-meta-chips { display: flex; gap: 10px; flex-wrap: wrap; }
        .jd-meta-chip {
          display: flex; align-items: center; gap: 8px; padding: 8px 14px;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px; font-size: 13px; color: rgba(255,255,255,0.7); font-weight: 500;
        }
        /* Types chip is a pill-group inside the meta row */
        .jd-meta-type-group {
          display: flex; align-items: center; gap: 0;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px; overflow: hidden;
        }
        .jd-meta-type-pill {
          padding: 8px 12px; font-size: 12px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.4px; white-space: nowrap;
          border-right: 1px solid rgba(255,255,255,0.08);
        }
        .jd-meta-type-pill:last-child { border-right: none; }

        /* ── Apply CTA (hero right) ── */
        .jd-cta-card {
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12);
          border-radius: 16px; padding: 28px; min-width: 260px; max-width: 300px;
          backdrop-filter: blur(8px); animation: fadeUp 0.5s ease 0.1s both;
          display: flex; flex-direction: column; gap: 16px;
        }
        .jd-pay-display { padding: 14px 16px; border-radius: 10px; display: flex; align-items: center; gap: 10px; }
        .jd-pay-amount { font-size: 18px; font-weight: 700; }
        .jd-pay-label  { font-size: 12px; opacity: 0.7; margin-top: 2px; }

        .jd-apply-btn {
          width: 100%; padding: 15px; background: #10b981; color: white;
          border: none; border-radius: 10px; font-size: 15px; font-weight: 700;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.2s; letter-spacing: 0.1px;
        }
        .jd-apply-btn:hover:not(:disabled) { background: #059669; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(16,185,129,0.35); }
        .jd-apply-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
        .jd-apply-btn.applied { background: #065f46; }

        .jd-login-note { font-size: 12px; color: #64748b; text-align: center; }
        .jd-login-note a { color: #10b981; font-weight: 600; text-decoration: none; }
        .jd-login-note a:hover { text-decoration: underline; }

        .jd-rounds-count {
          display: flex; align-items: center; gap: 8px; font-size: 13px; color: rgba(255,255,255,0.5);
          padding: 10px 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
        }

        /* ── Main body ── */
        .jd-body { max-width: 1100px; margin: -32px auto 80px; padding: 0 24px; }
        .jd-grid { display: grid; grid-template-columns: 1fr 340px; gap: 24px; align-items: start; }

        /* ── Section cards ── */
        .jd-card {
          background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px;
          margin-bottom: 20px; animation: fadeUp 0.4s ease; box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .jd-card-title {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px;
          margin-bottom: 20px; display: flex; align-items: center; gap: 10px;
        }
        .jd-card-title-icon {
          width: 32px; height: 32px; background: #f0fdf4; border: 1px solid #bbf7d0;
          border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }

        .jd-description { font-size: 15px; color: #374151; line-height: 1.8; white-space: pre-wrap; word-break: break-word; }

        .jd-skills { display: flex; flex-wrap: wrap; gap: 8px; }
        .jd-skill-pill {
          padding: 6px 14px; border-radius: 100px; font-size: 13px; font-weight: 600;
          background: #f0fdf4; border: 1px solid #bbf7d0; color: #065f46;
          display: flex; align-items: center; gap: 6px;
        }

        /* Rounds timeline */
        .jd-rounds { display: flex; flex-direction: column; gap: 0; }
        .jd-round-item { display: flex; gap: 16px; position: relative; }
        .jd-round-item:not(:last-child)::before {
          content: ''; position: absolute; left: 19px; top: 44px;
          width: 2px; bottom: -4px; background: linear-gradient(180deg, #d1fae5, #e2e8f0);
        }
        .jd-round-left { display: flex; flex-direction: column; align-items: center; gap: 6px; flex-shrink: 0; padding-bottom: 24px; }
        .jd-round-num-badge {
          width: 40px; height: 40px; background: #0f172a; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 700; color: white; flex-shrink: 0; z-index: 1; position: relative;
        }
        .jd-round-body { flex: 1; padding-bottom: 24px; padding-top: 8px; }
        .jd-round-title { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
        .jd-round-type-label {
          display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px;
          background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 100px;
          font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 8px;
          text-transform: uppercase; letter-spacing: 0.4px;
        }
        .jd-round-desc { font-size: 14px; color: #475569; line-height: 1.65; }
        .jd-round-dur {
          display: inline-flex; align-items: center; gap: 5px; margin-top: 8px;
          font-size: 12px; color: #94a3b8; font-weight: 500;
          background: #f8fafc; border: 1px solid #e2e8f0; padding: 4px 10px; border-radius: 100px;
        }

        /* Sidebar */
        .jd-sidebar { position: sticky; top: 24px; display: flex; flex-direction: column; gap: 16px; }

        .jd-info-card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
        .jd-info-card-title { font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 16px; }
        .jd-info-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
        .jd-info-item:last-child { border-bottom: none; padding-bottom: 0; }
        .jd-info-icon { width: 32px; height: 32px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .jd-info-label { font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; }
        .jd-info-value { font-size: 14px; color: #0f172a; font-weight: 600; margin-top: 2px; }

        /* Type pills in sidebar info card */
        .jd-info-type-pills { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
        .jd-info-type-pill {
          font-size: 11px; font-weight: 700;
          padding: 3px 10px; border-radius: 100px;
          text-transform: uppercase; letter-spacing: 0.3px;
        }

        /* Apply sidebar card */
        .jd-apply-sidebar { background: linear-gradient(135deg, #052e16, #14532d); border: 1px solid rgba(16,185,129,0.2); border-radius: 16px; padding: 24px; }
        .jd-apply-sidebar-title { font-size: 16px; font-weight: 700; color: white; margin-bottom: 6px; }
        .jd-apply-sidebar-sub { font-size: 13px; color: #6ee7b7; margin-bottom: 20px; }
        .jd-apply-sidebar-btn {
          width: 100%; padding: 13px; background: #10b981; color: white;
          border: none; border-radius: 10px; font-size: 14px; font-weight: 700;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s;
        }
        .jd-apply-sidebar-btn:hover:not(:disabled) { background: #059669; }
        .jd-apply-sidebar-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .jd-applied-badge {
          display: flex; align-items: center; gap: 8px; padding: 12px 14px;
          background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.25);
          border-radius: 10px; font-size: 13px; font-weight: 600; color: #6ee7b7;
        }

        /* ── Breadcrumb ── */
        .jd-breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #64748b; margin-bottom: 24px; flex-wrap: wrap; }
        .jd-breadcrumb a { color: #94a3b8; text-decoration: none; transition: color 0.2s; }
        .jd-breadcrumb a:hover { color: #10b981; }

        @media (max-width: 860px) {
          .jd-grid { grid-template-columns: 1fr; }
          .jd-sidebar { position: static; }
          .jd-cta-card { min-width: unset; max-width: 100%; width: 100%; }
          .jd-hero-content { flex-direction: column; }
          .jd-title { font-size: 30px; }
          .jd-body { margin-top: -16px; }
          .jd-card { padding: 20px; }
        }
        @media (max-width: 480px) {
          .jd-title { font-size: 24px; letter-spacing: -0.5px; }
          .jd-hero { padding: 40px 16px 60px; }
          .jd-body { padding: 0 16px; }
        }
      `}</style>

      <Navbar />

      <div className="jd-root">
        {/* ── Hero ── */}
        <div className="jd-hero">
          <div className="jd-hero-glow" />
          <div className="jd-hero-inner">
            <button className="jd-back" onClick={() => navigate("/jobs")}>
              <ArrowLeft size={16} /> Back to Jobs
            </button>

            <div className="jd-hero-content">
              <div className="jd-hero-left">

                {/* ── Type pills + Live badge ── */}
                <div className="jd-tags">
                  {typeArr.map((t) => {
                    const c = TYPE_COLORS[t] || defaultTypeColor;
                    return (
                      <span
                        key={t}
                        className="jd-tag"
                        style={{ background: c.bg, borderColor: c.border, color: c.color }}
                      >
                        {t}
                      </span>
                    );
                  })}
                  <span className="jd-tag jd-tag-live">
                    <span className="live-dot" /> Live
                  </span>
                </div>

                <h1 className="jd-title">{job.title}</h1>

                <div className="jd-company-row">
                  <div className="jd-company-logo">
                    <Building2 size={22} color="rgba(255,255,255,0.7)" />
                  </div>
                  <div>
                    <div className="jd-company-name">
                      {job.company || job.business?.businessProfile?.businessName || "Direct Hire"}
                    </div>
                    <div className="jd-company-verified">
                      <BadgeCheck size={13} /> Verified Employer
                    </div>
                  </div>
                </div>

                {/* ── Meta chips row ── */}
                <div className="jd-meta-chips">
                  <div className="jd-meta-chip"><MapPin size={14} color="#10b981" /> {job.location}</div>

                  {/* Employment type: grouped pill-strip if multiple */}
                  {typeArr.length === 1 ? (
                    <div className="jd-meta-chip"><Briefcase size={14} color="#10b981" /> {typeArr[0]}</div>
                  ) : (
                    <div className="jd-meta-type-group">
                      {typeArr.map((t, i) => {
                        const c = TYPE_COLORS[t] || defaultTypeColor;
                        return (
                          <span
                            key={t}
                            className="jd-meta-type-pill"
                            style={{ color: c.color, background: c.bg }}
                          >
                            {t}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {rounds.length > 0 && (
                    <div className="jd-meta-chip"><Layers size={14} color="#10b981" /> {rounds.length} round{rounds.length !== 1 ? "s" : ""}</div>
                  )}
                  {skills.length > 0 && (
                    <div className="jd-meta-chip"><Code2 size={14} color="#10b981" /> {skills.length} skill{skills.length !== 1 ? "s" : ""}</div>
                  )}
                </div>
              </div>

              {/* ── Right CTA ── */}
              <div className="jd-cta-card">
                {pay && (
                  <div className="jd-pay-display" style={{ background: pay.bg, border: `1px solid ${pay.border}` }}>
                    <PayIcon size={20} color={pay.color} />
                    <div>
                      <div className="jd-pay-amount" style={{ color: pay.color }}>{pay.label}</div>
                      <div className="jd-pay-label" style={{ color: pay.color }}>Compensation</div>
                    </div>
                  </div>
                )}

                {applied ? (
                  <div className="jd-applied-badge">
                    <CheckCircle size={16} /> Application Submitted
                  </div>
                ) : isJobSeeker ? (
                  <button className="jd-apply-btn" onClick={() => setShowApplyModal(true)}>
                    <Send size={16} /> Apply Now
                  </button>
                ) : isLoggedIn ? (
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "10px 0" }}>
                    Only job seekers can apply
                  </div>
                ) : (
                  <>
                    <button className="jd-apply-btn" onClick={() => navigate("/login")}>
                      <Send size={16} /> Sign in to Apply
                    </button>
                    <div className="jd-login-note">
                      No account? <Link to="/signup">Register free</Link>
                    </div>
                  </>
                )}

                {rounds.length > 0 && (
                  <div className="jd-rounds-count">
                    <Layers size={14} color="#10b981" />
                    <span>{rounds.length}-round hiring process</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="jd-body">
          <div className="jd-breadcrumb">
            <Link to="/">Home</Link>
            <ChevronRight size={12} />
            <Link to="/jobs">Jobs</Link>
            <ChevronRight size={12} />
            <span style={{ color: "#0f172a", fontWeight: 600 }}>{job.title}</span>
          </div>

          <div className="jd-grid">
            {/* ── Main content ── */}
            <div>
              <div className="jd-card">
                <div className="jd-card-title">
                  <div className="jd-card-title-icon"><FileText size={16} color="#10b981" /></div>
                  About this Role
                </div>
                <p className="jd-description">{job.description || "No description provided."}</p>
              </div>

              {skills.length > 0 && (
                <div className="jd-card">
                  <div className="jd-card-title">
                    <div className="jd-card-title-icon"><Code2 size={16} color="#10b981" /></div>
                    Required Skills
                  </div>
                  <div className="jd-skills">
                    {skills.map((s, i) => (
                      <span key={i} className="jd-skill-pill">
                        <Star size={10} color="#10b981" /> {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {rounds.length > 0 && (
                <div className="jd-card">
                  <div className="jd-card-title">
                    <div className="jd-card-title-icon"><Layers size={16} color="#10b981" /></div>
                    Hiring Process
                  </div>
                  <div className="jd-rounds">
                    {rounds.map((r, i) => (
                      <div key={r._id || i} className="jd-round-item">
                        <div className="jd-round-left">
                          <div className="jd-round-num-badge">{r.order || i + 1}</div>
                        </div>
                        <div className="jd-round-body">
                          <div className="jd-round-title">{r.title || ROUND_TYPE_LABELS[r.type] || r.type}</div>
                          <div className="jd-round-type-label">{ROUND_TYPE_LABELS[r.type] || r.type}</div>
                          {r.description && <div className="jd-round-desc">{r.description}</div>}
                          {r.duration && <div className="jd-round-dur"><Clock size={11} /> {r.duration}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Sidebar ── */}
            <div className="jd-sidebar">
              {isJobSeeker && (
                <div className="jd-apply-sidebar">
                  <div className="jd-apply-sidebar-title">Ready to apply?</div>
                  <div className="jd-apply-sidebar-sub">Takes less than 2 minutes</div>
                  {applied ? (
                    <div className="jd-applied-badge"><CheckCircle size={16} /> Application Submitted</div>
                  ) : (
                    <button className="jd-apply-sidebar-btn" onClick={() => setShowApplyModal(true)}>
                      <Send size={15} /> Apply for this Job
                    </button>
                  )}
                </div>
              )}

              {!isLoggedIn && (
                <div className="jd-apply-sidebar">
                  <div className="jd-apply-sidebar-title">Interested in this role?</div>
                  <div className="jd-apply-sidebar-sub">Sign in to apply in minutes</div>
                  <button className="jd-apply-sidebar-btn" onClick={() => navigate("/login")}>
                    Sign in to Apply
                  </button>
                </div>
              )}

              <div className="jd-info-card">
                <div className="jd-info-card-title">Job Overview</div>

                {/* Role */}
                <div className="jd-info-item">
                  <div className="jd-info-icon"><Briefcase size={15} color="#64748b" /></div>
                  <div>
                    <div className="jd-info-label">Role</div>
                    <div className="jd-info-value">{job.title}</div>
                  </div>
                </div>

                {/* Company */}
                <div className="jd-info-item">
                  <div className="jd-info-icon"><Building2 size={15} color="#64748b" /></div>
                  <div>
                    <div className="jd-info-label">Company</div>
                    <div className="jd-info-value">{job.company || job.business?.businessProfile?.businessName || "Direct Hire"}</div>
                  </div>
                </div>

                {/* Location */}
                <div className="jd-info-item">
                  <div className="jd-info-icon"><MapPin size={15} color="#64748b" /></div>
                  <div>
                    <div className="jd-info-label">Location</div>
                    <div className="jd-info-value">{job.location}</div>
                  </div>
                </div>

                {/* Employment Type — pill group when multiple */}
                <div className="jd-info-item">
                  <div className="jd-info-icon"><Clock size={15} color="#64748b" /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="jd-info-label">Employment</div>
                    {typeArr.length === 1 ? (
                      <div className="jd-info-value">{typeArr[0]}</div>
                    ) : (
                      <div className="jd-info-type-pills">
                        {typeArr.map((t) => {
                          const c = TYPE_COLORS_LIGHT[t] || defaultTypeColorLight;
                          return (
                            <span
                              key={t}
                              className="jd-info-type-pill"
                              style={{ background: c.bg, color: c.color }}
                            >
                              {t}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Compensation */}
                <div className="jd-info-item">
                  <div className="jd-info-icon">
                    {job.isPaid
                      ? <RupeeIcon size={15} color="#64748b" />
                      : <Gift size={15} color="#64748b" />}
                  </div>
                  <div>
                    <div className="jd-info-label">Compensation</div>
                    <div className="jd-info-value">{pay?.label || "Not specified"}</div>
                  </div>
                </div>

                {/* Rounds */}
                <div className="jd-info-item">
                  <div className="jd-info-icon"><Layers size={15} color="#64748b" /></div>
                  <div>
                    <div className="jd-info-label">Rounds</div>
                    <div className="jd-info-value">{rounds.length} stage{rounds.length !== 1 ? "s" : ""}</div>
                  </div>
                </div>
              </div>

              {skills.length > 0 && (
                <div className="jd-info-card">
                  <div className="jd-info-card-title">Skills Required</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {skills.map((s, i) => (
                      <span key={i} style={{ padding: "4px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "100px", fontSize: 12, fontWeight: 600, color: "#065f46" }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showApplyModal && (
        <ApplyModal
          job={job}
          onClose={() => setShowApplyModal(false)}
          onSuccess={() => { setApplied(true); setShowApplyModal(false); }}
        />
      )}
    </>
  );
};

export default JobDetail;