import React, { useEffect, useState, useCallback } from "react";
import Navbar from "../components/common/Navbar";
import BusinessApplications from "./BusinessApplications";
import {
  Building2, Users, Eye, TrendingUp, Briefcase, CheckCircle, Clock, XCircle,
  Loader2, UserPlus, AlertCircle, MapPin, UserMinus, Mail, Globe,
  MapPinIcon, Plus, ToggleLeft, ToggleRight, PenLine, Trash2, ChevronDown,
  ChevronUp, FileText, X, ShieldCheck, Star, Phone,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import API_BASE_URL from "../config/api";

/* ─────────────────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────────────────── */
const BusinessOwnerDashboard = () => {
  const { user, token, refreshUser } = useAuth();
  const navigate = useNavigate();

  // ── Recruiter-related state ──────────────────────────────────────────────────
  const [pendingJobs,             setPendingJobs]             = useState([]);
  const [loadingJobs,             setLoadingJobs]             = useState(false);
  const [showJobs,                setShowJobs]                = useState(false);
  const [pendingRecruiters,       setPendingRecruiters]       = useState([]);
  const [loadingRecruiters,       setLoadingRecruiters]       = useState(false);
  const [showRecruiters,          setShowRecruiters]          = useState(false);
  const [linkedRecruiters,        setLinkedRecruiters]        = useState([]);
  const [loadingLinkedRecruiters, setLoadingLinkedRecruiters] = useState(false);
  const [showLinkedRecruiters,    setShowLinkedRecruiters]    = useState(false);
  const [removingRecruiter,       setRemovingRecruiter]       = useState(null);

  // ── Business own jobs state ──────────────────────────────────────────────────
  const [ownJobs,        setOwnJobs]        = useState([]);
  const [loadingOwnJobs, setLoadingOwnJobs] = useState(true);
  const [showOwnJobs,    setShowOwnJobs]    = useState(false);
  const [togglingJob,    setTogglingJob]    = useState(null);

  // ── Applications for own jobs ────────────────────────────────────────────────
  const [totalApplications, setTotalApplications] = useState(0);

  const images            = user?.businessProfile?.images || [];
  const isProfileComplete = user?.profileCompleted;
  const businessStatus    = user?.businessProfile?.status || "pending";
  const isApproved        = businessStatus === "approved";

  // ── Stats ────────────────────────────────────────────────────────────────────
  const liveJobs   = ownJobs.filter(j => j.isOpen && j.status === "approved").length;

  const stats = [
    { icon: Briefcase,  label: "Live Jobs",        value: liveJobs,                color: "#3b82f6" },
    { icon: Users,      label: "Linked Recruiters", value: linkedRecruiters.length, color: "#10b981" },
    { icon: FileText, label: "Total Applications", value: totalApplications, color: "#8b5cf6" },
    { icon: TrendingUp, label: "Pending Approvals", value: pendingJobs.length,      color: "#f59e0b" },
  ];

  // ── Fetchers ─────────────────────────────────────────────────────────────────
  const fetchPendingJobs = useCallback(async () => {
    if (!token || !isApproved) return;
    try {
      setLoadingJobs(true);
      const res = await axios.get(`${API_BASE_URL}/api/jobs/pending`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      setPendingJobs(res.data.jobs || res.data || []);
    } catch { setPendingJobs([]); }
    finally  { setLoadingJobs(false); }
  }, [token, isApproved]);

  const fetchPendingRecruiters = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingRecruiters(true);
      const res = await axios.get(`${API_BASE_URL}/api/profile/business/pending-recruiters`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingRecruiters(res.data || []);
    } catch { setPendingRecruiters([]); }
    finally  { setLoadingRecruiters(false); }
  }, [token]);

  const fetchLinkedRecruiters = useCallback(async () => {
    if (!token || !isApproved) return;
    try {
      setLoadingLinkedRecruiters(true);
      const res = await axios.get(`${API_BASE_URL}/api/profile/business/linked-recruiters`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLinkedRecruiters(res.data || []);
      if (res.data?.length > 0) setShowLinkedRecruiters(true);
    } catch { setLinkedRecruiters([]); }
    finally  { setLoadingLinkedRecruiters(false); }
  }, [token, isApproved]);

  const fetchOwnJobs = useCallback(async () => {
    if (!token || !isApproved) return;
    try {
      setLoadingOwnJobs(true);
      const res = await axios.get(`${API_BASE_URL}/api/jobs/business/own`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOwnJobs(res.data.jobs || []);
    } catch { setOwnJobs([]); }
    finally  { setLoadingOwnJobs(false); }
  }, [token, isApproved]);



  // ── Own job actions ───────────────────────────────────────────────────────────
  const toggleOwnJob = async (jobId, currentIsOpen) => {
    setTogglingJob(jobId);
    try {
      await axios.patch(
        `${API_BASE_URL}/api/jobs/business/${jobId}/toggle-status`,
        { isOpen: !currentIsOpen },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOwnJobs(prev => prev.map(j => j._id === jobId ? { ...j, isOpen: !currentIsOpen } : j));
      toast.success(!currentIsOpen ? "Job reopened!" : "Job closed!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to toggle job status");
    } finally {
      setTogglingJob(null);
    }
  };

  const takedownOwnJob = async (jobId, jobTitle) => {
    if (!window.confirm(`Take down "${jobTitle}"? It will go offline.`)) return;
    try {
      await axios.patch(
        `${API_BASE_URL}/api/jobs/business/${jobId}/takedown`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Job taken offline.");
      fetchOwnJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to take down job");
    }
  };

  // ── Application actions ───────────────────────────────────────────────────────

  // ── Recruiter approval actions ────────────────────────────────────────────────
  const approveRecruiter = async (requestId) => {
    try {
      const res = await axios.patch(
        `${API_BASE_URL}/api/profile/business/approve-recruiter/${requestId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`${res.data.recruiter?.name || "Recruiter"} approved!`);
      if (res.data.jobsRestored > 0) {
        toast(`${res.data.jobsRestored} previously revoked job(s) restored.`, { duration: 6000, icon: "📋" });
        setShowJobs(true);
      }
      fetchPendingRecruiters();
      fetchLinkedRecruiters();
      fetchPendingJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Approval failed");
    }
  };

  const rejectRecruiter = async (requestId, recruiterName) => {
    const reason = window.prompt(`Why are you rejecting ${recruiterName}? (Optional)`);
    try {
      await axios.patch(
        `${API_BASE_URL}/api/profile/business/reject-recruiter/${requestId}`,
        { reason: reason || "No reason provided" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Recruiter request rejected");
      fetchPendingRecruiters();
    } catch (err) {
      toast.error(err.response?.data?.message || "Rejection failed");
    }
  };

  const removeRecruiter = async (recruiterId, recruiterName) => {
    if (!window.confirm(`Remove ${recruiterName} from your business?`)) return;
    try {
      setRemovingRecruiter(recruiterId);
      await axios.post(
        `${API_BASE_URL}/api/profile/business/remove-recruiter/${recruiterId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
      );
      toast.success(`${recruiterName} removed`);
      fetchLinkedRecruiters();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove recruiter");
    } finally {
      setRemovingRecruiter(null);
    }
  };

  const approveJob = async (jobId) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/jobs/${jobId}/business-approve`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Job approved & live! 🎉");
      fetchPendingJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Approval failed");
    }
  };

  const rejectJob = async (jobId, jobTitle) => {
    const reason = window.prompt(`Reason for rejecting "${jobTitle}"? (Optional)`);
    try {
      await axios.patch(`${API_BASE_URL}/api/jobs/${jobId}/business-reject`, { reason: reason || "" }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Job rejected");
      fetchPendingJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Rejection failed");
    }
  };

  // ── Effects ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (token && isApproved) {
      refreshUser();
      fetchPendingJobs();
      fetchPendingRecruiters();
      fetchLinkedRecruiters();
      fetchOwnJobs();
      

      const interval = setInterval(() => {
        fetchPendingJobs();
        fetchPendingRecruiters();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [token, isApproved, fetchPendingJobs, fetchPendingRecruiters, fetchLinkedRecruiters, fetchOwnJobs]);

  // ── Status badge helper ───────────────────────────────────────────────────────
  const appStatusBadge = (status) => {
    const map = {
      applied:      { bg: "#fef3c7", color: "#92400e", label: "Applied"      },
      under_review: { bg: "#dbeafe", color: "#1e40af", label: "Under Review" },
      shortlisted:  { bg: "#d1fae5", color: "#065f46", label: "Shortlisted"  },
      rejected:     { bg: "#fee2e2", color: "#991b1b", label: "Rejected"     },
      hired:        { bg: "#d1fae5", color: "#065f46", label: "Hired"        },
    };
    const s = map[status] || map.applied;
    return (
      <span style={{
        background: s.bg, color: s.color,
        padding: "3px 10px", borderRadius: "12px",
        fontSize: "12px", fontWeight: 600,
      }}>
        {s.label}
      </span>
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #f8fafc; color: #0f172a; }

        .dashboard-wrapper   { background: #f8fafc; min-height: 100vh; }
        .dashboard-container { max-width: 1280px; margin: 0 auto; padding: 24px; }
        .page-header         { margin-bottom: 32px; }
        .page-title          { font-size: 28px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
        .page-subtitle       { font-size: 15px; color: #64748b; font-weight: 400; }

        /* ── Alerts ── */
        .alert-banner { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px; display: flex; align-items: flex-start; gap: 12px; }
        .alert-banner.warning { background: #fffbeb; border-color: #fde047; }
        .alert-banner.success { background: #f0fdf4; border-color: #86efac; }
        .alert-icon    { flex-shrink: 0; margin-top: 2px; }
        .alert-content { flex: 1; }
        .alert-title   { font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 2px; }
        .alert-description { font-size: 13px; color: #64748b; }
        .alert-action  { flex-shrink: 0; }

        /* ── Stats ── */
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 32px; }
        .stat-card  { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; transition: all 0.2s; }
        .stat-card:hover { border-color: #cbd5e1; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .stat-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .stat-icon   { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; }
        .stat-value  { font-size: 32px; font-weight: 700; color: #0f172a; margin-bottom: 4px; line-height: 1; }
        .stat-label  { font-size: 13px; color: #64748b; font-weight: 500; }

        /* ── Sections ── */
        .section-card   { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 24px; }
        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0; }
        .section-title  { font-size: 18px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 10px; }

        /* ── Badges ── */
        .badge         { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
        .badge-warning { background: #fef3c7; color: #92400e; }
        .badge-danger  { background: #fee2e2; color: #991b1b; }
        .badge-success { background: #d1fae5; color: #065f46; }
        .badge-info    { background: #dbeafe; color: #1e40af; }

        /* ── Buttons ── */
        .btn           { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 16px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: none; outline: none; }
        .btn-primary   { background: #3b82f6; color: white; }
        .btn-primary:hover:not(:disabled)   { background: #2563eb; }
        .btn-secondary { background: white; color: #475569; border: 1px solid #e2e8f0; }
        .btn-secondary:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; }
        .btn-danger    { background: white; color: #dc2626; border: 1px solid #fecaca; }
        .btn-danger:hover:not(:disabled)    { background: #fef2f2; }
        .btn:disabled  { opacity: 0.5; cursor: not-allowed; }
        .btn-sm        { padding: 6px 12px; font-size: 13px; }

        /* ── Action group ── */
        .action-group { display: flex; gap: 12px; flex-wrap: wrap; }

        /* ── Job cards (matching recruiter style) ── */
        .jobs-list { display: flex; flex-direction: column; gap: 12px; }
        .job-card  { background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; transition: all 0.2s; }
        .job-card:hover { border-color: #cbd5e1; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .job-title { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 8px; }
        .job-meta  { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 12px; }
        .job-meta-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #64748b; }
        .job-footer    { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .job-actions   { display: flex; align-items: center; gap: 8px; }

        /* ── Toggle button (matching recruiter style) ── */
        .toggle-btn { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s; min-width: 90px; justify-content: center; }
        .toggle-btn.open   { background: #d1fae5; color: #065f46; border: 1px solid #86efac; }
        .toggle-btn.open:hover:not(:disabled)   { background: #a7f3d0; }
        .toggle-btn.closed { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .toggle-btn.closed:hover:not(:disabled) { background: #fecaca; }
        .toggle-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ── Status badge ── */
        .status-badge  { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
        .status-open   { background: #dbeafe; color: #1e40af; }
        .status-closed { background: #fef2f2; color: #dc2626; }
        .status-down   { background: #f1f5f9; color: #64748b; }

        /* ── Skills ── */
        .skills-list { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
        .skill-tag   { padding: 3px 10px; background: #eff6ff; color: #1e40af; border-radius: 12px; font-size: 12px; font-weight: 500; }

        /* ── Application cards ── */
        .app-card        { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 10px; }
        .app-card-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: white; cursor: pointer; transition: background 0.15s; }
        .app-card-header:hover { background: #f8fafc; }
        .app-card-body   { padding: 16px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
        .app-actions     { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px; }

        /* ── Detail grid ── */
        .detail-grid  { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 14px; }
        .detail-label { font-size: 12px; color: #64748b; margin-bottom: 3px; font-weight: 500; }
        .detail-value { font-size: 14px; color: #0f172a; font-weight: 500; }

        /* ── Description box ── */
        .description-box { padding: 14px; background: #f8fafc; border-left: 3px solid #3b82f6; border-radius: 6px; margin-bottom: 14px; font-size: 14px; line-height: 1.6; color: #475569; }

        /* ── Approval card ── */
        .approval-card    { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 16px; }
        .approval-title   { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 10px; }
        .approval-meta    { display: flex; flex-wrap: wrap; gap: 14px; margin-bottom: 14px; }
        .approval-meta-item { display: flex; align-items: center; gap: 5px; font-size: 13px; color: #64748b; }
        .approval-details { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; padding: 14px; background: #f8fafc; border-radius: 6px; margin-bottom: 14px; }
        .approval-actions { display: flex; gap: 10px; justify-content: flex-end; padding-top: 14px; border-top: 1px solid #e2e8f0; }

        /* ── Recruiter cards ── */
        .recruiter-card   { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 10px; }
        .recruiter-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
        .recruiter-name   { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 2px; }
        .recruiter-company { font-size: 13px; color: #64748b; }
        .recruiter-details { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
        .recruiter-detail-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #64748b; }

        /* ── Images ── */
        .images-grid    { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; }
        .business-image { width: 100%; height: 160px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0; cursor: pointer; transition: all 0.2s; }
        .business-image:hover { transform: scale(1.02); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

        /* ── Empty / Loading ── */
        .empty-state { text-align: center; padding: 48px 24px; }
        .empty-icon  { width: 56px; height: 56px; margin: 0 auto 14px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .empty-title { font-size: 15px; font-weight: 600; color: #0f172a; margin-bottom: 4px; }
        .empty-description { font-size: 13px; color: #64748b; }
        .loading-state { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 48px 24px; color: #64748b; }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .dashboard-container { padding: 16px; }
          .page-title  { font-size: 22px; }
          .stats-grid  { grid-template-columns: 1fr 1fr; }
          .action-group { flex-direction: column; }
          .btn { width: 100%; }
          .job-footer  { flex-direction: column; align-items: flex-start; gap: 8px; }
          .toggle-btn  { width: 100%; }
          .approval-actions { flex-direction: column; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <Navbar />

      <div className="dashboard-wrapper">
        <div className="dashboard-container">

          {/* ── Header ── */}
          <div className="page-header">
            <h1 className="page-title">
              Welcome back, {user?.name?.split(" ")[0] || "Business Owner"}
            </h1>
            <p className="page-subtitle">
              Manage your listings, track applicants, and grow your team
            </p>
          </div>

          {/* ── Status Banners ── */}
          {!isProfileComplete && (
            <div className="alert-banner warning">
              <div className="alert-icon"><AlertCircle size={20} color="#f59e0b" /></div>
              <div className="alert-content">
                <div className="alert-title">Profile Incomplete</div>
                <div className="alert-description">Complete your profile to unlock all features</div>
              </div>
              <div className="alert-action">
                <button onClick={() => navigate("/complete-profile")} className="btn btn-primary btn-sm">
                  Complete Now
                </button>
              </div>
            </div>
          )}

          {isApproved ? (
            <div className="alert-banner success">
              <div className="alert-icon"><CheckCircle size={20} color="#10b981" /></div>
              <div className="alert-content">
                <div className="alert-title">Business Approved & Live</div>
                <div className="alert-description">
                  Your business is visible to users. You can post jobs directly.
                </div>
              </div>
            </div>
          ) : (
            <div className="alert-banner warning">
              <div className="alert-icon"><Clock size={20} color="#f59e0b" /></div>
              <div className="alert-content">
                <div className="alert-title">Pending Admin Approval</div>
                <div className="alert-description">
                  Your business is awaiting admin review before you can post jobs.
                </div>
              </div>
            </div>
          )}

          {/* ── Stats ── */}
          <div className="stats-grid">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="stat-card">
                  <div className="stat-header">
                    <div className="stat-icon"><Icon size={20} color={stat.color} /></div>
                  </div>
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              );
            })}
          </div>

          {/* ── Quick Actions ── */}
          <div className="section-card">
            <div className="section-header">
              <h2 className="section-title">Quick Actions</h2>
            </div>
            <div className="action-group">
              <button
                onClick={() => {
                  if (!isApproved) { toast.error("Business not approved yet"); return; }
                  navigate("/post-job");
                }}
                disabled={!isApproved}
                className="btn btn-primary"
              >
                <Plus size={16} /> Post a Job
              </button>
              <button onClick={() => navigate("/complete-profile")} className="btn btn-secondary">
                Update Business Profile
              </button>
              <button onClick={() => navigate("/businesses")} className="btn btn-secondary">
                View Public Listing
              </button>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════
              YOUR JOB LISTINGS  (matches RecruiterDashboard style)
          ══════════════════════════════════════════════════════ */}
          {isApproved && (
            <div className="section-card">
              <div className="section-header">
                <h2 className="section-title">
                  <Briefcase size={20} />
                  My Job Listings ({ownJobs.length})
                </h2>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {liveJobs > 0 && (
                    <span className="badge badge-success">{liveJobs} live</span>
                  )}
                  <button className="btn btn-primary btn-sm" onClick={() => navigate("/post-job")}>
                    <Plus size={14} /> New Job
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => { setShowOwnJobs(!showOwnJobs); if (!showOwnJobs) fetchOwnJobs(); }}
                  >
                    {showOwnJobs ? "Hide" : "Show"} Jobs
                  </button>
                </div>
              </div>

              {loadingOwnJobs && !showOwnJobs && (
                <div className="loading-state">
                  <Loader2 size={20} className="spinner" /><span>Loading jobs...</span>
                </div>
              )}

              {showOwnJobs && (
                <>
                  {loadingOwnJobs ? (
                    <div className="loading-state">
                      <Loader2 size={20} className="spinner" /><span>Loading jobs...</span>
                    </div>
                  ) : ownJobs.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon"><Briefcase size={26} color="#cbd5e1" /></div>
                      <div className="empty-title">No jobs posted yet</div>
                      <div className="empty-description">Post your first job to start receiving applications</div>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ marginTop: "14px" }}
                        onClick={() => navigate("/post-job")}
                      >
                        <Plus size={14} /> Post First Job
                      </button>
                    </div>
                  ) : (
                    <div className="jobs-list">
                      {ownJobs.map(job => (
                        <div key={job._id} className="job-card">
                          <h3 className="job-title">{job.title}</h3>

                          <div className="job-meta">
                            <div className="job-meta-item"><MapPin size={14} />{job.location}</div>
                            <div className="job-meta-item"><Briefcase size={14} />{job.type}</div>
                            {job.isPaid && job.stipend && (
                              <div className="job-meta-item">
                                <span style={{ fontSize: 14, fontWeight: 700, color: "#64748b" }}>₹</span>
{job.stipend} / {job.stipendPeriod}
                              </div>
                            )}
                            <div className="job-meta-item">
                              <Clock size={14} />{new Date(job.createdAt).toLocaleDateString()}
                            </div>
                          </div>

                          {job.skills?.length > 0 && (
                            <div className="skills-list">
                              {job.skills.slice(0, 5).map((s, i) => (
                                <span key={i} className="skill-tag">{s}</span>
                              ))}
                              {job.skills.length > 5 && (
                                <span className="skill-tag">+{job.skills.length - 5} more</span>
                              )}
                            </div>
                          )}

                          <div className="job-footer">
                            <div>
                              {job.status === "approved" ? (
                                job.isOpen
                                  ? <span className="status-badge status-open"><CheckCircle size={12} /> Open</span>
                                  : <span className="status-badge status-closed"><XCircle size={12} /> Closed</span>
                              ) : (
                                <span className="status-badge status-down">
                                  {job.status === "taken_down" ? "Taken Down" : job.status}
                                </span>
                              )}
                            </div>

                            <div className="job-actions">
                              {job.status === "approved" && (
                                <button
                                  onClick={() => toggleOwnJob(job._id, job.isOpen)}
                                  disabled={togglingJob === job._id}
                                  className={`toggle-btn ${job.isOpen ? "open" : "closed"}`}
                                >
                                  {togglingJob === job._id
                                    ? <Loader2 size={14} className="spinner" />
                                    : job.isOpen
                                      ? <><ToggleLeft  size={14} /> Close Job</>
                                      : <><ToggleRight size={14} /> Open Job</>}
                                </button>
                              )}
                              {job.status !== "taken_down" && (
                                <>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => navigate(`/post-job/${job._id}`)}
                                  >
                                    <PenLine size={14} /> Edit
                                  </button>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => takedownOwnJob(job._id, job.title)}
                                  >
                                    <Trash2 size={14} /> Take Down
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              APPLICATIONS FOR YOUR JOBS  (matching recruiter style)
          ══════════════════════════════════════════════════════ */}
          {isApproved && (
  <div className="section-card">
    <BusinessApplications onCountChange={setTotalApplications} />
  </div>
)}

          {/* ══════════════════════════════════════════════════════
              LINKED RECRUITERS
          ══════════════════════════════════════════════════════ */}
          {isApproved && (
            <div className="section-card">
              <div className="section-header">
                <h2 className="section-title">
                  <Users size={20} />
                  Your Recruiters ({linkedRecruiters.length})
                </h2>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {linkedRecruiters.length > 0 && (
                    <span className="badge badge-success">{linkedRecruiters.length} active</span>
                  )}
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => { setShowLinkedRecruiters(!showLinkedRecruiters); if (!showLinkedRecruiters) fetchLinkedRecruiters(); }}
                  >
                    {showLinkedRecruiters ? "Hide" : "Show"} Recruiters
                  </button>
                </div>
              </div>

              {showLinkedRecruiters && (
                <>
                  {loadingLinkedRecruiters ? (
                    <div className="loading-state">
                      <Loader2 size={20} className="spinner" /><span>Loading recruiters...</span>
                    </div>
                  ) : linkedRecruiters.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon"><Users size={26} color="#cbd5e1" /></div>
                      <div className="empty-title">No linked recruiters</div>
                      <div className="empty-description">Approve recruiter requests to allow them to post jobs</div>
                    </div>
                  ) : (
                    linkedRecruiters.map(recruiter => (
                      <div key={recruiter._id} className="recruiter-card">
                        <div className="recruiter-header">
                          <div>
                            <div className="recruiter-name">{recruiter.name}</div>
                            {recruiter.recruiterProfile?.companyName && (
                              <div className="recruiter-company">{recruiter.recruiterProfile.companyName}</div>
                            )}
                          </div>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => removeRecruiter(recruiter._id, recruiter.name)}
                            disabled={removingRecruiter === recruiter._id}
                          >
                            {removingRecruiter === recruiter._id
                              ? <><Loader2 size={13} className="spinner" /> Removing...</>
                              : <><UserMinus size={13} /> Remove</>}
                          </button>
                        </div>
                        <div className="recruiter-details">
                          <div className="recruiter-detail-item"><Mail size={13} />{recruiter.email}</div>
                          {recruiter.recruiterProfile?.companyWebsite && (
                            <div className="recruiter-detail-item">
                              <Globe size={13} />{recruiter.recruiterProfile.companyWebsite}
                            </div>
                          )}
                          {recruiter.recruiterProfile?.companyLocation && (
                            <div className="recruiter-detail-item">
                              <MapPinIcon size={13} />{recruiter.recruiterProfile.companyLocation}
                            </div>
                          )}
                          {recruiter.recruiterProfile?.contactNumber && (
                            <div className="recruiter-detail-item">
                              <Phone size={13} />{recruiter.recruiterProfile.contactNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              RECRUITER REQUESTS
          ══════════════════════════════════════════════════════ */}
          {isApproved && (
            <div className="section-card">
              <div className="section-header">
                <h2 className="section-title">
                  <UserPlus size={20} />
                  Recruiter Requests ({pendingRecruiters.length})
                </h2>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {pendingRecruiters.length > 0 && (
                    <span className="badge badge-warning">{pendingRecruiters.length} pending</span>
                  )}
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => { setShowRecruiters(!showRecruiters); if (!showRecruiters) fetchPendingRecruiters(); }}
                  >
                    {showRecruiters ? "Hide" : "Show"} Requests
                  </button>
                </div>
              </div>

              {showRecruiters && (
                <>
                  {loadingRecruiters ? (
                    <div className="loading-state">
                      <Loader2 size={20} className="spinner" /><span>Loading requests...</span>
                    </div>
                  ) : pendingRecruiters.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon"><UserPlus size={26} color="#cbd5e1" /></div>
                      <div className="empty-title">No pending requests</div>
                      <div className="empty-description">Recruiters will request access to post jobs here</div>
                    </div>
                  ) : (
                    pendingRecruiters.map(request => (
                      <div key={request._id} className="approval-card">
                        <h3 className="approval-title">
                          {request.recruiter?.recruiterProfile?.companyName || request.recruiter?.name || "Unnamed Recruiter"}
                        </h3>
                        <div className="approval-meta">
                          <div className="approval-meta-item">
                            <Clock size={13} />Requested {new Date(request.requestedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="approval-details">
                          <div>
                            <div className="detail-label">Recruiter</div>
                            <div className="detail-value">{request.recruiter?.name}</div>
                          </div>
                          <div>
                            <div className="detail-label">Email</div>
                            <div className="detail-value">{request.recruiter?.email}</div>
                          </div>
                          {request.recruiter?.recruiterProfile?.companyWebsite && (
                            <div>
                              <div className="detail-label">Website</div>
                              <div className="detail-value">{request.recruiter.recruiterProfile.companyWebsite}</div>
                            </div>
                          )}
                          {request.recruiter?.recruiterProfile?.companyLocation && (
                            <div>
                              <div className="detail-label">Location</div>
                              <div className="detail-value">{request.recruiter.recruiterProfile.companyLocation}</div>
                            </div>
                          )}
                        </div>
                        <div className="approval-actions">
                          <button
                            className="btn btn-secondary"
                            onClick={() => rejectRecruiter(request._id, request.recruiter?.name)}
                          >
                            <XCircle size={15} /> Reject
                          </button>
                          <button
                            className="btn btn-primary"
                            onClick={() => approveRecruiter(request._id)}
                          >
                            <CheckCircle size={15} /> Approve Access
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              RECRUITER JOB APPROVALS (legacy flow)
          ══════════════════════════════════════════════════════ */}
          {isApproved && (
            <div className="section-card">
              <div className="section-header">
                <h2 className="section-title">
                  <Briefcase size={20} />
                  Recruiter Job Approvals ({pendingJobs.length})
                </h2>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {pendingJobs.length > 0 && (
                    <span className="badge badge-danger">{pendingJobs.length} pending</span>
                  )}
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => { setShowJobs(!showJobs); if (!showJobs) fetchPendingJobs(); }}
                  >
                    {showJobs ? "Hide" : "Show"} Jobs
                  </button>
                </div>
              </div>

              {showJobs && (
                <>
                  {loadingJobs ? (
                    <div className="loading-state">
                      <Loader2 size={20} className="spinner" /><span>Loading jobs...</span>
                    </div>
                  ) : pendingJobs.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon"><Briefcase size={26} color="#cbd5e1" /></div>
                      <div className="empty-title">No pending job approvals</div>
                      <div className="empty-description">Linked recruiters' job submissions will appear here</div>
                      <button onClick={fetchPendingJobs} className="btn btn-primary btn-sm" style={{ marginTop: "14px" }}>
                        Check Again
                      </button>
                    </div>
                  ) : (
                    pendingJobs.map(job => (
                      <div key={job._id} className="approval-card">
                        <h3 className="approval-title">{job.title}</h3>
                        <div className="approval-meta">
                          <div className="approval-meta-item"><Clock size={13} />Pending Your Approval</div>
                        </div>
                        <div className="approval-details">
                          <div>
                            <div className="detail-label">Location</div>
                            <div className="detail-value">
                              <MapPin size={13} style={{ display: "inline", marginRight: "4px" }} />{job.location}
                            </div>
                          </div>
                          <div>
                            <div className="detail-label">Type</div>
                            <div className="detail-value">{job.type}</div>
                          </div>
                          {job.salary && (
                            <div>
                              <div className="detail-label">Salary</div>
                              <div className="detail-value">{job.salary}</div>
                            </div>
                          )}
                          <div>
                            <div className="detail-label">Posted By</div>
                            <div className="detail-value">{job.recruiter?.name || "Unknown"}</div>
                          </div>
                        </div>
                        {job.skills?.length > 0 && (
                          <>
                            <div className="detail-label" style={{ marginBottom: "8px" }}>Required Skills</div>
                            <div className="skills-list">
                              {job.skills.map((s, i) => <span key={i} className="skill-tag">{s}</span>)}
                            </div>
                          </>
                        )}
                        {job.description && (
                          <>
                            <div className="detail-label" style={{ marginBottom: "8px" }}>Description</div>
                            <div className="description-box">{job.description.substring(0, 300)}...</div>
                          </>
                        )}
                        <div className="approval-actions">
                          <button className="btn btn-secondary" onClick={() => rejectJob(job._id, job.title)}>
                            <XCircle size={15} /> Reject Job
                          </button>
                          <button className="btn btn-primary" onClick={() => approveJob(job._id)}>
                            <CheckCircle size={15} /> Approve & Go Live
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Business Images ── */}
          <div className="section-card">
            <div className="section-header">
              <h2 className="section-title">
                <Building2 size={20} />
                Business Images
              </h2>
            </div>
            {images.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><Building2 size={26} color="#cbd5e1" /></div>
                <div className="empty-title">No images uploaded</div>
                <div className="empty-description">Add images to showcase your business</div>
              </div>
            ) : (
              <div className="images-grid">
                {images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`Business ${i + 1}`}
                    onClick={() => window.open(img, "_blank")}
                    className="business-image"
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default BusinessOwnerDashboard;