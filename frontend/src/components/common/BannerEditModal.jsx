import React, { useState, useRef } from "react";
import apiClient from "../../api/apiClient"; // adjust path if needed

const SIZE_PRESETS = [
  { label: "Small",  value: "50px",  desc: "Compact, minimal look" },
  { label: "Medium", value: "75px",  desc: "Balanced, default size" },
  { label: "Large",  value: "100px", desc: "Bold, prominent display" },
];

const BannerEditModal = ({ isOpen, banner, onClose, onSave, isLoading }) => {
  const [formData, setFormData] = useState({
    imageUrl:     banner?.imageUrl     || "",
    altText:      banner?.altText      || "Navbar Banner",
    height:       banner?.height       || "75px",
    borderRadius: banner?.borderRadius || "8px",
  });

  const [tab,            setTab]            = useState("upload");
  const [dragOver,       setDragOver]       = useState(false);
  const [uploading,      setUploading]      = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedUrl,    setUploadedUrl]    = useState("");
  const [error,          setError]          = useState("");
  const [success,        setSuccess]        = useState("");

  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
  };

  /* ── Upload file directly (no cropper) ── */
  const uploadFile = async (file) => {
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) { setError("Only PNG, JPEG, WEBP, or GIF images are allowed."); return; }
    if (file.size > 5 * 1024 * 1024)  { setError("File size must be under 5MB."); return; }

    setError("");
    setUploading(true);
    setUploadProgress(10);

    /* Show local preview immediately */
    const localUrl = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, imageUrl: localUrl }));
    setUploadedUrl("");

    try {
      const fd = new FormData();
      fd.append("bannerImage", file, file.name);

      const ticker = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 12, 85));
      }, 300);

      const res = await apiClient.post("/admin/navbar-banner/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      clearInterval(ticker);
      setUploadProgress(100);

      const url = res.data?.imageUrl;
      setUploadedUrl(url);
      setFormData(prev => ({ ...prev, imageUrl: url }));
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed. Please try again.");
      setFormData(prev => ({ ...prev, imageUrl: banner?.imageUrl || "" }));
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 800);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadFile(file);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    uploadFile(file);
  };

  /* ── Final save ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.imageUrl.trim()) { setError("Please upload an image first."); return; }

    try {
      await onSave(formData);
      setSuccess("Banner updated successfully!");
      setTimeout(() => { setSuccess(""); onClose(); }, 1800);
    } catch (err) {
      setError(err.message || "Failed to update banner");
    }
  };

  const radiusPresets = [
    { label: "None",   value: "0px"   },
    { label: "Small",  value: "4px"   },
    { label: "Medium", value: "8px"   },
    { label: "Large",  value: "16px"  },
    { label: "Pill",   value: "999px" },
  ];

  if (!isOpen) return null;

  const previewUrl = formData.imageUrl;

  return (
    <div className="bem-overlay" onClick={onClose}>
      <style>{`
        .bem-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          z-index: 10000;
          animation: bemFadeIn 0.22s ease;
        }
        @keyframes bemFadeIn { from { opacity: 0; } to { opacity: 1; } }

        .bem-modal {
          background: white; border-radius: 20px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.25);
          width: 92%; max-width: 580px; max-height: 92vh;
          overflow-y: auto;
          animation: bemSlideUp 0.28s cubic-bezier(0.16,1,0.3,1);
          display: flex; flex-direction: column;
        }
        @keyframes bemSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }

        .bem-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 22px 24px 18px;
          border-bottom: 1px solid #f0f0f0;
          background: linear-gradient(to right, #f8fffe, white);
          flex-shrink: 0;
        }
        .bem-header-left { display: flex; align-items: center; gap: 12px; }
        .bem-icon-wrap {
          width: 38px; height: 38px; border-radius: 10px;
          background: linear-gradient(135deg, #10b981, #059669);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(16,185,129,0.3); flex-shrink: 0;
        }
        .bem-title    { font-size: 18px; font-weight: 800; color: #111827; letter-spacing: -0.3px; }
        .bem-subtitle { font-size: 12px; color: #9ca3af; margin-top: 1px; }
        .bem-close {
          width: 36px; height: 36px; border-radius: 9px;
          background: #f4f4f5; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: #6b7280; transition: all 0.15s; font-size: 16px; flex-shrink: 0;
        }
        .bem-close:hover { background: #fde8e8; color: #dc2626; }

        .bem-tabs {
          display: flex; gap: 0; border-bottom: 1px solid #f0f0f0;
          padding: 0 24px; background: #fafafa; flex-shrink: 0;
        }
        .bem-tab {
          padding: 12px 18px; font-size: 13.5px; font-weight: 600;
          color: #9ca3af; cursor: pointer; border: none; background: none;
          border-bottom: 2.5px solid transparent; margin-bottom: -1px;
          transition: all 0.15s; font-family: inherit; white-space: nowrap;
        }
        .bem-tab.active { color: #10b981; border-bottom-color: #10b981; }
        .bem-tab:hover:not(.active) { color: #374151; }

        .bem-body { padding: 24px; flex: 1; }

        /* ── Dropzone ── */
        .bem-dropzone {
          border: 2px dashed #d1d5db; border-radius: 14px;
          padding: 32px 24px; text-align: center; cursor: pointer;
          transition: all 0.2s; background: #fafafa; position: relative;
          user-select: none;
        }
        .bem-dropzone:hover, .bem-dropzone.dragover { border-color: #10b981; background: #f0fdf4; }
        .bem-dropzone.uploading { border-color: #10b981; background: #f0fdf4; cursor: wait; }
        .bem-drop-icon {
          width: 52px; height: 52px; margin: 0 auto 12px;
          background: #f0fdf4; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
        }
        .bem-drop-title { font-size: 15px; font-weight: 700; color: #111827; margin-bottom: 5px; }
        .bem-drop-sub   { font-size: 12.5px; color: #9ca3af; }
        .bem-drop-btn {
          display: inline-flex; align-items: center; gap: 7px; margin-top: 14px;
          padding: 9px 18px; border-radius: 9px; font-size: 13px; font-weight: 700;
          background: white; border: 1.5px solid #d1d5db; cursor: pointer; color: #374151;
          transition: all 0.15s; font-family: inherit;
        }
        .bem-drop-btn:hover { border-color: #10b981; color: #10b981; background: #f0fdf4; }
        .bem-hidden-input { display: none; }

        /* ── Size presets ── */
        .bem-size-picker { margin-top: 20px; }
        .bem-size-picker-label {
          font-size: 11px; font-weight: 700; color: #374151;
          text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 10px; display: block;
        }
        .bem-size-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .bem-size-card {
          border: 2px solid #e5e7eb; border-radius: 12px; padding: 14px 12px;
          cursor: pointer; transition: all 0.18s; text-align: center;
          background: white; font-family: inherit;
        }
        .bem-size-card:hover { border-color: #6ee7b7; background: #f0fdf4; }
        .bem-size-card.active { border-color: #10b981; background: #f0fdf4; box-shadow: 0 0 0 3px rgba(16,185,129,0.12); }
        .bem-size-card-preview {
          width: 100%; background: #e2e8f0; border-radius: 5px; margin: 0 auto 8px;
          transition: height 0.2s;
        }
        .bem-size-label { font-size: 13px; font-weight: 700; color: #111827; }
        .bem-size-desc  { font-size: 11px; color: #9ca3af; margin-top: 2px; }
        .bem-size-px    {
          display: inline-block; margin-top: 5px;
          padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 700;
          background: #f0fdf4; color: #065f46;
        }
        .bem-size-card.active .bem-size-px { background: #10b981; color: white; }

        /* ── Progress ── */
        .bem-progress-wrap { margin-top: 16px; }
        .bem-progress-bar  { height: 6px; background: #e5e7eb; border-radius: 99px; overflow: hidden; }
        .bem-progress-fill {
          height: 100%; background: linear-gradient(90deg, #10b981, #059669);
          border-radius: 99px; transition: width 0.3s ease;
        }
        .bem-progress-label { font-size: 12px; color: #6b7280; margin-top: 6px; text-align: center; font-weight: 500; }

        .bem-upload-success {
          margin-top: 14px; padding: 11px 14px; border-radius: 10px;
          background: #f0fdf4; border: 1px solid #bbf7d0;
          display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: #065f46;
        }
        .bem-upload-url { font-size: 11px; color: #6b7280; word-break: break-all; flex: 1; }

        /* ── Fields ── */
        .bem-field { margin-bottom: 20px; }
        .bem-field:last-child { margin-bottom: 0; }
        .bem-label {
          display: block; font-size: 12px; font-weight: 700; color: #374151;
          margin-bottom: 7px; text-transform: uppercase; letter-spacing: 0.5px;
        }
        .bem-input {
          width: 100%; padding: 11px 14px; border: 1.5px solid #e5e7eb;
          border-radius: 10px; font-size: 14px; font-family: inherit;
          transition: all 0.18s; box-sizing: border-box; color: #111827;
        }
        .bem-input:focus { outline: none; border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }

        .bem-presets { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
        .bem-preset {
          padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;
          cursor: pointer; border: 1.5px solid #e5e7eb; background: white; color: #6b7280;
          transition: all 0.13s; font-family: inherit;
        }
        .bem-preset.active  { background: #f0fdf4; border-color: #10b981; color: #065f46; }
        .bem-preset:hover:not(.active) { border-color: #9ca3af; color: #374151; }

        .bem-style-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

        /* ── Preview ── */
        .bem-preview-section {
          margin-top: 20px; padding: 16px; border-radius: 12px;
          background: #f8fafc; border: 1px solid #e5e7eb;
        }
        .bem-preview-label { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
        .bem-preview-frame {
          background: white; border: 1px solid #e5e7eb; border-radius: 8px;
          padding: 10px 20px; display: flex; align-items: center; justify-content: center; min-height: 60px;
        }
        .bem-preview-frame img { object-fit: contain; max-width: 100%; }
        .bem-preview-empty { color: #d1d5db; font-size: 13px; font-weight: 500; }

        /* ── Alerts ── */
        .bem-alert {
          padding: 11px 15px; border-radius: 9px; font-size: 13.5px; font-weight: 500;
          margin-bottom: 16px; display: flex; align-items: center; gap: 8px;
          animation: bemAlertIn 0.2s ease;
        }
        @keyframes bemAlertIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .bem-alert.error   { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
        .bem-alert.success { background: #f0fdf4; color: #15803d; border: 1px solid #86efac; }

        /* ── Footer ── */
        .bem-footer {
          display: flex; align-items: center; gap: 12px; justify-content: flex-end;
          padding: 18px 24px; border-top: 1px solid #f0f0f0;
          background: #fafafa; flex-shrink: 0;
        }
        .bem-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 20px; border-radius: 10px; font-size: 14px; font-weight: 700;
          cursor: pointer; transition: all 0.18s; border: none; font-family: inherit;
        }
        .bem-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .bem-btn-cancel { background: white; color: #374151; border: 1.5px solid #d1d5db; }
        .bem-btn-cancel:hover:not(:disabled) { background: #f9fafb; border-color: #9ca3af; }
        .bem-btn-save {
          background: linear-gradient(135deg, #16a34a, #10b981);
          color: white; box-shadow: 0 3px 10px rgba(16,185,129,0.3);
        }
        .bem-btn-save:hover:not(:disabled) {
          background: linear-gradient(135deg, #15803d, #059669);
          box-shadow: 0 5px 16px rgba(16,185,129,0.4); transform: translateY(-1px);
        }
        .bem-spinner {
          width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.35);
          border-top-color: white; border-radius: 50%;
          animation: bemSpin 0.7s linear infinite;
        }
        @keyframes bemSpin { to { transform: rotate(360deg); } }

        @media (max-width: 540px) {
          .bem-modal     { width: 98%; border-radius: 14px; }
          .bem-size-cards { grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
          .bem-style-row  { grid-template-columns: 1fr; }
          .bem-footer    { flex-direction: column; }
          .bem-btn       { width: 100%; justify-content: center; }
        }
      `}</style>

      <div className="bem-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bem-header">
          <div className="bem-header-left">
            <div className="bem-icon-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
              </svg>
            </div>
            <div>
              <div className="bem-title">Edit Navbar Banner</div>
              <div className="bem-subtitle">Upload your banner image and choose a display size</div>
            </div>
          </div>
          <button className="bem-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Tabs */}
        <div className="bem-tabs">
          <button className={`bem-tab${tab === "upload" ? " active" : ""}`} onClick={() => setTab("upload")}>
            Upload Image
          </button>
          <button className={`bem-tab${tab === "style" ? " active" : ""}`} onClick={() => setTab("style")}>
            Style
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bem-body">

            {error   && <div className="bem-alert error">⚠️ {error}</div>}
            {success && <div className="bem-alert success">✅ {success}</div>}

            {/* ── Upload Tab ── */}
            {tab === "upload" && (
              <>
                {/* Dropzone */}
                <div
                  className={`bem-dropzone${dragOver ? " dragover" : ""}${uploading ? " uploading" : ""}`}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  <div className="bem-drop-icon">
                    {uploading ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "bemSpin 1s linear infinite" }}>
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                      </svg>
                    )}
                  </div>
                  <div className="bem-drop-title">
                    {uploading ? "Uploading…" : "Drop your banner image here"}
                  </div>
                  <div className="bem-drop-sub">
                    {uploading ? "Please wait" : "PNG, JPEG, WEBP, GIF · Max 5MB"}
                  </div>
                  {!uploading && (
                    <button type="button" className="bem-drop-btn">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      Browse File
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="bem-hidden-input"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                    onChange={handleFileInputChange}
                  />
                </div>

                {/* Progress bar */}
                {uploadProgress > 0 && (
                  <div className="bem-progress-wrap">
                    <div className="bem-progress-bar">
                      <div className="bem-progress-fill" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <div className="bem-progress-label">
                      {uploadProgress < 100 ? `Uploading… ${uploadProgress}%` : "Upload complete ✓"}
                    </div>
                  </div>
                )}

                {/* Upload success */}
                {uploadedUrl && !uploading && (
                  <div className="bem-upload-success">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 2 }}>Uploaded successfully</div>
                      <div className="bem-upload-url">{uploadedUrl}</div>
                    </div>
                  </div>
                )}

                {/* ── Size picker ── */}
                <div className="bem-size-picker">
                  <span className="bem-size-picker-label">Display Size</span>
                  <div className="bem-size-cards">
                    {SIZE_PRESETS.map(preset => {
                      const previewH = preset.value === "50px" ? 18 : preset.value === "75px" ? 28 : 38;
                      return (
                        <button
                          key={preset.value}
                          type="button"
                          className={`bem-size-card${formData.height === preset.value ? " active" : ""}`}
                          onClick={() => setFormData(prev => ({ ...prev, height: preset.value }))}
                        >
                          <div
                            className="bem-size-card-preview"
                            style={{
                              height: previewH,
                              background: formData.height === preset.value
                                ? "linear-gradient(135deg, #bbf7d0, #6ee7b7)"
                                : "#e2e8f0",
                            }}
                          />
                          <div className="bem-size-label">{preset.label}</div>
                          <div className="bem-size-desc">{preset.desc}</div>
                          <span className="bem-size-px">{preset.value}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Alt text */}
                <div className="bem-field" style={{ marginTop: 20 }}>
                  <label className="bem-label">Alt Text (Accessibility)</label>
                  <input
                    name="altText"
                    type="text"
                    className="bem-input"
                    value={formData.altText}
                    onChange={handleChange}
                    placeholder="e.g. GreenJobs Navbar Banner"
                  />
                </div>
              </>
            )}

            {/* ── Style Tab ── */}
            {tab === "style" && (
              <div className="bem-style-row">
                {/* Height */}
                <div className="bem-field">
                  <label className="bem-label">Height</label>
                  <input
                    name="height"
                    type="text"
                    className="bem-input"
                    value={formData.height}
                    onChange={handleChange}
                    placeholder="75px"
                  />
                  <div className="bem-presets">
                    {SIZE_PRESETS.map(p => (
                      <button
                        key={p.value} type="button"
                        className={`bem-preset${formData.height === p.value ? " active" : ""}`}
                        onClick={() => setFormData(prev => ({ ...prev, height: p.value }))}
                      >
                        {p.label}<br /><span style={{ fontSize: 10, opacity: 0.7 }}>{p.value}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      className={`bem-preset${formData.height === "130px" ? " active" : ""}`}
                      onClick={() => setFormData(prev => ({ ...prev, height: "130px" }))}
                    >
                      XL<br /><span style={{ fontSize: 10, opacity: 0.7 }}>130px</span>
                    </button>
                  </div>
                </div>
                {/* Border Radius */}
                <div className="bem-field">
                  <label className="bem-label">Border Radius</label>
                  <input
                    name="borderRadius"
                    type="text"
                    className="bem-input"
                    value={formData.borderRadius}
                    onChange={handleChange}
                    placeholder="8px"
                  />
                  <div className="bem-presets">
                    {radiusPresets.map(p => (
                      <button
                        key={p.value} type="button"
                        className={`bem-preset${formData.borderRadius === p.value ? " active" : ""}`}
                        onClick={() => setFormData(prev => ({ ...prev, borderRadius: p.value }))}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Live preview */}
            <div className="bem-preview-section">
              <div className="bem-preview-label">Live Preview</div>
              <div className="bem-preview-frame">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={formData.altText}
                    style={{
                      height: formData.height || "75px",
                      borderRadius: formData.borderRadius || "8px",
                      maxWidth: "100%",
                      objectFit: "contain",
                    }}
                    onError={e => { e.target.style.display = "none"; }}
                  />
                ) : (
                  <span className="bem-preview-empty">Upload an image to preview</span>
                )}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="bem-footer">
            <button type="button" className="bem-btn bem-btn-cancel" onClick={onClose}>Cancel</button>
            <button
              type="submit"
              className="bem-btn bem-btn-save"
              disabled={isLoading || uploading || !formData.imageUrl}
            >
              {isLoading ? <><span className="bem-spinner" /> Saving…</> : "Save Banner"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default BannerEditModal;