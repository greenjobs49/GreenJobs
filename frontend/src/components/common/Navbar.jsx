import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import BannerEditModal from "./BannerEditModal";
import apiClient from "../../api/apiClient";

const roles = [
  { key: "job-seeker", label: "Job Seeker",    desc: "Find green energy jobs",       color: "#10b981" },
  { key: "recruiter",  label: "Recruiter",      desc: "Post & manage job listings",   color: "#3b82f6" },
  { key: "business",   label: "Business Owner", desc: "Grow your green business",     color: "#8b5cf6" },
];

const ROLE_LABELS = {
  jobseeker:    "Job Seeker",
  "job-seeker": "Job Seeker",
  recruiter:    "Recruiter",
  business:     "Business Owner",
  admin:        "Admin",
};

/* ─── Role Dropdown ─── */
const RoleDropdown = ({ type, onSelect, onClose, wrapperRef }) => {
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) onClose();
    };
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", handler); };
  }, [onClose, wrapperRef]);

  return (
    <div className="rd-panel">
      <div className="rd-header">
        <span className="rd-title">{type === "login" ? "Sign In" : "Create Account"}</span>
        <span className="rd-sub">Choose your role to continue</span>
      </div>
      <div className="rd-list">
        {roles.map((role) => (
          <div key={role.key} className="rd-item"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onSelect(role.key); }}>
            <div className="rd-item-text">
              <div className="rd-item-label">{role.label}</div>
              <div className="rd-item-desc">{role.desc}</div>
            </div>
            <svg className="rd-item-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
        ))}
      </div>
      <div className="rd-footer">
        {type === "login"
          ? <>No account? <span className="rd-flink" onMouseDown={(e) => { e.preventDefault(); onClose(); }}>Sign up →</span></>
          : <>Have an account? <span className="rd-flink" onMouseDown={(e) => { e.preventDefault(); onClose(); }}>Sign in →</span></>
        }
      </div>
    </div>
  );
};

