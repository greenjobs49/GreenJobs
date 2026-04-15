import React, { useState } from "react";
import { Mail, Loader } from "lucide-react";
import toast from "react-hot-toast";
import { sendOTP } from "../../api/authApi";

const EmailSignup = ({ onOTPSent, role = "jobseeker" }) => {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email");
      return;
    }

    setLoading(true);

    try {
      const response = await sendOTP(email, "signup");

      if (response.success) {
        toast.success("OTP sent to your email!");
        onOTPSent(email, role); // forward both email and role
      } else {
        toast.error(response.message || "Failed to send OTP");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
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
            <input
              type="email"
              className="input"
              style={{ paddingLeft: "45px" }}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px" }}>
            We'll send you a verification code to verify your email
          </p>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          disabled={loading}
        >
          {loading ? (
            <><Loader size={20} style={{ animation: "spin 1s linear infinite" }} />Sending OTP...</>
          ) : (
            "Continue with Email"
          )}
        </button>
      </form>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default EmailSignup;