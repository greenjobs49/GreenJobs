import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Loader, ArrowLeft, ShieldCheck, Lock, Terminal,RefreshCw } from "lucide-react";
import { useOtpCooldown } from "../hooks/useOtpCooldown";
import toast from "react-hot-toast";
import { sendOTP, verifyOTP } from "../api/authApi";
import ReCAPTCHA from "react-google-recaptcha";
import Navbar from "../components/common/Navbar";

const AdminLogin = () => {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState(null);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const { secondsLeft, isCoolingDown, canRequest, recordRequest, startCooldown } = useOtpCooldown(email);

  if (isAuthenticated) return <Navigate to="/admin/dashboard" replace />;

  const handleOtpChange = (val, idx) => {
    const digits = val.replace(/\D/g, "").slice(0, 1);
    const next = [...otp]; next[idx] = digits; setOtp(next);
    if (digits && idx < 5) document.getElementById(`otp-adm-${idx + 1}`)?.focus();
  };
  const handleOtpKey = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) document.getElementById(`otp-adm-${idx - 1}`)?.focus();
  };
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    pasted.split("").forEach((d, i) => { next[i] = d; });
    setOtp(next);
    document.getElementById(`otp-adm-${Math.min(pasted.length, 5)}`)?.focus();
  };
  const otpString = otp.join("");

