import React, { useState } from "react";

const GoogleRoleModal = ({ onSubmit }) => {
  const [role, setRole] = useState("");

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: "#052e16", marginBottom: 8, letterSpacing: "-0.3px" }}>
          Select Your Role
        </h3>
        <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>
          Please select a role to complete signup
        </p>

        <select
          className="input"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={{
            marginBottom: "20px",
            width: "100%",
            padding: "12px 14px",
            border: "1.5px solid #d1fae5",
            borderRadius: 10,
            fontSize: 14,
            fontFamily: "Inter, sans-serif",
            color: role ? "#052e16" : "#9ca3af",
            background: "white",
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="">Select role</option>
          <option value="jobseeker">Job Seeker</option>
          <option value="recruiter">Recruiter</option>
          <option value="business">Business Owner</option>
        </select>

        <button
          className="btn btn-primary"
          disabled={!role}
          onClick={() => onSubmit(role)}
          style={{
            width: "100%",
            padding: "13px",
            background: role ? "#052e16" : "#d1fae5",
            color: role ? "white" : "#9ca3af",
            border: "none",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 700,
            fontFamily: "Inter, sans-serif",
            cursor: role ? "pointer" : "not-allowed",
            transition: "all 0.2s",
          }}
        >
          Continue →
        </button>
      </div>
    </div>
  );
};

const overlayStyle = {
  position: "fixed",
  top: 0, left: 0, right: 0, bottom: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
  backdropFilter: "blur(4px)",
};

const modalStyle = {
  background: "#fff",
  padding: "32px",
  borderRadius: "14px",
  width: "100%",
  maxWidth: "400px",
  boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
  border: "1px solid #d1fae5",
};

export default GoogleRoleModal;