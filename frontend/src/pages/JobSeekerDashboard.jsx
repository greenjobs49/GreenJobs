import React, { useState } from 'react';
import Navbar from '../components/common/Navbar';
import MyApplications from './MyApplications';
import {
  Briefcase,
  FileText,
  User,
  TrendingUp,
  Upload,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Search,
  MapPin,
  Phone,
  Mail,
  GraduationCap,
  Zap,
  Award,
  Clock,
  Linkedin,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const JobSeekerDashboard = () => {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [showDetails, setShowDetails] = useState(false);

  const profile           = user?.jobSeekerProfile || {};
  const resumeUrl         = profile.resume;
  const profileProgress   = user?.profileProgress  || 0;
  const isProfileComplete = user?.profileCompleted;

  const firstName = profile.firstName || user?.name?.split(' ')[0] || 'User';
  const fullName  =
    profile.firstName && profile.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : profile.fullName || user?.name || '—';

const stats = [
  { icon: Briefcase,   label: 'Profile Completion',  value: `${profileProgress}%`, color: '#3b82f6' },
  { icon: User,        label: 'Profile Status',       value: isProfileComplete ? 'Complete' : 'Incomplete', color: '#10b981' },
];

  const detailSections = [
    {
      heading: 'Personal Info',
      icon: User,
      color: '#3b82f6',
      fields: [
        { label: 'First Name',  value: profile.firstName },
        { label: 'Last Name',   value: profile.lastName  },
        { label: 'Full Name',   value: fullName          },
        { label: 'Email',       value: user?.email,  icon: Mail  },
        { label: 'Mobile',      value: profile.mobile || user?.mobile, icon: Phone },
        { label: 'City',        value: profile.city,    icon: MapPin },
        { label: 'Pincode',     value: profile.pincode, icon: MapPin },
      ],
    },
    {
      heading: 'Professional',
      icon: Briefcase,
      color: '#8b5cf6',
      fields: [
        { label: 'Education',        value: profile.education,    icon: GraduationCap },
        { label: 'Experience (yrs)', value: profile.experience,   icon: Clock         },
        { label: 'Preferred Role',   value: profile.preferredRole                     },
        { label: 'Expected Salary',  value: profile.expectedSalary                    },
        { label: 'LinkedIn',         value: profile.linkedin,     icon: Linkedin, isLink: true },
        { label: 'Portfolio',        value: profile.portfolio,    isLink: true        },
      ],
    },
    {
      heading: 'About',
      icon: FileText,
      color: '#10b981',
      fullWidth: true,
      fields: [
        { label: 'About Me',          value: profile.about,           multiline: true },
        { label: 'Accomplishments',   value: profile.accomplishments, multiline: true },
      ],
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #f8fafc;
          color: #0f172a;
        }

        /* ── Layout ─────────────────────────────────────────── */
        .db-wrapper   { background:#f8fafc; min-height:100vh; }
        .db-container { max-width:1280px; margin:0 auto; padding:24px; }

        /* ── Page header ─────────────────────────────────────── */
        .page-header   { margin-bottom:32px; }
        .page-title    { font-size:28px; font-weight:700; color:#0f172a; margin-bottom:4px; }
        .page-subtitle { font-size:15px; color:#64748b; }

        /* ── Alert banner ────────────────────────────────────── */
        .alert-banner {
          background:white; border:1px solid #e2e8f0; border-radius:8px;
          padding:16px; margin-bottom:16px;
          display:flex; align-items:flex-start; gap:12px;
        }
        .alert-banner.warning { background:#fffbeb; border-color:#fde047; }
        .alert-banner.success { background:#f0fdf4; border-color:#86efac; }
        .alert-content { flex:1; }
        .alert-title   { font-size:14px; font-weight:600; color:#0f172a; margin-bottom:2px; }
        .alert-desc    { font-size:13px; color:#64748b; }

        /* ── Stats grid ──────────────────────────────────────── */
        .stats-grid {
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
          gap:20px; margin-bottom:32px;
        }
        .stat-card {
          background:white; border:1px solid #e2e8f0; border-radius:8px;
          padding:20px; transition:all 0.2s;
        }
        .stat-card:hover { border-color:#cbd5e1; box-shadow:0 1px 3px rgba(0,0,0,.05); }
        .stat-icon {
          width:40px; height:40px; border-radius:8px;
          display:flex; align-items:center; justify-content:center;
          background:#f1f5f9; margin-bottom:12px;
        }
        .stat-value { font-size:32px; font-weight:700; color:#0f172a; line-height:1; margin-bottom:4px; }
        .stat-label { font-size:13px; color:#64748b; font-weight:500; }

        /* ── Section card ────────────────────────────────────── */
        .section-card {
          background:white; border:1px solid #e2e8f0; border-radius:8px;
          padding:24px; margin-bottom:24px;
        }
        .section-header {
          display:flex; align-items:center; justify-content:space-between;
          margin-bottom:20px;
        }
        .section-title { font-size:18px; font-weight:700; color:#0f172a; }

        /* ── Buttons ─────────────────────────────────────────── */
        .btn {
          display:inline-flex; align-items:center; justify-content:center;
          gap:8px; padding:10px 16px; border-radius:6px;
          font-size:14px; font-weight:600; cursor:pointer;
          transition:all 0.2s; border:none; outline:none;
        }
        .btn-primary   { background:#3b82f6; color:white; }
        .btn-primary:hover { background:#2563eb; }
        .btn-secondary { background:white; color:#475569; border:1px solid #e2e8f0; }
        .btn-secondary:hover { background:#f8fafc; border-color:#cbd5e1; }
        .btn-success   { background:#10b981; color:white; }
        .btn-success:hover { background:#059669; }

        .action-group {
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(170px,1fr));
          gap:12px;
        }

        /* ── Resume status ───────────────────────────────────── */
        .resume-status {
          display:flex; align-items:center; gap:8px;
          padding:12px; border-radius:6px;
          font-size:14px; margin-top:16px; border:1px solid;
        }
        .resume-status.uploaded    { background:#f0fdf4; border-color:#86efac; color:#065f46; }
        .resume-status.not-uploaded{ background:#fef2f2; border-color:#fecaca; color:#991b1b; }

        /* ── Profile details panel ───────────────────────────── */
        .details-panel { margin-top:24px; }

        .detail-section {
          margin-bottom:24px;
          border:1px solid #e2e8f0;
          border-radius:8px;
          overflow:hidden;
        }

        .detail-section-header {
          display:flex; align-items:center; gap:10px;
          padding:12px 16px;
          background:#f8fafc;
          border-bottom:1px solid #e2e8f0;
        }
        .detail-section-icon {
          width:30px; height:30px; border-radius:6px;
          display:flex; align-items:center; justify-content:center;
        }
        .detail-section-heading {
          font-size:14px; font-weight:700; color:#0f172a;
        }

        .detail-fields {
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
          gap:0;
          padding:4px 0;
        }

        .detail-field {
          padding:12px 16px;
          border-bottom:1px solid #f1f5f9;
        }
        .detail-field:last-child { border-bottom:none; }
        .detail-field.full-width { grid-column: 1 / -1; }

        .field-label {
          font-size:11px; font-weight:600; color:#94a3b8;
          text-transform:uppercase; letter-spacing:0.05em;
          margin-bottom:4px;
          display:flex; align-items:center; gap:4px;
        }
        .field-value {
          font-size:14px; color:#0f172a; font-weight:500;
          word-break:break-word;
        }
        .field-value.multiline {
          white-space:pre-wrap; line-height:1.6;
          font-weight:400; color:#334155;
        }
        .field-value a {
          color:#3b82f6; text-decoration:none;
        }
        .field-value a:hover { text-decoration:underline; }
        .field-empty { color:#cbd5e1; font-style:italic; font-size:13px; }

        /* ── Skills ──────────────────────────────────────────── */
        .skills-section {
          padding:16px;
          border-top:1px solid #e2e8f0;
        }
        .skills-heading {
          font-size:11px; font-weight:600; color:#94a3b8;
          text-transform:uppercase; letter-spacing:0.05em;
          margin-bottom:10px;
          display:flex; align-items:center; gap:6px;
        }
        .skills-list { display:flex; flex-wrap:wrap; gap:8px; }
        .skill-tag {
          padding:5px 12px; background:#eff6ff; color:#1e40af;
          border-radius:20px; font-size:13px; font-weight:500;
        }

        /* ── Progress bar inside profile header ─────────────── */
        .progress-wrapper { margin-top:4px; }
        .progress-bar-bg {
          height:6px; background:#e2e8f0; border-radius:3px; overflow:hidden;
        }
        .progress-bar-fill {
          height:100%; border-radius:3px;
          background:linear-gradient(90deg,#3b82f6,#8b5cf6);
          transition:width 0.4s ease;
        }

        @media (max-width:768px) {
          .db-container { padding:16px; }
          .page-title   { font-size:22px; }
          .stats-grid   { grid-template-columns:1fr 1fr; }
          .action-group { grid-template-columns:1fr 1fr; }
        }

        @media (max-width:480px) {
          .stats-grid   { grid-template-columns:1fr; }
          .action-group { grid-template-columns:1fr; }
        }
      `}</style>

      <Navbar />

      <div className="db-wrapper">
        <div className="db-container">

          {/* ── Page Header ───────────────────────────────────── */}
          <div className="page-header">
            <h1 className="page-title">Welcome back, {firstName} 👋</h1>
            <p className="page-subtitle">
              Track your applications, manage your profile, and discover new opportunities
            </p>
          </div>

          {/* ── Profile incomplete banner ──────────────────────── */}
          {!isProfileComplete && (
            <div className="alert-banner warning">
              <AlertCircle size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
              <div className="alert-content">
                <div className="alert-title">Complete Your Profile ({profileProgress}%)</div>
                <div className="alert-desc">
                  Finish setting up your profile to get noticed by recruiters
                </div>
                <div className="progress-wrapper" style={{ marginTop: 8 }}>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${profileProgress}%` }} />
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/complete-profile')}
                className="btn btn-primary"
                style={{ padding: '6px 14px', fontSize: '13px', flexShrink: 0 }}
              >
                Complete Now
              </button>
            </div>
          )}

          {isProfileComplete && (
            <div className="alert-banner success">
              <CheckCircle size={20} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
              <div className="alert-content">
                <div className="alert-title">Profile Complete!</div>
                <div className="alert-desc">
                  Your profile is visible to recruiters. Keep it updated for best results.
                </div>
              </div>
            </div>
          )}

          {/* ── Stats ─────────────────────────────────────────── */}
          <div className="stats-grid">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="stat-card">
                  <div className="stat-icon">
                    <Icon size={20} color={stat.color} />
                  </div>
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              );
            })}
          </div>

          {/* ── Quick Actions + Details ────────────────────────── */}
          <div className="section-card">
            <div className="section-header">
              <h2 className="section-title">Quick Actions</h2>
            </div>

            <div className="action-group">
              <button className="btn btn-primary" onClick={() => navigate('/complete-profile')}>
                <User size={16} />
                {isProfileComplete ? 'Update Profile' : 'Complete Profile'}
              </button>

              <button className="btn btn-success" onClick={() => navigate('/jobs')}>
                <Search size={16} />
                Browse Jobs
              </button>

              {resumeUrl ? (
                <button
                  className="btn btn-secondary"
                  onClick={() => window.open(resumeUrl, '_blank')}
                >
                  <FileText size={16} />
                  View Resume
                </button>
              ) : (
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate('/complete-profile')}
                >
                  <Upload size={16} />
                  Upload Resume
                </button>
              )}
            </div>

            {/* Resume status pill */}
            <div className={`resume-status ${resumeUrl ? 'uploaded' : 'not-uploaded'}`}>
              {resumeUrl ? (
                <><CheckCircle size={16} /><span><strong>Resume:</strong> Uploaded ✓</span></>
              ) : (
                <><AlertCircle size={16} /><span><strong>Resume:</strong> Not uploaded yet</span></>
              )}
            </div>

            {/* ── Expanded Details Panel ──────────────────────── */}
            {showDetails && (
              <div className="details-panel">

                {detailSections.map((section) => {
                  const SectionIcon = section.icon;
                  // Filter fields that have a value
                  const visibleFields = section.fields.filter((f) => f.value);

                  // Always render the section (show "—" state for About)
                  return (
                    <div key={section.heading} className="detail-section">
                      <div className="detail-section-header">
                        <div
                          className="detail-section-icon"
                          style={{ background: `${section.color}18` }}
                        >
                          <SectionIcon size={16} color={section.color} />
                        </div>
                        <span className="detail-section-heading">{section.heading}</span>
                      </div>

                      <div className="detail-fields">
                        {section.fields.map((field) => {
                          const FieldIcon = field.icon;
                          return (
                            <div
                              key={field.label}
                              className={`detail-field ${section.fullWidth || field.multiline ? 'full-width' : ''}`}
                            >
                              <div className="field-label">
                                {FieldIcon && <FieldIcon size={11} />}
                                {field.label}
                              </div>
                              <div className={`field-value ${field.multiline ? 'multiline' : ''}`}>
                                {field.value ? (
                                  field.isLink ? (
                                    <a href={field.value} target="_blank" rel="noreferrer">
                                      {field.value}
                                    </a>
                                  ) : (
                                    field.value
                                  )
                                ) : (
                                  <span className="field-empty">Not provided</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* ── Skills block ──────────────────────────────── */}
                <div className="detail-section">
                  <div className="detail-section-header">
                    <div className="detail-section-icon" style={{ background: '#f59e0b18' }}>
                      <Zap size={16} color="#f59e0b" />
                    </div>
                    <span className="detail-section-heading">Skills</span>
                  </div>
                  <div className="skills-section">
                    {profile.skills?.length > 0 ? (
                      <div className="skills-list">
                        {profile.skills.map((skill, i) => (
                          <span key={i} className="skill-tag">{skill}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="field-empty">No skills added yet</span>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
          <MyApplications />
        </div>
      </div>
    </>
  );
};
export default JobSeekerDashboard;