const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!email) { toast.error("Enter admin email"); return; }
    if (!captchaToken && import.meta.env.VITE_RECAPTCHA_SITE_KEY) { toast.error("Complete the captcha"); return; }
    if (isCoolingDown) { toast.error(`Please wait ${secondsLeft}s`); return; }
    if (!canRequest()) { toast.error("Too many requests. Wait 10 minutes."); return; }
    setLoading(true);
    try {
      const res = await sendOTP(email, "login", captchaToken || "dev", "admin");
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
    const res = await verifyOTP(email, otpString, null, null, null, null, "login", "admin");
    if (res.success) {
      toast.success("Access granted");
      login(res.user, res.token);
      navigate("/admin/dashboard");
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
        .adm-page {
          min-height:100vh;
          background: #052e16;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          padding: 40px 20px; position: relative; overflow: hidden;
        }

        /* Background circles like JobSeekerLogin left panel */
        .adm-circles { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
        .adm-circle { position: absolute; border-radius: 50%; border: 1px solid rgba(255,255,255,0.06); }
        .adm-c1 { width: 600px; height: 600px; top: -220px; left: -220px; }
        .adm-c2 { width: 400px; height: 400px; top: 80px; right: -150px; }
        .adm-c3 { width: 240px; height: 240px; bottom: 100px; left: 60px; border-color: rgba(16,185,129,0.2); }
        .adm-glow { position: fixed; inset: 0; pointer-events: none; z-index: 0; background-image: radial-gradient(circle at 70% 20%, rgba(16,185,129,0.15) 0%, transparent 60%); }

        .adm-container { position: relative; z-index: 2; width: 100%; max-width: 440px; }

        .adm-statusbar {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px 8px 0 0;
          padding: 10px 18px; display: flex; align-items: center; justify-content: space-between;
          font-family: 'Inter', sans-serif; font-size: 11px; color: rgba(255,255,255,0.3); font-weight: 500;
        }
        .adm-status-left { display: flex; align-items: center; gap: 8px; }
        .adm-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #6ee7b7; animation: admBlink 2s ease-in-out infinite; }
        @keyframes admBlink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        .adm-status-secure { color: #6ee7b7; font-weight: 700; letter-spacing: 0.06em; }

        .adm-card {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-top: none;
          border-radius: 0 0 12px 12px; padding: 36px 40px 32px;
          animation: admIn 0.4s ease both; backdrop-filter: blur(8px);
        }
        @keyframes admIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

        .adm-shield-row { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
        .adm-shield-icon { width: 44px; height: 44px; border: 1px solid rgba(110,231,183,0.25); border-radius: 10px; display: flex; align-items: center; justify-content: center; background: rgba(16,185,129,0.1); }
        .adm-shield-title { font-size: 16px; font-weight: 800; color: #fff; letter-spacing: -0.2px; }
        .adm-shield-sub { font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 2px; font-weight: 400; }

        .adm-role-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 28px; }
        .adm-chip {
          padding: 4px 10px; border-radius: 4px; font-size: 10px; font-weight: 700;
          border: 1px solid rgba(255,255,255,0.1); background: transparent; color: rgba(255,255,255,0.3);
          text-decoration: none; transition: all 0.15s; letter-spacing: 0.05em; text-transform: uppercase;
        }
        .adm-chip:hover { border-color: rgba(110,231,183,0.4); color: #6ee7b7; }
        .adm-chip.active { border-color: #6ee7b7; color: #6ee7b7; background: rgba(16,185,129,0.1); }

        .adm-heading { font-size: 26px; font-weight: 800; color: #fff; margin-bottom: 4px; letter-spacing: -0.5px; }
        .adm-heading span { color: #6ee7b7; }
        .adm-sub { font-size: 13px; color: rgba(255,255,255,0.4); margin-bottom: 28px; font-weight: 400; }
        .adm-sub strong { color: #6ee7b7; font-weight: 700; }

        .adm-label { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.4); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 8px; display: block; }

        .adm-input-wrap { position: relative; margin-bottom: 16px; }
        .adm-input-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.25); }
        .adm-input {
          width: 100%; padding: 12px 14px 12px 40px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;
          font-size: 14px; font-family: 'Inter', sans-serif;
          color: #fff; outline: none; transition: all 0.2s; box-sizing: border-box;
        }
        .adm-input::placeholder { color: rgba(255,255,255,0.2); }
        .adm-input:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.12); }
        .adm-input:disabled { opacity: 0.4; }

        .adm-otp-row {
          display: grid; grid-template-columns: repeat(6, 1fr);
          gap: 8px; width: 100%; margin-bottom: 16px; box-sizing: border-box;
        }
        .adm-otp-box {
          width: 100%; aspect-ratio: 1/1; max-height: 56px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;
          font-size: 22px; font-weight: 800; font-family: 'Inter', sans-serif;
          color: #6ee7b7; text-align: center; outline: none;
          transition: all 0.2s; padding: 0; box-sizing: border-box;
        }
        .adm-otp-box:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.12); background: rgba(16,185,129,0.08); }
        .adm-otp-box:not(:placeholder-shown) { background: rgba(16,185,129,0.08); }

        .adm-otp-hint { font-size: 12px; color: rgba(255,255,255,0.3); text-align: center; margin-bottom: 18px; }
        .adm-otp-hint button { background: none; border: none; color: #6ee7b7; font-weight: 700; cursor: pointer; font-family: 'Inter', sans-serif; font-size: 12px; padding: 0; }
        .adm-otp-hint button:hover { text-decoration: underline; }

        .adm-captcha { display: flex; justify-content: center; margin-bottom: 16px; }

        .adm-btn {
          width: 100%; padding: 13px;
          background: #052e16; color: #fff; border: 1px solid rgba(110,231,183,0.3); border-radius: 8px;
          font-size: 14px; font-weight: 700; font-family: 'Inter', sans-serif;
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-sizing: border-box; letter-spacing: 0.1px;
          background: linear-gradient(135deg, #14532d, #166534);
        }
        .adm-btn:hover:not(:disabled) { background: linear-gradient(135deg, #166534, #15803d); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(5,46,22,0.4); }
        .adm-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }

        .adm-back { background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px; color: rgba(255,255,255,0.4); margin-bottom: 20px; padding: 0; font-family: 'Inter', sans-serif; transition: color 0.15s; font-weight: 500; }
        .adm-back:hover { color: #6ee7b7; }

        .adm-warning {
          margin-top: 20px; padding: 12px 14px;
          background: rgba(16,185,129,0.06); border: 1px solid rgba(110,231,183,0.15); border-radius: 8px;
          font-size: 12px; color: rgba(255,255,255,0.4); font-family: 'Inter', sans-serif;
          display: flex; align-items: flex-start; gap: 8px; line-height: 1.6; font-weight: 400;
        }

        .adm-footer { text-align: center; margin-top: 20px; font-size: 13px; color: rgba(255,255,255,0.25); }
        .adm-footer a { color: rgba(255,255,255,0.4); text-decoration: none; font-weight: 500; }
        .adm-footer a:hover { color: #6ee7b7; }

        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (max-width: 480px) { .adm-card { padding: 28px 20px 24px; } }
        @media (max-width: 400px) { .adm-otp-row { gap: 6px; } .adm-otp-box { font-size: 18px; } }
      `}</style>

      <Navbar />
      <div className="adm-page">
        <div className="adm-circles">
          <div className="adm-circle adm-c1" />
          <div className="adm-circle adm-c2" />
          <div className="adm-circle adm-c3" />
        </div>
        <div className="adm-glow" />
        <div className="adm-container">
          <div className="adm-statusbar">
            <span>greenjobs.admin</span>
          </div>
          <div className="adm-card">
            <div className="adm-shield-row">
              <div className="adm-shield-icon"><ShieldCheck size={22} color="#6ee7b7" /></div>
              <div>
                <div className="adm-shield-title">Admin Access</div>
                <div className="adm-shield-sub">Restricted — authorised personnel only</div>
              </div>
            </div>
            {step === "email" ? (
              <>
                <h1 className="adm-heading"><span>Authenticate</span></h1>
                <p className="adm-sub">Sign in to the admin control panel</p>
                <form onSubmit={handleSendOtp}>
                  <label className="adm-label">Admin Email</label>
                  <div className="adm-input-wrap">
                    <Terminal size={15} className="adm-input-icon" />
                    <input type="email" className="adm-input" placeholder="admin@greenjobs.in" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
                  </div>
                  {import.meta.env.VITE_RECAPTCHA_SITE_KEY && (
                    <div className="adm-captcha"><ReCAPTCHA sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY} onChange={setCaptchaToken} theme="dark" /></div>
                  )}
                  <button className="adm-btn" disabled={loading || isCoolingDown}>
  {loading
    ? <><Loader size={14} className="spinner" /> Sending OTP...</>
    : isCoolingDown
    ? `Resend available in ${secondsLeft}s`
    : <><Lock size={14} /> Send OTP →</>}
</button>
                </form>
                <div className="adm-warning">
                  <ShieldCheck size={14} color="#6ee7b7" style={{ marginTop: 1, flexShrink: 0 }} />
                  This portal is for authorised administrators only. Unauthorised access attempts are logged.
                </div>
              </>
            ) : (
              <>
                <button className="adm-back" type="button" onClick={() => { setStep("email"); setOtp(["","","","","",""]); }}>
                  <ArrowLeft size={13} /> Back to email
                </button>
                <h1 className="adm-heading"><span>Verify OTP</span></h1>
                <p className="adm-sub">Code sent to <strong>{email}</strong></p>
                <form onSubmit={handleVerifyOtp}>
                  <div className="adm-otp-row">
                    {otp.map((digit, i) => (
                      <input key={i} id={`otp-adm-${i}`} className="adm-otp-box"
                        type="text" inputMode="numeric" maxLength={1} value={digit} placeholder="·"
                        onChange={e => handleOtpChange(e.target.value, i)}
                        onKeyDown={e => handleOtpKey(e, i)}
                        onPaste={i === 0 ? handleOtpPaste : undefined}
                        disabled={loading} autoFocus={i === 0} />
                    ))}
                  </div>
                  <p className="adm-otp-hint">
  Didn't receive it?{" "}
  <button type="button" onClick={handleSendOtp}
    disabled={isCoolingDown || resending}
    style={{ color: isCoolingDown ? "rgba(255,255,255,0.3)" : "#6ee7b7", cursor: isCoolingDown ? "default" : "pointer", display: "inline-flex", alignItems: "center", gap: 3 }}>
    {resending
      ? <Loader size={11} style={{ animation: "spin 1s linear infinite" }} />
      : <RefreshCw size={11} />}
    {isCoolingDown ? `Resend in ${secondsLeft}s` : "Resend OTP"}
  </button>
</p>
                  <button className="adm-btn" disabled={loading || otpString.length !== 6}>
                    {loading ? <><Loader size={14} className="spinner" /> Verifying...</> : <><ShieldCheck size={14} /> Grant Access →</>}
                  </button>
                </form>
              </>
            )}
            <div className="adm-footer">
              <Link to="/">← Back to site</Link>{" · "}<Link to="/login">User login</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminLogin;