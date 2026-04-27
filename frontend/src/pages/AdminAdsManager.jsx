import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Loader2,
  Image, ExternalLink, X, Check, AlertCircle, Megaphone, ToggleLeft, ToggleRight,
  ChevronUp, ChevronDown, AlertTriangle, Info, Scissors,
} from "lucide-react";
import toast from "react-hot-toast";
import API_BASE_URL from "../config/api";
import ImageCropperModal from "../components/common/ImageCropperModal";

const ACCENT_PRESETS = [
  "#10b981","#3b82f6","#f59e0b","#ef4444","#8b5cf6",
  "#06b6d4","#f97316","#ec4899","#14b8a6","#6366f1",
];

const BANNER_TYPES = [
  { value: "spotlight",   label: "Spotlight Card", desc: "Small card in the rotating spotlight section" },
  { value: "full_banner", label: "Full Banner",    desc: "Large hero-style banner displayed prominently" },
];

// Recommended dimensions per ad type
const RECOMMENDED = {
  spotlight:   { w: 800,  h: 450,  ratio: 800/450,  label: "800×450px (16:9)" },
  full_banner: { w: 1440, h: 480,  ratio: 1440/480, label: "1440×480px (3:1)"  },
};

// Aspect ratios for the cropper
const CROP_ASPECT = {
  spotlight:   16 / 9,
  full_banner: 3  / 1,
};

const DEFAULT_FORM = {
  title: "", subtitle: "", tag: "", ctaText: "Learn More", ctaUrl: "/jobs",
  imageUrl: "", accentColor: "#10b981", bannerType: "spotlight",
  bannerHeadline: "", bannerDescription: "", order: 0, isActive: true,
};

/* ─── Hex → RGB helper ─────────────────────────── */
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return { r, g, b };
}

/* ─── Validate image dimensions against ad type ── */
function checkImageFit(naturalW, naturalH, bannerType) {
  const rec = RECOMMENDED[bannerType] || RECOMMENDED.spotlight;
  const imgRatio  = naturalW / naturalH;
  const recRatio  = rec.ratio;
  const ratioDiff = Math.abs(imgRatio - recRatio) / recRatio;
  const tooLarge  = naturalW > rec.w * 1.5 && naturalH > rec.h * 1.5;
  const mismatched = ratioDiff > 0.20;
  return { tooLarge, mismatched, ratioDiff, rec, naturalW, naturalH };
}

/* ─── Smart fitted image ─────────────────────────*/
const FittedImage = ({ src, accentColor, bannerType, height = "100%", width = "100%", onSizeWarning, style = {} }) => {
  const { r, g, b } = hexToRgb(accentColor || "#10b981");
  const bg = `rgba(${r},${g},${b},0.08)`;
  const [warn, setWarn] = useState(null);

  const handleLoad = (e) => {
    const img = e.target;
    const result = checkImageFit(img.naturalWidth, img.naturalHeight, bannerType);
    if (result.tooLarge)   { setWarn("tooLarge");   onSizeWarning?.("tooLarge",   result); }
    else if (result.mismatched) { setWarn("mismatched"); onSizeWarning?.("mismatched", result); }
    else                   { setWarn(null);          onSizeWarning?.(null,         result); }
  };

  return (
    <div style={{
      position: "relative", width, height,
      background: bg,
      border: `1px solid rgba(${r},${g},${b},0.18)`,
      borderRadius: 8, overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "center",
      ...style,
    }}>
      <img
        src={src} alt="preview" onLoad={handleLoad}
        onError={e => { e.target.style.display = "none"; }}
        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }}
      />
      {!warn && (
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: `linear-gradient(to right, rgba(${r},${g},${b},0.25), transparent 60%)`,
        }} />
      )}
    </div>
  );
};

