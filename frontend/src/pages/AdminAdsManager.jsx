    import React, { useState, useEffect, useCallback, useRef } from "react";
    import axios from "axios";
    import {
    Plus, Edit2, Trash2, Eye, EyeOff, Loader2,
    Image, ExternalLink, X, Check, AlertCircle, Megaphone, ToggleLeft, ToggleRight,
    ChevronUp, ChevronDown,
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

    const DEFAULT_FORM = {
    title: "", subtitle: "", tag: "", ctaText: "Learn More", ctaUrl: "/jobs",
    imageUrl: "", accentColor: "#10b981", bannerType: "spotlight",
    bannerHeadline: "", bannerDescription: "", order: 0, isActive: true,
    };

    /* ─── Field wrapper ──────────────────────────────── */
    const Field = ({ label, children, hint }) => (
    <div style={{ marginBottom: 16 }}>
        <label style={{
        display: "block", fontSize: 11, fontWeight: 700, color: "#64748b",
        textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6,
        }}>
        {label}
        </label>
        {children}
        {hint && <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{hint}</p>}
    </div>
    );

    const inp = {
    width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8,
    fontSize: 13, fontFamily: "Inter, sans-serif", color: "#0f172a", background: "white",
    outline: "none", boxSizing: "border-box", transition: "border 0.2s",
    };

    /* ─── Ad Form Modal ──────────────────────────────── */
    const AdFormModal = ({ ad, onClose, onSave, saving }) => {
    const [form, setForm]         = useState(ad ? { ...DEFAULT_FORM, ...ad } : { ...DEFAULT_FORM });
    const [imageFile, setImageFile]   = useState(null);
    const [previewUrl, setPreviewUrl] = useState(ad?.imageUrl || "");
    const fileInputRef = useRef(null);

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        setPreviewUrl(URL.createObjectURL(file));
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
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)",
            backdropFilter: "blur(4px)", zIndex: 1000,
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
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                {ad ? "Edit Ad" : "Create New Ad"}
                </h2>
                <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>
                {ad ? "Update the ad details below" : "Fill in the details for the new advertisement"}
                </p>
            </div>
            <button
                onClick={onClose}
                disabled={saving}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 6, color: "#94a3b8" }}
            >
                <X size={20} />
            </button>
            </div>

            <div style={{ padding: "20px 24px" }}>

            {/* Banner Type */}
            <Field label="Ad Type">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {BANNER_TYPES.map(t => (
                    <div
                    key={t.value}
                    onClick={() => set("bannerType", t.value)}
                    style={{
                        padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                        border: `2px solid ${form.bannerType === t.value ? "#10b981" : "#e2e8f0"}`,
                        background: form.bannerType === t.value ? "#f0fdf4" : "white",
                        transition: "all 0.15s",
                    }}
                    >
                    <div style={{ fontSize: 13, fontWeight: 700, color: form.bannerType === t.value ? "#065f46" : "#0f172a" }}>{t.label}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{t.desc}</div>
                    </div>
                ))}
                </div>
            </Field>

            {/* Title */}
            <Field label="Title *">
                <input
                style={inp}
                value={form.title}
                placeholder="e.g. Solar Careers Drive 2026"
                onChange={e => set("title", e.target.value)}
                onFocus={e => e.target.style.borderColor = "#10b981"}
                onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                />
            </Field>

            {/* Subtitle */}
            <Field label="Subtitle">
                <input
                style={inp}
                value={form.subtitle}
                placeholder="Short description shown on the card"
                onChange={e => set("subtitle", e.target.value)}
                onFocus={e => e.target.style.borderColor = "#10b981"}
                onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                />
            </Field>

            {/* Full banner extras */}
            {form.bannerType === "full_banner" && (
                <>
                <Field label="Banner Headline" hint="Large headline displayed prominently in the banner">
                    <input
                    style={inp}
                    value={form.bannerHeadline}
                    placeholder="e.g. India's Largest Green Jobs Fair"
                    onChange={e => set("bannerHeadline", e.target.value)}
                    onFocus={e => e.target.style.borderColor = "#10b981"}
                    onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                    />
                </Field>
                <Field label="Banner Description" hint="Detailed text shown in the full banner">
                    <textarea
                    style={{ ...inp, minHeight: 80, resize: "vertical" }}
                    value={form.bannerDescription}
                    placeholder="Describe the opportunity, event or promotion…"
                    onChange={e => set("bannerDescription", e.target.value)}
                    onFocus={e => e.target.style.borderColor = "#10b981"}
                    onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                    />
                </Field>
                </>
            )}

            {/* Tag + CTA row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Tag Label">
                <input
                    style={inp}
                    value={form.tag}
                    placeholder="e.g. Solar Energy"
                    onChange={e => set("tag", e.target.value)}
                    onFocus={e => e.target.style.borderColor = "#10b981"}
                    onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                />
                </Field>
                <Field label="CTA Button Text">
                <input
                    style={inp}
                    value={form.ctaText}
                    placeholder="e.g. Explore Roles"
                    onChange={e => set("ctaText", e.target.value)}
                    onFocus={e => e.target.style.borderColor = "#10b981"}
                    onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                />
                </Field>
            </div>

            {/* CTA URL */}
            <Field label="CTA Link URL">
                <input
                style={inp}
                value={form.ctaUrl}
                placeholder="/jobs or https://example.com"
                onChange={e => set("ctaUrl", e.target.value)}
                onFocus={e => e.target.style.borderColor = "#10b981"}
                onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                />
            </Field>

            {/* Image — upload or URL */}
            <Field label="Ad Image" hint="Upload a file (JPG, PNG, WebP — max 5 MB) or paste an external URL">
                {/* File picker button */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 14px", border: "1.5px dashed #cbd5e1",
                    borderRadius: 8, background: "#f8fafc", color: "#475569",
                    fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
                    }}
                >
                    <Image size={14} />
                    {imageFile ? imageFile.name : "Choose File"}
                </button>

                {(imageFile || previewUrl) && (
                    <button
                    type="button"
                    onClick={handleRemoveImage}
                    title="Remove image"
                    style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "#dc2626", padding: 4, display: "flex", alignItems: "center",
                    }}
                    >
                    <X size={14} />
                    </button>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                />
                </div>

                {/* URL fallback — hidden while a file is selected */}
                {!imageFile && (
                <input
                    style={inp}
                    value={form.imageUrl}
                    placeholder="…or paste an image URL (Unsplash, CDN, etc.)"
                    onChange={e => { set("imageUrl", e.target.value); setPreviewUrl(e.target.value); }}
                    onFocus={e => e.target.style.borderColor = "#10b981"}
                    onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                />
                )}
            </Field>

            {/* Image preview strip */}
            {previewUrl && (
                <div style={{ marginBottom: 20, borderRadius: 10, overflow: "hidden", position: "relative", height: 120 }}>
                <img
                    src={previewUrl}
                    alt="preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={e => { e.target.style.display = "none"; }}
                />
                <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to right, ${form.accentColor}55, transparent)` }} />
                <div style={{ position: "absolute", bottom: 10, left: 14 }}>
                    {form.tag && (
                    <span style={{ background: form.accentColor, color: "white", padding: "2px 10px", borderRadius: 100, fontSize: 10, fontWeight: 700 }}>
                        {form.tag}
                    </span>
                    )}
                    <div style={{ fontSize: 15, fontWeight: 700, color: "white", marginTop: 4, textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
                    {form.title || "Ad Title"}
                    </div>
                </div>
                </div>
            )}

            {/* Accent colour */}
            <Field label="Accent Color">
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                {ACCENT_PRESETS.map(c => (
                    <div
                    key={c}
                    onClick={() => set("accentColor", c)}
                    style={{
                        width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer",
                        border: form.accentColor === c ? "3px solid #0f172a" : "2px solid transparent",
                        transition: "all 0.15s",
                    }}
                    />
                ))}
                <input
                    type="color"
                    value={form.accentColor}
                    onChange={e => set("accentColor", e.target.value)}
                    style={{ width: 36, height: 28, border: "1.5px solid #e2e8f0", borderRadius: 6, cursor: "pointer", padding: 2 }}
                />
                <span style={{ fontSize: 12, color: "#94a3b8" }}>{form.accentColor}</span>
                </div>
            </Field>

            {/* Order + Active */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Display Order" hint="Lower number = shown first">
                <input
                    style={inp}
                    type="number"
                    value={form.order}
                    min={0}
                    onChange={e => set("order", parseInt(e.target.value) || 0)}
                    onFocus={e => e.target.style.borderColor = "#10b981"}
                    onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                />
                </Field>
                <Field label="Status">
                <div
                    style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                    border: "1.5px solid #e2e8f0", borderRadius: 8, cursor: "pointer",
                    background: form.isActive ? "#f0fdf4" : "#fef2f2",
                    }}
                    onClick={() => set("isActive", !form.isActive)}
                >
                    {form.isActive
                    ? <><ToggleRight size={18} color="#10b981" /><span style={{ fontSize: 13, fontWeight: 600, color: "#065f46" }}>Active</span></>
                    : <><ToggleLeft size={18} color="#dc2626" /><span style={{ fontSize: 13, fontWeight: 600, color: "#dc2626" }}>Inactive</span></>}
                </div>
                </Field>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button
                onClick={onClose}
                disabled={saving}
                style={{
                    padding: "9px 18px", border: "1px solid #e2e8f0", borderRadius: 8,
                    background: "white", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer",
                    fontFamily: "Inter, sans-serif",
                }}
                >
                Cancel
                </button>
                <button
                onClick={() => onSave(form, imageFile)}
                disabled={saving || !form.title.trim()}
                style={{
                    padding: "9px 20px", border: "none", borderRadius: 8,
                    background: saving || !form.title.trim() ? "#94a3b8" : "#10b981",
                    color: "white", fontSize: 13, fontWeight: 700,
                    cursor: saving || !form.title.trim() ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", gap: 6,
                    fontFamily: "Inter, sans-serif",
                }}
                >
                {saving
                    ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                    : <Check size={14} />}
                {saving ? "Saving…" : ad ? "Save Changes" : "Create Ad"}
                </button>
            </div>

            </div>
        </div>
        </div>
    );
    };

    /* ─── Ad Card ─────────────────────────────────────── */
    const AdCard = ({ ad, onEdit, onDelete, onToggle, onMoveUp, onMoveDown, isFirst, isLast, deleting, toggling }) => (
    <div style={{
        background: "white",
        border: `1px solid ${ad.isActive ? "#e2e8f0" : "#fecaca"}`,
        borderLeft: `4px solid ${ad.isActive ? ad.accentColor : "#ef4444"}`,
        borderRadius: 10, padding: 16, transition: "all 0.2s",
        opacity: ad.isActive ? 1 : 0.7,
    }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>

        {/* Thumbnail */}
        <div style={{
            width: 72, height: 52, borderRadius: 8, overflow: "hidden", flexShrink: 0,
            background: `linear-gradient(135deg, ${ad.accentColor}33, ${ad.accentColor}11)`,
            display: "flex", alignItems: "center", justifyContent: "center",
        }}>
            {ad.imageUrl
            ? <img src={ad.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display = "none"} />
            : <Image size={20} color={ad.accentColor} />}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{ad.title}</span>
            <span style={{
                padding: "2px 8px", borderRadius: 100, fontSize: 10, fontWeight: 700,
                background: ad.bannerType === "full_banner" ? "#dbeafe" : "#f0fdf4",
                color: ad.bannerType === "full_banner" ? "#1e40af" : "#065f46",
            }}>
                {ad.bannerType === "full_banner" ? "Full Banner" : "Spotlight"}
            </span>
            {!ad.isActive && (
                <span style={{ padding: "2px 8px", borderRadius: 100, fontSize: 10, fontWeight: 700, background: "#fee2e2", color: "#991b1b" }}>
                Inactive
                </span>
            )}
            </div>
            {ad.tag && <div style={{ fontSize: 11, fontWeight: 600, color: ad.accentColor, marginBottom: 2 }}>{ad.tag}</div>}
            {ad.subtitle && <div style={{ fontSize: 12, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ad.subtitle}</div>}
            <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 11, color: "#94a3b8" }}>
            <span>Order: {ad.order}</span>
            {ad.ctaUrl && (
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <ExternalLink size={10} />{ad.ctaUrl}
                </span>
            )}
            {ad.imageUrl && (
                <span style={{ display: "flex", alignItems: "center", gap: 3, color: "#10b981" }}>
                <Image size={10} /> Image set
                </span>
            )}
            </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {/* Reorder */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <button
                onClick={onMoveUp}
                disabled={isFirst}
                style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 4, padding: "2px 6px", cursor: isFirst ? "not-allowed" : "pointer", opacity: isFirst ? 0.4 : 1 }}
            >
                <ChevronUp size={12} color="#64748b" />
            </button>
            <button
                onClick={onMoveDown}
                disabled={isLast}
                style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 4, padding: "2px 6px", cursor: isLast ? "not-allowed" : "pointer", opacity: isLast ? 0.4 : 1 }}
            >
                <ChevronDown size={12} color="#64748b" />
            </button>
            </div>

            {/* Toggle */}
            <button
            onClick={() => onToggle(ad._id)}
            disabled={toggling === ad._id}
            title={ad.isActive ? "Deactivate" : "Activate"}
            style={{ padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: 6, background: "white", cursor: "pointer", display: "flex", alignItems: "center" }}
            >
            {toggling === ad._id
                ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} color="#64748b" />
                : ad.isActive ? <EyeOff size={14} color="#dc2626" /> : <Eye size={14} color="#10b981" />}
            </button>

            {/* Edit */}
            <button
            onClick={() => onEdit(ad)}
            title="Edit"
            style={{ padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: 6, background: "white", cursor: "pointer", display: "flex", alignItems: "center" }}
            >
            <Edit2 size={14} color="#3b82f6" />
            </button>

            {/* Delete */}
            <button
            onClick={() => onDelete(ad._id, ad.title)}
            disabled={deleting === ad._id}
            title="Delete"
            style={{ padding: "6px 8px", border: "1px solid #fecaca", borderRadius: 6, background: "white", cursor: "pointer", display: "flex", alignItems: "center" }}
            >
            {deleting === ad._id
                ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} color="#dc2626" />
                : <Trash2 size={14} color="#dc2626" />}
            </button>
        </div>
        </div>
    </div>
    );

    /* ─── Main Component ──────────────────────────────── */
    export default function AdminAdsManager({ token }) {
    const [ads, setAds]           = useState([]);
    const [loading, setLoading]   = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingAd, setEditingAd] = useState(null);
    const [saving, setSaving]     = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [toggling, setToggling] = useState(null);

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

    /* ── Save (create or update) ── */
    const handleSave = async (form, imageFile) => {
        try {
        setSaving(true);

        const fd = new FormData();

        // Text fields
        const textFields = [
            "title", "subtitle", "tag", "ctaText", "ctaUrl",
            "accentColor", "bannerType", "bannerHeadline",
            "bannerDescription", "order", "isActive",
        ];
        textFields.forEach(f => {
            if (form[f] !== undefined && form[f] !== null) {
            fd.append(f, form[f]);
            }
        });

        // Image — file upload takes priority over manual URL
        if (imageFile) {
            fd.append("adImage", imageFile); // must match uploadAdImage.single("adImage")
        } else if (form.imageUrl) {
            fd.append("imageUrl", form.imageUrl);
        }

        // Don't set Content-Type — axios sets multipart/form-data + boundary automatically
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

    /* ── Toggle active ── */
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
    const moveAd = async (idx, dir) => {
        const newAds = [...ads];
        const swapIdx = dir === "up" ? idx - 1 : idx + 1;
        [newAds[idx], newAds[swapIdx]] = [newAds[swapIdx], newAds[idx]];
        const updated = newAds.map((a, i) => ({ ...a, order: i }));
        setAds(updated);
        try {
        await axios.patch(
            `${API_BASE_URL}/api/ads/admin/reorder`,
            { orders: updated.map(a => ({ id: a._id, order: a.order })) },
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

    /* ── Render ── */
    return (
        <>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
            <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <Megaphone size={22} color="#10b981" /> Advertisement Manager
            </h2>
            <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
                {ads.length} total · {ads.filter(a => a.isActive).length} active · {spotlightAds.length} spotlight · {bannerAds.length} full banner
            </p>
            </div>
            <button
            onClick={() => { setEditingAd(null); setShowForm(true); }}
            style={{
                display: "flex", alignItems: "center", gap: 8, padding: "9px 16px",
                background: "#10b981", border: "none", borderRadius: 8,
                color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer",
                fontFamily: "Inter, sans-serif",
            }}
            >
            <Plus size={15} /> Create New Ad
            </button>
        </div>

        {/* Info note */}
        <div style={{
            background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: 8,
            padding: "10px 14px", marginBottom: 20, fontSize: 12, color: "#1e40af",
            display: "flex", gap: 8, alignItems: "flex-start",
        }}>
            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
            <strong>Spotlight cards</strong> appear in the rotating featured section on the homepage.{" "}
            <strong>Full banners</strong> display as large hero-style ads above the spotlight section.
            Use display order to control which appears first.
            </span>
        </div>

        {/* Content */}
        {loading ? (
            <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>
            <Loader2 size={28} style={{ animation: "spin 1s linear infinite", display: "block", margin: "0 auto 12px" }} />
            Loading ads…
            </div>
        ) : ads.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ width: 64, height: 64, background: "#f1f5f9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Megaphone size={28} color="#cbd5e1" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>No ads created yet</div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>Create your first ad to display on the homepage</div>
            <button
                onClick={() => { setEditingAd(null); setShowForm(true); }}
                style={{ padding: "10px 20px", background: "#10b981", border: "none", borderRadius: 8, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif" }}
            >
                <Plus size={14} style={{ marginRight: 6, verticalAlign: "middle" }} /> Create First Ad
            </button>
            </div>
        ) : (
            <div>
            {/* Full Banners */}
            {bannerAds.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, background: "#3b82f6", borderRadius: "50%", display: "inline-block" }} />
                    Full Banners ({bannerAds.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {bannerAds.map((ad, i) => (
                    <AdCard
                        key={ad._id}
                        ad={ad}
                        isFirst={i === 0}
                        isLast={i === bannerAds.length - 1}
                        onEdit={a => { setEditingAd(a); setShowForm(true); }}
                        onDelete={handleDelete}
                        onToggle={handleToggle}
                        onMoveUp={() => moveAd(ads.indexOf(ad), "up")}
                        onMoveDown={() => moveAd(ads.indexOf(ad), "down")}
                        deleting={deleting}
                        toggling={toggling}
                    />
                    ))}
                </div>
                </div>
            )}

            {/* Spotlight Cards */}
            {spotlightAds.length > 0 && (
                <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, background: "#10b981", borderRadius: "50%", display: "inline-block" }} />
                    Spotlight Cards ({spotlightAds.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {spotlightAds.map((ad, i) => (
                    <AdCard
                        key={ad._id}
                        ad={ad}
                        isFirst={i === 0}
                        isLast={i === spotlightAds.length - 1}
                        onEdit={a => { setEditingAd(a); setShowForm(true); }}
                        onDelete={handleDelete}
                        onToggle={handleToggle}
                        onMoveUp={() => moveAd(ads.indexOf(ad), "up")}
                        onMoveDown={() => moveAd(ads.indexOf(ad), "down")}
                        deleting={deleting}
                        toggling={toggling}
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