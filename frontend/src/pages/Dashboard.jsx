import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    if (!user || !user.role) return;

    const routes = {
      jobseeker: '/jobseeker/dashboard',
      recruiter: '/recruiter/dashboard',
      business: '/business/dashboard',
      admin: '/admin/dashboard'
    };

    const targetRoute = routes[user.role];

    if (targetRoute) {
      navigate(targetRoute, { replace: true });
    } else {
      navigate('/login', { replace: true });
    }

  }, [user, isAuthenticated, navigate]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=DM+Sans:wght@400;500&display=swap');

        .redirect-wrapper {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background-color: #edf3f4;
          font-family: 'DM Sans', sans-serif;
          gap: 16px;
        }

        .redirect-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #c8ddd0;
          border-top-color: #108a42;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .redirect-text {
          font-size: 16px;
          color: #415b41;
          font-weight: 500;
          letter-spacing: 0.3px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="redirect-wrapper">
        <div className="redirect-spinner" />
        <span className="redirect-text">Redirecting you…</span>
      </div>
    </>
  );
};

export default Dashboard;