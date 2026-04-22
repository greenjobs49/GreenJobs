import React, { useState } from "react";
import { Shield, Loader, User, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { verifyOTP, sendOTP } from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useOtpCooldown } from "../../hooks/useOtpCooldown";

const SignupVerifyOtp = ({ email, onBack, role = "jobseeker" }) => {
  const [otp,       setOtp]       = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [mobile,    setMobile]    = useState("");
  const [loading,   setLoading]   = useState(false);
  const [resending, setResending] = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();
  const { secondsLeft, isCoolingDown, canRequest, recordRequest, startCooldown } = useOtpCooldown(email);

  const redirectMap = {
    jobseeker: "/jobseeker",
    recruiter: "/recruiter",
    business:  "/business",
    admin:     "/admin",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6)  { toast.error("Enter a valid 6-digit OTP"); return; }
    if (!firstName.trim()) { toast.error("First name is required"); return; }
    if (!lastName.trim())  { toast.error("Last name is required"); return; }

    setLoading(true);
    try {
      const res = await verifyOTP(
        email, otp, role, mobile,
        firstName.trim(), lastName.trim(), "signup"
      );
      if (res.success) {
        toast.success("Account created successfully!");
        login({
          ...res.user,
          name:      `${firstName.trim()} ${lastName.trim()}`,
          firstName: firstName.trim(),
          lastName:  lastName.trim(),
        }, res.token);
        navigate(redirectMap[res.user.role] || "/");
      } else {
        toast.error(res.message || "Signup failed");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (isCoolingDown) return;
    if (!canRequest()) { toast.error("Too many OTP requests. Please wait 10 minutes."); return; }
    setResending(true);
    try {
      const res = await sendOTP(email, "signup");
      if (res.success) {
        toast.success("New OTP sent!");
        recordRequest();
        startCooldown();
        setOtp("");
      } else {
        toast.error(res.message || "Failed to resend");
      }
    } catch (err) {
      // ✅ Handle 429 on resend
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
    <>
      <form onSubmit={handleSubmit}>
        <label>OTP</label>
        <div style={{ position: "relative", marginBottom: 8 }}>
          <Shield size={18} style={{ position: "absolute", left: 10, top: 13, color: "#9ca3af" }} />
          <input className="input" style={{ paddingLeft: 40 }} placeholder="000000"
            value={otp} maxLength={6}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} />
        </div>

        <div style={{ textAlign: "center", marginBottom: 20, fontSize: 12, color: "#9ca3af" }}>
          Didn't receive it?{" "}
          <button type="button" onClick={handleResend} disabled={isCoolingDown || resending}
            style={{ background: "none", border: "none", padding: 0, fontSize: 12, fontWeight: 600,
              cursor: isCoolingDown ? "default" : "pointer",
              color: isCoolingDown ? "#9ca3af" : "#16a34a",
              display: "inline-flex", alignItems: "center", gap: 3 }}>
            {resending
              ? <Loader size={11} style={{ animation: "spin 1s linear infinite" }} />
              : <RefreshCw size={11} />}
            {isCoolingDown ? `Resend in ${secondsLeft}s` : "Resend OTP"}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label>First Name <span style={{ color: "#ef4444" }}>*</span></label>
            <div style={{ position: "relative", marginBottom: 16 }}>
              <User size={16} style={{ position: "absolute", left: 10, top: 13, color: "#9ca3af" }} />
              <input className="input" style={{ paddingLeft: 36 }} placeholder="John"
                value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
          </div>
          <div>
            <label>Last Name <span style={{ color: "#ef4444" }}>*</span></label>
            <div style={{ position: "relative", marginBottom: 16 }}>
              <User size={16} style={{ position: "absolute", left: 10, top: 13, color: "#9ca3af" }} />
              <input className="input" style={{ paddingLeft: 36 }} placeholder="Doe"
                value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
        </div>

        <label>Mobile (Optional)</label>
        <input className="input" placeholder="+91 9876543210"
          value={mobile} onChange={(e) => setMobile(e.target.value)}
          style={{ marginBottom: 16 }} />

        <button className="btn btn-primary" disabled={loading} style={{ width: "100%" }}>
          {loading
            ? <Loader size={18} style={{ animation: "spin 1s linear infinite" }} />
            : "Create Account"}
        </button>
      </form>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
};

export default SignupVerifyOtp;