import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, BarChart2, Users, Zap, Target } from "lucide-react";
import GoogleSignIn from "../components/Auth/GoogleSignIn";
import EmailSignup from "../components/Auth/EmailSignup";
import SignupVerifyOtp from "../components/Auth/SignupVerifyOtp";
import Navbar from "../components/common/Navbar";

const RecruiterSignup = () => {
  const [step,  setStep]  = useState("signup");
  const [email, setEmail] = useState("");
  const [role,  setRole]  = useState("recruiter");
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={user?.profileCompleted ? "/recruiter/dashboard" : "/complete-profile"} replace />;
  }

  const handleOTPSent = (userEmail, userRole) => { setEmail(userEmail); setRole(userRole); setStep("verify"); };
  const handleBack = () => { setStep("signup"); setEmail(""); };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        html, body, #root {
          height: 100%; min-height: 100%; margin: 0; background: #f0fdf4;
        }
        body { overflow: hidden; }
        #root, .App { height: 100%; min-height: 100%; background: #f0fdf4; }
        *, *::before, *::after { box-sizing: border-box; }

        .recs-page {
          height: calc(100dvh - 82px);
          min-height: calc(100dvh - 82px);
          display: flex;
          align-items: stretch;
          background: #f0fdf4;
          overflow: hidden;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .recs-left, .recs-right { height: 100%; min-height: 100%; }

        .recs-left { flex: 1; min-width: 0; display: flex; align-items: center; justify-content: center; padding: 48px 40px; overflow-y: auto; background: #f0fdf4; }
        .recs-form-box { width: 100%; max-width: 420px; margin: 0 auto; animation: recsUp 0.45s ease both; }
        @keyframes recsUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }

        .recs-wordmark { font-size: 20px; font-weight: 800; color: #052e16; margin-bottom: 32px; display: flex; align-items: center; gap: 10px; letter-spacing: -0.4px; }
        .recs-wordmark-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; margin-top: 2px; flex-shrink: 0; }

        .recs-heading { font-size: 28px; font-weight: 800; color: #052e16; margin-bottom: 6px; letter-spacing: -0.5px; }
        .recs-sub { font-size: 14px; color: #6b7280; margin-bottom: 28px; line-height: 1.6; font-weight: 400; }
        .recs-sub strong { color: #15803d; font-weight: 700; }

        .recs-divider { text-align: center; position: relative; margin: 20px 0; }
        .recs-divider::before { content: ''; position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: #d1fae5; }
        .recs-divider span { background: #f0fdf4; padding: 0 14px; font-size: 11px; color: #94a3b8; position: relative; letter-spacing: 0.06em; text-transform: uppercase; }

        .recs-footer { text-align: center; margin-top: 28px; font-size: 13px; color: #6b7280; }
        .recs-footer a { color: #16a34a; font-weight: 700; text-decoration: none; }
        .recs-footer a:hover { text-decoration: underline; }

        .recs-back { background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px; color: #6b7280; margin-bottom: 24px; padding: 0; font-family: 'Inter', sans-serif; font-weight: 500; transition: color 0.15s; }
        .recs-back:hover { color: #052e16; }

        .recs-form-box input { background: white !important; border: 1.5px solid #d1fae5 !important; border-radius: 10px !important; font-family: 'Inter', sans-serif !important; font-size: 14px !important; color: #111827 !important; box-sizing: border-box !important; }
        .recs-form-box input::placeholder { color: #9ca3af !important; }
        .recs-form-box input:focus { border-color: #10b981 !important; box-shadow: 0 0 0 3px rgba(16,185,129,0.12) !important; background: #f0fdf4 !important; }
        .recs-form-box label { font-family: 'Inter', sans-serif !important; font-size: 12px !important; font-weight: 700 !important; color: #374151 !important; text-transform: uppercase !important; letter-spacing: 0.06em !important; }
        .recs-form-box button[type="submit"] { background: #052e16 !important; border-radius: 10px !important; font-family: 'Inter', sans-serif !important; font-size: 15px !important; font-weight: 700 !important; }
        .recs-form-box button[type="submit"]:hover:not(:disabled) { background: #14532d !important; transform: translateY(-1px) !important; }
        .recs-form-box input[maxLength="1"], .recs-form-box input[maxlength="1"] { font-size: 22px !important; font-weight: 800 !important; text-align: center !important; }
        .recs-form-box input[maxLength="1"]:focus, .recs-form-box input[maxlength="1"]:focus { background: #f0fdf4 !important; border-color: #10b981 !important; }

        .recs-right { width: 42%; flex-shrink: 0; background: linear-gradient(160deg, #052e16 0%, #14532d 55%, #166534 100%); display: flex; flex-direction: column; justify-content: center; padding: 64px 56px; position: relative; overflow: hidden; }
        .recs-right-pattern { position: absolute; inset: 0; pointer-events: none; background-image: radial-gradient(circle, rgba(110,231,183,0.12) 1px, transparent 1px); background-size: 32px 32px; }
        .recs-right-glow { position: absolute; width: 480px; height: 480px; border-radius: 50%; background: radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%); top: -100px; right: -100px; pointer-events: none; }
        .recs-right-glow2 { position: absolute; width: 300px; height: 300px; border-radius: 50%; background: radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%); bottom: -60px; left: -60px; pointer-events: none; }
        .recs-right-circles { position: absolute; inset: 0; pointer-events: none; }
        .recs-right-circle { position: absolute; border-radius: 50%; border: 1px solid rgba(255,255,255,0.06); }
        .recs-rc1 { width: 480px; height: 480px; top: -160px; right: -160px; }
        .recs-rc2 { width: 280px; height: 280px; bottom: 40px; left: -80px; border-color: rgba(16,185,129,0.15); }
        .recs-right-content { position: relative; z-index: 2; }
        .recs-right-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #6ee7b7; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
        .recs-right-eyebrow::after { content: ''; flex: 1; height: 1px; background: rgba(110,231,183,0.3); max-width: 60px; }
        .recs-right-title { font-size: 38px; font-weight: 800; line-height: 1.15; color: white; margin-bottom: 24px; letter-spacing: -1px; }
        .recs-right-title span { color: #6ee7b7; }
        .recs-right-desc { font-size: 14px; color: rgba(255,255,255,0.45); line-height: 1.8; margin-bottom: 40px; max-width: 320px; }
        .recs-features { display: flex; flex-direction: column; gap: 18px; }
        .recs-feature { display: flex; align-items: flex-start; gap: 14px; }
        .recs-feature-icon { width: 36px; height: 36px; border-radius: 8px; background: rgba(16,185,129,0.15); border: 1px solid rgba(110,231,183,0.25); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .recs-feature-title { font-size: 13px; font-weight: 700; color: white; margin-bottom: 3px; }
        .recs-feature-desc { font-size: 12px; color: rgba(255,255,255,0.4); }
        .recs-free-badge { margin-top: 36px; padding: 14px 20px; background: rgba(16,185,129,0.08); border: 1px solid rgba(110,231,183,0.2); border-radius: 10px; }
        .recs-free-badge-title { font-size: 13px; font-weight: 700; color: #6ee7b7; margin-bottom: 4px; }
        .recs-free-badge-desc { font-size: 12px; color: rgba(255,255,255,0.35); }

        @media (max-width: 900px) { .recs-right { display: none; } }
        @media (max-width: 768px) {
          html, body, #root, .App { height: auto; min-height: 100%; overflow-y: auto; }
          body { overflow-x: hidden; }
          .recs-page { height: auto; min-height: calc(100dvh - 82px); overflow: visible; }
          .recs-left { height: auto; min-height: calc(100dvh - 82px); padding: 32px 20px; align-items: flex-start; overflow: visible; }
          .recs-form-box { max-width: 100%; }
        }
      `}</style>

      <Navbar />
      <div className="recs-page">
        <div className="recs-left">
          <div className="recs-form-box">
            <div className="recs-wordmark">
              <BarChart2 size={20} color="#10b981" />
              GreenJobs Recruiter
              <div className="recs-wordmark-dot" />
            </div>
            {step === "signup" ? (
              <>
                <h1 className="recs-heading">Recruiter Sign Up</h1>
                <p className="recs-sub">Start hiring green energy talent today</p>
                <EmailSignup onOTPSent={handleOTPSent} role="recruiter" />
                <div className="recs-divider"><span>or</span></div>
                <GoogleSignIn role="recruiter"/>
              </>
            ) : (
              <>
                <button className="recs-back" type="button" onClick={handleBack}><ArrowLeft size={14} /> Back</button>
                <h1 className="recs-heading">Verify email</h1>
                <p className="recs-sub">Code sent to <strong>{email}</strong></p>
                <SignupVerifyOtp email={email} onBack={handleBack} role={role} />
              </>
            )}
            <div className="recs-footer">
              Already have an account? <Link to="/recruiter/login">Sign in</Link>
              {" · "}
              <Link to="/" style={{ color: "#9ca3af" }}>Home</Link>
            </div>
          </div>
        </div>

        <div className="recs-right">
          <div className="recs-right-pattern" />
          <div className="recs-right-glow" />
          <div className="recs-right-glow2" />
          <div className="recs-right-circles">
            <div className="recs-right-circle recs-rc1" />
            <div className="recs-right-circle recs-rc2" />
          </div>
          <div className="recs-right-content">
            <div className="recs-right-eyebrow">For Recruiters</div>
            <h2 className="recs-right-title">Hire <span>smarter</span> in green energy</h2>
            <p className="recs-right-desc">Post jobs, review applications, and build your renewable energy team with India's leading green hiring platform.</p>
            <div className="recs-features">
              <div className="recs-feature"><div className="recs-feature-icon"><Users size={16} color="#6ee7b7" /></div><div><div className="recs-feature-title">Verified Talent Pool</div><div className="recs-feature-desc">Access pre-screened green energy professionals</div></div></div>
              <div className="recs-feature"><div className="recs-feature-icon"><Zap size={16} color="#6ee7b7" /></div><div><div className="recs-feature-title">Fast Hiring</div><div className="recs-feature-desc">Post a job and get applications within 24 hours</div></div></div>
              <div className="recs-feature"><div className="recs-feature-icon"><Target size={16} color="#6ee7b7" /></div><div><div className="recs-feature-title">Targeted Reach</div><div className="recs-feature-desc">Connect with candidates matched to your roles</div></div></div>
            </div>
            <div className="recs-free-badge">
              <div className="recs-free-badge-title">✦ Free to get started</div>
              <div className="recs-free-badge-desc">No credit card required. Post your first job at no cost.</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RecruiterSignup;