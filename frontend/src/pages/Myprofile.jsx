import React from "react";
import Navbar from "../components/common/Navbar";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  User, Mail, Phone, MapPin, Briefcase, GraduationCap,
  Globe, Linkedin, FileText, Building2, Clock, CheckCircle,
  Edit, ExternalLink, Shield, Tag, Image, DollarSign,
  Award, Star, BarChart2
} from "lucide-react";

export default function MyProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const role = user?.role;
  const profile =
    role === "jobseeker" ? (user?.jobSeekerProfile || {}) :
    role === "recruiter" ? (user?.recruiterProfile || {}) :
    role === "business"  ? (user?.businessProfile  || {}) :
    {};

  // ── Helpers ─────────────────────────────────────────────────────────────
  const Field = ({ label, value, icon: Icon, isLink, multiline }) => (
    <div className="mp-field">
      <div className="mp-field-label">
        {Icon && <Icon size={11} />}
        {label}
      </div>
      <div className={`mp-field-value ${multiline ? "multiline" : ""}`}>
        {value ? (
          isLink ? (
            <a href={value.startsWith("http") ? value : `https://${value}`} target="_blank" rel="noreferrer">
              {value} <ExternalLink size={11} style={{ display: "inline", marginLeft: 2 }} />
            </a>
          ) : value
        ) : (
          <span className="mp-empty">Not provided</span>
        )}
      </div>
    </div>
  );

  const Section = ({ title, icon: Icon, accent, children }) => (
    <div className="mp-section">
      <div className="mp-section-header">
        <div className="mp-section-icon" style={{ background: `${accent}18` }}>
          <Icon size={16} color={accent} />
        </div>
        <span className="mp-section-title">{title}</span>
        <div className="mp-section-line" style={{ background: `${accent}20` }} />
      </div>
      <div className="mp-section-body">{children}</div>
    </div>
  );

  // ── Role config — matches homepage tag colors ─────────────────────────
  const roleConfig = {
    admin:     { label: "Admin",      bg: "#f3e8ff", color: "#7c3aed", border: "#ddd6fe", dot: "#8b5cf6" },
    recruiter: { label: "Recruiter",  bg: "#fef3c7", color: "#92400e", border: "#fde68a", dot: "#f59e0b" },
    business:  { label: "Business",   bg: "#d1fae5", color: "#065f46", border: "#6ee7b7", dot: "#10b981" },
    jobseeker: { label: "Job Seeker", bg: "#dbeafe", color: "#1e40af", border: "#bfdbfe", dot: "#3b82f6" },
  };
  const rc = roleConfig[role] || roleConfig.jobseeker;

  const editRoute = role === "admin" ? null : "/complete-profile";

  // Completion score
  const completionPct = user?.profileProgress || 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp  { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse   { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }

        .mp-page {
          background: #f8fafc;
          min-height: 100vh;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #0f172a;
        }

        .mp-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 36px 28px 72px;
        }

        /* ── Hero card ── */
        .mp-hero {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 32px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
          position: relative;
          overflow: hidden;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          animation: fadeUp 0.4s ease;
        }

        /* Green top accent stripe — matches hero gradient feel */
        .mp-hero::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 4px;
          background: linear-gradient(90deg, #10b981 0%, #059669 50%, #0f172a 100%);
        }

        /* Avatar — dark navy like homepage company logo boxes */
        .mp-avatar {
          width: 76px;
          height: 76px;
          border-radius: 18px;
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 30px;
          font-weight: 800;
          letter-spacing: -1px;
          flex-shrink: 0;
          box-shadow: 0 4px 16px rgba(15,23,42,0.22);
        }

        .mp-hero-info {
          flex: 1;
          min-width: 180px;
        }

        .mp-name {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 4px;
          letter-spacing: -0.5px;
          line-height: 1.1;
        }

        .mp-email {
          font-size: 13.5px;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 12px;
          font-weight: 400;
        }

        /* Role badge — mirrors homepage job tags */
        .mp-role-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 13px;
          border-radius: 50px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.3px;
        }

        .mp-role-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        /* Progress */
        .mp-progress-wrap {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #f1f5f9;
        }

        .mp-progress-label {
          display: flex;
          justify-content: space-between;
          font-size: 11.5px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .mp-progress-track {
          height: 5px;
          background: #e2e8f0;
          border-radius: 100px;
          overflow: hidden;
        }

        .mp-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981 0%, #059669 100%);
          border-radius: 100px;
          transition: width 0.7s cubic-bezier(0.34,1.56,0.64,1);
        }

        /* Hero right */
        .mp-hero-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
        }

        /* Status pills — matches homepage live/paid tags */
        .mp-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 50px;
          font-size: 12.5px;
          font-weight: 600;
        }

        /* Edit button — dark navy → green on hover, matches job cards */
        .mp-edit-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 22px;
          background: #0f172a;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Inter', sans-serif;
          letter-spacing: 0.1px;
        }
        .mp-edit-btn:hover {
          background: #10b981;
          box-shadow: 0 4px 14px rgba(16,185,129,0.35);
          transform: translateY(-1px);
        }

        /* ── Section cards — same as job cards ── */
        .mp-section {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          margin-bottom: 20px;
          overflow: hidden;
          animation: fadeUp 0.4s ease both;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .mp-section:hover {
          border-color: #bbf7d0;
          box-shadow: 0 4px 20px rgba(16,185,129,0.07);
        }

        .mp-section:nth-child(1) { animation-delay: 0.05s; }
        .mp-section:nth-child(2) { animation-delay: 0.10s; }
        .mp-section:nth-child(3) { animation-delay: 0.15s; }
        .mp-section:nth-child(4) { animation-delay: 0.20s; }
        .mp-section:nth-child(5) { animation-delay: 0.25s; }

        .mp-section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 22px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .mp-section-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .mp-section-title {
          font-size: 13.5px;
          font-weight: 700;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .mp-section-line {
          flex: 1;
          height: 1px;
          border-radius: 1px;
        }

        .mp-section-body {
          padding: 4px 0;
        }

        /* ── Fields grid ── */
        .mp-fields-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        }

        .mp-field {
          padding: 14px 22px;
          border-bottom: 1px solid #f8fafc;
          transition: background 0.15s;
        }
        .mp-field:last-child { border-bottom: none; }
        .mp-field:hover { background: #f8fafc; }

        .mp-field-label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 5px;
        }

        .mp-field-value {
          font-size: 14px;
          color: #0f172a;
          font-weight: 500;
          word-break: break-word;
        }

        .mp-field-value.multiline {
          font-weight: 400;
          color: #334155;
          line-height: 1.7;
          white-space: pre-wrap;
        }

        .mp-field-value a {
          color: #10b981;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-weight: 600;
        }
        .mp-field-value a:hover { text-decoration: underline; color: #059669; }

        .mp-empty {
          color: #cbd5e1;
          font-style: italic;
          font-size: 13px;
          font-weight: 400;
        }

        /* ── Skills — matches homepage skill pills ── */
        .mp-skills-wrap {
          padding: 18px 22px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .mp-skill {
          padding: 5px 14px;
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #6ee7b7;
          border-radius: 100px;
          font-size: 12.5px;
          font-weight: 600;
        }

        /* ── Resume link ── */
        .mp-resume-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 20px;
          background: #f0fdf4;
          color: #15803d;
          border: 1.5px solid #bbf7d0;
          border-radius: 10px;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
          transition: all 0.2s;
        }
        .mp-resume-link:hover {
          background: #d1fae5;
          border-color: #6ee7b7;
          box-shadow: 0 4px 12px rgba(16,185,129,0.15);
        }

        /* ── Business images ── */
        .mp-images-grid {
          padding: 18px 22px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 12px;
        }

        .mp-biz-img {
          width: 100%;
          height: 120px;
          object-fit: cover;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          cursor: pointer;
          transition: all 0.2s;
        }
        .mp-biz-img:hover {
          transform: translateY(-2px);
          border-color: #6ee7b7;
          box-shadow: 0 4px 12px rgba(16,185,129,0.12);
        }

        /* ── Admin card ── */
        .mp-admin-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 40px 32px;
          text-align: center;
          margin-bottom: 20px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          animation: fadeUp 0.4s ease;
        }

        .mp-admin-icon {
          width: 56px;
          height: 56px;
          background: #0f172a;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          box-shadow: 0 4px 16px rgba(15,23,42,0.22);
        }

        .mp-admin-title {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 8px;
          letter-spacing: -0.3px;
        }

        .mp-admin-note {
          font-size: 13.5px;
          color: #64748b;
          line-height: 1.6;
        }

        /* Company logo preview */
        .mp-company-logo {
          height: 72px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          object-fit: contain;
          background: #f8fafc;
          padding: 8px;
        }

        @media (max-width: 640px) {
          .mp-container { padding: 20px 16px 56px; }
          .mp-hero { flex-direction: column; align-items: flex-start; padding: 24px 20px; }
          .mp-hero-right { align-items: flex-start; }
          .mp-fields-grid { grid-template-columns: 1fr; }
          .mp-name { font-size: 22px; }
        }
      `}</style>

      <Navbar />

      <div className="mp-page">
        <div className="mp-container">

          {/* ── Hero ── */}
          <div className="mp-hero">
            <div className="mp-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <div className="mp-hero-info">
              <div className="mp-name">{user?.name || "User"}</div>
              <div className="mp-email">
                <Mail size={13} />
                {user?.email}
              </div>

              {/* Role badge — pill style matching homepage */}
              <span className="mp-role-badge"
                style={{ background: rc.bg, color: rc.color, border: `1.5px solid ${rc.border}` }}>
                <span className="mp-role-dot" style={{ background: rc.dot }} />
                <Shield size={11} />
                {rc.label}
              </span>

              {role !== "admin" && (
                <div className="mp-progress-wrap">
                  <div className="mp-progress-label">
                    <span>Profile Completion</span>
                    <span style={{ color: completionPct >= 80 ? "#10b981" : "#94a3b8" }}>{completionPct}%</span>
                  </div>
                  <div className="mp-progress-track">
                    <div className="mp-progress-fill" style={{ width: `${completionPct}%` }} />
                  </div>
                </div>
              )}
            </div>

            <div className="mp-hero-right">
              {/* Status badges — mirrors homepage Live/Paid tags */}
              {role !== "admin" && (
                user?.profileCompleted ? (
                  <span className="mp-status-pill" style={{ background: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7" }}>
                    <CheckCircle size={13} /> Complete
                  </span>
                ) : (
                  <span className="mp-status-pill" style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}>
                    <Clock size={13} /> Incomplete
                  </span>
                )
              )}

              {role === "business" && (
                <span className="mp-status-pill"
                  style={{
                    background: user?.businessProfile?.status === "approved" ? "#d1fae5" : "#fef2f2",
                    color:      user?.businessProfile?.status === "approved" ? "#065f46" : "#dc2626",
                    border:     `1px solid ${user?.businessProfile?.status === "approved" ? "#6ee7b7" : "#fecaca"}`,
                  }}>
                  {user?.businessProfile?.status === "approved"
                    ? <><CheckCircle size={13} /> Verified</>
                    : <><Clock size={13} /> Pending</>}
                </span>
              )}

              {editRoute && (
                <button className="mp-edit-btn" onClick={() => navigate(editRoute)}>
                  <Edit size={15} />Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* ════════ ADMIN ════════ */}
          {role === "admin" && (
            <div className="mp-admin-card">
              <div className="mp-admin-icon">
                <Shield size={26} color="white" />
              </div>
              <div className="mp-admin-title">Administrator Account</div>
              <div className="mp-admin-note">
                Admin accounts display name and email only. No additional profile details are collected.
              </div>
            </div>
          )}

          {/* ════════ JOB SEEKER ════════ */}
          {role === "jobseeker" && (
            <>
              <Section title="Personal Information" icon={User} accent="#10b981">
                <div className="mp-fields-grid">
                  <Field label="Full Name"  value={profile.fullName || `${profile.firstName || ""} ${profile.lastName || ""}`.trim()} icon={User} />
                  <Field label="Mobile"     value={profile.mobile}    icon={Phone} />
                  <Field label="City"       value={profile.city}      icon={MapPin} />
                  <Field label="Pincode"    value={profile.pincode}   icon={MapPin} />
                  <Field label="Email"      value={user?.email}       icon={Mail} />
                </div>
              </Section>

              <Section title="Professional Details" icon={Briefcase} accent="#0f172a">
                <div className="mp-fields-grid">
                  <Field label="Education"       value={profile.education}     icon={GraduationCap} />
                  <Field label="Experience"       value={profile.experience ? `${profile.experience} years` : null} icon={Clock} />
                  <Field label="Preferred Role"   value={profile.preferredRole} icon={Star} />
                  <Field label="Expected Salary"  value={profile.expectedSalary} icon={DollarSign} />
                  <Field label="LinkedIn"         value={profile.linkedin}      icon={Linkedin} isLink />
                  <Field label="Portfolio"        value={profile.portfolio}     icon={Globe}    isLink />
                </div>
              </Section>

              {(profile.about || profile.accomplishments) && (
                <Section title="About" icon={FileText} accent="#059669">
                  <div style={{ padding: "4px 0" }}>
                    <Field label="About Me"        value={profile.about}           multiline />
                    <Field label="Accomplishments"  value={profile.accomplishments} multiline />
                  </div>
                </Section>
              )}

              {profile.skills?.length > 0 && (
                <Section title="Skills" icon={Award} accent="#10b981">
                  <div className="mp-skills-wrap">
                    {profile.skills.map((s, i) => (
                      <span key={i} className="mp-skill">{s}</span>
                    ))}
                  </div>
                </Section>
              )}

              {profile.resume && (
                <Section title="Resume" icon={FileText} accent="#0f172a">
                  <div style={{ padding: "18px 22px" }}>
                    <a href={profile.resume} target="_blank" rel="noreferrer" className="mp-resume-link">
                      <FileText size={15} /> View Resume <ExternalLink size={13} />
                    </a>
                  </div>
                </Section>
              )}
            </>
          )}

          {/* ════════ RECRUITER ════════ */}
          {role === "recruiter" && (
            <>
              <Section title="Company Information" icon={Building2} accent="#10b981">
                <div className="mp-fields-grid">
                  <Field label="Company Name"   value={profile.companyName}      icon={Building2} />
                  <Field label="Industry"       value={profile.industryType}     icon={Tag} />
                  <Field label="Location"       value={profile.companyLocation}  icon={MapPin} />
                  <Field label="Contact Number" value={profile.contactNumber}    icon={Phone} />
                  <Field label="Website"        value={profile.companyWebsite}   icon={Globe} isLink />
                </div>
              </Section>

              {profile.companyDescription && (
                <Section title="About the Company" icon={FileText} accent="#0f172a">
                  <div style={{ padding: "4px 0" }}>
                    <Field label="Description" value={profile.companyDescription} multiline />
                  </div>
                </Section>
              )}

              <Section title="Verification Status" icon={CheckCircle} accent="#059669">
                <div className="mp-fields-grid">
                  <Field
                    label="Linked Business"
                    value={profile.linkedBusiness ? "Linked ✓" : null}
                    icon={Building2}
                  />
                  {!profile.linkedBusiness && (
                    <div style={{ padding: "14px 22px" }}>
                      <span className="mp-empty">Not linked to a business yet</span>
                    </div>
                  )}
                </div>
              </Section>

              {profile.companyLogo && (
                <Section title="Company Logo" icon={Image} accent="#10b981">
                  <div style={{ padding: "18px 22px" }}>
                    <img src={profile.companyLogo} alt="Company logo" className="mp-company-logo" />
                  </div>
                </Section>
              )}
            </>
          )}

          {/* ════════ BUSINESS OWNER ════════ */}
          {role === "business" && (
            <>
              <Section title="Business Information" icon={Building2} accent="#10b981">
                <div className="mp-fields-grid">
                  <Field label="Business Name" value={profile.businessName}    icon={Building2} />
                  <Field label="Category"      value={profile.category}        icon={Tag} />
                  <Field label="Address"       value={profile.address}         icon={MapPin} />
                  <Field label="Contact"       value={profile.contactDetails}  icon={Phone} />
                </div>
              </Section>

              {profile.description && (
                <Section title="About the Business" icon={FileText} accent="#0f172a">
                  <div style={{ padding: "4px 0" }}>
                    <Field label="Description" value={profile.description} multiline />
                  </div>
                </Section>
              )}

              <Section title="Verification Status" icon={Shield} accent="#059669">
                <div className="mp-fields-grid">
                  <Field
                    label="Status"
                    value={profile.status ? profile.status.charAt(0).toUpperCase() + profile.status.slice(1) : null}
                    icon={BarChart2}
                  />
                  <Field
                    label="Verified"
                    value={profile.verified ? "Yes ✓" : "Not yet"}
                    icon={CheckCircle}
                  />
                </div>
              </Section>

              {profile.images?.length > 0 && (
                <Section title="Business Images" icon={Image} accent="#10b981">
                  <div className="mp-images-grid">
                    {profile.images.map((img, i) => (
                      <img key={i} src={img} alt={`Business ${i + 1}`} className="mp-biz-img"
                        onClick={() => window.open(img, "_blank")} />
                    ))}
                  </div>
                </Section>
              )}
            </>
          )}

        </div>
      </div>
    </>
  );
}