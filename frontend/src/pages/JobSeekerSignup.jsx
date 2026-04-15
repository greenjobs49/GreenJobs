import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, Leaf } from "lucide-react";
import GoogleSignIn from "../components/Auth/GoogleSignIn";
import EmailSignup from "../components/Auth/EmailSignup";
import SignupVerifyOtp from "../components/Auth/SignupVerifyOtp";
import Navbar from "../components/common/Navbar";

const JobSeekerSignup = () => {
  const [step,  setStep]  = useState("signup");
  const [email, setEmail] = useState("");
  const [role,  setRole]  = useState("jobseeker");
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={user?.profileCompleted ? "/dashboard" : "/complete-profile"} replace />;
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

        .jss-page {
          height: calc(100dvh - 82px);
          min-height: calc(100dvh - 82px);
          display: flex;
          align-items: stretch;
          background: #f0fdf4;
          overflow: hidden;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .jss-left, .jss-right { height: 100%; min-height: 100%; }

        .jss-left {
          width: 42%; flex-shrink: 0;
          background: linear-gradient(160deg, #052e16 0%, #14532d 50%, #166534 100%);
          position: relative; display: flex; flex-direction: column; justify-content: flex-end;
          padding: 52px 48px; overflow: hidden;
        }
        .jss-left-circles { position: absolute; inset: 0; pointer-events: none; }
        .jss-circle { position: absolute; border-radius: 50%; border: 1px solid rgba(255,255,255,0.06); }
        .jss-c1 { width: 500px; height: 500px; top: -180px; left: -180px; }
        .jss-c2 { width: 340px; height: 340px; top: 60px; right: -120px; }
        .jss-c3 { width: 200px; height: 200px; bottom: 120px; left: 40px; border-color: rgba(16,185,129,0.2); }
        .jss-leaf-bg { position: absolute; inset: 0; background-image: radial-gradient(circle at 70% 20%, rgba(16,185,129,0.15) 0%, transparent 60%); }

        .jss-tagline { position: relative; z-index: 2; }
        .jss-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #6ee7b7; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
        .jss-eyebrow::before { content: ''; width: 24px; height: 1px; background: #6ee7b7; }
        .jss-title { font-size: 40px; font-weight: 800; line-height: 1.15; color: white; margin-bottom: 20px; letter-spacing: -1px; }
        .jss-title em { font-style: normal; color: #6ee7b7; }
        .jss-desc { font-size: 14px; color: rgba(255,255,255,0.5); line-height: 1.7; max-width: 300px; }

        .jss-steps { margin-top: 40px; display: flex; flex-direction: column; gap: 16px; position: relative; z-index: 2; }
        .jss-step { display: flex; align-items: center; gap: 12px; }
        .jss-step-num { width: 28px; height: 28px; border-radius: 50%; background: rgba(16,185,129,0.2); border: 1px solid rgba(110,231,183,0.3); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: #6ee7b7; flex-shrink: 0; }
        .jss-step-text { font-size: 13px; color: rgba(255,255,255,0.5); font-weight: 500; }

        .jss-right { flex: 1; min-width: 0; display: flex; align-items: center; justify-content: center; padding: 48px 40px; overflow-y: auto; background: #f0fdf4; }
        .jss-form-box { width: 100%; max-width: 420px; margin: 0 auto; animation: jssFadeUp 0.5s ease both; }
        @keyframes jssFadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        .jss-heading { font-size: 28px; font-weight: 800; color: #052e16; margin-bottom: 6px; letter-spacing: -0.5px; }
        .jss-subheading { font-size: 14px; color: #6b7280; margin-bottom: 28px; line-height: 1.6; font-weight: 400; }
        .jss-subheading strong { color: #052e16; font-weight: 700; }

        .jss-divider { text-align: center; position: relative; margin: 20px 0; }
        .jss-divider::before { content: ''; position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: #d1fae5; }
        .jss-divider span { background: #f0fdf4; padding: 0 14px; font-size: 12px; color: #9ca3af; position: relative; }

        .jss-footer { text-align: center; margin-top: 24px; font-size: 13px; color: #6b7280; }
        .jss-footer a { color: #16a34a; font-weight: 600; text-decoration: none; }
        .jss-footer a:hover { text-decoration: underline; }

        .jss-back { background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px; color: #6b7280; margin-bottom: 20px; padding: 0; font-family: 'Inter', sans-serif; font-weight: 500; transition: color 0.15s; }
        .jss-back:hover { color: #052e16; }

        .jss-form-box input { background: white !important; border: 1.5px solid #d1fae5 !important; border-radius: 10px !important; font-family: 'Inter', sans-serif !important; font-size: 14px !important; color: #111827 !important; box-sizing: border-box !important; }
        .jss-form-box input::placeholder { color: #9ca3af !important; }
        .jss-form-box input:focus { border-color: #10b981 !important; box-shadow: 0 0 0 3px rgba(16,185,129,0.12) !important; }
        .jss-form-box label { font-family: 'Inter', sans-serif !important; font-size: 12px !important; font-weight: 700 !important; color: #374151 !important; text-transform: uppercase !important; letter-spacing: 0.06em !important; }
        .jss-form-box button[type="submit"] { background: #052e16 !important; border-radius: 10px !important; font-family: 'Inter', sans-serif !important; font-size: 15px !important; font-weight: 700 !important; }
        .jss-form-box button[type="submit"]:hover:not(:disabled) { background: #14532d !important; transform: translateY(-1px) !important; }
        .jss-form-box input[maxLength="1"], .jss-form-box input[maxlength="1"] { font-size: 22px !important; font-weight: 800 !important; text-align: center !important; }
        .jss-form-box input[maxLength="1"]:focus, .jss-form-box input[maxlength="1"]:focus { background: #f0fdf4 !important; }

        @media (max-width: 900px) { .jss-left { width: 36%; padding: 40px 32px; } .jss-title { font-size: 32px; } }
        @media (max-width: 768px) {
          html, body, #root, .App { height: auto; min-height: 100%; overflow-y: auto; }
          body { overflow-x: hidden; }
          .jss-page { height: auto; min-height: calc(100dvh - 82px); overflow: visible; }
          .jss-left { display: none; }
          .jss-right { height: auto; min-height: calc(100dvh - 82px); padding: 32px 24px; align-items: flex-start; padding-top: 36px; overflow: visible; }
          .jss-form-box { max-width: 100%; }
        }
      `}</style>

      <Navbar />
      <div className="jss-page">
        <div className="jss-left">
          <div className="jss-left-circles">
            <div className="jss-circle jss-c1" /><div className="jss-circle jss-c2" /><div className="jss-circle jss-c3" />
          </div>
          <div className="jss-leaf-bg" />
          <div className="jss-tagline">
            <div className="jss-eyebrow">Start your journey</div>
            <h2 className="jss-title">Your <em>green</em> career starts here</h2>
            <p className="jss-desc">Join thousands of professionals building careers in India's renewable energy sector.</p>
            <div className="jss-steps">
              <div className="jss-step"><div className="jss-step-num">1</div><div className="jss-step-text">Create your account</div></div>
              <div className="jss-step"><div className="jss-step-num">2</div><div className="jss-step-text">Complete your profile</div></div>
              <div className="jss-step"><div className="jss-step-num">3</div><div className="jss-step-text">Apply to green energy jobs</div></div>
            </div>
          </div>
        </div>
        <div className="jss-right">
          <div className="jss-form-box">
            {step === "signup" ? (
              <>
                <h1 className="jss-heading">Create account</h1>
                <p className="jss-subheading">Join as a job seeker — it's free</p>
                <EmailSignup onOTPSent={handleOTPSent} role="jobseeker" />
                <div className="jss-divider"><span>or sign up with</span></div>
                <GoogleSignIn role="jobseeker"/>
              </>
            ) : (
              <>
                <button className="jss-back" type="button" onClick={handleBack}><ArrowLeft size={14} /> Back</button>
                <h1 className="jss-heading">Verify email</h1>
                <p className="jss-subheading">Code sent to <strong>{email}</strong></p>
                <SignupVerifyOtp email={email} onBack={handleBack} role={role} />
              </>
            )}
            <div className="jss-footer">
              Already have an account? <Link to="/login">Sign in</Link>
              {" · "}
              <Link to="/" style={{ color: "#9ca3af" }}>Home</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default JobSeekerSignup;