import React, { useState } from "react";
import { Shield, Loader, ArrowLeft, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { verifyOTP, sendOTP } from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useOtpCooldown } from "../../hooks/useOtpCooldown";

const VerifyOtp = ({ email, onBack }) => {
  const [otp,      setOtp]      = useState("");
  const [loading,  setLoading]  = useState(false);
  const [resending, setResending] = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();
  const { secondsLeft, isCoolingDown, canRequest, recordRequest, startCooldown } = useOtpCooldown(email);

  const redirectMap = {
    jobseeker: "/jobseeker/dashboard",
    recruiter: "/recruiter/dashboard",
    business:  "/business/dashboard",
    admin:     "/admin",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { toast.error("Please enter a valid 6-digit OTP"); return; }
    setLoading(true);
    try {
      const response = await verifyOTP(email, otp, null, null, null, null, "login");
      if (response.success) {
        toast.success("Login successful!");
        login(response.user, response.token);
        navigate(redirectMap[response.user.role] || "/dashboard");
      } else {
        toast.error(response.message || "Verification failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (isCoolingDown) return;
    if (!canRequest()) { toast.error("Too many OTP requests. Please wait 10 minutes."); return; }
    setResending(true);
    try {
      const res = await sendOTP(email, "login");
      if (res.success) {
        toast.success("New OTP sent!");
        recordRequest();
        startCooldown();
        setOtp("");
      } else {
        toast.error(res.message || "Failed to resend OTP");
      }
    } catch (err) {
      // ✅ Handle 429 on resend too
      const status  = err.response?.status;
      const message = err.response?.data?.message;
      if (status === 429) {
        toast.error(message || "Too many requests. Please wait before trying again.");
        startCooldown();
      } else {
        toast.error(message || "Failed to resend OTP");
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "40px 20px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", display: "flex", alignItems: "center", marginBottom: "20px" }}>
        <ArrowLeft size={20} style={{ marginRight: "8px" }} /> Back
      </button>
      <h2 style={{ marginBottom: "10px", color: "#1f2937", fontSize: "28px", fontWeight: "700", textAlign: "center" }}>
        Verify Your Email
      </h2>
      <p style={{ marginBottom: "30px", color: "#6b7280", fontSize: "16px", textAlign: "center" }}>
        We've sent a 6-digit code to <strong>{email}</strong>
      </p>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px", color: "#374151", fontWeight: "500" }}>Enter OTP</label>
          <div style={{ position: "relative" }}>
            <Shield size={20} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
            <input type="text" className="input" placeholder="000000" value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6} disabled={loading}
              style={{ paddingLeft: "45px", letterSpacing: "5px", fontSize: "18px", textAlign: "center" }} />
          </div>
        </div>

        <div style={{ textAlign: "center", marginBottom: "20px", fontSize: "13px", color: "#9ca3af" }}>
          Didn't receive it?{" "}
          <button type="button" onClick={handleResend} disabled={isCoolingDown || resending}
            style={{ background: "none", border: "none", cursor: isCoolingDown ? "default" : "pointer",
              color: isCoolingDown ? "#9ca3af" : "#16a34a", fontWeight: "600", fontSize: "13px",
              padding: 0, display: "inline-flex", alignItems: "center", gap: 4 }}>
            {resending
              ? <Loader size={12} style={{ animation: "spin 1s linear infinite" }} />
              : <RefreshCw size={12} />}
            {isCoolingDown ? `Resend in ${secondsLeft}s` : "Resend OTP"}
          </button>
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "12px" }} disabled={loading}>
          {loading
            ? <><Loader size={20} style={{ marginRight: "8px", animation: "spin 1s linear infinite" }} /> Verifying...</>
            : "Verify & Continue"}
        </button>
      </form>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default VerifyOtp;