/* ─── User Menu Dropdown ─── */
const UserMenu = ({ user, roleLabel, dashboardRoute, onProfile, onLogout, onClose, wrapperRef }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) onClose();
    };
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", handler); };
  }, [onClose, wrapperRef]);

  return (
    <div className="um-panel">
      <div className="um-header">
        <div className="um-avatar-lg">
          {user?.profilePicture && (user.role === "business" || user.role === "recruiter") ? (
            <img src={user.profilePicture} alt={user.name} style={{ width: "100%", height: "100%", borderRadius: "inherit", objectFit: "cover" }} />
          ) : (
            user?.name?.charAt(0).toUpperCase() || "U"
          )}
        </div>
        <div className="um-info">
          <div className="um-name">{user?.name || "User"}</div>
          <div className="um-email">{user?.email}</div>
          <div className="um-role-badge">{roleLabel}</div>
        </div>
      </div>
      <div className="um-divider" />
      <div className="um-list">
        <div className="um-item" onMouseDown={(e) => { e.preventDefault(); onProfile(); }}>
          <div className="um-item-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div className="um-item-text">
            <div className="um-item-label">My Profile</div>
            <div className="um-item-desc">View and edit your details</div>
          </div>
        </div>
        <div className="um-item" onMouseDown={(e) => { e.preventDefault(); onClose(); navigate(dashboardRoute); }}>
          <div className="um-item-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
          </div>
          <div className="um-item-text">
            <div className="um-item-label">Dashboard</div>
            <div className="um-item-desc">Go to your workspace</div>
          </div>
        </div>
      </div>
      <div className="um-divider" />
      <div className="um-list">
        <div className="um-item um-item-danger" onMouseDown={(e) => { e.preventDefault(); onLogout(); }}>
          <div className="um-item-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </div>
          <div className="um-item-text">
            <div className="um-item-label">Logout</div>
            <div className="um-item-desc">Sign out of your account</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Navbar ─── */
const Navbar = ({ title }) => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const [loginDropdown,  setLoginDropdown]  = useState(false);
  const [signupDropdown, setSignupDropdown] = useState(false);
  const [userMenuOpen,   setUserMenuOpen]   = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileAuthPanel, setMobileAuthPanel] = useState(null);

  // ── Banner state — stores full banner object so modal gets all fields ──────
  const [banner, setBanner] = useState({
    imageUrl:     "/worker-navbar.jpeg",
    altText:      "Navbar Banner",
    height:       "75px",
    borderRadius: "8px",
  });
  const [bannerEditOpen, setBannerEditOpen] = useState(false);
  const [bannerLoading,  setBannerLoading]  = useState(false);

  const loginRef    = useRef(null);
  const signupRef   = useRef(null);
  const userMenuRef = useRef(null);
  const pollRef     = useRef(null);

  // ── Fetch banner from server ───────────────────────────────────────────────
  const fetchBanner = useCallback(async () => {
    try {
      const res = await apiClient.get("/admin/navbar-banner");
      if (res.data?.banner) {
        setBanner(prev => ({
          imageUrl:     res.data.banner.imageUrl     || prev.imageUrl,
          altText:      res.data.banner.altText      || prev.altText,
          height:       res.data.banner.height       || prev.height,
          borderRadius: res.data.banner.borderRadius || prev.borderRadius,
        }));
      }
    } catch {
      // silently keep existing / default banner
    }
  }, []);

  // Initial fetch + poll every 30s so other tabs / sessions stay in sync
  useEffect(() => {
    fetchBanner();
    pollRef.current = setInterval(fetchBanner, 30000);
    return () => clearInterval(pollRef.current);
  }, [fetchBanner]);

  // Also re-fetch whenever the tab regains focus (catches edits from other tabs instantly)
  useEffect(() => {
    const onFocus = () => fetchBanner();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchBanner]);

  const handleLogout = () => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    logout();
    navigate("/");
  };

  // ── Save banner — updates DB then immediately reflects in the navbar ───────
  const handleSaveBanner = async (formData) => {
    setBannerLoading(true);
    try {
      const res = await apiClient.put("/admin/navbar-banner", {
        imageUrl:     formData.imageUrl,
        altText:      formData.altText,
        height:       formData.height,
        borderRadius: formData.borderRadius,
      });
      if (res.data?.success) {
        // Instant local update — no need to wait for the next poll
        setBanner({
          imageUrl:     formData.imageUrl,
          altText:      formData.altText,
          height:       formData.height,
          borderRadius: formData.borderRadius,
        });
        return true;
      }
    } catch (err) {
      throw new Error(err.response?.data?.message || "Failed to update banner");
    } finally {
      setBannerLoading(false);
    }
  };

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => { if (window.innerWidth > 768) setMobileMenuOpen(false); };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const LOGIN_ROUTES  = { "job-seeker": "/login",  recruiter: "/recruiter/login",  business: "/business/login"  };
  const SIGNUP_ROUTES = { "job-seeker": "/signup", recruiter: "/recruiter/signup", business: "/business/signup" };

  const handleRoleLogin  = (role) => { setLoginDropdown(false);  setMobileMenuOpen(false); navigate(LOGIN_ROUTES[role]  || "/login");  };
  const handleRoleSignup = (role) => { setSignupDropdown(false); setMobileMenuOpen(false); navigate(SIGNUP_ROUTES[role] || "/signup"); };

  const userRoleLabel = ROLE_LABELS[user?.role] || user?.role || "Member";

  const dashboardRoute =
    user?.role === "admin"     ? "/admin/dashboard" :
    user?.role === "recruiter" ? "/recruiter/dashboard" :
    user?.role === "business"  ? "/business/dashboard" :
    "/dashboard";

  const isJobSeeker   = user?.role === "jobseeker" || user?.role === "job-seeker";
  const showCompanies = !isJobSeeker;

  const handleProfile    = () => { setUserMenuOpen(false); setMobileMenuOpen(false); navigate("/profile"); };
  const closeMobileMenu  = () => { setMobileMenuOpen(false); setMobileAuthPanel(null); };

  return (
    <>
      <style>{`
        .navbar-fixed {
          position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
          background: white; border-bottom: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        body { padding-top: 82px; }
        .navbar-container {
          max-width: 100%; margin: 0 auto; padding: 0 40px;
          display: flex; align-items: center; justify-content: space-between;
          height: 82px; position: relative;
        }
        .navbar-left { display: flex; align-items: center; gap: 16px; }
        .navbar-logo { display: flex; flex-direction: column; align-items: center; justify-content: center; text-decoration: none; cursor: pointer; min-width: 120px; }
        .logo-image { height: 52px; width: auto; object-fit: contain; }
        .logo-text { display: flex; flex-direction: column; align-items: center; justify-content: center; margin-top: 2px; }
        .logo-brand { font-size: 20px; font-weight: 800; letter-spacing: 0.5px; }
        .logo-green { color: #16a34a; }
        .logo-black { color: #111827; }
        .navbar-center {
          position: absolute; left: 50%; transform: translateX(-50%);
          display: flex; align-items: center; pointer-events: auto; z-index: 5;
        }
        .worker-image { width: auto; object-fit: contain; cursor: pointer; transition: opacity 0.3s; }
        .navbar-right { display: flex; align-items: center; gap: 8px; position: relative; z-index: 1; }
        .nav-links {
          display: flex; align-items: center; gap: 2px;
          background: #f7f8fa; border: 1px solid #eaecef;
          border-radius: 12px; padding: 4px; margin-right: 6px;
        }
        .nav-link {
          display: flex; align-items: center; padding: 7px 15px;
          border-radius: 9px; font-size: 13.5px; font-weight: 600;
          color: #4b5563; text-decoration: none; transition: all 0.15s; white-space: nowrap;
        }
        .nav-link:hover { color: #111827; background: white; box-shadow: 0 1px 5px rgba(0,0,0,0.07); }
        .nav-sep { width: 1px; height: 22px; background: #e5e7eb; flex-shrink: 0; margin: 0 2px; }
        .user-menu-wrap { position: relative; }
        .user-chip {
          display: flex; align-items: center; gap: 9px;
          padding: 5px 12px 5px 5px;
          background: #f8fafc; border: 1.5px solid #e5e7eb; border-radius: 50px;
          cursor: pointer; transition: all 0.18s; user-select: none;
        }
        .user-chip:hover { border-color: #10b981; background: #f0fdf4; }
        .user-chip.open  { border-color: #10b981; background: #f0fdf4; box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }
        .user-avatar {
          width: 32px; height: 32px;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 800; font-size: 13px; flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(16,185,129,0.3); overflow: hidden;
        }
        .user-details { display: flex; flex-direction: column; gap: 1px; }
        .user-name-txt  { font-size: 13px; font-weight: 700; color: #111827; line-height: 1.1; }
        .user-role-txt  { font-size: 10.5px; color: #9ca3af; font-weight: 500; }
        .user-chip-caret { font-size: 9px; color: #9ca3af; transition: transform 0.2s; display: inline-block; line-height: 1; margin-left: 2px; }
        .user-chip-caret.open { transform: rotate(180deg); color: #10b981; }
        .um-panel {
          position: absolute; top: calc(100% + 10px); right: 0; z-index: 99999;
          width: 272px; background: white;
          border: 1px solid #f0f0f0; border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.13), 0 4px 20px rgba(0,0,0,0.06);
          overflow: hidden; animation: umIn 0.18s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes umIn { from { opacity: 0; transform: translateY(-8px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .um-header { display: flex; align-items: center; gap: 12px; padding: 16px 16px 14px; background: linear-gradient(to bottom, #fafafa, white); }
        .um-avatar-lg {
          width: 44px; height: 44px; border-radius: 12px;
          background: linear-gradient(135deg, #10b981, #059669);
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 800; font-size: 18px; flex-shrink: 0;
          box-shadow: 0 3px 8px rgba(16,185,129,0.3); overflow: hidden;
        }
        .um-info { flex: 1; min-width: 0; }
        .um-name  { font-size: 14px; font-weight: 700; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .um-email { font-size: 11.5px; color: #9ca3af; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }
        .um-role-badge { display: inline-block; margin-top: 5px; padding: 2px 9px; border-radius: 20px; font-size: 10.5px; font-weight: 700; background: #d1fae5; color: #065f46; letter-spacing: 0.3px; }
        .um-divider { height: 1px; background: #f3f4f6; margin: 0; }
        .um-list { padding: 6px; }
        .um-item { display: flex; align-items: center; gap: 11px; padding: 10px; border-radius: 10px; cursor: pointer; transition: background 0.13s; user-select: none; }
        .um-item:hover { background: #f8fafc; }
        .um-item:hover .um-item-icon { background: #f0fdf4; color: #10b981; }
        .um-item-danger:hover { background: #fef2f2; }
        .um-item-danger:hover .um-item-icon { background: #fef2f2; color: #dc2626; }
        .um-item-danger:hover .um-item-label { color: #dc2626; }
        .um-item-icon { width: 34px; height: 34px; border-radius: 9px; background: #f8fafc; border: 1px solid #f0f0f0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #64748b; transition: all 0.13s; }
        .um-item-text { flex: 1; min-width: 0; }
        .um-item-label { font-size: 13.5px; font-weight: 700; color: #111827; margin-bottom: 1px; transition: color 0.13s; }
        .um-item-desc  { font-size: 11.5px; color: #9ca3af; font-weight: 500; }
        .auth-btn-group { display: flex; align-items: center; gap: 8px; }
        .dropdown-wrapper { position: relative; }
        .rd-panel {
          position: absolute; top: calc(100% + 10px); right: 0; z-index: 99999;
          width: 288px; background: white;
          border: 1px solid #f0f0f0; border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.13), 0 4px 20px rgba(0,0,0,0.06);
          overflow: hidden; animation: rdIn 0.18s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes rdIn { from { opacity: 0; transform: translateY(-8px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .rd-header { padding: 15px 18px 11px; border-bottom: 1px solid #f3f4f6; background: linear-gradient(to bottom, #fafafa, white); }
        .rd-title  { display: block; font-size: 15px; font-weight: 800; color: #111827; letter-spacing: -0.2px; }
        .rd-sub    { display: block; font-size: 12px; color: #9ca3af; font-weight: 500; margin-top: 2px; }
        .rd-list   { padding: 8px; display: flex; flex-direction: column; gap: 2px; }
        .rd-item   { display: flex; align-items: center; gap: 11px; padding: 10px; border-radius: 10px; cursor: pointer; transition: background 0.13s; user-select: none; }
        .rd-item:hover { background: #f8fafc; }
        .rd-item:hover .rd-item-arrow { opacity: 1; transform: translateX(0); color: #10b981; }
        .rd-item-text  { flex: 1; }
        .rd-item-label { font-size: 13.5px; font-weight: 700; color: #111827; margin-bottom: 2px; }
        .rd-item-desc  { font-size: 11.5px; color: #9ca3af; font-weight: 500; }
        .rd-item-arrow { color: #d1d5db; opacity: 0; transform: translateX(-4px); transition: all 0.14s; flex-shrink: 0; }
        .rd-footer  { padding: 11px 18px; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af; background: #fafafa; font-weight: 500; }
        .rd-flink   { color: #10b981; font-weight: 700; cursor: pointer; }
        .rd-flink:hover { color: #059669; }
        .nav-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 18px; font-size: 13.5px; font-weight: 700;
          border-radius: 10px; cursor: pointer;
          transition: all 0.18s ease; font-family: inherit;
          white-space: nowrap; letter-spacing: 0.1px;
        }
        .btn-login  { background: white; color: #374151; border: 1.5px solid #d1d5db; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
        .btn-login:hover  { border-color: #9ca3af; color: #111827; background: #fafafa; box-shadow: 0 2px 8px rgba(0,0,0,0.09); transform: translateY(-1px); }
        .btn-login.active { border-color: #10b981; color: #15803d; background: #f0fdf4; }
        .btn-signup { background: linear-gradient(135deg, #16a34a 0%, #10b981 100%); color: white; border: none; box-shadow: 0 3px 12px rgba(16,185,129,0.35); }
        .btn-signup:hover  { background: linear-gradient(135deg, #15803d 0%, #059669 100%); box-shadow: 0 5px 18px rgba(16,185,129,0.45); transform: translateY(-1px); }
        .btn-signup.active { background: linear-gradient(135deg, #15803d 0%, #059669 100%); transform: translateY(-1px); }
        .btn-chevron { font-size: 9px; transition: transform 0.2s; display: inline-block; opacity: 0.6; line-height: 1; }
        .btn-chevron.open { transform: rotate(180deg); opacity: 1; }
        .banner-ad-image { height: 0; width: auto; object-fit: contain; }

        /* ── Banner edit overlay button ── */
        .banner-edit-btn {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0,0,0,0.62); color: white;
          border: none; padding: 7px 14px; border-radius: 7px;
          cursor: pointer; font-size: 12px; font-weight: 700;
          opacity: 0; transition: opacity 0.25s;
          white-space: nowrap; pointer-events: auto;
          backdrop-filter: blur(2px);
        }
        .banner-wrap:hover .banner-edit-btn { opacity: 1; }

        .hamburger-btn {
          display: none;
          flex-direction: column; justify-content: center; align-items: center;
          gap: 5px; width: 42px; height: 42px; cursor: pointer;
          background: #f8fafc; border: 1.5px solid #e5e7eb; border-radius: 10px;
          transition: all 0.18s; flex-shrink: 0; z-index: 10001;
        }
        .hamburger-btn:hover { background: #f0fdf4; border-color: #10b981; }
        .hamburger-btn.open  { background: #f0fdf4; border-color: #10b981; }
        .hb-line { width: 18px; height: 2px; background: #374151; border-radius: 2px; transition: all 0.25s cubic-bezier(0.16,1,0.3,1); transform-origin: center; }
        .hamburger-btn.open .hb-line:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .hamburger-btn.open .hb-line:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .hamburger-btn.open .hb-line:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
        .mobile-overlay { display: none; position: fixed; inset: 0; z-index: 9998; background: rgba(0,0,0,0.35); backdrop-filter: blur(2px); animation: overlayIn 0.22s ease; }
        @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
        .mobile-overlay.visible { display: block; }
        .mobile-drawer { display: none; position: fixed; top: 0; right: 0; bottom: 0; z-index: 9999; width: 300px; max-width: 90vw; background: white; box-shadow: -8px 0 40px rgba(0,0,0,0.14); flex-direction: column; animation: drawerIn 0.28s cubic-bezier(0.16,1,0.3,1); overflow-y: auto; }
        @keyframes drawerIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .mobile-drawer.visible { display: flex; }
        .md-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 20px 16px; border-bottom: 1px solid #f3f4f6; background: linear-gradient(to bottom, #fafafa, white); flex-shrink: 0; }
        .md-logo { display: flex; flex-direction: column; align-items: flex-start; text-decoration: none; }
        .md-logo-brand { font-size: 18px; font-weight: 800; }
        .md-close-btn { width: 34px; height: 34px; border-radius: 8px; background: #f1f5f9; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; transition: all 0.15s; flex-shrink: 0; }
        .md-close-btn:hover { background: #fee2e2; color: #dc2626; }
        .md-user-card { margin: 16px; padding: 14px; border-radius: 14px; background: linear-gradient(135deg, #f0fdf4, #ecfdf5); border: 1.5px solid #bbf7d0; display: flex; align-items: center; gap: 12px; }
        .md-user-avatar { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #10b981, #059669); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 18px; flex-shrink: 0; box-shadow: 0 3px 8px rgba(16,185,129,0.3); overflow: hidden; }
        .md-user-info { flex: 1; min-width: 0; }
        .md-user-name  { font-size: 14px; font-weight: 700; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .md-user-email { font-size: 11.5px; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }
        .md-user-badge { display: inline-block; margin-top: 4px; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; background: #d1fae5; color: #065f46; }
        .md-section { padding: 8px 12px; }
        .md-section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #9ca3af; padding: 4px 8px; margin-bottom: 4px; }
        .md-nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 10px; border-radius: 10px; cursor: pointer; transition: background 0.13s; user-select: none; text-decoration: none; color: inherit; }
        .md-nav-item:hover { background: #f8fafc; }
        .md-nav-icon { width: 36px; height: 36px; border-radius: 9px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #64748b; transition: all 0.13s; }
        .md-nav-item:hover .md-nav-icon { background: #f0fdf4; color: #10b981; }
        .md-nav-item.danger:hover .md-nav-icon { background: #fef2f2; color: #dc2626; }
        .md-nav-item.danger:hover .md-nav-label { color: #dc2626; }
        .md-nav-text { flex: 1; }
        .md-nav-label { font-size: 14px; font-weight: 600; color: #111827; }
        .md-nav-desc  { font-size: 11.5px; color: #9ca3af; margin-top: 1px; }
        .md-nav-arrow { color: #d1d5db; flex-shrink: 0; transition: all 0.13s; }
        .md-nav-item:hover .md-nav-arrow { color: #10b981; transform: translateX(2px); }
        .md-divider { height: 1px; background: #f3f4f6; margin: 4px 12px; }
        .md-roles-group { border: 1.5px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
        .md-roles-header { padding: 10px 14px; background: #f8fafc; border-bottom: 1px solid #e5e7eb; font-size: 12px; font-weight: 700; color: #374151; display: flex; align-items: center; gap: 8px; }
        .md-roles-type-badge { padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; }
        .md-roles-type-badge.login  { background: #dbeafe; color: #1e40af; }
        .md-roles-type-badge.signup { background: #d1fae5; color: #065f46; }
        .md-role-item { display: flex; align-items: center; gap: 10px; padding: 12px 14px; cursor: pointer; transition: background 0.13s; user-select: none; border-bottom: 1px solid #f3f4f6; }
        .md-role-item:last-child { border-bottom: none; }
        .md-role-item:hover { background: #f0fdf4; }
        .md-role-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .md-role-text { flex: 1; }
        .md-role-label { font-size: 13.5px; font-weight: 700; color: #111827; }
        .md-role-desc  { font-size: 11.5px; color: #9ca3af; margin-top: 1px; }
        .md-role-arrow { color: #d1d5db; }
        .md-role-item:hover .md-role-arrow { color: #10b981; }
        .md-auth-toggle { display: flex; border-radius: 10px; background: #f1f5f9; padding: 4px; gap: 3px; margin-bottom: 6px; }
        .md-auth-toggle-btn { flex: 1; padding: 8px; border: none; border-radius: 7px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.18s; font-family: inherit; background: transparent; color: #6b7280; }
        .md-auth-toggle-btn.active { background: white; color: #111827; box-shadow: 0 1px 6px rgba(0,0,0,0.1); }

        @media (max-width: 1024px) {
          .navbar-container { padding: 0 24px; }
          .navbar-center { position: static; transform: none; }
          .navbar-right { gap: 6px; }
          .banner-ad-image { display: none; }
        }
        @media (max-width: 768px) {
          body { padding-top: 68px; }
          .navbar-container { padding: 0 16px; height: 68px; }
          .logo-image { height: 44px; }
          .logo-brand { font-size: 15px; }
          .navbar-center { display: none; }
          .nav-links    { display: none !important; }
          .nav-sep      { display: none !important; }
          .auth-btn-group { display: none !important; }
          .user-menu-wrap { display: none !important; }
          .banner-ad-image { display: none !important; }
          .hamburger-btn { display: flex; }
        }
      `}</style>

      <nav className="navbar-fixed">
        <div className="navbar-container">

          {/* LEFT: Logo */}
          <div className="navbar-left">
            <Link to="/" className="navbar-logo">
              <img src="/solar-is-my-passion-logo.jpeg" alt="GreenJobs" className="logo-image" onError={(e) => { e.target.style.display = "none"; }} />
              <div className="logo-text">
                <div className="logo-brand">
                  <span className="logo-green">Green</span>
                  <span className="logo-black">Jobs</span>
                </div>
              </div>
            </Link>
          </div>

          {/* CENTER: Banner image (desktop only) */}
          <div className="navbar-center">
            <div className="banner-wrap" style={{ position: "relative", display: "inline-block" }}>
              <img
                src={banner.imageUrl}
                alt={banner.altText}
                className="worker-image"
                style={{
                  height:       banner.height       || "75px",
                  borderRadius: banner.borderRadius || "8px",
                }}
                onError={(e) => { e.target.src = "/worker-navbar.jpeg"; }}
              />
              {isAuthenticated && user?.role?.toLowerCase() === "admin" && (
                <button
                  className="banner-edit-btn"
                  onClick={() => setBannerEditOpen(true)}
                  title="Edit banner"
                >
                  Edit Banner
                </button>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div className="navbar-right">
            {isAuthenticated ? (
              <>
                <div className="nav-links">
                  <Link to="/jobs" className="nav-link">Jobs</Link>
                  {showCompanies && <Link to="/businesses" className="nav-link">Companies</Link>}
                </div>
                <div className="nav-sep" />
                <div className="user-menu-wrap" ref={userMenuRef}>
                  <div className={`user-chip${userMenuOpen ? " open" : ""}`} onClick={() => setUserMenuOpen((v) => !v)}>
                    <div className="user-avatar">
                      {user?.profilePicture && (user.role === "business" || user.role === "recruiter") ? (
                        <img src={user.profilePicture} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        user?.name?.charAt(0).toUpperCase() || "U"
                      )}
                    </div>
                    <div className="user-details">
                      <span className="user-name-txt">{user?.name?.split(" ")[0] || "User"}</span>
                      <span className="user-role-txt">{userRoleLabel}</span>
                    </div>
                    <span className={`user-chip-caret${userMenuOpen ? " open" : ""}`}>▼</span>
                  </div>
                  {userMenuOpen && (
                    <UserMenu user={user} roleLabel={userRoleLabel} dashboardRoute={dashboardRoute} onProfile={handleProfile} onLogout={handleLogout} onClose={() => setUserMenuOpen(false)} wrapperRef={userMenuRef} />
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="nav-links">
                  <Link to="/jobs" className="nav-link">Jobs</Link>
                  <Link to="/businesses" className="nav-link">Companies</Link>
                </div>
                <div className="nav-sep" />
                <div className="auth-btn-group">
                  <div className="dropdown-wrapper" ref={loginRef}>
                    <button className={`nav-btn btn-login${loginDropdown ? " active" : ""}`} onClick={() => { setLoginDropdown((v) => !v); setSignupDropdown(false); }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                      </svg>
                      Login
                      <span className={`btn-chevron${loginDropdown ? " open" : ""}`}>▼</span>
                    </button>
                    {loginDropdown && <RoleDropdown type="login" onSelect={handleRoleLogin} onClose={() => setLoginDropdown(false)} wrapperRef={loginRef} />}
                  </div>
                  <div className="dropdown-wrapper" ref={signupRef}>
                    <button className={`nav-btn btn-signup${signupDropdown ? " active" : ""}`} onClick={() => { setSignupDropdown((v) => !v); setLoginDropdown(false); }}>
                      Sign Up
                      <span className={`btn-chevron${signupDropdown ? " open" : ""}`} style={{ color: "rgba(255,255,255,0.75)" }}>▼</span>
                    </button>
                    {signupDropdown && <RoleDropdown type="signup" onSelect={handleRoleSignup} onClose={() => setSignupDropdown(false)} wrapperRef={signupRef} />}
                  </div>
                </div>
              </>
            )}

            <img src="/banner-ad-right.jpeg" alt="Banner" className="banner-ad-image" onError={(e) => { e.target.style.display = "none"; }} />

            <button className={`hamburger-btn${mobileMenuOpen ? " open" : ""}`} onClick={() => setMobileMenuOpen((v) => !v)} aria-label="Toggle menu">
              <span className="hb-line" /><span className="hb-line" /><span className="hb-line" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── OVERLAY ── */}
      <div className={`mobile-overlay${mobileMenuOpen ? " visible" : ""}`} onClick={closeMobileMenu} />

      {/* ── MOBILE DRAWER ── */}
      <div className={`mobile-drawer${mobileMenuOpen ? " visible" : ""}`}>
        <div className="md-header">
          <Link to="/" className="md-logo" onClick={closeMobileMenu}>
            <div className="logo-brand md-logo-brand"><span className="logo-green">Green</span><span className="logo-black">Jobs</span></div>
          </Link>
          <button className="md-close-btn" onClick={closeMobileMenu} aria-label="Close menu">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {isAuthenticated && (
          <div className="md-user-card">
            <div className="md-user-avatar">
              {user?.profilePicture && (user.role === "business" || user.role === "recruiter") ? (
                <img src={user.profilePicture} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                user?.name?.charAt(0).toUpperCase() || "U"
              )}
            </div>
            <div className="md-user-info">
              <div className="md-user-name">{user?.name || "User"}</div>
              <div className="md-user-email">{user?.email}</div>
              <div className="md-user-badge">{userRoleLabel}</div>
            </div>
          </div>
        )}

        <div className="md-section">
          <div className="md-section-title">Navigation</div>
          <Link to="/jobs" className="md-nav-item" onClick={closeMobileMenu}>
            <div className="md-nav-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg></div>
            <div className="md-nav-text"><div className="md-nav-label">Jobs</div><div className="md-nav-desc">Browse all open positions</div></div>
            <svg className="md-nav-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
          {(!isAuthenticated || showCompanies) && (
            <Link to="/businesses" className="md-nav-item" onClick={closeMobileMenu}>
              <div className="md-nav-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>
              <div className="md-nav-text"><div className="md-nav-label">Companies</div><div className="md-nav-desc">Explore green businesses</div></div>
              <svg className="md-nav-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          )}
        </div>

        <div className="md-divider" />

        {isAuthenticated ? (
          <div className="md-section">
            <div className="md-section-title">Account</div>
            <div className="md-nav-item" onClick={() => { handleProfile(); }}>
              <div className="md-nav-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
              <div className="md-nav-text"><div className="md-nav-label">My Profile</div><div className="md-nav-desc">View and edit your details</div></div>
              <svg className="md-nav-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
            <div className="md-nav-item" onClick={() => { closeMobileMenu(); navigate(dashboardRoute); }}>
              <div className="md-nav-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></div>
              <div className="md-nav-text"><div className="md-nav-label">Dashboard</div><div className="md-nav-desc">Go to your workspace</div></div>
              <svg className="md-nav-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
            <div className="md-divider" style={{ margin: "8px 0" }} />
            <div className="md-nav-item danger" onClick={handleLogout}>
              <div className="md-nav-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></div>
              <div className="md-nav-text"><div className="md-nav-label">Logout</div><div className="md-nav-desc">Sign out of your account</div></div>
            </div>
          </div>
        ) : (
          <div className="md-section">
            <div className="md-section-title">Get Started</div>
            <div className="md-auth-toggle">
              <button className={`md-auth-toggle-btn${mobileAuthPanel !== "signup" ? " active" : ""}`} onClick={() => setMobileAuthPanel(mobileAuthPanel === "login" ? null : "login")}>Login</button>
              <button className={`md-auth-toggle-btn${mobileAuthPanel === "signup" ? " active" : ""}`} onClick={() => setMobileAuthPanel(mobileAuthPanel === "signup" ? null : "signup")}>Sign Up</button>
            </div>
            {(mobileAuthPanel === "login" || mobileAuthPanel === null) && (
              <div className="md-roles-group">
                <div className="md-roles-header"><span>Sign in as</span><span className="md-roles-type-badge login">Login</span></div>
                {roles.map((role) => (
                  <div key={role.key} className="md-role-item" onClick={() => handleRoleLogin(role.key)}>
                    <div className="md-role-dot" style={{ background: role.color }} />
                    <div className="md-role-text"><div className="md-role-label">{role.label}</div><div className="md-role-desc">{role.desc}</div></div>
                    <svg className="md-role-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </div>
                ))}
              </div>
            )}
            {mobileAuthPanel === "signup" && (
              <div className="md-roles-group">
                <div className="md-roles-header"><span>Create account as</span><span className="md-roles-type-badge signup">Sign Up</span></div>
                {roles.map((role) => (
                  <div key={role.key} className="md-role-item" onClick={() => handleRoleSignup(role.key)}>
                    <div className="md-role-dot" style={{ background: role.color }} />
                    <div className="md-role-text"><div className="md-role-label">{role.label}</div><div className="md-role-desc">{role.desc}</div></div>
                    <svg className="md-role-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Banner Edit Modal — passes full banner object so all fields are pre-populated */}
      <BannerEditModal
        isOpen={bannerEditOpen}
        banner={banner}
        onClose={() => setBannerEditOpen(false)}
        onSave={handleSaveBanner}
        isLoading={bannerLoading}
      />
    </>
  );
};

export default Navbar;