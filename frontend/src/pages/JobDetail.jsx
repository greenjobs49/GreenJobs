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
  const isLoggedIn = !!token;

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
          } catch (err) { /* silently ignore */ }
        }
      } catch (err) {
        setError(err.response?.data?.message || "Job not found");
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [jobId, token, user]);

  const handleApply = async () => {
    if (!coverLetter.trim() || coverLetter.trim().length < 30) {
      setCoverLetterError("Please write at least 30 characters explaining your interest");
      return;
    }
    setCoverLetterError("");
    try {
      setApplying(true);
      await axios.post(
        `${API_BASE_URL}/api/applications`,
        { jobId, coverLetter: coverLetter.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setApplied(true);
      setShowApplyModal(false);
      toast.success("Application submitted successfully!", {
        duration: 4000,
        style: { background: "#D1FAE5", color: "#065F46", border: "1px solid #6EE7B7", borderRadius: "12px", fontWeight: "500" },
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit application");
    } finally {
      setApplying(false);
    }
  };

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

  const pay = formatPay(job);
  const PayIcon = pay?.icon || DollarSign;
  const rounds = job.rounds || [];
  const skills = job.skills || [];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
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

        .jd-tags { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
        .jd-tag { padding: 5px 12px; border-radius: 100px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .jd-tag-type { background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); color: #93c5fd; }
        .jd-tag-live { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #6ee7b7; display: flex; align-items: center; gap: 5px; }
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

        .jd-meta-chips { display: flex; gap: 12px; flex-wrap: wrap; }
        .jd-meta-chip {
          display: flex; align-items: center; gap: 8px; padding: 8px 14px;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px; font-size: 13px; color: rgba(255,255,255,0.7); font-weight: 500;
        }

        /* ── Apply CTA (hero right) ── */
        .jd-cta-card {
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12);
          border-radius: 16px; padding: 28px; min-width: 260px; max-width: 300px;
          backdrop-filter: blur(8px); animation: fadeUp 0.5s ease 0.1s both;
          display: flex; flex-direction: column; gap: 16px;
        }
        .jd-pay-display { padding: 14px 16px; border-radius: 10px; display: flex; align-items: center; gap: 10px; }
        .jd-pay-amount { font-size: 18px; font-weight: 700; }
        .jd-pay-label { font-size: 12px; opacity: 0.7; margin-top: 2px; }

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

        /* ── Modal ── */
        .jd-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px); z-index: 1000;
          display: flex; align-items: center; justify-content: center; padding: 16px;
          animation: overlayIn 0.2s ease;
        }
        .jd-modal {
          background: white; border-radius: 20px; padding: 32px;
          width: 100%; max-width: 540px; position: relative;
          animation: modalIn 0.25s ease; box-shadow: 0 24px 80px rgba(0,0,0,0.25);
        }
        .jd-modal-close {
          position: absolute; top: 16px; right: 16px;
          width: 32px; height: 32px; background: #f1f5f9; border: none; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;
        }
        .jd-modal-close:hover { background: #e2e8f0; }
        .jd-modal-title { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 6px; letter-spacing: -0.5px; }
        .jd-modal-sub { font-size: 14px; color: #64748b; margin-bottom: 24px; }
        .jd-modal-job-pill { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 24px; }
        .jd-modal-job-name { font-size: 14px; font-weight: 700; color: #0f172a; }
        .jd-modal-company { font-size: 12px; color: #64748b; }
        .jd-modal-label { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 8px; display: block; }
        .jd-modal-textarea {
          width: 100%; padding: 14px; font-size: 14px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; color: #0f172a;
          outline: none; resize: vertical; min-height: 130px; line-height: 1.6; transition: all 0.2s;
        }
        .jd-modal-textarea:focus { border-color: #10b981; background: white; box-shadow: 0 0 0 3px rgba(16,185,129,0.08); }
        .jd-modal-textarea.error { border-color: #fca5a5; background: #fff5f5; }
        .jd-modal-error { font-size: 12px; color: #ef4444; margin-top: 6px; display: flex; align-items: center; gap: 4px; }
        .jd-modal-hint { font-size: 12px; color: #94a3b8; margin-top: 6px; }
        .jd-modal-actions { display: flex; gap: 10px; margin-top: 24px; }
        .jd-modal-cancel {
          flex: 1; padding: 13px; background: #f1f5f9; color: #64748b;
          border: none; border-radius: 10px; font-size: 14px; font-weight: 600;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          cursor: pointer; transition: all 0.2s;
        }
        .jd-modal-cancel:hover { background: #e2e8f0; }
        .jd-modal-submit {
          flex: 2; padding: 13px; background: #10b981; color: white;
          border: none; border-radius: 10px; font-size: 14px; font-weight: 700;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s;
        }
        .jd-modal-submit:hover:not(:disabled) { background: #059669; }
        .jd-modal-submit:disabled { opacity: 0.5; cursor: not-allowed; }

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
                <div className="jd-tags">
                  <span className="jd-tag jd-tag-type">{job.type}</span>
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

                <div className="jd-meta-chips">
                  <div className="jd-meta-chip"><MapPin size={14} color="#10b981" /> {job.location}</div>
                  <div className="jd-meta-chip"><Briefcase size={14} color="#10b981" /> {job.type}</div>
                  {rounds.length > 0 && (
                    <div className="jd-meta-chip"><Layers size={14} color="#10b981" /> {rounds.length} round{rounds.length !== 1 ? "s" : ""}</div>
                  )}
                  {skills.length > 0 && (
                    <div className="jd-meta-chip"><Code2 size={14} color="#10b981" /> {skills.length} skill{skills.length !== 1 ? "s" : ""}</div>
                  )}
                </div>
              </div>

              {/* Right CTA */}
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
                {[
                  { icon: Briefcase, label: "Role", value: job.title },
                  { icon: Building2, label: "Company", value: job.company || job.business?.businessProfile?.businessName || "Direct Hire" },
                  { icon: MapPin, label: "Location", value: job.location },
                  { icon: Clock, label: "Employment", value: job.type },
                  { icon: job.isPaid ? RupeeIcon : Gift, label: "Compensation", value: pay?.label || "Not specified" },
                  { icon: Layers, label: "Rounds", value: `${rounds.length} stage${rounds.length !== 1 ? "s" : ""}` },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="jd-info-item">
                    <div className="jd-info-icon"><Icon size={15} color="#64748b" /></div>
                    <div>
                      <div className="jd-info-label">{label}</div>
                      <div className="jd-info-value">{value}</div>
                    </div>
                  </div>
                ))}
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