import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Briefcase, Mail, Shield, Loader, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { sendOTP, verifyOTP } from "../api/authApi";
import GoogleSignIn from "../components/Auth/GoogleSignIn";
import ReCAPTCHA from "react-google-recaptcha";
import Navbar from "../components/common/Navbar";
const Login = () => {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState(null);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    if (!captchaToken) {
      toast.error("Please verify that you are not a robot");
      return;
    }

    setLoading(true);

    try {
      const res = await sendOTP(email, "login", captchaToken);

      if (res.success) {
        toast.success("OTP sent to your email");
        setStep("verify");
      } else {
        toast.error(res.message || "Failed to send OTP");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error("Enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);

    try {
      const res = await verifyOTP(email, otp, null, null, null, "login");

      if (res.success) {
        toast.success("Login successful");
        login(res.user, res.token);
        navigate("/dashboard");
      } else {
        toast.error(res.message || "Invalid OTP");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .auth-wrapper {
          min-height: calc(100vh-140px);
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          padding: 24px;
        }

        .auth-container {
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          max-width: 440px;
          width: 100%;
          padding: 40px;
        }

        .auth-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .auth-icon {
          width: 56px;
          height: 56px;
          background: #3b82f6;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }

        .auth-title {
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 8px;
        }

        .auth-subtitle {
          font-size: 14px;
          color: #64748b;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 8px;
        }

        .input-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .form-input {
          width: 100%;
          padding: 12px 16px 12px 44px;
          font-size: 14px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          color: #0f172a;
          outline: none;
          transition: all 0.2s;
        }

        .form-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          background: white;
        }

        .form-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .form-input.otp-input {
          letter-spacing: 8px;
          font-size: 18px;
          font-weight: 600;
          text-align: center;
          padding-left: 16px;
        }

        .recaptcha-wrapper {
          margin-bottom: 20px;
          display: flex;
          justify-content: center;
        }

        .btn {
          width: 100%;
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-back {
          background: none;
          border: none;
          padding: 8px 12px;
          margin-bottom: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          transition: all 0.2s;
        }

        .btn-back:hover {
          color: #0f172a;
        }

        .divider {
          margin: 24px 0;
          text-align: center;
          position: relative;
        }

        .divider::before {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          height: 1px;
          background: #e2e8f0;
        }

        .divider-text {
          display: inline-block;
          padding: 0 16px;
          background: white;
          font-size: 13px;
          color: #64748b;
          position: relative;
          z-index: 1;
        }

        .auth-footer {
          text-align: center;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
        }

        .auth-footer-text {
          font-size: 14px;
          color: #64748b;
        }

        .auth-link {
          color: #3b82f6;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s;
        }

        .auth-link:hover {
          color: #2563eb;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 480px) {
          .auth-container {
            padding: 32px 24px;
          }

          .auth-title {
            font-size: 22px;
          }
        }
      `}</style>
      <Navbar/>
      <div className="auth-wrapper">
        <div className="auth-container">
          {/* Header */}
          <div className="auth-header">
            <div className="auth-icon">
              <Briefcase size={28} color="white" />
            </div>
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">
              Login using OTP sent to your email
            </p>
          </div>

          {/* Step 1: Email */}
          {step === "email" && (
            <form onSubmit={handleSendOtp}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-wrapper">
                  <Mail size={20} className="input-icon" />
                  <input
                    type="email"
                    className="form-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="recaptcha-wrapper">
                <ReCAPTCHA
                  sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                  onChange={(token) => setCaptchaToken(token)}
                />
              </div>

              <button className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <Loader size={18} className="spinner" />
                    Sending...
                  </>
                ) : (
                  "Send OTP"
                )}
              </button>

              <div className="divider">
                <span className="divider-text">or</span>
              </div>

              <GoogleSignIn />
            </form>
          )}

          {/* Step 2: Verify OTP */}
          {step === "verify" && (
            <>
              <button onClick={() => setStep("email")} className="btn-back">
                <ArrowLeft size={18} />
                Back
              </button>

              <form onSubmit={handleVerifyOtp}>
                <div className="form-group">
                  <label className="form-label">Enter OTP</label>
                  <div className="input-wrapper">
                    <Shield size={20} className="input-icon" />
                    <input
                      className="form-input otp-input"
                      placeholder="000000"
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      disabled={loading}
                      maxLength={6}
                    />
                  </div>
                </div>

                <button className="btn btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader size={18} className="spinner" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Login"
                  )}
                </button>
              </form>
            </>
          )}

          {/* Footer */}
          <div className="auth-footer">
            <p className="auth-footer-text">
              Don't have an account?{" "}
              <Link to="/signup" className="auth-link">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;