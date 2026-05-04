import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Loader2,
  Image, ExternalLink, X, Check, AlertCircle, Megaphone, ToggleLeft, ToggleRight,
  ChevronUp, ChevronDown, AlertTriangle, Info,
} from "lucide-react";
import toast from "react-hot-toast";
import API_BASE_URL from "../config/api";

const ACCENT_PRESETS = [
  "#10b981","#3b82f6","#f59e0b","#ef4444","#8b5cf6",
  "#06b6d4","#f97316","#ec4899","#14b8a6","#6366f1",
];

const BANNER_TYPES = [
  { value: "spotlight",   label: "Spotlight Card", desc: "Small card in the rotating spotlight section" },
  { value: "full_banner", label: "Full Banner",    desc: "Large hero-style banner displayed prominently" },
];

/* ─── Image size options per ad type ───────────────────────*/
const SIZE_OPTIONS = {
  spotlight: [
    {
      value: "small",
      label: "Small",
      desc: "Compact · fits within card cleanly",
      objectFit: "contain",
      objectPosition: "center",
      previewHeight: 120,
    },
    {
      value: "medium",
      label: "Medium",
      desc: "Balanced · recommended default",
      objectFit: "cover",
      objectPosition: "center top",
      previewHeight: 180,
    },
    {
      value: "large",
      label: "Large",
      desc: "Full bleed · edge-to-edge fill",
      objectFit: "cover",
      objectPosition: "center",
      previewHeight: 240,
    },
  ],
  full_banner: [
    {
      value: "small",
      label: "Small",
      desc: "Letterboxed · padding on all sides",
      objectFit: "contain",
      objectPosition: "center",
      previewHeight: 120,
    },
    {
      value: "medium",
      label: "Medium",
      desc: "Balanced · recommended default",
      objectFit: "cover",
      objectPosition: "center",
      previewHeight: 160,
    },
    {
      value: "large",
      label: "Large",
      desc: "Full hero fill · edge-to-edge",
      objectFit: "cover",
      objectPosition: "top center",
      previewHeight: 220,
    },
  ],
};

const DEFAULT_FORM = {
  title: "", subtitle: "", tag: "", ctaText: "Learn More", ctaUrl: "/jobs",
  imageUrl: "", accentColor: "#10b981", bannerType: "spotlight",
  bannerHeadline: "", bannerDescription: "", order: 0, isActive: true,
  imageSize: "medium",
};

/* ─── Hex → RGB helper ─────────────────────────────────────*/
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return { r, g, b };
}

/* ─── Field wrapper ────────────────────────────────────────*/
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

