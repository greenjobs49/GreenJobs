import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Briefcase,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  ExternalLink,
  FileText,
  MapPin,
  AlertCircle,
  Star,
  Trophy,
  ArrowRight,
  Send,
  RefreshCw,
  Layers,
  CalendarClock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import API_BASE_URL from "../config/api";

const ROUND_TYPE_LABELS = {
  resume_screening:    "Resume Screening",
  online_test:         "Online Test",
  aptitude_test:       "Aptitude Test",
  technical_interview: "Technical Interview",
  hr_interview:        "HR Interview",
  group_discussion:    "Group Discussion",
  assignment:          "Assignment",
  final_interview:     "Final Interview",
  offer:               "Offer / Selection",
  other:               "Other",
};

const ROUND_ICONS = {
  resume_screening:    "📄",
  online_test:         "💻",
  aptitude_test:       "🧠",
  technical_interview: "⚙️",
  hr_interview:        "🤝",
  group_discussion:    "💬",
  assignment:          "📝",
  final_interview:     "🎯",
  offer:               "🏆",
  other:               "➕",
};

const RESULT_CONFIG = {
  scheduled: { label: "Scheduled",    color: "#1e40af", bg: "#dbeafe" },
  pending:   { label: "Pending",      color: "#92400e", bg: "#fef3c7" },
  passed:    { label: "Passed ✓",     color: "#065f46", bg: "#d1fae5" },
  failed:    { label: "Not Selected", color: "#991b1b", bg: "#fee2e2" },
};

/* ─────────────────────────────────────────────────────────
   Derive status config dynamically from actual app data
   so messaging always reflects the real current state
───────────────────────────────────────────────────────── */
function deriveStatusConfig(app) {
  const rounds             = app.job?.rounds || [];
  const roundUpdates       = app.roundUpdates || [];
  const current            = app.currentRound || 1;
  const currentRoundData   = rounds[current - 1];
  const currentRoundUpdate = roundUpdates.find(u => u.roundNumber === current);
  const roundName          = currentRoundData?.title
    || ROUND_TYPE_LABELS[currentRoundData?.type]
    || `Round ${current}`;

  switch (app.status) {
    case "applied":
      return {
        label: "Applied", color: "#1e40af", bg: "#dbeafe", border: "#93c5fd",
        icon: Send,
        headline: "Application submitted",
        description: "Your application is with the recruiter. Hang tight!",
      };
    case "under_review":
      return {
        label: "Under Review", color: "#92400e", bg: "#fef3c7", border: "#fde047",
        icon: Clock,
        headline: "Recruiter is reviewing your profile",
        description: "Your application is being actively reviewed. You'll hear back soon.",
      };

    case "shortlisted":
    case "round_update": {
      const result = currentRoundUpdate?.result;

      if (!result || result === "scheduled" || result === "pending") {
        return {
          label: current === 1 ? "Shortlisted 🎉" : `Round ${current} Scheduled`,
          color: "#1e40af", bg: "#dbeafe", border: "#93c5fd",
          icon: CalendarClock,
          headline: `Round ${current} of ${rounds.length}: ${roundName} — Scheduled`,
          description: `You've been selected to appear for ${roundName}. Prepare well and wait for further instructions from the recruiter.`,
        };
      }
      if (result === "passed") {
        const nextRound = rounds[current];
        const nextName  = nextRound?.title || ROUND_TYPE_LABELS[nextRound?.type] || `Round ${current + 1}`;
        return {
          label: `Round ${current} Passed ✓`,
          color: "#065f46", bg: "#d1fae5", border: "#6ee7b7",
          icon: CheckCircle,
          headline: `You passed Round ${current}: ${roundName}!`,
          description: nextRound
            ? `Great job! You're advancing to Round ${current + 1}: ${nextName}. Prepare for the next stage.`
            : "You've passed all rounds. Awaiting the recruiter's final decision.",
        };
      }
      return {
        label: "In Progress",
        color: "#065f46", bg: "#d1fae5", border: "#6ee7b7",
        icon: ArrowRight,
        headline: `Round ${current} of ${rounds.length}: ${roundName}`,
        description: "You're progressing through the hiring rounds.",
      };
    }

    case "rejected":
      return {
        label: "Not Selected", color: "#991b1b", bg: "#fee2e2", border: "#fecaca",
        icon: XCircle,
        headline: "Application not taken forward",
        description: "Thank you for your time. We hope to connect with you again!",
      };
    case "hired":
      return {
        label: "Offer Extended! 🏆", color: "#065f46", bg: "#d1fae5", border: "#6ee7b7",
        icon: Trophy,
        headline: "Congratulations — You got the offer!",
        description: "Check your email for the offer letter and next steps from the recruiter.",
      };
    case "withdrawn":
      return {
        label: "Withdrawn", color: "#475569", bg: "#f1f5f9", border: "#e2e8f0",
        icon: XCircle,
        headline: "Application withdrawn",
        description: "You withdrew this application.",
      };
    default:
      return {
        label: "Applied", color: "#1e40af", bg: "#dbeafe", border: "#93c5fd",
        icon: Send, headline: "Application submitted", description: "",
      };
  }
}

