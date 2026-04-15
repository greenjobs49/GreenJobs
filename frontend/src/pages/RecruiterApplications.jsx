import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Users,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  GraduationCap,
  Briefcase,
  Phone,
  Mail,
  ExternalLink,
  RefreshCw,
  ArrowRight,
  Send,
  Linkedin,
  Layers,
  Trophy,
  AlertCircle,
  Flag,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import API_BASE_URL from "../config/api";

const STATUS_COLORS = {
  applied:      { label: "New",         color: "#1e40af", bg: "#dbeafe", border: "#93c5fd" },
  under_review: { label: "Reviewing",   color: "#92400e", bg: "#fef3c7", border: "#fde047" },
  shortlisted:  { label: "Shortlisted", color: "#065f46", bg: "#d1fae5", border: "#6ee7b7" },
  round_update: { label: "In Progress", color: "#065f46", bg: "#d1fae5", border: "#6ee7b7" },
  rejected:     { label: "Rejected",    color: "#991b1b", bg: "#fee2e2", border: "#fecaca" },
  hired:        { label: "Hired ✓",     color: "#065f46", bg: "#d1fae5", border: "#6ee7b7" },
  withdrawn:    { label: "Withdrawn",   color: "#475569", bg: "#f1f5f9", border: "#e2e8f0" },
};

const ROUND_ICONS = {
  resume_screening: "📄", online_test: "💻", aptitude_test: "🧠",
  technical_interview: "⚙️", hr_interview: "🤝", group_discussion: "💬",
  assignment: "📝", final_interview: "🎯", offer: "🏆", other: "➕",
};

const ROUND_TYPE_LABELS = {
  resume_screening: "Resume Screening", online_test: "Online Test",
  aptitude_test: "Aptitude Test", technical_interview: "Technical Interview",
  hr_interview: "HR Interview", group_discussion: "Group Discussion",
  assignment: "Assignment", final_interview: "Final Interview",
  offer: "Offer / Selection", other: "Other",
};