/* ─── Size Selector ────────────────────────────────────────*/
const ImageSizeSelector = ({ bannerType, value, onChange }) => {
  const options = SIZE_OPTIONS[bannerType] || SIZE_OPTIONS.spotlight;
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
      {options.map(opt => (
        <div
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding:"10px 12px", borderRadius:10, cursor:"pointer",
            border:`2px solid ${value === opt.value ? "#10b981" : "#e2e8f0"}`,
            background: value === opt.value ? "#f0fdf4" : "white",
            transition:"all 0.15s", textAlign:"center",
          }}
        >
          <div style={{
            fontSize:18, fontWeight:800, marginBottom:3,
            color: value === opt.value ? "#065f46" : "#0f172a",
          }}>
            {opt.label[0]}
            <span style={{ fontSize:11, fontWeight:500, marginLeft:1 }}>
              {opt.label.slice(1).toLowerCase()}
            </span>
          </div>
          <div style={{ fontSize:10, color:"#94a3b8", lineHeight:1.4 }}>{opt.desc}</div>
          {value === opt.value && (
            <div style={{ marginTop:5 }}>
              <Check size={11} color="#10b981" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/* ─── Image Preview ────────────────────────────────────────*/
const ImagePreview = ({ src, accentColor, bannerType, imageSize, tag, title }) => {
  const sizeOpts = SIZE_OPTIONS[bannerType] || SIZE_OPTIONS.spotlight;
  const sizeConf = sizeOpts.find(o => o.value === imageSize) || sizeOpts[1];
  const { r, g, b } = hexToRgb(accentColor || "#10b981");
  const isFullBanner = bannerType === "full_banner";

  return (
    <div style={{
      borderRadius:10, overflow:"hidden", position:"relative",
      height: sizeConf.previewHeight,
      background: src ? "transparent" : `rgba(${r},${g},${b},0.08)`,
      border: `1px solid rgba(${r},${g},${b},0.18)`,
      display:"flex", alignItems:"center", justifyContent:"center",
    }}>
      {src ? (
        <>
          <img
            src={src} alt="preview"
            onError={e => { e.target.style.display="none"; }}
            style={{
              width:"100%", height:"100%",
              objectFit: sizeConf.objectFit,
              objectPosition: sizeConf.objectPosition,
              display:"block",
            }}
          />
          {/* Gradient overlay for full_banner style */}
          {isFullBanner && (
            <div style={{
              position:"absolute", inset:0,
              background:"linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)",
              pointerEvents:"none",
            }} />
          )}
          {/* Tag + title overlay */}
          <div style={{ position:"absolute", bottom:10, left:14, pointerEvents:"none" }}>
            {tag && (
              <span style={{ background:accentColor, color:"white", padding:"2px 10px", borderRadius:100, fontSize:10, fontWeight:700 }}>
                {tag}
              </span>
            )}
            <div style={{ fontSize:15, fontWeight:700, color:"white", marginTop:4, textShadow:"0 1px 4px rgba(0,0,0,0.5)" }}>
              {title || "Ad Title"}
            </div>
          </div>
        </>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, color:`rgba(${r},${g},${b},0.5)` }}>
          <Image size={28} />
          <span style={{ fontSize:11, fontWeight:600 }}>No image yet</span>
        </div>
      )}
    </div>
  );
};

/* ─── Ad Form Modal ────────────────────────────────────────*/
const AdFormModal = ({ ad, onClose, onSave, saving }) => {
  const [form, setForm]           = useState(ad ? { ...DEFAULT_FORM, ...ad } : { ...DEFAULT_FORM });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(ad?.imageUrl || "");
  const fileInputRef = useRef(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Reset imageSize when bannerType changes so defaults apply correctly
  useEffect(() => {
    if (!ad) set("imageSize", "medium");
  }, [form.bannerType]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreviewUrl("");
    set("imageUrl", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div
      style={{
        position:"fixed", inset:0, background:"rgba(15,23,42,0.6)",
        backdropFilter:"blur(4px)", zIndex:9999,
        display:"flex", alignItems:"center", justifyContent:"center", padding:16,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background:"white", borderRadius:16, width:"100%", maxWidth:640,
        maxHeight:"90vh", overflowY:"auto", boxShadow:"0 24px 80px rgba(0,0,0,0.2)",
      }}>
        {/* Header */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"20px 24px", borderBottom:"1px solid #f1f5f9",
          position:"sticky", top:0, background:"white", zIndex:1,
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

        <div style={{ padding:"20px 24px" }}>

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

          {/* ── Image Upload ── */}
          <Field label="Ad Image">
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8, flexWrap:"wrap" }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display:"flex", alignItems:"center", gap:8,
                  padding:"9px 16px", border:"1.5px solid #e2e8f0",
                  borderRadius:9, background:"#f8fafc",
                  color:"#374151", fontSize:13, fontWeight:700,
                  cursor:"pointer", fontFamily:"Inter, sans-serif", transition:"all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor="#10b981"; e.currentTarget.style.background="#f0fdf4"; e.currentTarget.style.color="#065f46"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor="#e2e8f0"; e.currentTarget.style.background="#f8fafc"; e.currentTarget.style.color="#374151"; }}
              >
                <Image size={14} />
                {imageFile ? "Replace Image" : (previewUrl ? "Change Image" : "Choose Image")}
              </button>

              {imageFile && (
                <span style={{
                  display:"inline-flex", alignItems:"center", gap:5,
                  padding:"4px 10px", borderRadius:6,
                  background:"#f0fdf4", border:"1px solid #bbf7d0",
                  fontSize:11, fontWeight:600, color:"#065f46",
                }}>
                  <Check size={11} />
                  {imageFile.name.length > 24 ? imageFile.name.slice(0, 24) + "…" : imageFile.name}
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

            {/* URL fallback */}
            {!imageFile && (
              <input
                style={inp}
                value={form.imageUrl}
                placeholder="…or paste an image URL"
                onChange={e => {
                  set("imageUrl", e.target.value);
                  setPreviewUrl(e.target.value);
                }}
                onFocus={e => e.target.style.borderColor="#10b981"}
                onBlur={e => e.target.style.borderColor="#e2e8f0"}
              />
            )}
          </Field>

          {/* ── Image Size Selector ── */}
          <Field
            label="Image Display Size"
            hint={
              form.bannerType === "full_banner"
                ? "Controls how the image fills the full banner area"
                : "Controls how the image fills the spotlight card"
            }
          >
            <ImageSizeSelector
              bannerType={form.bannerType}
              value={form.imageSize || "medium"}
              onChange={v => set("imageSize", v)}
            />
          </Field>

          {/* ── Live Preview ── */}
          <Field label="Preview">
            <ImagePreview
              src={previewUrl}
              accentColor={form.accentColor}
              bannerType={form.bannerType}
              imageSize={form.imageSize || "medium"}
              tag={form.tag}
              title={form.title}
            />
            <div style={{
              display:"flex", alignItems:"center", gap:6,
              marginTop:8, fontSize:11, color:"#64748b",
            }}>
              <Info size={11} />
              This is an approximate preview. Actual rendering may vary slightly by screen size.
            </div>
          </Field>

          {/* Accent colour */}
          <Field label="Accent Color">
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
  );
};

/* ─── Ad Card thumbnail ─────────────────────────────────────*/
const AdCardThumbnail = ({ ad }) => {
  const { r, g, b } = hexToRgb(ad.accentColor || "#10b981");
  const bg = `rgba(${r},${g},${b},0.10)`;
  return (
    <div style={{
      width:72, height:52, borderRadius:8, overflow:"hidden", flexShrink:0,
      background:bg, display:"flex", alignItems:"center", justifyContent:"center",
    }}>
      {ad.imageUrl ? (
        <img src={ad.imageUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e => { e.target.style.display="none"; }} />
      ) : (
        <Image size={20} color={ad.accentColor} />
      )}
    </div>
  );
};

/* ─── Size badge helper ─────────────────────────────────────*/
const SizeBadge = ({ size }) => {
  const colors = {
    small:  { bg:"#f1f5f9", color:"#475569" },
    medium: { bg:"#dbeafe", color:"#1e40af" },
    large:  { bg:"#d1fae5", color:"#065f46" },
  };
  const s = colors[size] || colors.medium;
  return (
    <span style={{
      padding:"1px 8px", borderRadius:100, fontSize:10, fontWeight:700,
      background:s.bg, color:s.color,
    }}>
      {(size || "medium").charAt(0).toUpperCase() + (size || "medium").slice(1)}
    </span>
  );
};

/* ─── Ad Card ───────────────────────────────────────────────*/
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
          <SizeBadge size={ad.imageSize} />
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

/* ─── Main Component ────────────────────────────────────────*/
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
        "bannerDescription","order","isActive","imageSize",
      ];
      textFields.forEach(f => {
        if (form[f] !== undefined && form[f] !== null) {
          fd.append(f, typeof form[f] === "boolean" ? String(form[f]) : form[f]);
        }
      });
      if (imageFile)          fd.append("adImage",  imageFile);
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
  const moveAd = async (filteredIdx, dir, bannerType) => {
    const filtered = ads.filter(a => a.bannerType === bannerType);
    const swapIdx = dir === "up" ? filteredIdx - 1 : filteredIdx + 1;
    if (swapIdx < 0 || swapIdx >= filtered.length) return;

    const newFiltered = [...filtered];
    [newFiltered[filteredIdx], newFiltered[swapIdx]] = [newFiltered[swapIdx], newFiltered[filteredIdx]];

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
          Use the <strong>Image Display Size</strong> option (Small / Medium / Large) when creating or editing an ad to control how the image fits within its slot —
          no cropping required. <strong>Spotlight cards</strong> and <strong>Full banners</strong> each have their own size behaviour.
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
                {bannerAds.map((ad, i) => (
                  <AdCard key={ad._id} ad={ad}
                    isFirst={i === 0} isLast={i === bannerAds.length - 1}
                    onMoveUp={() => moveAd(i, "up", ad.bannerType)}
                    onMoveDown={() => moveAd(i, "down", ad.bannerType)}
                    onEdit={a => { setEditingAd(a); setShowForm(true); }}
                    onDelete={handleDelete} onToggle={handleToggle}
                    deleting={deleting} toggling={toggling}
                  />
                ))}
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
                {spotlightAds.map((ad, i) => (
                  <AdCard key={ad._id} ad={ad}
                    isFirst={i === 0} isLast={i === spotlightAds.length - 1}
                    onMoveUp={() => moveAd(i, "up", ad.bannerType)}
                    onMoveDown={() => moveAd(i, "down", ad.bannerType)}
                    onEdit={a => { setEditingAd(a); setShowForm(true); }}
                    onDelete={handleDelete} onToggle={handleToggle}
                    deleting={deleting} toggling={toggling}
                  />
                ))}
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