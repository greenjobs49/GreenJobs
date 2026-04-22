import React, { useState } from "react";
import { Mail, Loader } from "lucide-react";
import toast from "react-hot-toast";
import { sendOTP } from "../../api/authApi";
import { useOtpCooldown } from "../../hooks/useOtpCooldown";

const EmailSignup = ({ onOTPSent, role = "jobseeker" }) => {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const { isCoolingDown, secondsLeft, canRequest, recordRequest, startCooldown } = useOtpCooldown(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email)                                        { toast.error("Please enter your email"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))   { toast.error("Please enter a valid email"); return; }
    if (isCoolingDown)                                 { toast.error(`Please wait ${secondsLeft}s before requesting another OTP`); return; }
    if (!canRequest())                                 { toast.error("Too many OTP requests. Please wait 10 minutes."); return; }

    setLoading(true);
    try {
      const response = await sendOTP(email, "signup");
      if (response.success) {
        toast.success("OTP sent to your email!");
        recordRequest();
        startCooldown();
        onOTPSent(email, role); // ✅ only advance on success
      } else {
        toast.error(response.message || "Failed to send OTP");
      }
    } catch (error) {
      // ✅ Handle 429 — lock the button, don't advance to verify step
      const status  = error.response?.status;
      const message = error.response?.data?.message;
      if (status === 429) {
        toast.error(message || "Too many requests. Please wait before trying again.");
        startCooldown();
      } else {
        toast.error(message || "Failed to send OTP");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="email-signup">
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", color: "#374151", fontWeight: "500" }}>
            Email Address
          </label>
          <div style={{ position: "relative" }}>
            <Mail size={20} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
            <input type="email" className="input" style={{ paddingLeft: "45px" }} placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
          </div>
          <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px" }}>
            We'll send you a verification code to verify your email
          </p>
        </div>
        <button type="submit" className="btn btn-primary"
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          disabled={loading || isCoolingDown}>
          {loading
            ? <><Loader size={20} style={{ animation: "spin 1s linear infinite" }} /> Sending OTP...</>
            : isCoolingDown
            ? `Resend available in ${secondsLeft}s`
            : "Continue with Email"}
        </button>
      </form>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default EmailSignup;