import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Navbar from "../components/common/Navbar";
import axios from "axios";
import API_BASE_URL from "../config/api";
import { useAuth } from "../context/AuthContext";
import {
  Search,
  Briefcase,
  MapPin,
  ExternalLink,
  Loader2,
  Building2,
  CheckCircle,
  X,
  Sparkles,
  Layers,
  Code2,
  ChevronDown,
  ChevronUp,
  Clock,
  Filter,
  Check,
  BookmarkCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

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

const getTypeArr = (type) => {
  if (Array.isArray(type)) return type.filter(Boolean);
  if (typeof type === "string" && type.trim()) return [type.trim()];
  return [];
};

const TYPE_COLORS = {
  "Full Time":  { bg: "#dbeafe", color: "#1e40af" },
  "Part Time":  { bg: "#ede9fe", color: "#6d28d9" },
  "Internship": { bg: "#fef3c7", color: "#92400e" },
  "Contract":   { bg: "#fee2e2", color: "#991b1b" },
  "Remote":     { bg: "#d1fae5", color: "#065f46" },
  "Freelance":  { bg: "#fce7f3", color: "#9d174d" },
};
const defaultTypeColor = { bg: "#f1f5f9", color: "#475569" };

// ── Unified Filter Panel ──────────────────────────────────────────────────────
const FilterPanel = ({
  open,
  onClose,
  selectedPay, setSelectedPay,
  skillFilter, setSkillFilter,
  allSkills, skillCounts,
  activeCount,
}) => {
  const [skillSearch, setSkillSearch] = useState("");
  const panelRef = useRef(null);

  // Close on outside click
useEffect(() => {
  if (!open) return;
  const handler = (e) => {
    if (panelRef.current && !panelRef.current.contains(e.target)) {
      if (filterBtnRef?.current && filterBtnRef.current.contains(e.target)) return; // ← add this
      onClose();
    }
  };
  document.addEventListener("mousedown", handler);
  return () => document.removeEventListener("mousedown", handler);
}, [open, onClose]);

  // Reset skill search when panel closes
  useEffect(() => {
    if (!open) setSkillSearch("");
  }, [open]);

  const filteredSkills = allSkills.filter((s) =>
    s.toLowerCase().includes(skillSearch.toLowerCase())
  );

  if (!open) return null;

  return (
    <div className="filter-panel" ref={panelRef}>
      {/* Compensation */}
      <div className="fp-section">
        <div className="fp-section-label">Compensation</div>
        <div className="fp-chips">
          {["All", "Paid", "Unpaid"].map((p) => (
            <button
              key={p}
              type="button"
              className={`fp-chip${selectedPay === p ? " active" : ""}`}
              onClick={() => setSelectedPay(p)}
            >
              {selectedPay === p && <Check size={11} />}
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="fp-divider" />

      {/* Skills */}
      <div className="fp-section">
        <div className="fp-section-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Filter by Skill</span>
          {skillFilter && (
            <button
              type="button"
              className="fp-clear-skill"
              onClick={() => setSkillFilter("")}
            >
              Clear ×
            </button>
          )}
        </div>
        <div className="fp-skill-search-wrap">
          <Search size={13} color="#9ca3af" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input
            className="fp-skill-search"
            placeholder="Search skills..."
            value={skillSearch}
            onChange={(e) => setSkillSearch(e.target.value)}
          />
        </div>
        <div className="fp-skill-list">
          {filteredSkills.length === 0 ? (
            <div className="fp-skill-empty">No skills found</div>
          ) : (
            filteredSkills.map((skill) => {
              const active = skillFilter.toLowerCase() === skill.toLowerCase();
              return (
                <div
                  key={skill}
                  className={`fp-skill-option${active ? " active" : ""}`}
                  onClick={() => {
                    setSkillFilter(active ? "" : skill);
                  }}
                >
                  <span>{skill}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {skillCounts[skill] && (
                      <span className="fp-skill-count">{skillCounts[skill]}</span>
                    )}
                    {active && <Check size={12} className="fp-skill-check" />}
                  </span>
                </div>
              );
            })
          )}
        </div>
        <div className="fp-skill-footer">
          {filteredSkills.length} of {allSkills.length} skills
        </div>
      </div>
    </div>
  );
};

const Jobs = () => {
  const { user, token } = useAuth();
  const isJobSeeker = user?.role === "jobseeker";

  // ── Core state ────────────────────────────────────────────────────────────
  const [jobs, setJobs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // ── Pagination ────────────────────────────────────────────────────────────
  const [page, setPage]       = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // ── Filters ───────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm]             = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [selectedType, setSelectedType]         = useState("All");
  const [selectedPay, setSelectedPay]           = useState("All");
  const [skillFilter, setSkillFilter]           = useState("");
  const [showFilters, setShowFilters]           = useState(false);
  const [showAppliedOnly, setShowAppliedOnly]   = useState(false);

  // ── Applied jobs ──────────────────────────────────────────────────────────
  const [appliedJobIds, setAppliedJobIds]   = useState(new Set());
  const [appliedLoading, setAppliedLoading] = useState(false);

  // ── UI ────────────────────────────────────────────────────────────────────
  const [expandedRounds, setExpandedRounds] = useState({});
  const [totalJobCount, setTotalJobCount] = useState(null);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const observerRef   = useRef(null);
  const filterBtnRef  = useRef(null);

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch applied jobs
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token || !isJobSeeker) return;
    const fetchApplied = async () => {
      setAppliedLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/applications/my`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 8000,
        });
        const apps = res.data?.applications || res.data || [];
        const ids = new Set(
          apps.map((a) => (typeof a.job === "object" ? a.job?._id : a.job)).filter(Boolean)
        );
        setAppliedJobIds(ids);
      } catch (err) {
        console.warn("Could not fetch applied jobs:", err.message);
      } finally {
        setAppliedLoading(false);
      }
    };
    fetchApplied();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────────────────────────
  // fetchJobs
  // ─────────────────────────────────────────────────────────────────────────
  const fetchJobs = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      const response = await axios.get(
        `${API_BASE_URL}/api/jobs/public?page=${pageNum}&limit=12`,
        { timeout: 10000 }
      );

      let newJobs = [];
      if (response.data.jobs && Array.isArray(response.data.jobs)) newJobs = response.data.jobs;
      else if (Array.isArray(response.data)) newJobs = response.data;

      if (!append && response.data.total) setTotalJobCount(response.data.total);

      const validJobs = newJobs.filter(
        (job) => job && job._id && job.title && job.status === "approved"
      );

      if (append) {
        setJobs((prev) => {
          const existingIds = new Set(prev.map((j) => j._id));
          return [...prev, ...validJobs.filter((job) => !existingIds.has(job._id))];
        });
      } else {
        setJobs(validJobs);
      }
      setHasMore(response.data.hasMore ?? validJobs.length === 12);
    } catch (err) {
      console.error("Fetch error:", err);
      setHasMore(false);
      if (!append) {
        try {
          const fallback = await axios.get(`${API_BASE_URL}/api/jobs`, { timeout: 5000 });
          const fallbackJobs = fallback.data.jobs || fallback.data || [];
          const valid = fallbackJobs.filter((job) => job.status === "approved");
          setJobs(valid);
        } catch {
          setError("No jobs available");
        }
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs(1, false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────────────────────────
  // Infinite scroll
  // ─────────────────────────────────────────────────────────────────────────
  const sentinelRef = useCallback((node) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (!node || !hasMore || loadingMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          setPage((prev) => {
            const next = prev + 1;
            fetchJobs(next, true);
            return next;
          });
        }
      },
      { threshold: 0.1, rootMargin: "150px" }
    );
    observerRef.current.observe(node);
  }, [hasMore, loadingMore, fetchJobs]);

  // ─────────────────────────────────────────────────────────────────────────
  // Client-side filtering
  // ─────────────────────────────────────────────────────────────────────────
  const filteredJobs = useMemo(() => {
    let filtered = jobs;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.title?.toLowerCase().includes(q) ||
          job.company?.toLowerCase().includes(q) ||
          job.location?.toLowerCase().includes(q) ||
          (job.skills || []).some((s) => s.toLowerCase().includes(q)) ||
          (job.business?.businessProfile?.businessName || "").toLowerCase().includes(q)
      );
    }

    if (selectedLocation !== "All")
      filtered = filtered.filter((job) => job.location === selectedLocation);

    if (selectedType !== "All")
      filtered = filtered.filter((job) => getTypeArr(job.type).includes(selectedType));

    if (selectedPay === "Paid")
      filtered = filtered.filter((job) => job.isPaid !== false);

    if (selectedPay === "Unpaid")
      filtered = filtered.filter((job) => job.isPaid === false);

    if (skillFilter.trim()) {
      const sq = skillFilter.toLowerCase();
      filtered = filtered.filter((job) => (job.skills || []).some((s) => s.toLowerCase().includes(sq)));
    }

    if (showAppliedOnly)
      filtered = filtered.filter((job) => appliedJobIds.has(job._id));

    return filtered;
  }, [searchTerm, selectedLocation, selectedType, selectedPay, skillFilter, showAppliedOnly, appliedJobIds, jobs]);

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────
  const resetFilters = () => {
    setSearchTerm("");
    setSelectedLocation("All");
    setSelectedType("All");
    setSelectedPay("All");
    setSkillFilter("");
    setShowAppliedOnly(false);
    setPage(1);
    fetchJobs(1, false);
  };

  const toggleRounds = (jobId) =>
    setExpandedRounds((prev) => ({ ...prev, [jobId]: !prev[jobId] }));

  const locations = Array.from(new Set(jobs.map((job) => job.location))).sort().filter(Boolean);
  const types     = Array.from(new Set(jobs.flatMap((job) => getTypeArr(job.type)))).sort().filter(Boolean);
  const allSkills = Array.from(new Set(jobs.flatMap((j) => j.skills || []).filter(Boolean))).sort();

  const skillCounts = allSkills.reduce((acc, skill) => {
    acc[skill] = jobs.filter((j) =>
      (j.skills || []).some((s) => s.toLowerCase() === skill.toLowerCase())
    ).length;
    return acc;
  }, {});

  // Count active advanced filters (pay + skill)
  const advancedActiveCount =
    (selectedPay !== "All" ? 1 : 0) + (skillFilter ? 1 : 0);

  const hasActiveFilters =
    searchTerm || selectedLocation !== "All" || selectedType !== "All" ||
    selectedPay !== "All" || skillFilter || showAppliedOnly;

  const formatPay = (job) => {
    if (!job.isPaid) return { label: "Unpaid", color: "#64748b", bg: "#f1f5f9", border: "#e2e8f0" };
    if (job.stipend) {
      const period = { monthly: "/mo", yearly: "/yr", weekly: "/wk", hourly: "/hr", project: "/project" };
      return { label: `₹${job.stipend} ${period[job.stipendPeriod] || ""}`.trim(), color: "#065f46", bg: "#d1fae5", border: "#6ee7b7" };
    }
    if (job.salary) return { label: job.salary.startsWith("₹") ? job.salary : `₹${job.salary}`, color: "#065f46", bg: "#d1fae5", border: "#6ee7b7" };
    return { label: "Paid", color: "#065f46", bg: "#d1fae5", border: "#6ee7b7" };
  };

  const appliedCount = jobs.filter((j) => appliedJobIds.has(j._id)).length;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html { overflow-x: hidden; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #f8fafc; color: #0f172a; overflow-x: hidden; }

        @keyframes pulse  { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes panelIn { from { opacity: 0; transform: translateY(-8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }

        .jobs-wrapper { background: #f8fafc; min-height: 100vh; width: 100%; overflow-x: hidden; }

        .hero-section {
          background: linear-gradient(160deg, #052e16 0%, #14532d 50%, #166534 100%);
          padding: 64px 24px 88px; position: relative; overflow: visible; width: 100%;
        }
        .hero-section::before {
          content: ''; position: absolute; width: 500px; height: 500px;
          border-radius: 50%; border: 1px solid rgba(255,255,255,0.06);
          top: -200px; left: -180px; pointer-events: none;
        }
        .hero-section::after {
          content: ''; position: absolute; width: 350px; height: 350px;
          border-radius: 50%; border: 1px solid rgba(255,255,255,0.06);
          top: 40px; right: -120px; pointer-events: none;
        }
        .hero-glow { position: absolute; inset: 0; background: radial-gradient(circle at 70% 20%, rgba(16,185,129,0.15) 0%, transparent 60%); pointer-events: none; }
        .hero-container { max-width: 900px; margin: 0 auto; text-align: center; position: relative; z-index: 1; }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 16px; background: rgba(16,185,129,0.1);
          border: 1px solid rgba(16,185,129,0.2); border-radius: 50px;
          color: #10b981; font-size: 13px; font-weight: 600; margin-bottom: 24px;
        }
        .hero-title { font-size: 40px; font-weight: 700; color: white; margin-bottom: 16px; line-height: 1.2; }
        .hero-subtitle { font-size: 17px; color: #94a3b8; max-width: 600px; margin: 0 auto 40px; }

        /* ── Search Box ── */
        .search-container { max-width: 900px; margin: 0 auto; position: relative; z-index: 10; width: 100%; }
        .search-box {
          background: white; border-radius: 12px; padding: 8px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          display: flex; gap: 8px; flex-wrap: wrap; width: 100%;
        }
        .search-input-wrapper { flex: 1 1 200px; position: relative; min-width: 0; }
        .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); pointer-events: none; z-index: 1; }
        .search-input {
          width: 100%; padding: 13px 14px 13px 44px; font-size: 14px;
          background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
          outline: none; transition: border-color 0.2s, box-shadow 0.2s;
          font-family: 'Inter', sans-serif; color: #0f172a;
        }
        .search-input::placeholder { color: #94a3b8; }
        .search-input:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }
        .search-select {
          flex: 0 0 auto; padding: 13px 14px; font-size: 14px;
          background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
          color: #475569; cursor: pointer; outline: none;
          font-weight: 500; font-family: 'Inter', sans-serif; min-width: 0; max-width: 100%;
        }
        .search-select:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }

        /* ── Filter Toggle Button (unified) ── */
        .filter-toggle-wrap { position: relative; flex: 0 0 auto; }
        .filter-toggle-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 13px 16px; font-size: 14px; font-weight: 600;
          color: #475569; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
          cursor: pointer; font-family: 'Inter', sans-serif;
          transition: border-color 0.2s, color 0.2s, background 0.2s; white-space: nowrap;
          position: relative;
        }
        .filter-toggle-btn:hover { border-color: #10b981; color: #10b981; background: #f0fdf4; }
        .filter-toggle-btn.active { border-color: #10b981; color: #10b981; background: #f0fdf4; }
        .filter-badge {
          min-width: 18px; height: 18px; padding: 0 5px;
          background: #10b981; color: white;
          font-size: 11px; font-weight: 700; border-radius: 100px;
          display: inline-flex; align-items: center; justify-content: center;
          line-height: 1;
        }

        /* ── Unified Filter Panel ── */
        .filter-panel {
          position: absolute; top: calc(100% + 8px); right: 0; z-index: 99999;
          background: white; border: 1.5px solid #e2e8f0; border-radius: 14px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
          width: 280px; overflow: hidden;
          animation: panelIn 0.18s cubic-bezier(0.16,1,0.3,1);
        }
        .fp-section { padding: 16px; }
        .fp-section-label {
          font-size: 11px; font-weight: 700; color: #64748b;
          text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 10px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .fp-chips { display: flex; gap: 6px; flex-wrap: wrap; }
        .fp-chip {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 14px; border-radius: 100px; font-size: 13px; font-weight: 600;
          cursor: pointer; border: 1px solid #e2e8f0; background: #f8fafc; color: #64748b;
          font-family: 'Inter', sans-serif; transition: all 0.18s;
        }
        .fp-chip:hover { border-color: #6ee7b7; color: #065f46; background: #f0fdf4; }
        .fp-chip.active { background: #d1fae5; border-color: #6ee7b7; color: #065f46; }
        .fp-divider { height: 1px; background: #f1f5f9; margin: 0; }
        .fp-clear-skill {
          font-size: 11px; font-weight: 600; color: #9ca3af;
          background: none; border: none; cursor: pointer;
          font-family: 'Inter', sans-serif; padding: 2px 4px;
          transition: color 0.15s; border-radius: 4px;
        }
        .fp-clear-skill:hover { color: #dc2626; background: #fef2f2; }
        .fp-skill-search-wrap { position: relative; margin-bottom: 8px; }
        .fp-skill-search {
          width: 100%; padding: 8px 10px 8px 32px; font-size: 13px;
          background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
          outline: none; font-family: 'Inter', sans-serif; color: #0f172a;
          transition: border-color 0.15s;
        }
        .fp-skill-search:focus { border-color: #10b981; }
        .fp-skill-search::placeholder { color: #9ca3af; }
        .fp-skill-list {
          max-height: 200px; overflow-y: auto;
          scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent;
        }
        .fp-skill-list::-webkit-scrollbar { width: 4px; }
        .fp-skill-list::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
        .fp-skill-option {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 10px; border-radius: 8px; cursor: pointer;
          font-size: 13px; font-weight: 500; color: #374151;
          transition: background 0.12s; user-select: none;
        }
        .fp-skill-option:hover { background: #f8fafc; }
        .fp-skill-option.active { background: #d1fae5; color: #065f46; font-weight: 700; }
        .fp-skill-check { color: #10b981; flex-shrink: 0; }
        .fp-skill-count {
          font-size: 11px; color: #9ca3af; font-weight: 500;
          background: #f1f5f9; padding: 1px 6px; border-radius: 10px;
        }
        .fp-skill-option.active .fp-skill-count { background: rgba(16,185,129,0.15); color: #065f46; }
        .fp-skill-empty { padding: 16px; text-align: center; font-size: 13px; color: #9ca3af; }
        .fp-skill-footer {
          padding: 8px 0 0; font-size: 11px; color: #9ca3af; font-weight: 500; text-align: right;
        }

        /* ── Active filter tags (shown in search bar area) ── */
        .active-filter-tags {
          max-width: 900px; margin: 8px auto 0;
          display: flex; flex-wrap: wrap; gap: 6px; align-items: center; width: 100%;
        }
        .active-tag {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px 4px 12px; border-radius: 50px;
          background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2);
          color: white; font-size: 12px; font-weight: 600;
        }
        .active-tag button {
          background: none; border: none; cursor: pointer; display: flex; align-items: center;
          color: rgba(255,255,255,0.7); padding: 0; margin-left: 2px; transition: color 0.15s;
        }
        .active-tag button:hover { color: white; }

        /* ── Applied filter button ── */
        .applied-filter-btn {
          flex: 0 0 auto; display: flex; align-items: center; gap: 7px;
          padding: 13px 16px; font-size: 14px; font-weight: 600;
          background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
          cursor: pointer; font-family: 'Inter', sans-serif;
          transition: all 0.2s; white-space: nowrap; color: #475569;
        }
        .applied-filter-btn:hover { border-color: #6ee7b7; color: #065f46; background: #f0fdf4; }
        .applied-filter-btn.active { background: #d1fae5; border-color: #6ee7b7; color: #065f46; }
        .applied-filter-btn .applied-count {
          background: #10b981; color: white;
          font-size: 11px; font-weight: 700;
          padding: 1px 7px; border-radius: 100px; line-height: 1.6;
        }
        .applied-filter-btn.active .applied-count { background: #065f46; }

        .clear-btn {
          flex: 0 0 auto; padding: 13px 18px; font-size: 14px; font-weight: 600;
          color: #64748b; background: white; border: 1px solid #e2e8f0; border-radius: 8px;
          cursor: pointer; display: flex; align-items: center; gap: 6px;
          transition: background 0.2s, color 0.2s; font-family: 'Inter', sans-serif; white-space: nowrap;
        }
        .clear-btn:hover { background: #f8fafc; color: #475569; }

        /* ── Stats bar ── */
        .stats-bar { max-width: 1200px; margin: -24px auto 36px; padding: 0 24px; position: relative; z-index: 5; }
        .stats-card {
          background: white; border: 1px solid #e2e8f0; border-radius: 10px;
          padding: 14px 20px; display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
          font-size: 14px; box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .stat-item { color: #64748b; white-space: nowrap; }
        .stat-value { font-weight: 700; color: #0f172a; }
        .stat-divider { color: #e2e8f0; }
        .verified-badge { margin-left: auto; color: #10b981; font-weight: 600; display: flex; align-items: center; gap: 6px; font-size: 13px; white-space: nowrap; }
        .applied-stat {
          display: inline-flex; align-items: center; gap: 6px;
          background: #d1fae5; border: 1px solid #6ee7b7;
          padding: 3px 10px; border-radius: 100px;
          color: #065f46; font-size: 12px; font-weight: 700; cursor: pointer;
        }

        /* ── Jobs grid ── */
        .jobs-container { max-width: 1200px; margin: 0 auto; padding: 0 24px 80px; width: 100%; }
        .jobs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }

        .job-card {
          background: white; border: 1px solid #e2e8f0; border-radius: 14px;
          padding: 22px; transition: border-color 0.2s, box-shadow 0.2s;
          display: flex; flex-direction: column; animation: fadeUp 0.3s ease;
          min-width: 0; overflow: hidden; position: relative;
        }
        .job-card:hover { border-color: #10b981; box-shadow: 0 4px 24px rgba(16,185,129,0.1); }
        .job-card.applied {
          border-color: #6ee7b7;
          background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 80px);
        }
        .job-card.applied:hover { border-color: #10b981; box-shadow: 0 4px 24px rgba(16,185,129,0.15); }

        .applied-ribbon {
          position: absolute; top: 0; right: 0;
          background: #10b981; color: white;
          font-size: 10px; font-weight: 700;
          padding: 4px 12px 4px 10px;
          border-radius: 0 14px 0 10px;
          display: flex; align-items: center; gap: 4px;
          letter-spacing: 0.3px; text-transform: uppercase;
        }

        .job-tags { display: flex; gap: 5px; margin-bottom: 14px; flex-wrap: wrap; align-items: center; }
        .job-tag {
          padding: 3px 9px; border-radius: 6px; font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.4px; white-space: nowrap; line-height: 1.5;
        }
        .tag-live { background: #d1fae5; color: #065f46; display: flex; align-items: center; gap: 4px; }
        .live-dot { width: 6px; height: 6px; background: #10b981; border-radius: 50%; animation: pulse 2s infinite; flex-shrink: 0; }
        .tag-pay {
          padding: 3px 9px; border-radius: 6px; font-size: 11px; font-weight: 700;
          display: flex; align-items: center; gap: 4px; border: 1px solid transparent;
          white-space: nowrap; text-transform: uppercase; letter-spacing: 0.4px;
        }

        .job-title { font-size: 17px; font-weight: 700; color: #0f172a; margin-bottom: 14px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; transition: color 0.2s; word-break: break-word; }
        .job-card:hover .job-title { color: #10b981; }
        .job-company { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; min-width: 0; }
        .company-logo { width: 38px; height: 38px; flex-shrink: 0; background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .company-info { flex: 1; min-width: 0; }
        .company-name { font-size: 14px; font-weight: 600; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .company-verified { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #10b981; margin-top: 2px; }
        .job-meta { display: flex; gap: 10px; font-size: 13px; color: #64748b; margin-bottom: 14px; flex-wrap: wrap; }
        .job-meta-item { display: flex; align-items: center; gap: 5px; white-space: nowrap; }
        .job-skills { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
        .job-skill-pill { padding: 3px 10px; border-radius: 100px; font-size: 12px; font-weight: 500; background: #f1f5f9; border: 1px solid #e2e8f0; color: #475569; cursor: pointer; transition: border-color 0.15s, color 0.15s; white-space: nowrap; }
        .job-skill-pill:hover { border-color: #10b981; color: #10b981; }
        .job-skill-pill.highlighted { background: #d1fae5; border-color: #6ee7b7; color: #065f46; }
        .job-skill-more { font-size: 12px; color: #94a3b8; padding: 3px 0; }
        .job-divider { height: 1px; background: #f1f5f9; margin: 12px 0; }
        .job-rounds-toggle { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0; cursor: pointer; font-size: 13px; font-weight: 600; color: #475569; font-family: 'Inter', sans-serif; transition: all 0.2s; width: 100%; text-align: left; }
        .job-rounds-toggle:hover { background: #f0fdf4; border-color: #6ee7b7; color: #065f46; }
        .job-rounds-list { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; margin-bottom: 4px; }
        .job-round-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border-radius: 8px; background: #f8fafc; border: 1px solid #f1f5f9; }
        .job-round-num { width: 22px; height: 22px; flex-shrink: 0; border-radius: 50%; background: #0f172a; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: white; margin-top: 1px; }
        .job-round-info { flex: 1; min-width: 0; }
        .job-round-title { font-size: 13px; font-weight: 600; color: #0f172a; }
        .job-round-desc { font-size: 12px; color: #64748b; margin-top: 2px; line-height: 1.4; word-break: break-word; }
        .job-round-dur { display: flex; align-items: center; gap: 3px; font-size: 11px; color: #94a3b8; margin-top: 4px; }
        .job-actions { display: flex; gap: 10px; padding-top: 14px; margin-top: auto; }
        .btn-view { flex: 1; background: #0f172a; color: white; padding: 12px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.2s; text-decoration: none; font-family: 'Inter', sans-serif; white-space: nowrap; }
        .btn-view:hover { background: #10b981; }
        .job-card.applied .btn-view { background: #059669; }
        .job-card.applied .btn-view:hover { background: #047857; }

        .loading-state, .error-state, .empty-state { text-align: center; padding: 80px 24px; }
        .state-icon { width: 64px; height: 64px; margin: 0 auto 24px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .state-title { font-size: 20px; font-weight: 600; color: #0f172a; margin-bottom: 8px; }
        .state-description { font-size: 15px; color: #64748b; margin-bottom: 24px; }
        .state-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .btn-action { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 24px; background: #10b981; color: white; font-size: 14px; font-weight: 600; border: none; border-radius: 8px; cursor: pointer; transition: background 0.2s; font-family: 'Inter', sans-serif; white-space: nowrap; }
        .btn-action:hover { background: #059669; }
        .btn-action-secondary { background: #f1f5f9; color: #475569; }
        .btn-action-secondary:hover { background: #e2e8f0; }
        .load-more { text-align: center; padding: 40px 24px; }
        .load-more-text { font-size: 14px; color: #94a3b8; margin-top: 10px; }
        .spinner { animation: spin 1s linear infinite; }

        @media (max-width: 900px) {
          .hero-title { font-size: 32px; }
          .jobs-grid { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
        }
        @media (max-width: 768px) {
          .hero-section { padding: 36px 16px 72px; }
          .hero-title { font-size: 26px; }
          .hero-subtitle { font-size: 15px; margin-bottom: 28px; }
          .search-container { padding: 0; }
          .search-box { flex-direction: column; gap: 8px; border-radius: 10px; }
          .search-input-wrapper { flex: 1 1 auto; width: 100%; }
          .search-select, .filter-toggle-btn, .clear-btn, .applied-filter-btn { width: 100%; justify-content: center; }
          .filter-toggle-wrap { width: 100%; }
          .filter-panel { right: 0; left: 0; width: auto; }
          .stats-bar { margin: -20px auto 28px; padding: 0 16px; }
          .stats-card { padding: 12px 16px; gap: 8px; font-size: 13px; flex-wrap: wrap; }
          .stat-divider { display: none; }
          .verified-badge { margin-left: 0; }
          .jobs-container { padding: 0 16px 60px; }
          .jobs-grid { grid-template-columns: 1fr; gap: 14px; }
          .job-card { padding: 18px; }
          .job-title { font-size: 16px; }
          .job-meta { gap: 8px; }
        }
        @media (max-width: 480px) {
          .hero-title { font-size: 22px; }
          .hero-badge { font-size: 12px; padding: 5px 12px; }
          .hero-subtitle { font-size: 14px; }
          .stats-card { flex-direction: column; align-items: flex-start; gap: 6px; }
          .search-box { padding: 6px; }
        }
      `}</style>

      <Navbar />

      <div className="jobs-wrapper">
        <div className="hero-section">
          <div className="hero-glow" />
          <div className="hero-container">
            <div className="hero-badge">
            {hasActiveFilters
              ? `${filteredJobs.length} matching positions`
              : totalJobCount !== null
                ? `${totalJobCount} open positions`
                : `${filteredJobs.length} open positions`
            }
          </div>
            <h1 className="hero-title">Find your next opportunity</h1>
            <p className="hero-subtitle">
              Discover verified roles — see the full hiring process before you apply
            </p>
          </div>

          <div className="search-container">
            <div className="search-box">
              <div className="search-input-wrapper">
                <Search className="search-icon" size={18} color="#94a3b8" />
                <input
                  type="text"
                  name="job-search-input"
                  autoComplete="off"
                  placeholder="Job title, company, skill..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>

              <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} className="search-select" name="location-select">
                <option value="All">All Locations</option>
                {locations.map((loc) => <option key={loc}>{loc}</option>)}
              </select>

              <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="search-select" name="type-select">
                <option value="All">All Types</option>
                {types.map((type) => <option key={type}>{type}</option>)}
              </select>

              {isJobSeeker && appliedCount > 0 && (
                <button
                  type="button"
                  className={`applied-filter-btn${showAppliedOnly ? " active" : ""}`}
                  onClick={() => setShowAppliedOnly((p) => !p)}
                  title={showAppliedOnly ? "Show all jobs" : "Show only jobs you applied to"}
                >
                  <BookmarkCheck size={15} />
                  Applied
                  <span className="applied-count">{appliedCount}</span>
                </button>
              )}

              {/* ── Unified Filters button + panel ── */}
              <div className="filter-toggle-wrap" ref={filterBtnRef}>
                <button
                  type="button"
                  className={`filter-toggle-btn${showFilters ? " active" : ""}`}
                  onClick={() => setShowFilters((p) => !p)}
                >
                  <Filter size={15} />
                  Filters
                  {advancedActiveCount > 0 && (
                    <span className="filter-badge">{advancedActiveCount}</span>
                  )}
                </button>

                <FilterPanel
                  open={showFilters}
                  onClose={() => setShowFilters(false)}
                  selectedPay={selectedPay}
                  setSelectedPay={setSelectedPay}
                  skillFilter={skillFilter}
                  setSkillFilter={setSkillFilter}
                  allSkills={allSkills}
                  skillCounts={skillCounts}
                  activeCount={advancedActiveCount}
                />
              </div>

              {hasActiveFilters && (
                <button type="button" onClick={resetFilters} className="clear-btn">
                  <X size={15} />
                  Clear
                </button>
              )}
            </div>

            {/* Active filter tags shown below the search bar */}
            {(selectedPay !== "All" || skillFilter) && (
              <div className="active-filter-tags">
                {selectedPay !== "All" && (
                  <span className="active-tag">
                    {selectedPay}
                    <button type="button" onClick={() => setSelectedPay("All")}><X size={11} /></button>
                  </span>
                )}
                {skillFilter && (
                  <span className="active-tag">
                    <Code2 size={11} />
                    {skillFilter}
                    <button type="button" onClick={() => setSkillFilter("")}><X size={11} /></button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="stats-bar">
          <div className="stats-card">
            <span className="stat-item"><span className="stat-value">{hasActiveFilters
              ? filteredJobs.length
              : totalJobCount !== null
                ? totalJobCount
                : filteredJobs.length
            }</span> jobs</span>
            <span className="stat-divider">|</span>
            <span className="stat-item"><span className="stat-value">{locations.length}</span> locations</span>
            <span className="stat-divider">|</span>
            <span className="stat-item"><span className="stat-value">{types.length}</span> types</span>
            <span className="stat-divider">|</span>
            <span className="stat-item"><span className="stat-value">{allSkills.length}</span> skills</span>
            {isJobSeeker && appliedCount > 0 && (
              <>
                <span className="stat-divider">|</span>
                <span className="applied-stat" onClick={() => setShowAppliedOnly((p) => !p)}>
                  <BookmarkCheck size={12} />
                  {appliedCount} applied
                </span>
              </>
            )}
            <span className="verified-badge">
              <CheckCircle size={14} />
              Verified employers
            </span>
          </div>
        </div>

        <div className="jobs-container">
          {loading ? (
            <div className="loading-state">
              <div className="state-icon"><Loader2 size={32} color="#10b981" className="spinner" /></div>
              <p className="state-title">Finding opportunities...</p>
            </div>

          ) : error && jobs.length === 0 ? (
            <div className="error-state">
              <div className="state-icon"><Briefcase size={32} color="#cbd5e1" /></div>
              <h3 className="state-title">{error}</h3>
              <p className="state-description">Ensure your backend is running and jobs are approved</p>
              <div className="state-actions">
                <button type="button" onClick={() => window.location.reload()} className="btn-action">Reload</button>
                <button type="button" onClick={() => fetchJobs(1, false)} className="btn-action btn-action-secondary">Retry</button>
              </div>
            </div>

          ) : filteredJobs.length === 0 ? (
            <div className="empty-state">
              <div className="state-icon"><Search size={32} color="#cbd5e1" /></div>
              <h3 className="state-title">
                {showAppliedOnly ? "You haven't applied to any jobs yet" : "No jobs match your search"}
              </h3>
              <p className="state-description">
                {showAppliedOnly ? "Browse open positions and start applying" : "Try different keywords or clear your filters"}
              </p>
              <button type="button" onClick={resetFilters} className="btn-action">
                {showAppliedOnly ? "Browse All Jobs" : "Clear Filters"}
              </button>
            </div>

          ) : (
            <div className="jobs-grid">
              {filteredJobs.map((job, index) => {
                const isLast     = index === filteredJobs.length - 1;
                const pay        = formatPay(job);
                const skills     = job.skills || [];
                const rounds     = job.rounds || [];
                const roundsOpen = expandedRounds[job._id];
                const SKILL_LIMIT = 4;
                const isApplied  = isJobSeeker && appliedJobIds.has(job._id);
                const typeArr    = getTypeArr(job.type);

                return (
                  <div
                    key={job._id}
                    ref={isLast ? sentinelRef : null}
                    className={`job-card${isApplied ? " applied" : ""}`}
                  >
                    {isApplied && (
                      <div className="applied-ribbon">
                        <BookmarkCheck size={10} />
                        Applied
                      </div>
                    )}

                    <div className="job-tags" style={{ paddingRight: isApplied ? 72 : 0 }}>
                      {typeArr.map((t) => {
                        const c = TYPE_COLORS[t] || defaultTypeColor;
                        return (
                          <span key={t} className="job-tag" style={{ background: c.bg, color: c.color }}>
                            {t}
                          </span>
                        );
                      })}
                      <span className="job-tag tag-live">
                        <span className="live-dot" />Live
                      </span>
                      <span className="tag-pay" style={{ background: pay.bg, color: pay.color, borderColor: pay.border }}>
                        {pay.label}
                      </span>
                    </div>

                    <h2 className="job-title">{job.title}</h2>

                    <div className="job-company">
                    <div className="company-logo" style={{ overflow: "hidden" }}>
                    {job.business?.profilePicture ? (
                      <img src={job.business.profilePicture} alt={job.company} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
                    ) : job.business?.businessProfile?.images?.[0] ? (
                      <img src={job.business.businessProfile.images[0]} alt={job.company} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
                    ) : job.recruiter?.recruiterProfile?.companyLogo ? (
                      <img src={job.recruiter.recruiterProfile.companyLogo} alt={job.company} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
                    ) : (
                      <Building2 size={18} color="white" />
                    )}
                  </div>
                    <div className="company-info">
                      <div className="company-name">
                        {job.company || job.business?.businessProfile?.businessName || "Direct Hire"}
                      </div>
                      <div className="company-verified"><CheckCircle size={11} />Verified</div>
                    </div>
                  </div>

                    <div className="job-meta">
                      <div className="job-meta-item"><MapPin size={13} />{job.location}</div>
                      {rounds.length > 0 && <div className="job-meta-item"><Layers size={13} />{rounds.length} round{rounds.length !== 1 ? "s" : ""}</div>}
                      {skills.length > 0 && <div className="job-meta-item"><Code2 size={13} />{skills.length} skill{skills.length !== 1 ? "s" : ""}</div>}
                    </div>

                    {skills.length > 0 && (
                      <div className="job-skills">
                        {skills.slice(0, SKILL_LIMIT).map((s) => (
                          <button key={s} type="button"
                            className={`job-skill-pill${skillFilter && s.toLowerCase().includes(skillFilter.toLowerCase()) ? " highlighted" : ""}`}
                            onClick={() => setSkillFilter(s)}>{s}</button>
                        ))}
                        {skills.length > SKILL_LIMIT && <span className="job-skill-more">+{skills.length - SKILL_LIMIT} more</span>}
                      </div>
                    )}

                    {rounds.length > 0 && (
                      <>
                        <div className="job-divider" />
                        <button type="button" className="job-rounds-toggle" onClick={() => toggleRounds(job._id)}>
                          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Layers size={14} />Hiring Process ({rounds.length} rounds)
                          </span>
                          {roundsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        {roundsOpen && (
                          <div className="job-rounds-list">
                            {rounds.map((r, i) => (
                              <div key={r._id || i} className="job-round-item">
                                <div className="job-round-num">{r.order || i + 1}</div>
                                <div className="job-round-info">
                                  <div className="job-round-title">{r.title || ROUND_TYPE_LABELS[r.type] || r.type}</div>
                                  {r.description && <div className="job-round-desc">{r.description.length > 90 ? r.description.slice(0, 90) + "…" : r.description}</div>}
                                  {r.duration && <div className="job-round-dur"><Clock size={10} />{r.duration}</div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    <div className="job-actions">
                      <Link to={`/jobs/${job._id}`} className="btn-view">
                        {isApplied ? "View Application" : "View Details"}
                        <ExternalLink size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {loadingMore && (
            <div className="load-more">
              <Loader2 size={24} color="#10b981" className="spinner" />
              <p className="load-more-text">Loading more...</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Jobs;