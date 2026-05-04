import React, { useState, useMemo, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import API_BASE_URL from "../config/api";
import Navbar from "../components/common/Navbar";
import ImageCropperModal from "../components/common/ImageCropperModal";
import {
  User, FileText, Info, Zap, GraduationCap, Briefcase, Trophy,
  Building2, LayoutTemplate, Palette, Store, ClipboardList, Image,
  CheckCircle, Upload, X, ChevronRight, ArrowRight, Camera
} from "lucide-react";

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */

const sectionDefs = {
  jobseeker: [
  { id: "basicDetails",    label: "Basic Details",   icon: User,          required: true  },
  { id: "resume",          label: "Resume",          icon: FileText,      required: true  },
  { id: "about",           label: "About",           icon: Info,          required: true  },
  { id: "skills",          label: "Skills",          icon: Zap,           required: true  },
  { id: "education",       label: "Education",       icon: GraduationCap, required: true  },
  { id: "experience",      label: "Work Experience", icon: Briefcase,     required: true  },
  { id: "accomplishments", label: "Accomplishments", icon: Trophy,        required: false },
  { id: "references",      label: "References",      icon: User,          required: false },
],
  recruiter: [
    { id: "basicDetails",   label: "Company Basics",  icon: Building2,     required: true },
    { id: "companyDetails", label: "Company Details", icon: ClipboardList, required: true },
    { id: "branding",       label: "Branding",        icon: Palette,       required: true },
  ],
  business: [
    { id: "basicDetails",    label: "Business Info",    icon: Store,          required: true },
    { id: "businessDetails", label: "Business Details", icon: LayoutTemplate, required: true },
    { id: "media",           label: "Media",            icon: Image,          required: true },
  ],
};

const requiredFieldsBySection = {
  jobseeker: {
  basicDetails: ["firstName", "lastName", "mobile", "city", "pincode"],
  resume: ["resume"],
  about: ["about"],
  skills: ["skills"],
  education: ["education"],
  experience: ["experience"],
  accomplishments: [],
  references: [], 
},
  recruiter: {
    basicDetails:   ["companyName", "companyWebsite", "contactNumber"],
    companyDetails: ["companyDescription", "companyLocation", "industryType"],
    branding:       ["companyLogo"],
  },
  business: {
    basicDetails:    ["businessName", "category", "contactDetails"],
    businessDetails: ["street", "city", "state", "pincode", "description"],
    media:           ["images"],
  },
};

const skillSuggestions = [
  "Solar PV Design", "AutoCAD", "Python", "JavaScript", "React", "Node.js",
  "Machine Learning", "AWS", "Docker", "SQL", "MongoDB", "TypeScript", "Git",
  "Data Analysis", "GDPR Compliance", "Project Management", "Embedded Systems",
  "Asana", "HTML", "CSS",
];

const inputStyle = {
  width: "100%", padding: "12px 16px", background: "#f8fafc",
  border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14.5,
  fontFamily: "'Inter', sans-serif", color: "#0f172a", outline: "none",
  transition: "all 0.2s",
};

const Field = ({ label, required, children, hint, fullWidth }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 7, ...(fullWidth && { gridColumn: "1/-1" }) }}>
    <label style={{ fontSize: 11.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.6px" }}>
      {label}{required && <span style={{ color: "#ef4444", marginLeft: 3 }}>*</span>}
    </label>
    {children}
    {hint && <span style={{ fontSize: 12, color: "#94a3b8" }}>{hint}</span>}
  </div>
);

const SectionHeader = ({ title, subtitle }) => (
  <div style={{ marginBottom: 28 }}>
    <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.4px", marginBottom: 5 }}>{title}</h2>
    <p style={{ fontSize: 14, color: "#64748b", fontWeight: 400 }}>{subtitle}</p>
  </div>
);

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const CompleteProfile = () => {
  const { user, token, login } = useAuth();
  const navigate = useNavigate();

  const seedProfile = useMemo(() => {
    if (user?.role === "jobseeker") return user?.jobSeekerProfile || {};
    if (user?.role === "recruiter") return user?.recruiterProfile || {};
    if (user?.role === "business")  return user?.businessProfile  || {};
    return {};
  }, [user]);

  const isSeedFilled = useCallback((field) => {
    if (field === "skills") return (seedProfile.skills || []).length > 0;
    if (field === "images") return (seedProfile.images || []).length > 0;
    const v = seedProfile[field];
    return v && v.toString().trim() !== "";
  }, [seedProfile]);

  const [form, setForm] = useState(() => ({
    firstName: seedProfile.firstName || "",
    lastName:  seedProfile.lastName  || "",
    mobile:    seedProfile.mobile    || user?.mobile || "",
    city:      seedProfile.city      || "",
    pincode:   seedProfile.pincode   || "",
    about:     seedProfile.about     || "",
    education: seedProfile.education || "",
    experience: seedProfile.experience || "",
    accomplishments: seedProfile.accomplishments || "",
    linkedin:  seedProfile.linkedin  || "",
    resume:    seedProfile.resume    || "",
    companyName:        seedProfile.companyName        || "",
    companyWebsite:     seedProfile.companyWebsite     || "",
    contactNumber:      seedProfile.contactNumber      || "",
    companyDescription: seedProfile.companyDescription || "",
    companyLocation:    seedProfile.companyLocation    || "",
    industryType:       seedProfile.industryType       || "",
    companyLogo:        seedProfile.companyLogo        || "",
    businessName:   seedProfile.businessName   || "",
    category:       seedProfile.category       || "",
    contactDetails: seedProfile.contactDetails || "",
    street:         seedProfile.street         || "",
    state:          seedProfile.state          || "",
    description:    seedProfile.description    || "",
    images:         seedProfile.images         || [],
    profilePicture: user?.profilePicture       || "",
    readyToRelocate: seedProfile.readyToRelocate || false,
references: seedProfile.references || [{ name: "", phone: "" }],
  }));

  const [uploading,      setUploading]      = useState(false);
  const [selectedSkills, setSelectedSkills] = useState(seedProfile.skills || []);
  const [skillInput,     setSkillInput]     = useState("");

  /* ── Cropper state ── */
  const [logoCropOpen,   setLogoCropOpen]   = useState(false);
  const [logoRawSrc,     setLogoRawSrc]     = useState("");

  const [avatarCropOpen, setAvatarCropOpen] = useState(false);
  const [avatarRawSrc,   setAvatarRawSrc]   = useState("");

  const [bizCropOpen,   setBizCropOpen]   = useState(false);
  const [bizRawSrc,     setBizRawSrc]     = useState("");
  const [bizCropQueue,  setBizCropQueue]  = useState([]);

  const API = `${API_BASE_URL}/api/profile`;

  /* ── Section progress ── */
  const getSectionProgress = useCallback((sectionId) => {
    const fields = requiredFieldsBySection[user.role]?.[sectionId] || [];
    if (!fields.length) return 100;
    const filled = fields.filter((f) => {
      if (f === "skills") return selectedSkills.length > 0;
      if (f === "images") return form[f] && form[f].length > 0;
      const v = form[f];
      if (v === 0 || v === "0") return true;
      return v && v.toString().trim() !== "";
    }).length;
    return Math.round((filled / fields.length) * 100);
  }, [form, selectedSkills, user.role]);

  const allSections = sectionDefs[user.role] || [];

  const [currentSection, setCurrentSection] = useState(() => {
    const first = allSections.find((s) => {
      if (!s.required) return false;
      const fields = requiredFieldsBySection[user.role]?.[s.id] || [];
      return fields.some((f) => !isSeedFilled(f));
    });
    return first?.id || allSections[0]?.id || "basicDetails";
  });

  const overallProgress = useMemo(() => {
    const required = allSections.filter((s) => s.required);
    if (!required.length) return 0;
    const total = required.reduce((acc, s) => acc + getSectionProgress(s.id), 0);
    return Math.round(total / required.length);
  }, [allSections, getSectionProgress]);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleAddSkill = (skill) => {
    if (skill && !selectedSkills.includes(skill)) {
      setSelectedSkills((p) => [...p, skill]);
      setSkillInput("");
    }
  };
  const handleRemoveSkill = (skill) => setSelectedSkills((p) => p.filter((s) => s !== skill));
  const handleSkillKeyPress = (e) => {
    if (e.key === "Enter" && skillInput.trim()) { e.preventDefault(); handleAddSkill(skillInput.trim()); }
  };

  /* ── File uploads (called after crop) ── */
  const handleResumeUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const data = new FormData(); data.append("resume", file);
    try {
      const res = await axios.post(`${API}/upload-resume`, data, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } });
      setForm((p) => ({ ...p, resume: res.data.resumeUrl }));
      toast.success("Resume uploaded!");
    } catch { toast.error("Upload failed."); }
    finally { setUploading(false); }
  };

  const handleLogoCropDone = async (blob) => {
    setLogoCropOpen(false);
    setUploading(true);
    const data = new FormData();
    data.append("logo", blob, "logo.jpg");
    try {
      const res = await axios.post(`${API}/upload-logo`, data, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } });
      setForm((p) => ({ ...p, companyLogo: res.data.logoUrl }));
      toast.success("Logo uploaded!");
    } catch { toast.error("Logo upload failed."); }
    finally { setUploading(false); }
  };

  const handleAvatarCropDone = async (blob) => {
    setAvatarCropOpen(false);
    setUploading(true);
    const data = new FormData();
    data.append("avatar", blob, "avatar.jpg");
    try {
      const res = await axios.post(`${API}/upload-avatar`, data, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } });
      setForm((p) => ({ ...p, profilePicture: res.data.avatarUrl }));
      toast.success("Profile picture uploaded!");
    } catch { toast.error("Avatar upload failed."); }
    finally { setUploading(false); }
  };

  /* Business images — one at a time through the queue */
