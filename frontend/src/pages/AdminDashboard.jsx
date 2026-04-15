import React, { useEffect, useState, useCallback } from "react";
import Navbar from "../components/common/Navbar";
import {
  Users, Briefcase, Building, TrendingUp, CheckCircle,
  Clock, XCircle, Eye, RefreshCw, Loader2, Search,
  MapPin, Mail, Calendar, ArrowUpRight, ShieldOff,
  ShieldCheck, UserCheck, X, UserPlus, Building2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import API_BASE_URL from "../config/api";
import AdminAdsManager from "./AdminAdsManager";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [stats, setStats] = useState({
    totalUsers: 0, jobseekers: 0, recruiters: 0, businesses: 0,
    liveJobs: 0, pendingJobs: 0, pendingBusinesses: 0, approvedBusinesses: 0,
    pendingRecruiters: 0, incompleteUsers: 0,
  });

  const [users, setUsers] = useState([]);
  const [liveJobs, setLiveJobs] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [pendingBusinesses, setPendingBusinesses] = useState([]);
  const [pendingRecruiters, setPendingRecruiters] = useState([]);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [revokingId, setRevokingId] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);
  const [revokingJobId, setRevokingJobId] = useState(null);
  const [restoringJobId, setRestoringJobId] = useState(null);

  // ── Add Admin modal state ───────────────────────────────────────────────────
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", phone: "" });
  const [addingAdmin, setAddingAdmin] = useState(false);

  const REVOKE_TYPE_OPTIONS = [
    { value: "fraud",            label: "Fraudulent Listing" },
    { value: "non_applicable",   label: "Non-Applicable / Irrelevant Content" },
    { value: "policy_violation", label: "Policy Violation" },
    { value: "other",            label: "Other / Admin Discretion" },
  ];

  // ── Job revoke/restore handlers ─────────────────────────────────────────────
  const handleAdminRevokeJob = async (jobId, jobTitle) => {
    const revokeType = window.prompt(
      `Revoke "${jobTitle}"?\n\nSelect reason type (type the key):\n` +
      REVOKE_TYPE_OPTIONS.map(o => `  ${o.value} — ${o.label}`).join("\n") +
      `\n\nType one of: fraud | non_applicable | policy_violation | other`
    );
    if (revokeType === null) return;

    const validTypes = REVOKE_TYPE_OPTIONS.map(o => o.value);
    const type = validTypes.includes(revokeType.trim().toLowerCase())
      ? revokeType.trim().toLowerCase()
      : "other";

    const reason = window.prompt(
      `Add details / reason for revoking "${jobTitle}":\n(This will be sent to the recruiter)`
    );
    if (reason === null) return;

    try {
      setRevokingJobId(jobId);
      await axios.patch(
        `${API_BASE_URL}/api/admin/jobs/${jobId}/revoke`,
        { revokeType: type, reason: reason.trim() || REVOKE_TYPE_OPTIONS.find(o => o.value === type)?.label },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`"${jobTitle}" revoked. Emails sent to recruiter & business.`);
      fetchAllData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to revoke job");
    } finally {
      setRevokingJobId(null);
    }
  };

  const handleAdminRestoreJob = async (jobId, jobTitle) => {
    if (!window.confirm(`Restore "${jobTitle}" back to live?\n\nThis will email the recruiter that their listing is back up.`)) return;
    try {
      setRestoringJobId(jobId);
      await axios.patch(
        `${API_BASE_URL}/api/admin/jobs/${jobId}/restore`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`"${jobTitle}" restored to live!`);
      fetchAllData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to restore job");
    } finally {
      setRestoringJobId(null);
    }
  };

  // ── Fetch all data ──────────────────────────────────────────────────────────
  const fetchAllData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, usersRes, liveJobsRes, approvedBizRes, pendingBizRes, pendingRecRes] =
        await Promise.all([
          axios.get(`${API_BASE_URL}/api/admin/stats`, { headers }).catch(() => ({ data: {} })),
          axios.get(`${API_BASE_URL}/api/admin/users`, { headers }).catch(() => ({ data: [] })),
          axios.get(`${API_BASE_URL}/api/jobs/public`).catch(() => ({ data: { jobs: [] } })),
          axios.get(`${API_BASE_URL}/api/profile/business/approved`, { headers }).catch(() => ({ data: [] })),
          axios.get(`${API_BASE_URL}/api/profile/business/pending`, { headers }).catch(() => ({ data: [] })),
          axios.get(`${API_BASE_URL}/api/admin/recruiters/pending-verification`, { headers }).catch(() => ({ data: [] })),
        ]);

      const usersData       = Array.isArray(usersRes.data)        ? usersRes.data        : [];
      const jobsData        = liveJobsRes.data?.jobs              || [];
      const approvedBizData = Array.isArray(approvedBizRes.data)  ? approvedBizRes.data  : [];
      const pendingBizData  = Array.isArray(pendingBizRes.data)   ? pendingBizRes.data   : [];
      const pendingRecData  = Array.isArray(pendingRecRes.data)   ? pendingRecRes.data   : [];

      setUsers(usersData);
      setLiveJobs(jobsData);
      setBusinesses(approvedBizData);
      setPendingBusinesses(pendingBizData);
      setPendingRecruiters(pendingRecData);

      const s = statsRes.data || {};
      setStats({
        totalUsers:         s.totalUsers         ?? usersData.length,
        jobseekers:         s.jobseekers         ?? usersData.filter((u) => u.role === "jobseeker").length,
        recruiters:         s.recruiters         ?? usersData.filter((u) => u.role === "recruiter").length,
        businesses:         s.businesses         ?? usersData.filter((u) => u.role === "business").length,
        liveJobs:           s.liveJobs           ?? jobsData.length,
        pendingJobs:        s.pendingJobs        ?? 0,
        pendingBusinesses:  s.pendingBusinesses  ?? pendingBizData.length,
        approvedBusinesses: s.approvedBusinesses ?? approvedBizData.length,
        pendingRecruiters:  s.pendingRecruiters  ?? pendingRecData.length,
        incompleteUsers:    s.incompleteUsers    ?? usersData.filter(u => !u.profileCompleted && u.role !== "admin").length,
      });
    } catch (err) {
      console.error("Fetch data error:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  // ── Revoke business ─────────────────────────────────────────────────────────
  const handleRevokeBusiness = async (bizId, bizName) => {
    if (!window.confirm(
      `Revoke verification for "${bizName}"?\n\nThis will:\n• Reset their status back to pending\n• Disconnect all linked recruiters\n• Require them to re-apply for approval`
    )) return;
    try {
      setRevokingId(bizId);
      await axios.patch(
        `${API_BASE_URL}/api/admin/businesses/${bizId}/revoke`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`"${bizName}" verification revoked`);
      fetchAllData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to revoke business");
    } finally {
      setRevokingId(null);
    }
  };

  // ── Verify / reject recruiter ───────────────────────────────────────────────
  const handleVerifyRecruiter = async (recruiterId, recruiterName) => {
    try {
      setVerifyingId(recruiterId);
      await axios.patch(
        `${API_BASE_URL}/api/admin/recruiters/${recruiterId}/verify`,
        { status: "approved" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`${recruiterName} verified! They can now post jobs.`);
      fetchAllData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
    } finally {
      setVerifyingId(null);
    }
  };

  const handleRejectRecruiter = async (recruiterId, recruiterName) => {
    const reason = window.prompt(`Reason for rejecting ${recruiterName}? (Optional)`);
    if (reason === null) return;
    try {
      setVerifyingId(recruiterId);
      await axios.patch(
        `${API_BASE_URL}/api/admin/recruiters/${recruiterId}/verify`,
        { status: "rejected", reason: reason || "No reason provided" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`${recruiterName}'s verification rejected`);
      fetchAllData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Rejection failed");
    } finally {
      setVerifyingId(null);
    }
  };

  // ── Send profile reminders ──────────────────────────────────────────────────
  const handleSendProfileReminders = async () => {
    if (!window.confirm(
      "Send profile completion reminder emails to all users who signed up 24+ hours ago and haven't completed their profile?\n\nThis will send role-specific emails to jobseekers, recruiters, and business owners."
    )) return;

    try {
      setSendingReminders(true);
      const res = await axios.post(
        `${API_BASE_URL}/api/admin/send-profile-reminders`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(
        `✅ Reminders sent to ${res.data.sent} user(s)${res.data.failed > 0 ? ` · ${res.data.failed} failed` : ""}`
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reminders");
    } finally {
      setSendingReminders(false);
    }
  };

  // ── Add Admin ───────────────────────────────────────────────────────────────
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!newAdmin.name.trim()) { toast.error("Name is required"); return; }
    if (!newAdmin.email.trim()) { toast.error("Email is required"); return; }
    try {
      setAddingAdmin(true);
      const res = await axios.post(
        `${API_BASE_URL}/api/admin/create-admin`,
        { name: newAdmin.name.trim(), email: newAdmin.email.trim(), phone: newAdmin.phone.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(res.data.message || `Admin account created for ${newAdmin.email}`);
      setShowAddAdmin(false);
      setNewAdmin({ name: "", email: "", phone: "" });
      fetchAllData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create admin account");
    } finally {
      setAddingAdmin(false);
    }
  };

  const closeAddAdminModal = () => {
    if (addingAdmin) return;
    setShowAddAdmin(false);
    setNewAdmin({ name: "", email: "", phone: "" });
  };

  // ── Filtered lists ──────────────────────────────────────────────────────────
  const filteredUsers = users.filter((u) => {
    const matchesRole   = roleFilter === "all" || u.role === roleFilter;
    const matchesSearch =
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const filteredJobs = liveJobs.filter(
    (j) =>
      j.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBusinesses = [...businesses, ...pendingBusinesses].filter(
    (b) =>
      b.businessProfile?.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRecruiters = pendingRecruiters.filter(
    (r) =>
      r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Stat cards ──────────────────────────────────────────────────────────────
  const statsCards = [
    {
      icon: Users, label: "Total Users", value: stats.totalUsers, color: "#3b82f6",
      subtitle: `${stats.jobseekers} seekers · ${stats.recruiters} recruiters · ${stats.businesses} businesses`,
      tab: "users",
    },
    {
      icon: Briefcase, label: "Live Jobs", value: stats.liveJobs, color: "#10b981",
      subtitle: `${stats.pendingJobs} pending approval`,
      tab: "jobs",
    },
    {
      icon: Building, label: "Total Businesses",
      value: stats.approvedBusinesses + stats.pendingBusinesses, color: "#f59e0b",
      subtitle: `${stats.approvedBusinesses} approved · ${stats.pendingBusinesses} pending`,
      tab: "businesses",
      urgent: stats.pendingBusinesses > 0 ? "amber" : null,
    },
    {
      icon: ShieldCheck, label: "Recruiter Verifications",
      value: stats.pendingRecruiters, color: "#ef4444",
      subtitle: "Recruiters awaiting verification",
      tab: "recruiters",
      urgent: stats.pendingRecruiters > 0 ? "red" : null,
    },
  ];

  // ── Badge helpers ───────────────────────────────────────────────────────────
  const getRoleBadge = (role) => {
    const map = {
      jobseeker: { bg: "#dbeafe", color: "#1e40af", label: "Job Seeker" },
      recruiter:  { bg: "#fef3c7", color: "#92400e", label: "Recruiter" },
      business:   { bg: "#d1fae5", color: "#065f46", label: "Business" },
      admin:      { bg: "#f3e8ff", color: "#6b21a8", label: "Admin" },
    };
    const s = map[role] || map.jobseeker;
    return (
      <span style={{ background: s.bg, color: s.color, padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" }}>
        {s.label}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const map = {
      approved: { bg: "#d1fae5", color: "#065f46", icon: <CheckCircle size={14} /> },
      pending:  { bg: "#fef3c7", color: "#92400e", icon: <Clock size={14} /> },
      rejected: { bg: "#fee2e2", color: "#991b1b", icon: <XCircle size={14} /> },
    };
    const s = map[status] || map.pending;
    return (
      <span style={{ background: s.bg, color: s.color, padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "4px" }}>
        {s.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div>
        <Navbar />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center" }}>
          <Loader2 className="animate-spin" size={48} style={{ color: "#3b82f6", marginBottom: 16 }} />
          <p style={{ fontSize: 18, color: "#6b7280" }}>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #f8fafc; color: #0f172a; }
        .dashboard-wrapper { background: #f8fafc; min-height: 100vh; }
        .dashboard-container { max-width: 1400px; margin: 0 auto; padding: 24px; }
        .page-header { margin-bottom: 32px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
        .page-title  { font-size: 28px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
        .page-subtitle { font-size: 15px; color: #64748b; font-weight: 400; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; margin-bottom: 32px; }
        .stat-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; transition: all 0.2s; cursor: pointer; }
        .stat-card:hover { border-color: #cbd5e1; box-shadow: 0 4px 6px rgba(0,0,0,0.05); transform: translateY(-2px); }
        .stat-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; }
        .stat-value { font-size: 36px; font-weight: 700; color: #0f172a; margin-bottom: 4px; line-height: 1; }
        .stat-label { font-size: 14px; color: #64748b; font-weight: 500; margin-bottom: 8px; }
        .stat-subtitle { font-size: 12px; color: #94a3b8; }
        .tabs-container { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 8px; margin-bottom: 24px; display: flex; gap: 8px; flex-wrap: wrap; }
        .tab-button { padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: none; background: transparent; color: #64748b; }
        .tab-button.active { background: #3b82f6; color: white; }
        .tab-button:hover:not(.active) { background: #f1f5f9; }
        .section-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0; flex-wrap: wrap; gap: 12px; }
        .section-title { font-size: 18px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 8px; }
        .search-box { position: relative; max-width: 400px; width: 100%; }
        .search-input { width: 100%; padding: 10px 16px 10px 40px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; outline: none; transition: all 0.2s; font-family: inherit; }
        .search-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
        .action-group { display: flex; gap: 12px; flex-wrap: wrap; }
        .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: none; outline: none; font-family: inherit; }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-primary { background: #3b82f6; color: white; }
        .btn-primary:hover:not(:disabled) { background: #2563eb; }
        .btn-secondary { background: white; color: #475569; border: 1px solid #e2e8f0; }
        .btn-secondary:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; }
        .btn-success { background: #10b981; color: white; }
        .btn-success:hover:not(:disabled) { background: #059669; }
        .btn-danger { background: white; color: #dc2626; border: 1px solid #fecaca; }
        .btn-danger:hover:not(:disabled) { background: #fef2f2; border-color: #fca5a5; }
        .btn-sm { padding: 6px 12px; font-size: 13px; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th { text-align: left; padding: 12px; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; }
        .data-table td { padding: 16px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #0f172a; }
        .data-table tr:hover { background: #f8fafc; }
        .user-info { display: flex; align-items: center; gap: 12px; }
        .user-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 16px; flex-shrink: 0; }
        .user-name { font-weight: 600; color: #0f172a; margin-bottom: 2px; }
        .user-email { font-size: 13px; color: #64748b; }
        .rec-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 14px; transition: all 0.2s; border-left: 4px solid #f59e0b; }
        .rec-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .rec-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; flex-wrap: wrap; gap: 10px; }
        .rec-name  { font-size: 17px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
        .rec-email { font-size: 13px; color: #64748b; }
        .rec-meta  { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin: 14px 0; }
        .rec-meta-item { display: flex; flex-direction: column; gap: 2px; }
        .rec-meta-label { font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .rec-meta-value { font-size: 14px; color: #0f172a; font-weight: 500; }
        .rec-actions { display: flex; gap: 10px; padding-top: 14px; border-top: 1px solid #e2e8f0; justify-content: flex-end; }
        .job-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 12px; transition: all 0.2s; }
        .job-card:hover { border-color: #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .job-title { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 8px; }
        .job-meta { display: flex; flex-wrap: wrap; gap: 16px; font-size: 13px; color: #64748b; }
        .job-meta-item { display: flex; align-items: center; gap: 6px; }
        .business-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 12px; transition: all 0.2s; }
        .business-card.approved { border-left: 4px solid #10b981; }
        .business-card.pending  { border-left: 4px solid #f59e0b; }
        .business-card.rejected { border-left: 4px solid #ef4444; }
        .business-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px; flex-wrap: wrap; gap: 12px; }
        .business-name     { font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 4px; }
        .business-category { font-size: 13px; color: #64748b; }
        .business-actions  { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
        .empty-state { text-align: center; padding: 48px 24px; }
        .empty-icon  { width: 64px; height: 64px; margin: 0 auto 16px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .empty-title { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 4px; }
        .empty-desc  { font-size: 14px; color: #64748b; }
        .urgent-dot { width: 8px; height: 8px; background: #ef4444; border-radius: 50%; display: inline-block; margin-left: 6px; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        /* ── Add Admin Modal ── */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal-box { background: white; border-radius: 16px; padding: 32px; width: 100%; max-width: 460px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); position: relative; }
        .modal-close { position: absolute; top: 16px; right: 16px; background: none; border: none; cursor: pointer; color: #94a3b8; padding: 4px; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .modal-close:hover { background: #f1f5f9; color: #475569; }
        .modal-title { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
        .modal-desc  { font-size: 13px; color: #64748b; margin-bottom: 24px; line-height: 1.6; }
        .modal-field { margin-bottom: 16px; }
        .modal-label { display: block; font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
        .modal-input { width: 100%; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; outline: none; transition: all 0.2s; font-family: inherit; box-sizing: border-box; }
        .modal-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        .modal-input:disabled { opacity: 0.5; background: #f8fafc; }
        .modal-actions { display: flex; gap: 12px; margin-top: 24px; }
        .modal-actions .btn { flex: 1; }
        /* ── Urgent alert banners ── */
        .alert-banner { border-radius: 12px; padding: 20px 24px; margin-bottom: 20px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        .alert-banner-red    { background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%); border: 1.5px solid #fca5a5; }
        .alert-banner-amber  { background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 1.5px solid #fcd34d; }
        .alert-icon-wrap { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .alert-icon-red   { background: #fee2e2; }
        .alert-icon-amber { background: #fde68a; }
        .alert-title   { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 3px; }
        .alert-desc    { font-size: 13px; color: #64748b; }
        .alert-count   { font-size: 36px; font-weight: 800; line-height: 1; margin-right: 4px; }
        .alert-count-red   { color: #dc2626; }
        .alert-count-amber { color: #d97706; }
        .stat-card-urgent { box-shadow: 0 0 0 3px #fca5a5; border-color: #f87171 !important; animation: ring-pulse 2s ease-in-out infinite; }
        .stat-card-urgent-amber { box-shadow: 0 0 0 3px #fcd34d; border-color: #fbbf24 !important; animation: ring-pulse-amber 2s ease-in-out infinite; }
        @keyframes ring-pulse       { 0%,100%{box-shadow:0 0 0 3px #fca5a5;}  50%{box-shadow:0 0 0 6px #fecaca;} }
        @keyframes ring-pulse-amber { 0%,100%{box-shadow:0 0 0 3px #fcd34d;}  50%{box-shadow:0 0 0 6px #fef08a;} }
        .tab-urgent-badge { display: inline-flex; align-items: center; justify-content: center; background: #ef4444; color: white; border-radius: 100px; font-size: 11px; font-weight: 700; padding: 1px 7px; margin-left: 6px; animation: pulse 1.5s infinite; }
        .tab-amber-badge  { display: inline-flex; align-items: center; justify-content: center; background: #f59e0b; color: white; border-radius: 100px; font-size: 11px; font-weight: 700; padding: 1px 7px; margin-left: 6px; }
        @media (max-width: 768px) {
          .dashboard-container { padding: 16px; }
          .page-title { font-size: 24px; }
          .stats-grid { grid-template-columns: 1fr; }
          .rec-actions { flex-direction: column; }
          .btn { width: 100%; }
          .modal-actions { flex-direction: column; }
        }
      `}</style>

      <Navbar />

      <div className="dashboard-wrapper">
        <div className="dashboard-container">

          {/* ── Header ── */}
          <div className="page-header">
            <div>
              <h1 className="page-title">Admin Dashboard</h1>
              <p className="page-subtitle">Monitor and manage all platform activities</p>
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button className="btn btn-success" onClick={() => setShowAddAdmin(true)}>
                <UserPlus size={16} /> Add Admin
              </button>
              <button className="btn btn-secondary" onClick={fetchAllData}>
                <RefreshCw size={16} /> Refresh
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleSendProfileReminders}
                disabled={sendingReminders}
                title="Send profile completion reminder emails to incomplete users"
              >
                {sendingReminders
                  ? <><Loader2 size={16} className="animate-spin" /> Sending...</>
                  : <><Mail size={16} /> Send Reminders</>}
              </button>
            </div>
          </div>

          {/* ── Stats Grid ── */}
          <div className="stats-grid">
            {statsCards.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={i}
                  className={[
                    "stat-card",
                    stat.urgent === "red"   ? "stat-card-urgent"       : "",
                    stat.urgent === "amber" ? "stat-card-urgent-amber" : "",
                  ].join(" ").trim()}
                  onClick={() => setActiveTab(stat.tab)}
                >
                  <div className="stat-header">
                    <div className="stat-icon"><Icon size={24} color={stat.color} /></div>
                    <ArrowUpRight size={20} color="#94a3b8" />
                  </div>
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                  <div className="stat-subtitle">{stat.subtitle}</div>
                  {stat.urgent && (
                    <div style={{
                      marginTop: 10, display: "inline-flex", alignItems: "center", gap: 5,
                      background: stat.urgent === "red" ? "#fee2e2" : "#fef3c7",
                      color: stat.urgent === "red" ? "#dc2626" : "#d97706",
                      padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700,
                    }}>
                      ⚠ Action Required
                    </div>
                  )}
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
              <button className="btn btn-primary" onClick={() => navigate("/admin/pending-businesses")}>
                <Building size={16} /> Approve Businesses ({stats.pendingBusinesses})
              </button>
              <button className="btn btn-primary" onClick={() => setActiveTab("recruiters")}>
                <ShieldCheck size={16} /> Verify Recruiters ({stats.pendingRecruiters})
                {stats.pendingRecruiters > 0 && <span className="urgent-dot" />}
              </button>
              <button className="btn btn-secondary" onClick={() => setActiveTab("users")}>
                <Users size={16} /> View All Users ({stats.totalUsers})
              </button>
              <button className="btn btn-secondary" onClick={() => setActiveTab("jobs")}>
                <Briefcase size={16} /> View All Jobs ({stats.liveJobs})
              </button>
              <button className="btn btn-success" onClick={() => setShowAddAdmin(true)}>
                <UserPlus size={16} /> Add Admin
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleSendProfileReminders}
                disabled={sendingReminders}
              >
                {sendingReminders
                  ? <><Loader2 size={16} className="animate-spin" /> Sending...</>
                  : <><Mail size={16} /> Send Profile Reminders</>}
              </button>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="tabs-container">
            {[
              { key: "overview",   label: "Overview",                        badge: null },
              { key: "users",      label: `Users (${stats.totalUsers})`,     badge: null },
              { key: "jobs",       label: `Live Jobs (${stats.liveJobs})`,   badge: null },
              { key: "businesses", label: `Businesses`,                      badge: stats.pendingBusinesses > 0 ? { count: stats.pendingBusinesses, type: "amber" } : null },
              { key: "recruiters", label: "Recruiter Verifications",         badge: stats.pendingRecruiters > 0 ? { count: stats.pendingRecruiters, type: "red" } : null },
              { key: "ads",        label: "Ad Manager",                   badge: null },
            ].map((tab) => (
              <button
                key={tab.key}
                className={`tab-button ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => { setActiveTab(tab.key); setSearchTerm(""); }}
              >
                {tab.label}
                {tab.badge && (
                  <span className={tab.badge.type === "red" ? "tab-urgent-badge" : "tab-amber-badge"}>
                    {tab.badge.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ══════════════════════════════════════════
              ── Overview Tab ──
          ══════════════════════════════════════════ */}
          {activeTab === "overview" && (
            <div>
              {stats.pendingRecruiters > 0 && (
                <div className="alert-banner alert-banner-red">
                  <div className="alert-icon-wrap alert-icon-red">
                    <ShieldCheck size={26} color="#dc2626" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="alert-title">
                      <span className="alert-count alert-count-red">{stats.pendingRecruiters}</span>
                      Recruiter{stats.pendingRecruiters !== 1 ? "s" : ""} awaiting verification
                    </div>
                    <div className="alert-desc">
                      Once approved, they can post jobs instantly. Don't keep them waiting.
                    </div>
                  </div>
                  <button className="btn btn-sm" style={{ background: "#dc2626", color: "white", border: "none", flexShrink: 0 }} onClick={() => setActiveTab("recruiters")}>
                    Review Now →
                  </button>
                </div>
              )}

              {stats.pendingBusinesses > 0 && (
                <div className="alert-banner alert-banner-amber">
                  <div className="alert-icon-wrap alert-icon-amber">
                    <Building size={26} color="#d97706" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="alert-title">
                      <span className="alert-count alert-count-amber">{stats.pendingBusinesses}</span>
                      Business application{stats.pendingBusinesses !== 1 ? "s" : ""} pending approval
                    </div>
                    <div className="alert-desc">
                      Businesses are waiting to go live. Approve them so recruiters can start linking.
                    </div>
                  </div>
                  <button className="btn btn-sm" style={{ background: "#d97706", color: "white", border: "none", flexShrink: 0 }} onClick={() => navigate("/admin/pending-businesses")}>
                    Approve Now →
                  </button>
                </div>
              )}

              {stats.pendingRecruiters === 0 && stats.pendingBusinesses === 0 && (
                <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: "12px", padding: "16px 20px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <CheckCircle size={22} color="#10b981" />
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "#065f46" }}>All clear — no pending verifications or approvals right now.</span>
                </div>
              )}

              <div className="section-card">
                <div className="section-header">
                  <h2 className="section-title"><Users size={20} /> User Breakdown</h2>
                  <button className="btn btn-secondary" onClick={() => setActiveTab("users")}>View All</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                  {[
                    { label: "Job Seekers",     value: stats.jobseekers, bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af", dark: "#1e3a8a" },
                    { label: "Recruiters",      value: stats.recruiters, bg: "#fef3c7", border: "#fde047", text: "#92400e", dark: "#78350f" },
                    { label: "Business Owners", value: stats.businesses, bg: "#d1fae5", border: "#6ee7b7", text: "#065f46", dark: "#064e3b" },
                    { label: "Total Platform",  value: stats.totalUsers, bg: "#f3e8ff", border: "#e9d5ff", text: "#6b21a8", dark: "#581c87" },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: "24px", background: item.bg, borderRadius: "12px", border: `1px solid ${item.border}` }}>
                      <div style={{ fontSize: "13px", color: item.text, marginBottom: "6px", fontWeight: "600" }}>{item.label}</div>
                      <div style={{ fontSize: "40px", fontWeight: "700", color: item.dark, lineHeight: 1 }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="section-card">
                <div className="section-header">
                  <h2 className="section-title"><TrendingUp size={20} /> Platform Summary</h2>
                  {stats.incompleteUsers > 0 && (
                    <button className="btn btn-secondary btn-sm" onClick={handleSendProfileReminders} disabled={sendingReminders}>
                      {sendingReminders
                        ? <><Loader2 size={13} className="animate-spin" /> Sending...</>
                        : <><Mail size={13} /> Remind {stats.incompleteUsers} incomplete users</>}
                    </button>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                  {[
                    { label: "Live Jobs",               value: stats.liveJobs,            bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d" },
                    { label: "Pending Recruiter Verif", value: stats.pendingRecruiters,   bg: stats.pendingRecruiters > 0 ? "#fef2f2" : "#f8fafc", border: stats.pendingRecruiters > 0 ? "#fca5a5" : "#e2e8f0", text: stats.pendingRecruiters > 0 ? "#dc2626" : "#64748b" },
                    { label: "Approved Businesses",     value: stats.approvedBusinesses,  bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d" },
                    { label: "Pending Businesses",      value: stats.pendingBusinesses,   bg: stats.pendingBusinesses > 0 ? "#fffbeb" : "#f8fafc", border: stats.pendingBusinesses > 0 ? "#fcd34d" : "#e2e8f0", text: stats.pendingBusinesses > 0 ? "#d97706" : "#64748b" },
                    { label: "Incomplete Profiles",     value: stats.incompleteUsers ?? 0, bg: "#fef2f2", border: "#fecaca", text: "#dc2626" },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: "20px", background: item.bg, borderRadius: "12px", border: `1px solid ${item.border}` }}>
                      <div style={{ fontSize: "12px", color: item.text, marginBottom: "4px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>{item.label}</div>
                      <div style={{ fontSize: "36px", fontWeight: "700", color: item.text, lineHeight: 1 }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════
              ── Recruiter Verification Tab ──
          ══════════════════════════════════════════ */}
          {activeTab === "recruiters" && (
            <div className="section-card">
              <div className="section-header">
                <h2 className="section-title">
                  <ShieldCheck size={20} />
                  Recruiter Verification Requests ({filteredRecruiters.length})
                </h2>
                <div className="search-box">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search recruiters..."
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: "8px", padding: "12px 16px", marginBottom: "20px", fontSize: "13px", color: "#1e40af" }}>
                <strong>New flow:</strong> Recruiters submit their profile for verification. Once you approve, they can post jobs <strong>immediately</strong> with no per-job approval needed.
              </div>

              {filteredRecruiters.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><ShieldCheck size={28} color="#cbd5e1" /></div>
                  <div className="empty-title">No pending verifications</div>
                  <div className="empty-desc">Recruiter verification requests will appear here</div>
                </div>
              ) : (
                filteredRecruiters.map((rec) => {
                  const p = rec.recruiterProfile || {};
                  const isActing = verifyingId === rec._id;
                  return (
                    <div key={rec._id} className="rec-card">
                      <div className="rec-card-header">
                        <div>
                          <div className="rec-name">{rec.name}</div>
                          <div className="rec-email">{rec.email}</div>
                        </div>
                        <span style={{ background: "#fef3c7", color: "#92400e", padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <Clock size={12} /> Pending Review
                        </span>
                      </div>
                      <div className="rec-meta">
                        {p.companyName && (
                          <div className="rec-meta-item">
                            <span className="rec-meta-label">Company</span>
                            <span className="rec-meta-value">{p.companyName}</span>
                          </div>
                        )}
                        {p.industryType && (
                          <div className="rec-meta-item">
                            <span className="rec-meta-label">Industry</span>
                            <span className="rec-meta-value">{p.industryType}</span>
                          </div>
                        )}
                        {p.companyLocation && (
                          <div className="rec-meta-item">
                            <span className="rec-meta-label">Location</span>
                            <span className="rec-meta-value">{p.companyLocation}</span>
                          </div>
                        )}
                        {p.contactNumber && (
                          <div className="rec-meta-item">
                            <span className="rec-meta-label">Contact</span>
                            <span className="rec-meta-value">{p.contactNumber}</span>
                          </div>
                        )}
                        {p.companyWebsite && (
                          <div className="rec-meta-item">
                            <span className="rec-meta-label">Website</span>
                            <span className="rec-meta-value">{p.companyWebsite}</span>
                          </div>
                        )}
                        <div className="rec-meta-item">
                          <span className="rec-meta-label">Requested</span>
                          <span className="rec-meta-value">
                            {rec.verificationRequestedAt
                              ? new Date(rec.verificationRequestedAt).toLocaleDateString()
                              : "—"}
                          </span>
                        </div>
                      </div>
                      <div className="rec-actions">
                        <button className="btn btn-danger btn-sm" disabled={isActing} onClick={() => handleRejectRecruiter(rec._id, rec.name)}>
                          {isActing ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                          Reject
                        </button>
                        <button className="btn btn-success btn-sm" disabled={isActing} onClick={() => handleVerifyRecruiter(rec._id, rec.name)}>
                          {isActing ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                          Approve & Verify
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════
              ── Users Tab ──
          ══════════════════════════════════════════ */}
          {activeTab === "users" && (
            <div className="section-card">
              <div className="section-header">
                <h2 className="section-title"><Users size={20} /> All Users ({filteredUsers.length})</h2>
                <div className="search-box">
                  <Search size={16} className="search-icon" />
                  <input type="text" placeholder="Search users..." className="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
                {[
                  { key: "all",       label: `All (${stats.totalUsers})`,         bg: "#f1f5f9", active: "#0f172a" },
                  { key: "jobseeker", label: `Job Seekers (${stats.jobseekers})`, bg: "#dbeafe", active: "#1e40af" },
                  { key: "recruiter", label: `Recruiters (${stats.recruiters})`,  bg: "#fef3c7", active: "#92400e" },
                  { key: "business",  label: `Businesses (${stats.businesses})`,  bg: "#d1fae5", active: "#065f46" },
                ].map((f) => (
                  <button key={f.key} onClick={() => setRoleFilter(f.key)} style={{ padding: "6px 14px", borderRadius: "20px", border: "none", fontSize: "13px", fontWeight: "600", cursor: "pointer", background: roleFilter === f.key ? f.bg : "#f8fafc", color: roleFilter === f.key ? f.active : "#64748b", outline: roleFilter === f.key ? `2px solid ${f.active}` : "none", transition: "all 0.15s" }}>
                    {f.label}
                  </button>
                ))}
              </div>
              {filteredUsers.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><Users size={28} color="#cbd5e1" /></div>
                  <div className="empty-title">No users found</div>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>User</th><th>Role</th><th>Profile</th><th>Verification</th><th>Joined</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.slice(0, 50).map((u) => (
                        <tr key={u._id}>
                          <td>
                            <div className="user-info">
                              <div className="user-avatar">{u.name?.charAt(0).toUpperCase()}</div>
                              <div>
                                <div className="user-name">{u.name}</div>
                                <div className="user-email">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>{getRoleBadge(u.role)}</td>
                          <td>
                            {u.profileCompleted
                              ? <span style={{ color: "#10b981", display: "flex", alignItems: "center", gap: "4px" }}><CheckCircle size={14} /> Complete</span>
                              : <span style={{ color: "#f59e0b", display: "flex", alignItems: "center", gap: "4px" }}><Clock size={14} /> Incomplete</span>}
                          </td>
                          <td>
                            {u.role === "recruiter"
                              ? getStatusBadge(u.recruiterProfile?.verificationStatus || "pending")
                              : <span style={{ color: "#94a3b8", fontSize: "13px" }}>N/A</span>}
                          </td>
                          <td style={{ color: "#64748b", fontSize: "13px" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td>
                            <button className="btn btn-secondary btn-sm" onClick={() => toast("User details coming soon")}>
                              <Eye size={14} /> View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════
              ── Jobs Tab ──
          ══════════════════════════════════════════ */}
          {activeTab === "jobs" && (
            <div className="section-card">
              <div className="section-header">
                <h2 className="section-title"><Briefcase size={20} /> All Jobs ({filteredJobs.length})</h2>
                <div className="search-box">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search jobs…"
                    className="search-input"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Status filter pills — currently visual only; wire up jobStatusFilter state if needed */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                {[
                  { key: "all",              label: "All" },
                  { key: "approved",         label: "Live" },
                  { key: "revoked",          label: "Revoked" },
                  { key: "taken_down",       label: "Taken Down" },
                  { key: "pending_business", label: "Pending" },
                ].map(f => (
                  <button
                    key={f.key}
                    style={{
                      padding: "5px 14px", borderRadius: 100, border: "none",
                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                      background: "#f1f5f9", color: "#64748b",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {filteredJobs.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><Briefcase size={28} color="#cbd5e1" /></div>
                  <div className="empty-title">No jobs found</div>
                </div>
              ) : (
                filteredJobs.map(job => {
                  const isRevoked   = job.status === "revoked";
                  const isTakenDown = job.status === "taken_down";
                  const isRevoking  = revokingJobId  === job._id;
                  const isRestoring = restoringJobId === job._id;

                  const statusColors = {
                    approved:          { bg: "#d1fae5", color: "#065f46", label: "Live" },
                    revoked:           { bg: "#fee2e2", color: "#991b1b", label: "Revoked" },
                    taken_down:        { bg: "#fef3c7", color: "#92400e", label: "Taken Down" },
                    pending_business:  { bg: "#dbeafe", color: "#1e40af", label: "Pending" },
                    rejected_business: { bg: "#fee2e2", color: "#991b1b", label: "Rejected" },
                  };
                  const sc = statusColors[job.status] || { bg: "#f1f5f9", color: "#64748b", label: job.status };

                  return (
                    <div
                      key={job._id}
                      className="job-card"
                      style={{
                        borderLeft: isRevoked ? "3px solid #ef4444" : isTakenDown ? "3px solid #f59e0b" : undefined,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                            <div className="job-title" style={{ margin: 0 }}>{job.title}</div>
                            <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color }}>
                              {sc.label}
                            </span>
                            {job.revokedByAdmin && (
                              <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700, background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca" }}>
                                🛡 Admin Action
                              </span>
                            )}
                          </div>
                          <div className="job-meta">
                            {job.company  && <div className="job-meta-item"><Building2 size={14} />{job.company}</div>}
                            {job.location && <div className="job-meta-item"><MapPin size={14} />{job.location}</div>}
                            {job.type     && <div className="job-meta-item"><Briefcase size={14} />{job.type}</div>}
                            {job.salary   && <div className="job-meta-item">💰 {job.salary}</div>}
                            <div className="job-meta-item"><Calendar size={14} />{new Date(job.createdAt).toLocaleDateString()}</div>
                            {job.recruiter && <div className="job-meta-item" style={{ color: "#3b82f6" }}>👤 {job.recruiter.name}</div>}
                          </div>
                          {isRevoked && job.revokeReason && (
                            <div style={{ marginTop: 8, padding: "8px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, fontSize: 12, color: "#991b1b" }}>
                              <strong>Revoke reason:</strong> {job.revokeReason}
                            </div>
                          )}
                        </div>

                        <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", alignItems: "center" }}>
                          {/* Revoke — only for live / non-revoked jobs */}
                          {!isRevoked && job.status !== "taken_down" && (
                            <button
                              className="btn btn-danger btn-sm"
                              disabled={isRevoking}
                              onClick={() => handleAdminRevokeJob(job._id, job.title)}
                              title="Revoke this job"
                              style={{ display: "flex", alignItems: "center", gap: 6 }}
                            >
                              {isRevoking
                                ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                                : <ShieldOff size={13} />}
                              {isRevoking ? "Revoking…" : "Revoke"}
                            </button>
                          )}

                          {/* Restore — only for revoked jobs */}
                          {isRevoked && (
                            <button
                              className="btn btn-success btn-sm"
                              disabled={isRestoring}
                              onClick={() => handleAdminRestoreJob(job._id, job.title)}
                              title="Restore this job back to live"
                              style={{ display: "flex", alignItems: "center", gap: 6 }}
                            >
                              {isRestoring
                                ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                                : <ShieldCheck size={13} />}
                              {isRestoring ? "Restoring…" : "Restore to Live"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════
              ── Businesses Tab ──
          ══════════════════════════════════════════ */}
          {activeTab === "businesses" && (
            <div className="section-card">
              <div className="section-header">
                <h2 className="section-title"><Building size={20} /> All Businesses ({filteredBusinesses.length})</h2>
                <div className="search-box">
                  <Search size={16} className="search-icon" />
                  <input type="text" placeholder="Search businesses..." className="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
              {filteredBusinesses.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><Building size={28} color="#cbd5e1" /></div>
                  <div className="empty-title">No businesses found</div>
                </div>
              ) : (
                filteredBusinesses.map((biz) => {
                  const status  = biz.businessProfile?.status || "pending";
                  const bizName = biz.businessProfile?.businessName || biz.name;
                  const isRevoking = revokingId === biz._id;
                  return (
                    <div key={biz._id} className={`business-card ${status}`}>
                      <div className="business-header">
                        <div>
                          <div className="business-name">{bizName}</div>
                          <div className="business-category">{biz.businessProfile?.category || "Uncategorized"}</div>
                        </div>
                        <div className="business-actions">
                          {getStatusBadge(status)}
                          {status === "approved" && (
                            <button className="btn btn-danger btn-sm" disabled={isRevoking} onClick={() => handleRevokeBusiness(biz._id, bizName)}>
                              {isRevoking ? <Loader2 size={14} className="animate-spin" /> : <ShieldOff size={14} />}
                              {isRevoking ? "Revoking..." : "Revoke"}
                            </button>
                          )}
                        </div>
                      </div>
                      {biz.businessProfile?.address && (
                        <div style={{ fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                          <MapPin size={14} />{biz.businessProfile.address}
                        </div>
                      )}
                      {biz.businessProfile?.contactDetails && (
                        <div style={{ fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                          <Mail size={14} />{biz.businessProfile.contactDetails}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════
              ── Ad Manager Tab ──
          ══════════════════════════════════════════ */}
          {activeTab === "ads" && (
            <div className="section-card">
              <AdminAdsManager token={token} />
            </div>
          )}

        </div>
      </div>

      {/* ── Add Admin Modal ── */}
      {showAddAdmin && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeAddAdminModal()}>
          <div className="modal-box">
            <button className="modal-close" onClick={closeAddAdminModal} disabled={addingAdmin}>
              <X size={18} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <UserPlus size={20} color="#10b981" />
              <h2 className="modal-title">Add New Admin</h2>
            </div>
            <p className="modal-desc">
              The account will be created immediately with full admin access.
              The new admin can sign in straight away using OTP — no password needed.
            </p>

            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "10px 14px", marginBottom: "20px", fontSize: "13px", color: "#15803d" }}>
              <strong>Note:</strong> Only add people you fully trust. Admin accounts have unrestricted platform access.
            </div>

            <form onSubmit={handleAddAdmin}>
              <div className="modal-field">
                <label className="modal-label">Full Name *</label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="Jane Smith"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin((p) => ({ ...p, name: e.target.value }))}
                  disabled={addingAdmin}
                  autoFocus
                />
              </div>
              <div className="modal-field">
                <label className="modal-label">Email Address *</label>
                <input
                  type="email"
                  className="modal-input"
                  placeholder="jane@example.com"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin((p) => ({ ...p, email: e.target.value }))}
                  disabled={addingAdmin}
                />
              </div>
              <div className="modal-field">
                <label className="modal-label">Phone Number <span style={{ color: "#94a3b8", fontWeight: 400, textTransform: "none" }}>(optional)</span></label>
                <input
                  type="tel"
                  className="modal-input"
                  placeholder="+91 98765 43210"
                  value={newAdmin.phone}
                  onChange={(e) => setNewAdmin((p) => ({ ...p, phone: e.target.value }))}
                  disabled={addingAdmin}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeAddAdminModal} disabled={addingAdmin}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success" disabled={addingAdmin}>
                  {addingAdmin
                    ? <><Loader2 size={14} className="animate-spin" /> Creating...</>
                    : <><UserCheck size={14} /> Create Admin</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;