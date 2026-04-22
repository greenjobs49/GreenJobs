import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Loader, ArrowLeft, Leaf,RefreshCw } from "lucide-react";
import { useOtpCooldown } from "../hooks/useOtpCooldown";
import toast from "react-hot-toast";
import { sendOTP, verifyOTP } from "../api/authApi";
import GoogleSignIn from "../components/Auth/GoogleSignIn";
import ReCAPTCHA from "react-google-recaptcha";
import Navbar from "../components/common/Navbar";
const JobSeekerLogin = () => {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState(null);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const { secondsLeft, isCoolingDown, canRequest, recordRequest, startCooldown } = useOtpCooldown(email);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleOtpChange = (val, idx) => {
    const digits = val.replace(/\D/g, "").slice(0, 1);
    const next = [...otp]; next[idx] = digits; setOtp(next);
    if (digits && idx < 5) document.getElementById(`otp-js-${idx + 1}`)?.focus();
  };
  const handleOtpKey = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) document.getElementById(`otp-js-${idx - 1}`)?.focus();
  };
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    pasted.split("").forEach((d, i) => { next[i] = d; });
    setOtp(next);
    document.getElementById(`otp-js-${Math.min(pasted.length, 5)}`)?.focus();
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
      const res = await sendOTP(email, "login", captchaToken || "dev", "jobseeker");
      if (res.success) { toast.success("OTP sent!");
        recordRequest();
startCooldown(); setStep("verify"); }
      else toast.error(res.message || "Failed to send OTP");
    } catch (err) {
      const status  = err.response?.status;
      const message = err.response?.data?.message;
      if (status === 429) {
        toast.error(message || "Too many requests. Please wait before trying again.");
        startCooldown();
      } else {
        toast.error(message || "Failed to send OTP");
      }
      if (err.response?.data?.correctPortal) {
        setTimeout(() => navigate(err.response.data.correctPortal), 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otpString.length !== 6) { toast.error("Enter all 6 digits"); return; }
    setLoading(true);
    try {
      const res = await verifyOTP(email, otpString, null, null, null, null, "login", "jobseeker");
      if (res.success) {
        toast.success("Welcome back!");
        login(res.user, res.token);
        navigate("/dashboard");
      } else {
        toast.error(res.message || "Invalid OTP");
        if (res.correctPortal) setTimeout(() => navigate(res.correctPortal), 1500);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
      if (err.response?.data?.correctPortal) {
        setTimeout(() => navigate(err.response.data.correctPortal), 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        html, body, #root {
          height: 100%;
          min-height: 100%;
          margin: 0;
          background: #f0fdf4;
        }
        body { overflow: hidden; }
        #root, .App {
          height: 100%;
          min-height: 100%;
          background: #f0fdf4;
        }
        *, *::before, *::after { box-sizing: border-box; }

        .js-page {
          height: calc(100dvh - 82px);
          min-height: calc(100dvh - 82px);
          display: flex;
          align-items: stretch;
          background: #f0fdf4;
          overflow: hidden;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .js-left, .js-right { height: 100%; min-height: 100%; }

        /* ── LEFT PANEL ── */
        .js-left {
          width: 42%;
          flex-shrink: 0;
          background: linear-gradient(160deg, #052e16 0%, #14532d 50%, #166534 100%);
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 52px 48px;
          overflow: hidden;
        }
        .js-left-circles { position: absolute; inset: 0; pointer-events: none; }
        .js-circle { position: absolute; border-radius: 50%; border: 1px solid rgba(255,255,255,0.06); }
        .js-c1 { width: 500px; height: 500px; top: -180px; left: -180px; }
        .js-c2 { width: 340px; height: 340px; top: 60px; right: -120px; }
        .js-c3 { width: 200px; height: 200px; bottom: 120px; left: 40px; border-color: rgba(16,185,129,0.2); }
        .js-leaf-bg { position: absolute; inset: 0; background-image: radial-gradient(circle at 70% 20%, rgba(16,185,129,0.15) 0%, transparent 60%); }

        .js-tagline { position: relative; z-index: 2; }
        .js-tagline-eyebrow {
          font-size: 11px; font-weight: 700; letter-spacing: 0.14em;
          text-transform: uppercase; color: #6ee7b7; margin-bottom: 16px;
          display: flex; align-items: center; gap: 8px;
        }
        .js-tagline-eyebrow::before { content: ''; width: 24px; height: 1px; background: #6ee7b7; }
        .js-tagline-title {
          font-size: 40px; font-weight: 800; line-height: 1.15;
          color: white; margin-bottom: 20px; letter-spacing: -1px;
        }
        .js-tagline-title em { font-style: normal; color: #6ee7b7; }
        .js-tagline-sub { font-size: 14px; color: rgba(255,255,255,0.55); line-height: 1.7; max-width: 300px; }

        .js-stats { display: flex; gap: 32px; margin-top: 40px; position: relative; z-index: 2; }
        .js-stat-num { font-size: 28px; font-weight: 800; color: white; letter-spacing: -0.5px; }
        .js-stat-label { font-size: 11px; color: rgba(255,255,255,0.45); margin-top: 2px; font-weight: 500; }

        /* ── RIGHT PANEL ── */
        .js-right {
          flex: 1; min-width: 0;
          display: flex; align-items: center; justify-content: center;
          padding: 48px 40px; overflow-y: auto; background: #f0fdf4;
        }

        .js-form-box {
          width: 100%; max-width: 420px;
          margin: 0 auto;
          animation: jsFadeUp 0.4s ease both;
        }
        @keyframes jsFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

        .js-heading { font-size: 28px; font-weight: 800; color: #052e16; margin-bottom: 6px; letter-spacing: -0.5px; }
        .js-subheading { font-size: 14px; color: #6b7280; margin-bottom: 28px; line-height: 1.6; font-weight: 400; }
        .js-subheading strong { color: #052e16; font-weight: 700; }

        .js-label { display: block; font-size: 12px; font-weight: 700; color: #374151; margin-bottom: 7px; text-transform: uppercase; letter-spacing: 0.06em; }

        .js-input-wrap { position: relative; margin-bottom: 20px; }
        .js-input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #9ca3af; }
        .js-input {
          width: 100%; padding: 13px 16px 13px 44px;
          border: 1.5px solid #d1fae5; border-radius: 10px;
          font-size: 14px; font-family: 'Inter', sans-serif;
          background: white; color: #111827; outline: none;
          transition: all 0.2s; box-sizing: border-box;
        }
        .js-input:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.12); }
        .js-input:disabled { opacity: 0.6; }
        .js-input::placeholder { color: #9ca3af; }

        .js-otp-row {
          display: grid; grid-template-columns: repeat(6, 1fr);
          gap: 8px; width: 100%; margin-bottom: 16px; box-sizing: border-box;
        }
        .js-otp-box {
          width: 100%; aspect-ratio: 1/1; max-height: 60px;
          border: 1.5px solid #d1fae5; border-radius: 10px;
          font-size: 22px; font-weight: 800; font-family: 'Inter', sans-serif;
          color: #052e16; text-align: center; background: white; outline: none;
          transition: all 0.18s; padding: 0; box-sizing: border-box;
        }
        .js-otp-box:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.12); background: #f0fdf4; }
        .js-otp-box:not(:placeholder-shown) { background: #f0fdf4; }

        .js-otp-hint { font-size: 12px; color: #9ca3af; text-align: center; margin-bottom: 20px; }
        .js-otp-hint button { background: none; border: none; color: #16a34a; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; font-size: 12px; padding: 0; }
        .js-otp-hint button:hover { text-decoration: underline; }

        .js-captcha { display: flex; justify-content: center; margin-bottom: 20px; }

        .js-btn {
          width: 100%; padding: 14px;
          background: #052e16; color: white; border: none; border-radius: 10px;
          font-size: 15px; font-weight: 700; font-family: 'Inter', sans-serif;
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-sizing: border-box; letter-spacing: 0.1px;
        }
        .js-btn:hover:not(:disabled) { background: #14532d; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(5,46,22,0.25); }
        .js-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .js-divider { text-align: center; position: relative; margin: 22px 0; }
        .js-divider::before { content: ''; position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: #d1fae5; }
        .js-divider span { background: #f0fdf4; padding: 0 14px; font-size: 12px; color: #9ca3af; position: relative; }

        .js-footer { text-align: center; margin-top: 28px; font-size: 13px; color: #6b7280; }
        .js-footer a { color: #16a34a; font-weight: 600; text-decoration: none; }
        .js-footer a:hover { text-decoration: underline; }

        .js-back { background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px; color: #6b7280; margin-bottom: 24px; padding: 0; font-family: 'Inter', sans-serif; transition: color 0.15s; font-weight: 500; }
        .js-back:hover { color: #052e16; }

        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (max-width: 900px) {
          .js-left { width: 36%; padding: 40px 32px; }
          .js-tagline-title { font-size: 32px; }
        }
        @media (max-width: 768px) {
          html, body, #root, .App {
            height: auto;
            min-height: 100%;
            overflow-y: auto;
          }
          body { overflow-x: hidden; }
          .js-page {
            height: auto;
            min-height: calc(100dvh - 82px);
            overflow: visible;
          }
          .js-left { display: none; }
          .js-right {
            height: auto;
            min-height: calc(100dvh - 82px);
            padding: 36px 24px;
            align-items: flex-start;
            overflow: visible;
          }
          .js-form-box { max-width: 100%; }
        }
        @media (max-width: 420px) {
          .js-otp-row { gap: 6px; }
          .js-otp-box { font-size: 18px; border-radius: 8px; }
        }
      `}</style>

      <Navbar />
      <div className="js-page">
        <div className="js-left">
          <div className="js-left-circles">
            <div className="js-circle js-c1" />
            <div className="js-circle js-c2" />
            <div className="js-circle js-c3" />
          </div>
          <div className="js-leaf-bg" />
          <div className="js-tagline">
            <div className="js-tagline-eyebrow">Green Jobs Careers</div>
            <h2 className="js-tagline-title">Find your <em>purpose</em> in green energy</h2>
            <p className="js-tagline-sub">Discover renewable energy jobs across India and connect with companies building a sustainable future.</p>
            <div className="js-stats">
              <div><div className="js-stat-num">2,400+</div><div className="js-stat-label">Active Jobs</div></div>
              <div><div className="js-stat-num">340+</div><div className="js-stat-label">Companies</div></div>
              <div><div className="js-stat-num">18k+</div><div className="js-stat-label">Placements</div></div>
            </div>
          </div>
        </div>

        <div className="js-right">
          <div className="js-form-box">
            {step === "email" ? (
              <>
                <h1 className="js-heading">Welcome back</h1>
                <p className="js-subheading">Sign in to your job seeker account</p>
                <form onSubmit={handleSendOtp}>
                  <label className="js-label">Email Address</label>
                  <div className="js-input-wrap">
                    <Mail size={18} className="js-input-icon" />
                    <input type="email" className="js-input" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
                  </div>
                  {import.meta.env.VITE_RECAPTCHA_SITE_KEY && (
                    <div className="js-captcha"><ReCAPTCHA sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY} onChange={setCaptchaToken} /></div>
                  )}
                  <button className="js-btn" disabled={loading || isCoolingDown}>
  {loading
    ? <><Loader size={16} className="spinner" /> Sending OTP...</>
    : isCoolingDown
    ? `Resend available in ${secondsLeft}s`
    : "Send OTP →"}
</button>
                  <div className="js-divider"><span>or continue with</span></div>
                  <GoogleSignIn />
                </form>
              </>
            ) : (
              <>
                <button className="js-back" type="button" onClick={() => { setStep("email"); setOtp(["","","","","",""]); }}>
                  <ArrowLeft size={14} /> Back to email
                </button>
                <h1 className="js-heading">Enter OTP</h1>
                <p className="js-subheading">We sent a 6-digit code to<br /><strong>{email}</strong></p>
                <form onSubmit={handleVerifyOtp}>
                  <div className="js-otp-row">
                    {otp.map((digit, i) => (
                      <input key={i} id={`otp-js-${i}`} className="js-otp-box"
                        type="text" inputMode="numeric" maxLength={1} value={digit} placeholder="·"
                        onChange={e => handleOtpChange(e.target.value, i)}
                        onKeyDown={e => handleOtpKey(e, i)}
                        onPaste={i === 0 ? handleOtpPaste : undefined}
                        disabled={loading} autoFocus={i === 0} />
                    ))}
                  </div>
                  <p className="js-otp-hint">
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
                  <button className="js-btn" disabled={loading || otpString.length !== 6}>
                    {loading ? <><Loader size={16} className="spinner" /> Verifying...</> : "Verify & Login →"}
                  </button>
                </form>
              </>
            )}
            <div className="js-footer">
              No account? <Link to="/signup?role=job-seeker">Sign up free</Link>
              {" · "}
              <Link to="/" style={{ color: "#9ca3af" }}>Back to home</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default JobSeekerLogin;