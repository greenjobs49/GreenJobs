import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Loader, ArrowLeft, Building2, TrendingUp, Award, Globe,RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { sendOTP, verifyOTP } from "../api/authApi";
import GoogleSignIn from "../components/Auth/GoogleSignIn";
import ReCAPTCHA from "react-google-recaptcha";
import Navbar from "../components/common/Navbar";
import { useOtpCooldown } from "../hooks/useOtpCooldown";
const BusinessLogin = () => {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState(null);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  const { secondsLeft, isCoolingDown, canRequest, recordRequest, startCooldown } = useOtpCooldown(email);
if (isAuthenticated) return <Navigate to="/business/dashboard" replace />;
  const handleOtpChange = (val, idx) => {
    const digits = val.replace(/\D/g, "").slice(0, 1);
    const next = [...otp]; next[idx] = digits; setOtp(next);
    if (digits && idx < 5) document.getElementById(`otp-biz-${idx + 1}`)?.focus();
  };
  const handleOtpKey = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) document.getElementById(`otp-biz-${idx - 1}`)?.focus();
  };
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    pasted.split("").forEach((d, i) => { next[i] = d; });
    setOtp(next);
    document.getElementById(`otp-biz-${Math.min(pasted.length, 5)}`)?.focus();
  };
  const otpString = otp.join("");

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!email) { toast.error("Enter your email"); return; }
    if (!captchaToken && import.meta.env.VITE_RECAPTCHA_SITE_KEY) { toast.error("Complete the captcha"); return; }
    if (isCoolingDown) { toast.error(`Please wait ${secondsLeft}s`); return; }
    if (!canRequest()) { toast.error("Too many requests. Wait 10 minutes."); return; }
    setLoading(true);
    try {
      const res = await sendOTP(email, "login", captchaToken || "dev", "business");
      if (res.success) {
        toast.success("OTP dispatched");
        recordRequest();
        startCooldown();
        setStep("verify");
      } else {
        toast.error(res.message || "Failed");
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
      const res = await verifyOTP(email, otpString, null, null, null, null, "login", "business");
      if (res.success) { toast.success("Welcome!"); login(res.user, res.token); navigate("/business/dashboard"); }
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

        .biz-page {
          height: calc(100dvh - 82px);
          min-height: calc(100dvh - 82px);
          display: flex;
          align-items: stretch;
          background: #f0fdf4;
          overflow: hidden;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .biz-left, .biz-right { height: 100%; min-height: 100%; }

        .biz-left {
          flex: 1; min-width: 0;
          display: flex; align-items: center; justify-content: center;
          padding: 48px 40px; overflow-y: auto; background: #f0fdf4;
        }

        .biz-form-box { width: 100%; max-width: 420px; margin: 0 auto; animation: bizUp 0.45s ease both; }
        @keyframes bizUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }

        .biz-wordmark { font-size: 20px; font-weight: 800; color: #052e16; margin-bottom: 32px; display: flex; align-items: center; gap: 10px; letter-spacing: -0.4px; }
        .biz-wordmark-dot { width: 8px; height: 8px; border-radius: 50%; background: #16a34a; margin-top: 2px; flex-shrink: 0; }

        .biz-heading { font-size: 28px; font-weight: 800; color: #052e16; margin-bottom: 6px; letter-spacing: -0.5px; }
        .biz-sub { font-size: 14px; color: #6b7280; margin-bottom: 28px; line-height: 1.6; }
        .biz-sub strong { color: #052e16; font-weight: 700; }

        .biz-label { font-size: 12px; font-weight: 700; color: #374151; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 8px; display: block; }

        .biz-input-wrap { position: relative; margin-bottom: 18px; }
        .biz-input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #9ca3af; }
        .biz-input {
          width: 100%; padding: 13px 16px 13px 44px;
          background: white; border: 1.5px solid #d1fae5; border-radius: 10px;
          font-size: 14px; font-family: 'Inter', sans-serif;
          color: #052e16; outline: none; transition: all 0.2s; box-sizing: border-box;
        }
        .biz-input:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.12); }
        .biz-input:disabled { opacity: 0.6; background: #f0fdf4; }
        .biz-input::placeholder { color: #9ca3af; }

        .biz-otp-row { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; width: 100%; margin-bottom: 16px; box-sizing: border-box; }
        .biz-otp-box {
          width: 100%; aspect-ratio: 1/1; max-height: 60px;
          background: white; border: 1.5px solid #d1fae5; border-radius: 10px;
          font-size: 22px; font-weight: 800; font-family: 'Inter', sans-serif;
          color: #052e16; text-align: center; outline: none;
          transition: all 0.18s; padding: 0; box-sizing: border-box;
        }
        .biz-otp-box:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.12); background: #f0fdf4; }
        .biz-otp-box:not(:placeholder-shown) { background: #f0fdf4; }

        .biz-otp-hint { font-size: 12px; color: #9ca3af; text-align: center; margin-bottom: 20px; }
        .biz-otp-hint button { background: none; border: none; color: #16a34a; font-weight: 700; cursor: pointer; font-family: 'Inter', sans-serif; font-size: 12px; padding: 0; }
        .biz-otp-hint button:hover { text-decoration: underline; }

        .biz-captcha { display: flex; justify-content: center; margin-bottom: 18px; }

        .biz-btn {
          width: 100%; padding: 14px;
          background: #052e16; color: white; border: none; border-radius: 10px;
          font-size: 15px; font-weight: 700; font-family: 'Inter', sans-serif;
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-sizing: border-box; letter-spacing: 0.1px;
        }
        .biz-btn:hover:not(:disabled) { background: #14532d; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(5,46,22,0.25); }
        .biz-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; box-shadow: none; }

        .biz-divider { text-align: center; position: relative; margin: 20px 0; }
        .biz-divider::before { content: ''; position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: #d1fae5; }
        .biz-divider span { background: #f0fdf4; padding: 0 14px; font-size: 11px; color: #9ca3af; position: relative; letter-spacing: 0.06em; text-transform: uppercase; }

        .biz-footer { text-align: center; margin-top: 28px; font-size: 13px; color: #6b7280; }
        .biz-footer a { color: #16a34a; font-weight: 700; text-decoration: none; }
        .biz-footer a:hover { text-decoration: underline; }

        .biz-back { background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px; color: #6b7280; margin-bottom: 24px; padding: 0; font-family: 'Inter', sans-serif; transition: color 0.15s; font-weight: 500; }
        .biz-back:hover { color: #052e16; }

        .biz-right {
          width: 42%; flex-shrink: 0;
          background: linear-gradient(160deg, #052e16 0%, #14532d 50%, #166534 100%);
          display: flex; flex-direction: column; justify-content: center;
          padding: 64px 56px; position: relative; overflow: hidden;
        }
        .biz-right-circles { position: absolute; inset: 0; pointer-events: none; }
        .biz-right-circle { position: absolute; border-radius: 50%; border: 1px solid rgba(255,255,255,0.06); }
        .biz-right-c1 { width: 500px; height: 500px; top: -180px; left: -180px; }
        .biz-right-c2 { width: 340px; height: 340px; top: 60px; right: -120px; }
        .biz-right-c3 { width: 200px; height: 200px; bottom: 120px; left: 40px; border-color: rgba(16,185,129,0.2); }
        .biz-right-glow { position: absolute; inset: 0; background-image: radial-gradient(circle at 70% 20%, rgba(16,185,129,0.15) 0%, transparent 60%); pointer-events: none; }
        .biz-right-content { position: relative; z-index: 2; }
        .biz-right-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #6ee7b7; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
        .biz-right-eyebrow::before { content: ''; width: 24px; height: 1px; background: #6ee7b7; }
        .biz-right-title { font-size: 38px; font-weight: 800; line-height: 1.15; color: white; margin-bottom: 24px; letter-spacing: -1px; }
        .biz-right-title span { color: #6ee7b7; }
        .biz-right-desc { font-size: 14px; color: rgba(255,255,255,0.55); line-height: 1.8; margin-bottom: 40px; max-width: 320px; }
        .biz-features { display: flex; flex-direction: column; gap: 18px; }
        .biz-feature { display: flex; align-items: flex-start; gap: 14px; }
        .biz-feature-icon { width: 36px; height: 36px; border-radius: 8px; background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.25); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .biz-feature-title { font-size: 13px; font-weight: 700; color: white; margin-bottom: 3px; }
        .biz-feature-desc { font-size: 12px; color: rgba(255,255,255,0.45); }
        .biz-stats { display: flex; gap: 32px; margin-top: 40px; }
        .biz-stat-num { font-size: 28px; font-weight: 800; color: white; letter-spacing: -0.5px; }
        .biz-stat-label { font-size: 11px; color: rgba(255,255,255,0.45); margin-top: 2px; font-weight: 500; }

        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (max-width: 900px) { .biz-right { display: none; } }
        @media (max-width: 768px) {
          html, body, #root, .App { height: auto; min-height: 100%; overflow-y: auto; }
          body { overflow-x: hidden; }
          .biz-page { height: auto; min-height: calc(100dvh - 82px); overflow: visible; }
          .biz-left { height: auto; min-height: calc(100dvh - 82px); padding: 32px 20px; align-items: flex-start; overflow: visible; }
        }
        @media (max-width: 400px) { .biz-otp-row { gap: 6px; } .biz-otp-box { font-size: 18px; border-radius: 8px; } }
      `}</style>

      <Navbar />
      <div className="biz-page">
        <div className="biz-left">
          <div className="biz-form-box">
            <div className="biz-wordmark">
              <Building2 size={20} color="#16a34a" />
              GreenJobs Business
              <div className="biz-wordmark-dot" />
            </div>
            {step === "email" ? (
              <>
                <h1 className="biz-heading">Business Sign In</h1>
                <form onSubmit={handleSendOtp}>
                  <label className="biz-label">Business Email</label>
                  <div className="biz-input-wrap">
                    <Mail size={17} className="biz-input-icon" />
                    <input type="email" className="biz-input" placeholder="owner@company.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
                  </div>
                  {import.meta.env.VITE_RECAPTCHA_SITE_KEY && (
                    <div className="biz-captcha"><ReCAPTCHA sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY} onChange={setCaptchaToken} /></div>
                  )}
                  <button className="biz-btn" disabled={loading || isCoolingDown}>
  {loading
    ? <><Loader size={15} className="spinner" /> Sending OTP...</>
    : isCoolingDown
    ? `Resend available in ${secondsLeft}s`
    : "Send OTP →"}  {/* ✅ no Lock icon needed */}
</button>
                  <div className="biz-divider"><span>or</span></div>
                  <GoogleSignIn />
                </form>
              </>
            ) : (
              <>
                <button className="biz-back" type="button" onClick={() => { setStep("email"); setOtp(["","","","","",""]); }}>
                  <ArrowLeft size={14} /> Back to email
                </button>
                <h1 className="biz-heading">Enter OTP</h1>
                <p className="biz-sub">We sent a 6-digit code to<br /><strong>{email}</strong></p>
                <form onSubmit={handleVerifyOtp}>
                  <div className="biz-otp-row">
                    {otp.map((digit, i) => (
                      <input key={i} id={`otp-biz-${i}`} className="biz-otp-box"
                        type="text" inputMode="numeric" maxLength={1} value={digit} placeholder="·"
                        onChange={e => handleOtpChange(e.target.value, i)}
                        onKeyDown={e => handleOtpKey(e, i)}
                        onPaste={i === 0 ? handleOtpPaste : undefined}
                        disabled={loading} autoFocus={i === 0} />
                    ))}
                  </div>
                  <p className="biz-otp-hint">Didn't receive it?{" "}<button type="button" onClick={handleSendOtp} disabled={isCoolingDown || resending}
    style={{ color: isCoolingDown ? "#9ca3af" : "#16a34a", cursor: isCoolingDown ? "default" : "pointer", display: "inline-flex", alignItems: "center", gap: 3 }}>{resending
      ? <Loader size={11} style={{ animation: "spin 1s linear infinite" }} />
      : <RefreshCw size={11} />}
    {isCoolingDown ? `Resend in ${secondsLeft}s` : "Resend OTP"}</button></p>
                  <button className="biz-btn" disabled={loading || otpString.length !== 6}>
                    {loading ? <><Loader size={15} className="spinner" /> Verifying...</> : "Verify & Enter →"}
                  </button>
                </form>
              </>
            )}
            <div className="biz-footer">
              New business? <Link to="/signup?role=business">Register here</Link>
              {" · "}
              <Link to="/" style={{ color: "#9ca3af" }}>Home</Link>
            </div>
          </div>
        </div>

        <div className="biz-right">
          <div className="biz-right-circles">
            <div className="biz-right-circle biz-right-c1" />
            <div className="biz-right-circle biz-right-c2" />
            <div className="biz-right-circle biz-right-c3" />
          </div>
          <div className="biz-right-glow" />
          <div className="biz-right-content">
            <div className="biz-right-eyebrow">For Business Owners</div>
            <h2 className="biz-right-title">Grow your <span>green</span> business</h2>
            <p className="biz-right-desc">List your company, post opportunities, and connect with skilled professionals in the renewable energy sector.</p>
            <div className="biz-features">
              <div className="biz-feature"><div className="biz-feature-icon"><TrendingUp size={16} color="#6ee7b7" /></div><div><div className="biz-feature-title">Visibility Boost</div><div className="biz-feature-desc">Get discovered by thousands of green energy professionals</div></div></div>
              <div className="biz-feature"><div className="biz-feature-icon"><Award size={16} color="#6ee7b7" /></div><div><div className="biz-feature-title">Verified Badge</div><div className="biz-feature-desc">Build trust with our business verification program</div></div></div>
              <div className="biz-feature"><div className="biz-feature-icon"><Globe size={16} color="#6ee7b7" /></div><div><div className="biz-feature-title">Pan-India Reach</div><div className="biz-feature-desc">Connect with talent from every state across India</div></div></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BusinessLogin;