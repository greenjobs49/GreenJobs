import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import EmailSignup from "../components/Auth/EmailSignup";
import SignupVerifyOtp from "../components/Auth/SignupVerifyOtp";
import { Briefcase } from "lucide-react";
import GoogleSignIn from "../components/Auth/GoogleSignIn";
import Navbar from "../components/common/Navbar";
const Signup = () => {
  const [step, setStep] = useState("signup");
  const [email, setEmail] = useState("");
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    return (
      <Navigate
        to={user?.profileCompleted ? "/dashboard" : "/complete-profile"}
        replace
      />
    );
  }

  const handleOTPSent = (userEmail) => {
    setEmail(userEmail);
    setStep("verify");
  };

  const handleBack = () => {
    setStep("signup");
    setEmail("");
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
          min-height: calc(100vh - 140px);
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
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
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
          line-height: 1.5;
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

        @media (max-width: 480px) {
          .auth-container {
            padding: 32px 24px;
          }

          .auth-title {
            font-size: 22px;
          }
        }
      `}</style>
      <Navbar />
      <div className="auth-wrapper">
        <div className="auth-container">
          {/* Header */}
          <div className="auth-header">
            <div className="auth-icon">
              <Briefcase size={28} color="white" />
            </div>
            <h1 className="auth-title">
              {step === "signup" ? "Create Account" : "Verify Your Email"}
            </h1>
            <p className="auth-subtitle">
              {step === "signup"
                ? "Join our platform and start your journey"
                : `Enter the verification code sent to ${email}`}
            </p>
          </div>

          {/* Body */}
          {step === "signup" ? (
            <>
              {/* Email Signup Form */}
              <EmailSignup onOTPSent={handleOTPSent} />

              {/* Divider */}
              <div className="divider">
                <span className="divider-text">or</span>
              </div>

              {/* Google Sign-In */}
              <GoogleSignIn />

              {/* Footer */}
              <div className="auth-footer">
                <p className="auth-footer-text">
                  Already have an account?{" "}
                  <Link to="/login" className="auth-link">
                    Sign In
                  </Link>
                </p>
              </div>
            </>
          ) : (
            <SignupVerifyOtp email={email} onBack={handleBack} />
          )}
        </div>
      </div>
    </>
  );
};

export default Signup;