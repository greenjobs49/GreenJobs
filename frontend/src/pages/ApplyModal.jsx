import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  X,
  Send,
  CheckCircle,
  AlertCircle,
  FileText,
  User,
  MapPin,
  GraduationCap,
  Briefcase,
  Loader2,
  Star,
  Check,
  ExternalLink,
  Phone,
  Mail,
  Linkedin,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

import API_BASE_URL from "../config/api"; // adjust path as needed

const ApplyModal = ({ job, onClose, onSuccess }) => {
  const { user, token } = useAuth();
  const [coverLetter, setCoverLetter] = useState("");
  const [coverLetterError, setCoverLetterError] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1 = profile review, 2 = cover letter

  const profile = user?.jobSeekerProfile || {};
  const resumeUrl = profile.resume;
  const jobSkills = job?.skills || [];

  const fullName =
    profile.fullName ||
    `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
    user?.name ||
    "";

  // Pre-select skills that overlap with job skills
  useEffect(() => {
    if (jobSkills.length && profile.skills?.length) {
      const userSkillsLower = profile.skills.map((s) => s.toLowerCase());
      const matched = jobSkills.filter((js) =>
        userSkillsLower.includes(js.toLowerCase())
      );
      setSelectedSkills(matched);
    }
  }, [job]);

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

const handleSubmit = async () => {
    setCoverLetterError(""); // Clears any old errors, no minimum length check!

    try {
      setSubmitting(true);
      await axios.post(
        `${API_BASE_URL}/api/applications`,
        {
          jobId: job._id,
          coverLetter: coverLetter.trim(),
          selectedSkills,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Application submitted! 🎉", {
        duration: 4000,
        style: {
          background: "#D1FAE5",
          color: "#065F46",
          border: "1px solid #6EE7B7",
          borderRadius: "12px",
          fontWeight: "500",
        },
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to submit";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const companyName =
    job?.company ||
    job?.business?.businessProfile?.businessName ||
    "the company";

  const profileFields = [
    { icon: User, label: "Full Name", value: fullName },
    { icon: Mail, label: "Email", value: user?.email },
    { icon: Phone, label: "Mobile", value: profile.mobile },
    { icon: MapPin, label: "City", value: profile.city },
    { icon: GraduationCap, label: "Education", value: profile.education },
    { icon: Briefcase, label: "Experience", value: profile.experience ? `${profile.experience} year(s)` : null },
    { icon: Linkedin, label: "LinkedIn", value: profile.linkedin, isLink: true },
  ].filter((f) => f.value);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .am-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px); z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          padding: 16px; animation: amOverlayIn 0.2s ease;
          font-family: 'Inter', sans-serif;
        }

        @keyframes amOverlayIn { from { opacity:0; } to { opacity:1; } }
        @keyframes amModalIn { from { opacity:0; transform:scale(0.96) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }

        .am-modal {
          background: white; border-radius: 16px; width: 100%; max-width: 620px;
          max-height: 90vh; display: flex; flex-direction: column;
          animation: amModalIn 0.25s ease; box-shadow: 0 24px 80px rgba(0,0,0,0.25);
          overflow: hidden;
        }

        .am-header {
          padding: 24px 28px 20px; border-bottom: 1px solid #e2e8f0;
          display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
          background: linear-gradient(135deg, #0f172a, #1e293b); flex-shrink: 0;
        }

        .am-header-left { flex: 1; }
        .am-title { font-size: 18px; font-weight: 700; color: white; margin-bottom: 4px; }
        .am-subtitle { font-size: 13px; color: #94a3b8; }

        .am-close {
          width: 32px; height: 32px; background: rgba(255,255,255,0.1);
          border: none; border-radius: 50%; display: flex; align-items: center;
          justify-content: center; cursor: pointer; transition: all 0.2s; flex-shrink: 0;
        }
        .am-close:hover { background: rgba(255,255,255,0.2); }

        /* Steps indicator */
        .am-steps {
          display: flex; align-items: center; gap: 0;
          padding: 0 28px; background: #f8fafc;
          border-bottom: 1px solid #e2e8f0; flex-shrink: 0;
        }
        .am-step {
          display: flex; align-items: center; gap: 8px;
          padding: 14px 0; font-size: 13px; font-weight: 600;
          color: #94a3b8; flex: 1; cursor: default;
        }
        .am-step.active { color: #0f172a; }
        .am-step.done { color: #10b981; }
        .am-step-num {
          width: 24px; height: 24px; border-radius: 50%; border: 2px solid #e2e8f0;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; background: white; flex-shrink: 0;
        }
        .am-step.active .am-step-num { border-color: #0f172a; background: #0f172a; color: white; }
        .am-step.done .am-step-num { border-color: #10b981; background: #10b981; color: white; }
        .am-step-divider { width: 24px; height: 1px; background: #e2e8f0; flex-shrink: 0; }

        .am-body { flex: 1; overflow-y: auto; padding: 24px 28px; }

        /* Job pill */
        .am-job-pill {
          display: flex; align-items: center; gap: 12px; padding: 14px 16px;
          background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
          margin-bottom: 20px;
        }
        .am-job-icon {
          width: 40px; height: 40px; background: #0f172a; border-radius: 8px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .am-job-title { font-size: 14px; font-weight: 700; color: #0f172a; }
        .am-job-company { font-size: 12px; color: #64748b; margin-top: 2px; }

        /* Profile section */
        .am-section-label {
          font-size: 11px; font-weight: 700; color: #94a3b8;
          text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 12px;
          display: flex; align-items: center; gap: 6px;
        }

        .am-profile-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 10px; margin-bottom: 20px;
        }
        .am-profile-item {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 10px 12px; background: #f8fafc;
          border: 1px solid #e2e8f0; border-radius: 8px;
        }
        .am-profile-item-icon {
          width: 28px; height: 28px; background: white; border: 1px solid #e2e8f0;
          border-radius: 6px; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .am-profile-item-label { font-size: 10px; color: #94a3b8; font-weight: 600; text-transform: uppercase; margin-bottom: 2px; }
        .am-profile-item-value { font-size: 13px; color: #0f172a; font-weight: 500; word-break: break-word; }
        .am-profile-item-value a { color: #3b82f6; text-decoration: none; }
        .am-profile-item-value a:hover { text-decoration: underline; }

        /* Resume status */
        .am-resume-status {
          display: flex; align-items: center; gap: 10px; padding: 12px 16px;
          border-radius: 8px; font-size: 13px; font-weight: 600; margin-bottom: 20px;
          border: 1px solid;
        }
        .am-resume-status.ok { background: #f0fdf4; border-color: #86efac; color: #065f46; }
        .am-resume-status.missing { background: #fef2f2; border-color: #fecaca; color: #991b1b; }

        /* Skills selector */
        .am-skills-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
        .am-skill-chip {
          display: flex; align-items: center; gap: 6px; padding: 6px 14px;
          border-radius: 100px; font-size: 13px; font-weight: 600; cursor: pointer;
          border: 2px solid #e2e8f0; background: white; color: #64748b;
          transition: all 0.15s; font-family: 'Inter', sans-serif;
        }
        .am-skill-chip:hover { border-color: #10b981; color: #065f46; background: #f0fdf4; }
        .am-skill-chip.selected { border-color: #10b981; background: #d1fae5; color: #065f46; }
        .am-skill-chip.has-match { border-color: #6ee7b7; background: #ecfdf5; }
        .am-skill-note { font-size: 12px; color: #94a3b8; margin-bottom: 12px; }

        /* Cover letter */
        .am-textarea {
          width: 100%; padding: 14px; font-size: 14px;
          font-family: 'Inter', sans-serif; background: #f8fafc;
          border: 1.5px solid #e2e8f0; border-radius: 10px; color: #0f172a;
          outline: none; resize: vertical; min-height: 140px; line-height: 1.6;
          transition: all 0.2s; box-sizing: border-box;
        }
        .am-textarea:focus { border-color: #10b981; background: white; box-shadow: 0 0 0 3px rgba(16,185,129,0.08); }
        .am-textarea.error { border-color: #fca5a5; background: #fff5f5; }
        .am-char-count { font-size: 12px; color: #94a3b8; margin-top: 6px; text-align: right; }
        .am-error { font-size: 12px; color: #ef4444; margin-top: 6px; display: flex; align-items: center; gap: 4px; }

        /* No resume warning */
        .am-no-resume {
          padding: 20px; background: #fef2f2; border: 1px solid #fecaca;
          border-radius: 10px; text-align: center;
        }
        .am-no-resume h4 { color: #991b1b; font-size: 15px; margin-bottom: 8px; }
        .am-no-resume p { color: #dc2626; font-size: 13px; }

        /* Footer */
        .am-footer {
          padding: 16px 28px; border-top: 1px solid #e2e8f0;
          display: flex; gap: 10px; justify-content: space-between;
          align-items: center; flex-shrink: 0; background: white;
        }
        .am-footer-left { font-size: 12px; color: #94a3b8; }

        .am-btn {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 8px; padding: 11px 22px; border-radius: 8px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          transition: all 0.2s; border: none; font-family: 'Inter', sans-serif;
        }
        .am-btn-secondary { background: #f1f5f9; color: #475569; }
        .am-btn-secondary:hover { background: #e2e8f0; }
        .am-btn-primary { background: #0f172a; color: white; }
        .am-btn-primary:hover:not(:disabled) { background: #1e293b; }
        .am-btn-green { background: #10b981; color: white; }
        .am-btn-green:hover:not(:disabled) { background: #059669; }
        .am-btn-group { display: flex; gap: 10px; }
        .am-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .am-spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (max-width: 600px) {
          .am-modal { max-height: 100vh; border-radius: 0; max-width: 100%; }
          .am-profile-grid { grid-template-columns: 1fr; }
          .am-overlay { padding: 0; }
        }
      `}</style>

      <div className="am-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="am-modal">
          {/* Header */}
          <div className="am-header">
            <div className="am-header-left">
              <div className="am-title">Apply for Job</div>
              <div className="am-subtitle">Complete your application below</div>
            </div>
            <button className="am-close" onClick={onClose}>
              <X size={16} color="white" />
            </button>
          </div>

          {/* Steps */}
          <div className="am-steps">
            <div className={`am-step ${step >= 1 ? (step > 1 ? "done" : "active") : ""}`}>
              <div className="am-step-num">
                {step > 1 ? <Check size={12} /> : "1"}
              </div>
              Profile Preview
            </div>
            <div className="am-step-divider" />
            <div className={`am-step ${step >= 2 ? "active" : ""}`}>
              <div className="am-step-num">2</div>
              Cover Letter
            </div>
          </div>

          {/* Body */}
          <div className="am-body">
            {/* Job pill */}
            <div className="am-job-pill">
              <div className="am-job-icon">
                <Briefcase size={18} color="white" />
              </div>
              <div>
                <div className="am-job-title">{job?.title}</div>
                <div className="am-job-company">
                  {companyName} · {job?.location} · {job?.type}
                </div>
              </div>
            </div>

            {/* ── STEP 1: Profile + Skills ── */}
            {step === 1 && (
              <>
                {/* Profile details */}
                <div className="am-section-label">
                  <User size={12} />
                  Your Profile (submitted with application)
                </div>

                {profileFields.length > 0 ? (
                  <div className="am-profile-grid">
                    {profileFields.map(({ icon: Icon, label, value, isLink }) => (
                      <div key={label} className="am-profile-item">
                        <div className="am-profile-item-icon">
                          <Icon size={13} color="#64748b" />
                        </div>
                        <div>
                          <div className="am-profile-item-label">{label}</div>
                          <div className="am-profile-item-value">
                            {isLink ? (
                              <a href={value} target="_blank" rel="noreferrer">
                                {value.length > 25 ? value.slice(0, 25) + "…" : value}
                              </a>
                            ) : (
                              value
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: "12px", background: "#fffbeb", borderRadius: "8px", fontSize: "13px", color: "#92400e", marginBottom: "16px" }}>
                    ⚠️ Your profile is incomplete. Consider updating it for a better impression.
                  </div>
                )}

                {/* Resume */}
                <div className="am-section-label">
                  <FileText size={12} />
                  Resume
                </div>
                {resumeUrl ? (
                  <div className="am-resume-status ok">
                    <CheckCircle size={16} />
                    <span>Resume uploaded ✓</span>
                    <a
                      href={resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ marginLeft: "auto", color: "#065f46", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px", textDecoration: "none" }}
                    >
                      <ExternalLink size={12} /> View
                    </a>
                  </div>
                ) : (
                  <div className="am-resume-status missing">
                    <AlertCircle size={16} />
                    <span>No resume uploaded — please upload before applying</span>
                  </div>
                )}

                {/* Skills selector */}
                {jobSkills.length > 0 && (
                  <>
                    <div className="am-section-label" style={{ marginTop: "20px" }}>
                      <Star size={12} />
                      Select your matching skills for this role
                    </div>
                    <p className="am-skill-note">
                      Select the skills from this job that you possess. Pre-selected ones match your profile.
                    </p>
                    <div className="am-skills-grid">
                      {jobSkills.map((skill) => {
                        const hasInProfile = profile.skills?.some(
                          (s) => s.toLowerCase() === skill.toLowerCase()
                        );
                        const isSelected = selectedSkills.includes(skill);
                        return (
                          <button
                            key={skill}
                            className={`am-skill-chip ${isSelected ? "selected" : ""} ${hasInProfile && !isSelected ? "has-match" : ""}`}
                            onClick={() => toggleSkill(skill)}
                          >
                            {isSelected ? <Check size={12} /> : null}
                            {skill}
                            {hasInProfile && !isSelected && (
                              <span style={{ fontSize: "10px", color: "#10b981" }}>✓</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                      {selectedSkills.length} of {jobSkills.length} skills selected
                    </div>
                  </>
                )}
              </>
            )}

            {/* ── STEP 2: Cover Letter ── */}
            {step === 2 && (
              <>
                {!resumeUrl ? (
                  <div className="am-no-resume">
                    <h4>Resume Required</h4>
                    <p>Please upload your resume from the Dashboard before applying.</p>
                  </div>
                ) : (
                  <>
                    <div className="am-section-label">
                      <FileText size={12} />
                      Cover Letter <span style={{ color: "#94a3b8", textTransform: "none", marginLeft: "4px" }}>(Optional)</span>
                    </div>
                    <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "12px" }}>
                      Tell the recruiter why you're the right fit for <strong>{job?.title}</strong>. Mention relevant skills, experience, or projects.
                    </p>
                    <textarea
                      className={`am-textarea ${coverLetterError ? "error" : ""}`}
                      placeholder={`Hi,\n\nI'm excited to apply for ${job?.title} at ${companyName}...\n\nHere's what makes me a great fit:\n- My experience with ${selectedSkills.slice(0, 2).join(", ") || "relevant technologies"}...\n\nThank you for your consideration.`}
                      value={coverLetter}
                      onChange={(e) => {
                        setCoverLetter(e.target.value);
                        if (coverLetterError) setCoverLetterError("");
                      }}
                      rows={8}
                    />
                    {coverLetterError ? (
                      <div className="am-error">
                        <AlertCircle size={12} />
                        {coverLetterError}
                      </div>
                    ) : (
                      <div className="am-char-count">
                        {coverLetter.length} / 2000 chars
                      </div>
                    )}

                    {/* Summary */}
                    {selectedSkills.length > 0 && (
                      <div style={{ marginTop: "16px", padding: "12px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                        <div style={{ fontSize: "12px", color: "#065f46", fontWeight: "600", marginBottom: "6px" }}>
                          Skills you're highlighting:
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {selectedSkills.map((s) => (
                            <span key={s} style={{ padding: "2px 10px", background: "#d1fae5", borderRadius: "100px", fontSize: "12px", color: "#065f46", fontWeight: "600" }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="am-footer">
            <div className="am-footer-left">
              {step === 1 ? "Step 1 of 2" : "Step 2 of 2"}
            </div>
            <div className="am-btn-group">
              {step === 1 ? (
                <>
                  <button className="am-btn am-btn-secondary" onClick={onClose}>
                    Cancel
                  </button>
                  <button
                    className="am-btn am-btn-primary"
                    onClick={() => setStep(2)}
                    disabled={!resumeUrl}
                  >
                    Next →
                  </button>
                </>
              ) : (
                <>
                  <button className="am-btn am-btn-secondary" onClick={() => setStep(1)}>
                    ← Back
                  </button>
                  <button
                    className="am-btn am-btn-green"
                    onClick={handleSubmit}
                    disabled={submitting || !resumeUrl}
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={15} className="am-spinner" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        Submit Application
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ApplyModal;