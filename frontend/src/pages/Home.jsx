import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import axios from "axios";
import API_BASE_URL from "../config/api";
import {
  Search,
  MapPin,
  Briefcase,
  MapPinIcon,
  Clock,
  Building2,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const HERO_PHRASES = [
  "Right Here.",
  "Green Energy.",
  "Apply Today.",
  "Starts Now.",
  "It's Waiting.",
];


const normalizeDbAd = (ad) => ({
  ...ad,
  accent:      ad.accentColor || "#10b981",
  accentLight: (ad.accentColor || "#10b981") + "33",
  cta:         ad.ctaText  || "Learn More",
  image:       ad.imageUrl || "",
  ctaUrl:      ad.ctaUrl   || "/jobs",
});

export default function GreenJobsHomepage() {
  const navigate = useNavigate();

  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [phraseState, setPhraseState] = useState("visible");
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [jobsLoading, setJobsLoading]   = useState(true);
  const [jobsError, setJobsError]       = useState(null);
  const [activeAd, setActiveAd] = useState(0);
  const [activeFB, setActiveFB]           = useState(0);
  const [spotlightAds, setSpotlightAds]   = useState([]);
  const [fullBannerAds, setFullBannerAds] = useState([]);
  const [adsLoading, setAdsLoading]       = useState(true);
  const [heroStats, setHeroStats] = useState({ liveJobs: null, companies: null });

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseState("exit");
      setTimeout(() => {
        setPhraseIndex((i) => (i + 1) % HERO_PHRASES.length);
        setPhraseState("enter");
        requestAnimationFrame(() => requestAnimationFrame(() => setPhraseState("visible")));
      }, 340);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsRes = await axios.get(`${API_BASE_URL}/api/admin/stats`, { timeout: 8000 }).catch(() => null);
        if (statsRes?.data) {
          const s = statsRes.data;
          setHeroStats({ liveJobs: s.liveJobs ?? s.totalJobs ?? null, companies: s.approvedBusinesses ?? s.businesses ?? null });
          return;
        }
        const [liveJobsRes, approvedBizRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/jobs/public`, { timeout: 6000 }).catch(() => null),
          axios.get(`${API_BASE_URL}/api/profile/business/approved`, { timeout: 6000 }).catch(() => null),
        ]);
        const jobsArray = liveJobsRes?.data?.jobs ?? (Array.isArray(liveJobsRes?.data) ? liveJobsRes.data : []);
        const approvedBizData = Array.isArray(approvedBizRes?.data) ? approvedBizRes.data : [];
        setHeroStats({
          liveJobs:  jobsArray.filter(j => j.status === "approved").length || null,
          companies: approvedBizData.length || null,
        });
      } catch (err) { console.error(err); }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setJobsLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/jobs/public?page=1&limit=6`, { timeout: 10000 });
        let jobs = response.data.jobs && Array.isArray(response.data.jobs)
          ? response.data.jobs
          : Array.isArray(response.data) ? response.data : [];
        setFeaturedJobs(jobs.filter(job => job && job._id && job.title && job.status === "approved"));
      } catch {
        try {
          const fallback = await axios.get(`${API_BASE_URL}/api/jobs`, { timeout: 5000 });
          setFeaturedJobs((fallback.data.jobs || fallback.data || []).filter(j => j.status === "approved").slice(0, 6));
        } catch { setJobsError("Could not load jobs."); }
      } finally { setJobsLoading(false); }
    };
    fetchJobs();
  }, []);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        setAdsLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/ads`);
        const all = res.data.ads || [];
        setSpotlightAds(all.filter(a => a.bannerType === "spotlight"));
        setFullBannerAds(all.filter(a => a.bannerType === "full_banner"));
      } catch (err) {
        console.error("Ads fetch failed, using fallback:", err);
      } finally {
        setAdsLoading(false);
      }
    };
    fetchAds();
  }, []);

  const featuredAds = spotlightAds.map(normalizeDbAd);

  useEffect(() => {
    if (featuredAds.length > 0 && activeAd >= featuredAds.length) setActiveAd(0);
  }, [featuredAds.length]);

  useEffect(() => {
    if (featuredAds.length <= 1) return;
    const timer = setInterval(() => setActiveAd(p => (p + 1) % featuredAds.length), 4000);
    return () => clearInterval(timer);
  }, [featuredAds.length]);

  useEffect(() => {
    if (fullBannerAds.length <= 1) return;
    const t = setInterval(() => setActiveFB(p => (p + 1) % fullBannerAds.length), 6000);
    return () => clearInterval(t);
  }, [fullBannerAds.length]);

  const handleSearch = () => navigate(`/jobs?search=${searchKeyword}&location=${searchLocation}`);

  const handleAdNav = (url) => {
    if (!url) { navigate("/jobs"); return; }
    if (url.startsWith("http")) window.open(url, "_blank");
    else navigate(url);
  };

  const formatSalaryLabel = (job) => {
    if (!job.isPaid) return "Unpaid / Volunteer";
    if (job.stipend) {
      const p = { monthly: "/mo", yearly: "/yr", weekly: "/wk", hourly: "/hr", project: "/project" };
      return `${job.stipend} ${p[job.stipendPeriod] || ""}`.trim();
    }
    if (job.salary) return job.salary;
    return "Paid";
  };

  const daysSincePosted = (dateStr) => {
    if (!dateStr) return null;
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    return diff === 0 ? "Today" : diff === 1 ? "Yesterday" : `${diff} days ago`;
  };

  const formatStatNum = (val) => {
    if (val === null || val === undefined) return "—";
    if (val >= 1000) return `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k+`;
    return `${val}+`;
  };

  const scrollAds = (dir) =>
    setActiveAd(p => dir === "left"
      ? (p - 1 + featuredAds.length) % featuredAds.length
      : (p + 1) % featuredAds.length);

  const jobCategories = [
    { name: "Freshers",        count: 1240, icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg> },
    { name: "IT",              count: 3890, icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg> },
    { name: "Sales & Marketing", count: 2670, icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> },
    { name: "Operations",      count: 1340, icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> },
    { name: "Manufacturing",   count: 820,  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="1"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg> },
    { name: "Engineering",     count: 1560, icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 0 0 4.93 19.07M4.93 4.93A10 10 0 0 1 19.07 19.07"/></svg> },
    { name: "Finance",         count: 940,  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
    { name: "Solar & Renewable", count: 2100, icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> },
  ];

  const topCompanies = [
    { name: "Gronsol",    logo: "/companies/gronsol.jpeg" },
    { name: "Kalpa Power",logo: "/companies/kalpa-power.jpeg" },
    { name: "Selec",      logo: "/companies/selec.jpeg" },
    { name: "Feston",     logo: "/companies/feston.jpeg" },
    { name: "SuryaLogix", logo: "/companies/suryalogix.jpeg" },
    { name: "Nova SYS",   logo: "/companies/novasys.jpeg" },
  ];

  const userReviews = [
    {
      name: "Aarav Mehta",
      role: "Solar Design Engineer",
      rating: 5,
      comment: "GreenJobs made my job search simple and fast. I found relevant renewable energy roles within days.",
    },
    {
      name: "Priya Sharma",
      role: "Sustainability Analyst",
      rating: 4,
      comment: "The platform is clean and easy to use. I really liked the company listings and featured opportunities.",
    },
    {
      name: "Rohan Verma",
      role: "Operations Associate",
      rating: 5,
      comment: "A very useful portal for green energy careers. The jobs felt more targeted compared to other websites.",
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #f8fafc; }

        @keyframes spin    { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse   { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes statPop { from { opacity: 0; transform: translateY(5px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
        @keyframes phraseSlideOutUp { 0% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-56px); } }
        @keyframes phraseSlideInUp  { 0% { opacity: 0; transform: translateY(56px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes fbIn { from { opacity:0; transform:translateX(18px); } to { opacity:1; transform:translateX(0); } }

        .homepage-wrapper { min-height: 100vh; background: #f8fafc; overflow-x: hidden; }

        /* ══ HERO ══ */
        .hero-section { background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 40%, #d1fae5 100%); padding: 0; position: relative; overflow: hidden; }
        .hero-section::before { content: ''; position: absolute; width: 700px; height: 700px; border-radius: 50%; background: radial-gradient(circle, rgba(16,185,129,0.11) 0%, transparent 65%); top: -220px; right: -120px; pointer-events: none; z-index: 0; }
        .hero-section::after  { content: ''; position: absolute; width: 420px; height: 420px; border-radius: 50%; background: radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%); bottom: -140px; left: -80px; pointer-events: none; z-index: 0; }
        .hero-container { max-width: 1320px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; min-height: 560px; padding: 0 72px; position: relative; z-index: 1; }
        .hero-left { flex: 1; z-index: 2; padding: 72px 0; max-width: 580px; }
        .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: white; border: 1.5px solid #bbf7d0; color: #15803d; font-size: 12.5px; font-weight: 600; padding: 6px 14px; border-radius: 50px; margin-bottom: 24px; letter-spacing: 0.3px; box-shadow: 0 2px 8px rgba(16,185,129,0.12); width: fit-content; }
        .hero-badge-dot { width: 7px; height: 7px; background: #16a34a; border-radius: 50%; animation: pulse 2s infinite; flex-shrink: 0; }
        .hero-title { font-size: 48px; font-weight: 800; color: #0f172a; margin-bottom: 10px; letter-spacing: -2px; line-height: 1.08; display: flex; align-items: baseline; flex-wrap: nowrap; white-space: nowrap; gap: 0; }
        .hero-title-static { white-space: nowrap; flex-shrink: 0; margin-right: 14px; }
        .hero-title-clip { display: inline-flex; overflow: hidden; height: 1.2em; align-items: flex-end; vertical-align: bottom; flex-shrink: 0; min-width: 50px; position: relative; }
        .hero-phrase { display: inline-block; color: #10b981; white-space: nowrap; will-change: transform, opacity; line-height: 1.08; }
        .hero-phrase.state-visible { opacity: 1; transform: translateY(0); }
        .hero-phrase.state-exit { animation: phraseSlideOutUp 0.32s cubic-bezier(0.55, 0, 0.45, 1) forwards; }
        .hero-phrase.state-enter { opacity: 0; transform: translateY(56px); animation: none; }
        .hero-phrase.state-visible-anim { animation: phraseSlideInUp 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .phrase-dots { display: flex; gap: 5px; margin-top: 6px; margin-bottom: 20px; }
        .phrase-dot { height: 4px; width: 4px; border-radius: 2px; background: #bbf7d0; transition: width 0.35s ease, background 0.35s ease; flex-shrink: 0; }
        .phrase-dot.active { width: 20px; background: #10b981; }
        .hero-subtitle { font-size: 17px; color: #64748b; margin-bottom: 38px; max-width: 460px; line-height: 1.72; font-weight: 400; }
        .search-container { width: 100%; max-width: 520px; }
        .search-box { display: flex; align-items: center; background: white; border-radius: 14px; padding: 5px; box-shadow: 0 4px 24px rgba(0,0,0,0.09), 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; width: 100%; }
        .search-input-wrapper { position: relative; flex: 1; min-width: 0; }
        .search-divider { width: 1px; height: 22px; background: #e2e8f0; flex-shrink: 0; margin: 0 2px; }
        .search-input { width: 100%; height: 46px; border: none; background: transparent; padding: 0 12px 0 40px; font-size: 13.5px; color: #0f172a; outline: none; font-family: 'Inter', sans-serif; }
        .search-input::placeholder { color: #94a3b8; }
        .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #10b981; pointer-events: none; }
        .search-btn { height: 46px; min-width: 108px; padding: 0 20px; border: none; border-radius: 10px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; font-size: 14px; font-weight: 700; cursor: pointer; white-space: nowrap; flex-shrink: 0; font-family: 'Inter', sans-serif; transition: all 0.18s; box-shadow: 0 4px 14px rgba(16,185,129,0.40); letter-spacing: 0.2px; }
        .search-btn:hover { background: linear-gradient(135deg, #059669 0%, #047857 100%); box-shadow: 0 6px 20px rgba(16,185,129,0.50); transform: translateY(-1px); }
        .hero-stats { display: flex; gap: 0; margin-top: 36px; }
        .hero-stat { display: flex; flex-direction: column; gap: 4px; padding-right: 32px; margin-right: 32px; border-right: 1px solid #d1fae5; }
        .hero-stat:last-child { border-right: none; padding-right: 0; margin-right: 0; }
        .hero-stat-num { font-size: 26px; font-weight: 800; color: #0f172a; line-height: 1; letter-spacing: -0.5px; min-width: 56px; }
        .hero-stat-num.loaded { animation: statPop 0.45s cubic-bezier(0.34,1.56,0.64,1); }
        .stat-skeleton { display: inline-block; height: 26px; width: 68px; border-radius: 6px; background: linear-gradient(90deg, #d1fae5 0%, #f0fdf4 50%, #d1fae5 100%); background-size: 400px 100%; animation: shimmer 1.4s infinite linear; vertical-align: middle; }
        .hero-stat-label { font-size: 11.5px; color: #94a3b8; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
        .hero-right { flex: 0 0 460px; display: flex; justify-content: center; align-items: flex-end; position: relative; align-self: stretch; }
        .hero-image-wrapper { width: 90%; height: 90%; display: flex; align-items: flex-end; justify-content: center; position: relative; }
        .hero-image-bg { display: none; }
        .hero-person { width: 100%; max-width: 500px; height: auto; object-fit: contain; object-position: bottom center; display: block; position: relative; z-index: 2; filter: brightness(0.88) contrast(1.08) saturate(1.05); transform: translateX(40px); }

        /* ══ CATEGORIES ══ */
        .categories-carousel { background: white; padding: 56px 40px; overflow: hidden; border-bottom: 1px solid #f1f5f9; }
        .categories-title { text-align: center; font-size: 30px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
        .categories-subtitle { text-align: center; font-size: 15px; color: #64748b; margin-bottom: 36px; }
        .categories-track-wrapper { position: relative; max-width: 1200px; margin: 0 auto; }
        .categories-scroll { display: flex; gap: 12px; overflow-x: auto; scroll-behavior: smooth; padding: 6px 4px 10px; scrollbar-width: none; }
        .categories-scroll::-webkit-scrollbar { display: none; }
        .category-card { display: flex; align-items: center; gap: 12px; min-width: 210px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; cursor: pointer; transition: all 0.2s; flex-shrink: 0; }
        .category-card:hover { border-color: #10b981; background: #f0fdf4; box-shadow: 0 4px 16px rgba(16,185,129,0.12); transform: translateY(-2px); }
        .category-icon-box { width: 42px; height: 42px; border-radius: 10px; background: white; border: 1.5px solid #e2e8f0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #10b981; transition: all 0.2s; }
        .category-card:hover .category-icon-box { background: #10b981; border-color: #10b981; color: white; }
        .category-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .category-name { font-size: 14px; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .category-count { font-size: 12px; color: #64748b; font-weight: 500; }
        .cat-arrow { position: absolute; top: 50%; transform: translateY(-60%); width: 36px; height: 36px; background: white; border: 1.5px solid #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.08); font-size: 14px; color: #475569; }
        .cat-arrow:hover { background: #10b981; border-color: #10b981; color: white; box-shadow: 0 4px 12px rgba(16,185,129,0.3); }
        .cat-arrow-left { left: -18px; }
        .cat-arrow-right { right: -18px; }

        /* ══ COMPANIES ══ */
        .companies-section { background: #f8fafc; padding: 60px 40px; }
        .companies-title { text-align: center; font-size: 32px; font-weight: 700; color: #0f172a; margin-bottom: 40px; }
        .companies-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 24px; max-width: 1200px; margin: 0 auto; }
        .company-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px; display: flex; align-items: center; justify-content: center; min-height: 140px; transition: all 0.2s; cursor: pointer; }
        .company-card:hover { border-color: #10b981; box-shadow: 0 4px 12px rgba(16,185,129,0.1); transform: translateY(-2px); }
        .company-logo { max-width: 100%; max-height: 70px; width: auto; height: auto; object-fit: contain; }

        /* ══ REVIEWS ══ */
        .reviews-section { background: #ffffff; padding: 60px 40px; }
        .reviews-title { text-align: center; font-size: 32px; font-weight: 700; color: #0f172a; margin-bottom: 10px; }
        .reviews-subtitle { text-align: center; font-size: 15px; color: #64748b; margin-bottom: 40px; }
        .reviews-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; max-width: 1200px; margin: 0 auto; }
        .review-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; transition: all 0.2s; }
        .review-card:hover { border-color: #10b981; box-shadow: 0 4px 16px rgba(16,185,129,0.10); transform: translateY(-2px); }
        .review-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; gap: 12px; }
        .review-user { display: flex; flex-direction: column; }
        .review-name { font-size: 17px; font-weight: 700; color: #0f172a; }
        .review-role { font-size: 13px; color: #64748b; margin-top: 3px; }
        .review-rating { display: flex; gap: 3px; flex-shrink: 0; }
        .review-star { color: #f59e0b; font-size: 16px; line-height: 1; }
        .review-comment { font-size: 14px; color: #475569; line-height: 1.7; }

        /* ══ FULL BANNER ADS ══ */
        .fb-section { position: relative; overflow: hidden; background: #0f172a; }
        .fb-banner { position: relative; min-height: 260px; display: flex; align-items: center; overflow: hidden; cursor: pointer; }
        .fb-bg-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; transition: transform 7s ease; transform: scale(1.05); }
        .fb-banner:hover .fb-bg-img { transform: scale(1); }
        .fb-gradient { position: absolute; inset: 0; z-index: 1; background: linear-gradient(105deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.6) 55%, rgba(0,0,0,0.25) 100%); }
        .fb-accent-layer { position: absolute; inset: 0; z-index: 2; pointer-events: none; }
        .fb-inner { position: relative; z-index: 3; max-width: 1320px; margin: 0 auto; padding: 32px 72px; width: 100%; display: flex; align-items: center; gap: 32px; }
        .fb-copy { flex: 1; }
        .fb-eyebrow { display: inline-flex; align-items: center; gap: 8px; margin-bottom: 10px; padding: 4px 12px; border-radius: 50px; font-size: 10px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; }
        .fb-headline { font-size: 30px; font-weight: 900; color: #ffffff; line-height: 1.1; letter-spacing: -1px; margin: 0 0 8px; }
        .fb-sub { font-size: 14px; color: rgba(255,255,255,0.72); line-height: 1.55; max-width: 480px; margin: 0 0 20px; font-weight: 400; }
        .fb-btns { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
        .fb-btn-main { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 800; border: none; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.2s; letter-spacing: 0.2px; color: white; }
        .fb-btn-main:hover { transform: translateY(-2px); filter: brightness(1.1); }
        .fb-btn-ghost { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 10px; font-size: 13px; font-weight: 700; background: rgba(255,255,255,0.09); color: white; cursor: pointer; border: 1.5px solid rgba(255,255,255,0.3); backdrop-filter: blur(4px); font-family: 'Inter', sans-serif; transition: all 0.2s; }
        .fb-btn-ghost:hover { background: rgba(255,255,255,0.18); border-color: rgba(255,255,255,0.55); }
        .fb-right { flex-shrink: 0; display: flex; flex-direction: row; gap: 12px; }
        .fb-card { background: rgba(255,255,255,0.08); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; padding: 14px 20px; text-align: center; min-width: 100px; }
        .fb-card-num { font-size: 24px; font-weight: 900; line-height: 1; }
        .fb-card-lbl { font-size: 10px; color: rgba(255,255,255,0.55); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
        .fb-nav-row { position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%); display: flex; gap: 7px; z-index: 10; align-items: center; }
        .fb-dot { height: 4px; border-radius: 2px; cursor: pointer; transition: all 0.35s ease; background: rgba(255,255,255,0.35); width: 18px; }
        .fb-dot.active { width: 32px; background: white; }
        .fb-anim { animation: fbIn 0.45s cubic-bezier(0.16,1,0.3,1); }

        /* ══ ADS / SPOTLIGHT ══ */
        .ads-section { background: #f8fafc; padding: 72px 40px; position: relative; }
        .ads-section::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, #e2e8f0 20%, #e2e8f0 80%, transparent); }
        .ads-section::after  { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, #e2e8f0 20%, #e2e8f0 80%, transparent); }
        .ads-inner { max-width: 1200px; margin: 0 auto; }
        .ads-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; }
        .ads-header-left { display: flex; flex-direction: column; gap: 6px; }
        .ads-eyebrow { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #10b981; }
        .ads-eyebrow-line { width: 28px; height: 2px; background: #10b981; border-radius: 2px; }
        .ads-title { font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
        .ads-nav { display: flex; align-items: center; gap: 12px; }
        .ads-dots { display: flex; gap: 6px; align-items: center; }
        .ads-dot { width: 6px; height: 6px; border-radius: 50%; background: #cbd5e1; transition: all 0.3s; cursor: pointer; }
        .ads-dot.active { width: 20px; border-radius: 3px; background: #10b981; }
        .ads-arrow { width: 38px; height: 38px; border-radius: 10px; border: 1.5px solid #e2e8f0; background: white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; color: #64748b; }
        .ads-arrow:hover { border-color: #10b981; background: #f0fdf4; color: #10b981; }
        .ads-spotlight { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: stretch; }
        .ads-spotlight-single { display: block; }
        .ad-main-card { border-radius: 20px; overflow: hidden; position: relative; min-height: 380px; cursor: pointer; transition: transform 0.3s, box-shadow 0.3s; animation: slideIn 0.4s ease; background: #0f172a; }
        .ad-main-card:hover { transform: translateY(-4px); box-shadow: 0 24px 48px rgba(0,0,0,0.14); }
        .ad-main-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center; display: block; z-index: 0; transition: transform 0.5s ease; }
        .ad-main-card:hover .ad-main-img { transform: scale(1.04); }
        .ad-main-overlay { position: absolute; inset: 0; z-index: 1; background: linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.15) 100%); }
        .ad-main-content { position: absolute; bottom: 0; left: 0; right: 0; padding: 28px 28px 32px; z-index: 2; }
        .ad-main-tag { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 50px; font-size: 10px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px; color: white; backdrop-filter: blur(8px); }
        .ad-main-title { font-size: 26px; font-weight: 800; color: white; margin-bottom: 8px; line-height: 1.2; letter-spacing: -0.5px; text-shadow: 0 1px 4px rgba(0,0,0,0.4); }
        .ad-main-subtitle { font-size: 14px; color: rgba(255,255,255,0.82); margin-bottom: 20px; line-height: 1.5; text-shadow: 0 1px 3px rgba(0,0,0,0.3); }
        .ad-main-cta { display: inline-flex; align-items: center; gap: 8px; padding: 11px 22px; border-radius: 10px; font-size: 13px; font-weight: 700; border: none; cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif; color: white; box-shadow: 0 4px 14px rgba(0,0,0,0.3); letter-spacing: 0.2px; }
        .ad-main-cta:hover { transform: translateX(3px); filter: brightness(1.12); box-shadow: 0 6px 20px rgba(0,0,0,0.4); }
        .ads-side-stack { display: flex; flex-direction: column; gap: 14px; }
        .ad-side-card { border-radius: 14px; border: 1.5px solid #e2e8f0; background: white; display: flex; align-items: stretch; overflow: hidden; cursor: pointer; transition: all 0.22s; flex: 1; min-height: 110px; }
        .ad-side-card:hover { border-color: transparent; box-shadow: 0 8px 28px rgba(0,0,0,0.11); transform: translateX(4px); }
        .ad-side-card.highlighted { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.12), 0 4px 16px rgba(16,185,129,0.12); }
        .ad-side-thumb { width: 110px; min-width: 110px; flex-shrink: 0; object-fit: cover; object-position: center; display: block; align-self: stretch; }
        .ad-side-thumb-placeholder { width: 110px; min-width: 110px; flex-shrink: 0; display: block; align-self: stretch; }
        .ad-side-body { padding: 16px 14px; display: flex; flex-direction: column; justify-content: center; gap: 5px; flex: 1; min-width: 0; }
        .ad-side-tag { font-size: 10px; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase; line-height: 1; }
        .ad-side-title { font-size: 15px; font-weight: 700; color: #0f172a; line-height: 1.35; }
        .ad-side-subtitle { font-size: 12px; color: #64748b; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .ad-side-arrow { display: flex; align-items: center; justify-content: center; padding: 0 14px; color: #cbd5e1; transition: color 0.2s; flex-shrink: 0; }
        .ad-side-card:hover .ad-side-arrow { color: #10b981; }

        /* ══ JOBS ══ */
        .jobs-section { padding: 60px 40px; background: white; }
        .jobs-header { text-align: center; margin-bottom: 48px; }
        .jobs-title { font-size: 32px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
        .jobs-subtitle { font-size: 16px; color: #64748b; }
        .jobs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; max-width: 1200px; margin: 0 auto; }

        /* ── Job card: flex column so button always sticks to bottom ── */
        .job-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px;
          transition: all 0.22s;
          cursor: pointer;
          animation: fadeUp 0.3s ease;
          /* KEY: flex column + equal height via grid stretch */
          display: flex;
          flex-direction: column;
          /* Minimum height so short cards don't look squished */
          min-height: 340px;
        }
        .job-card:hover {
          border-color: #10b981;
          box-shadow: 0 8px 28px rgba(16,185,129,0.13);
          transform: translateY(-3px);
        }

        .job-tags { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
        .job-tag { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .tag-type { background: #dbeafe; color: #1e40af; }
        .tag-live { background: #d1fae5; color: #065f46; display: flex; align-items: center; gap: 4px; }
        .live-dot { width: 6px; height: 6px; background: #10b981; border-radius: 50%; animation: pulse 2s infinite; }
        .tag-pay { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }
        .tag-unpaid { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }

        .job-title-text {
          font-size: 17px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 12px;
          line-height: 1.4;
          transition: color 0.2s;
          /* clamp to 2 lines for consistent height */
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 2.8em;
        }
        .job-card:hover .job-title-text { color: #10b981; }

        .job-company-row { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
        .company-logo-box { width: 36px; height: 36px; background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .company-name { font-size: 14px; font-weight: 600; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .job-meta { display: flex; flex-direction: column; gap: 8px; margin: 4px 0 12px; font-size: 13.5px; color: #64748b; }
        .job-meta-item { display: flex; align-items: center; gap: 8px; }

        /* Skills area: fixed min-height so absent skills don't cause jump */
        .job-skills { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; min-height: 28px; }
        .job-skill-pill { padding: 3px 10px; border-radius: 100px; font-size: 12px; font-weight: 500; background: #f1f5f9; border: 1px solid #e2e8f0; color: #475569; }

        .job-salary { font-size: 17px; font-weight: 800; color: #10b981; margin-top: 4px; letter-spacing: -0.3px; }
        .job-salary-unpaid { font-size: 15px; font-weight: 600; color: #94a3b8; margin-top: 4px; }
        .job-posted { font-size: 12px; color: #94a3b8; display: flex; align-items: center; gap: 4px; margin-top: 8px; }

        /* ── Spacer pushes button to the very bottom of the card ── */
        .job-card-spacer { flex: 1; }

        /* ── View Details button: always at the bottom, full width, polished ── */
        .job-view-btn {
          margin-top: 18px;
          width: 100%;
          padding: 12px;
          background: #0f172a;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
          font-family: 'Inter', sans-serif;
          letter-spacing: 0.2px;
          /* Never allow this to shrink */
          flex-shrink: 0;
        }
        .job-view-btn:hover {
          background: #10b981;
          transform: translateY(-1px);
        }

        .jobs-state { max-width: 1200px; margin: 0 auto; text-align: center; padding: 60px 24px; }
        .state-icon { width: 64px; height: 64px; margin: 0 auto 20px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .state-title { font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 8px; }
        .state-desc { font-size: 14px; color: #64748b; }
        .spinner { animation: spin 1s linear infinite; }
        .view-all-btn { display: block; width: fit-content; margin: 36px auto 0; padding: 14px 36px; background: #0f172a; color: white; border: none; border-radius: 999px; font-size: 15px; font-weight: 700; cursor: pointer; transition: background 0.2s; font-family: 'Inter', sans-serif; }
        .view-all-btn:hover { background: #10b981; }

        /* ══ FOOTER ══ */
        .footer { background: linear-gradient(to bottom, #1e293b, #0f172a); padding: 60px 40px 32px; color: white; }
        .footer-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 40px; max-width: 1200px; margin: 0 auto 40px; }
        .footer-brand { font-size: 24px; font-weight: 700; color: #10b981; margin-bottom: 12px; }
        .footer-desc { font-size: 14px; color: #94a3b8; line-height: 1.6; }
        .footer-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: white; }
        .footer-links { display: flex; flex-direction: column; gap: 12px; }
        .footer-link { font-size: 14px; color: #94a3b8; cursor: pointer; transition: color 0.2s; }
        .footer-link:hover { color: #10b981; }
        .footer-bottom { text-align: center; padding-top: 32px; border-top: 1px solid #334155; color: #64748b; font-size: 14px; }

        /* ══ RESPONSIVE ══ */
        @media (max-width: 1200px) {
          .hero-container { padding: 0 48px; }
          .hero-title { font-size: 40px; letter-spacing: -1.5px; }
          .hero-right { flex: 0 0 380px; }
          .hero-person { transform: translateX(20px); }
          .fb-inner { padding: 48px 40px; }
          .fb-headline { font-size: 40px; }
        }
        @media (max-width: 960px) {
          .hero-container { flex-direction: column; padding: 0 32px; min-height: auto; }
          .hero-left { padding: 48px 0 24px; width: 100%; max-width: 100%; text-align: center; align-items: center; display: flex; flex-direction: column; }
          .hero-title { font-size: 34px; letter-spacing: -1px; justify-content: center; }
          .hero-subtitle { max-width: 100%; }
          .search-container { max-width: 100%; }
          .hero-stats { justify-content: center; }
          .phrase-dots { justify-content: center; }
          .hero-right { flex: 0 0 auto; width: 100%; max-width: 360px; align-self: center; }
          .hero-image-wrapper { width: 100%; height: auto; justify-content: center; }
          .hero-person { transform: translateX(0); max-width: 320px; max-height: 280px; object-fit: contain; }
          .ads-spotlight { grid-template-columns: 1fr; }
          .ad-main-card { min-height: 300px; }
        }
        @media (max-width: 767px) {
          .hero-section { overflow: hidden; }
          .hero-container { flex-direction: column; padding: 0 20px; min-height: auto; }
          .hero-left { order: 1; padding: 36px 0 20px; width: 100%; max-width: 100%; text-align: center; align-items: center; display: flex; flex-direction: column; }
          .hero-title { font-size: 26px; letter-spacing: -0.5px; justify-content: center; flex-wrap: wrap; gap: 6px; }
          .hero-title-static { margin-right: 6px; }
          .hero-title-clip { min-width: 140px; height: 1.15em; }
          .hero-subtitle { font-size: 14px; margin-bottom: 24px; }
          .search-box { flex-direction: column; padding: 8px; gap: 4px; border-radius: 12px; }
          .search-input-wrapper { width: 100%; flex: none; }
          .search-input { padding-left: 38px; height: 44px; }
          .search-divider { display: none; }
          .search-btn { width: 100%; height: 44px; border-radius: 8px; margin-top: 2px; }
          .hero-stats { flex-wrap: wrap; gap: 16px 24px; justify-content: center; margin-top: 24px; }
          .hero-stat { border-right: none; padding-right: 0; margin-right: 0; }
          .hero-stat-num { font-size: 22px; }
          .hero-right { order: 2; flex: 0 0 auto; width: 100%; max-width: 100%; align-self: center; max-height: 240px; overflow: hidden; display: flex; justify-content: center; align-items: flex-end; }
          .hero-image-wrapper { width: 100%; height: 240px; display: flex; align-items: flex-end; justify-content: center; }
          .hero-person { transform: none !important; width: auto; max-width: 100%; height: 240px; object-fit: contain; object-position: bottom center; display: block; margin: 0 auto; }
          .categories-carousel, .companies-section, .jobs-section, .ads-section, .footer { padding-left: 16px; padding-right: 16px; }
          .categories-carousel { padding-top: 40px; padding-bottom: 40px; }
          .jobs-section { padding-top: 40px; padding-bottom: 40px; }
          .ads-section { padding-top: 48px; padding-bottom: 48px; }
          .jobs-grid { grid-template-columns: 1fr; }
          .ads-header { flex-direction: column; align-items: flex-start; gap: 16px; }
          .ads-title { font-size: 22px; }
          .companies-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .company-card { padding: 20px; min-height: 100px; }
          .cat-arrow { display: none; }
          .categories-scroll { padding-left: 0; padding-right: 0; }
          .footer-grid { grid-template-columns: 1fr 1fr; gap: 28px; }
          .footer { padding-top: 40px; padding-bottom: 24px; }
          .phrase-dots { justify-content: center; }
          .fb-banner { min-height: 220px; }
          .fb-inner { padding: 24px 16px; flex-direction: column; gap: 16px; }
          .fb-headline { font-size: 20px; letter-spacing: -0.5px; }
          .fb-sub { font-size: 13px; margin-bottom: 14px; }
          .fb-right { flex-direction: row; width: 100%; justify-content: center; }
          .fb-btns { flex-direction: column; width: 100%; }
          .fb-btn-main, .fb-btn-ghost { width: 100%; justify-content: center; }
          .ad-side-thumb, .ad-side-thumb-placeholder { width: 90px; min-width: 90px; }
          .reviews-section { padding-left: 16px; padding-right: 16px; padding-top: 40px; padding-bottom: 40px; }
          .reviews-title { font-size: 26px; }
        }
        @media (max-width: 480px) {
          .fb-right { display: none; }
          .fb-headline { font-size: 18px; }
        }
        @media (max-width: 380px) {
          .hero-title { font-size: 22px; }
          .hero-title-clip { min-width: 120px; }
          .hero-person { height: 200px; }
          .hero-right { max-height: 200px; }
          .hero-image-wrapper { height: 200px; }
          .companies-grid { grid-template-columns: 1fr; }
          .footer-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <Navbar />

      <div className="homepage-wrapper">

        {/* ══ HERO ══ */}
        <section className="hero-section">
          <div className="hero-container">
            <div className="hero-left">
              <h1 className="hero-title">
                <span className="hero-title-static">Your Dream Solar Job.</span>
                <span className="hero-title-clip">
                  <span className={`hero-phrase state-${phraseState === "visible" ? "visible" : phraseState === "exit" ? "exit" : phraseState === "enter" ? "enter" : "visible-anim"}`}>
                    {HERO_PHRASES[phraseIndex]}
                  </span>
                </span>
              </h1>

              <p className="hero-subtitle">
                Discover renewable energy opportunities across India and connect
                with purpose-driven companies building the future.
              </p>

              <div className="search-container">
                <div className="search-box">
                  <div className="search-input-wrapper">
                    <Search className="search-icon" size={18} />
                    <input
                      type="text"
                      placeholder="Job title, skill or company..."
                      className="search-input"
                      value={searchKeyword}
                      onChange={e => setSearchKeyword(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleSearch()}
                    />
                  </div>
                  <div className="search-divider" />
                  <div className="search-input-wrapper" style={{ flex: 0.7 }}>
                    <MapPin className="search-icon" size={18} />
                    <input
                      type="text"
                      placeholder="Location..."
                      className="search-input"
                      value={searchLocation}
                      onChange={e => setSearchLocation(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleSearch()}
                    />
                  </div>
                  <button className="search-btn" onClick={handleSearch}>Find Jobs</button>
                </div>
              </div>

              <div className="hero-stats">
                {[
                  { value: heroStats.liveJobs,  label: "Active Jobs" },
                  { value: heroStats.companies, label: "Green Companies" },
                ].map((stat, i) => (
                  <div className="hero-stat" key={i}>
                    {stat.value === null
                      ? <span className="stat-skeleton" />
                      : <span className="hero-stat-num loaded">{formatStatNum(stat.value)}</span>}
                    <span className="hero-stat-label">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="hero-right">
              <div className="hero-image-wrapper">
                <div className="hero-image-bg" />
                <img
                  src="/home-right2.png"
                  alt="Green energy professional"
                  className="hero-person"
                  onError={e => { e.target.style.display = "none"; }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ══ CATEGORIES ══ */}
        <section className="categories-carousel">
          <h2 className="categories-title">Browse Jobs by Category</h2>
          <p className="categories-subtitle">Explore roles across renewable energy and green tech sectors</p>
          <div className="categories-track-wrapper">
            <button className="cat-arrow cat-arrow-left" onClick={() => document.getElementById("categoriesScroll").scrollBy({ left: -240, behavior: "smooth" })}>←</button>
            <div className="categories-scroll" id="categoriesScroll">
              {jobCategories.map((cat, i) => (
                <div key={i} className="category-card" onClick={() => navigate(`/jobs?category=${cat.name}`)}>
                  <div className="category-icon-box">{cat.icon}</div>
                  <div className="category-text">
                    <div className="category-name">{cat.name}</div>
                    <div className="category-count">{cat.count.toLocaleString()} Jobs</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="cat-arrow cat-arrow-right" onClick={() => document.getElementById("categoriesScroll").scrollBy({ left: 240, behavior: "smooth" })}>→</button>
          </div>
        </section>

        {/* ══ LIVE JOBS ══ */}
        <section className="jobs-section">
          <div className="jobs-header">
            <h2 className="jobs-title">Jobs Listed Right Now</h2>
            <p className="jobs-subtitle">Explore the latest live opportunities in renewable energy</p>
          </div>

          {jobsLoading ? (
            <div className="jobs-state">
              <div className="state-icon"><Loader2 size={32} color="#10b981" className="spinner" /></div>
              <p className="state-title">Loading jobs...</p>
            </div>
          ) : jobsError ? (
            <div className="jobs-state">
              <div className="state-icon"><AlertCircle size={32} color="#f59e0b" /></div>
              <p className="state-title">Could not load jobs</p>
              <p className="state-desc">{jobsError}</p>
            </div>
          ) : featuredJobs.length === 0 ? (
            <div className="jobs-state">
              <div className="state-icon"><Briefcase size={32} color="#cbd5e1" /></div>
              <p className="state-title">No approved jobs yet</p>
              <p className="state-desc">Check back soon.</p>
            </div>
          ) : (
            <>
              <div className="jobs-grid">
                {featuredJobs.map(job => {
                  const salaryLabel = formatSalaryLabel(job);
                  const posted = daysSincePosted(job.createdAt);
                  const companyName = job.company
                    || job.business?.businessProfile?.businessName
                    || job.business?.businessProfile?.companyName
                    || "Direct Hire";
                  const skills = (job.skills || []).slice(0, 4);

                  return (
                    <div key={job._id} className="job-card" onClick={() => navigate(`/jobs/${job._id}`)}>

                      {/* Tags row */}
                      <div className="job-tags">
                        {job.type && <span className="job-tag tag-type">{job.type}</span>}
                        <span className="job-tag tag-live"><span className="live-dot" />Live</span>
                        <span className={`job-tag ${job.isPaid ? "tag-pay" : "tag-unpaid"}`}>{job.isPaid ? "Paid" : "Unpaid"}</span>
                      </div>

                      {/* Title — always 2 lines tall */}
                      <h3 className="job-title-text">{job.title}</h3>

                      {/* Company */}
                      <div className="job-company-row">
                        <div className="company-logo-box"><Building2 size={18} color="white" /></div>
                        <span className="company-name">{companyName}</span>
                      </div>

                      {/* Meta */}
                      <div className="job-meta">
                        {job.location   && <div className="job-meta-item"><MapPinIcon size={14} />{job.location}</div>}
                        {job.experience && <div className="job-meta-item"><Briefcase size={14} />{job.experience}</div>}
                      </div>

                      {/* Skills */}
                      <div className="job-skills">
                        {skills.map(s => <span key={s} className="job-skill-pill">{s}</span>)}
                        {(job.skills || []).length > 4 && (
                          <span className="job-skill-pill" style={{ color: "#94a3b8", background: "transparent", border: "none" }}>
                            +{job.skills.length - 4} more
                          </span>
                        )}
                      </div>

                      {/* Salary */}
                      <div className={job.isPaid ? "job-salary" : "job-salary-unpaid"}>{salaryLabel}</div>

                      {/* Posted date */}
                      {posted && <div className="job-posted"><Clock size={12} />{posted}</div>}

                      {/* ── Spacer: pushes button to the bottom regardless of content height ── */}
                      <div className="job-card-spacer" />

                      {/* View Details — always pinned to bottom */}
                      <button
                        className="job-view-btn"
                        onClick={e => { e.stopPropagation(); navigate(`/jobs/${job._id}`); }}
                      >
                        View Details →
                      </button>

                    </div>
                  );
                })}
              </div>
              <button className="view-all-btn" onClick={() => navigate("/jobs")}>View All Jobs →</button>
            </>
          )}
        </section>

        {/* ══ FULL BANNER ADS ══ */}
        {fullBannerAds.length > 0 && (
          <section className="fb-section">
            {(() => {
              const ad = fullBannerAds.map(normalizeDbAd)[activeFB];
              return (
                <div key={activeFB} className="fb-banner fb-anim" onClick={() => handleAdNav(ad.ctaUrl)}>
                  {ad.image && (
                    <img src={ad.image} alt={ad.title} className="fb-bg-img"
                      onError={e => { e.target.style.background = "#1e293b"; }} />
                  )}
                  <div className="fb-gradient" />
                  <div className="fb-accent-layer" style={{ background: `linear-gradient(105deg, ${ad.accent}44 0%, transparent 55%)` }} />
                  <div className="fb-inner">
                    <div className="fb-copy">
                      {ad.tag && (
                        <div className="fb-eyebrow" style={{ background: `${ad.accent}2a`, color: ad.accent, border: `1px solid ${ad.accent}44` }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: ad.accent, display: "inline-block" }} />
                          {ad.tag}
                        </div>
                      )}
                      <h2 className="fb-headline">{ad.bannerHeadline || ad.title}</h2>
                      <p className="fb-sub">{ad.bannerDescription || ad.subtitle}</p>
                      <div className="fb-btns">
                        <button
                          className="fb-btn-main"
                          style={{ background: ad.accent, boxShadow: `0 4px 24px ${ad.accent}55` }}
                          onClick={e => { e.stopPropagation(); handleAdNav(ad.ctaUrl); }}
                        >
                          {ad.cta}<ChevronRight size={17} />
                        </button>
                      </div>
                    </div>
                  </div>
                  {fullBannerAds.length > 1 && (
                    <div className="fb-nav-row">
                      {fullBannerAds.map((_, i) => (
                        <div key={i} className={`fb-dot${i === activeFB ? " active" : ""}`}
                          onClick={e => { e.stopPropagation(); setActiveFB(i); }} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </section>
        )}

        {/* ══ SPOTLIGHT ADS ══ */}
        {!adsLoading && featuredAds.length > 0 && (
          <section className="ads-section">
            <div className="ads-inner">
              <div className="ads-header">
                <div className="ads-header-left">
                  <div className="ads-eyebrow"><span className="ads-eyebrow-line" />Featured Opportunities</div>
                  <h2 className="ads-title">Spotlight on Green Energy Careers</h2>
                </div>
                {featuredAds.length > 1 && (
                  <div className="ads-nav">
                    <div className="ads-dots">
                      {featuredAds.map((_, i) => (
                        <div key={i} className={`ads-dot${i === activeAd ? " active" : ""}`} onClick={() => setActiveAd(i)} />
                      ))}
                    </div>
                    <button className="ads-arrow" onClick={() => scrollAds("left")}><ChevronLeft size={18} /></button>
                    <button className="ads-arrow" onClick={() => scrollAds("right")}><ChevronRight size={18} /></button>
                  </div>
                )}
              </div>

              {featuredAds.length === 1 ? (
                <div className="ad-main-card ads-spotlight-single" onClick={() => handleAdNav(featuredAds[0]?.ctaUrl)}>
                  {featuredAds[0].image ? (
                    <img src={featuredAds[0].image} alt={featuredAds[0].title} className="ad-main-img" onError={e => { e.target.style.display = "none"; }} />
                  ) : (
                    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${featuredAds[0].accent}99, #0f172a)`, zIndex: 0 }} />
                  )}
                  <div className="ad-main-overlay" />
                  <div className="ad-main-content">
                    {featuredAds[0].tag && (
                      <div className="ad-main-tag" style={{ background: featuredAds[0].accent + "40", border: `1px solid ${featuredAds[0].accent}60` }}>{featuredAds[0].tag}</div>
                    )}
                    <div className="ad-main-title">{featuredAds[0].title}</div>
                    {featuredAds[0].subtitle && <div className="ad-main-subtitle">{featuredAds[0].subtitle}</div>}
                    <button className="ad-main-cta" style={{ background: featuredAds[0].accent }}
                      onClick={e => { e.stopPropagation(); handleAdNav(featuredAds[0]?.ctaUrl); }}>
                      {featuredAds[0].cta} <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="ads-spotlight">
                  <div className="ad-main-card" onClick={() => handleAdNav(featuredAds[activeAd]?.ctaUrl)} key={activeAd}>
                    {featuredAds[activeAd].image ? (
                      <img src={featuredAds[activeAd].image} alt={featuredAds[activeAd].title} className="ad-main-img" onError={e => { e.target.style.display = "none"; }} />
                    ) : (
                      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${featuredAds[activeAd].accent}99, #0f172a)`, zIndex: 0 }} />
                    )}
                    <div className="ad-main-overlay" />
                    <div className="ad-main-content">
                      {featuredAds[activeAd].tag && (
                        <div className="ad-main-tag" style={{ background: featuredAds[activeAd].accent + "40", border: `1px solid ${featuredAds[activeAd].accent}60` }}>{featuredAds[activeAd].tag}</div>
                      )}
                      <div className="ad-main-title">{featuredAds[activeAd].title}</div>
                      {featuredAds[activeAd].subtitle && <div className="ad-main-subtitle">{featuredAds[activeAd].subtitle}</div>}
                      <button className="ad-main-cta" style={{ background: featuredAds[activeAd].accent }}
                        onClick={e => { e.stopPropagation(); handleAdNav(featuredAds[activeAd]?.ctaUrl); }}>
                        {featuredAds[activeAd].cta} <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="ads-side-stack">
                    {featuredAds.map((ad, i) => ({ ad, i })).filter(({ i }) => i !== activeAd).map(({ ad, i }) => (
                      <div key={i} className={`ad-side-card${i === (activeAd + 1) % featuredAds.length ? " highlighted" : ""}`}
                        onClick={() => { setActiveAd(i); handleAdNav(ad.ctaUrl); }}>
                        {ad.image ? (
                          <img src={ad.image} alt={ad.title} className="ad-side-thumb"
                            onError={e => { e.target.style.display = "none"; const p = e.target.nextElementSibling; if (p) p.style.display = "block"; }} />
                        ) : null}
                        <div className="ad-side-thumb-placeholder"
                          style={{ display: ad.image ? "none" : "block", background: `linear-gradient(135deg, ${ad.accent}55, ${ad.accent}22)` }} />
                        <div className="ad-side-body">
                          {ad.tag && <div className="ad-side-tag" style={{ color: ad.accent }}>{ad.tag}</div>}
                          <div className="ad-side-title">{ad.title}</div>
                          {ad.subtitle && <div className="ad-side-subtitle">{ad.subtitle}</div>}
                        </div>
                        <div className="ad-side-arrow"><ChevronRight size={18} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ══ COMPANIES ══ */}
        <section className="companies-section">
          <h2 className="companies-title">Top Companies Hiring Now</h2>
          <div className="companies-grid">
            {topCompanies.map((company, i) => (
              <div key={i} className="company-card" onClick={() => navigate(`/jobs?company=${company.name}`)}>
                <img src={company.logo} alt={company.name} className="company-logo"
                  onError={e => { e.target.style.display = "none"; e.target.parentElement.innerHTML = `<div style="font-size:18px;font-weight:600;color:#374151">${company.name}</div>`; }} />
              </div>
            ))}
          </div>
        </section>

        {/* ══ REVIEWS ══ */}
        <section className="reviews-section">
          <h2 className="reviews-title">What Users Say</h2>
          <p className="reviews-subtitle">Reviews from job seekers using GreenJobs</p>
          <div className="reviews-grid">
            {userReviews.map((review, i) => (
              <div key={i} className="review-card">
                <div className="review-header">
                  <div className="review-user">
                    <div className="review-name">{review.name}</div>
                    <div className="review-role">{review.role}</div>
                  </div>
                  <div className="review-rating">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <span key={index} className="review-star">{index < review.rating ? "★" : "☆"}</span>
                    ))}
                  </div>
                </div>
                <div className="review-comment">{review.comment}</div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* ══ FOOTER ══ */}
      <footer className="footer">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">GreenJobs</div>
            <p className="footer-desc">Your gateway to renewable energy careers. Connecting talent with purpose-driven opportunities.</p>
          </div>
          <div>
            <div className="footer-title">Quick Links</div>
            <div className="footer-links">
              <span className="footer-link" onClick={() => navigate("/")}>Home</span>
              <span className="footer-link">About Us</span>
            </div>
          </div>
          <div>
            <div className="footer-title">For Recruiters</div>
            <div className="footer-links">
              <span className="footer-link" onClick={() => navigate("/recruiter/login")}>Sign In</span>
              <span className="footer-link" onClick={() => navigate("/recruiter/signup")}>Sign Up</span>
            </div>
          </div>
          <div>
            <div className="footer-title">Contact</div>
            <div className="footer-links">
              <span className="footer-link">Address: Delhi</span>
              <span className="footer-link">Phone No.</span>
            </div>
          </div>
        </div>
        <div className="footer-bottom">© 2026 GreenJobs. All rights reserved.</div>
      </footer>
    </>
  );
}