/* ─── Size warning banner ────────────────────────*/
const SizeWarningBanner = ({ warn, result, bannerType }) => {
  if (!warn || !result) return null;
  const rec = RECOMMENDED[bannerType] || RECOMMENDED.spotlight;
  if (warn === "tooLarge") return (
    <div style={{ display:"flex", gap:10, alignItems:"flex-start", background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:8, padding:"10px 14px", marginTop:8, fontSize:12, color:"#991b1b" }}>
      <AlertTriangle size={14} style={{ flexShrink:0, marginTop:1 }} />
      <div><strong>Image too large</strong> — your image is {result.naturalW}×{result.naturalH}px. Recommended: <strong>{rec.label}</strong>. Large images may affect load speed.</div>
    </div>
  );
  if (warn === "mismatched") return (
    <div style={{ display:"flex", gap:10, alignItems:"flex-start", background:"#fffbeb", border:"1px solid #fcd34d", borderRadius:8, padding:"10px 14px", marginTop:8, fontSize:12, color:"#92400e" }}>
      <Info size={14} style={{ flexShrink:0, marginTop:1 }} />
      <div><strong>Aspect ratio mismatch</strong> — your image ({result.naturalW}×{result.naturalH}px) has a different proportion than the recommended <strong>{rec.label}</strong>. It's been letterboxed to fit without cropping.</div>
    </div>
  );
  return null;
};

/* ─── Field wrapper ──────────────────────────────*/
const Field = ({ label, children, hint }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>
      {label}
    </label>
    {children}
    {hint && <p style={{ fontSize:11, color:"#94a3b8", marginTop:4 }}>{hint}</p>}
  </div>
);

const inp = {
  width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8,
  fontSize: 13, fontFamily: "Inter, sans-serif", color: "#0f172a", background: "white",
  outline: "none", boxSizing: "border-box", transition: "border 0.2s",
};

