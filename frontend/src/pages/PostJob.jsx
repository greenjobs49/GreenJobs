import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../components/common/Navbar";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  Loader2,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Gift,
  Layers,
  Eye,
  EyeOff,
  Briefcase,
  Clock,
  MapPin,
  Users,
  FileText,
  Award,
  ShieldCheck,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import API_BASE_URL from "../config/api";

const RupeeIcon = ({ size = 16, color = "currentColor" }) => (
  <span style={{ fontSize: size, fontWeight: 700, color, fontFamily: "'Inter', sans-serif", lineHeight: 1 }}>₹</span>
);

const ROUND_TYPES = [
  { value: "resume_screening",    label: "Resume Screening" },
  { value: "online_test",         label: "Online Test / Assessment" },
  { value: "aptitude_test",       label: "Aptitude Test" },
  { value: "technical_interview", label: "Technical Interview" },
  { value: "hr_interview",        label: "HR Interview" },
  { value: "group_discussion",    label: "Group Discussion" },
  { value: "assignment",          label: "Assignment / Task" },
  { value: "final_interview",     label: "Final Interview" },
  { value: "offer",               label: "Offer / Selection" },
  { value: "other",               label: "Other" },
];

const JOB_CATEGORIES = [
  "Full Time", "Part Time", "Internship", "Contract", "Remote", "Freelance",
];

// Renewable & Solar Energy specific skill suggestions
const skillSuggestions = [
  "Solar PV Design", "AutoCAD", "PVSyst", "HelioScope", "Energy Storage",
  "Battery Systems", "Project Management", "Site Assessment", "Electrical Engineering",
  "Grid Interconnection", "Renewable Energy Policy", "Energy Auditing", "SCADA",
  "Inverter Installation", "O&M (Operations & Maintenance)", "Safety Compliance",
  "AutoCAD Civil 3D", "Financial Analysis", "Wind Energy"
];

const defaultRound = () => ({
  id:          Date.now() + Math.random(),
  type:        "resume_screening",
  title:       "",
  description: "",
  duration:    "",
  expanded:    true,
});

