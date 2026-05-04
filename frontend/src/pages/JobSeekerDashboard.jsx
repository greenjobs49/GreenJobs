import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/common/Navbar';
import toast from "react-hot-toast";
import MyApplications from './MyApplications';
import {
  Briefcase, FileText, User, Upload, AlertCircle, CheckCircle,
  Search, MapPin, Phone, Mail, GraduationCap, Zap, Clock,
  Linkedin, ChevronRight, ChevronLeft, Sparkles, TrendingUp,
  Star, Bell, BookOpen, Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config/api';

/* ─── helpers ─────────────────────────────────────────────── */
const normalizeAd = (ad) => ({
  ...ad,
  accent:   ad.accentColor || '#10b981',
  accentLight: (ad.accentColor || '#10b981') + '28',
  cta:      ad.ctaText  || 'Learn More',
  image:    ad.imageUrl || '',
  ctaUrl:   ad.ctaUrl   || '/jobs',
  tag:      ad.tag      || 'Sponsored',
});

export default function JobSeekerDashboard() {
  const { user, refreshUser, token } = useAuth();
  const navigate = useNavigate();

  /* profile data */
  const profile           = user?.jobSeekerProfile || {};
  const resumeUrl         = profile.resume;
  const profileProgress   = user?.profileProgress  || 0;
  const isProfileComplete = user?.profileCompleted;
  const firstName = profile.firstName || user?.name?.split(' ')[0] || 'User';
  const avatarInitial = (profile.firstName || user?.name || 'U').charAt(0).toUpperCase();
  const fullName  = profile.firstName && profile.lastName
    ? `${profile.firstName} ${profile.lastName}`
    : profile.fullName || user?.name || '—';

  /* ads state */
  const [spotlightAds,   setSpotlightAds]   = useState([]);
  const [fullBannerAds,  setFullBannerAds]  = useState([]);
  const [adsLoading,     setAdsLoading]     = useState(true);
  const [activeSpot,     setActiveSpot]     = useState(0);
  const [activeFB,       setActiveFB]       = useState(0);

  /* ui state */
  const [showDetails, setShowDetails] = useState(false);
  const [greeting,    setGreeting]    = useState('');

  useEffect(() => { refreshUser(); }, [refreshUser]);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
  }, []);

  /* fetch ads */
  useEffect(() => {
    (async () => {
      try {
        setAdsLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/ads`);
        const all = res.data.ads || [];
        setSpotlightAds(all.filter(a => a.bannerType === 'spotlight'));
        setFullBannerAds(all.filter(a => a.bannerType === 'full_banner'));
      } catch (e) { console.error('Ads fetch failed', e); }
      finally { setAdsLoading(false); }
    })();
  }, []);

  const spotAds = spotlightAds.map(normalizeAd);
  const fbAds   = fullBannerAds.map(normalizeAd);

  /* auto-rotate ads */
  useEffect(() => {
    if (spotAds.length <= 1) return;
    const t = setInterval(() => setActiveSpot(p => (p + 1) % spotAds.length), 5000);
    return () => clearInterval(t);
  }, [spotAds.length]);

  useEffect(() => {
    if (fbAds.length <= 1) return;
    const t = setInterval(() => setActiveFB(p => (p + 1) % fbAds.length), 6000);
    return () => clearInterval(t);
  }, [fbAds.length]);

  const handleAdNav = (url) => {
    if (!url) { navigate('/jobs'); return; }
    if (url.startsWith('http')) window.open(url, '_blank');
    else navigate(url);
  };

  /* profile detail sections */
  const detailSections = [
    {
      heading: 'Personal Info', icon: User, color: '#6366f1',
      fields: [
        { label: 'First Name',         value: profile.firstName },
        { label: 'Last Name',          value: profile.lastName  },
        { label: 'Email',              value: user?.email,                   icon: Mail   },
        { label: 'Mobile',             value: profile.mobile || user?.mobile, icon: Phone },
        { label: 'City',               value: profile.city,                  icon: MapPin },
        { label: 'Pincode',            value: profile.pincode  },
        { label: 'Ready to Relocate',  value: profile.readyToRelocate ? 'Yes' : 'No' },
      ],
    },
    {
      heading: 'Professional', icon: Briefcase, color: '#f59e0b',
      fields: [
        { label: 'Education',        value: profile.education,     icon: GraduationCap },
        { label: 'Experience (yrs)', value: profile.experience,    icon: Clock         },
        { label: 'Preferred Role',   value: profile.preferredRole                      },
        { label: 'Expected Salary',  value: profile.expectedSalary                     },
        { label: 'LinkedIn',         value: profile.linkedin,      icon: Linkedin, isLink: true },
        { label: 'Portfolio',        value: profile.portfolio,     isLink: true         },
      ],
    },
    {
      heading: 'About', icon: FileText, color: '#10b981', fullWidth: true,
      fields: [
        { label: 'About Me',        value: profile.about,           multiline: true },
        { label: 'Accomplishments', value: profile.accomplishments, multiline: true },
      ],
    },
  ];

  /* ── quick stats ── */
  const quickStats = [
    { icon: TrendingUp, label: 'Profile Score', value: `${profileProgress}%`, sub: 'completion',  color: '#6366f1', bg: '#eef2ff' },
    { icon: Star,       label: 'Profile',        value: isProfileComplete ? 'Active' : 'Incomplete', sub: 'status', color: '#f59e0b', bg: '#fffbeb' },
  ];
const handleViewResume = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/api/profile/resume-view-url`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data.type === "pdf") {
      window.open(res.data.url, "_blank");
    } else {
      const a = document.createElement("a");
      a.href = res.data.url;
      a.download = "resume.docx";
      a.click();
    }
  } catch {
    toast.error("Could not open resume");
  }
};
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Inter',sans-serif; background:#f4f6fb; color:#0f172a; }

        /* ── Root vars ── */
        :root {
          --green:   #10b981;
          --green-d: #059669;
          --indigo:  #6366f1;
          --amber:   #f59e0b;
          --surface: #ffffff;
          --bg:      #f4f6fb;
          --border:  #e5e9f2;
          --text:    #0f172a;
          --muted:   #64748b;
          --radius:  14px;
          --shadow:  0 2px 12px rgba(15,23,42,.06);
          --shadow-md: 0 6px 28px rgba(15,23,42,.10);
        }

        /* ── Layout ── */
        .jsd-wrap  { background:var(--bg); min-height:100vh; }
        .jsd-inner { max-width:1200px; margin:0 auto; padding:32px 24px 64px; }

        /* ── Page hero strip ── */
        .jsd-hero {
          background: linear-gradient(120deg,#0f172a 0%,#1e293b 55%,#134e35 100%);
          border-radius:20px; padding:40px 40px 36px;
          position:relative; overflow:hidden; margin-bottom:28px;
        }
        .jsd-hero::before {
          content:''; position:absolute; width:500px; height:500px;
          border-radius:50%; background:radial-gradient(circle,rgba(16,185,129,.18) 0%,transparent 65%);
          top:-180px; right:-80px; pointer-events:none;
        }
        .jsd-hero::after {
          content:''; position:absolute; inset:0;
          background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          pointer-events:none; opacity:1;
        }
        .jsd-hero-content { position:relative; z-index:2; }
        .jsd-hero-top { display:flex; align-items:center; gap:18px; margin-bottom:6px; }
.jsd-avatar {
  width:58px; height:58px; border-radius:14px; flex-shrink:0;
  background:linear-gradient(135deg,#1e293b,#0f172a);
  border:2px solid rgba(16,185,129,.45);
  display:flex; align-items:center; justify-content:center;
  font-size:22px; font-weight:800; color:#10b981;
  overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,.3);
}
.jsd-avatar img { width:100%; height:100%; object-fit:cover; }
.jsd-greeting { font-family:'Inter',sans-serif; font-size:28px; font-weight:800; color:#fff; line-height:1.15; letter-spacing:-0.5px; }
.jsd-greeting span { color:#10b981; }
.jsd-hero-sub { font-size:14px; color:rgba(255,255,255,.55); margin-bottom:28px; font-weight:400; }
        .jsd-hero-sub    { font-size:14px; color:rgba(255,255,255,.55); margin-bottom:28px; font-weight:400; }
        .jsd-hero-actions { display:flex; gap:10px; flex-wrap:wrap; }
        .hero-btn {
          display:inline-flex; align-items:center; gap:7px;
          padding:10px 20px; border-radius:10px; font-size:13.5px;
          font-weight:600; cursor:pointer; border:none; font-family:'Inter',sans-serif;
          transition:all .18s; letter-spacing:.1px;
        }
        .hero-btn-primary { background:#10b981; color:#fff; box-shadow:0 4px 16px rgba(16,185,129,.38); }
        .hero-btn-primary:hover { background:#059669; transform:translateY(-1px); box-shadow:0 6px 20px rgba(16,185,129,.45); }
        .hero-btn-ghost { background:rgba(255,255,255,.08); color:rgba(255,255,255,.85); border:1.5px solid rgba(255,255,255,.15); backdrop-filter:blur(6px); }
        .hero-btn-ghost:hover { background:rgba(255,255,255,.14); border-color:rgba(255,255,255,.3); }

        /* ── Progress pill on hero ── */
        .jsd-progress-row { margin-top:24px; }
        .jsd-progress-label { font-size:12px; color:rgba(255,255,255,.5); margin-bottom:7px; display:flex; justify-content:space-between; }
        .jsd-progress-label strong { color:rgba(255,255,255,.85); }
        .jsd-progress-track { height:5px; background:rgba(255,255,255,.12); border-radius:3px; overflow:hidden; }
        .jsd-progress-fill  { height:100%; border-radius:3px; background:linear-gradient(90deg,#10b981,#34d399); transition:width .5s ease; }

        /* ── Alert banner ── */
        .jsd-alert {
          display:flex; align-items:flex-start; gap:12px;
          padding:14px 18px; border-radius:12px; margin-bottom:20px;
          border:1.5px solid;
        }
        .jsd-alert.warn { background:#fffbeb; border-color:#fde68a; }
        .jsd-alert.ok   { background:#f0fdf4; border-color:#86efac; }
        .jsd-alert-body { flex:1; }
        .jsd-alert-title { font-size:14px; font-weight:600; color:#0f172a; }
        .jsd-alert-desc  { font-size:13px; color:#64748b; margin-top:2px; }

        /* ── Grid layout ── */
        .jsd-grid { display:grid; grid-template-columns:1fr 340px; gap:24px; align-items:start; }

        /* ── Card base ── */
        .jsd-card {
          background:var(--surface); border:1.5px solid var(--border);
          border-radius:var(--radius); padding:24px;
          box-shadow:var(--shadow);
        }
        .jsd-card + .jsd-card { margin-top:20px; }
        .jsd-card-title {
          font-family:'Inter',sans-serif; font-size:16px; font-weight:700;
          color:var(--text); margin-bottom:18px;
          display:flex; align-items:center; gap:8px;
        }
        .jsd-card-title-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }

        /* ── Stats row ── */
        .jsd-stats { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:20px; }
        .stat-chip {
          display:flex; align-items:center; gap:14px;
          padding:16px 18px; border-radius:12px; border:1.5px solid var(--border);
          background:var(--surface);
        }
        .stat-icon-wrap { width:42px; height:42px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .stat-val  { font-family:'Inter',sans-serif; font-size:22px; font-weight:800; color:var(--text); line-height:1; }
        .stat-lbl  { font-size:11.5px; color:var(--muted); font-weight:500; margin-top:2px; text-transform:uppercase; letter-spacing:.4px; }

        /* ── Resume status ── */
        .resume-chip {
          display:flex; align-items:center; gap:10px;
          padding:12px 16px; border-radius:10px; border:1.5px solid;
          font-size:13.5px; font-weight:500;
        }
        .resume-chip.ok  { background:#f0fdf4; border-color:#86efac; color:#065f46; }
        .resume-chip.bad { background:#fef2f2; border-color:#fecaca; color:#991b1b; }

        /* ── Action buttons row ── */
        .action-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px; }
        .action-btn {
          display:flex; align-items:center; justify-content:center; gap:7px;
          padding:11px 16px; border-radius:10px; font-size:13.5px;
          font-weight:600; cursor:pointer; border:none; font-family:'Inter',sans-serif;
          transition:all .18s;
        }
        .action-btn-primary { background:#0f172a; color:#fff; }
        .action-btn-primary:hover { background:#10b981; }
        .action-btn-outline { background:#fff; color:#475569; border:1.5px solid var(--border); }
        .action-btn-outline:hover { border-color:#10b981; color:#10b981; }

        /* ── Skills block ── */
        .skills-wrap { display:flex; flex-wrap:wrap; gap:7px; }
        .skill-pill {
          padding:5px 13px; border-radius:100px; font-size:12.5px; font-weight:500;
          background:#eff6ff; color:#1e40af; border:1px solid #dbeafe;
        }

        /* ── Profile details ── */
        .detail-block { margin-bottom:18px; border:1.5px solid var(--border); border-radius:12px; overflow:hidden; }
        .detail-block-head {
          display:flex; align-items:center; gap:9px; padding:11px 16px;
          background:#f8fafc; border-bottom:1.5px solid var(--border);
        }
        .detail-block-icon { width:28px; height:28px; border-radius:7px; display:flex; align-items:center; justify-content:center; }
        .detail-block-title { font-size:13px; font-weight:700; color:#0f172a; }
        .detail-fields { display:grid; grid-template-columns:1fr 1fr; }
        .detail-field { padding:12px 16px; border-bottom:1px solid #f1f5f9; }
        .detail-field:last-child { border-bottom:none; }
        .detail-field.fw { grid-column:1/-1; }
        .df-label { font-size:10.5px; font-weight:600; color:#94a3b8; text-transform:uppercase; letter-spacing:.06em; margin-bottom:3px; }
        .df-val   { font-size:13.5px; color:#0f172a; font-weight:500; word-break:break-word; }
        .df-val.ml { white-space:pre-wrap; line-height:1.65; font-weight:400; color:#334155; }
        .df-val a { color:#6366f1; text-decoration:none; }
        .df-val a:hover { text-decoration:underline; }
        .df-empty { color:#cbd5e1; font-style:italic; font-size:12.5px; }

        /* ── Toggle button ── */
        .toggle-btn {
          display:flex; align-items:center; gap:7px; width:100%;
          padding:11px 16px; border-radius:10px; border:1.5px solid var(--border);
          background:#f8fafc; font-size:13.5px; font-weight:600; color:#475569;
          cursor:pointer; transition:all .18s; font-family:'Inter',sans-serif;
          justify-content:center;
        }
        .toggle-btn:hover { border-color:#10b981; color:#10b981; background:#f0fdf4; }

        /* ══ SIDEBAR ══ */
        .jsd-sidebar { display:flex; flex-direction:column; gap:20px; }

        /* ── Inline spotlight ad ── */
        .spot-ad {
          border-radius:16px; overflow:hidden; position:relative;
          min-height:200px; height:200px; 
          width: 100%; max-width: 100%;
          cursor:pointer;
          transition:transform .25s, box-shadow .25s;
          background:#0f172a;
          -webkit-mask-image: -webkit-radial-gradient(white, black);
        }
        .spot-ad:hover { transform:translateY(-3px); box-shadow:0 16px 40px rgba(0,0,0,.15); }
        .spot-ad-img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover;object-position: center center; z-index:0; }
        .spot-ad-overlay { position:absolute; inset:0; z-index:1; background:linear-gradient(to top,rgba(0,0,0,.88) 0%,rgba(0,0,0,.45) 55%,rgba(0,0,0,.1) 100%); }
        .spot-ad-body { position:absolute; bottom:0; left:0; right:0; padding:20px 20px 24px; z-index:2; }
        .spot-ad-tag { display:inline-block; padding:3px 10px; border-radius:50px; font-size:9.5px; font-weight:800; letter-spacing:.9px; text-transform:uppercase; margin-bottom:8px; color:#fff; }
        .spot-ad-title { font-family:'Inter',sans-serif; font-size:18px; font-weight:800; color:#fff; line-height:1.25; margin-bottom:6px; }
        .spot-ad-sub { font-size:12.5px; color:rgba(255,255,255,.72); line-height:1.5; margin-bottom:14px; }
        .spot-ad-cta {
          display:inline-flex; align-items:center; gap:6px;
          padding:9px 18px; border-radius:8px; font-size:12.5px; font-weight:700;
          border:none; cursor:pointer; font-family:'Inter',sans-serif;
          transition:all .18s; color:#fff;
        }
        .spot-ad-cta:hover { transform:translateX(3px); filter:brightness(1.12); }
        .spot-ad-dots { display:flex; gap:5px; position:absolute; top:14px; right:14px; z-index:3; }
        .spot-ad-dot { width:5px; height:5px; border-radius:50%; background:rgba(255,255,255,.35); transition:all .3s; cursor:pointer; }
        .spot-ad-dot.active { background:#fff; width:14px; border-radius:3px; }

        /* ── Tip / info card ── */
        .tip-card {
          background:linear-gradient(135deg,#fef3c7,#fffbeb);
          border:1.5px solid #fde68a; border-radius:14px; padding:18px 20px;
        }
        .tip-header { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
        .tip-label { font-size:11px; font-weight:800; color:#92400e; text-transform:uppercase; letter-spacing:.8px; }
        .tip-text { font-size:13.5px; color:#78350f; line-height:1.65; }

        /* ── Full-banner ad (between sections) ── */
        .fb-ad-strip {
          border-radius:18px; overflow:hidden; position:relative;
          min-height:160px; height:160px; cursor:pointer; margin:28px 0;
          transition:transform .25s; background:#0f172a;
          isolation: isolate;          /* new */
          contain: paint;
         -webkit-mask-image: -webkit-radial-gradient(white, black);
        }
        .fb-ad-strip:hover { transform:translateY(-2px); }
        .fb-ad-strip .fb-img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:0; transition:transform 6s ease; }
        .fb-ad-strip:hover .fb-img { transform:scale(1.03); }
        .fb-ad-strip .fb-grad { position:absolute; inset:0; z-index:1; background:linear-gradient(105deg,rgba(0,0,0,.84) 0%,rgba(0,0,0,.5) 60%,rgba(0,0,0,.15) 100%); }
        .fb-ad-strip .fb-inner { position:relative; z-index:2; padding:28px 32px; display:flex; align-items:center; gap:24px; }
        .fb-ad-strip .fb-copy { flex:1; }
        .fb-ad-strip .fb-eyebrow { font-size:10px; font-weight:800; letter-spacing:1px; text-transform:uppercase; margin-bottom:6px; }
        .fb-ad-strip .fb-head { font-family:'Inter',sans-serif; font-size:22px; font-weight:800; color:#fff; line-height:1.2; margin-bottom:6px; letter-spacing:-.3px; }
        .fb-ad-strip .fb-sub { font-size:13px; color:rgba(255,255,255,.65); line-height:1.5; margin-bottom:16px; }
        .fb-ad-strip .fb-btn {
          display:inline-flex; align-items:center; gap:6px;
          padding:10px 20px; border-radius:9px; font-size:13px; font-weight:700;
          border:none; cursor:pointer; color:#fff; font-family:'Inter',sans-serif;
          transition:all .18s;
        }
        .fb-ad-strip .fb-btn:hover { filter:brightness(1.12); transform:translateY(-1px); }
        .fb-nav { display:flex; gap:6px; position:absolute; bottom:12px; right:16px; z-index:3; }
        .fb-nav-dot { width:5px; height:5px; border-radius:50%; background:rgba(255,255,255,.3); cursor:pointer; transition:all .3s; }
        .fb-nav-dot.active { width:16px; border-radius:3px; background:#fff; }

        /* ── Section divider label ── */
        .section-label {
          font-family:'Inter',sans-serif; font-size:15px; font-weight:700;
          color:var(--text); margin:28px 0 16px; display:flex; align-items:center; gap:10px;
        }
        .section-label::after { content:''; flex:1; height:1.5px; background:var(--border); }

        /* ── Responsive ── */
        @media (max-width: 900px) {
        .jsd-grid { grid-template-columns: 1fr; }
        .jsd-sidebar {
          order: -1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          width: 100%;
          min-width: 0;
          overflow: hidden;
        }
        /* make each sidebar child respect its column width */
        .jsd-sidebar > * {
          min-width: 0;
          max-width: 100%;
        }
      }
        @media (max-width: 640px) {
          .jsd-inner { padding: 16px 14px 48px; }
          .jsd-hero  { padding: 28px 22px 26px; border-radius: 16px; }
          .jsd-greeting { font-size: 22px; }
          .jsd-stats { grid-template-columns: 1fr 1fr; gap: 10px; }
          .action-row { grid-template-columns: 1fr; }
          .detail-fields { grid-template-columns: 1fr; }

          .jsd-sidebar {
            grid-template-columns: 1fr;
            overflow: hidden;
            min-width: 0;
          }
          .jsd-sidebar > * {
            min-width: 0; 
            max-width: 100%;
          }

          .spot-ad {
            border-radius: 12px;
            width: 100%;
            max-width: 100%;
          }

          .fb-ad-strip { border-radius: 12px; margin: 18px 0; }
          .fb-ad-strip .fb-inner { padding: 20px 18px; }
          .fb-ad-strip .fb-head  { font-size: 17px; }
          .fb-ad-strip:hover .fb-img { transform: none; }
        }
      `}</style>

      <Navbar />

      <div className="jsd-wrap">
        <div className="jsd-inner">

          {/* ═══ HERO STRIP ═══ */}
          <div className="jsd-hero">
            <div className="jsd-hero-content">
              <div className="jsd-hero-top">
                <div className="jsd-avatar">
                  {user?.profilePicture
                    ? <img src={user.profilePicture} alt={firstName} />
                    : avatarInitial
                  }
                </div>
                <div>
                  <div className="jsd-greeting">
                    {greeting}, <span>{firstName}</span>
                  </div>
                  <p className="jsd-hero-sub">
                    Your dashboard — track progress, discover jobs, manage applications.
                  </p>
                </div>
              </div>
              <div className="jsd-hero-actions">
                <button className="hero-btn hero-btn-primary" onClick={() => navigate('/jobs')}>
                  <Search size={15} /> Browse Jobs
                </button>
                <button className="hero-btn hero-btn-ghost" onClick={() => navigate('/complete-profile')}>
                  <User size={15} /> {isProfileComplete ? 'Update Profile' : 'Complete Profile'}
                </button>
                {resumeUrl && (
                  <button className="hero-btn hero-btn-ghost" onClick={handleViewResume}>
                  <FileText size={15} /> View Resume
                </button>
                )}
                <button className="hero-btn hero-btn-ghost" onClick={() => window.open('/sample-resume.pdf', '_blank')}              >
                <BookOpen size={15} /> How a Good CV Looks
              </button>
              </div>
              <div className="jsd-progress-row">
                <div className="jsd-progress-label">
                  <span>Profile completion</span>
                  <strong>{profileProgress}%</strong>
                </div>
                <div className="jsd-progress-track">
                  <div className="jsd-progress-fill" style={{ width:`${profileProgress}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* ═══ STATUS ALERTS ═══ */}
          {!isProfileComplete && (
            <div className="jsd-alert warn">
              <AlertCircle size={18} color="#f59e0b" style={{ flexShrink:0, marginTop:2 }} />
              <div className="jsd-alert-body">
                <div className="jsd-alert-title">Your profile is {profileProgress}% complete</div>
                <div className="jsd-alert-desc">Recruiters can't find you yet. Finish your profile to get discovered.</div>
              </div>
              <button className="action-btn action-btn-primary" style={{ padding:'8px 16px', fontSize:'12.5px', flexShrink:0 }}
                onClick={() => navigate('/complete-profile')}>
                Finish Now
              </button>
            </div>
          )}
          {isProfileComplete && (
            <div className="jsd-alert ok">
              <CheckCircle size={18} color="#10b981" style={{ flexShrink:0, marginTop:2 }} />
              <div className="jsd-alert-body">
                <div className="jsd-alert-title">Profile is live — recruiters can find you!</div>
                <div className="jsd-alert-desc">Keep it updated for the best results.</div>
              </div>
            </div>
          )}

          {/* ═══ MAIN 2-COL GRID ═══ */}
          <div className="jsd-grid">

            {/* ── LEFT COLUMN ── */}
            <div>

              {/* Stats chips */}
              <div className="jsd-stats">
                {quickStats.map((s,i) => {
                  const Icon = s.icon;
                  return (
                    <div key={i} className="stat-chip">
                      <div className="stat-icon-wrap" style={{ background:s.bg }}>
                        <Icon size={20} color={s.color} />
                      </div>
                      <div>
                        <div className="stat-val">{s.value}</div>
                        <div className="stat-lbl">{s.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick actions card */}
              <div className="jsd-card">
                <div className="jsd-card-title">
                  <span className="jsd-card-title-dot" style={{ background:'#10b981' }} />
                  Quick Actions
                </div>
                <div className="action-row">
                  <button className="action-btn action-btn-primary" onClick={() => navigate('/complete-profile')}>
                    <User size={15} /> {isProfileComplete ? 'Update Profile' : 'Complete Profile'}
                  </button>
                  <button className="action-btn action-btn-outline" onClick={() => navigate('/jobs')}>
                    <Search size={15} /> Browse Jobs
                  </button>
                  {resumeUrl ? (
                    <button className="action-btn action-btn-outline" onClick={handleViewResume}>
                      <FileText size={15} /> View Resume
                    </button>
                  ) : (
                    <button className="action-btn action-btn-outline" onClick={() => navigate('/complete-profile')}>
                      <Upload size={15} /> Upload Resume
                    </button>
                  )}
                  <button className="action-btn action-btn-outline" onClick={() => navigate('/jobs')}>
                    <TrendingUp size={15} /> Explore Roles
                  </button>
                </div>

                {/* Resume status */}
                <div className={`resume-chip ${resumeUrl ? 'ok' : 'bad'}`}>
                  {resumeUrl
                    ? <><CheckCircle size={15} /><span><strong>Resume uploaded</strong> — visible to recruiters</span></>
                    : <><AlertCircle  size={15} /><span><strong>No resume yet</strong> — add one to stand out</span></>
                  }
                </div>
              </div>

              {/* ── FULL BANNER AD (between quick actions & profile) ── */}
              {!adsLoading && fbAds.length > 0 && (() => {
                const ad = fbAds[activeFB];
                return (
                  <div className="fb-ad-strip" onClick={() => handleAdNav(ad.ctaUrl)}>
                    {ad.image && <img src={ad.image} alt={ad.title} className="fb-img" onError={e => e.target.style.display='none'} />}
                    <div className="fb-grad" />
                    <div className="fb-inner">
                      <div className="fb-copy">
                        {ad.tag && <div className="fb-eyebrow" style={{ color:ad.accent }}>{ad.tag}</div>}
                        <div className="fb-head">{ad.bannerHeadline || ad.title}</div>
                        <div className="fb-sub">{ad.bannerDescription || ad.subtitle}</div>
                        <button className="fb-btn" style={{ background:ad.accent }}
                          onClick={e => { e.stopPropagation(); handleAdNav(ad.ctaUrl); }}>
                          {ad.cta} <ChevronRight size={15} />
                        </button>
                      </div>
                    </div>
                    {fbAds.length > 1 && (
                      <div className="fb-nav">
                        {fbAds.map((_,i) => (
                          <div key={i} className={`fb-nav-dot${i===activeFB?' active':''}`}
                            onClick={e => { e.stopPropagation(); setActiveFB(i); }} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ── Profile details card ── */}
              <div className="jsd-card">
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: showDetails ? 20 : 0 }}>
                  <div className="jsd-card-title" style={{ margin:0 }}>
                    <span className="jsd-card-title-dot" style={{ background:'#6366f1' }} />
                    My Profile
                  </div>
                  <button className="toggle-btn" style={{ width:'auto', padding:'8px 14px' }}
                    onClick={() => setShowDetails(v => !v)}>
                    {showDetails ? 'Hide Details' : 'View Details'}
                    <ChevronRight size={14} style={{ transform: showDetails ? 'rotate(90deg)':'rotate(0deg)', transition:'transform .2s' }} />
                  </button>
                </div>

                {showDetails && (
                  <div>
                    {detailSections.map(sec => {
                      const SIcon = sec.icon;
                      return (
                        <div key={sec.heading} className="detail-block">
                          <div className="detail-block-head">
                            <div className="detail-block-icon" style={{ background:`${sec.color}18` }}>
                              <SIcon size={14} color={sec.color} />
                            </div>
                            <span className="detail-block-title">{sec.heading}</span>
                          </div>
                          <div className="detail-fields">
                            {sec.fields.map(f => {
                              const FIcon = f.icon;
                              return (
                                <div key={f.label} className={`detail-field${sec.fullWidth||f.multiline?' fw':''}`}>
                                  <div className="df-label">
                                    {FIcon && <FIcon size={10} style={{ display:'inline', marginRight:3 }} />}
                                    {f.label}
                                  </div>
                                  <div className={`df-val${f.multiline?' ml':''}`}>
                                    {f.value
                                      ? f.isLink
                                        ? <a href={f.value} target="_blank" rel="noreferrer">{f.value}</a>
                                        : f.value
                                      : <span className="df-empty">Not provided</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {/* Skills */}
                    <div className="detail-block">
                      <div className="detail-block-head">
                        <div className="detail-block-icon" style={{ background:'#fef3c7' }}>
                          <Zap size={14} color="#f59e0b" />
                        </div>
                        <span className="detail-block-title">Skills</span>
                      </div>
                      <div style={{ padding:'14px 16px' }}>
                        {profile.skills?.length > 0
                          ? <div className="skills-wrap">{profile.skills.map((s,i) => <span key={i} className="skill-pill">{s}</span>)}</div>
                          : <span className="df-empty">No skills added yet</span>}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Applications section ── */}
              <div className="section-label">My Applications</div>
              <MyApplications />
            </div>

            {/* ── RIGHT SIDEBAR ── */}
            <div className="jsd-sidebar">

              {/* Spotlight ad */}
              {!adsLoading && spotAds.length > 0 && (() => {
                const ad = spotAds[activeSpot];
                return (
                  <div className="spot-ad" onClick={() => handleAdNav(ad.ctaUrl)}>
                    {ad.image
                      ? <img src={ad.image} alt={ad.title} className="spot-ad-img" onError={e => e.target.style.display='none'} />
                      : <div style={{ position:'absolute', inset:0, background:`linear-gradient(135deg,${ad.accent}88,#0f172a)`, zIndex:0 }} />
                    }
                    <div className="spot-ad-overlay" />
                    <div className="spot-ad-body">
                      {ad.tag && (
                        <div className="spot-ad-tag" style={{ background:`${ad.accent}40`, border:`1px solid ${ad.accent}60` }}>
                          {ad.tag}
                        </div>
                      )}
                      <div className="spot-ad-title">{ad.title}</div>
                      {ad.subtitle && <div className="spot-ad-sub">{ad.subtitle}</div>}
                      <button className="spot-ad-cta" style={{ background:ad.accent }}
                        onClick={e => { e.stopPropagation(); handleAdNav(ad.ctaUrl); }}>
                        {ad.cta} <ChevronRight size={14} />
                      </button>
                    </div>
                    {spotAds.length > 1 && (
                      <div className="spot-ad-dots">
                        {spotAds.map((_,i) => (
                          <div key={i} className={`spot-ad-dot${i===activeSpot?' active':''}`}
                            onClick={e => { e.stopPropagation(); setActiveSpot(i); }} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Tip card */}
              <div className="tip-card">
                <div className="tip-header">
                  <span className="tip-label">Pro Tip</span>
                </div>
                <div className="tip-text">
                  {!isProfileComplete
                    ? 'Complete your profile to appear in recruiter searches. A full profile gets 3× more views.'
                    : 'Upload your latest resume and keep your skills updated to match new job openings automatically.'}
                </div>
              </div>

              {/* Quick links card */}
              <div className="jsd-card" style={{ padding:'18px 20px' }}>
                <div className="jsd-card-title" style={{ fontSize:'14px', marginBottom:'14px' }}>
                  <span className="jsd-card-title-dot" style={{ background:'#6366f1' }} />
                  Explore
                </div>
                {[
                  { icon: Search,   label: 'Browse all jobs',       path: '/jobs' },
                  { icon: BookOpen, label: 'Green energy careers',  path: '/jobs?category=Solar+%26+Renewable' },
                  { icon: Award,    label: 'Featured companies',    path: '/businesses' },
                ].map((item,i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} onClick={() => navigate(item.path)}
                      style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 0',
                        borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none',
                        cursor:'pointer', transition:'color .15s', color:'#475569' }}
                      onMouseEnter={e => e.currentTarget.style.color='#10b981'}
                      onMouseLeave={e => e.currentTarget.style.color='#475569'}>
                      <Icon size={15} />
                      <span style={{ fontSize:'13.5px', fontWeight:'500' }}>{item.label}</span>
                      <ChevronRight size={13} style={{ marginLeft:'auto' }} />
                    </div>
                  );
                })}
              </div>

              {/* Second spotlight ad (if multiple) */}
              {!adsLoading && spotAds.length > 1 && (() => {
                const idx = (activeSpot + 1) % spotAds.length;
                const ad  = spotAds[idx];
                return (
                  <div className="spot-ad" style={{ minHeight:'160px', height:'160px' }} onClick={() => handleAdNav(ad.ctaUrl)}>
                    {ad.image
                      ? <img src={ad.image} alt={ad.title} className="spot-ad-img" onError={e => e.target.style.display='none'} />
                      : <div style={{ position:'absolute', inset:0, background:`linear-gradient(135deg,${ad.accent}88,#1e293b)`, zIndex:0 }} />
                    }
                    <div className="spot-ad-overlay" />
                    <div className="spot-ad-body">
                      {ad.tag && <div className="spot-ad-tag" style={{ background:`${ad.accent}40`, border:`1px solid ${ad.accent}60` }}>{ad.tag}</div>}
                      <div className="spot-ad-title" style={{ fontSize:'15px' }}>{ad.title}</div>
                      <button className="spot-ad-cta" style={{ background:ad.accent, padding:'7px 14px', fontSize:'12px' }}
                        onClick={e => { e.stopPropagation(); handleAdNav(ad.ctaUrl); }}>
                        {ad.cta} <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })()}

            </div>
            {/* end sidebar */}
          </div>
          {/* end grid */}

        </div>
      </div>
    </>
  );
}