const handleBizCropDone = async (blob) => {
  setUploading(true);
  try {
    const data = new FormData();
    data.append("images", blob, "business.jpg");
    const res = await axios.post(
      `${API}/upload-business-images`,
      data,
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
    );
    setForm(p => ({ ...p, images: [...(p.images || []), ...res.data.images] }));
    toast.success("Image uploaded!");
  } catch {
    toast.error("Images upload failed.");
  } finally {
    setUploading(false);
  }

  if (bizCropQueue.length > 0) {
    const [next, ...rest] = bizCropQueue;
    setBizRawSrc(URL.createObjectURL(next));
    setBizCropQueue(rest);
    setBizCropOpen(true);
  } else {
    setBizCropOpen(false);
  }
};

  const handleSaveAndNext = () => {
    const sec = allSections.find((s) => s.id === currentSection);
    if (sec?.required && getSectionProgress(currentSection) < 100) {
      return toast.error("Please fill in all required fields in this section");
    }
    const currentIdx = allSections.findIndex((s) => s.id === currentSection);
    const nextSection = allSections[currentIdx + 1];
    if (nextSection) {
      toast.success("Saved! Moving to next section.");
      setCurrentSection(nextSection.id);
    } else {
      toast.success("All sections done!");
    }
  };

  const handleSubmit = async () => {
    if (overallProgress < 100) return toast.error("Please complete all required sections");
    try {
      let payload = {};
      if (user.role === "jobseeker") {
        payload = {
          firstName: form.firstName?.trim(), lastName: form.lastName?.trim(),
          fullName: `${(form.firstName || "").trim()} ${(form.lastName || "").trim()}`.trim(),
          mobile: form.mobile?.trim(), city: form.city?.trim(), pincode: form.pincode?.trim(),
          about: form.about?.trim(), education: form.education?.trim(),
          experience: form.experience?.toString().trim() || "0",
          accomplishments: form.accomplishments?.trim() || "",
          linkedin: form.linkedin?.trim() || "", resume: form.resume, skills: selectedSkills,
          readyToRelocate: form.readyToRelocate,
  references: form.references.filter(r => r.name && r.phone),
        };
      } else if (user.role === "recruiter") {
        payload = {
          companyName: form.companyName?.trim(), companyWebsite: form.companyWebsite?.trim(),
          contactNumber: form.contactNumber?.trim(), companyDescription: form.companyDescription?.trim(),
          companyLocation: form.companyLocation?.trim(), industryType: form.industryType?.trim(),
          companyLogo: form.companyLogo,
        };
      } else if (user.role === "business") {
        payload = {
          businessName: form.businessName?.trim(), category: form.category?.trim(),
          contactDetails: form.contactDetails?.trim(),
          street: form.street?.trim() || "", city: form.city?.trim() || "",
          state: form.state?.trim() || "", pincode: form.pincode?.trim() || "",
          address: [form.street, form.city, form.state, form.pincode].filter(Boolean).join(", "),
          description: form.description?.trim(), images: form.images || [],
        };
      }
      const res = await axios.post(`${API}/complete`, payload, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Profile completed!");
      login(res.data.user, token);
      navigate("/dashboard");
    } catch (err) {
      console.error("Profile complete error:", err.response?.data);
      toast.error(err.response?.data?.message || "An error occurred");
    }
  };

  const incompleteSections = allSections.filter((s) => s.required && getSectionProgress(s.id) < 100);
  const nextSectionLabel = useMemo(() => {
    const currentIdx = allSections.findIndex((s) => s.id === currentSection);
    return allSections[currentIdx + 1]?.label || null;
  }, [allSections, currentSection]);

  /* ── Section content ── */
  const renderSection = () => {
    const role = user.role;

    if (role === "jobseeker") {
      switch (currentSection) {
        case "basicDetails": return (
          <div>
            <SectionHeader title="Basic Details" subtitle="Personal information visible to recruiters" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))", gap: 20 }}>
              <Field label="First Name" required><input name="firstName" value={form.firstName} onChange={handleChange} placeholder="John" style={inputStyle} className="cp-input" /></Field>
              <Field label="Last Name" required><input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Doe" style={inputStyle} className="cp-input" /></Field>
              <Field label="Mobile Number" required><input name="mobile" value={form.mobile} onChange={handleChange} placeholder="+91 9876543210" style={inputStyle} className="cp-input" /></Field>
              <Field label="City" required><input name="city" value={form.city || ""} onChange={handleChange} placeholder="e.g. Mumbai" style={inputStyle} className="cp-input" /></Field>
              <Field label="Pincode" required><input name="pincode" value={form.pincode || ""} onChange={handleChange} placeholder="e.g. 400001" maxLength={10} style={inputStyle} className="cp-input" /></Field>
              <Field label="LinkedIn Profile"><input name="linkedin" value={form.linkedin || ""} onChange={handleChange} placeholder="https://linkedin.com/in/yourname" style={inputStyle} className="cp-input" /></Field>
              <Field label="Ready to Relocate">
  <select
    value={form.readyToRelocate ? "yes" : "no"}
    onChange={(e) =>
      setForm((p) => ({
        ...p,
        readyToRelocate: e.target.value === "yes",
      }))
    }
    style={inputStyle}
    className="cp-input"
  >
    <option value="no">No</option>
    <option value="yes">Yes</option>
  </select>
</Field>

<Field label="Profile Picture">
  <input
    type="file"
    accept="image/*"
    className="cp-file-input"
    id="avatar-upload-jobseeker"
    disabled={uploading}
    onChange={(e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setAvatarRawSrc(URL.createObjectURL(file));
      setAvatarCropOpen(true);
      e.target.value = "";
    }}
  />
  <label htmlFor="avatar-upload-jobseeker" className="cp-upload-label">
    <Camera size={16} /> {uploading ? "Uploading…" : "Choose Profile Picture"}
  </label>
</Field>

{form.profilePicture && (
  <img
    src={form.profilePicture}
    alt="Profile"
    style={{
      width: 80,
      height: 80,
      borderRadius: "50%",
      objectFit: "cover",
      marginTop: 10,
      border: "2px solid #10b981",
    }}
  />
)}
            </div>
          </div>
        );
        case "resume": return (
          <div>
            <SectionHeader title="Resume" subtitle="Upload your latest resume — PDF, DOC or DOCX" />
            <div style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)", borderRadius: 16, padding: "28px 32px", display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
              <div style={{ width: 52, height: 52, background: "rgba(16,185,129,0.2)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FileText size={26} color="#10b981" />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "white", marginBottom: 4 }}>Upload Your Resume</div>
                <div style={{ fontSize: 13.5, color: "#94a3b8" }}>Supported: PDF, DOC, DOCX — Max 5MB</div>
              </div>
            </div>
            <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => handleResumeUpload(e.target.files[0])} className="cp-file-input" id="resume-upload" disabled={uploading} />
            <label htmlFor="resume-upload" className="cp-upload-label">
              <Upload size={16} />{uploading ? "Uploading…" : "Choose File"}
            </label>
            {form.resume && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginTop: 16, padding: "12px 18px", background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: 10, color: "#065f46", fontWeight: 600, fontSize: 14 }}>
                <CheckCircle size={16} color="#10b981" />Resume uploaded successfully
              </div>
            )}
          </div>
        );
        case "about": return (
          <div>
            <SectionHeader title="About You" subtitle="Write a compelling summary for recruiters" />
            <Field label="About Me" required>
              <textarea name="about" value={form.about || ""} onChange={handleChange} placeholder="Tell us about yourself…" rows={8} style={{ ...inputStyle, resize: "vertical", minHeight: 180, lineHeight: 1.65 }} className="cp-input" />
            </Field>
          </div>
        );
        case "skills": return (
          <div>
            <SectionHeader title="Skills" subtitle="Add skills that match the roles you're targeting" />
            {selectedSkills.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
                {selectedSkills.map((s, i) => (
                  <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: 100, fontSize: 13, fontWeight: 600, color: "#065f46" }}>
                    {s}
                    <button onClick={() => handleRemoveSkill(s)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: "#065f46", padding: 0 }}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 12 }}>Suggestions</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {skillSuggestions.filter((s) => !selectedSkills.includes(s)).map((skill, i) => (
                  <button key={i} onClick={() => handleAddSkill(skill)} className="cp-suggestion-tag">{skill}</button>
                ))}
              </div>
            </div>
            <Field label="Add Custom Skill" hint="Press Enter to add">
              <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyPress={handleSkillKeyPress} placeholder="Type a skill and press Enter" style={inputStyle} className="cp-input" />
            </Field>
          </div>
        );
        case "education": return (
          <div>
            <SectionHeader title="Education" subtitle="Your highest qualification" />
            <Field label="Highest Education" required>
              <input name="education" value={form.education || ""} onChange={handleChange} placeholder="e.g. Bachelor's in Computer Science" style={inputStyle} className="cp-input" />
            </Field>
          </div>
        );
        case "experience": return (
          <div>
            <SectionHeader title="Work Experience" subtitle="Enter 0 if you're a fresher — this field is required" />
            <Field label="Years of Experience" required>
              <input type="number" name="experience" value={form.experience || ""} onChange={handleChange} placeholder="e.g. 0 for fresher" min={0} style={{ ...inputStyle, maxWidth: 260 }} className="cp-input" />
            </Field>
          </div>
        );
        case "accomplishments": return (
          <div>
            <SectionHeader title="Accomplishments & Initiatives" subtitle="Awards, certifications, projects" />
            <Field label="Accomplishments">
              <textarea name="accomplishments" value={form.accomplishments || ""} onChange={handleChange} placeholder="Share your key achievements…" rows={6} style={{ ...inputStyle, resize: "vertical", minHeight: 160, lineHeight: 1.65 }} className="cp-input" />
            </Field>
          </div>
        );
        default: return null;
        case "references":
  return (
    <div>
      <SectionHeader
        title="References"
        subtitle="Add industry references (optional)"
      />

      {form.references.map((ref, index) => (
        <div key={index} style={{ marginBottom: 16 }}>
          <Field label="Reference Name">
            <input
              value={ref.name}
              onChange={(e) => {
                const updated = [...form.references];
                updated[index].name = e.target.value;
                setForm((p) => ({ ...p, references: updated }));
              }}
              placeholder="Enter name"
              style={inputStyle}
            />
          </Field>

          <Field label="Phone Number">
            <input
              value={ref.phone}
              onChange={(e) => {
                const updated = [...form.references];
                updated[index].phone = e.target.value;
                setForm((p) => ({ ...p, references: updated }));
              }}
              placeholder="Enter phone"
              style={inputStyle}
            />
          </Field>
        </div>
      ))}

      <button
        onClick={() =>
          setForm((p) => ({
            ...p,
            references: [...p.references, { name: "", phone: "" }],
          }))
        }
        className="cp-suggestion-tag"
      >
        + Add Another Reference
      </button>
    </div>
  );
      }
    }

    if (role === "recruiter") {
      switch (currentSection) {
        case "basicDetails": return (
          <div>
            <SectionHeader title="Company Basics" subtitle="Core information about your organisation" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))", gap: 20 }}>
              <Field label="Company Name" required><input name="companyName" value={form.companyName || ""} onChange={handleChange} placeholder="Enter company name" style={inputStyle} className="cp-input" /></Field>
              <Field label="Company Website" required><input name="companyWebsite" value={form.companyWebsite || ""} onChange={handleChange} placeholder="https://example.com" style={inputStyle} className="cp-input" /></Field>
              <Field label="Contact Number" required><input name="contactNumber" value={form.contactNumber || ""} onChange={handleChange} placeholder="Enter contact number" style={inputStyle} className="cp-input" /></Field>
            </div>
          </div>
        );
        case "companyDetails": return (
          <div>
            <SectionHeader title="Company Details" subtitle="Help job seekers understand your company" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))", gap: 20 }}>
              <Field label="Company Description" required fullWidth>
                <textarea name="companyDescription" value={form.companyDescription || ""} onChange={handleChange} placeholder="Describe your company…" rows={4} style={{ ...inputStyle, resize: "vertical", minHeight: 120, lineHeight: 1.65 }} className="cp-input" />
              </Field>
              <Field label="Company Location" required><input name="companyLocation" value={form.companyLocation || ""} onChange={handleChange} placeholder="Enter location" style={inputStyle} className="cp-input" /></Field>
              <Field label="Industry Type" required><input name="industryType" value={form.industryType || ""} onChange={handleChange} placeholder="e.g. Technology" style={inputStyle} className="cp-input" /></Field>
            </div>
          </div>
        );
        case "branding": return (
          <div>
            <SectionHeader title="Branding" subtitle="Upload your company logo" />

            {/* Logo — opens cropper */}
            <Field label="Company Logo" required>
              <input
                type="file" accept="image/*"
                className="cp-file-input" id="logo-upload"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setLogoRawSrc(URL.createObjectURL(file));
                  setLogoCropOpen(true);
                  e.target.value = "";
                }}
              />
              <label htmlFor="logo-upload" className="cp-upload-label">
                <Upload size={16} />{uploading ? "Uploading…" : "Choose Logo"}
              </label>
            </Field>
            {form.companyLogo && (
              <img src={form.companyLogo} alt="Logo" style={{ width: 120, height: 120, objectFit: "contain", marginTop: 16, borderRadius: 12, border: "1px solid #e2e8f0", padding: 8, background: "#f8fafc" }} />
            )}

            {/* Avatar — opens cropper */}
            <div style={{ marginTop: 24 }}>
              <Field label="Personal Profile Picture">
                <input
                  type="file" accept="image/*"
                  className="cp-file-input" id="avatar-upload"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setAvatarRawSrc(URL.createObjectURL(file));
                    setAvatarCropOpen(true);
                    e.target.value = "";
                  }}
                />
                <label htmlFor="avatar-upload" className="cp-upload-label">
                  <Camera size={16} style={{ marginRight: 8 }} />{uploading ? "Uploading…" : "Choose Profile Picture"}
                </label>
              </Field>
              {form.profilePicture && (
                <div style={{ marginTop: 12, width: 80, height: 80 }}>
                  <img src={form.profilePicture} alt="Avatar" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: "50%", border: "2px solid #10b981" }} />
                </div>
              )}
            </div>
          </div>
        );
        default: return null;
      }
    }

    if (role === "business") {
      switch (currentSection) {
        case "basicDetails": return (
          <div>
            <SectionHeader title="Business Info" subtitle="Basic information about your business" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))", gap: 20 }}>
              <Field label="Business Name" required><input name="businessName" value={form.businessName || ""} onChange={handleChange} placeholder="Enter business name" style={inputStyle} className="cp-input" /></Field>
              <Field label="Category" required><input name="category" value={form.category || ""} onChange={handleChange} placeholder="e.g. Restaurant, Retail" style={inputStyle} className="cp-input" /></Field>
              <Field label="Phone Number" required>
                <input type="tel" name="contactDetails" value={form.contactDetails || ""} onChange={handleChange} placeholder="e.g. +91 9876543210" style={inputStyle} className="cp-input" />
              </Field>
            </div>
          </div>
        );
        case "businessDetails": return (
          <div>
            <SectionHeader title="Business Details" subtitle="Location and description" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))", gap: 20 }}>
              <Field label="Street Address" required fullWidth><input name="street" value={form.street || ""} onChange={handleChange} placeholder="House no., Street, Area" style={inputStyle} className="cp-input" /></Field>
              <Field label="City" required><input name="city" value={form.city || ""} onChange={handleChange} placeholder="e.g. Mumbai" style={inputStyle} className="cp-input" /></Field>
              <Field label="State" required><input name="state" value={form.state || ""} onChange={handleChange} placeholder="e.g. Maharashtra" style={inputStyle} className="cp-input" /></Field>
              <Field label="Pincode" required><input name="pincode" value={form.pincode || ""} onChange={handleChange} placeholder="e.g. 400001" maxLength={10} style={inputStyle} className="cp-input" /></Field>
              <Field label="Description" required fullWidth>
                <textarea name="description" value={form.description || ""} onChange={handleChange} placeholder="Describe your business…" rows={4} style={{ ...inputStyle, resize: "vertical", minHeight: 120, lineHeight: 1.65 }} className="cp-input" />
              </Field>
            </div>
            {(form.street || form.city || form.state || form.pincode) && (
              <div style={{ marginTop: 16, padding: "12px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, fontSize: 13, color: "#15803d", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15 }}>📍</span>
                <span><strong>Address Preview: </strong>{[form.street, form.city, form.state, form.pincode].filter(Boolean).join(", ")}</span>
              </div>
            )}
          </div>
        );
        case "media": return (
          <div>
            <SectionHeader title="Business Media" subtitle="Upload high-quality images of your business (max 5)" />
            <div style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)", borderRadius: 16, padding: "24px 28px", display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
              <div style={{ width: 48, height: 48, background: "rgba(16,185,129,0.2)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Image size={24} color="#10b981" />
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "white", marginBottom: 3 }}>Upload Business Images</div>
                <div style={{ fontSize: 13, color: "#94a3b8" }}>Up to 5 images — Max 5MB each</div>
              </div>
            </div>

            {/* Business images — opens cropper */}
            <input
              type="file" accept="image/*" multiple
              className="cp-file-input" id="business-images"
              disabled={uploading || bizCropOpen}
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (!files.length) return;
                const [first, ...rest] = files;
                setBizRawSrc(URL.createObjectURL(first));
                setBizCropQueue(rest);
                setBizCropOpen(true);
                e.target.value = "";
              }}
            />
            <label htmlFor="business-images" className="cp-upload-label">
              <Upload size={16} />{uploading ? "Uploading…" : "Choose Images"}
            </label>

            {form.images?.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 12 }}>
                  Uploaded ({form.images.length}/5)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px,1fr))", gap: 12 }}>
                  {form.images.map((url, i) => (
                    <div key={i} style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: "1px solid #e2e8f0" }}>
                      <img src={url} alt={`Business ${i + 1}`} style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }} />
                      <button
                        onClick={() => setForm((p) => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }))}
                        style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, background: "rgba(15,23,42,0.75)", border: "none", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}
                        className="cp-remove-img"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Avatar — opens cropper */}
            <div style={{ marginTop: 24 }}>
              <Field label="Personal Profile Picture">
                <input
                  type="file" accept="image/*"
                  className="cp-file-input" id="avatar-upload-biz"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setAvatarRawSrc(URL.createObjectURL(file));
                    setAvatarCropOpen(true);
                    e.target.value = "";
                  }}
                />
                <label htmlFor="avatar-upload-biz" className="cp-upload-label">
                  <Camera size={16} style={{ marginRight: 8 }} />{uploading ? "Uploading…" : "Choose Profile Picture"}
                </label>
              </Field>
              {form.profilePicture && (
                <div style={{ marginTop: 12, width: 80, height: 80 }}>
                  <img src={form.profilePicture} alt="Avatar" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: "50%", border: "2px solid #10b981" }} />
                </div>
              )}
            </div>
          </div>
        );
        default: return null;
      }
    }
    return null;
  };

  const currentIdx    = allSections.findIndex((s) => s.id === currentSection);
  const hasNextSection = currentIdx < allSections.length - 1;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .cp-root { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #f8fafc; min-height: 100vh; color: #0f172a; }
        .cp-layout { display: grid; grid-template-columns: 288px 1fr; max-width: 100%; margin: 0 auto; min-height: calc(100vh - 82px); }
        .cp-sidebar { background: white; border-right: 1px solid #e2e8f0; padding: 24px 16px; overflow-y: auto; position: sticky; top: 82px; height: calc(100vh - 82px); }
        .cp-sidebar::-webkit-scrollbar { width: 5px; }
        .cp-sidebar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }
        .cp-enhance-card { background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 1.5px solid #bbf7d0; border-radius: 14px; padding: 18px 16px; margin-bottom: 20px; }
        .cp-enhance-card h3 { font-size: 13.5px; font-weight: 700; color: #0f172a; margin-bottom: 5px; }
        .cp-enhance-card p { font-size: 12.5px; color: #64748b; line-height: 1.55; }
        .cp-overall-progress { padding: 16px 8px 4px; }
        .cp-progress-label { display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
        .cp-progress-track { height: 5px; background: #e2e8f0; border-radius: 100px; overflow: hidden; }
        .cp-progress-fill { height: 100%; background: linear-gradient(90deg, #10b981 0%, #059669 100%); border-radius: 100px; transition: width 0.5s ease; }
        .cp-nav { display: flex; flex-direction: column; gap: 3px; margin-bottom: 8px; }
        .cp-nav-item { display: flex; align-items: center; gap: 11px; padding: 11px 12px; border-radius: 10px; background: none; border: none; cursor: pointer; width: 100%; text-align: left; font-family: 'Inter', sans-serif; transition: all 0.18s; }
        .cp-nav-item:hover { background: #f8fafc; }
        .cp-nav-item.active { background: #f0fdf4; border-left: 3px solid #10b981; padding-left: 9px; }
        .cp-nav-icon { width: 34px; height: 34px; border-radius: 9px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #94a3b8; transition: all 0.18s; }
        .cp-nav-item.active .cp-nav-icon { background: #d1fae5; color: #10b981; }
        .cp-nav-item.complete .cp-nav-icon { background: #d1fae5; color: #10b981; }
        .cp-nav-text { flex: 1; min-width: 0; }
        .cp-nav-label { font-size: 13.5px; font-weight: 600; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cp-nav-item.active .cp-nav-label { color: #065f46; }
        .cp-nav-sub { display: flex; align-items: center; gap: 6px; margin-top: 2px; }
        .cp-nav-prog-track { flex: 1; height: 3px; background: #e2e8f0; border-radius: 100px; overflow: hidden; }
        .cp-nav-prog-fill { height: 100%; background: #10b981; border-radius: 100px; transition: width 0.4s; }
        .cp-nav-badge { padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 700; background: #fef3c7; color: #92400e; flex-shrink: 0; }
        .cp-nav-badge.optional { background: #f1f5f9; color: #64748b; }
        .cp-nav-check { flex-shrink: 0; }
        .cp-main { padding: 36px 40px 100px; background: #f8fafc; max-width: 100%; width: 100%; }
        .cp-section-card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px 28px 32px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); animation: fadeUp 0.35s ease; }
        .cp-section-card:hover { border-color: #bbf7d0; box-shadow: 0 4px 20px rgba(16,185,129,0.07); transition: all 0.2s; }
        .cp-input:focus { border-color: #6ee7b7 !important; background: white !important; box-shadow: 0 0 0 3px rgba(16,185,129,0.10) !important; }
        .cp-input::placeholder { color: #94a3b8 !important; }
        .cp-file-input { display: none; }
        .cp-upload-label { display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; background: #0f172a; color: white; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif; }
        .cp-upload-label:hover { background: #10b981; box-shadow: 0 4px 14px rgba(16,185,129,0.35); transform: translateY(-1px); }
        .cp-suggestion-tag { padding: 5px 13px; border-radius: 100px; font-size: 12.5px; font-weight: 600; cursor: pointer; border: 1.5px dashed #e2e8f0; background: white; color: #64748b; font-family: 'Inter', sans-serif; transition: all 0.18s; }
        .cp-suggestion-tag:hover { background: #d1fae5; border-color: #6ee7b7; color: #065f46; border-style: solid; }
        .cp-remove-img:hover { background: rgba(220,38,38,0.8) !important; }
        .cp-action-bar { position: fixed; bottom: 0; left: 288px; right: 0; background: white; border-top: 1px solid #e2e8f0; padding: 14px 40px; display: flex; align-items: center; justify-content: space-between; gap: 16px; box-shadow: 0 -4px 16px rgba(0,0,0,0.06); z-index: 50; }
        .cp-action-meta { font-size: 13px; color: #94a3b8; font-weight: 500; }
        .cp-action-btns { display: flex; align-items: center; gap: 10px; }
        .cp-next-btn { display: inline-flex; align-items: center; gap: 9px; padding: 11px 24px; background: #0f172a; color: white; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.2s; }
        .cp-next-btn:hover:not(:disabled) { background: #1e293b; transform: translateY(-1px); }
        .cp-next-btn:disabled { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; transform: none; }
        .cp-save-btn { display: inline-flex; align-items: center; gap: 10px; padding: 11px 28px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.2s; box-shadow: 0 4px 14px rgba(16,185,129,0.35); }
        .cp-save-btn:hover:not(:disabled) { background: linear-gradient(135deg, #059669 0%, #047857 100%); box-shadow: 0 6px 20px rgba(16,185,129,0.45); transform: translateY(-1px); }
        .cp-save-btn:disabled { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; box-shadow: none; transform: none; }
        .cp-incomplete-pill { display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px; border-radius: 100px; background: #fef3c7; color: #92400e; font-size: 12px; font-weight: 700; }
        @media (max-width: 960px) {
          .cp-layout { grid-template-columns: 1fr; }
          .cp-sidebar { position: static; height: auto; border-right: none; border-bottom: 1px solid #e2e8f0; }
          .cp-nav { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px,1fr)); }
          .cp-nav-item.active { border-left: none; border-bottom: 3px solid #10b981; padding-left: 12px; }
          .cp-main { max-width: 100%; padding: 24px 20px 100px; }
          .cp-action-bar { left: 0; padding: 12px 20px; }
        }
        @media (max-width: 640px) {
          .cp-nav { grid-template-columns: 1fr 1fr; }
          .cp-nav-label { font-size: 12px; }
          .cp-main { padding: 16px 16px 100px; }
          .cp-section-card { padding: 20px 16px; }
          .cp-action-meta { display: none; }
        }
      `}</style>

      <Navbar />
      <div className="cp-root">
        <div className="cp-layout">

          {/* ── Sidebar ── */}
          <aside className="cp-sidebar">
            <div className="cp-enhance-card">
              <h3>Enhance your Profile</h3>
              <p>Stay ahead of the competition by keeping your profile complete and up to date.</p>
            </div>
            <nav className="cp-nav">
              {allSections.map((sec) => {
                const Icon     = sec.icon;
                const prog     = getSectionProgress(sec.id);
                const isComplete = prog === 100;
                const isActive   = currentSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setCurrentSection(sec.id)}
                    className={["cp-nav-item", isActive ? "active" : "", isComplete ? "complete" : ""].join(" ").trim()}
                  >
                    <div className="cp-nav-icon">
                      {isComplete ? <CheckCircle size={17} /> : <Icon size={17} />}
                    </div>
                    <div className="cp-nav-text">
                      <div className="cp-nav-label">{sec.label}</div>
                      <div className="cp-nav-sub">
                        <div className="cp-nav-prog-track">
                          <div className="cp-nav-prog-fill" style={{ width: `${prog}%` }} />
                        </div>
                        {sec.required
                          ? !isComplete && <span className="cp-nav-badge">Required</span>
                          : <span className="cp-nav-badge optional">Optional</span>}
                      </div>
                    </div>
                    {isActive && <ChevronRight size={14} color="#10b981" className="cp-nav-check" />}
                  </button>
                );
              })}
            </nav>
            <div className="cp-overall-progress">
              <div className="cp-progress-label">
                <span>Overall Progress</span>
                <span style={{ color: overallProgress >= 80 ? "#10b981" : "#94a3b8" }}>{overallProgress}%</span>
              </div>
              <div className="cp-progress-track">
                <div className="cp-progress-fill" style={{ width: `${overallProgress}%` }} />
              </div>
              {incompleteSections.length > 0 && (
                <div style={{ marginTop: 12, fontSize: 12, color: "#94a3b8" }}>
                  {incompleteSections.length} required section{incompleteSections.length > 1 ? "s" : ""} remaining
                </div>
              )}
            </div>
          </aside>

          {/* ── Main ── */}
          <main className="cp-main">
            <div className="cp-section-card">{renderSection()}</div>
          </main>
        </div>

        {/* ── Action bar ── */}
        <div className="cp-action-bar">
          <div className="cp-action-meta" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span><strong>{overallProgress}%</strong> complete</span>
            {incompleteSections.length > 0 && (
              <span className="cp-incomplete-pill">{incompleteSections.length} section{incompleteSections.length > 1 ? "s" : ""} left</span>
            )}
          </div>
          <div className="cp-action-btns">
            {hasNextSection && (
              <button
                className="cp-next-btn"
                onClick={handleSaveAndNext}
                disabled={uploading || (allSections.find(s => s.id === currentSection)?.required && getSectionProgress(currentSection) < 100)}
              >
                {nextSectionLabel ? `Next: ${nextSectionLabel}` : "Next Section"}
                <ArrowRight size={16} />
              </button>
            )}
            <button className="cp-save-btn" onClick={handleSubmit} disabled={overallProgress < 100 || uploading}>
              <CheckCircle size={16} />
              {uploading ? "Saving…" : overallProgress < 100 ? "Complete required fields" : "Save & Complete Profile"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Logo crop modal (1:1 square) ── */}
      <ImageCropperModal
        isOpen={logoCropOpen}
        onClose={() => setLogoCropOpen(false)}
        onCrop={(blob) => handleLogoCropDone(blob)}
        imageSrc={logoRawSrc}
        aspectRatio={1}
        cropShape="rect"
        title="Crop Company Logo"
        hint="Square crop looks best for logos"
      />

      {/* ── Avatar crop modal (circle 1:1) ── */}
      <ImageCropperModal
        isOpen={avatarCropOpen}
        onClose={() => setAvatarCropOpen(false)}
        onCrop={(blob) => handleAvatarCropDone(blob)}
        imageSrc={avatarRawSrc}
        aspectRatio={1}
        cropShape="circle"
        title="Crop Profile Picture"
        hint="Drag to reposition · scroll to zoom"
      />

      {/* ── Business image crop modal (freeform) ── */}
      <ImageCropperModal
        isOpen={bizCropOpen}
        onClose={() => { setBizCropOpen(false); setBizCropQueue([]); }}
        onCrop={(blob) => handleBizCropDone(blob)}
        imageSrc={bizRawSrc}
        aspectRatio={4 / 3}
        cropShape="rect"
        title="Crop Business Image"
        hint={bizCropQueue.length > 0 ? `${bizCropQueue.length} more image(s) after this` : "Crop then click Apply"}
      />
    </>
  );
};

export default CompleteProfile;