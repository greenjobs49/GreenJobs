import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Star, Loader2, CheckCircle, Clock, XCircle, Save, RefreshCw } from "lucide-react";
import API_BASE_URL from "../config/api";

export default function AdminTopCompanies({ token }) {
  const [companies, setCompanies]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [filter, setFilter]         = useState("all");
  const [edits, setEdits]           = useState({});
  const [pickerOpen, setPickerOpen] = useState(null);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      // ✅ Fixed URL — now under /api/admin/
      const res = await axios.get(`${API_BASE_URL}/api/admin/top-companies/all`, { headers });
      setCompanies(res.data.companies || []);
      setEdits({});
    } catch {
      toast.error("Failed to load companies");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const merged = companies.map(c => ({
    ...c,
    ...(edits[c._id] || {}),
  }));

  const featured = merged.filter(c => c.isFeatured).sort((a, b) => (a.order || 0) - (b.order || 0));
  const displayed = filter === "featured" ? featured : merged;

  const patch = (id, key, value) => {
    setEdits(prev => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [key]: value },
    }));
  };

  const handleToggleFeatured = (c) => {
    if (c.status !== "approved" && !c.isFeatured) {
      toast.error("Only approved businesses can be featured");
      return;
    }
    const nowFeatured = !c.isFeatured;
    patch(c._id, "isFeatured", nowFeatured);
    if (!nowFeatured) patch(c._id, "order", 0);
  };

  const handleSaveAll = async () => {
    const updates = Object.entries(edits).map(([id, changes]) => ({ id, ...changes }));
    if (updates.length === 0) { toast("No changes to save"); return; }
    try {
      setSaving(true);
      // ✅ Fixed URL — now under /api/admin/
      await axios.post(`${API_BASE_URL}/api/admin/top-companies/batch`, { updates }, { headers });
      toast.success(`${updates.length} company changes saved`);
      fetchCompanies();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (status) => {
    const map = {
      approved: { bg: "#d1fae5", color: "#065f46", icon: <CheckCircle size={12}/>, label: "Approved" },
      pending:  { bg: "#fef3c7", color: "#92400e", icon: <Clock size={12}/>,       label: "Pending"  },
      rejected: { bg: "#fee2e2", color: "#991b1b", icon: <XCircle size={12}/>,     label: "Rejected" },
    };
    const s = map[status] || map.pending;
    return (
      <span style={{ background: s.bg, color: s.color, padding: "2px 8px", borderRadius: 10,
        fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
        {s.icon}{s.label}
      </span>
    );
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
      <Loader2 size={32} className="animate-spin" style={{ color: "#3b82f6" }} />
    </div>
  );

  const hasEdits = Object.keys(edits).length > 0;

  return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #e2e8f0", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Top Companies (Homepage)</h2>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            Featured: <strong>{featured.length}</strong> · Total: <strong>{companies.length}</strong>
            {hasEdits && <span style={{ color: "#f59e0b", marginLeft: 8 }}>● Unsaved changes</span>}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={fetchCompanies}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px",
              borderRadius: 8, border: "1px solid #e2e8f0", background: "white", cursor: "pointer",
              fontSize: 13, fontWeight: 600, color: "#475569" }}>
            <RefreshCw size={15}/> Refresh
          </button>
          <button onClick={handleSaveAll} disabled={saving || !hasEdits}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px",
              borderRadius: 8, border: "none", background: hasEdits ? "#10b981" : "#e2e8f0",
              color: hasEdits ? "white" : "#94a3b8", cursor: hasEdits ? "pointer" : "not-allowed",
              fontSize: 13, fontWeight: 600 }}>
            {saving ? <Loader2 size={15} className="animate-spin"/> : <Save size={15}/>}
            {saving ? "Saving..." : "Save all changes"}
          </button>
        </div>
      </div>

      {/* ── Info banner ── */}
      <div style={{ background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: 8,
        padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#1e40af" }}>
        <strong>How it works:</strong> Toggle a company as featured, set its display order (1 = first),
        and optionally pick which of its uploaded S3 images to show. Hit <strong>Save all changes</strong> when done.
        Only <strong>approved</strong> businesses can be featured.
      </div>

      {/* ── Filter pills ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[
          { key: "all",      label: `All (${companies.length})` },
          { key: "featured", label: `Featured (${featured.length})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{ padding: "5px 14px", borderRadius: 20, border: "none", fontSize: 13,
              fontWeight: 600, cursor: "pointer",
              background: filter === f.key ? "#0f172a" : "#f1f5f9",
              color: filter === f.key ? "white" : "#64748b" }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Homepage preview strip ── */}
      {featured.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase",
            letterSpacing: "0.5px", marginBottom: 10 }}>
            Homepage preview · in display order
          </p>
          <div style={{ display: "flex", gap: 14, overflowX: "auto", padding: "12px 16px",
            background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
            {featured.map(c => (
              <div key={c._id} style={{ display: "flex", flexDirection: "column", alignItems: "center",
                gap: 6, minWidth: 72, flexShrink: 0 }}>
                <div style={{ width: 52, height: 52, borderRadius: 10, overflow: "hidden",
                  background: "white", border: "1px solid #e2e8f0", display: "flex",
                  alignItems: "center", justifyContent: "center" }}>
                  {c.logoUrl
                    ? <img src={c.logoUrl} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "contain" }}/>
                    : <span style={{ fontSize: 20, fontWeight: 700, color: "#94a3b8" }}>{c.name?.[0]}</span>}
                </div>
                <span style={{ fontSize: 10, color: "#64748b", textAlign: "center",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 72 }}>
                  {c.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Company cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 14 }}>
        {displayed.map(c => {
          const isFeat      = c.isFeatured;
          const isPicker    = pickerOpen === c._id;
          const images      = c.availableImages || [];
          // Show the locally-edited logo if changed, else server logo
          const currentLogo = edits[c._id]?.featuredLogoUrl ?? c.featuredLogoUrl ?? c.logoUrl;
          const isEdited    = !!edits[c._id];

          return (
            <div key={c._id} style={{
              border: isFeat ? "1.5px solid #10b981" : "1px solid #e2e8f0",
              borderRadius: 12, padding: 16, position: "relative", background: "white",
              boxShadow: isFeat ? "0 0 0 3px #10b98118" : "none",
              outline: isEdited ? "2px dashed #f59e0b" : "none",
              outlineOffset: 2,
            }}>

              {/* Badges row — both sit at top so they don't overlap */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: isFeat || isEdited ? 10 : 0, minHeight: isFeat || isEdited ? 22 : 0 }}>
                {isEdited
                  ? <span style={{ background: "#fef3c7", color: "#92400e", fontSize: 10,
                      fontWeight: 700, padding: "2px 8px", borderRadius: 10 }}>Unsaved</span>
                  : <span/>}
                {isFeat
                  ? <span style={{ background: "#d1fae5", color: "#065f46", fontSize: 10,
                      fontWeight: 700, padding: "2px 8px", borderRadius: 10,
                      display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Star size={10} fill="#065f46"/> Featured
                    </span>
                  : <span/>}
              </div>

              {/* Logo + info */}
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: 10, overflow: "hidden",
                  border: "1px solid #e2e8f0", flexShrink: 0, background: "#f8fafc",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {currentLogo
                    ? <img src={currentLogo} alt={c.name}
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                        onError={e => { e.target.style.display = "none"; }}/>
                    : <span style={{ fontSize: 22, fontWeight: 700, color: "#94a3b8" }}>{c.name?.[0]}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 15,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{c.category || "Uncategorized"}</div>
                  <div style={{ marginTop: 4 }}>{statusBadge(c.status)}</div>
                </div>
              </div>

              {/* Controls */}
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>

                {/* Featured toggle */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>Show on homepage</span>
                  <button
                    onClick={() => handleToggleFeatured(c)}
                    disabled={c.status !== "approved" && !isFeat}
                    title={c.status !== "approved" ? "Approve the business first" : ""}
                    style={{
                      width: 44, height: 24, borderRadius: 12, border: "none",
                      cursor: c.status === "approved" || isFeat ? "pointer" : "not-allowed",
                      background: isFeat ? "#10b981" : "#e2e8f0",
                      position: "relative", transition: "background .2s", flexShrink: 0,
                    }}>
                    <span style={{
                      position: "absolute", top: 3, left: isFeat ? 22 : 3,
                      width: 18, height: 18, borderRadius: "50%", background: "white",
                      transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)",
                    }}/>
                  </button>
                </div>

                {/* Display order — only when featured */}
                {isFeat && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>Display order</span>
                    <input
                      type="number" min={1}
                      value={c.order || ""}
                      onChange={e => patch(c._id, "order", parseInt(e.target.value) || 1)}
                      placeholder="1"
                      style={{ width: 60, padding: "4px 8px", borderRadius: 6,
                        border: "1px solid #e2e8f0", fontSize: 13, textAlign: "center",
                        outline: "none", color: "#0f172a" }}/>
                  </div>
                )}

                {/* Image picker — only when featured and images exist */}
                {isFeat && images.length > 0 && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center",
                      justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>Logo to display</span>
                      <button
                        onClick={() => setPickerOpen(isPicker ? null : c._id)}
                        style={{ fontSize: 12, color: "#3b82f6", background: "none",
                          border: "none", cursor: "pointer", fontWeight: 600 }}>
                        {isPicker ? "Close" : "Change"}
                      </button>
                    </div>

                    {/* Current selected logo preview */}
                    {!isPicker && currentLogo && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8,
                        padding: "6px 10px", background: "#f8fafc", borderRadius: 8,
                        border: "1px solid #e2e8f0" }}>
                        <img src={currentLogo} alt="selected"
                          style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 6 }}
                          onError={e => { e.target.style.display = "none"; }}/>
                        <span style={{ fontSize: 12, color: "#64748b" }}>Currently selected</span>
                      </div>
                    )}

                    {isPicker && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "10px",
                        background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                        {images.map((url, i) => {
                          const isSelected = currentLogo === url;
                          return (
                            <div key={i}
                              onClick={() => { patch(c._id, "featuredLogoUrl", url); setPickerOpen(null); }}
                              title={`Image ${i + 1}`}
                              style={{ width: 56, height: 56, borderRadius: 8, overflow: "hidden",
                                border: isSelected ? "2px solid #10b981" : "1px solid #e2e8f0",
                                cursor: "pointer", background: "white", flexShrink: 0,
                                boxShadow: isSelected ? "0 0 0 3px #10b98130" : "none",
                                position: "relative" }}>
                              <img src={url} alt={`option ${i + 1}`}
                                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                onError={e => {
                                  e.target.parentElement.innerHTML =
                                    `<div style="width:100%;height:100%;display:flex;align-items:center;
                                    justify-content:center;font-size:10px;color:#94a3b8">Err</div>`;
                                }}/>
                              {isSelected && (
                                <div style={{ position: "absolute", bottom: 2, right: 2,
                                  width: 14, height: 14, borderRadius: "50%",
                                  background: "#10b981", display: "flex",
                                  alignItems: "center", justifyContent: "center" }}>
                                  <CheckCircle size={10} color="white"/>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* No images warning */}
                {isFeat && images.length === 0 && (
                  <div style={{ fontSize: 12, color: "#94a3b8", padding: "6px 10px",
                    background: "#f8fafc", borderRadius: 6, border: "1px solid #e2e8f0" }}>
                    No images uploaded for this business yet. The business name will show instead.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {displayed.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 24px", color: "#64748b" }}>
          No companies found
        </div>
      )}
    </div>
  );
}