/* ─────────────────────────────────────────────────────────
   Round Journey Banner — full step-by-step visual
───────────────────────────────────────────────────────── */
const RoundJourneyBanner = ({ app }) => {
  const rounds       = app.job?.rounds || [];
  const roundUpdates = app.roundUpdates || [];
  const current      = app.currentRound || 1;
  const isHired      = app.status === "hired";
  const passedCount  = roundUpdates.filter(r => r.result === "passed").length;

  if (!rounds.length) return null;

  const currentUpdate = roundUpdates.find(u => u.roundNumber === current);

  return (
    <div className="ma-journey">
      {/* Header */}
      <div className="ma-journey-head">
        <div className="ma-journey-head-left">
          <Layers size={14} color="#1e40af" />
          <span>{isHired ? "All rounds complete" : `Round ${current} of ${rounds.length}`}</span>
        </div>
        <div className="ma-journey-head-right">{passedCount}/{rounds.length} rounds passed</div>
      </div>

      {/* Progress bar */}
      <div className="ma-journey-track">
        <div className="ma-journey-fill" style={{ width: `${rounds.length ? (passedCount / rounds.length) * 100 : 0}%` }} />
      </div>

      {/* Steps */}
      <div className="ma-journey-steps">
        {rounds.map((r, i) => {
          const rNum   = i + 1;
          const upd    = roundUpdates.find(u => u.roundNumber === rNum);
          const result = upd?.result;
          const isCurr = current === rNum && !isHired;
          const isPast = rNum < current || isHired;
          const name   = r.title || ROUND_TYPE_LABELS[r.type] || r.type;

          const state =
            result === "passed"    ? "passed"    :
            result === "failed"    ? "failed"    :
            isCurr                 ? "current"   :
            result === "scheduled" ? "scheduled" :
            isPast                 ? "passed"    : "upcoming";

          const styles = {
            passed:    { bg:"#d1fae5", border:"#10b981", numColor:"#065f46" },
            failed:    { bg:"#fee2e2", border:"#ef4444", numColor:"#991b1b" },
            current:   { bg:"#fef3c7", border:"#f59e0b", numColor:"#92400e", glow:"0 0 0 3px #fde04766" },
            scheduled: { bg:"#dbeafe", border:"#3b82f6", numColor:"#1e40af" },
            upcoming:  { bg:"#f1f5f9", border:"#cbd5e1", numColor:"#94a3b8" },
          }[state];

          const tagConfig = {
            passed:    { label:"✓ Passed",      bg:"#d1fae5", color:"#065f46", border:"#6ee7b7" },
            failed:    { label:"✗ Not selected", bg:"#fee2e2", color:"#991b1b", border:"#fecaca" },
            current:   { label:"← You are here", bg:"#fef3c7", color:"#92400e", border:"#fde047" },
            scheduled: { label:"Scheduled",      bg:"#dbeafe", color:"#1e40af", border:"#93c5fd" },
            upcoming:  { label:"Upcoming",       bg:"#f1f5f9", color:"#94a3b8", border:"#e2e8f0" },
          }[state];

          return (
            <div key={i} className="ma-step">
              {i > 0 && (
                <div
                  className="ma-step-line"
                  style={{ background: (state === "passed" || (isPast && state !== "failed")) ? "#10b981" : "#e2e8f0" }}
                />
              )}
              <div className="ma-step-col">
                <div
                  className="ma-step-dot"
                  style={{ background:styles.bg, borderColor:styles.border, boxShadow: styles.glow || "none" }}
                >
                  {state === "passed" ? <CheckCircle size={13} color="#10b981" /> :
                   state === "failed" ? <XCircle     size={13} color="#ef4444" /> :
                   <span style={{ fontSize:13 }}>{ROUND_ICONS[r.type] || rNum}</span>}
                </div>
                <div className="ma-step-info">
                  <div className="ma-step-num" style={{ color:styles.numColor }}>Round {rNum}</div>
                  <div className="ma-step-name">{name}</div>
                  <div className="ma-step-tag" style={{ background:tagConfig.bg, color:tagConfig.color, borderColor:tagConfig.border }}>
                    {tagConfig.label}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recruiter note for current round */}
      {currentUpdate?.note && (
        <div className="ma-journey-note">
          <AlertCircle size={12} style={{ flexShrink:0, marginTop:1 }} />
          <span>{currentUpdate.note}</span>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────── */
const MyApplications = () => {
  const { token } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [expandedApp, setExpandedApp]   = useState(null);
  const [withdrawing, setWithdrawing]   = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchApplications = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/applications/my`, {
  headers: { Authorization: `Bearer ${token}` },
});
      setApplications(res.data.applications || []);
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const handleWithdraw = async (applicationId, jobTitle) => {
    if (!window.confirm(`Withdraw your application for "${jobTitle}"? This cannot be undone.`)) return;
    try {
      setWithdrawing(applicationId);
      await axios.patch(
  `${API_BASE_URL}/api/applications/${applicationId}/withdraw`,
  {},
  { headers: { Authorization: `Bearer ${token}` } }
);
      toast.success("Application withdrawn");
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to withdraw");
    } finally {
      setWithdrawing(null);
    }
  };

  const filtered = filterStatus === "all"
    ? applications
    : applications.filter(a => a.status === filterStatus);

  const counts = applications.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  const statusFilters = [
    { key:"all",          label:"All",         count: applications.length },
    { key:"applied",      label:"Applied",     count: counts.applied      || 0 },
    { key:"under_review", label:"In Review",   count: counts.under_review || 0 },
    { key:"shortlisted",  label:"Shortlisted", count: counts.shortlisted  || 0 },
    { key:"round_update", label:"In Rounds",   count: counts.round_update || 0 },
    { key:"hired",        label:"Hired",       count: counts.hired        || 0 },
    { key:"rejected",     label:"Rejected",    count: counts.rejected     || 0 },
  ].filter(f => f.key === "all" || f.count > 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .ma-root { font-family:'Inter',sans-serif; }

        .ma-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
        .ma-title  { font-size:20px; font-weight:700; color:#0f172a; }
        .ma-subtitle { font-size:13px; color:#64748b; margin-top:2px; }
        .ma-refresh { background:none; border:1px solid #e2e8f0; border-radius:6px; padding:6px; cursor:pointer; display:flex; transition:background 0.15s; }
        .ma-refresh:hover { background:#f8fafc; }

        .ma-stats { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:20px; }
        .ma-stat { padding:10px 16px; background:white; border:1px solid #e2e8f0; border-radius:8px; text-align:center; min-width:72px; }
        .ma-stat-value { font-size:20px; font-weight:700; color:#0f172a; }
        .ma-stat-label { font-size:11px; color:#64748b; margin-top:2px; font-weight:500; }

        .ma-filters { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:20px; }
        .ma-filter-btn { padding:6px 14px; border-radius:100px; font-size:12px; font-weight:600; cursor:pointer; border:1px solid #e2e8f0; background:white; color:#64748b; font-family:'Inter',sans-serif; transition:all 0.15s; }
        .ma-filter-btn.active { background:#0f172a; color:white; border-color:#0f172a; }
        .ma-filter-btn:hover:not(.active) { background:#f8fafc; }

        /* Card */
        .ma-card { background:white; border:1px solid #e2e8f0; border-radius:12px; margin-bottom:14px; overflow:hidden; transition:box-shadow 0.2s; }
        .ma-card:hover { box-shadow:0 2px 10px rgba(0,0,0,0.06); }
        .ma-card.applied      { border-left:4px solid #3b82f6; }
        .ma-card.under_review { border-left:4px solid #f59e0b; }
        .ma-card.shortlisted  { border-left:4px solid #10b981; }
        .ma-card.round_update { border-left:4px solid #3b82f6; }
        .ma-card.hired        { border-left:4px solid #10b981; background:#fafffe; }
        .ma-card.rejected     { border-left:4px solid #ef4444; }
        .ma-card.withdrawn    { border-left:4px solid #cbd5e1; }

        .ma-card-header { padding:18px 20px; cursor:pointer; }
        .ma-card-top { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:10px; }
        .ma-job-title { font-size:16px; font-weight:700; color:#0f172a; margin-bottom:4px; }
        .ma-company   { font-size:13px; color:#64748b; display:flex; align-items:center; gap:5px; flex-wrap:wrap; }
        .ma-status-badge { display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:100px; font-size:12px; font-weight:700; border:1px solid; flex-shrink:0; white-space:nowrap; }

        .ma-card-meta { display:flex; gap:14px; flex-wrap:wrap; margin-bottom:8px; }
        .ma-meta-item { display:flex; align-items:center; gap:5px; font-size:12px; color:#64748b; }

        /* "What's happening now" pill */
        .ma-now-pill { display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:8px; font-size:12px; font-weight:600; border:1px solid; margin-top:6px; line-height:1.4; }

        /* Mini dot track */
        .ma-mini-track { display:flex; align-items:center; margin-top:10px; }
        .ma-mini-dot { width:26px; height:26px; border-radius:50%; border:2px solid #e2e8f0; display:flex; align-items:center; justify-content:center; font-size:11px; flex-shrink:0; background:white; position:relative; z-index:1; }
        .ma-mini-dot.passed    { border-color:#10b981; background:#d1fae5; color:#065f46; }
        .ma-mini-dot.failed    { border-color:#ef4444; background:#fee2e2; color:#991b1b; }
        .ma-mini-dot.current   { border-color:#f59e0b; background:#fef3c7; box-shadow:0 0 0 3px #fde04766; }
        .ma-mini-dot.scheduled { border-color:#3b82f6; background:#dbeafe; }
        .ma-mini-dot.upcoming  { border-color:#e2e8f0; background:#f8fafc; opacity:0.55; }
        .ma-mini-line { flex:1; height:2px; background:#e2e8f0; min-width:8px; max-width:32px; }
        .ma-mini-line.done { background:#10b981; }
        .ma-mini-label { font-size:11px; color:#64748b; margin-left:8px; white-space:nowrap; }

        /* Skills */
        .ma-skills { display:flex; flex-wrap:wrap; gap:5px; margin-top:8px; }
        .ma-skill-tag { padding:2px 9px; background:#eff6ff; border:1px solid #bfdbfe; border-radius:100px; font-size:11px; font-weight:600; color:#1e40af; }

        /* Expanded */
        .ma-card-body { border-top:1px solid #f1f5f9; padding:20px; background:#fafafa; }
        .ma-body-section { margin-bottom:20px; }
        .ma-body-section:last-child { margin-bottom:0; }
        .ma-body-label { font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:10px; }

        /* Status box */
        .ma-status-box { display:flex; align-items:flex-start; gap:12px; padding:14px 16px; border-radius:10px; border:1px solid; margin-bottom:16px; }
        .ma-status-box-icon { flex-shrink:0; margin-top:1px; }
        .ma-status-box-headline { font-size:14px; font-weight:700; margin-bottom:3px; }
        .ma-status-box-desc { font-size:13px; opacity:0.85; line-height:1.5; }

        /* Journey banner */
        .ma-journey { background:white; border:1px solid #e2e8f0; border-radius:10px; padding:16px; margin-bottom:16px; }
        .ma-journey-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
        .ma-journey-head-left { display:flex; align-items:center; gap:6px; font-size:13px; font-weight:700; color:#0f172a; }
        .ma-journey-head-right { font-size:12px; color:#64748b; font-weight:600; }
        .ma-journey-track { height:5px; background:#e2e8f0; border-radius:3px; overflow:hidden; margin-bottom:18px; }
        .ma-journey-fill  { height:100%; background:linear-gradient(90deg,#10b981,#059669); border-radius:3px; transition:width 0.5s ease; }

        .ma-journey-steps { display:flex; align-items:flex-start; }
        .ma-step { display:flex; align-items:flex-start; flex:1; position:relative; }
        .ma-step-line { position:absolute; top:14px; left:calc(-50% + 15px); right:calc(50% + 15px); height:2px; z-index:0; }
        .ma-step-col  { display:flex; flex-direction:column; align-items:center; gap:6px; width:100%; }
        .ma-step-dot  { width:30px; height:30px; border-radius:50%; border:2px solid #e2e8f0; display:flex; align-items:center; justify-content:center; background:white; z-index:1; position:relative; flex-shrink:0; transition:all 0.2s; }
        .ma-step-info { text-align:center; padding:0 3px; }
        .ma-step-num  { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.4px; }
        .ma-step-name { font-size:11px; color:#475569; font-weight:500; margin-top:1px; line-height:1.3; }
        .ma-step-tag  { display:inline-block; margin-top:4px; padding:1px 7px; border-radius:100px; font-size:10px; font-weight:700; border:1px solid; }

        .ma-journey-note { display:flex; align-items:flex-start; gap:7px; margin-top:14px; padding:10px 12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:7px; font-size:12px; color:#475569; line-height:1.5; }

        /* Round timeline */
        .ma-rounds { display:flex; flex-direction:column; }
        .ma-round-item { display:flex; gap:12px; position:relative; }
        .ma-round-item:not(:last-child)::before { content:''; position:absolute; left:15px; top:38px; width:2px; bottom:-4px; background:#e2e8f0; }
        .ma-round-circle { width:32px; height:32px; border-radius:50%; border:2px solid #e2e8f0; background:white; display:flex; align-items:center; justify-content:center; font-size:13px; position:relative; z-index:1; flex-shrink:0; }
        .ma-round-circle.passed    { border-color:#10b981; background:#d1fae5; }
        .ma-round-circle.failed    { border-color:#ef4444; background:#fee2e2; }
        .ma-round-circle.scheduled { border-color:#3b82f6; background:#dbeafe; }
        .ma-round-circle.pending   { border-color:#f59e0b; background:#fef3c7; }
        .ma-round-body  { flex:1; padding-bottom:16px; padding-top:4px; }
        .ma-round-title { font-size:14px; font-weight:600; color:#0f172a; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .ma-round-result { display:inline-flex; padding:2px 8px; border-radius:100px; font-size:11px; font-weight:600; }
        .ma-round-note  { font-size:12px; color:#64748b; margin-top:4px; line-height:1.5; }
        .ma-round-date  { font-size:11px; color:#94a3b8; margin-top:4px; }

        .ma-cover-letter { padding:14px; background:white; border:1px solid #e2e8f0; border-radius:8px; font-size:13px; color:#475569; line-height:1.7; white-space:pre-wrap; max-height:160px; overflow-y:auto; }

        .ma-snapshot { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        .ma-snapshot-item { padding:8px 12px; background:white; border:1px solid #e2e8f0; border-radius:6px; }
        .ma-snapshot-label { font-size:10px; color:#94a3b8; font-weight:600; text-transform:uppercase; }
        .ma-snapshot-value { font-size:13px; color:#0f172a; font-weight:500; margin-top:2px; }

        /* Offer banner */
        .ma-offer-banner { display:flex; align-items:center; gap:14px; padding:16px 20px; background:linear-gradient(135deg,#064e3b,#065f46); border-radius:10px; color:white; margin-bottom:16px; }
        .ma-offer-icon  { width:44px; height:44px; background:rgba(255,255,255,0.15); border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .ma-offer-title { font-size:15px; font-weight:700; margin-bottom:3px; }
        .ma-offer-sub   { font-size:12px; opacity:0.8; }

        .ma-card-actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:16px; }
        .ma-btn { display:inline-flex; align-items:center; gap:6px; padding:7px 14px; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer; border:1px solid; transition:all 0.2s; font-family:'Inter',sans-serif; }
        .ma-btn-outline { background:white; color:#475569; border-color:#e2e8f0; }
        .ma-btn-outline:hover { background:#f8fafc; }
        .ma-btn-danger  { background:white; color:#dc2626; border-color:#fecaca; }
        .ma-btn-danger:hover { background:#fef2f2; }
        .ma-btn:disabled { opacity:0.5; cursor:not-allowed; }

        .ma-empty { text-align:center; padding:60px 24px; }
        .ma-empty-icon { width:56px; height:56px; background:#f1f5f9; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; }
        .ma-empty-title { font-size:16px; font-weight:600; color:#0f172a; margin-bottom:4px; }
        .ma-empty-desc  { font-size:13px; color:#64748b; }

        .ma-spinner { animation:spin 1s linear infinite; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

        @media (max-width:600px) {
          .ma-snapshot { grid-template-columns:1fr; }
          .ma-card-top { flex-direction:column; }
          .ma-step-name { font-size:10px; }
          .ma-step-tag  { font-size:9px; padding:1px 5px; }
        }
      `}</style>

      <div className="ma-root">

        {/* Header */}
        <div className="ma-header">
          <div>
            <div className="ma-title">My Applications ({applications.length})</div>
            <div className="ma-subtitle">Track the status of every job you've applied to</div>
          </div>
          <button className="ma-refresh" onClick={fetchApplications} title="Refresh">
            <RefreshCw size={16} color="#64748b" />
          </button>
        </div>

        {/* Stats */}
        {applications.length > 0 && (
          <div className="ma-stats">
            <div className="ma-stat">
              <div className="ma-stat-value">{applications.length}</div>
              <div className="ma-stat-label">Total</div>
            </div>
            {counts.shortlisted > 0 && (
              <div className="ma-stat" style={{ borderColor:"#6ee7b7" }}>
                <div className="ma-stat-value" style={{ color:"#065f46" }}>{counts.shortlisted}</div>
                <div className="ma-stat-label">Shortlisted</div>
              </div>
            )}
            {counts.round_update > 0 && (
              <div className="ma-stat" style={{ borderColor:"#93c5fd" }}>
                <div className="ma-stat-value" style={{ color:"#1e40af" }}>{counts.round_update}</div>
                <div className="ma-stat-label">In Rounds</div>
              </div>
            )}
            {counts.hired > 0 && (
              <div className="ma-stat" style={{ borderColor:"#6ee7b7", background:"#f0fdf4" }}>
                <div className="ma-stat-value" style={{ color:"#065f46" }}>{counts.hired}</div>
                <div className="ma-stat-label">Hired 🏆</div>
              </div>
            )}
            {counts.under_review > 0 && (
              <div className="ma-stat">
                <div className="ma-stat-value" style={{ color:"#92400e" }}>{counts.under_review}</div>
                <div className="ma-stat-label">In Review</div>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        {applications.length > 0 && (
          <div className="ma-filters">
            {statusFilters.map(f => (
              <button
                key={f.key}
                className={`ma-filter-btn ${filterStatus === f.key ? "active" : ""}`}
                onClick={() => setFilterStatus(f.key)}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div style={{ textAlign:"center", padding:"48px", color:"#64748b" }}>
            <Loader2 size={28} className="ma-spinner" style={{ margin:"0 auto 12px", display:"block" }} />
            Loading applications…
          </div>
        ) : filtered.length === 0 ? (
          <div className="ma-empty">
            <div className="ma-empty-icon"><Briefcase size={24} color="#cbd5e1" /></div>
            <div className="ma-empty-title">
              {applications.length === 0 ? "No applications yet" : "No applications match this filter"}
            </div>
            <div className="ma-empty-desc">
              {applications.length === 0 ? "Browse open jobs and start applying today!" : "Try a different filter"}
            </div>
          </div>
        ) : (
          filtered.map(app => {
            const cfg        = deriveStatusConfig(app);
            const StatusIcon = cfg.icon;
            const isExpanded = expandedApp === app._id;
            const job        = app.job;
            const rounds     = job?.rounds || [];
            const roundUpdates = app.roundUpdates || [];
            const canWithdraw  = !["rejected", "hired", "withdrawn"].includes(app.status);
            const isInRounds   = ["shortlisted", "round_update", "hired"].includes(app.status) && rounds.length > 0;
            const current      = app.currentRound || 1;
            const passedCount  = roundUpdates.filter(r => r.result === "passed").length;
            const currentRoundData   = rounds[current - 1];
            const currentRoundUpdate = roundUpdates.find(u => u.roundNumber === current);
            const currentResult      = currentRoundUpdate?.result;

            // Colour set for the "now" pill
            const nowPillStyle = {
              passed:    { color:"#065f46", bg:"#d1fae5", border:"#6ee7b7" },
              scheduled: { color:"#1e40af", bg:"#dbeafe", border:"#93c5fd" },
              failed:    { color:"#991b1b", bg:"#fee2e2", border:"#fecaca" },
              pending:   { color:"#92400e", bg:"#fef3c7", border:"#fde047" },
            }[currentResult || "scheduled"] || { color:"#1e40af", bg:"#dbeafe", border:"#93c5fd" };

            const nowPillText =
              currentResult === "passed"    ? "Passed ✓ — advancing to next round" :
              currentResult === "scheduled" ? "Scheduled — prepare for this round" :
              currentResult === "failed"    ? "Not selected at this stage" :
              currentResult === "pending"   ? "Under evaluation" :
                                              "Awaiting update from recruiter";

            return (
              <div key={app._id} className={`ma-card ${app.status}`}>

                {/* Collapsed header */}
                <div className="ma-card-header" onClick={() => setExpandedApp(isExpanded ? null : app._id)}>
                  <div className="ma-card-top">
                    <div style={{ flex:1 }}>
                      <div className="ma-job-title">{job?.title || "Job no longer available"}</div>
                      <div className="ma-company">
                        {job?.business?.businessProfile?.businessName || job?.company || "Company"}
                        {job?.location && <><span style={{margin:"0 3px"}}>·</span><MapPin size={11} />{job.location}</>}
                        {job?.type     && <><span style={{margin:"0 3px"}}>·</span>{job.type}</>}
                      </div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div className="ma-status-badge" style={{ color:cfg.color, background:cfg.bg, borderColor:cfg.border }}>
                        <StatusIcon size={12} />{cfg.label}
                      </div>
                      {isExpanded ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="ma-card-meta">
                    <div className="ma-meta-item">
                      <Clock size={12} />
                      Applied {new Date(app.createdAt).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })}
                    </div>
                    {app.selectedSkills?.length > 0 && (
                      <div className="ma-meta-item"><Star size={12} />{app.selectedSkills.length} skills</div>
                    )}
                  </div>

                  {/* "What's happening now" — clear one-liner */}
                  {isInRounds && currentRoundData && (
                    <div className="ma-now-pill" style={{ color:nowPillStyle.color, background:nowPillStyle.bg, borderColor:nowPillStyle.border }}>
                      <span>{ROUND_ICONS[currentRoundData.type] || "●"}</span>
                      <span>
                        <strong>Round {current} of {rounds.length}: {currentRoundData.title || ROUND_TYPE_LABELS[currentRoundData.type] || currentRoundData.type}</strong>
                        &nbsp;—&nbsp;{nowPillText}
                      </span>
                    </div>
                  )}

                  {/* Mini dot track */}
                  {isInRounds && rounds.length > 1 && (
                    <div className="ma-mini-track">
                      {rounds.map((r, i) => {
                        const rNum   = i + 1;
                        const upd    = roundUpdates.find(u => u.roundNumber === rNum);
                        const res    = upd?.result;
                        const isCurr = current === rNum && app.status !== "hired";
                        const cls    = isCurr ? "current" : res || (rNum < current ? "passed" : "upcoming");
                        const lineDone = rNum < current || (rNum <= current && res === "passed");
                        return (
                          <React.Fragment key={i}>
                            {i > 0 && <div className={`ma-mini-line ${lineDone ? "done" : ""}`} />}
                            <div className={`ma-mini-dot ${cls}`} title={`Round ${rNum}: ${r.title || ROUND_TYPE_LABELS[r.type] || r.type}`}>
                              {res === "passed" ? "✓" : res === "failed" ? "✗" : ROUND_ICONS[r.type] || rNum}
                            </div>
                          </React.Fragment>
                        );
                      })}
                      <span className="ma-mini-label">{passedCount}/{rounds.length} passed</span>
                    </div>
                  )}

                  {/* Skills */}
                  {app.selectedSkills?.length > 0 && (
                    <div className="ma-skills">
                      {app.selectedSkills.slice(0, 5).map(s => <span key={s} className="ma-skill-tag">{s}</span>)}
                      {app.selectedSkills.length > 5 && <span className="ma-skill-tag">+{app.selectedSkills.length - 5} more</span>}
                    </div>
                  )}
                </div>

                {/* Expanded body */}
                {isExpanded && (
                  <div className="ma-card-body">

                    {app.status === "hired" && (
                      <div className="ma-offer-banner">
                        <div className="ma-offer-icon"><Trophy size={22} color="white" /></div>
                        <div>
                          <div className="ma-offer-title">🎉 Congratulations — Offer Extended!</div>
                          <div className="ma-offer-sub">Check your email for the offer letter and next steps.</div>
                        </div>
                      </div>
                    )}

                    {/* Dynamic status headline */}
                    <div className="ma-status-box" style={{ background:cfg.bg, borderColor:cfg.border, color:cfg.color }}>
                      <div className="ma-status-box-icon"><StatusIcon size={18} /></div>
                      <div>
                        <div className="ma-status-box-headline">{cfg.headline}</div>
                        <div className="ma-status-box-desc">
                          {cfg.description}
                          {app.rejectionReason && (
                            <span style={{ display:"block", marginTop:4, fontWeight:400 }}>
                              Reason: {app.rejectionReason}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Round Journey */}
                    {isInRounds && roundUpdates.length > 0 && <RoundJourneyBanner app={app} />}

                    {/* Round timeline */}
                    {roundUpdates.length > 0 && (
                      <div className="ma-body-section">
                        <div className="ma-body-label">Round-by-Round Updates</div>
                        <div className="ma-rounds">
                          {roundUpdates.map((ru, idx) => {
                            const rc = RESULT_CONFIG[ru.result] || RESULT_CONFIG.pending;
                            return (
                              <div key={idx} className="ma-round-item">
                                <div className={`ma-round-circle ${ru.result}`}>
                                  {ROUND_ICONS[ru.roundType] || "➕"}
                                </div>
                                <div className="ma-round-body">
                                  <div className="ma-round-title">
                                    Round {ru.roundNumber}: {ru.roundTitle || ROUND_TYPE_LABELS[ru.roundType] || ru.roundType}
                                    <span className="ma-round-result" style={{ background:rc.bg, color:rc.color }}>
                                      {rc.label}
                                    </span>
                                  </div>
                                  {ru.note && <div className="ma-round-note">💬 {ru.note}</div>}
                                  <div className="ma-round-date">
                                    {new Date(ru.updatedAt).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Cover letter */}
                    {app.coverLetter && app.coverLetter.trim() !== "" && (
                      <div className="ma-body-section">
                        <div className="ma-body-label">Your Cover Letter</div>
                        <div className="ma-cover-letter">{app.coverLetter}</div>
                      </div>
                    )}

                    {/* Snapshot */}
                    {app.applicantSnapshot && (
                      <div className="ma-body-section">
                        <div className="ma-body-label">Profile Submitted</div>
                        <div className="ma-snapshot">
                          {[
                            ["Name",       app.applicantSnapshot.fullName],
                            ["Email",      app.applicantSnapshot.email],
                            ["Mobile",     app.applicantSnapshot.mobile],
                            ["City",       app.applicantSnapshot.city],
                            ["Education",  app.applicantSnapshot.education],
                            ["Experience", app.applicantSnapshot.experience],
                          ]
                            .filter(([,v]) => v)
                            .map(([label, value]) => (
                              <div key={label} className="ma-snapshot-item">
                                <div className="ma-snapshot-label">{label}</div>
                                <div className="ma-snapshot-value">{value}</div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="ma-card-actions">
                      {app.resumeUrl && (
                        <a href={app.resumeUrl} target="_blank" rel="noreferrer" className="ma-btn ma-btn-outline" style={{ textDecoration:"none" }}>
                          <FileText size={13} /> View Resume
                        </a>
                      )}
                      {job?._id && job?.status === "approved" && (
                        <a href={`/jobs/${job._id}`} className="ma-btn ma-btn-outline" style={{ textDecoration:"none" }}>
                          <ExternalLink size={13} /> View Job
                        </a>
                      )}
                      {canWithdraw && (
                        <button
                          className="ma-btn ma-btn-danger"
                          onClick={() => handleWithdraw(app._id, job?.title)}
                          disabled={withdrawing === app._id}
                          style={{ marginLeft:"auto" }}
                        >
                          {withdrawing === app._id ? <Loader2 size={13} className="ma-spinner" /> : <XCircle size={13} />}
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
};

export default MyApplications;