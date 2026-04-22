import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, BarChart2, UserCheck, ShieldCheck, Briefcase, CheckCircle } from "lucide-react";
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

  const steps = [
    {
      icon: UserCheck,
      num: "01",
      title: "Create & complete your profile",
      desc: "Fill in your company name, industry, location, contact details, and upload your logo.",
    },
    {
      icon: ShieldCheck,
      num: "02",
      title: "Submit for admin verification",
      desc: "Once your profile is complete, request verification. Our team reviews it — usually within 24 hours.",
    },
    {
      icon: Briefcase,
      num: "03",
      title: "Post jobs & hire talent",
      desc: "After approval, post jobs instantly. They go live immediately — no per-job sign-off needed.",
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

        .recs-page {
          height: calc(100dvh - 82px); min-height: calc(100dvh - 82px);
          display: flex; align-items: stretch;
          background: #f0fdf4; overflow: hidden;
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

        /* ── Right panel ── */
        .recs-right {
          width: 42%; flex-shrink: 0;
          background: linear-gradient(160deg, #052e16 0%, #14532d 55%, #166534 100%);
          display: flex; flex-direction: column; justify-content: center;
          padding: 64px 56px; position: relative; overflow: hidden;
        }
        .recs-right-pattern { position: absolute; inset: 0; pointer-events: none; background-image: radial-gradient(circle, rgba(110,231,183,0.10) 1px, transparent 1px); background-size: 32px 32px; }
        .recs-right-glow { position: absolute; width: 480px; height: 480px; border-radius: 50%; background: radial-gradient(circle, rgba(16,185,129,0.16) 0%, transparent 70%); top: -120px; right: -100px; pointer-events: none; }
        .recs-right-glow2 { position: absolute; width: 300px; height: 300px; border-radius: 50%; background: radial-gradient(circle, rgba(16,185,129,0.09) 0%, transparent 70%); bottom: -60px; left: -60px; pointer-events: none; }
        .recs-right-content { position: relative; z-index: 2; }

        .recs-right-eyebrow {
          font-size: 11px; font-weight: 700; letter-spacing: 0.14em;
          text-transform: uppercase; color: #6ee7b7; margin-bottom: 18px;
          display: flex; align-items: center; gap: 10px;
        }
        .recs-right-eyebrow::after { content: ''; flex: 1; height: 1px; background: rgba(110,231,183,0.3); max-width: 60px; }

        .recs-right-title {
          font-size: 34px; font-weight: 800; line-height: 1.15;
          color: white; margin-bottom: 10px; letter-spacing: -0.8px;
        }
        .recs-right-title span { color: #6ee7b7; }

        .recs-right-desc {
          font-size: 13.5px; color: rgba(255,255,255,0.45);
          line-height: 1.7; margin-bottom: 36px; max-width: 310px;
        }

        /* ── Vertical step list ── */
        .recs-steps { display: flex; flex-direction: column; gap: 0; position: relative; }

        /* Connecting line between steps */
        .recs-steps::before {
          content: '';
          position: absolute;
          left: 18px;
          top: 38px;
          bottom: 38px;
          width: 1px;
          background: linear-gradient(to bottom, rgba(110,231,183,0.4), rgba(110,231,183,0.1));
        }

        .recs-step { display: flex; align-items: flex-start; gap: 16px; padding: 14px 0; }

        .recs-step-num-wrap {
          position: relative; flex-shrink: 0;
          width: 36px; height: 36px;
          border-radius: 50%;
          background: rgba(16,185,129,0.15);
          border: 1.5px solid rgba(110,231,183,0.35);
          display: flex; align-items: center; justify-content: center;
          z-index: 1;
        }
        .recs-step-num {
          font-size: 11px; font-weight: 800; color: #6ee7b7;
          letter-spacing: 0.05em; line-height: 1;
        }

        .recs-step-body { padding-top: 4px; }
        .recs-step-title { font-size: 13.5px; font-weight: 700; color: white; margin-bottom: 4px; line-height: 1.3; }
        .recs-step-desc { font-size: 12px; color: rgba(255,255,255,0.42); line-height: 1.65; max-width: 260px; }

        /* ── Note at the bottom ── */
        .recs-note {
          margin-top: 32px;
          padding: 14px 18px;
          background: rgba(16,185,129,0.08);
          border: 1px solid rgba(110,231,183,0.2);
          border-radius: 10px;
          display: flex; align-items: flex-start; gap: 10px;
        }
        .recs-note-icon { flex-shrink: 0; margin-top: 1px; }
        .recs-note-text { font-size: 12px; color: rgba(255,255,255,0.5); line-height: 1.65; }
        .recs-note-text strong { color: #6ee7b7; font-weight: 700; }

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
                <GoogleSignIn role="recruiter" />
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

        {/* ── Right: How it actually works ── */}
        <div className="recs-right">
          <div className="recs-right-pattern" />
          <div className="recs-right-glow" />
          <div className="recs-right-glow2" />
          <div className="recs-right-content">

            <div className="recs-right-eyebrow">How it works</div>
            <h2 className="recs-right-title">
              From sign-up to<br /><span>posting jobs</span> in 3 steps
            </h2>

            <div className="recs-steps">
              {steps.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div className="recs-step" key={i}>
                    <div className="recs-step-num-wrap">
                      <span className="recs-step-num">{s.num}</span>
                    </div>
                    <div className="recs-step-body">
                      <div className="recs-step-title">{s.title}</div>
                      <div className="recs-step-desc">{s.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="recs-note">
              <div className="recs-note-icon">
                <CheckCircle size={14} color="#6ee7b7" />
              </div>
              <div className="recs-note-text">
                Once verified, your jobs go <strong>live immediately</strong> — no
                per-job approvals, no waiting. Admin verification is a one-time process.
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default RecruiterSignup;