/* ─── Ad Form Modal ──────────────────────────────*/
const AdFormModal = ({ ad, onClose, onSave, saving }) => {
  const [form, setForm]           = useState(ad ? { ...DEFAULT_FORM, ...ad } : { ...DEFAULT_FORM });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(ad?.imageUrl || "");
  const [sizeWarn, setSizeWarn]   = useState(null);
  const [sizeResult, setSizeResult] = useState(null);

  /* ── Cropper state ── */
  const [adCropOpen,  setAdCropOpen]  = useState(false);
  const [adRawSrc,    setAdRawSrc]    = useState("");

  const fileInputRef = useRef(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Reset warning when bannerType changes
  useEffect(() => { setSizeWarn(null); setSizeResult(null); }, [form.bannerType]);

  /* ── Open cropper when file is selected ── */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSizeWarn(null);
    setSizeResult(null);
    setAdRawSrc(URL.createObjectURL(file));
    setAdCropOpen(true);
    e.target.value = ""; // reset so same file can be re-selected
  };

  /* ── Receive cropped blob from modal ── */
  const handleAdCropDone = (blob, dataUrl) => {
    setAdCropOpen(false);
    setPreviewUrl(dataUrl);
    setImageFile(new File([blob], "ad-image.jpg", { type: blob.type }));
    setSizeWarn(null);
    setSizeResult(null);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreviewUrl("");
    setSizeWarn(null);
    setSizeResult(null);
    set("imageUrl", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSizeWarning = (type, result) => {
    setSizeWarn(type);
    setSizeResult(result);
  };

  const rec = RECOMMENDED[form.bannerType] || RECOMMENDED.spotlight;

  // Dynamic aspect ratio label for the hint
  const cropHint = form.bannerType === "full_banner"
    ? "Recommended: 1440×480px (3:1 ratio)"
    : "Recommended: 800×450px (16:9 ratio)";

  return (
    <>
      <div
        style={{
          position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)",
          backdropFilter: "blur(4px)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }}
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <div style={{
          background: "white", borderRadius: 16, width: "100%", maxWidth: 640,
          maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
        }}>
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "20px 24px", borderBottom: "1px solid #f1f5f9",
            position: "sticky", top: 0, background: "white", zIndex: 1,
          }}>
            <div>
              <h2 style={{ fontSize:18, fontWeight:700, color:"#0f172a", margin:0 }}>
                {ad ? "Edit Ad" : "Create New Ad"}
              </h2>
              <p style={{ fontSize:12, color:"#64748b", margin:"4px 0 0" }}>
                {ad ? "Update the ad details below" : "Fill in the details for the new advertisement"}
              </p>
            </div>
            <button onClick={onClose} disabled={saving} style={{ background:"none", border:"none", cursor:"pointer", padding:6, borderRadius:6, color:"#94a3b8" }}>
              <X size={20} />
            </button>
          </div>

          <div style={{ padding: "20px 24px" }}>

            {/* Banner Type */}
            <Field label="Ad Type">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {BANNER_TYPES.map(t => (
                  <div
                    key={t.value}
                    onClick={() => set("bannerType", t.value)}
                    style={{
                      padding:"12px 14px", borderRadius:10, cursor:"pointer",
                      border:`2px solid ${form.bannerType === t.value ? "#10b981" : "#e2e8f0"}`,
                      background: form.bannerType === t.value ? "#f0fdf4" : "white",
                      transition:"all 0.15s",
                    }}
                  >
                    <div style={{ fontSize:13, fontWeight:700, color:form.bannerType === t.value ? "#065f46" : "#0f172a" }}>{t.label}</div>
                    <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>{t.desc}</div>
                  </div>
                ))}
              </div>
            </Field>

            {/* Title */}
            <Field label="Title *">
              <input style={inp} value={form.title} placeholder="e.g. Solar Careers Drive 2026"
                onChange={e => set("title", e.target.value)}
                onFocus={e => e.target.style.borderColor="#10b981"}
                onBlur={e => e.target.style.borderColor="#e2e8f0"} />
            </Field>

            {/* Subtitle */}
            <Field label="Subtitle">
              <input style={inp} value={form.subtitle} placeholder="Short description shown on the card"
                onChange={e => set("subtitle", e.target.value)}
                onFocus={e => e.target.style.borderColor="#10b981"}
                onBlur={e => e.target.style.borderColor="#e2e8f0"} />
            </Field>

            {/* Full banner extras */}
            {form.bannerType === "full_banner" && (
              <>
                <Field label="Banner Headline" hint="Large headline displayed prominently in the banner">
                  <input style={inp} value={form.bannerHeadline} placeholder="e.g. India's Largest Green Jobs Fair"
                    onChange={e => set("bannerHeadline", e.target.value)}
                    onFocus={e => e.target.style.borderColor="#10b981"}
                    onBlur={e => e.target.style.borderColor="#e2e8f0"} />
                </Field>
                <Field label="Banner Description" hint="Detailed text shown in the full banner">
                  <textarea style={{ ...inp, minHeight:80, resize:"vertical" }} value={form.bannerDescription}
                    placeholder="Describe the opportunity, event or promotion…"
                    onChange={e => set("bannerDescription", e.target.value)}
                    onFocus={e => e.target.style.borderColor="#10b981"}
                    onBlur={e => e.target.style.borderColor="#e2e8f0"} />
                </Field>
              </>
            )}

            {/* Tag + CTA row */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <Field label="Tag Label">
                <input style={inp} value={form.tag} placeholder="e.g. Solar Energy"
                  onChange={e => set("tag", e.target.value)}
                  onFocus={e => e.target.style.borderColor="#10b981"}
                  onBlur={e => e.target.style.borderColor="#e2e8f0"} />
              </Field>
              <Field label="CTA Button Text">
                <input style={inp} value={form.ctaText} placeholder="e.g. Explore Roles"
                  onChange={e => set("ctaText", e.target.value)}
                  onFocus={e => e.target.style.borderColor="#10b981"}
                  onBlur={e => e.target.style.borderColor="#e2e8f0"} />
              </Field>
            </div>

            {/* CTA URL */}
            <Field label="CTA Link URL">
              <input style={inp} value={form.ctaUrl} placeholder="/jobs or https://example.com"
                onChange={e => set("ctaUrl", e.target.value)}
                onFocus={e => e.target.style.borderColor="#10b981"}
                onBlur={e => e.target.style.borderColor="#e2e8f0"} />
            </Field>

            {/* ── Image Upload with Crop ── */}
            <Field label="Ad Image">
              {/* Recommended size chip */}
              <div style={{
                display:"inline-flex", alignItems:"center", gap:5,
                background:"#f0fdf4", border:"1px solid #86efac",
                borderRadius:20, padding:"3px 10px", marginBottom:10,
                fontSize:11, fontWeight:600, color:"#15803d",
              }}>
                <Info size={11} />
                Recommended: {rec.label} · JPG, PNG, WebP · max 5MB
              </div>

              {/* Upload trigger + crop badge */}
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8, flexWrap:"wrap" }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display:"flex", alignItems:"center", gap:8,
                    padding:"9px 16px",
                    border:"1.5px solid #e2e8f0",
                    borderRadius:9, background:"#f8fafc",
                    color:"#374151", fontSize:13, fontWeight:700,
                    cursor:"pointer", fontFamily:"Inter, sans-serif",
                    transition:"all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor="#10b981"; e.currentTarget.style.background="#f0fdf4"; e.currentTarget.style.color="#065f46"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor="#e2e8f0"; e.currentTarget.style.background="#f8fafc"; e.currentTarget.style.color="#374151"; }}
                >
                  <Scissors size={14} />
                  {imageFile ? "Replace & Crop" : (previewUrl ? "Re-crop Image" : "Choose & Crop")}
                </button>

                {/* Shows current filename or "cropped" indicator */}
                {imageFile && (
                  <span style={{
                    display:"inline-flex", alignItems:"center", gap:5,
                    padding:"4px 10px", borderRadius:6,
                    background:"#f0fdf4", border:"1px solid #bbf7d0",
                    fontSize:11, fontWeight:600, color:"#065f46",
                  }}>
                    <Check size={11} />
                    Cropped &amp; ready
                  </span>
                )}

                {(imageFile || previewUrl) && (
                  <button type="button" onClick={handleRemoveImage} title="Remove image"
                    style={{ background:"none", border:"none", cursor:"pointer", color:"#dc2626", padding:4, display:"flex", alignItems:"center" }}>
                    <X size={14} />
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display:"none" }}
                  onChange={handleFileChange}
                />
              </div>

              {/* URL fallback — only when no file is chosen */}
              {!imageFile && (
                <input
                  style={inp}
                  value={form.imageUrl}
                  placeholder="…or paste an image URL (Unsplash, CDN, etc.)"
                  onChange={e => {
                    set("imageUrl", e.target.value);
                    setSizeWarn(null);
                    setSizeResult(null);
                    setPreviewUrl(e.target.value);
                  }}
                  onFocus={e => e.target.style.borderColor="#10b981"}
                  onBlur={e => e.target.style.borderColor="#e2e8f0"}
                />
              )}
            </Field>

            {/* ── Image preview ── */}
            {previewUrl && (
              <>
                <div style={{
                  marginBottom: 4, borderRadius: 10, overflow: "hidden", position: "relative",
                  aspectRatio: form.bannerType === "full_banner" ? "3 / 1" : "16 / 9",
                  maxHeight: form.bannerType === "full_banner" ? 160 : 180,
                }}>
                  <FittedImage
                    src={previewUrl}
                    accentColor={form.accentColor}
                    bannerType={form.bannerType}
                    height="100%"
                    width="100%"
                    onSizeWarning={handleSizeWarning}
                    style={{ borderRadius:10, border:"none" }}
                  />

                  {/* Tag + title overlay */}
                  <div style={{ position:"absolute", bottom:10, left:14, pointerEvents:"none" }}>
                    {form.tag && (
                      <span style={{ background:form.accentColor, color:"white", padding:"2px 10px", borderRadius:100, fontSize:10, fontWeight:700 }}>
                        {form.tag}
                      </span>
                    )}
                    <div style={{ fontSize:15, fontWeight:700, color:"white", marginTop:4, textShadow:"0 1px 4px rgba(0,0,0,0.5)" }}>
                      {form.title || "Ad Title"}
                    </div>
                  </div>

                  {/* Cropped badge overlay */}
                  {imageFile && (
                    <div style={{
                      position:"absolute", top:8, left:8,
                      background:"rgba(16,185,129,0.9)", color:"white",
                      borderRadius:6, padding:"3px 8px",
                      display:"flex", alignItems:"center", gap:4,
                      fontSize:11, fontWeight:700,
                    }}>
                      <Scissors size={10} /> Cropped
                    </div>
                  )}

                  {/* Ratio warning badge */}
                  {sizeWarn && (
                    <div style={{
                      position:"absolute", top:8, right:8,
                      background: sizeWarn === "tooLarge" ? "#fef2f2" : "#fffbeb",
                      border:`1px solid ${sizeWarn === "tooLarge" ? "#fca5a5" : "#fcd34d"}`,
                      borderRadius:6, padding:"3px 8px",
                      display:"flex", alignItems:"center", gap:4,
                      fontSize:11, fontWeight:700,
                      color: sizeWarn === "tooLarge" ? "#991b1b" : "#92400e",
                    }}>
                      <AlertTriangle size={11} />
                      {sizeWarn === "tooLarge" ? "Too large" : "Ratio mismatch"}
                    </div>
                  )}
                </div>

                {/* Re-crop shortcut below the preview */}
                <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:8, flexWrap:"wrap" }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      display:"inline-flex", alignItems:"center", gap:6,
                      padding:"5px 12px", borderRadius:7,
                      border:"1.5px solid #e2e8f0", background:"white",
                      color:"#64748b", fontSize:12, fontWeight:600,
                      cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor="#10b981"; e.currentTarget.style.color="#065f46"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor="#e2e8f0"; e.currentTarget.style.color="#64748b"; }}
                  >
                    <Scissors size={12} /> Re-crop
                  </button>

                  {/* "Looks good" confirmation */}
                  {!sizeWarn && (
                    <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"#15803d", fontWeight:600 }}>
                      <Check size={12} /> Image fits the recommended dimensions
                    </div>
                  )}
                </div>

                <SizeWarningBanner warn={sizeWarn} result={sizeResult} bannerType={form.bannerType} />
              </>
            )}

            {/* Accent colour */}
            <Field label="Accent Color" hint="Also used as the background fill for letterboxed images" >
              <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                {ACCENT_PRESETS.map(c => (
                  <div key={c} onClick={() => set("accentColor", c)} style={{
                    width:28, height:28, borderRadius:"50%", background:c, cursor:"pointer",
                    border: form.accentColor === c ? "3px solid #0f172a" : "2px solid transparent",
                    transition:"all 0.15s",
                  }} />
                ))}
                <input type="color" value={form.accentColor} onChange={e => set("accentColor", e.target.value)}
                  style={{ width:36, height:28, border:"1.5px solid #e2e8f0", borderRadius:6, cursor:"pointer", padding:2 }} />
                <span style={{ fontSize:12, color:"#94a3b8" }}>{form.accentColor}</span>
              </div>
            </Field>

            {/* Order + Active */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <Field label="Display Order" hint="Lower number = shown first">
                <input style={inp} type="number" value={form.order} min={0}
                  onChange={e => set("order", parseInt(e.target.value) || 0)}
                  onFocus={e => e.target.style.borderColor="#10b981"}
                  onBlur={e => e.target.style.borderColor="#e2e8f0"} />
              </Field>
              <Field label="Status">
                <div
                  onClick={() => set("isActive", !form.isActive)}
                  style={{
                    display:"flex", alignItems:"center", gap:10, padding:"9px 12px",
                    border:"1.5px solid #e2e8f0", borderRadius:8, cursor:"pointer",
                    background: form.isActive ? "#f0fdf4" : "#fef2f2",
                  }}
                >
                  {form.isActive
                    ? <><ToggleRight size={18} color="#10b981" /><span style={{ fontSize:13, fontWeight:600, color:"#065f46" }}>Active</span></>
                    : <><ToggleLeft size={18} color="#dc2626" /><span style={{ fontSize:13, fontWeight:600, color:"#dc2626" }}>Inactive</span></>}
                </div>
              </Field>
            </div>

            {/* Actions */}
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
              <button onClick={onClose} disabled={saving} style={{
                padding:"9px 18px", border:"1px solid #e2e8f0", borderRadius:8,
                background:"white", color:"#475569", fontSize:13, fontWeight:600,
                cursor:"pointer", fontFamily:"Inter, sans-serif",
              }}>
                Cancel
              </button>
              <button
                onClick={() => onSave(form, imageFile)}
                disabled={saving || !form.title.trim()}
                style={{
                  padding:"9px 20px", border:"none", borderRadius:8,
                  background: saving || !form.title.trim() ? "#94a3b8" : "#10b981",
                  color:"white", fontSize:13, fontWeight:700,
                  cursor: saving || !form.title.trim() ? "not-allowed" : "pointer",
                  display:"flex", alignItems:"center", gap:6,
                  fontFamily:"Inter, sans-serif",
                }}
              >
                {saving
                  ? <Loader2 size={14} style={{ animation:"spin 1s linear infinite" }} />
                  : <Check size={14} />}
                {saving ? "Saving…" : ad ? "Save Changes" : "Create Ad"}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ── Ad image crop modal — aspect ratio locked to bannerType ── */}
      <ImageCropperModal
        isOpen={adCropOpen}
        onClose={() => setAdCropOpen(false)}
        onCrop={handleAdCropDone}
        imageSrc={adRawSrc}
        aspectRatio={CROP_ASPECT[form.bannerType]}
        cropShape="rect"
        title={form.bannerType === "full_banner" ? "Crop Full Banner" : "Crop Spotlight Card"}
        hint={cropHint}
      />
    </>
  );
};

