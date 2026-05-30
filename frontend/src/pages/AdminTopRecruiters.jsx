import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Star, Loader2, CheckCircle, Clock, XCircle, Save, RefreshCw, Briefcase } from "lucide-react";
import API_BASE_URL from "../config/api";

export default function AdminTopRecruiters({ token }) {
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [filter, setFilter]         = useState("all");
  const [edits, setEdits]           = useState({});
  const [pickerOpen, setPickerOpen] = useState(null);
  const headers = { Authorization: `Bearer ${token}` };

  const fetchRecruiters = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/admin/top-recruiters/all`, { headers });
      setRecruiters(res.data.recruiters || []);
      setEdits({});
    } catch { toast.error("Failed to load recruiters"); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchRecruiters(); }, [fetchRecruiters]);

  const merged   = recruiters.map(r => ({ ...r, ...(edits[r._id] || {}) }));
  const featured = merged.filter(r => r.isFeatured).sort((a, b) => (a.order || 0) - (b.order || 0));
  const displayed = filter === "featured" ? featured : merged;
  const hasEdits  = Object.keys(edits).length > 0;

  const patch = (id, key, value) =>
    setEdits(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [key]: value } }));

    const handleToggle = (r) => {
        patch(r._id, "isFeatured", !r.isFeatured);
        if (r.isFeatured) patch(r._id, "order", 0);
    };

  const handleSaveAll = async () => {
    const updates = Object.entries(edits).map(([id, changes]) => ({ id, ...changes }));
    if (!updates.length) { toast("No changes to save"); return; }
    try {
      setSaving(true);
      await axios.post(`${API_BASE_URL}/api/admin/top-recruiters/batch`, { updates }, { headers });
      toast.success(`${updates.length} recruiter changes saved`);
      fetchRecruiters();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
      <Loader2 size={32} className="animate-spin" style={{ color: "#3b82f6" }} />
    </div>
  );

  return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #e2e8f0", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Featured Recruiters (Homepage)</h2>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            Featured: <strong>{featured.length}</strong> · Total verified: <strong>{recruiters.length}</strong>
            {hasEdits && <span style={{ color: "#f59e0b", marginLeft: 8 }}>● Unsaved changes</span>}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={fetchRecruiters}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px",
              borderRadius: 8, border: "1px solid #e2e8f0", background: "white", cursor: "pointer",
              fontSize: 13, fontWeight: 600, color: "#475569" }}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button onClick={handleSaveAll} disabled={saving || !hasEdits}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px",
              borderRadius: 8, border: "none", background: hasEdits ? "#10b981" : "#e2e8f0",
              color: hasEdits ? "white" : "#94a3b8",
              cursor: hasEdits ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 600 }}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? "Saving..." : "Save all changes"}
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div style={{ background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: 8,
        padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#1e40af" }}>
        <strong>How it works:</strong> Toggle any recruiter as featured, set display order (1 = first),
        and optionally pick which photo to show. Only featured recruiters with active jobs appear on the homepage.
        Hit <strong>Save all changes</strong> when done.
        Hit <strong>Save all changes</strong> when done.
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[{ key: "all", label: `All (${recruiters.length})` }, { key: "featured", label: `Featured (${featured.length})` }]
          .map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{ padding: "5px 14px", borderRadius: 20, border: "none", fontSize: 13,
                fontWeight: 600, cursor: "pointer",
                background: filter === f.key ? "#0f172a" : "#f1f5f9",
                color: filter === f.key ? "white" : "#64748b" }}>
              {f.label}
            </button>
          ))}
      </div>

      {/* Homepage preview strip */}
      {featured.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase",
            letterSpacing: "0.5px", marginBottom: 10 }}>
            Homepage preview · in display order
          </p>
          <div style={{ display: "flex", gap: 14, overflowX: "auto", padding: "12px 16px",
            background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
            {featured.map(r => {
              const initials = r.name?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
              return (
                <div key={r._id} style={{ display: "flex", flexDirection: "column", alignItems: "center",
                  gap: 6, minWidth: 72, flexShrink: 0 }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", overflow: "hidden",
                    background: "#e2e8f0", border: "1px solid #e2e8f0", display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#64748b" }}>
                    {r.logoUrl
                      ? <img src={r.logoUrl} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : initials}
                  </div>
                  <span style={{ fontSize: 10, color: "#64748b", textAlign: "center",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 72 }}>
                    {r.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recruiter cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 14 }}>
        {displayed.map(r => {
          const isFeat      = r.isFeatured;
          const isPicker    = pickerOpen === r._id;
          const images      = r.availableImages || [];
          const currentLogo = edits[r._id]?.featuredLogoUrl ?? r.featuredLogoUrl ?? r.logoUrl;
          const isEdited    = !!edits[r._id];
          const initials    = r.name?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

          return (
            <div key={r._id} style={{
              border: isFeat ? "1.5px solid #10b981" : "1px solid #e2e8f0",
              borderRadius: 12, padding: 16, background: "white",
              boxShadow: isFeat ? "0 0 0 3px #10b98118" : "none",
              outline: isEdited ? "2px dashed #f59e0b" : "none", outlineOffset: 2,
            }}>
              {/* Badges */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: 10, minHeight: 22 }}>
                {isEdited
                  ? <span style={{ background: "#fef3c7", color: "#92400e", fontSize: 10,
                      fontWeight: 700, padding: "2px 8px", borderRadius: 10 }}>Unsaved</span>
                  : <span />}
                {isFeat
                  ? <span style={{ background: "#d1fae5", color: "#065f46", fontSize: 10,
                      fontWeight: 700, padding: "2px 8px", borderRadius: 10,
                      display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Star size={10} fill="#065f46" /> Featured
                    </span>
                  : <span />}
              </div>

              {/* Avatar + info */}
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", overflow: "hidden",
                  flexShrink: 0, background: "#e2e8f0", border: "1px solid #e2e8f0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 700, color: "#64748b" }}>
                  {currentLogo
                    ? <img src={currentLogo} alt={r.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={e => { e.target.style.display = "none"; }} />
                    : initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 15,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {r.name}
                  </div>
                  {r.companyName && <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>{r.companyName}</div>}
                  {r.industryType && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{r.industryType}</div>}
                  <div style={{ marginTop: 4, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {r.verificationStatus === "approved"
                        ? <span style={{ background: "#d1fae5", color: "#065f46", padding: "2px 8px",
                            borderRadius: 10, fontSize: 11, fontWeight: 600,
                            display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <CheckCircle size={11} /> Verified
                        </span>
                        : r.verificationStatus === "pending"
                        ? <span style={{ background: "#fef3c7", color: "#92400e", padding: "2px 8px",
                            borderRadius: 10, fontSize: 11, fontWeight: 600,
                            display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Clock size={11} /> Pending
                        </span>
                        : <span style={{ background: "#f1f5f9", color: "#64748b", padding: "2px 8px",
                            borderRadius: 10, fontSize: 11, fontWeight: 600 }}>
                            Not verified
                        </span>}
                    </div>
                  <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 4,
                    fontSize: 11, color: "#10b981", fontWeight: 600 }}>
                    <Briefcase size={11} /> {r.jobCount} active job{r.jobCount !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Toggle */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>Show on homepage</span>
                  <button onClick={() => handleToggle(r)}
                    style={{ width: 44, height: 24, borderRadius: 12, border: "none",
                      cursor: "pointer", background: isFeat ? "#10b981" : "#e2e8f0",
                      position: "relative", transition: "background .2s", flexShrink: 0 }}>
                    <span style={{ position: "absolute", top: 3, left: isFeat ? 22 : 3,
                      width: 18, height: 18, borderRadius: "50%", background: "white",
                      transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
                  </button>
                </div>

                {/* Order */}
                {isFeat && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>Display order</span>
                    <input type="number" min={1} value={r.order || ""} placeholder="1"
                      onChange={e => patch(r._id, "order", parseInt(e.target.value) || 1)}
                      style={{ width: 60, padding: "4px 8px", borderRadius: 6,
                        border: "1px solid #e2e8f0", fontSize: 13, textAlign: "center", color: "#0f172a" }} />
                  </div>
                )}

                {/* Image picker */}
                {isFeat && images.length > 0 && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center",
                      justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>Photo to display</span>
                      <button onClick={() => setPickerOpen(isPicker ? null : r._id)}
                        style={{ fontSize: 12, color: "#3b82f6", background: "none",
                          border: "none", cursor: "pointer", fontWeight: 600 }}>
                        {isPicker ? "Close" : "Change"}
                      </button>
                    </div>
                    {isPicker && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: 10,
                        background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                        {images.map((url, idx) => {
                          const sel = currentLogo === url;
                          return (
                            <div key={idx}
                              onClick={() => { patch(r._id, "featuredLogoUrl", url); setPickerOpen(null); }}
                              style={{ width: 52, height: 52, borderRadius: "50%", overflow: "hidden",
                                border: sel ? "2px solid #10b981" : "1px solid #e2e8f0",
                                cursor: "pointer", background: "white" }}>
                              <img src={url} alt={`option ${idx + 1}`}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {isFeat && images.length === 0 && (
                  <div style={{ fontSize: 12, color: "#94a3b8", padding: "6px 10px",
                    background: "#f8fafc", borderRadius: 6, border: "1px solid #e2e8f0" }}>
                    No profile photo uploaded. Initials will show instead.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {displayed.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 24px", color: "#64748b" }}>
          No verified recruiters found
        </div>
      )}
    </div>
  );
}