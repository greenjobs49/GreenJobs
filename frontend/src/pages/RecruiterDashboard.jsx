import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Navbar from "../components/common/Navbar";
import RecruiterApplications from "./RecruiterApplications";
import {
  Briefcase,
  Users,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Plus,
  AlertCircle,
  MapPin,
  DollarSign,
  ToggleRight,
  ToggleLeft,
  ShieldCheck,
  ShieldAlert,
  PenLine, Trash2,  
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import API_BASE_URL from "../config/api";

const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const { user, token, refreshUser } = useAuth();

  const [applicationCount, setApplicationCount] = useState("—");
  const [showDetails, setShowDetails] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [togglingJob, setTogglingJob] = useState(null);
  const [takingDownJob, setTakingDownJob] = useState(null);

  const profileProgress = user?.profileProgress || 0;
  const isProfileComplete = user?.profileCompleted;
  const profile = user?.recruiterProfile || {};

  // ── New: admin verification status ──────────────────────────────────────────
  // Expected values on user.recruiterProfile.verificationStatus:
  //   "pending"  – submitted, waiting for admin
  //   "approved" – admin approved, can post freely
  //   "rejected" – admin rejected
  //   undefined  – profile not yet submitted
  const verificationStatus = profile.verificationStatus; // "pending" | "approved" | "rejected" | undefined
  const isVerified = verificationStatus === "approved";
  const isPendingVerification = verificationStatus === "pending";
  const isRejected = verificationStatus === "rejected";

  // ── Data fetchers ────────────────────────────────────────────────────────────
  const fetchMyJobs = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingJobs(true);
      const res = await axios.get(`${API_BASE_URL}/api/jobs/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const jobsData = res.data?.jobs || [];
      setJobs(Array.isArray(jobsData) ? jobsData : []);
    } catch (err) {
      console.error("Jobs fetch error:", err);
      toast.error("Failed to load jobs");
      setJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  }, [token]);

  const fetchAppCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/applications/recruiter`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const apps = res.data.applications || res.data || [];
      setApplicationCount(apps.length);
    } catch {
      /* silently ignore */
    }
  }, [token]);

  // ── Submit profile for admin verification ────────────────────────────────────
  const requestVerification = async () => {
    if (!token) return;
    try {
      await axios.post(
        `${API_BASE_URL}/api/profile/recruiter/request-verification`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Verification request sent to admin!");
      toast("Admin will review your profile within 24 hours", {
        duration: 6000,
        icon: "⏰",
      });
      await refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send request");
    }
  };

  // ── Toggle job open/closed ───────────────────────────────────────────────────
  const toggleJobStatus = async (jobId, currentIsOpen) => {
    if (!token || !jobId) return;
    setTogglingJob(jobId);
    try {
      await axios.patch(
        `${API_BASE_URL}/api/jobs/${jobId}/toggle-status`,
        { isOpen: !currentIsOpen },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setJobs((prev) =>
        prev.map((j) => (j._id === jobId ? { ...j, isOpen: !currentIsOpen } : j))
      );
      toast.success(!currentIsOpen ? "Job reopened!" : "Job closed!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to toggle job status");
    } finally {
      setTogglingJob(null);
    }
  };
  const takedownJob = async (jobId, jobTitle) => {
    if (!window.confirm(`Take down "${jobTitle}"? It will go offline.`)) return;
    try {
      setTakingDownJob(jobId);
      await axios.patch(
        `${API_BASE_URL}/api/jobs/${jobId}/takedown`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Job taken offline.");
      fetchMyJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to take down job");
    } finally {
      setTakingDownJob(null);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMyJobs();
      fetchAppCount();
    }
  }, [fetchMyJobs, fetchAppCount, token]);

  // ── Stats ────────────────────────────────────────────────────────────────────
  const stats = [
    {
      icon: Briefcase,
      label: "Active Jobs",
      value: jobs.filter((j) => j.isOpen).length,
      color: "#3b82f6",
    },
    {
      icon: Users,
      label: "Applications",
      value: applicationCount,
      color: "#10b981",
    },
    {
      icon: ShieldCheck,
      label: "Verification",
      value: isVerified
        ? "Verified"
        : isPendingVerification
        ? "Pending"
        : isRejected
        ? "Rejected"
        : "Not Sent",
      color: isVerified
        ? "#10b981"
        : isPendingVerification
        ? "#f59e0b"
        : isRejected
        ? "#ef4444"
        : "#94a3b8",
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #f8fafc; color: #0f172a; }

        .dashboard-wrapper { background: #f8fafc; min-height: 100vh; }
        .dashboard-container { max-width: 1280px; margin: 0 auto; padding: 24px; }

        .page-header { margin-bottom: 32px; }
        .page-title  { font-size: 28px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
        .page-subtitle { font-size: 15px; color: #64748b; font-weight: 400; }

        .alert-banner {
          background: white; border: 1px solid #e2e8f0; border-radius: 8px;
          padding: 16px; margin-bottom: 16px;
          display: flex; align-items: flex-start; gap: 12px;
        }
        .alert-banner.warning { background: #fffbeb; border-color: #fde047; }
        .alert-banner.info    { background: #eff6ff; border-color: #93c5fd; }
        .alert-banner.success { background: #f0fdf4; border-color: #86efac; }
        .alert-banner.danger  { background: #fef2f2; border-color: #fca5a5; }

        .alert-icon    { flex-shrink: 0; margin-top: 2px; }
        .alert-content { flex: 1; }
        .alert-title   { font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 2px; }
        .alert-description { font-size: 13px; color: #64748b; }
        .alert-action  { flex-shrink: 0; }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px; margin-bottom: 32px;
        }
        .stat-card {
          background: white; border: 1px solid #e2e8f0; border-radius: 8px;
          padding: 20px; transition: all 0.2s;
        }
        .stat-card:hover { border-color: #cbd5e1; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .stat-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .stat-icon { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; }
        .stat-value { font-size: 32px; font-weight: 700; color: #0f172a; margin-bottom: 4px; line-height: 1; }
        .stat-label { font-size: 13px; color: #64748b; font-weight: 500; }

        .section-card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 24px; }
        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .section-title  { font-size: 18px; font-weight: 700; color: #0f172a; }

        .action-group { display: flex; gap: 12px; flex-wrap: wrap; }

        .btn {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 8px; padding: 10px 16px; border-radius: 6px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          transition: all 0.2s; border: none; outline: none;
        }
        .btn-primary   { background: #3b82f6; color: white; }
        .btn-primary:hover:not(:disabled)   { background: #2563eb; }
        .btn-secondary { background: white; color: #475569; border: 1px solid #e2e8f0; }
        .btn-secondary:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; }
        .btn:disabled  { opacity: 0.5; cursor: not-allowed; }
        .btn-sm { padding: 6px 12px; font-size: 13px; }

        .details-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px; padding: 20px; background: #f8fafc; border-radius: 6px; margin-top: 16px;
        }
        .detail-item-label { font-size: 12px; color: #64748b; margin-bottom: 4px; font-weight: 500; }
        .detail-item-value { font-size: 14px; color: #0f172a; font-weight: 500; }

        .jobs-list { display: flex; flex-direction: column; gap: 12px; }
        .job-card {
          background: white; border: 1px solid #e2e8f0; border-radius: 6px;
          padding: 16px; transition: all 0.2s;
        }
        .job-card:hover { border-color: #cbd5e1; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .job-title { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 8px; }
        .job-meta  { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 12px; }
        .job-meta-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #64748b; }
        .job-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; }

        .toggle-btn {
          display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px;
          border-radius: 20px; font-size: 12px; font-weight: 600; border: none;
          cursor: pointer; transition: all 0.2s; min-width: 90px; justify-content: center;
        }
        .toggle-btn.open   { background: #d1fae5; color: #065f46; border: 1px solid #86efac; }
        .toggle-btn.open:hover:not(:disabled)   { background: #a7f3d0; }
        .toggle-btn.closed { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .toggle-btn.closed:hover:not(:disabled) { background: #fecaca; }
        .toggle-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .status-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;
        }
        .status-open   { background: #dbeafe; color: #1e40af; }
        .status-closed { background: #fef2f2; color: #dc2626; }

        .verification-steps {
          display: flex; flex-direction: column; gap: 12px; margin-top: 16px;
        }
        .step {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px; border-radius: 6px; border: 1px solid #e2e8f0;
          font-size: 14px; color: #475569;
        }
        .step.done    { background: #f0fdf4; border-color: #86efac; color: #065f46; }
        .step.active  { background: #eff6ff; border-color: #93c5fd; color: #1e40af; }
        .step.waiting { background: #f8fafc; border-color: #e2e8f0; color: #94a3b8; }

        .info-note {
          display: flex; align-items: center; gap: 8px; padding: 12px;
          background: #fef3c7; border: 1px solid #fde047; border-radius: 6px;
          font-size: 13px; color: #78350f; margin-top: 16px;
        }

        .empty-state { text-align: center; padding: 48px 24px; }
        .empty-icon  {
          width: 64px; height: 64px; margin: 0 auto 16px; background: #f1f5f9;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
        }
        .empty-title       { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 4px; }
        .empty-description { font-size: 14px; color: #64748b; }

        .loading-state {
          display: flex; align-items: center; justify-content: center;
          gap: 8px; padding: 48px 24px; color: #64748b;
        }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (max-width: 768px) {
          .dashboard-container { padding: 16px; }
          .page-title  { font-size: 24px; }
          .stats-grid  { grid-template-columns: 1fr; }
          .action-group { flex-direction: column; }
          .btn { width: 100%; }
          .job-footer  { flex-direction: column; align-items: flex-start; gap: 8px; }
          .toggle-btn  { width: 100%; }
        }
      `}</style>

      <Navbar />

      <div className="dashboard-wrapper">
        <div className="dashboard-container">

          {/* ── Page Header ── */}
          <div className="page-header">
            <h1 className="page-title">
              Welcome back, {user?.name?.split(" ")[0] || "Recruiter"}
            </h1>
            <p className="page-subtitle">
              Manage your jobs, track applications, and grow your talent network
            </p>
          </div>

          {/* ── Banners ── */}

          {/* 1. Profile incomplete */}
          {!isProfileComplete && (
            <div className="alert-banner warning">
              <div className="alert-icon"><AlertCircle size={20} color="#f59e0b" /></div>
              <div className="alert-content">
                <div className="alert-title">Complete Your Profile ({profileProgress}%)</div>
                <div className="alert-description">Finish setting up your profile to request admin verification</div>
              </div>
              <div className="alert-action">
                <button onClick={() => navigate("/complete-profile")} className="btn btn-primary btn-sm">
                  Complete Now
                </button>
              </div>
            </div>
          )}

          {/* 2. Profile complete but verification not requested */}
          {isProfileComplete && !verificationStatus && (
            <div className="alert-banner warning">
              <div className="alert-icon"><ShieldAlert size={20} color="#f59e0b" /></div>
              <div className="alert-content">
                <div className="alert-title">Get Verified to Post Jobs</div>
                <div className="alert-description">
                  Submit your profile for admin verification. Once approved you can post jobs instantly — no per-job approval needed.
                </div>
              </div>
              <div className="alert-action">
                <button onClick={requestVerification} className="btn btn-primary btn-sm">
                  <ShieldCheck size={14} /> Request Verification
                </button>
              </div>
            </div>
          )}

          {/* 3. Pending admin review */}
          {isPendingVerification && (
            <div className="alert-banner info">
              <div className="alert-icon"><Clock size={20} color="#3b82f6" /></div>
              <div className="alert-content">
                <div className="alert-title">Verification Pending</div>
                <div className="alert-description">
                  Your profile is under admin review. You'll be notified once approved — usually within 24 hours.
                </div>
              </div>
            </div>
          )}

          {/* 4. Verified */}
          {isVerified && (
            <div className="alert-banner success">
              <div className="alert-icon"><ShieldCheck size={20} color="#10b981" /></div>
              <div className="alert-content">
                <div className="alert-title">Profile Verified ✓</div>
                <div className="alert-description">
                  You can post jobs directly — they go live immediately without any additional approvals.
                </div>
              </div>
            </div>
          )}

          {/* 5. Rejected */}
          {isRejected && (
            <div className="alert-banner danger">
              <div className="alert-icon"><XCircle size={20} color="#dc2626" /></div>
              <div className="alert-content">
                <div className="alert-title">Verification Rejected</div>
                <div className="alert-description">
                  {profile.rejectionReason
                    ? `Reason: ${profile.rejectionReason}`
                    : "Your verification was rejected. Please update your profile and resubmit."}
                </div>
              </div>
              <div className="alert-action">
                <button onClick={requestVerification} className="btn btn-primary btn-sm">
                  Resubmit
                </button>
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

          {/* ── How It Works (shown until verified) ── */}
          {!isVerified && (
            <div className="section-card">
              <div className="section-header">
                <h2 className="section-title">How to Start Posting Jobs</h2>
              </div>
              <div className="verification-steps">
                <div className={`step ${isProfileComplete ? "done" : "active"}`}>
                  <CheckCircle size={18} />
                  <span><strong>Step 1:</strong> Complete your recruiter profile</span>
                </div>
                <div className={`step ${isPendingVerification || isVerified ? "done" : isProfileComplete ? "active" : "waiting"}`}>
                  <Clock size={18} />
                  <span><strong>Step 2:</strong> Submit for admin verification</span>
                </div>
                <div className={`step ${isVerified ? "done" : "waiting"}`}>
                  <ShieldCheck size={18} />
                  <span><strong>Step 3:</strong> Get approved — post jobs freely with no per-job approvals</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Quick Actions ── */}
          <div className="section-card">
            <div className="section-header">
              <h2 className="section-title">Quick Actions</h2>
            </div>
            <div className="action-group">
              <button
                onClick={() => navigate("/post-job")}
                disabled={!isVerified}
                className="btn btn-primary"
                title={!isVerified ? "Admin verification required to post jobs" : ""}
              >
                <Plus size={16} /> Post New Job
              </button>
              <button onClick={() => setShowDetails(!showDetails)} className="btn btn-secondary">
                <Eye size={16} /> {showDetails ? "Hide Details" : "View Company Details"}
              </button>
              <button onClick={() => navigate("/complete-profile")} className="btn btn-secondary">
                <Users size={16} /> Update Profile
              </button>
            </div>

            {showDetails && (
              <div className="details-grid">
                <div>
                  <div className="detail-item-label">Company Name</div>
                  <div className="detail-item-value">{profile.companyName || "—"}</div>
                </div>
                <div>
                  <div className="detail-item-label">Website</div>
                  <div className="detail-item-value">{profile.companyWebsite || "—"}</div>
                </div>
                <div>
                  <div className="detail-item-label">Contact</div>
                  <div className="detail-item-value">{profile.contactNumber || "—"}</div>
                </div>
                <div>
                  <div className="detail-item-label">Location</div>
                  <div className="detail-item-value">{profile.companyLocation || "—"}</div>
                </div>
                <div>
                  <div className="detail-item-label">Industry</div>
                  <div className="detail-item-value">{profile.industryType || "—"}</div>
                </div>
              </div>
            )}

            {isVerified && (
              <div className="info-note">
                <ShieldCheck size={16} />
                <span>Your account is verified. Jobs you post go live immediately.</span>
              </div>
            )}
          </div>

          {/* ── My Job Listings ── */}
          <div className="section-card">
            <div className="section-header">
              <h2 className="section-title">My Job Listings ({jobs.length})</h2>
            </div>

            {loadingJobs && (
              <div className="loading-state">
                <Loader2 size={20} className="spinner" />
                <span>Loading jobs...</span>
              </div>
            )}

            {!loadingJobs && jobs.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon"><Briefcase size={28} color="#cbd5e1" /></div>
                <div className="empty-title">No jobs posted yet</div>
                <div className="empty-description">
                  {isVerified
                    ? "Post your first job to get started"
                    : "Complete admin verification to start posting jobs"}
                </div>
              </div>
            )}

            {!loadingJobs && jobs.length > 0 && (
              <div className="jobs-list">
                {jobs.map((job) => (
                  <div key={job._id} className="job-card">
                    <h3 className="job-title">{job.title}</h3>
                    <div className="job-meta">
                      <div className="job-meta-item"><MapPin size={14} />{job.location}</div>
                      <div className="job-meta-item"><Briefcase size={14} />{job.type || job.jobType}</div>
                      {job.salary && (
                        <div className="job-meta-item"><DollarSign size={14} />{job.salary}</div>
                      )}
                    </div>
                    <div className="job-footer">
                    <div>
                      {job.isOpen ? (
                        <span className="status-badge status-open">
                          <CheckCircle size={12} /> Open
                        </span>
                      ) : (
                        <span className="status-badge status-closed">
                          <XCircle size={12} /> Closed
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button
                        onClick={() => toggleJobStatus(job._id, job.isOpen)}
                        disabled={togglingJob === job._id}
                        className={`toggle-btn ${job.isOpen ? "open" : "closed"}`}
                        title={`Click to ${job.isOpen ? "close" : "open"} this job`}
                      >
                        {togglingJob === job._id ? (
                          <Loader2 size={14} className="spinner" />
                        ) : job.isOpen ? (
                          <><ToggleLeft size={14} /> Close Job</>
                        ) : (
                          <><ToggleRight size={14} /> Open Job</>
                        )}
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/post-job/${job._id}`)}
                      >
                        <PenLine size={14} /> Edit
                      </button>
                      {job.status !== "taken_down" && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => takedownJob(job._id, job.title)}
                          disabled={takingDownJob === job._id}
                        >
                          <Trash2 size={14} /> Take Down
                        </button>
                      )}
                    </div>
                  </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Applications Panel ── */}
          <RecruiterApplications />

        </div>
      </div>
    </>
  );
};

export default RecruiterDashboard;