/* ─── Ad Card thumbnail ───────────────────────────*/
const AdCardThumbnail = ({ ad }) => {
  const { r, g, b } = hexToRgb(ad.accentColor || "#10b981");
  const bg = `rgba(${r},${g},${b},0.10)`;
  return (
    <div style={{
      width:72, height:52, borderRadius:8, overflow:"hidden", flexShrink:0,
      background:bg, display:"flex", alignItems:"center", justifyContent:"center",
    }}>
      {ad.imageUrl ? (
        <img src={ad.imageUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"contain" }} onError={e => { e.target.style.display="none"; }} />
      ) : (
        <Image size={20} color={ad.accentColor} />
      )}
    </div>
  );
};

/* ─── Ad Card ─────────────────────────────────────*/
const AdCard = ({ ad, onEdit, onDelete, onToggle, onMoveUp, onMoveDown, isFirst, isLast, deleting, toggling }) => (
  <div style={{
    background:"white",
    border:`1px solid ${ad.isActive ? "#e2e8f0" : "#fecaca"}`,
    borderLeft:`4px solid ${ad.isActive ? ad.accentColor : "#ef4444"}`,
    borderRadius:10, padding:16, transition:"all 0.2s",
    opacity: ad.isActive ? 1 : 0.7,
  }}>
    <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
      <AdCardThumbnail ad={ad} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
          <span style={{ fontSize:14, fontWeight:700, color:"#0f172a" }}>{ad.title}</span>
          <span style={{
            padding:"2px 8px", borderRadius:100, fontSize:10, fontWeight:700,
            background: ad.bannerType === "full_banner" ? "#dbeafe" : "#f0fdf4",
            color: ad.bannerType === "full_banner" ? "#1e40af" : "#065f46",
          }}>
            {ad.bannerType === "full_banner" ? "Full Banner" : "Spotlight"}
          </span>
          {!ad.isActive && (
            <span style={{ padding:"2px 8px", borderRadius:100, fontSize:10, fontWeight:700, background:"#fee2e2", color:"#991b1b" }}>Inactive</span>
          )}
        </div>
        {ad.tag     && <div style={{ fontSize:11, fontWeight:600, color:ad.accentColor, marginBottom:2 }}>{ad.tag}</div>}
        {ad.subtitle && <div style={{ fontSize:12, color:"#64748b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ad.subtitle}</div>}
        <div style={{ display:"flex", gap:12, marginTop:6, fontSize:11, color:"#94a3b8" }}>
          <span>Order: {ad.order}</span>
          {ad.ctaUrl && <span style={{ display:"flex", alignItems:"center", gap:3 }}><ExternalLink size={10} />{ad.ctaUrl}</span>}
          {ad.imageUrl && <span style={{ display:"flex", alignItems:"center", gap:3, color:"#10b981" }}><Image size={10} /> Image set</span>}
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
          <button onClick={onMoveUp} disabled={isFirst} style={{ background:"none", border:"1px solid #e2e8f0", borderRadius:4, padding:"2px 6px", cursor:isFirst?"not-allowed":"pointer", opacity:isFirst?0.4:1 }}><ChevronUp size={12} color="#64748b" /></button>
          <button onClick={onMoveDown} disabled={isLast} style={{ background:"none", border:"1px solid #e2e8f0", borderRadius:4, padding:"2px 6px", cursor:isLast?"not-allowed":"pointer", opacity:isLast?0.4:1 }}><ChevronDown size={12} color="#64748b" /></button>
        </div>
        <button onClick={() => onToggle(ad._id)} disabled={toggling === ad._id} title={ad.isActive ? "Deactivate" : "Activate"} style={{ padding:"6px 8px", border:"1px solid #e2e8f0", borderRadius:6, background:"white", cursor:"pointer", display:"flex", alignItems:"center" }}>
          {toggling === ad._id ? <Loader2 size={14} style={{ animation:"spin 1s linear infinite" }} color="#64748b" /> : ad.isActive ? <EyeOff size={14} color="#dc2626" /> : <Eye size={14} color="#10b981" />}
        </button>
        <button onClick={() => onEdit(ad)} title="Edit" style={{ padding:"6px 8px", border:"1px solid #e2e8f0", borderRadius:6, background:"white", cursor:"pointer", display:"flex", alignItems:"center" }}>
          <Edit2 size={14} color="#3b82f6" />
        </button>
        <button onClick={() => onDelete(ad._id, ad.title)} disabled={deleting === ad._id} title="Delete" style={{ padding:"6px 8px", border:"1px solid #fecaca", borderRadius:6, background:"white", cursor:"pointer", display:"flex", alignItems:"center" }}>
          {deleting === ad._id ? <Loader2 size={14} style={{ animation:"spin 1s linear infinite" }} color="#dc2626" /> : <Trash2 size={14} color="#dc2626" />}
        </button>
      </div>
    </div>
  </div>
);

/* ─── Main Component ──────────────────────────────*/
export default function AdminAdsManager({ token }) {
  const [ads, setAds]             = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(null);
  const [toggling, setToggling]   = useState(null);

  const authHeaders = { Authorization: `Bearer ${token}` };

  const fetchAds = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/ads/admin`, { headers: authHeaders });
      setAds(res.data.ads || []);
    } catch {
      toast.error("Failed to load ads");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchAds(); }, [fetchAds]);

  /* ── Save ── */
  const handleSave = async (form, imageFile) => {
    try {
      setSaving(true);
      const fd = new FormData();
      const textFields = [
        "title","subtitle","tag","ctaText","ctaUrl",
        "accentColor","bannerType","bannerHeadline",
        "bannerDescription","order","isActive",
      ];
      textFields.forEach(f => {
        if (form[f] !== undefined && form[f] !== null) {
          fd.append(f, typeof form[f] === "boolean" ? String(form[f]) : form[f]);
        }
      });
      if (imageFile)        fd.append("adImage",  imageFile);
      else if (form.imageUrl) fd.append("imageUrl", form.imageUrl);

      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (editingAd) {
        await axios.patch(`${API_BASE_URL}/api/ads/admin/${editingAd._id}`, fd, config);
        toast.success("Ad updated!");
      } else {
        await axios.post(`${API_BASE_URL}/api/ads/admin`, fd, config);
        toast.success("Ad created!");
      }

      setShowForm(false);
      setEditingAd(null);
      fetchAds();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save ad");
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete ad "${title}"? This cannot be undone.`)) return;
    try {
      setDeleting(id);
      await axios.delete(`${API_BASE_URL}/api/ads/admin/${id}`, { headers: authHeaders });
      toast.success("Ad deleted");
      fetchAds();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  /* ── Toggle ── */
  const handleToggle = async (id) => {
    try {
      setToggling(id);
      const res = await axios.patch(`${API_BASE_URL}/api/ads/admin/${id}/toggle`, {}, { headers: authHeaders });
      toast.success(res.data.message);
      fetchAds();
    } catch {
      toast.error("Failed to toggle");
    } finally {
      setToggling(null);
    }
  };

  /* ── Reorder ── */
// moveAd scoped to its own type
const moveAd = async (filteredIdx, dir, bannerType) => {
  const filtered = ads.filter(a => a.bannerType === bannerType);
  const swapIdx = dir === "up" ? filteredIdx - 1 : filteredIdx + 1;
  if (swapIdx < 0 || swapIdx >= filtered.length) return;

  const newFiltered = [...filtered];
  [newFiltered[filteredIdx], newFiltered[swapIdx]] = [newFiltered[swapIdx], newFiltered[filteredIdx]];

  // Rebuild full ads array: keep other type in place, replace this type's entries
  const others = ads.filter(a => a.bannerType !== bannerType);
  const merged = [...others, ...newFiltered].map((a, i) => ({ ...a, order: i }));
  setAds(merged);

  try {
    await axios.patch(
      `${API_BASE_URL}/api/ads/admin/reorder`,
      { orders: merged.map(a => ({ id: a._id, order: a.order })) },
      { headers: authHeaders }
    );
    toast.success("Order saved");
  } catch {
    toast.error("Failed to save order");
    fetchAds();
  }
};

  const spotlightAds = ads.filter(a => a.bannerType === "spotlight");
  const bannerAds    = ads.filter(a => a.bannerType === "full_banner");

  return (
    <>
      <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:700, color:"#0f172a", margin:0, display:"flex", alignItems:"center", gap:8 }}>
            <Megaphone size={22} color="#10b981" /> Advertisement Manager
          </h2>
          <p style={{ fontSize:13, color:"#64748b", margin:"4px 0 0" }}>
            {ads.length} total · {ads.filter(a => a.isActive).length} active · {spotlightAds.length} spotlight · {bannerAds.length} full banner
          </p>
        </div>
        <button
          onClick={() => { setEditingAd(null); setShowForm(true); }}
          style={{
            display:"flex", alignItems:"center", gap:8, padding:"9px 16px",
            background:"#10b981", border:"none", borderRadius:8,
            color:"white", fontSize:13, fontWeight:700, cursor:"pointer",
            fontFamily:"Inter, sans-serif",
          }}
        >
          <Plus size={15} /> Create New Ad
        </button>
      </div>

      {/* Info note */}
      <div style={{
        background:"#eff6ff", border:"1px solid #93c5fd", borderRadius:8,
        padding:"10px 14px", marginBottom:20, fontSize:12, color:"#1e40af",
        display:"flex", gap:8, alignItems:"flex-start",
      }}>
        <AlertCircle size={14} style={{ flexShrink:0, marginTop:1 }} />
        <span>
          <strong>Spotlight cards</strong> appear in the rotating featured section (recommended <strong>800×450px, 16:9</strong>).{" "}
          <strong>Full banners</strong> display as large hero-style ads (recommended <strong>1440×480px, 3:1</strong>).
          Images are cropped to the correct ratio when you upload them — no more letterboxing.
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign:"center", padding:60, color:"#64748b" }}>
          <Loader2 size={28} style={{ animation:"spin 1s linear infinite", display:"block", margin:"0 auto 12px" }} />
          Loading ads…
        </div>
      ) : ads.length === 0 ? (
        <div style={{ textAlign:"center", padding:60 }}>
          <div style={{ width:64, height:64, background:"#f1f5f9", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
            <Megaphone size={28} color="#cbd5e1" />
          </div>
          <div style={{ fontSize:16, fontWeight:600, color:"#0f172a", marginBottom:4 }}>No ads created yet</div>
          <div style={{ fontSize:13, color:"#64748b", marginBottom:20 }}>Create your first ad to display on the homepage</div>
          <button
            onClick={() => { setEditingAd(null); setShowForm(true); }}
            style={{ padding:"10px 20px", background:"#10b981", border:"none", borderRadius:8, color:"white", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"Inter, sans-serif" }}
          >
            <Plus size={14} style={{ marginRight:6, verticalAlign:"middle" }} /> Create First Ad
          </button>
        </div>
      ) : (
        <div>
          {bannerAds.length > 0 && (
            <div style={{ marginBottom:28 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:12, display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ width:8, height:8, background:"#3b82f6", borderRadius:"50%", display:"inline-block" }} />
                Full Banners ({bannerAds.length})
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {bannerAds.map((ad, i) => {
                  const fullIdx = ads.indexOf(ad);
                  return (
                    <AdCard key={ad._id} ad={ad}
                      isFirst={i === 0} isLast={i === bannerAds.length - 1}
                      onMoveUp={() => moveAd(i, "up", ad.bannerType)}
                      onMoveDown={() => moveAd(i, "down", ad.bannerType)}
                      onEdit={a => { setEditingAd(a); setShowForm(true); }}
                      onDelete={handleDelete} onToggle={handleToggle}
                      deleting={deleting} toggling={toggling}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {spotlightAds.length > 0 && (
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:12, display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ width:8, height:8, background:"#10b981", borderRadius:"50%", display:"inline-block" }} />
                Spotlight Cards ({spotlightAds.length})
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {spotlightAds.map((ad, i) => {
                  const fullIdx = ads.indexOf(ad);
                  return (
                    <AdCard key={ad._id} ad={ad}
                      isFirst={i === 0} isLast={i === spotlightAds.length - 1}
                      onMoveUp={() => moveAd(i, "up", ad.bannerType)}
                      onMoveDown={() => moveAd(i, "down", ad.bannerType)}
                      onEdit={a => { setEditingAd(a); setShowForm(true); }}
                      onDelete={handleDelete} onToggle={handleToggle}
                      deleting={deleting} toggling={toggling}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <AdFormModal
          ad={editingAd}
          onClose={() => { setShowForm(false); setEditingAd(null); }}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </>
  );
}