const PostJob = () => {
  const { token, user } = useAuth();
  const navigate        = useNavigate();
  const { jobId }       = useParams();

  /* ── Role detection ─────────────────────────────────────── */
  const isBusinessOwner    = user?.role === "business";
  const isBusinessApproved = user?.businessProfile?.status === "approved";
  const businessStatus     = user?.businessProfile?.status;
  const verificationStatus = user?.recruiterProfile?.verificationStatus;
  const isVerified = isBusinessOwner ? isBusinessApproved : verificationStatus === "approved";

  /* ── Form state ─────────────────────────────────────────── */
  const [form, setForm] = useState({
    title:         "",
    company:       "",
    location:      "",
    type:          [],   // ← always an array (multi-select)
    description:   "",
    skills:        [],
    isPaid:        true,
    stipend:       "",
    stipendPeriod: "monthly",
    rounds:        [defaultRound()],
  });

  const [formErrors,    setFormErrors]    = useState({});
  const [loading,       setLoading]       = useState(false);
  const [activeSection, setActiveSection] = useState("basics");
  const [existingJob,   setExistingJob]   = useState(null);
  const [takingDown,    setTakingDown]    = useState(false);
  const [skillInput,    setSkillInput]    = useState("");

  /* ── Pre-fill company name ──────────────────────────────── */
  useEffect(() => {
    if (isBusinessOwner) {
      const bizName = user?.businessProfile?.businessName || "";
      if (bizName) setForm(prev => ({ ...prev, company: bizName }));
    } else if (user?.recruiterProfile?.companyName) {
      setForm(prev => ({ ...prev, company: user.recruiterProfile.companyName }));
    }
  }, [user, isBusinessOwner]);

  /* ── Load existing job for edit ─────────────────────────── */
  useEffect(() => {
    if (!jobId || !token) return;

    if (isBusinessOwner) {
      axios
        .get(`${API_BASE_URL}/api/jobs/business/own`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(res => {
          const jobs = res.data.jobs || [];
          const job  = jobs.find(j => j._id === jobId);
          if (job) populateForm(job);
        })
        .catch(() => {});
    } else {
      axios
        .get(`${API_BASE_URL}/api/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(res => {
          const job = res.data.job || res.data;
          populateForm(job);
        })
        .catch(() => {});
    }
  }, [jobId, token, isBusinessOwner]);

  const populateForm = (job) => {
    setExistingJob(job);
    // Normalise type: always store as array regardless of what the API returns
    const typeArr = Array.isArray(job.type)
      ? job.type
      : job.type
      ? [job.type]
      : ["Full Time"];

    setForm({
      title:         job.title         || "",
      company:       job.company        || "",
      location:      job.location       || "",
      type:          typeArr,
      description:   job.description    || "",
      skills:        job.skills         || [],
      isPaid:        job.isPaid !== false,
      stipend:       job.stipend        || "",
      stipendPeriod: job.stipendPeriod  || "monthly",
      rounds: job.rounds?.length
        ? job.rounds.map(r => ({ ...r, id: r._id || Date.now() + Math.random(), expanded: false }))
        : [defaultRound()],
    });
  };

  /* ── Employment type toggle ─────────────────────────────── */
  const toggleType = (cat) => {
    setForm(prev => ({
      ...prev,
      type: prev.type.includes(cat)
        ? prev.type.filter(t => t !== cat)
        : [...prev.type, cat],
    }));
  };

  /* ── Skill Handlers ─────────────────────────────────────── */
  const handleAddSkill = (skill) => {
    if (skill && !form.skills.includes(skill)) {
      setForm(p => ({ ...p, skills: [...p.skills, skill] }));
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill) => {
    setForm(p => ({ ...p, skills: p.skills.filter(s => s !== skill) }));
  };

  const handleSkillKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (skillInput.trim()) handleAddSkill(skillInput.trim());
    }
  };

  /* ── Round helpers ──────────────────────────────────────── */
  const addRound    = () => setForm(p => ({ ...p, rounds: [...p.rounds, defaultRound()] }));
  const removeRound = id  => setForm(p => ({ ...p, rounds: p.rounds.filter(r => r.id !== id) }));
  const updateRound = (id, field, value) =>
    setForm(p => ({ ...p, rounds: p.rounds.map(r => r.id === id ? { ...r, [field]: value } : r) }));
  const toggleRound = id =>
    setForm(p => ({ ...p, rounds: p.rounds.map(r => r.id === id ? { ...r, expanded: !r.expanded } : r) }));
  const moveRound   = (idx, dir) => {
    setForm(p => {
      const rounds = [...p.rounds];
      const swap   = idx + dir;
      if (swap < 0 || swap >= rounds.length) return p;
      [rounds[idx], rounds[swap]] = [rounds[swap], rounds[idx]];
      return { ...p, rounds };
    });
  };

  /* ── Validation ─────────────────────────────────────────── */
  const validate = () => {
    const errors = {};
    if (!form.title.trim() || form.title.trim().length < 3)
      errors.title = "Job title must be at least 3 characters";
    if (!form.type || form.type.length === 0)
      errors.type = "Select at least one employment type";
    if (!form.location.trim())
      errors.location = "Location is required";
    if (!form.description.trim() || form.description.trim().length < 50)
      errors.description = `Description needs at least 50 characters (${form.description.trim().length} now)`;
    if (form.isPaid && !form.stipend.trim())
      errors.stipend = "Please enter the stipend/salary amount";
    if (form.rounds.length === 0)
      errors.rounds = "Add at least one recruitment round";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* ── Submit ─────────────────────────────────────────────── */
  const handleSubmit = async () => {
    if (!validate()) {
      toast.error("Please fix the errors before submitting");
      if (formErrors.title || formErrors.location || formErrors.description || formErrors.type)
        setActiveSection("basics");
      else if (formErrors.stipend)
        setActiveSection("compensation");
      return;
    }

    if (!isVerified) {
      toast.error(
        isBusinessOwner
          ? businessStatus === "pending"
            ? "Your business is awaiting admin approval"
            : "Your business must be approved before posting jobs"
          : verificationStatus === "pending"
            ? "Your profile is awaiting admin verification"
            : "Get verified by admin before posting jobs"
      );
      setTimeout(() => navigate(isBusinessOwner ? "/business-dashboard" : "/dashboard"), 2000);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        title:         form.title.trim(),
        company:       form.company.trim(),
        location:      form.location.trim(),
        type:          form.type,           // send as array
        description:   form.description.trim(),
        skills:        form.skills,
        isPaid:        form.isPaid,
        stipend:       form.isPaid ? form.stipend.trim() : "",
        stipendPeriod: form.isPaid ? form.stipendPeriod  : "",
        rounds:        form.rounds.map((r, i) => ({
          order:       i + 1,
          type:        r.type,
          title:       r.title || ROUND_TYPES.find(t => t.value === r.type)?.label || r.type,
          description: r.description,
          duration:    r.duration,
        })),
      };

      const url = jobId
        ? isBusinessOwner
          ? `${API_BASE_URL}/api/jobs/business/${jobId}`
          : `${API_BASE_URL}/api/jobs/${jobId}`
        : isBusinessOwner
          ? `${API_BASE_URL}/api/jobs/business`
          : `${API_BASE_URL}/api/jobs`;

      const method = jobId ? "put" : "post";

      const response = await axios[method](url, payload, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        timeout: 15000,
      });

      toast.success(response.data.message || "Job posted successfully!", {
        duration: 3000,
        style: {
          background: "#D1FAE5", color: "#065F46",
          border: "1px solid #6EE7B7", borderRadius: "12px", fontWeight: "500",
        },
      });

      setTimeout(() => navigate(isBusinessOwner ? "/business-dashboard" : "/dashboard"), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post job");
    } finally {
      setLoading(false);
    }
  };

  /* ── Take down ──────────────────────────────────────────── */
  const handleTakeDown = async () => {
    if (!existingJob) return;
    const confirmed = window.confirm(
      "Take this job offline? It will no longer be visible to job seekers. You can repost it later."
    );
    if (!confirmed) return;
    try {
      setTakingDown(true);
      const takedownUrl = isBusinessOwner
        ? `${API_BASE_URL}/api/jobs/business/${existingJob._id}/takedown`
        : `${API_BASE_URL}/api/jobs/${existingJob._id}/takedown`;

      await axios.patch(takedownUrl, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Job taken down successfully");
      setTimeout(() => navigate(isBusinessOwner ? "/business-dashboard" : "/dashboard"), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to take down job");
    } finally {
      setTakingDown(false);
    }
  };

  /* ── Helpers ────────────────────────────────────────────── */
  const isFormValid = () =>
    form.title.trim().length >= 3 &&
    form.location.trim().length >= 2 &&
    form.type.length > 0 &&
    form.description.trim().length >= 50 &&
    (!form.isPaid || form.stipend.trim()) &&
    form.rounds.length > 0;

  const sections = [
    { id: "basics",       label: "Job Details",    icon: Briefcase },
    { id: "compensation", label: "Compensation",   icon: () => <RupeeIcon size={15} /> },
    { id: "rounds",       label: "Hiring Process", icon: Layers    },
  ];

  const sectionOrder = ["basics", "compensation", "rounds"];
  const goNext = () => {
    const idx = sectionOrder.indexOf(activeSection);
    if (idx < sectionOrder.length - 1) setActiveSection(sectionOrder[idx + 1]);
  };
  const goPrev = () => {
    const idx = sectionOrder.indexOf(activeSection);
    if (idx > 0) setActiveSection(sectionOrder[idx - 1]);
  };

  const progressPct = (
    (form.title.trim().length >= 3         ? 1 : 0) +
    (form.location.trim()                  ? 1 : 0) +
    (form.description.trim().length >= 50  ? 1 : 0) +
    (!form.isPaid || form.stipend.trim()   ? 1 : 0) +
    (form.rounds.length > 0                ? 1 : 0)
  ) * 20;

  const dashboardPath = isBusinessOwner ? "/business-dashboard" : "/dashboard";

  /* ════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════ */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #f8fafc; color: #0f172a; }

        @keyframes spin    { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn  { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse   { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }

        .pj-root   { background: #f8fafc; min-height: 100vh; }
        .pj-layout { max-width: 1140px; margin: 0 auto; padding: 36px 28px 80px; animation: fadeUp 0.4s ease; }

        .pj-back {
          display: inline-flex; align-items: center; gap: 8px;
          color: #94a3b8; background: none; border: none; cursor: pointer;
          font-size: 13.5px; font-family: 'Inter', sans-serif;
          padding: 8px 0; margin-bottom: 28px; transition: color 0.2s; font-weight: 500;
        }
        .pj-back:hover { color: #10b981; }

        .pj-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          margin-bottom: 32px; gap: 16px; flex-wrap: wrap;
        }
        .pj-header-left h1 {
          font-size: 32px; font-weight: 800; color: #0f172a;
          line-height: 1.1; margin-bottom: 6px; letter-spacing: -1px;
        }
        .pj-header-left p { color: #64748b; font-size: 15px; font-weight: 400; }

        .pj-verify-pill {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 8px 16px; border-radius: 50px;
          font-size: 12.5px; font-weight: 600; letter-spacing: 0.2px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .pj-verify-pill.verified   { background: white; border: 1.5px solid #bbf7d0; color: #15803d; }
        .pj-verify-pill.verified .pill-dot {
          width: 7px; height: 7px; background: #16a34a;
          border-radius: 50%; animation: pulse 2s infinite;
        }
        .pj-verify-pill.unverified { background: white; border: 1.5px solid #fecaca; color: #dc2626; }

        .pj-live-banner {
          background: #f0fdf4; border: 1.5px solid #bbf7d0;
          border-radius: 14px; padding: 16px 22px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; margin-bottom: 28px; flex-wrap: wrap;
        }
        .pj-live-banner-left { display: flex; align-items: center; gap: 12px; }
        .pj-live-dot {
          width: 8px; height: 8px; background: #10b981;
          border-radius: 50%; animation: pulse 2s infinite; flex-shrink: 0;
        }
        .pj-live-banner-left strong { font-size: 14.5px; color: #065f46; font-weight: 700; display: block; margin-bottom: 2px; }
        .pj-live-banner-left span  { font-size: 13px; color: #15803d; }

        .pj-progress-wrap  { margin-bottom: 28px; }
        .pj-progress-track { height: 4px; background: #e2e8f0; border-radius: 100px; overflow: hidden; }
        .pj-progress-fill  {
          height: 100%;
          background: linear-gradient(90deg, #10b981 0%, #059669 100%);
          border-radius: 100px; transition: width 0.5s ease;
        }
        .pj-progress-label {
          display: flex; justify-content: space-between;
          font-size: 11.5px; font-weight: 600; color: #94a3b8;
          text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;
        }

        .pj-tabs {
          display: flex; gap: 4px; margin-bottom: 32px;
          background: white; border: 1px solid #e2e8f0;
          border-radius: 14px; padding: 5px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .pj-tab {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 8px; padding: 11px 16px; border-radius: 10px;
          font-size: 13.5px; font-weight: 600; cursor: pointer;
          background: none; border: none; color: #94a3b8;
          font-family: 'Inter', sans-serif; transition: all 0.2s; white-space: nowrap;
        }
        .pj-tab.active {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white; box-shadow: 0 4px 12px rgba(16,185,129,0.30);
        }
        .pj-tab:hover:not(.active) { color: #0f172a; background: #f8fafc; }

        .pj-main-grid { display: grid; grid-template-columns: 1fr 300px; gap: 28px; align-items: start; }
        .pj-sidebar   { position: sticky; top: 24px; display: flex; flex-direction: column; gap: 16px; }

        .pj-card {
          background: white; border: 1px solid #e2e8f0; border-radius: 16px;
          padding: 28px; margin-bottom: 20px; animation: fadeIn 0.35s ease;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .pj-card-title    { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 4px; letter-spacing: -0.3px; }
        .pj-card-subtitle { font-size: 13px; color: #64748b; margin-bottom: 24px; }

        .pj-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .pj-field  { display: flex; flex-direction: column; gap: 7px; margin-bottom: 20px; }
        .pj-field:last-child { margin-bottom: 0; }

        .pj-label { font-size: 11.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.6px; }
        .pj-label span { color: #ef4444; margin-left: 2px; }

        .pj-input, .pj-select, .pj-textarea {
          width: 100%; padding: 12px 16px;
          background: #f8fafc; border: 1px solid #e2e8f0;
          border-radius: 10px; font-size: 14.5px;
          font-family: 'Inter', sans-serif; color: #0f172a;
          outline: none; transition: all 0.2s; -webkit-appearance: none;
        }
        .pj-input::placeholder, .pj-textarea::placeholder { color: #94a3b8; }
        .pj-input:focus, .pj-select:focus, .pj-textarea:focus {
          border-color: #6ee7b7; background: white;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.10);
        }
        .pj-input.error, .pj-textarea.error { border-color: #fca5a5; background: #fff5f5; }

        /* ── Employment Type multi-select ── */
        .pj-type-pills-wrap {
          display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px;
        }
        .pj-type-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 50px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          font-family: 'Inter', sans-serif; transition: all 0.2s;
          border: 1.5px solid #e2e8f0; background: #f8fafc; color: #64748b;
          user-select: none;
        }
        .pj-type-pill.active {
          background: #d1fae5; border-color: #6ee7b7; color: #065f46;
          box-shadow: 0 2px 8px rgba(16,185,129,0.15);
        }
        .pj-type-pill:hover:not(.active) { border-color: #10b981; color: #0f172a; background: #f0fdf4; }
        .pj-type-pill .pill-check {
          width: 14px; height: 14px; background: #10b981; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .pj-type-count {
          font-size: 12px; color: #64748b; margin-top: 6px; display: flex; align-items: center; gap: 6px;
        }
        .pj-type-count strong { color: #059669; }
        .pj-type-error { font-size: 12px; color: #f59e0b; margin-top: 4px; display: flex; align-items: center; gap: 4px; }

        /* Skills */
        .pj-suggestion-tag {
          padding: 5px 13px; border-radius: 100px; font-size: 12.5px; font-weight: 600;
          cursor: pointer; border: 1.5px dashed #e2e8f0; background: white; color: #64748b;
          font-family: 'Inter', sans-serif; transition: all 0.18s;
        }
        .pj-suggestion-tag:hover {
          background: #d1fae5; border-color: #6ee7b7; color: #065f46; border-style: solid;
        }
        .pj-skill-tag {
          display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px;
          background: #d1fae5; border: 1px solid #6ee7b7; border-radius: 100px;
          font-size: 13px; font-weight: 600; color: #065f46;
        }
        .pj-remove-skill {
          background: none; border: none; cursor: pointer; display: flex;
          align-items: center; color: #065f46; padding: 0; margin-left: 2px;
        }
        .pj-remove-skill:hover { color: #047857; }

        .pj-select {
          cursor: pointer;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 14px center;
          background-size: 16px; padding-right: 40px;
        }
        .pj-textarea { resize: vertical; min-height: 140px; line-height: 1.65; }
        .pj-error-msg { font-size: 12px; color: #ef4444; display: flex; align-items: center; gap: 4px; margin-top: 2px; }
        .pj-hint      { font-size: 12px; color: #94a3b8; }

        .pj-comp-chip {
          padding: 9px 18px; border-radius: 50px; font-size: 13px; font-weight: 600;
          cursor: pointer; border: 1.5px solid transparent; transition: all 0.2s;
          font-family: 'Inter', sans-serif; display: inline-flex; align-items: center; gap: 7px;
        }
        .pj-comp-chip.paid          { background: #f0fdf4; border-color: #bbf7d0; color: #15803d; }
        .pj-comp-chip.paid.active   { background: #d1fae5; border-color: #4ade80; box-shadow: 0 0 0 3px rgba(74,222,128,0.15); }
        .pj-comp-chip.unpaid        { background: #f8fafc; border-color: #e2e8f0; color: #64748b; }
        .pj-comp-chip.unpaid.active { background: #f1f5f9; border-color: #94a3b8; box-shadow: 0 0 0 3px rgba(148,163,184,0.15); }

        .pj-stipend-group { display: flex; gap: 12px; align-items: flex-start; }
        .pj-stipend-group .pj-input  { flex: 1; }
        .pj-stipend-group .pj-select { width: 140px; flex-shrink: 0; }

        .pj-rounds-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
        .pj-round-card  {
          background: #f8fafc; border: 1px solid #e2e8f0;
          border-radius: 12px; overflow: hidden; transition: all 0.2s;
          animation: slideIn 0.3s ease;
        }
        .pj-round-card:hover { border-color: #6ee7b7; box-shadow: 0 4px 16px rgba(16,185,129,0.08); }
        .pj-round-header {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 16px; cursor: pointer; user-select: none;
        }
        .pj-round-num {
          width: 28px; height: 28px; background: #d1fae5; border: 1px solid #6ee7b7;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; color: #065f46; flex-shrink: 0;
        }
        .pj-round-type-icon { font-size: 18px; flex-shrink: 0; }
        .pj-round-info      { flex: 1; min-width: 0; }
        .pj-round-info-title {
          font-size: 14px; font-weight: 600; color: #1e293b;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .pj-round-info-sub { font-size: 12px; color: #94a3b8; margin-top: 2px; }
        .pj-round-actions  { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
        .pj-round-action-btn {
          width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
          background: none; border: none; cursor: pointer; border-radius: 6px;
          color: #cbd5e1; transition: all 0.2s;
        }
        .pj-round-action-btn:hover        { background: #e2e8f0; color: #64748b; }
        .pj-round-action-btn.danger:hover { background: #fef2f2; color: #ef4444; }
        .pj-round-action-btn:disabled     { opacity: 0.3; cursor: not-allowed; }
        .pj-round-body {
          padding: 0 16px 16px; border-top: 1px solid #e2e8f0;
          background: white; display: grid; gap: 14px;
        }
        .pj-round-body .pj-grid-2 { gap: 14px; margin-top: 14px; }

        .pj-type-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 8px; margin-top: 10px;
        }
        .pj-type-opt {
          display: flex; align-items: center; gap: 8px; padding: 9px 12px;
          border-radius: 8px; border: 1px solid #e2e8f0; cursor: pointer;
          font-size: 13px; font-weight: 500; color: #64748b; transition: all 0.15s;
          background: #f8fafc; font-family: 'Inter', sans-serif;
        }
        .pj-type-opt:hover  { border-color: #6ee7b7; color: #0f172a; background: #f0fdf4; }
        .pj-type-opt.active { background: #d1fae5; border-color: #6ee7b7; color: #065f46; font-weight: 700; }

        .pj-add-round-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 13px;
          background: white; border: 1.5px dashed #6ee7b7; border-radius: 10px;
          color: #10b981; font-size: 14px; font-weight: 600; cursor: pointer;
          font-family: 'Inter', sans-serif; transition: all 0.2s;
        }
        .pj-add-round-btn:hover { background: #f0fdf4; border-color: #10b981; }

        .pj-summary-card {
          background: white; border: 1.5px solid #bbf7d0;
          border-radius: 16px; padding: 22px;
          box-shadow: 0 4px 16px rgba(16,185,129,0.08);
        }
        .pj-summary-card h3 {
          font-size: 14px; font-weight: 700; color: #15803d;
          margin-bottom: 16px; text-transform: uppercase;
          letter-spacing: 0.5px; display: flex; align-items: center; gap: 8px;
        }
        .pj-summary-item {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 10px 0; border-bottom: 1px solid #f0fdf4;
        }
        .pj-summary-item:last-child { border-bottom: none; padding-bottom: 0; }
        .pj-summary-icon  {
          width: 28px; height: 28px; background: #d1fae5; border-radius: 7px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .pj-summary-label { font-size: 10.5px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .pj-summary-value { font-size: 13px; color: #1e293b; font-weight: 500; margin-top: 2px; }

        /* Type tags in sidebar */
        .pj-type-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
        .pj-type-tag  {
          font-size: 11px; font-weight: 600; color: #065f46;
          background: #d1fae5; border: 1px solid #a7f3d0;
          padding: 2px 8px; border-radius: 100px;
        }

        .pj-submit-btn {
          width: 100%; padding: 14px 24px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white; border: none; border-radius: 12px;
          font-size: 15px; font-weight: 700; font-family: 'Inter', sans-serif;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          gap: 10px; transition: all 0.2s; letter-spacing: 0.2px;
          box-shadow: 0 4px 14px rgba(16,185,129,0.35);
        }
        .pj-submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          box-shadow: 0 6px 20px rgba(16,185,129,0.45); transform: translateY(-1px);
        }
        .pj-submit-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }

        .pj-takedown-btn {
          width: 100%; padding: 12px 24px; background: white; color: #c2410c;
          border: 1.5px solid #fed7aa; border-radius: 12px; font-size: 14px;
          font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s;
        }
        .pj-takedown-btn:hover:not(:disabled) { background: #fff7ed; border-color: #fdba74; }
        .pj-takedown-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .pj-nav-btn {
          padding: 12px 20px; border-radius: 12px; font-size: 14px; font-weight: 600;
          cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.2s;
          border: none; display: inline-flex; align-items: center; gap: 8px;
        }
        .pj-nav-btn-prev { background: white; border: 1px solid #e2e8f0; color: #64748b; }
        .pj-nav-btn-prev:hover { border-color: #cbd5e1; background: #f8fafc; }
        .pj-nav-btn-next { flex: 1; background: #f0fdf4; border: 1.5px solid #6ee7b7; color: #15803d; justify-content: center; }
        .pj-nav-btn-next:hover { background: #d1fae5; border-color: #10b981; }

        .pj-unverified-card {
          background: white; border: 1.5px solid #fecaca;
          border-radius: 16px; padding: 24px; text-align: center;
        }
        .pj-unverified-card p      { font-size: 14px; color: #dc2626; margin-bottom: 14px; line-height: 1.6; }
        .pj-unverified-card button {
          padding: 10px 22px; background: #fef2f2; color: #991b1b;
          border: 1.5px solid #fca5a5; border-radius: 10px; font-size: 14px;
          font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.2s;
        }
        .pj-unverified-card button:hover { background: #fca5a5; }

        .pj-info-note {
          padding: 14px 16px; background: #f0fdf4; border: 1px solid #bbf7d0;
          border-radius: 12px; font-size: 13px; color: #15803d;
          display: flex; gap: 10px; align-items: flex-start; line-height: 1.55;
        }

        .pj-unpaid-note {
          padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0;
          border-radius: 12px; font-size: 14px; color: #64748b; line-height: 1.6;
        }

        .pj-transparency-note {
          margin-top: 16px; padding: 14px 16px; background: #f0fdf4;
          border: 1px solid #bbf7d0; border-radius: 10px; font-size: 13px;
          color: #15803d; display: flex; gap: 10px; align-items: flex-start;
        }

        @media (max-width: 900px) {
          .pj-main-grid { grid-template-columns: 1fr; }
          .pj-sidebar   { position: static; }
          .pj-grid-2    { grid-template-columns: 1fr; }
          .pj-header-left h1 { font-size: 26px; }
          .pj-tabs { overflow-x: auto; }
          .pj-tab  { min-width: 100px; font-size: 13px; }
        }
        @media (max-width: 480px) {
          .pj-layout { padding: 24px 16px 60px; }
          .pj-header-left h1 { font-size: 22px; }
          .pj-card { padding: 20px; }
          .pj-type-pills-wrap { gap: 6px; }
          .pj-type-pill { font-size: 12px; padding: 7px 12px; }
        }
      `}</style>

      <Navbar />

      <div className="pj-root">
        <div className="pj-layout">

          {/* Back */}
          <button type="button" className="pj-back" onClick={() => navigate(dashboardPath)}>
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>

          {/* Header */}
          <div className="pj-header">
            <div className="pj-header-left">
              <h1>{existingJob ? "Edit Job Listing" : "Post a New Job"}</h1>
              <p>
                {existingJob
                  ? "Update your job posting details"
                  : "Create a role and define your entire hiring pipeline"}
              </p>
            </div>

            <div className={`pj-verify-pill ${isVerified ? "verified" : "unverified"}`}>
              {isVerified ? (
                <>
                  <span className="pill-dot" />
                  <ShieldCheck size={14} />
                  {isBusinessOwner ? "Approved Business" : "Verified Recruiter"}
                </>
              ) : (
                <>
                  <XCircle size={14} />
                  {isBusinessOwner
                    ? businessStatus === "pending"
                      ? "Business Pending Approval"
                      : "Business Not Approved"
                    : verificationStatus === "pending"
                      ? "Verification Pending"
                      : "Not Verified"}
                </>
              )}
            </div>
          </div>

          {/* Live banner */}
          {existingJob?.status === "approved" && (
            <div className="pj-live-banner">
              <div className="pj-live-banner-left">
                <span className="pj-live-dot" />
                <div>
                  <strong>This job is currently LIVE</strong>
                  <span>Visible to all job seekers on the platform</span>
                </div>
              </div>
              <button
                type="button"
                className="pj-takedown-btn"
                onClick={handleTakeDown}
                disabled={takingDown}
                style={{ width: "auto", minWidth: 148 }}
              >
                {takingDown
                  ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />Taking Down…</>
                  : <><EyeOff size={14} />Take Job Down</>}
              </button>
            </div>
          )}

          {/* Progress bar */}
          {!existingJob && (
            <div className="pj-progress-wrap">
              <div className="pj-progress-label">
                <span>Form Progress</span>
                <span>{progressPct}%</span>
              </div>
              <div className="pj-progress-track">
                <div className="pj-progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="pj-tabs">
            {sections.map(s => {
              const Icon = s.icon;
              return (
                <button
                  type="button"
                  key={s.id}
                  className={`pj-tab ${activeSection === s.id ? "active" : ""}`}
                  onClick={() => setActiveSection(s.id)}
                >
                  <Icon size={15} />{s.label}
                </button>
              );
            })}
          </div>

          {/* Main grid */}
          <div className="pj-main-grid">
            <div>

              {/* ── BASICS ── */}
              {activeSection === "basics" && (
                <div className="pj-card">
                  <div className="pj-card-title">Core Details</div>
                  <div className="pj-card-subtitle">What's the role and where is it based?</div>

                  {/* Title */}
                  <div className="pj-field">
                    <label className="pj-label">Job Title <span>*</span></label>
                    <input
                      value={form.title}
                      onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                      className={`pj-input ${formErrors.title ? "error" : ""}`}
                      placeholder="e.g. Solar Installation Technician"
                      disabled={loading || !isVerified}
                    />
                    {formErrors.title && (
                      <span className="pj-error-msg"><AlertCircle size={12} />{formErrors.title}</span>
                    )}
                  </div>

                  {/* Company + Location */}
                  <div className="pj-grid-2">
                    <div className="pj-field">
                      <label className="pj-label">Company Name</label>
                      <input
                        value={form.company}
                        onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
                        className="pj-input"
                        placeholder="Your company / business name"
                        disabled={loading || !isVerified}
                      />
                      {(isBusinessOwner
                        ? user?.businessProfile?.businessName
                        : user?.recruiterProfile?.companyName) && (
                        <span className="pj-hint">✓ Auto-filled from your profile</span>
                      )}
                    </div>
                    <div className="pj-field">
                      <label className="pj-label">Location <span>*</span></label>
                      <input
                        value={form.location}
                        onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                        className={`pj-input ${formErrors.location ? "error" : ""}`}
                        placeholder="e.g. Delhi / Remote"
                        disabled={loading || !isVerified}
                      />
                      {formErrors.location && (
                        <span className="pj-error-msg"><AlertCircle size={12} />{formErrors.location}</span>
                      )}
                    </div>
                  </div>

                  {/* ── Employment Type (multi-select pills) ── */}
                  <div className="pj-field">
                    <label className="pj-label">
                      Employment Type <span>*</span>
                      <span style={{ textTransform: "none", fontWeight: 400, color: "#94a3b8", marginLeft: 6, fontSize: 11 }}>
                        (select all that apply)
                      </span>
                    </label>

                    <div className="pj-type-pills-wrap">
                      {JOB_CATEGORIES.map(cat => {
                        const isSelected = form.type.includes(cat);
                        return (
                          <button
                            key={cat}
                            type="button"
                            className={`pj-type-pill ${isSelected ? "active" : ""}`}
                            onClick={() => toggleType(cat)}
                            disabled={loading || !isVerified}
                          >
                            {isSelected && (
                              <span className="pill-check">
                                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                  <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </span>
                            )}
                            {cat}
                          </button>
                        );
                      })}
                    </div>

                    {form.type.length === 0 && (
                      <span className="pj-type-error">
                        <AlertCircle size={12} />Select at least one employment type
                      </span>
                    )}
                    {form.type.length > 0 && (
                      <span className="pj-type-count">
                        <strong>{form.type.length}</strong> selected: {form.type.join(" · ")}
                      </span>
                    )}
                    {formErrors.type && (
                      <span className="pj-error-msg"><AlertCircle size={12} />{formErrors.type}</span>
                    )}
                  </div>

                  {/* Skills */}
                  <div className="pj-field">
                    <label className="pj-label">Required Skills</label>

                    {form.skills.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                        {form.skills.map((s, i) => (
                          <span key={i} className="pj-skill-tag">
                            {s}
                            <button type="button" onClick={() => handleRemoveSkill(s)} className="pj-remove-skill">
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>Suggestions</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {skillSuggestions.filter(s => !form.skills.includes(s)).slice(0, 12).map((skill, i) => (
                          <button key={i} type="button" onClick={() => handleAddSkill(skill)} className="pj-suggestion-tag">
                            {skill}
                          </button>
                        ))}
                      </div>
                    </div>

                    <input
                      type="text"
                      value={skillInput}
                      onChange={e => setSkillInput(e.target.value)}
                      onKeyPress={handleSkillKeyPress}
                      className="pj-input"
                      placeholder="Type a custom skill and press Enter"
                      disabled={loading || !isVerified}
                    />
                    <span className="pj-hint">Press Enter to add custom skills</span>
                  </div>

                  {/* Description */}
                  <div className="pj-field">
                    <label className="pj-label">Job Description <span>*</span></label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                      className={`pj-textarea ${formErrors.description ? "error" : ""}`}
                      placeholder="Describe the role, responsibilities, and what makes this opportunity exciting…"
                      rows={7}
                      disabled={loading || !isVerified}
                    />
                    {formErrors.description && (
                      <span className="pj-error-msg"><AlertCircle size={12} />{formErrors.description}</span>
                    )}
                    <span className="pj-hint">{form.description.length} / 5000 chars · min 50 required</span>
                  </div>
                </div>
              )}

              {/* ── COMPENSATION ── */}
              {activeSection === "compensation" && (
                <div className="pj-card">
                  <div className="pj-card-title">Compensation</div>
                  <div className="pj-card-subtitle">Is this role paid or voluntary?</div>

                  <div className="pj-field">
                    <label className="pj-label">Payment Type <span>*</span></label>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        type="button"
                        className={`pj-comp-chip paid ${form.isPaid ? "active" : ""}`}
                        onClick={() => setForm(p => ({ ...p, isPaid: true }))}
                      >
                        <RupeeIcon size={14} />Paid Role
                      </button>
                      <button
                        type="button"
                        className={`pj-comp-chip unpaid ${!form.isPaid ? "active" : ""}`}
                        onClick={() => setForm(p => ({ ...p, isPaid: false, stipend: "" }))}
                      >
                        <Gift size={14} />Unpaid / Volunteer
                      </button>
                    </div>
                  </div>

                  {form.isPaid ? (
                    <div className="pj-field" style={{ animation: "fadeIn 0.3s ease" }}>
                      <label className="pj-label">Stipend / Salary <span>*</span></label>
                      <div className="pj-stipend-group">
                        <input
                          value={form.stipend}
                          onChange={e => setForm(p => ({ ...p, stipend: e.target.value }))}
                          className={`pj-input ${formErrors.stipend ? "error" : ""}`}
                          placeholder="e.g. ₹15,000 or ₹8–12 LPA"
                          disabled={loading || !isVerified}
                        />
                        <select
                          value={form.stipendPeriod}
                          onChange={e => setForm(p => ({ ...p, stipendPeriod: e.target.value }))}
                          className="pj-select"
                          disabled={loading || !isVerified}
                        >
                          <option value="monthly">/ Month</option>
                          <option value="yearly">/ Year</option>
                          <option value="weekly">/ Week</option>
                          <option value="hourly">/ Hour</option>
                          <option value="project">/ Project</option>
                        </select>
                      </div>
                      {formErrors.stipend && (
                        <span className="pj-error-msg"><AlertCircle size={12} />{formErrors.stipend}</span>
                      )}
                      <span className="pj-hint">Be specific — clear pay attracts better candidates</span>
                    </div>
                  ) : (
                    <div className="pj-unpaid-note">
                      This role will be listed as{" "}
                      <strong style={{ color: "#0f172a" }}>Unpaid / Volunteer</strong>.
                      Candidates will see this clearly on the job card.
                    </div>
                  )}
                </div>
              )}

              {/* ── ROUNDS ── */}
              {activeSection === "rounds" && (
                <div className="pj-card">
                  <div className="pj-card-title">Hiring Process</div>
                  <div className="pj-card-subtitle">
                    Define each round — candidates can see what to expect before applying
                  </div>

                  {formErrors.rounds && (
                    <div className="pj-error-msg" style={{ marginBottom: 16 }}>
                      <AlertCircle size={14} />{formErrors.rounds}
                    </div>
                  )}

                  <div className="pj-rounds-list">
                    {form.rounds.map((round, idx) => {
                      const roundMeta = ROUND_TYPES.find(t => t.value === round.type) || ROUND_TYPES[0];
                      return (
                        <div key={round.id} className="pj-round-card">
                          <div className="pj-round-header" onClick={() => toggleRound(round.id)}>
                            <div className="pj-round-num">{idx + 1}</div>
                            <div className="pj-round-type-icon">{roundMeta.icon}</div>
                            <div className="pj-round-info">
                              <div className="pj-round-info-title">{round.title || roundMeta.label}</div>
                              {round.duration && (
                                <div className="pj-round-info-sub">
                                  <Clock size={10} style={{ display: "inline", marginRight: 4 }} />
                                  {round.duration}
                                </div>
                              )}
                            </div>
                            <div className="pj-round-actions" onClick={e => e.stopPropagation()}>
                              <button
                                type="button"
                                className="pj-round-action-btn"
                                onClick={() => moveRound(idx, -1)}
                                disabled={idx === 0}
                              >
                                <ChevronUp size={14} />
                              </button>
                              <button
                                type="button"
                                className="pj-round-action-btn"
                                onClick={() => moveRound(idx, 1)}
                                disabled={idx === form.rounds.length - 1}
                              >
                                <ChevronDown size={14} />
                              </button>
                              <button
                                type="button"
                                className="pj-round-action-btn danger"
                                onClick={() => removeRound(round.id)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div style={{ color: "#cbd5e1", marginLeft: 4 }}>
                              {round.expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </div>

                          {round.expanded && (
                            <div className="pj-round-body">
                              <div>
                                <label className="pj-label" style={{ display: "block", marginBottom: 10, marginTop: 14 }}>
                                  Round Type
                                </label>
                                <div className="pj-type-grid">
                                  {ROUND_TYPES.map(t => (
                                    <button
                                      key={t.value}
                                      type="button"
                                      className={`pj-type-opt ${round.type === t.value ? "active" : ""}`}
                                      onClick={() => updateRound(round.id, "type", t.value)}
                                    >
                                      <span>{t.icon}</span>{t.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="pj-grid-2">
                                <div>
                                  <label className="pj-label" style={{ marginBottom: 6, display: "block" }}>
                                    Custom Title (optional)
                                  </label>
                                  <input
                                    value={round.title}
                                    onChange={e => updateRound(round.id, "title", e.target.value)}
                                    className="pj-input"
                                    placeholder={roundMeta.label}
                                  />
                                </div>
                                <div>
                                  <label className="pj-label" style={{ marginBottom: 6, display: "block" }}>
                                    Duration / Timeframe
                                  </label>
                                  <input
                                    value={round.duration}
                                    onChange={e => updateRound(round.id, "duration", e.target.value)}
                                    className="pj-input"
                                    placeholder="e.g. 45 mins, 2 days"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="pj-label" style={{ marginBottom: 6, display: "block" }}>
                                  Round Description
                                </label>
                                <textarea
                                  value={round.description}
                                  onChange={e => updateRound(round.id, "description", e.target.value)}
                                  className="pj-textarea"
                                  placeholder="What will candidates do in this round?"
                                  rows={3}
                                  style={{ minHeight: 90 }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {form.rounds.length < 10 && (
                    <button type="button" className="pj-add-round-btn" onClick={addRound}>
                      <Plus size={16} />Add Another Round
                    </button>
                  )}

                  <div className="pj-transparency-note">
                    <Award size={16} color="#15803d" style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>
                      Candidates can see your full hiring pipeline before they apply.
                      Transparency helps attract serious applicants.
                    </span>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                {activeSection !== "basics" && (
                  <button type="button" className="pj-nav-btn pj-nav-btn-prev" onClick={goPrev}>
                    ← Previous
                  </button>
                )}
                {activeSection !== "rounds" ? (
                  <button type="button" className="pj-nav-btn pj-nav-btn-next" onClick={goNext}>
                    Next →
                  </button>
                ) : (
                  <button
                    type="button"
                    className="pj-submit-btn"
                    onClick={handleSubmit}
                    disabled={loading || !isVerified || !isFormValid()}
                    style={{ flex: 1 }}
                  >
                    {loading ? (
                      <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />Submitting…</>
                    ) : !isVerified ? (
                      isBusinessOwner
                        ? businessStatus === "pending"
                          ? "⏳ Business Pending Approval"
                          : "🔒 Business Not Approved"
                        : verificationStatus === "pending"
                          ? "⏳ Verification Pending"
                          : "🔒 Verification Required"
                    ) : !isFormValid() ? (
                      "Complete Required Fields"
                    ) : existingJob ? (
                      "Update Job Listing"
                    ) : (
                      "Post Job Live"
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* ── Sidebar ── */}
            <div className="pj-sidebar">
              {isVerified ? (
                <div className="pj-summary-card">
                  <h3><Eye size={14} />Job Preview</h3>

                  {/* Role */}
                  <div className="pj-summary-item">
                    <div className="pj-summary-icon"><Briefcase size={14} color="#10b981" /></div>
                    <div>
                      <div className="pj-summary-label">Role</div>
                      <div className="pj-summary-value">{form.title || "—"}</div>
                    </div>
                  </div>

                  {/* Type — rendered as tags when multiple */}
                  <div className="pj-summary-item">
                    <div className="pj-summary-icon"><Clock size={14} color="#10b981" /></div>
                    <div>
                      <div className="pj-summary-label">Type</div>
                      {form.type.length === 0 ? (
                        <div className="pj-summary-value" style={{ color: "#cbd5e1" }}>—</div>
                      ) : form.type.length === 1 ? (
                        <div className="pj-summary-value">{form.type[0]}</div>
                      ) : (
                        <div className="pj-type-tags">
                          {form.type.map(t => (
                            <span key={t} className="pj-type-tag">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="pj-summary-item">
                    <div className="pj-summary-icon"><MapPin size={14} color="#10b981" /></div>
                    <div>
                      <div className="pj-summary-label">Location</div>
                      <div className="pj-summary-value">{form.location || "—"}</div>
                    </div>
                  </div>

                  {/* Pay */}
                  <div className="pj-summary-item">
                    <div className="pj-summary-icon"><RupeeIcon size={14} color="#10b981" /></div>
                    <div>
                      <div className="pj-summary-label">Pay</div>
                      <div className="pj-summary-value">
                        {form.isPaid
                          ? form.stipend
                            ? `${form.stipend} / ${form.stipendPeriod}`
                            : "Paid (TBD)"
                          : "Unpaid / Volunteer"}
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="pj-summary-item">
                    <div className="pj-summary-icon"><Users size={14} color="#10b981" /></div>
                    <div>
                      <div className="pj-summary-label">Skills</div>
                      <div className="pj-summary-value">
                        {form.skills.length > 0 ? `${form.skills.length} skills` : "None listed"}
                      </div>
                    </div>
                  </div>

                  {/* Rounds */}
                  <div className="pj-summary-item">
                    <div className="pj-summary-icon"><Layers size={14} color="#10b981" /></div>
                    <div>
                      <div className="pj-summary-label">Rounds</div>
                      <div className="pj-summary-value">
                        {form.rounds.length} stage{form.rounds.length !== 1 ? "s" : ""}
                        {form.rounds.length > 0 && (
                          <div style={{ marginTop: 6 }}>
                            {form.rounds.map((r, i) => {
                              const meta = ROUND_TYPES.find(t => t.value === r.type) || ROUND_TYPES[0];
                              return (
                                <div
                                  key={r.id}
                                  style={{
                                    fontSize: 11, color: "#64748b",
                                    display: "flex", alignItems: "center",
                                    gap: 5, marginTop: 4,
                                  }}
                                >
                                  <span style={{
                                    width: 16, height: 16, background: "#d1fae5",
                                    borderRadius: "50%", display: "inline-flex",
                                    alignItems: "center", justifyContent: "center",
                                    fontSize: 9, fontWeight: 700, color: "#065f46", flexShrink: 0,
                                  }}>
                                    {i + 1}
                                  </span>
                                  {meta.icon} {r.title || meta.label}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pj-unverified-card">
                  <XCircle size={32} color="#dc2626" style={{ margin: "0 auto 12px", display: "block" }} />
                  <p>
                    {isBusinessOwner
                      ? businessStatus === "pending"
                        ? "Your business is under admin review. You can post jobs once approved."
                        : "Your business must be approved by admin before posting jobs."
                      : verificationStatus === "pending"
                        ? "Your profile is under admin review. You can post jobs once approved."
                        : "Your profile must be verified by admin before posting jobs."}
                  </p>
                  <button type="button" onClick={() => navigate(dashboardPath)}>
                    Go to Dashboard →
                  </button>
                </div>
              )}

              {existingJob?.status === "approved" && (
                <button
                  type="button"
                  className="pj-takedown-btn"
                  onClick={handleTakeDown}
                  disabled={takingDown}
                >
                  {takingDown
                    ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />Taking Down…</>
                    : <><EyeOff size={14} />Take Job Offline</>}
                </button>
              )}

              <div className="pj-info-note">
                <FileText size={14} color="#15803d" style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  {isBusinessOwner
                    ? "As an approved business, jobs you post go live immediately — no additional approvals needed."
                    : "As a verified recruiter, jobs you post go live immediately — no additional approvals needed."}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default PostJob;