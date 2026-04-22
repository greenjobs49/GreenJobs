import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Loader, ArrowLeft, BarChart2, Users, Zap, Target,RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { sendOTP, verifyOTP } from "../api/authApi";
import GoogleSignIn from "../components/Auth/GoogleSignIn";
import ReCAPTCHA from "react-google-recaptcha";
import Navbar from "../components/common/Navbar";
import { useOtpCooldown } from "../hooks/useOtpCooldown";
const RecruiterLogin = () => {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState(null);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const { secondsLeft, isCoolingDown, canRequest, recordRequest, startCooldown } = useOtpCooldown(email);
  if (isAuthenticated) return <Navigate to="/recruiter/dashboard" replace />;

  const handleOtpChange = (val, idx) => {
    const digits = val.replace(/\D/g, "").slice(0, 1);
    const next = [...otp]; next[idx] = digits; setOtp(next);
    if (digits && idx < 5) document.getElementById(`otp-rec-${idx + 1}`)?.focus();
  };
  const handleOtpKey = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) document.getElementById(`otp-rec-${idx - 1}`)?.focus();
  };
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    pasted.split("").forEach((d, i) => { next[i] = d; });
    setOtp(next);
    document.getElementById(`otp-rec-${Math.min(pasted.length, 5)}`)?.focus();
  };
  const otpString = otp.join("");

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!email) { toast.error("Please enter your email"); return; }
    if (!captchaToken && import.meta.env.VITE_RECAPTCHA_SITE_KEY) { toast.error("Please complete the captcha"); return; }
    if (isCoolingDown) { toast.error(`Please wait ${secondsLeft}s`); return; }
    if (!canRequest()) { toast.error("Too many requests. Wait 10 minutes."); return; }
    setLoading(true);
    try {
      const res = await sendOTP(email, "login", captchaToken || "dev", "recruiter");
      if (res.success) {
        toast.success("OTP sent!");
        recordRequest();
        startCooldown();
        setStep("verify");
      } else {
        toast.error(res.message || "Failed to send OTP");
      }
    } catch (err) {
      const status  = err.response?.status;
      const message = err.response?.data?.message;
      if (status === 429) {
        toast.error(message || "Too many requests. Please wait before trying again.");
        startCooldown();
      } else {
        toast.error(message || "Failed to send OTP");
      }
      if (err.response?.data?.correctPortal) setTimeout(() => navigate(err.response.data.correctPortal), 1500);
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otpString.length !== 6) { toast.error("Enter all 6 digits"); return; }
    setLoading(true);
    try {
      const res = await verifyOTP(email, otpString, null, null, null, null, "login", "recruiter");
      if (res.success) { toast.success("Welcome back!"); login(res.user, res.token); navigate("/recruiter/dashboard"); }
      else { toast.error(res.message || "Invalid OTP"); if (res.correctPortal) setTimeout(() => navigate(res.correctPortal), 1500); }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
      if (err.response?.data?.correctPortal) setTimeout(() => navigate(err.response.data.correctPortal), 1500);
    } finally { setLoading(false); }
  };

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

        .rec-page {
          height: calc(100dvh - 82px);
          min-height: calc(100dvh - 82px);
          display: flex;
          align-items: stretch;
          background: #f0fdf4;
          overflow: hidden;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .rec-left, .rec-right { height: 100%; min-height: 100%; }

        .rec-left {
          flex: 1; min-width: 0;
          display: flex; align-items: center; justify-content: center;
          padding: 48px 40px; overflow-y: auto; background: #f0fdf4;
        }

        .rec-form-box { width: 100%; max-width: 420px; margin: 0 auto; animation: recUp 0.45s ease both; }
        @keyframes recUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }

        .rec-wordmark { font-size: 20px; font-weight: 800; color: #052e16; margin-bottom: 32px; display: flex; align-items: center; gap: 10px; letter-spacing: -0.4px; }
        .rec-wordmark-dot { width: 8px; height: 8px; border-radius: 50%; background: #16a34a; margin-top: 2px; flex-shrink: 0; }

        .rec-heading { font-size: 28px; font-weight: 800; color: #052e16; margin-bottom: 6px; letter-spacing: -0.5px; }
        .rec-sub { font-size: 14px; color: #6b7280; margin-bottom: 28px; line-height: 1.6; font-weight: 400; }
        .rec-sub strong { color: #052e16; font-weight: 700; }

        .rec-label { font-size: 12px; font-weight: 700; color: #374151; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 8px; display: block; }

        .rec-input-wrap { position: relative; margin-bottom: 18px; }
        .rec-input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #9ca3af; }
        .rec-input {
          width: 100%; padding: 13px 16px 13px 44px;
          background: white; border: 1.5px solid #d1fae5; border-radius: 10px;
          font-size: 14px; font-family: 'Inter', sans-serif;
          color: #052e16; outline: none; transition: all 0.2s; box-sizing: border-box;
        }
        .rec-input:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.12); }
        .rec-input:disabled { opacity: 0.6; background: #f0fdf4; }
        .rec-input::placeholder { color: #9ca3af; }

        .rec-otp-row { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; width: 100%; margin-bottom: 16px; box-sizing: border-box; }
        .rec-otp-box {
          width: 100%; aspect-ratio: 1/1; max-height: 60px;
          background: white; border: 1.5px solid #d1fae5; border-radius: 10px;
          font-size: 22px; font-weight: 800; font-family: 'Inter', sans-serif;
          color: #052e16; text-align: center; outline: none;
          transition: all 0.18s; padding: 0; box-sizing: border-box;
        }
        .rec-otp-box:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.12); background: #f0fdf4; }
        .rec-otp-box:not(:placeholder-shown) { background: #f0fdf4; }

        .rec-otp-hint { font-size: 12px; color: #9ca3af; text-align: center; margin-bottom: 20px; }
        .rec-otp-hint button { background: none; border: none; color: #16a34a; font-weight: 700; cursor: pointer; font-family: 'Inter', sans-serif; font-size: 12px; padding: 0; }
        .rec-otp-hint button:hover { text-decoration: underline; }

        .rec-captcha { display: flex; justify-content: center; margin-bottom: 18px; }

        .rec-btn {
          width: 100%; padding: 14px;
          background: #052e16; color: white; border: none; border-radius: 10px;
          font-size: 15px; font-weight: 700; font-family: 'Inter', sans-serif;
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-sizing: border-box; letter-spacing: 0.1px;
        }
        .rec-btn:hover:not(:disabled) { background: #14532d; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(5,46,22,0.25); }
        .rec-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; box-shadow: none; }

        .rec-divider { text-align: center; position: relative; margin: 20px 0; }
        .rec-divider::before { content: ''; position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: #d1fae5; }
        .rec-divider span { background: #f0fdf4; padding: 0 14px; font-size: 11px; color: #9ca3af; position: relative; letter-spacing: 0.06em; text-transform: uppercase; }

        .rec-footer { text-align: center; margin-top: 28px; font-size: 13px; color: #6b7280; }
        .rec-footer a { color: #16a34a; font-weight: 700; text-decoration: none; }
        .rec-footer a:hover { text-decoration: underline; }

        .rec-back { background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px; color: #6b7280; margin-bottom: 24px; padding: 0; font-family: 'Inter', sans-serif; transition: color 0.15s; font-weight: 500; }
        .rec-back:hover { color: #052e16; }

        .rec-right {
          width: 42%; flex-shrink: 0;
          background: linear-gradient(160deg, #052e16 0%, #14532d 50%, #166534 100%);
          display: flex; flex-direction: column; justify-content: flex-end;
          padding: 64px 56px; position: relative; overflow: hidden;
        }
        .rec-right-circles { position: absolute; inset: 0; pointer-events: none; }
        .rec-right-circle { position: absolute; border-radius: 50%; border: 1px solid rgba(255,255,255,0.06); }
        .rec-right-c1 { width: 500px; height: 500px; top: -180px; left: -180px; }
        .rec-right-c2 { width: 340px; height: 340px; top: 60px; right: -120px; }
        .rec-right-c3 { width: 200px; height: 200px; bottom: 120px; left: 40px; border-color: rgba(16,185,129,0.2); }
        .rec-right-glow { position: absolute; inset: 0; background-image: radial-gradient(circle at 70% 20%, rgba(16,185,129,0.15) 0%, transparent 60%); pointer-events: none; }
        .rec-right-content { position: relative; z-index: 2; }
        .rec-right-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #6ee7b7; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
        .rec-right-eyebrow::before { content: ''; width: 24px; height: 1px; background: #6ee7b7; }
        .rec-right-title { font-size: 38px; font-weight: 800; line-height: 1.15; color: white; margin-bottom: 24px; letter-spacing: -1px; }
        .rec-right-title span { color: #6ee7b7; }
        .rec-right-desc { font-size: 14px; color: rgba(255,255,255,0.55); line-height: 1.8; margin-bottom: 40px; max-width: 320px; }
        .rec-features { display: flex; flex-direction: column; gap: 18px; }
        .rec-feature { display: flex; align-items: flex-start; gap: 14px; }
        .rec-feature-icon { width: 36px; height: 36px; border-radius: 8px; background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.25); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .rec-feature-title { font-size: 13px; font-weight: 700; color: white; margin-bottom: 3px; }
        .rec-feature-desc { font-size: 12px; color: rgba(255,255,255,0.45); }
        .rec-stats { display: flex; gap: 32px; margin-top: 40px; }
        .rec-stat-num { font-size: 28px; font-weight: 800; color: white; letter-spacing: -0.5px; }
        .rec-stat-label { font-size: 11px; color: rgba(255,255,255,0.45); margin-top: 2px; font-weight: 500; }

        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (max-width: 900px) { .rec-right { display: none; } }
        @media (max-width: 768px) {
          html, body, #root, .App { height: auto; min-height: 100%; overflow-y: auto; }
          body { overflow-x: hidden; }
          .rec-page { height: auto; min-height: calc(100dvh - 82px); overflow: visible; }
          .rec-left { height: auto; min-height: calc(100dvh - 82px); padding: 32px 20px; align-items: flex-start; overflow: visible; }
        }
        @media (max-width: 400px) { .rec-otp-row { gap: 6px; } .rec-otp-box { font-size: 18px; border-radius: 8px; } }
      `}</style>

      <Navbar />
      <div className="rec-page">
        <div className="rec-left">
          <div className="rec-form-box">
            <div className="rec-wordmark">
              <BarChart2 size={20} color="#16a34a" />
              GreenJobs Recruiter
              <div className="rec-wordmark-dot" />
            </div>
            {step === "email" ? (
              <>
                <h1 className="rec-heading">Recruiter Sign In</h1>
                <p className="rec-sub">Access your hiring dashboard and manage candidates.</p>
                <form onSubmit={handleSendOtp}>
                  <label className="rec-label">Work Email</label>
                  <div className="rec-input-wrap">
                    <Mail size={17} className="rec-input-icon" />
                    <input type="email" className="rec-input" placeholder="recruiter@company.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
                  </div>
                  {import.meta.env.VITE_RECAPTCHA_SITE_KEY && (
                    <div className="rec-captcha"><ReCAPTCHA sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY} onChange={setCaptchaToken} /></div>
                  )}
                  <button className="rec-btn" disabled={loading || isCoolingDown}>
  {loading
    ? <><Loader size={15} className="spinner" /> Sending OTP...</>
    : isCoolingDown
    ? `Resend available in ${secondsLeft}s`
    : "Send OTP →"}
</button>
                  <div className="rec-divider"><span>or</span></div>
                  <GoogleSignIn />
                </form>
              </>
            ) : (
              <>
                <button className="rec-back" type="button" onClick={() => { setStep("email"); setOtp(["","","","","",""]); }}>
                  <ArrowLeft size={14} /> Back to email
                </button>
                <h1 className="rec-heading">Enter OTP</h1>
                <p className="rec-sub">We sent a 6-digit code to<br /><strong>{email}</strong></p>
                <form onSubmit={handleVerifyOtp}>
                  <div className="rec-otp-row">
                    {otp.map((digit, i) => (
                      <input key={i} id={`otp-rec-${i}`} className="rec-otp-box"
                        type="text" inputMode="numeric" maxLength={1} value={digit} placeholder="·"
                        onChange={e => handleOtpChange(e.target.value, i)}
                        onKeyDown={e => handleOtpKey(e, i)}
                        onPaste={i === 0 ? handleOtpPaste : undefined}
                        disabled={loading} autoFocus={i === 0} />
                    ))}
                  </div>
                  <p className="rec-otp-hint">
  Didn't receive it?{" "}
  <button type="button" onClick={handleSendOtp}
    disabled={isCoolingDown || resending}
    style={{ color: isCoolingDown ? "#9ca3af" : "#16a34a", cursor: isCoolingDown ? "default" : "pointer", display: "inline-flex", alignItems: "center", gap: 3 }}>
    {resending
      ? <Loader size={11} style={{ animation: "spin 1s linear infinite" }} />
      : <RefreshCw size={11} />}
    {isCoolingDown ? `Resend in ${secondsLeft}s` : "Resend OTP"}
  </button>
</p>
                  <button className="rec-btn" disabled={loading || otpString.length !== 6}>
                    {loading ? <><Loader size={15} className="spinner" /> Verifying...</> : "Verify & Enter →"}
                  </button>
                </form>
              </>
            )}
            <div className="rec-footer">
              New recruiter? <Link to="/signup?role=recruiter">Create account</Link>
              {" · "}
              <Link to="/" style={{ color: "#9ca3af" }}>Home</Link>
            </div>
          </div>
        </div>

        <div className="rec-right">
          <div className="rec-right-circles">
            <div className="rec-right-circle rec-right-c1" />
            <div className="rec-right-circle rec-right-c2" />
            <div className="rec-right-circle rec-right-c3" />
          </div>
          <div className="rec-right-glow" />
          <div className="rec-right-content">
            <div className="rec-right-eyebrow">For Recruiters</div>
            <h2 className="rec-right-title">Hire <span>smarter</span> in green energy</h2>
            <p className="rec-right-desc">Post jobs, review applications, and build your renewable energy team with India's leading green hiring platform.</p>
            <div className="rec-features">
              <div className="rec-feature"><div className="rec-feature-icon"><Users size={16} color="#6ee7b7" /></div><div><div className="rec-feature-title">Verified Talent Pool</div><div className="rec-feature-desc">Access pre-screened green energy professionals</div></div></div>
              <div className="rec-feature"><div className="rec-feature-icon"><Zap size={16} color="#6ee7b7" /></div><div><div className="rec-feature-title">Fast Hiring</div><div className="rec-feature-desc">Post a job and get applications within 24 hours</div></div></div>
              <div className="rec-feature"><div className="rec-feature-icon"><Target size={16} color="#6ee7b7" /></div><div><div className="rec-feature-title">Targeted Reach</div><div className="rec-feature-desc">Connect with candidates matched to your roles</div></div></div>
            </div>
            <div className="rec-stats">
              <div><div className="rec-stat-num">2,400+</div><div className="rec-stat-label">Active Jobs</div></div>
              <div><div className="rec-stat-num">340+</div><div className="rec-stat-label">Companies</div></div>
              <div><div className="rec-stat-num">18k+</div><div className="rec-stat-label">Placements</div></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RecruiterLogin;