/* ─────────────────────────────────────────────────────────────
   ApplicationCard
───────────────────────────────────────────────────────────── */
const ApplicationCard = ({
  app,
  expandedApp,
  setExpandedApp,
  actionLoading,
  handleShortlistDirect,
  handleShortlistRoundWise,
  handleNextRound,
  handleFinalShortlist,
  setRejectModal,
  setRejectReason,
  updateNotes,
}) => {
  const [localNotes, setLocalNotes]   = useState(app.internalNotes || "");
  const [localRating, setLocalRating] = useState(app.recruiterRating || 0);

  const snap         = app.applicantSnapshot || {};
  const statusCfg    = STATUS_COLORS[app.status] || STATUS_COLORS.applied;
  const isExpanded   = expandedApp === app._id;
  const job          = app.job;
  const rounds       = job?.rounds || [];
  const roundUpdates = app.roundUpdates || [];

  const canShortlist     = ["applied", "under_review"].includes(app.status);
  const hasRounds        = rounds.length > 0;
  const isInRounds       = ["shortlisted", "round_update"].includes(app.status);
  const isOnLastRound    = isInRounds && app.currentRound >= rounds.length;
  const canProceedNext   = isInRounds && !isOnLastRound;
  const canFinalShortlist = isInRounds;
  const canReject        = !["rejected", "hired", "withdrawn"].includes(app.status);

  const currentRoundData = rounds[app.currentRound - 1];
  const nextRoundData    = rounds[app.currentRound];     // currentRound is 1-indexed
  const passedCount      = roundUpdates.filter((r) => r.result === "passed").length;

  return (
    <div className={`ra-card ${app.status}`}>

      {/* ── Card Header ── */}
      <div className="ra-card-header" onClick={() => setExpandedApp(isExpanded ? null : app._id)}>
        <div className="ra-card-top">
          <div style={{ flex: 1 }}>
            <div className="ra-applicant-name">{snap.fullName || app.jobseeker?.name || "Applicant"}</div>
            <div className="ra-applicant-meta">
              <span style={{ display:"flex", alignItems:"center", gap:4 }}>
                <Mail size={12} />{snap.email || app.jobseeker?.email}
              </span>
              {snap.mobile && (
                <span style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <Phone size={12} />{snap.mobile}
                </span>
              )}
              {snap.city && (
                <span style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <MapPin size={12} />{snap.city}
                </span>
              )}
            </div>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {roundUpdates.length > 0 && rounds.length > 0 && (
              <div className="ra-round-pill">
                <Layers size={10} />
                {passedCount}/{rounds.length} rounds
              </div>
            )}
            <div
              className="ra-status-badge"
              style={{ color: statusCfg.color, background: statusCfg.bg, borderColor: statusCfg.border }}
            >
              {statusCfg.label}
            </div>
            {isExpanded ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
          </div>
        </div>

        <div className="ra-card-sub">
          <div className="ra-card-sub-item"><Briefcase size={12} />{job?.title || "—"}</div>
          <div className="ra-card-sub-item">
            <Clock size={12} />
            {new Date(app.createdAt).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })}
          </div>
          {snap.experience && <div className="ra-card-sub-item"><Briefcase size={12} />{snap.experience} yrs exp</div>}
          {snap.education  && <div className="ra-card-sub-item"><GraduationCap size={12} />{snap.education}</div>}

          <div className="ra-stars" onClick={(e) => e.stopPropagation()}>
            {[1,2,3,4,5].map((s) => (
              <Star
                key={s} size={14} className="ra-star"
                fill={s <= localRating ? "#f59e0b" : "none"}
                color={s <= localRating ? "#f59e0b" : "#cbd5e1"}
                onClick={() => { setLocalRating(s); updateNotes(app._id, localNotes, s); }}
              />
            ))}
          </div>
        </div>

        {app.selectedSkills?.length > 0 && (
          <div className="ra-skills">
            {app.selectedSkills.map((s) => <span key={s} className="ra-skill">{s}</span>)}
          </div>
        )}

        {rounds.length > 0 && roundUpdates.length > 0 && (
          <div className="ra-progress-wrap" onClick={(e) => e.stopPropagation()}>
            <div className="ra-progress-bar">
              <div className="ra-progress-fill" style={{ width:`${(passedCount / rounds.length) * 100}%` }} />
            </div>
            <div className="ra-progress-label">
              {rounds.map((r, i) => (
                <span
                  key={i}
                  className={`ra-progress-dot ${roundUpdates.find(u => u.roundNumber === i+1)?.result || "none"}`}
                  title={`Round ${i+1}: ${r.title || ROUND_TYPE_LABELS[r.type] || r.type}`}
                >
                  {ROUND_ICONS[r.type] || "●"}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Expanded Body ── */}
      {isExpanded && (
        <div className="ra-body">
          <div className="ra-body-grid">

            {/* Left — applicant details */}
            <div>
              <div className="ra-section-label">Applicant Profile</div>
              {[
                [GraduationCap, "Education",  snap.education,                                  false],
                [Briefcase,     "Experience", snap.experience ? `${snap.experience} year(s)` : null, false],
                [MapPin,        "City",       snap.city,                                       false],
                [Phone,         "Mobile",     snap.mobile,                                     false],
                [Linkedin,      "LinkedIn",   snap.linkedin,                                   true ],
                [ExternalLink,  "Portfolio",  snap.portfolio,                                  true ],
              ]
                .filter(([,,v]) => v)
                .map(([Icon, label, value, isLink]) => (
                  <div key={label} className="ra-detail-item">
                    <div className="ra-detail-label">{label}</div>
                    <div className="ra-detail-value">
                      {isLink
                        ? <a href={value} target="_blank" rel="noreferrer">{value.length > 35 ? value.slice(0,35)+"…" : value}</a>
                        : value}
                    </div>
                  </div>
                ))}

              {app.resumeUrl && (
                <a
                  href={app.resumeUrl} target="_blank" rel="noreferrer"
                  style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"8px 14px", background:"#0f172a", color:"white", borderRadius:7, fontSize:12, fontWeight:600, textDecoration:"none", marginTop:8 }}
                >
                  <FileText size={13} /> View Resume
                </a>
              )}
            </div>

            {/* Right — rounds + notes */}
            <div>
              {rounds.length > 0 && (
                <div style={{ marginBottom:16 }}>
                  <div className="ra-section-label">Hiring Rounds ({rounds.length} total)</div>
                  <div className="ra-rounds-overview">
                    {rounds.map((r, i) => {
                      const update   = roundUpdates.find(u => u.roundNumber === i+1);
                      const isCurrent = app.currentRound === i+1;
                      const isNext    = app.currentRound === i;  // next upcoming
                      return (
                        <div key={i} className={`ra-overview-round ${update?.result || "none"} ${isCurrent ? "current" : ""} ${isNext && isInRounds ? "upcoming" : ""}`}>
                          <span className="ra-overview-icon">{ROUND_ICONS[r.type] || "●"}</span>
                          <div>
                            <div className="ra-overview-title">Round {i+1}: {r.title || ROUND_TYPE_LABELS[r.type] || r.type}</div>
                            {update && (
                              <div className="ra-overview-result" style={{
                                color: update.result === "passed"    ? "#065f46"
                                     : update.result === "failed"    ? "#991b1b"
                                     : update.result === "scheduled" ? "#1e40af"
                                     : "#92400e"
                              }}>
                                {update.result === "passed"    ? "✓ Passed"
                                 : update.result === "failed"  ? "✗ Failed"
                                 : update.result === "scheduled" ? "⏳ Scheduled"
                                 : "⌛ Pending"}
                              </div>
                            )}
                            {isCurrent && !update && <div style={{ fontSize:11, color:"#108a42", fontWeight:600 }}>← Current</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {roundUpdates.length > 0 && (
                <>
                  <div className="ra-section-label">Round History</div>
                  <div className="ra-rounds">
                    {roundUpdates.map((ru, idx) => {
                      const resultColors = {
                        passed:    { bg:"#d1fae5", color:"#065f46" },
                        failed:    { bg:"#fee2e2", color:"#991b1b" },
                        scheduled: { bg:"#dbeafe", color:"#1e40af" },
                        pending:   { bg:"#fef3c7", color:"#92400e" },
                      };
                      const rc = resultColors[ru.result] || resultColors.pending;
                      return (
                        <div key={idx} className="ra-round">
                          <div className={`ra-round-icon ${ru.result}`}>{ROUND_ICONS[ru.roundType] || "➕"}</div>
                          <div className="ra-round-body">
                            <div className="ra-round-title">
                              Round {ru.roundNumber}: {ru.roundTitle}
                              <span className="ra-round-result" style={{ background:rc.bg, color:rc.color }}>{ru.result}</span>
                            </div>
                            {ru.note && <div className="ra-round-note">"{ru.note}"</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              <div style={{ marginTop:16 }}>
                <div className="ra-section-label">Internal Notes (private)</div>
                <textarea
                  className="ra-notes"
                  placeholder="Add private notes about this candidate..."
                  value={localNotes}
                  onChange={(e) => setLocalNotes(e.target.value)}
                  onBlur={() => updateNotes(app._id, localNotes, localRating)}
                />
              </div>
            </div>
          </div>

          <div className="ra-section-label">Cover Letter</div>
          <div className="ra-cover">{app.coverLetter}</div>

          {/* ══════════════════════════════════════════════════
              ACTION BUTTONS — 3-button round-wise system
          ══════════════════════════════════════════════════ */}
          <div className="ra-actions">

            {/* ── INITIAL SHORTLIST (applied / under_review) ── */}
            {canShortlist && (
              <div className="ra-shortlist-group">
                <button
                  className="ra-btn ra-btn-green"
                  onClick={() => handleShortlistDirect(app._id, snap.fullName || app.jobseeker?.name)}
                  disabled={!!actionLoading}
                  title="Shortlist candidate without round tracking"
                >
                  {actionLoading === app._id + "_shortlist_direct"
                    ? <Loader2 size={13} className="ra-spinner" />
                    : <CheckCircle size={14} />}
                  Shortlist
                </button>

                {hasRounds && (
                  <button
                    className="ra-btn ra-btn-teal"
                    onClick={() => handleShortlistRoundWise(app._id, snap.fullName || app.jobseeker?.name, rounds, job)}
                    disabled={!!actionLoading}
                    title={`Start round-wise process from Round 1: ${rounds[0]?.title || ROUND_TYPE_LABELS[rounds[0]?.type] || rounds[0]?.type}`}
                  >
                    {actionLoading === app._id + "_shortlist_round"
                      ? <Loader2 size={13} className="ra-spinner" />
                      : <Layers size={14} />}
                    Shortlist for Round 1
                    <span className="ra-btn-sub">{rounds[0]?.title || ROUND_TYPE_LABELS[rounds[0]?.type] || "Round 1"}</span>
                  </button>
                )}
              </div>
            )}

            {/* ── IN-ROUND ACTIONS: 3 clear buttons ── */}
            {isInRounds && (
              <div className="ra-round-action-group">

                {/* BUTTON 1: Proceed to Next Round (only if not on last round) */}
                {canProceedNext && (
                  <button
                    className="ra-btn ra-btn-next"
                    onClick={() => handleNextRound(
                      app._id,
                      snap.fullName || app.jobseeker?.name,
                      app.currentRound,
                      currentRoundData,
                      nextRoundData,
                      rounds.length
                    )}
                    disabled={!!actionLoading}
                    title={`Pass Round ${app.currentRound} and move to Round ${app.currentRound + 1}`}
                  >
                    {actionLoading === app._id + "_next"
                      ? <Loader2 size={13} className="ra-spinner" />
                      : <ArrowRight size={14} />}
                    <span>
                      Proceed to Round {app.currentRound + 1}
                      {nextRoundData && (
                        <span className="ra-btn-sub">
                          {nextRoundData.title || ROUND_TYPE_LABELS[nextRoundData.type] || nextRoundData.type}
                        </span>
                      )}
                    </span>
                  </button>
                )}

                {/* BUTTON 2: Final Shortlist / Offer */}
                {canFinalShortlist && (
                  <button
                    className="ra-btn ra-btn-final"
                    onClick={() => handleFinalShortlist(
                      app._id,
                      snap.fullName || app.jobseeker?.name,
                      app.currentRound,
                      currentRoundData,
                      rounds.length
                    )}
                    disabled={!!actionLoading}
                    title="Pass this round and extend an offer — marks candidate as Hired"
                  >
                    {actionLoading === app._id + "_final"
                      ? <Loader2 size={13} className="ra-spinner" />
                      : <Trophy size={14} />}
                    Final Shortlist
                    <span className="ra-btn-sub" style={{ background:"rgba(255,255,255,0.2)" }}>Extend Offer</span>
                  </button>
                )}
              </div>
            )}

            {/* Hired badge */}
            {app.status === "hired" && (
              <div className="ra-hired-badge">
                <Trophy size={14} /> Offer Extended
              </div>
            )}

            {/* BUTTON 3: Reject (always on right) */}
            {canReject && (
              <button
                className="ra-btn ra-btn-danger"
                onClick={() => {
                  setRejectModal({ applicationId: app._id, name: snap.fullName || app.jobseeker?.name });
                  setRejectReason("");
                }}
                disabled={!!actionLoading}
                style={{ marginLeft:"auto" }}
              >
                <XCircle size={14} /> Reject
              </button>
            )}
          </div>

          {/* Round context hint when in rounds */}
          {isInRounds && (
            <div className="ra-round-hint">
              <AlertCircle size={12} />
              Currently on Round {app.currentRound} of {rounds.length}
              {currentRoundData && ` — ${currentRoundData.title || ROUND_TYPE_LABELS[currentRoundData.type] || currentRoundData.type}`}
              {isOnLastRound && <span className="ra-last-round-tag">Final Round</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   Main RecruiterApplications
───────────────────────────────────────────────────────────── */
const RecruiterApplications = () => {
  const { token } = useAuth();
  const [applications, setApplications]     = useState([]);
  const [loading, setLoading]               = useState(true);
  const [expandedApp, setExpandedApp]       = useState(null);
  const [filterStatus, setFilterStatus]     = useState("all");
  const [filterJob, setFilterJob]           = useState("all");
  const [actionLoading, setActionLoading]   = useState(null);

  // Shortlist round-wise modal
  const [shortlistRoundModal, setShortlistRoundModal] = useState(null);
  const [shortlistNote, setShortlistNote]             = useState("");

  // Next round modal
  const [nextRoundModal, setNextRoundModal]   = useState(null);  // { applicationId, name, currentRound, currentRoundData, nextRoundData, totalRounds }
  const [nextRoundNote, setNextRoundNote]     = useState("");

  // Final shortlist modal
  const [finalModal, setFinalModal]   = useState(null);  // { applicationId, name, currentRound, currentRoundData, totalRounds }
  const [finalNote, setFinalNote]     = useState("");

  // Reject modal
  const [rejectModal, setRejectModal]     = useState(null);
  const [rejectReason, setRejectReason]   = useState("");

  const fetchApplications = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/applications/recruiter`, {
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

  /* ── Direct shortlist ── */
  const handleShortlistDirect = async (applicationId, applicantName) => {
    const note = window.prompt(`Add a note for ${applicantName} (optional):`);
    if (note === null) return;
    try {
      setActionLoading(applicationId + "_shortlist_direct");
      await axios.patch(
        `${API_BASE_URL}/api/applications/${applicationId}/shortlist`,
        { note: note || "" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`${applicantName} shortlisted! Email sent.`);
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to shortlist");
    } finally {
      setActionLoading(null);
    }
  };

  /* ── Round-wise shortlist — opens modal ── */
  const handleShortlistRoundWise = (applicationId, applicantName, rounds, job) => {
    setShortlistRoundModal({ applicationId, applicantName, rounds, job });
    setShortlistNote("");
  };

  /* ── Confirm round-wise shortlist ── */
  const confirmShortlistRoundWise = async () => {
    if (!shortlistRoundModal) return;
    const { applicationId, applicantName } = shortlistRoundModal;
    try {
      setActionLoading(applicationId + "_shortlist_round");
      await axios.patch(
        `${API_BASE_URL}/api/applications/${applicationId}/shortlist`,
        { note: shortlistNote || "" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`${applicantName} shortlisted for Round 1! Email sent.`);
      setShortlistRoundModal(null);
      setShortlistNote("");
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to shortlist");
    } finally {
      setActionLoading(null);
    }
  };

  /* ── Open next-round modal ── */
  const handleNextRound = (applicationId, name, currentRound, currentRoundData, nextRoundData, totalRounds) => {
    setNextRoundModal({ applicationId, name, currentRound, currentRoundData, nextRoundData, totalRounds });
    setNextRoundNote("");
  };

  /* ── Confirm proceed to next round ── */
  const confirmNextRound = async () => {
    if (!nextRoundModal) return;
    const { applicationId, name } = nextRoundModal;
    try {
      setActionLoading(applicationId + "_next");
      await axios.patch(
        `${API_BASE_URL}/api/applications/${applicationId}/next-round`,
        { note: nextRoundNote || "" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`${name} advanced to Round ${nextRoundModal.currentRound + 1}! Email sent.`);
      setNextRoundModal(null);
      setNextRoundNote("");
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to proceed to next round");
    } finally {
      setActionLoading(null);
    }
  };

  /* ── Open final shortlist modal ── */
  const handleFinalShortlist = (applicationId, name, currentRound, currentRoundData, totalRounds) => {
    setFinalModal({ applicationId, name, currentRound, currentRoundData, totalRounds });
    setFinalNote("");
  };

  /* ── Confirm final shortlist ── */
  const confirmFinalShortlist = async () => {
    if (!finalModal) return;
    const { applicationId, name } = finalModal;
    try {
      setActionLoading(applicationId + "_final");
      await axios.patch(
        `${API_BASE_URL}/api/applications/${applicationId}/final-shortlist`,
        { note: finalNote || "" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`🏆 ${name} has been officially shortlisted! Offer email sent.`);
      setFinalModal(null);
      setFinalNote("");
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to finalize");
    } finally {
      setActionLoading(null);
    }
  };

  /* ── Reject ── */
  const handleReject = async () => {
    if (!rejectModal) return;
    try {
      setActionLoading(rejectModal.applicationId + "_reject");
      await axios.patch(
        `${API_BASE_URL}/api/applications/${rejectModal.applicationId}/reject`,
        { reason: rejectReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Applicant rejected. Email sent.");
      setRejectModal(null);
      setRejectReason("");
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject");
    } finally {
      setActionLoading(null);
    }
  };

  /* ── Notes ── */
  const updateNotes = async (applicationId, notes, rating) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/api/applications/${applicationId}/notes`,
        { internalNotes: notes, recruiterRating: rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Notes saved");
    } catch {
      toast.error("Failed to save notes");
    }
  };

  const uniqueJobs = [...new Map(
    applications.filter((a) => a.job).map((a) => [a.job._id, a.job])
  ).values()];

  const filtered = applications.filter((a) => {
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    if (filterJob    !== "all" && a.job?._id !== filterJob)  return false;
    return true;
  });

  const counts = applications.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .ra-root { font-family:'Inter',sans-serif; }

        .ra-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
        .ra-title  { font-size:20px; font-weight:700; color:#0f172a; }
        .ra-subtitle { font-size:13px; color:#64748b; margin-top:2px; }

        .ra-stats { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:20px; }
        .ra-stat { padding:10px 16px; background:white; border:1px solid #e2e8f0; border-radius:8px; text-align:center; min-width:70px; }
        .ra-stat-value { font-size:20px; font-weight:700; color:#0f172a; }
        .ra-stat-label { font-size:11px; color:#64748b; margin-top:2px; }

        .ra-filters { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px; }
        .ra-filter {
          padding:6px 14px; border-radius:100px; font-size:12px; font-weight:600;
          cursor:pointer; border:1px solid #e2e8f0; background:white; color:#64748b;
          font-family:'Inter',sans-serif; transition:all 0.15s;
        }
        .ra-filter.active { background:#0f172a; color:white; border-color:#0f172a; }
        .ra-filter:hover:not(.active) { background:#f8fafc; }
        .ra-job-filter {
          padding:6px 12px; border:1px solid #e2e8f0; border-radius:8px; font-size:13px;
          background:white; color:#475569; font-family:'Inter',sans-serif;
          margin-bottom:20px; cursor:pointer; outline:none;
        }

        /* Card */
        .ra-card { background:white; border:1px solid #e2e8f0; border-radius:12px; margin-bottom:16px; overflow:hidden; transition:box-shadow 0.2s; }
        .ra-card:hover { box-shadow:0 2px 8px rgba(0,0,0,.06); }
        .ra-card.applied      { border-left:3px solid #3b82f6; }
        .ra-card.under_review { border-left:3px solid #f59e0b; }
        .ra-card.shortlisted  { border-left:3px solid #108a42; }
        .ra-card.round_update { border-left:3px solid #108a42; }
        .ra-card.hired        { border-left:3px solid #108a42; background:#fafffe; }
        .ra-card.rejected     { border-left:3px solid #ef4444; }

        .ra-card-header    { padding:18px 20px; cursor:pointer; }
        .ra-card-top       { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
        .ra-applicant-name { font-size:16px; font-weight:700; color:#0f172a; margin-bottom:3px; }
        .ra-applicant-meta { font-size:13px; color:#64748b; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .ra-status-badge   { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:100px; font-size:11px; font-weight:700; border:1px solid; }
        .ra-round-pill     { display:inline-flex; align-items:center; gap:4px; padding:3px 8px; border-radius:100px; font-size:10px; font-weight:700; background:#f0fdf4; border:1px solid #6ee7b7; color:#065f46; }
        .ra-card-sub       { font-size:12px; color:#64748b; margin-top:8px; display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
        .ra-card-sub-item  { display:flex; align-items:center; gap:4px; }
        .ra-stars { display:flex; gap:2px; }
        .ra-star  { cursor:pointer; transition:color 0.1s; }
        .ra-skills { display:flex; flex-wrap:wrap; gap:5px; margin-top:10px; }
        .ra-skill  { padding:2px 8px; background:#eff6ff; border:1px solid #bfdbfe; border-radius:100px; font-size:11px; font-weight:600; color:#1e40af; }

        .ra-progress-wrap  { margin-top:12px; }
        .ra-progress-bar   { height:4px; background:#e2e8f0; border-radius:2px; overflow:hidden; }
        .ra-progress-fill  { height:100%; background:linear-gradient(90deg,#108a42,#5cba6b); border-radius:2px; transition:width 0.4s; }
        .ra-progress-label { display:flex; gap:6px; margin-top:6px; }
        .ra-progress-dot   { font-size:14px; opacity:0.4; cursor:default; }
        .ra-progress-dot.passed    { opacity:1; }
        .ra-progress-dot.scheduled { opacity:0.8; }
        .ra-progress-dot.failed    { opacity:1; filter:grayscale(1); }

        /* Expanded body */
        .ra-body       { border-top:1px solid #f1f5f9; padding:20px; background:#fafafa; }
        .ra-body-grid  { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px; }
        .ra-section-label { font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:10px; }

        .ra-rounds-overview { display:flex; flex-direction:column; gap:6px; }
        .ra-overview-round  { display:flex; align-items:center; gap:10px; padding:8px 12px; background:white; border:1px solid #e2e8f0; border-radius:8px; transition:all 0.15s; }
        .ra-overview-round.passed    { border-color:#6ee7b7; background:#f0fdf4; }
        .ra-overview-round.failed    { border-color:#fecaca; background:#fef2f2; }
        .ra-overview-round.scheduled { border-color:#93c5fd; background:#eff6ff; }
        .ra-overview-round.current   { border-color:#108a42; box-shadow:0 0 0 2px rgba(16,138,66,0.15); }
        .ra-overview-round.upcoming  { border-color:#e2e8f0; border-style:dashed; }
        .ra-overview-icon  { font-size:18px; flex-shrink:0; }
        .ra-overview-title { font-size:13px; font-weight:600; color:#0f172a; }
        .ra-overview-result{ font-size:11px; font-weight:600; margin-top:2px; }

        .ra-rounds      { display:flex; flex-direction:column; gap:0; margin-bottom:16px; }
        .ra-round       { display:flex; gap:12px; position:relative; }
        .ra-round:not(:last-child)::before { content:''; position:absolute; left:15px; top:36px; width:2px; bottom:-4px; background:#e2e8f0; }
        .ra-round-icon  { width:32px; height:32px; border-radius:50%; background:white; border:2px solid #e2e8f0; display:flex; align-items:center; justify-content:center; font-size:14px; position:relative; z-index:1; flex-shrink:0; }
        .ra-round-icon.passed    { border-color:#10b981; }
        .ra-round-icon.failed    { border-color:#ef4444; }
        .ra-round-icon.scheduled { border-color:#3b82f6; }
        .ra-round-body  { flex:1; padding-bottom:14px; padding-top:4px; }
        .ra-round-title { font-size:14px; font-weight:600; color:#0f172a; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .ra-round-result{ padding:2px 8px; border-radius:100px; font-size:11px; font-weight:600; }
        .ra-round-note  { font-size:12px; color:#64748b; margin-top:4px; }

        .ra-detail-item  { padding:8px 12px; background:white; border:1px solid #e2e8f0; border-radius:6px; margin-bottom:6px; }
        .ra-detail-label { font-size:10px; color:#94a3b8; font-weight:600; text-transform:uppercase; }
        .ra-detail-value { font-size:13px; color:#0f172a; font-weight:500; margin-top:2px; word-break:break-word; }
        .ra-detail-value a { color:#3b82f6; text-decoration:none; }
        .ra-detail-value a:hover { text-decoration:underline; }

        .ra-cover { padding:14px; background:white; border:1px solid #e2e8f0; border-radius:8px; font-size:13px; color:#475569; line-height:1.7; white-space:pre-wrap; max-height:160px; overflow-y:auto; margin-bottom:16px; }
        .ra-notes { width:100%; padding:10px; font-size:13px; font-family:'Inter',sans-serif; border:1px solid #e2e8f0; border-radius:8px; background:white; color:#0f172a; outline:none; resize:vertical; min-height:72px; transition:border 0.2s; box-sizing:border-box; }
        .ra-notes:focus { border-color:#0f172a; }

        /* ── Action rows ── */
        .ra-actions { display:flex; gap:8px; flex-wrap:wrap; padding-top:16px; border-top:1px solid #e2e8f0; align-items:center; }
        .ra-shortlist-group { display:flex; gap:8px; flex-wrap:wrap; }

        /* NEW: 3-button round action group */
        .ra-round-action-group {
          display:flex; gap:8px; flex-wrap:wrap; align-items:center;
          padding:10px 14px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px;
          flex:1;
        }

        .ra-btn {
          display:inline-flex; align-items:center; gap:6px; padding:8px 14px;
          border-radius:8px; font-size:13px; font-weight:600; cursor:pointer;
          border:1px solid; transition:all 0.2s; font-family:'Inter',sans-serif;
        }
        .ra-btn-sub {
          font-size:10px; font-weight:500; opacity:0.75;
          background:rgba(255,255,255,0.2); padding:1px 6px; border-radius:4px; margin-left:2px;
        }
        .ra-btn-primary { background:#0f172a; color:white; border-color:#0f172a; }
        .ra-btn-primary:hover:not(:disabled) { background:#1e293b; }
        .ra-btn-green   { background:#108a42; color:white; border-color:#108a42; }
        .ra-btn-green:hover:not(:disabled)   { background:#0d7236; transform:translateY(-1px); box-shadow:0 4px 12px rgba(16,138,66,0.25); }
        .ra-btn-teal    { background:white; color:#108a42; border-color:#108a42; border-width:1.5px; }
        .ra-btn-teal:hover:not(:disabled)    { background:#f0fdf4; transform:translateY(-1px); box-shadow:0 4px 12px rgba(16,138,66,0.12); }
        .ra-btn-teal .ra-btn-sub { background:#e7f9ed; color:#108a42; opacity:1; }

        /* Next round — blue-ish teal */
        .ra-btn-next    { background:white; color:#1e40af; border-color:#93c5fd; border-width:1.5px; }
        .ra-btn-next:hover:not(:disabled) { background:#eff6ff; transform:translateY(-1px); box-shadow:0 4px 12px rgba(59,130,246,0.15); }

        /* Final shortlist — gold/amber to distinguish from plain shortlist */
        .ra-btn-final   { background:linear-gradient(135deg,#065f46,#108a42); color:white; border-color:#108a42; font-weight:700; }
        .ra-btn-final:hover:not(:disabled) { background:linear-gradient(135deg,#047857,#0d9a4a); transform:translateY(-1px); box-shadow:0 4px 14px rgba(16,138,66,0.35); }

        .ra-btn-danger  { background:white; color:#dc2626; border-color:#fecaca; }
        .ra-btn-danger:hover:not(:disabled) { background:#fef2f2; }
        .ra-btn:disabled { opacity:0.5; cursor:not-allowed; transform:none !important; box-shadow:none !important; }

        .ra-hired-badge { display:inline-flex; align-items:center; gap:6px; padding:8px 14px; background:#d1fae5; border:1px solid #6ee7b7; border-radius:8px; font-size:13px; font-weight:700; color:#065f46; }

        /* Round context hint */
        .ra-round-hint {
          display:flex; align-items:center; gap:6px; margin-top:10px; padding:8px 12px;
          background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px;
          font-size:12px; color:#065f46; font-weight:500;
        }
        .ra-last-round-tag {
          margin-left:6px; padding:1px 8px; background:#108a42; color:white;
          border-radius:100px; font-size:10px; font-weight:700; text-transform:uppercase;
        }

        /* Modals */
        .ra-overlay { position:fixed; inset:0; background:rgba(15,23,42,0.55); backdrop-filter:blur(4px); z-index:9999; display:flex; align-items:center; justify-content:center; padding:16px; }
        .ra-modal { background:white; border-radius:16px; padding:28px; width:100%; max-width:520px; box-shadow:0 24px 80px rgba(0,0,0,0.2); animation:raModalIn 0.2s ease; }
        @keyframes raModalIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .ra-modal-title { font-size:18px; font-weight:700; color:#0f172a; margin-bottom:4px; }
        .ra-modal-sub   { font-size:13px; color:#64748b; margin-bottom:20px; }
        .ra-modal-label { font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px; display:block; }
        .ra-modal-input { width:100%; padding:10px 12px; font-size:13px; font-family:'Inter',sans-serif; border:1.5px solid #e2e8f0; border-radius:8px; background:white; color:#0f172a; outline:none; resize:vertical; min-height:80px; transition:border 0.2s; box-sizing:border-box; margin-bottom:14px; }
        .ra-modal-input:focus { border-color:#108a42; }
        .ra-modal-actions { display:flex; gap:10px; justify-content:flex-end; }
        .ra-cancel { padding:9px 18px; background:#f1f5f9; color:#475569; border:none; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; font-family:'Inter',sans-serif; transition:background 0.15s; }
        .ra-cancel:hover { background:#e2e8f0; }

        .ra-modal-alert { display:flex; align-items:flex-start; gap:10px; padding:12px 14px; border-radius:8px; margin-bottom:14px; font-size:13px; border:1px solid; }
        .ra-modal-alert.info    { background:#eff6ff; border-color:#93c5fd; color:#1e40af; }
        .ra-modal-alert.success { background:#f0fdf4; border-color:#6ee7b7; color:#065f46; }
        .ra-modal-alert.warning { background:#fffdf0; border-color:#f0d060; color:#78350f; }
        .ra-modal-alert.danger  { background:#fef2f2; border-color:#fecaca; color:#991b1b; }

        /* Round list in shortlist modal */
        .ra-round-list { display:flex; flex-direction:column; gap:8px; margin-bottom:18px; }
        .ra-round-list-item { display:flex; align-items:center; gap:10px; padding:10px 14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; }
        .ra-round-list-item.active { border-color:#108a42; background:#f0fdf4; }
        .ra-round-list-num { width:26px; height:26px; border-radius:50%; background:#0f172a; color:white; font-size:12px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .ra-round-list-num.active { background:#108a42; }
        .ra-round-list-title { font-size:13px; font-weight:600; color:#0f172a; }
        .ra-round-list-type  { font-size:11px; color:#64748b; margin-top:1px; }

        /* Round flow — next-round & final modals */
        .ra-round-flow { display:flex; align-items:center; gap:10px; padding:14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; margin-bottom:16px; }
        .ra-round-flow-from { flex:1; text-align:center; }
        .ra-round-flow-arrow { color:#94a3b8; flex-shrink:0; }
        .ra-round-flow-to   { flex:1; text-align:center; }
        .ra-round-flow-num  { font-size:11px; color:#94a3b8; font-weight:600; margin-bottom:3px; }
        .ra-round-flow-name { font-size:13px; color:#0f172a; font-weight:700; }
        .ra-round-flow-badge { display:inline-block; padding:2px 8px; border-radius:100px; font-size:10px; font-weight:700; margin-top:3px; }
        .ra-round-flow-badge.current { background:#dbeafe; color:#1e40af; }
        .ra-round-flow-badge.next    { background:#d1fae5; color:#065f46; }
        .ra-round-flow-badge.final   { background:#108a42; color:white; }

        .ra-empty       { text-align:center; padding:60px 24px; }
        .ra-empty-icon  { width:56px; height:56px; background:#f1f5f9; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; }
        .ra-spinner     { animation:spin 1s linear infinite; }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }

        @media (max-width:600px) {
          .ra-body-grid { grid-template-columns:1fr; }
          .ra-card-top  { flex-direction:column; }
          .ra-actions   { flex-direction:column; }
          .ra-shortlist-group { flex-direction:column; }
          .ra-round-action-group { flex-direction:column; }
          .ra-btn       { width:100%; justify-content:center; }
        }
      `}</style>

      <div className="ra-root">

        {/* Header */}
        <div className="ra-header">
          <div>
            <div className="ra-title">Applications ({applications.length})</div>
            <div className="ra-subtitle">Review and manage all job applications</div>
          </div>
          <button
            onClick={fetchApplications}
            style={{ background:"none", border:"1px solid #e2e8f0", borderRadius:6, padding:6, cursor:"pointer" }}
          >
            <RefreshCw size={16} color="#64748b" />
          </button>
        </div>

        {/* Stats */}
        {applications.length > 0 && (
          <div className="ra-stats">
            {[
              ["Total",      applications.length,      "#0f172a"],
              ["New",        counts.applied      || 0, "#1e40af"],
              ["Reviewing",  counts.under_review || 0, "#92400e"],
              ["Shortlisted",counts.shortlisted  || 0, "#065f46"],
              ["In Rounds",  counts.round_update || 0, "#108a42"],
              ["Hired",      counts.hired        || 0, "#065f46"],
              ["Rejected",   counts.rejected     || 0, "#991b1b"],
            ].map(([label, val, color]) => (
              <div key={label} className="ra-stat">
                <div className="ra-stat-value" style={{ color }}>{val}</div>
                <div className="ra-stat-label">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Status filter pills */}
        <div className="ra-filters">
          {[
            { key:"all",          label:"All"          },
            { key:"applied",      label:"New"          },
            { key:"under_review", label:"Reviewing"    },
            { key:"shortlisted",  label:"Shortlisted"  },
            { key:"round_update", label:"In Rounds"    },
            { key:"hired",        label:"Hired"        },
            { key:"rejected",     label:"Rejected"     },
          ].map((f) => (
            <button
              key={f.key}
              className={`ra-filter ${filterStatus === f.key ? "active" : ""}`}
              onClick={() => setFilterStatus(f.key)}
            >
              {f.label}{f.key !== "all" && counts[f.key] ? ` (${counts[f.key]})` : ""}
            </button>
          ))}
        </div>

        {/* Job filter */}
        {uniqueJobs.length > 1 && (
          <select className="ra-job-filter" value={filterJob} onChange={(e) => setFilterJob(e.target.value)}>
            <option value="all">All Jobs</option>
            {uniqueJobs.map((j) => (
              <option key={j._id} value={j._id}>{j.title}</option>
            ))}
          </select>
        )}

        {/* Application list */}
        {loading ? (
          <div style={{ textAlign:"center", padding:"48px", color:"#64748b" }}>
            <Loader2 size={28} className="ra-spinner" style={{ margin:"0 auto 12px", display:"block" }} />
            Loading applications…
          </div>
        ) : filtered.length === 0 ? (
          <div className="ra-empty">
            <div className="ra-empty-icon"><Users size={24} color="#cbd5e1" /></div>
            <div style={{ fontSize:15, fontWeight:600, color:"#0f172a", marginBottom:4 }}>No applications found</div>
            <div style={{ fontSize:13, color:"#64748b" }}>Applications will appear here once jobseekers apply</div>
          </div>
        ) : (
          filtered.map((app) => (
            <ApplicationCard
              key={app._id}
              app={app}
              expandedApp={expandedApp}
              setExpandedApp={setExpandedApp}
              actionLoading={actionLoading}
              handleShortlistDirect={handleShortlistDirect}
              handleShortlistRoundWise={handleShortlistRoundWise}
              handleNextRound={handleNextRound}
              handleFinalShortlist={handleFinalShortlist}
              setRejectModal={setRejectModal}
              setRejectReason={setRejectReason}
              updateNotes={updateNotes}
            />
          ))
        )}
      </div>

      {/* ════════════════════════════════════════════════
          MODAL 1 — Round-wise Shortlist (Round 1)
      ════════════════════════════════════════════════ */}
      {shortlistRoundModal && (
        <div className="ra-overlay" onClick={(e) => e.target === e.currentTarget && setShortlistRoundModal(null)}>
          <div className="ra-modal">
            <div className="ra-modal-title">Shortlist for Round 1</div>
            <div className="ra-modal-sub">
              Shortlisting <strong>{shortlistRoundModal.applicantName}</strong> will assign them to Round 1 and send a notification email.
            </div>

            <label className="ra-modal-label">Hiring process overview</label>
            <div className="ra-round-list">
              {shortlistRoundModal.rounds.map((r, i) => (
                <div key={i} className={`ra-round-list-item ${i === 0 ? "active" : ""}`}>
                  <div className={`ra-round-list-num ${i === 0 ? "active" : ""}`}>{i + 1}</div>
                  <div style={{ flex:1 }}>
                    <div className="ra-round-list-title">
                      {r.title || ROUND_TYPE_LABELS[r.type] || r.type}
                      {i === 0 && (
                        <span style={{ fontSize:10, fontWeight:700, background:"#108a42", color:"white", padding:"1px 6px", borderRadius:4, marginLeft:6 }}>
                          STARTING HERE
                        </span>
                      )}
                    </div>
                    <div className="ra-round-list-type">{ROUND_TYPE_LABELS[r.type] || r.type}</div>
                  </div>
                  <span style={{ fontSize:18 }}>{ROUND_ICONS[r.type] || "●"}</span>
                </div>
              ))}
            </div>

            <div className="ra-modal-alert info">
              <AlertCircle size={15} style={{ flexShrink:0, marginTop:1 }} />
              <div>
                An email will be sent notifying <strong>{shortlistRoundModal.applicantName}</strong> they've been shortlisted and their first round is <strong>{shortlistRoundModal.rounds[0]?.title || ROUND_TYPE_LABELS[shortlistRoundModal.rounds[0]?.type] || "Round 1"}</strong>.
              </div>
            </div>

            <label className="ra-modal-label">Message to candidate (optional)</label>
            <textarea
              className="ra-modal-input"
              placeholder="e.g. Congratulations! Please be ready for the first round…"
              value={shortlistNote}
              onChange={(e) => setShortlistNote(e.target.value)}
            />

            <div className="ra-modal-actions">
              <button className="ra-cancel" onClick={() => setShortlistRoundModal(null)}>Cancel</button>
              <button
                className="ra-btn ra-btn-green"
                onClick={confirmShortlistRoundWise}
                disabled={!!actionLoading}
                style={{ border:"none" }}
              >
                {actionLoading === shortlistRoundModal.applicationId + "_shortlist_round"
                  ? <Loader2 size={13} className="ra-spinner" />
                  : <Layers size={13} />}
                Shortlist for Round 1 & Notify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          MODAL 2 — Proceed to Next Round
      ════════════════════════════════════════════════ */}
      {nextRoundModal && (
        <div className="ra-overlay" onClick={(e) => e.target === e.currentTarget && setNextRoundModal(null)}>
          <div className="ra-modal">
            <div className="ra-modal-title">Proceed to Next Round</div>
            <div className="ra-modal-sub">
              <strong>{nextRoundModal.name}</strong> will pass Round {nextRoundModal.currentRound} and advance to Round {nextRoundModal.currentRound + 1}.
            </div>

            {/* Round flow visualiser */}
            <div className="ra-round-flow">
              <div className="ra-round-flow-from">
                <div className="ra-round-flow-num">Round {nextRoundModal.currentRound}</div>
                <div className="ra-round-flow-name">
                  {nextRoundModal.currentRoundData?.title || ROUND_TYPE_LABELS[nextRoundModal.currentRoundData?.type] || `Round ${nextRoundModal.currentRound}`}
                </div>
                <span className="ra-round-flow-badge current">Passing ✓</span>
              </div>
              <ArrowRight size={20} className="ra-round-flow-arrow" />
              <div className="ra-round-flow-to">
                <div className="ra-round-flow-num">Round {nextRoundModal.currentRound + 1}</div>
                <div className="ra-round-flow-name">
                  {nextRoundModal.nextRoundData?.title || ROUND_TYPE_LABELS[nextRoundModal.nextRoundData?.type] || `Round ${nextRoundModal.currentRound + 1}`}
                </div>
                <span className="ra-round-flow-badge next">Up Next →</span>
              </div>
            </div>

            <div className="ra-modal-alert info">
              <AlertCircle size={15} style={{ flexShrink:0, marginTop:1 }} />
              <div>
                An email will be sent to <strong>{nextRoundModal.name}</strong> congratulating them on passing Round {nextRoundModal.currentRound} and notifying them about Round {nextRoundModal.currentRound + 1}.
              </div>
            </div>

            <label className="ra-modal-label">Feedback / message to candidate (optional)</label>
            <textarea
              className="ra-modal-input"
              placeholder="e.g. Great performance! Please prepare for the technical interview…"
              value={nextRoundNote}
              onChange={(e) => setNextRoundNote(e.target.value)}
            />

            <div className="ra-modal-actions">
              <button className="ra-cancel" onClick={() => setNextRoundModal(null)}>Cancel</button>
              <button
                className="ra-btn ra-btn-next"
                onClick={confirmNextRound}
                disabled={!!actionLoading}
                style={{ border:"1.5px solid #93c5fd" }}
              >
                {actionLoading === nextRoundModal.applicationId + "_next"
                  ? <Loader2 size={13} className="ra-spinner" />
                  : <ArrowRight size={13} />}
                Proceed to Round {nextRoundModal.currentRound + 1} & Notify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          MODAL 3 — Final Shortlist (Offer)
      ════════════════════════════════════════════════ */}
      {finalModal && (
        <div className="ra-overlay" onClick={(e) => e.target === e.currentTarget && setFinalModal(null)}>
          <div className="ra-modal">
            <div className="ra-modal-title">🏆 Final Shortlist — Extend Offer</div>
            <div className="ra-modal-sub">
              <strong>{finalModal.name}</strong> will be marked as <strong>Hired</strong> and receive an offer email.
            </div>

            {/* Final round badge */}
            <div className="ra-round-flow">
              <div style={{ flex:1, textAlign:"center" }}>
                <div className="ra-round-flow-num">Round {finalModal.currentRound} of {finalModal.totalRounds}</div>
                <div className="ra-round-flow-name">
                  {finalModal.currentRoundData?.title || ROUND_TYPE_LABELS[finalModal.currentRoundData?.type] || `Round ${finalModal.currentRound}`}
                </div>
                <span className="ra-round-flow-badge final">Final Decision ✓</span>
              </div>
            </div>

            <div className="ra-modal-alert success">
              <Trophy size={15} style={{ flexShrink:0, marginTop:1 }} />
              <div>
                This will <strong>finalize the hiring process</strong> for <strong>{finalModal.name}</strong>. They will receive a congratulations / offer email immediately.
              </div>
            </div>

            <label className="ra-modal-label">Offer message / next steps (optional)</label>
            <textarea
              className="ra-modal-input"
              placeholder="e.g. Congratulations! We're excited to have you on board. Our HR team will reach out with the offer letter…"
              value={finalNote}
              onChange={(e) => setFinalNote(e.target.value)}
            />

            <div className="ra-modal-actions">
              <button className="ra-cancel" onClick={() => setFinalModal(null)}>Cancel</button>
              <button
                className="ra-btn ra-btn-final"
                onClick={confirmFinalShortlist}
                disabled={!!actionLoading}
                style={{ border:"none" }}
              >
                {actionLoading === finalModal.applicationId + "_final"
                  ? <Loader2 size={13} className="ra-spinner" />
                  : <Trophy size={13} />}
                Confirm Final Shortlist & Send Offer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          MODAL 4 — Reject Applicant
      ════════════════════════════════════════════════ */}
      {rejectModal && (
        <div className="ra-overlay" onClick={(e) => e.target === e.currentTarget && setRejectModal(null)}>
          <div className="ra-modal">
            <div className="ra-modal-title">Reject Applicant</div>
            <div className="ra-modal-sub">
              You're rejecting <strong>{rejectModal.name}</strong>. They will receive a rejection email.
            </div>

            <div className="ra-modal-alert danger">
              <AlertCircle size={15} style={{ flexShrink:0, marginTop:1 }} />
              <div>This action cannot be undone. The candidate will be notified immediately.</div>
            </div>

            <label className="ra-modal-label">Reason (optional — shown to candidate)</label>
            <textarea
              className="ra-modal-input"
              placeholder="e.g. We're looking for more experience in X, or we've found a better fit…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />

            <div className="ra-modal-actions">
              <button className="ra-cancel" onClick={() => setRejectModal(null)}>Cancel</button>
              <button
                className="ra-btn ra-btn-danger"
                style={{ background:"#dc2626", color:"white", borderColor:"#dc2626" }}
                onClick={handleReject}
                disabled={!!actionLoading}
              >
                {actionLoading === rejectModal.applicationId + "_reject"
                  ? <Loader2 size={13} className="ra-spinner" />
                  : <XCircle size={13} />}
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RecruiterApplications;