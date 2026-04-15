import React, { useState } from 'react';
import { Mail, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { sendOTP } from '../../api/authApi';

const EmailLogin = ({ onOTPSent }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email');
      return;
    }

    setLoading(true);

    try {
      const response = await sendOTP(email);
      if (response.success) {
        toast.success('OTP sent to your email!');
        onOTPSent(email);
      } else {
        toast.error(response.message || 'Failed to send OTP');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '400px',
      margin: '0 auto',
      padding: '40px 20px',
      textAlign: 'center'
    }}>
      <h2 style={{
        marginBottom: '10px',
        color: '#1f2937',
        fontSize: '28px',
        fontWeight: '700'
      }}>
        Welcome Back
      </h2>
      <p style={{
        marginBottom: '30px',
        color: '#6b7280',
        fontSize: '16px'
      }}>
        Enter your email to receive a verification code
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px', position: 'relative' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            color: '#374151',
            fontSize: '14px',
            fontWeight: '500',
            textAlign: 'left'
          }}>
            Email Address
          </label>
          <div style={{ position: 'relative' }}>
            <Mail size={20} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af'
            }} />
            <input
              type="email"
              className="input"
              style={{ paddingLeft: '45px' }}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader
                        size={20}
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                      Sending OTP...
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </button>

      </form>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default EmailLogin;