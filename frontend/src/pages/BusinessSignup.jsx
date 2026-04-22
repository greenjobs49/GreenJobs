import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, Building2, UserCheck, ShieldCheck, Briefcase, CheckCircle, Users } from "lucide-react";
import GoogleSignIn from "../components/Auth/GoogleSignIn";
import EmailSignup from "../components/Auth/EmailSignup";
import SignupVerifyOtp from "../components/Auth/SignupVerifyOtp";
import Navbar from "../components/common/Navbar";

const BusinessSignup = () => {
  const [step,  setStep]  = useState("signup");
  const [email, setEmail] = useState("");
  const [role,  setRole]  = useState("business");
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={user?.profileCompleted ? "/business/dashboard" : "/complete-profile"} replace />;
  }

  const handleOTPSent = (userEmail, userRole) => { setEmail(userEmail); setRole(userRole); setStep("verify"); };
  const handleBack = () => { setStep("signup"); setEmail(""); };

  const steps = [
    {
      num: "01",
      title: "Create & complete your business profile",
      desc: "Add your business name, category, address, description, contact details, and upload at least one photo.",
    },
    {
      num: "02",
      title: "Wait for admin approval",
      desc: "Our team reviews your submission to ensure quality. Approvals are typically done within 24 hours.",
    },
    {
      num: "03",
      title: "Go live — promote your business & post jobs",
      desc: "Once approved, promote your business on our platform and post jobs directly, and manage all applications from your dashboard.",
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        html, body, #root { height: 100%; min-height: 100%; margin: 0; background: #f0fdf4; }
        body { overflow: hidden; }
        #root, .App { height: 100%; min-height: 100%; background: #f0fdf4; }
        *, *::before, *::after { box-sizing: border-box; }

        .bizs-page {
          height: calc(100dvh - 82px); min-height: calc(100dvh - 82px);
          display: flex; align-items: stretch;
          background: #f0fdf4; overflow: hidden;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .bizs-left, .bizs-right { height: 100%; min-height: 100%; }

        .bizs-left { flex: 1; min-width: 0; display: flex; align-items: center; justify-content: center; padding: 48px 40px; overflow-y: auto; background: #f0fdf4; }
        .bizs-form-box { width: 100%; max-width: 420px; margin: 0 auto; animation: bizsUp 0.45s ease both; }
        @keyframes bizsUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }

        .bizs-wordmark { font-size: 20px; font-weight: 800; color: #052e16; margin-bottom: 28px; display: flex; align-items: center; gap: 10px; letter-spacing: -0.4px; }
        .bizs-wordmark-dot { width: 8px; height: 8px; border-radius: 50%; background: #16a34a; margin-top: 2px; flex-shrink: 0; }

        .bizs-heading { font-size: 28px; font-weight: 800; color: #052e16; margin-bottom: 6px; letter-spacing: -0.5px; }
        .bizs-sub { font-size: 14px; color: #6b7280; margin-bottom: 24px; line-height: 1.6; font-weight: 400; }
        .bizs-sub strong { color: #052e16; font-weight: 700; }

        .bizs-divider { text-align: center; position: relative; margin: 20px 0; }
        .bizs-divider::before { content: ''; position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: #d1fae5; }
        .bizs-divider span { background: #f0fdf4; padding: 0 14px; font-size: 11px; color: #9ca3af; position: relative; letter-spacing: 0.06em; text-transform: uppercase; }

        .bizs-footer { text-align: center; margin-top: 20px; font-size: 13px; color: #6b7280; }
        .bizs-footer a { color: #16a34a; font-weight: 700; text-decoration: none; }
        .bizs-footer a:hover { text-decoration: underline; }

        .bizs-back { background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px; color: #6b7280; margin-bottom: 16px; padding: 0; font-family: 'Inter', sans-serif; font-weight: 500; transition: color 0.15s; }
        .bizs-back:hover { color: #052e16; }

        .bizs-form-box input { background: white !important; border: 1.5px solid #d1fae5 !important; border-radius: 10px !important; font-family: 'Inter', sans-serif !important; font-size: 14px !important; color: #052e16 !important; box-sizing: border-box !important; }
        .bizs-form-box input::placeholder { color: #9ca3af !important; }
        .bizs-form-box input:focus { border-color: #10b981 !important; box-shadow: 0 0 0 3px rgba(16,185,129,0.12) !important; }
        .bizs-form-box label { font-family: 'Inter', sans-serif !important; font-size: 12px !important; font-weight: 700 !important; color: #374151 !important; letter-spacing: 0.06em !important; text-transform: uppercase !important; }
        .bizs-form-box button[type="submit"] { background: #052e16 !important; border-radius: 10px !important; font-family: 'Inter', sans-serif !important; font-size: 15px !important; font-weight: 700 !important; }
        .bizs-form-box button[type="submit"]:hover:not(:disabled) { background: #14532d !important; transform: translateY(-1px) !important; }
        .bizs-form-box input[maxLength="1"], .bizs-form-box input[maxlength="1"] { font-size: 22px !important; font-weight: 800 !important; text-align: center !important; }
        .bizs-form-box input[maxLength="1"]:focus, .bizs-form-box input[maxlength="1"]:focus { background: #f0fdf4 !important; border-color: #10b981 !important; }

        /* ── Right panel ── */
        .bizs-right {
          width: 42%; flex-shrink: 0;
          background: linear-gradient(160deg, #052e16 0%, #14532d 50%, #166534 100%);
          display: flex; flex-direction: column; justify-content: center;
          padding: 64px 56px; position: relative; overflow: hidden;
        }
        .bizs-right-circles { position: absolute; inset: 0; pointer-events: none; }
        .bizs-right-circle { position: absolute; border-radius: 50%; border: 1px solid rgba(255,255,255,0.06); }
        .bizs-right-c1 { width: 500px; height: 500px; top: -180px; left: -180px; }
        .bizs-right-c2 { width: 340px; height: 340px; top: 60px; right: -120px; }
        .bizs-right-c3 { width: 200px; height: 200px; bottom: 120px; left: 40px; border-color: rgba(16,185,129,0.2); }
        .bizs-right-glow { position: absolute; inset: 0; background-image: radial-gradient(circle at 70% 20%, rgba(16,185,129,0.14) 0%, transparent 60%); pointer-events: none; }
        .bizs-right-content { position: relative; z-index: 2; }

        .bizs-right-eyebrow {
          font-size: 11px; font-weight: 700; letter-spacing: 0.14em;
          text-transform: uppercase; color: #6ee7b7; margin-bottom: 18px;
          display: flex; align-items: center; gap: 10px;
        }
        .bizs-right-eyebrow::before { content: ''; width: 24px; height: 1px; background: #6ee7b7; }

        .bizs-right-title {
          font-size: 34px; font-weight: 800; line-height: 1.15;
          color: white; margin-bottom: 10px; letter-spacing: -0.8px;
        }
        .bizs-right-title span { color: #6ee7b7; }

        .bizs-right-desc {
          font-size: 13.5px; color: rgba(255,255,255,0.45);
          line-height: 1.7; margin-bottom: 36px; max-width: 310px;
        }

        /* ── Vertical step list ── */
        .bizs-steps { display: flex; flex-direction: column; gap: 0; position: relative; }

        .bizs-steps::before {
          content: '';
          position: absolute;
          left: 18px;
          top: 38px;
          bottom: 38px;
          width: 1px;
          background: linear-gradient(to bottom, rgba(110,231,183,0.4), rgba(110,231,183,0.1));
        }

        .bizs-step { display: flex; align-items: flex-start; gap: 16px; padding: 14px 0; }

        .bizs-step-num-wrap {
          position: relative; flex-shrink: 0;
          width: 36px; height: 36px;
          border-radius: 50%;
          background: rgba(16,185,129,0.15);
          border: 1.5px solid rgba(110,231,183,0.35);
          display: flex; align-items: center; justify-content: center;
          z-index: 1;
        }
        .bizs-step-num { font-size: 11px; font-weight: 800; color: #6ee7b7; letter-spacing: 0.05em; line-height: 1; }

        .bizs-step-body { padding-top: 4px; }
        .bizs-step-title { font-size: 13.5px; font-weight: 700; color: white; margin-bottom: 4px; line-height: 1.3; }
        .bizs-step-desc { font-size: 12px; color: rgba(255,255,255,0.42); line-height: 1.65; max-width: 260px; }

        /* ── Recruiter note ── */
        .bizs-recruiter-note {
          margin-top: 32px;
          padding: 14px 18px;
          background: rgba(16,185,129,0.08);
          border: 1px solid rgba(110,231,183,0.2);
          border-radius: 10px;
          display: flex; align-items: flex-start; gap: 10px;
        }
        .bizs-recruiter-note-icon { flex-shrink: 0; margin-top: 1px; }
        .bizs-recruiter-note-text { font-size: 12px; color: rgba(255,255,255,0.5); line-height: 1.65; }
        .bizs-recruiter-note-text strong { color: #6ee7b7; font-weight: 700; }

        @media (max-width: 900px) { .bizs-right { display: none; } }
        @media (max-width: 768px) {
          html, body, #root, .App { height: auto; min-height: 100%; overflow-y: auto; }
          body { overflow-x: hidden; }
          .bizs-page { height: auto; min-height: calc(100dvh - 82px); overflow: visible; }
          .bizs-left { height: auto; min-height: calc(100dvh - 82px); padding: 32px 20px; align-items: flex-start; overflow: visible; }
          .bizs-form-box { max-width: 100%; }
        }
      `}</style>

      <Navbar />
      <div className="bizs-page">
        <div className="bizs-left">
          <div className="bizs-form-box">
            <div className="bizs-wordmark">
              <Building2 size={20} color="#16a34a" />
              GreenJobs Business
              <div className="bizs-wordmark-dot" />
            </div>
            {step === "signup" ? (
              <>
                <h1 className="bizs-heading">Register Business</h1>
                <p className="bizs-sub">List your company and attract green energy professionals.</p>
                <EmailSignup onOTPSent={handleOTPSent} role="business" />
                <div className="bizs-divider"><span>or</span></div>
                <GoogleSignIn role="business" />
              </>
            ) : (
              <>
                <button className="bizs-back" type="button" onClick={handleBack}><ArrowLeft size={13} /> Back</button>
                <h1 className="bizs-heading">Verify email</h1>
                <p className="bizs-sub">Code sent to <strong style={{ color: "#16a34a" }}>{email}</strong></p>
                <SignupVerifyOtp email={email} onBack={handleBack} role={role} />
              </>
            )}
            <div className="bizs-footer">
              Already registered? <Link to="/business/login">Sign in</Link>
              {" · "}
              <Link to="/" style={{ color: "#9ca3af" }}>Home</Link>
            </div>
          </div>
        </div>

        {/* ── Right: How it actually works ── */}
        <div className="bizs-right">
          <div className="bizs-right-circles">
            <div className="bizs-right-circle bizs-right-c1" />
            <div className="bizs-right-circle bizs-right-c2" />
            <div className="bizs-right-circle bizs-right-c3" />
          </div>
          <div className="bizs-right-glow" />
          <div className="bizs-right-content">

            <div className="bizs-right-eyebrow">How it works</div>
            <h2 className="bizs-right-title">
              From sign-up to<br /><span>live listings</span> in 3 steps
            </h2>

            <div className="bizs-steps">
              {steps.map((s, i) => (
                <div className="bizs-step" key={i}>
                  <div className="bizs-step-num-wrap">
                    <span className="bizs-step-num">{s.num}</span>
                  </div>
                  <div className="bizs-step-body">
                    <div className="bizs-step-title">{s.title}</div>
                    <div className="bizs-step-desc">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BusinessSignup;