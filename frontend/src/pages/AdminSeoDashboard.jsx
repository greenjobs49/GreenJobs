import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Search, Globe, FileText, Map, Edit3,
  Save, RefreshCw, Loader2, CheckCircle, XCircle,
  Eye, AlertCircle, ExternalLink,
  Twitter, Share2, Code, ToggleLeft, ToggleRight,
} from "lucide-react";
import API_BASE_URL from "../config/api";
import toast from "react-hot-toast";

const ROBOTS_OPTIONS     = ["index,follow","index,nofollow","noindex,follow","noindex,nofollow"];
const CHANGEFREQ_OPTIONS = ["always","hourly","daily","weekly","monthly","yearly","never"];
const OG_TYPE_OPTIONS    = ["website","article","job_listing","profile"];

// ── Tiny helper components ────────────────────────────────────────────────────
const Label = ({ children }) => (
  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#64748b",
    textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>
    {children}
  </label>
);

const Field = ({ children, hint }) => (
  <div style={{ marginBottom:18 }}>
    {children}
    {hint && <div style={{ fontSize:11, color:"#94a3b8", marginTop:4 }}>{hint}</div>}
  </div>
);

const Input = ({ value, onChange, placeholder, maxLength, disabled }) => (
  <input
    value={value ?? ""}
    onChange={onChange}
    placeholder={placeholder}
    maxLength={maxLength}
    disabled={disabled}
    style={{
      width:"100%", padding:"9px 12px", border:"1px solid #e2e8f0",
      borderRadius:8, fontSize:14, outline:"none", fontFamily:"inherit",
      boxSizing:"border-box", background: disabled ? "#f8fafc" : "white",
      transition:"border-color 0.15s",
    }}
    onFocus={e => e.target.style.borderColor = "#3b82f6"}
    onBlur={e  => e.target.style.borderColor = "#e2e8f0"}
  />
);

const Textarea = ({ value, onChange, placeholder, rows = 3, maxLength, mono }) => (
  <textarea
    value={value ?? ""}
    onChange={onChange}
    placeholder={placeholder}
    rows={rows}
    maxLength={maxLength}
    style={{
      width:"100%", padding:"9px 12px", border:"1px solid #e2e8f0",
      borderRadius:8, fontSize:13, outline:"none",
      fontFamily: mono ? "monospace" : "inherit",
      resize:"vertical", boxSizing:"border-box", lineHeight:1.6,
      transition:"border-color 0.15s",
    }}
    onFocus={e => e.target.style.borderColor = "#3b82f6"}
    onBlur={e  => e.target.style.borderColor = "#e2e8f0"}
  />
);

const Select = ({ value, onChange, options }) => (
  <select
    value={value ?? ""}
    onChange={onChange}
    style={{
      width:"100%", padding:"9px 12px", border:"1px solid #e2e8f0",
      borderRadius:8, fontSize:13, outline:"none", fontFamily:"inherit",
      background:"white", cursor:"pointer",
    }}
  >
    {options.map(o => (
      <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>
        {typeof o === "string" ? o : o.label}
      </option>
    ))}
  </select>
);

const CharCount = ({ value, max }) => {
  const len  = (value || "").length;
  const over = len > max;
  return (
    <span style={{ fontSize:11, color: over ? "#ef4444" : len > max * 0.85 ? "#f59e0b" : "#94a3b8" }}>
      {len}/{max}
    </span>
  );
};

// ── Social preview cards ──────────────────────────────────────────────────────
const GooglePreview = ({ title, description, url }) => (
  <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:8, padding:16, fontSize:13 }}>
    <div style={{ fontSize:11, color:"#202124", marginBottom:2, fontFamily:"arial,sans-serif" }}>
      {url || "https://yourdomain.com/page"}
    </div>
    <div style={{ fontSize:18, color:"#1a0dab", fontFamily:"arial,sans-serif", marginBottom:4, lineHeight:1.3 }}>
      {title || "Page Title"}
    </div>
    <div style={{ color:"#4d5156", fontFamily:"arial,sans-serif", lineHeight:1.5 }}>
      {description || "Page description will appear here in Google search results."}
    </div>
  </div>
);

const OGPreview = ({ title, description, image, url }) => {
  let hostname = "yourdomain.com";
  try {
    if (url) hostname = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
  } catch {}
  return (
    <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:8, overflow:"hidden", maxWidth:480 }}>
      {image
        ? <img src={image} alt="" style={{ width:"100%", height:200, objectFit:"cover", display:"block" }} onError={e => e.target.style.display = "none"} />
        : <div style={{ width:"100%", height:140, background:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Share2 size={32} color="#cbd5e1" />
          </div>
      }
      <div style={{ padding:"12px 16px" }}>
        <div style={{ fontSize:11, color:"#94a3b8", textTransform:"uppercase", marginBottom:4 }}>{hostname}</div>
        <div style={{ fontWeight:700, fontSize:15, color:"#0f172a", marginBottom:4, lineHeight:1.3 }}>
          {title || "Open Graph Title"}
        </div>
        <div style={{ fontSize:13, color:"#64748b", lineHeight:1.5 }}>
          {description || "Open Graph description for social sharing."}
        </div>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const AdminSeoDashboard = ({ token }) => {
  const [pages,          setPages]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [activeSection,  setActiveSection]  = useState("pages");
  const [editingPage,    setEditingPage]    = useState(null);
  const [form,           setForm]           = useState({});
  const [searchTerm,     setSearchTerm]     = useState("");
  const [previewTab,     setPreviewTab]     = useState("google");
  const [sitemapXml,     setSitemapXml]     = useState("");
  const [loadingSitemap, setLoadingSitemap] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const getHeaders = () => ({ Authorization: `Bearer ${token}` });

  // ── Fetch pages ────────────────────────────────────────────────────────────
  const fetchPages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/admin/seo`, {
        headers: getHeaders(),
      });
      setPages(res.data.pages || []);
    } catch {
      toast.error("Failed to load SEO pages");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  // ── Open edit ──────────────────────────────────────────────────────────────
  const openEdit = (page) => {
    setEditingPage(page);
    setForm({
      title:              page.title              || "",
      description:        page.description        || "",
      keywords:           (page.keywords || []).join(", "),
      canonical:          page.canonical          || "",
      robots:             page.robots             || "index,follow",
      ogTitle:            page.ogTitle            || "",
      ogDescription:      page.ogDescription      || "",
      ogImage:            page.ogImage            || "",
      ogType:             page.ogType             || "website",
      twitterCard:        page.twitterCard        || "summary_large_image",
      twitterTitle:       page.twitterTitle       || "",
      twitterDescription: page.twitterDescription || "",
      twitterImage:       page.twitterImage       || "",
      schemaMarkup:       page.schemaMarkup       || "",
      includeInSitemap:   page.includeInSitemap !== false,
      sitemapPriority:    page.sitemapPriority    ?? 0.8,
      sitemapChangefreq:  page.sitemapChangefreq  || "weekly",
      robotsTxtContent:   page.robotsTxtContent   || "",
    });
    setPreviewTab("google");
  };

  const f  = (field) => (e)   => setForm(p => ({ ...p, [field]: e.target.value }));
  const fb = (field) => (val) => setForm(p => ({ ...p, [field]: val }));

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!editingPage) return;

    if (form.schemaMarkup?.trim()) {
      try { JSON.parse(form.schemaMarkup); }
      catch {
        toast.error("Schema markup is not valid JSON — fix it before saving.");
        return;
      }
    }

    try {
      setSaving(true);
      await axios.put(
        `${API_BASE_URL}/api/admin/seo/${editingPage.pageKey}`,
        form,
        { headers: getHeaders() }
      );
      toast.success(`"${editingPage.pageLabel || editingPage.pageKey}" saved!`);
      await fetchPages();
      setEditingPage(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // ── OG Image upload ────────────────────────────────────────────────────────
  // FIX 1: moved inside the component so it can access editingPage, getHeaders,
  //         setUploadingImage, setForm, and toast.
  const handleOgImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("ogImage", file);
    formData.append("pageKey", editingPage.pageKey);
    try {
      setUploadingImage(true);
      const res = await axios.post(
        `${API_BASE_URL}/api/admin/seo/upload-image`,
        formData,
        { headers: { ...getHeaders(), "Content-Type": "multipart/form-data" } }
      );
      setForm(p => ({ ...p, ogImage: res.data.imageUrl }));
      toast.success("Image uploaded!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  // ── Sitemap preview ────────────────────────────────────────────────────────
  const loadSitemap = async () => {
    try {
      setLoadingSitemap(true);
      const base = API_BASE_URL.endsWith("/api")
        ? API_BASE_URL.slice(0, -4)
        : API_BASE_URL.replace(/\/api$/, "");
      const res = await axios.get(`${base}/sitemap.xml`);
      setSitemapXml(res.data);
    } catch {
      toast.error("Could not load sitemap — make sure the backend is running");
    } finally {
      setLoadingSitemap(false);
    }
  };

  const filteredPages = pages.filter(p =>
    p.pageKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.pageLabel?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const robotsPage = pages.find(p => p.pageKey === "robots-txt");

  const getPageHealth = (page) => {
    const issues = [];
    if (!page.title)       issues.push("No title");
    if (!page.description) issues.push("No description");
    if (!page.ogImage)     issues.push("No OG image");
    return issues;
  };

  // ── Shared styles ──────────────────────────────────────────────────────────
  const S = {
    wrap:    { fontFamily:"'Inter', sans-serif" },
    sectNav: { display:"flex", gap:8, marginBottom:24, borderBottom:"2px solid #e2e8f0" },
    sectBtn: (active) => ({
      padding:"10px 20px", border:"none", background:"none", cursor:"pointer",
      fontSize:14, fontWeight:600,
      color: active ? "#3b82f6" : "#64748b",
      borderBottom: active ? "2px solid #3b82f6" : "2px solid transparent",
      marginBottom:-2, transition:"all 0.15s", fontFamily:"inherit",
    }),
    card:    { background:"white", border:"1px solid #e2e8f0", borderRadius:12, padding:20, marginBottom:12 },
    grid2:   { display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 },
    btn: (variant) => {
      const map = {
        primary:   { background:"#3b82f6", color:"white", border:"none" },
        success:   { background:"#10b981", color:"white", border:"none" },
        secondary: { background:"white",   color:"#475569", border:"1px solid #e2e8f0" },
        danger:    { background:"white",   color:"#dc2626", border:"1px solid #fecaca" },
      };
      return {
        ...map[variant],
        display:"inline-flex", alignItems:"center", gap:6,
        padding:"9px 16px", borderRadius:8, fontSize:13, fontWeight:600,
        cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s",
        textDecoration:"none",
      };
    },
    tag: (color) => ({
      display:"inline-flex", alignItems:"center", gap:4,
      padding:"3px 10px", borderRadius:100, fontSize:11, fontWeight:700,
      background: color==="green" ? "#d1fae5" : color==="red" ? "#fee2e2" : color==="blue" ? "#dbeafe" : "#f1f5f9",
      color:      color==="green" ? "#065f46" : color==="red" ? "#991b1b" : color==="blue" ? "#1e40af" : "#475569",
    }),
    back: {
      display:"inline-flex", alignItems:"center", gap:6, color:"#64748b",
      fontSize:13, fontWeight:600, cursor:"pointer", marginBottom:20,
      background:"none", border:"none", fontFamily:"inherit", padding:0,
    },
    sectionTitle: {
      fontSize:13, fontWeight:700, color:"#0f172a", marginBottom:12,
      paddingBottom:8, borderBottom:"1px solid #f1f5f9",
      display:"flex", alignItems:"center", gap:6,
    },
  };

  // ── EDIT FORM VIEW ─────────────────────────────────────────────────────────
  if (editingPage) {
    const isRobots = editingPage.pageKey === "robots-txt";
    return (
      <div style={S.wrap}>
        <button style={S.back} onClick={() => setEditingPage(null)}>← Back to all pages</button>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, flexWrap:"wrap", gap:12 }}>
          <div>
            <h2 style={{ fontSize:20, fontWeight:700, color:"#0f172a", marginBottom:2 }}>
              {editingPage.pageLabel || editingPage.pageKey}
            </h2>
            <div style={{ fontSize:12, color:"#64748b", display:"flex", alignItems:"center", gap:8 }}>
              <code style={{ background:"#f1f5f9", padding:"2px 8px", borderRadius:4 }}>{editingPage.pageKey}</code>
              <span style={S.tag(editingPage.pageType === "static" ? "blue" : "green")}>{editingPage.pageType}</span>
            </div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button style={S.btn("secondary")} onClick={() => setEditingPage(null)}>Cancel</button>
            <button style={S.btn("success")} onClick={handleSave} disabled={saving}>
              {saving
                ? <><Loader2 size={14} style={{ animation:"spin 1s linear infinite" }} /> Saving…</>
                : <><Save size={14} /> Save Changes</>}
            </button>
          </div>
        </div>

        {isRobots ? (
          <div style={S.card}>
            <div style={S.sectionTitle}><FileText size={15} /> Robots.txt Content</div>
            <Field hint="Controls how search engine crawlers access your site.">
              <Textarea
                value={form.robotsTxtContent}
                onChange={f("robotsTxtContent")}
                rows={14}
                mono
                placeholder={`User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: https://yourdomain.com/sitemap.xml`}
              />
            </Field>
            <div style={{ background:"#fffbeb", border:"1px solid #fcd34d", borderRadius:8, padding:"10px 14px", fontSize:12, color:"#92400e" }}>
              ⚠ Be careful — an incorrect robots.txt can accidentally block search engines from your entire site.
            </div>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 420px", gap:20, alignItems:"start" }}>
            {/* ── Left: form ── */}
            <div>
              {/* Core Meta */}
              <div style={S.card}>
                <div style={S.sectionTitle}><Globe size={15} /> Core Meta Tags</div>
                <Field hint={<span>Ideal: 50–60 chars &nbsp;<CharCount value={form.title} max={60} /></span>}>
                  <Label>Page Title *</Label>
                  <Input value={form.title} onChange={f("title")} placeholder="My Page Title | Brand Name" maxLength={160} />
                </Field>
                <Field hint={<span>Ideal: 120–160 chars &nbsp;<CharCount value={form.description} max={160} /></span>}>
                  <Label>Meta Description *</Label>
                  <Textarea value={form.description} onChange={f("description")} placeholder="Describe this page in 1-2 sentences…" rows={3} maxLength={320} />
                </Field>
                <Field hint="Comma-separated keywords">
                  <Label>Keywords</Label>
                  <Input value={form.keywords} onChange={f("keywords")} placeholder="jobs, hiring, recruitment, india" />
                </Field>
                <div style={S.grid2}>
                  <Field>
                    <Label>Robots</Label>
                    <Select value={form.robots} onChange={f("robots")} options={ROBOTS_OPTIONS} />
                  </Field>
                  <Field hint="Leave blank to use default URL">
                    <Label>Canonical URL</Label>
                    <Input value={form.canonical} onChange={f("canonical")} placeholder="https://yourdomain.com/page" />
                  </Field>
                </div>
              </div>

              {/* Open Graph */}
              <div style={S.card}>
                <div style={S.sectionTitle}><Share2 size={15} /> Open Graph (Facebook / LinkedIn)</div>
                <Field hint="Defaults to Page Title if empty">
                  <Label>OG Title</Label>
                  <Input value={form.ogTitle} onChange={f("ogTitle")} placeholder="Title for social sharing" maxLength={160} />
                </Field>
                <Field hint="Defaults to Meta Description if empty">
                  <Label>OG Description</Label>
                  <Textarea value={form.ogDescription} onChange={f("ogDescription")} rows={2} placeholder="Description for social sharing" maxLength={320} />
                </Field>
                <div style={S.grid2}>
                  {/* FIX 2: </Field> closing tag is now correctly placed AFTER the upload div */}
                  <Field hint="Recommended: 1200×630px">
                    <Label>OG Image URL</Label>
                    <Input value={form.ogImage} onChange={f("ogImage")} placeholder="https://…/og-image.jpg" />
                    <div style={{ marginTop:6, display:"flex", alignItems:"center", gap:8 }}>
                      <label style={{ ...S.btn("secondary"), cursor:"pointer", fontSize:12, padding:"6px 12px" }}>
                        {uploadingImage
                          ? <><Loader2 size={12} style={{ animation:"spin 1s linear infinite" }} /> Uploading…</>
                          : "Upload Image"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          style={{ display:"none" }}
                          onChange={handleOgImageUpload}
                          disabled={uploadingImage}
                        />
                      </label>
                      {form.ogImage && (
                        <img
                          src={form.ogImage}
                          alt="OG preview"
                          style={{ height:36, borderRadius:4, border:"1px solid #e2e8f0", objectFit:"cover" }}
                          onError={e => e.target.style.display = "none"}
                        />
                      )}
                    </div>
                  </Field>
                  <Field>
                    <Label>OG Type</Label>
                    <Select value={form.ogType} onChange={f("ogType")} options={OG_TYPE_OPTIONS} />
                  </Field>
                </div>
              </div>

              {/* Twitter */}
              <div style={S.card}>
                <div style={S.sectionTitle}><Twitter size={15} /> Twitter Card</div>
                <Field>
                  <Label>Card Type</Label>
                  <Select value={form.twitterCard} onChange={f("twitterCard")} options={["summary","summary_large_image"]} />
                </Field>
                <div style={S.grid2}>
                  <Field>
                    <Label>Twitter Title</Label>
                    <Input value={form.twitterTitle} onChange={f("twitterTitle")} placeholder="Defaults to OG Title" maxLength={160} />
                  </Field>
                  <Field>
                    <Label>Twitter Image URL</Label>
                    <Input value={form.twitterImage} onChange={f("twitterImage")} placeholder="Defaults to OG Image" />
                  </Field>
                </div>
                <Field>
                  <Label>Twitter Description</Label>
                  <Textarea value={form.twitterDescription} onChange={f("twitterDescription")} rows={2} placeholder="Defaults to OG Description" maxLength={320} />
                </Field>
              </div>

              {/* JSON-LD */}
              <div style={S.card}>
                <div style={S.sectionTitle}><Code size={15} /> JSON-LD Schema Markup</div>
                <Field hint="Must be valid JSON or save will be rejected.">
                  <Textarea
                    value={form.schemaMarkup}
                    onChange={f("schemaMarkup")}
                    rows={8}
                    mono
                    placeholder={`{\n  "@context": "https://schema.org",\n  "@type": "WebPage",\n  "name": "Page Name"\n}`}
                  />
                </Field>
                {form.schemaMarkup?.trim() && (() => {
                  try {
                    JSON.parse(form.schemaMarkup);
                    return <div style={{ color:"#10b981", fontSize:12, display:"flex", alignItems:"center", gap:4 }}><CheckCircle size={12} /> Valid JSON</div>;
                  } catch {
                    return <div style={{ color:"#ef4444", fontSize:12, display:"flex", alignItems:"center", gap:4 }}><XCircle size={12} /> Invalid JSON — fix before saving</div>;
                  }
                })()}
              </div>

              {/* Sitemap settings */}
              <div style={S.card}>
                <div style={S.sectionTitle}><Map size={15} /> Sitemap Settings</div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, padding:"12px 16px", background:"#f8fafc", borderRadius:8 }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>Include in Sitemap</div>
                    <div style={{ fontSize:12, color:"#64748b" }}>Whether this page appears in sitemap.xml</div>
                  </div>
                  <button
                    onClick={() => fb("includeInSitemap")(!form.includeInSitemap)}
                    style={{ background:"none", border:"none", cursor:"pointer", color: form.includeInSitemap ? "#10b981" : "#94a3b8" }}
                  >
                    {form.includeInSitemap ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                  </button>
                </div>
                <div style={S.grid2}>
                  <Field>
                    <Label>Change Frequency</Label>
                    <Select value={form.sitemapChangefreq} onChange={f("sitemapChangefreq")} options={CHANGEFREQ_OPTIONS} />
                  </Field>
                  <Field hint="0.0 (lowest) to 1.0 (highest)">
                    <Label>Priority</Label>
                    <Input value={form.sitemapPriority} onChange={f("sitemapPriority")} placeholder="0.8" />
                  </Field>
                </div>
              </div>
            </div>

            {/* ── Right: live preview + health ── */}
            <div style={{ position:"sticky", top:20 }}>
              <div style={S.card}>
                <div style={{ display:"flex", gap:8, marginBottom:16 }}>
                  {["google","og"].map(t => (
                    <button
                      key={t}
                      onClick={() => setPreviewTab(t)}
                      style={{
                        padding:"6px 14px", borderRadius:8, border:"none",
                        fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
                        background: previewTab === t ? "#0f172a" : "#f1f5f9",
                        color:      previewTab === t ? "white"   : "#64748b",
                      }}
                    >
                      {t === "google" ? "Google" : "Social"}
                    </button>
                  ))}
                </div>
                {previewTab === "google"
                  ? <GooglePreview title={form.title} description={form.description} url={form.canonical} />
                  : <OGPreview title={form.ogTitle || form.title} description={form.ogDescription || form.description} image={form.ogImage} url={form.canonical} />
                }
              </div>

              <div style={{ ...S.card, background:"#f8fafc" }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#64748b", marginBottom:10, textTransform:"uppercase", letterSpacing:"0.05em" }}>
                  Page Health
                </div>
                {[
                  { label:"Title set",       ok: !!form.title },
                  { label:"Description set", ok: !!form.description },
                  { label:"OG image set",    ok: !!form.ogImage },
                  { label:"Valid robots",    ok: !!form.robots },
                  { label:"Schema markup",   ok: !!form.schemaMarkup },
                ].map((item, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, fontSize:13, color: item.ok ? "#065f46" : "#94a3b8" }}>
                    {item.ok
                      ? <CheckCircle size={14} color="#10b981" />
                      : <div style={{ width:14, height:14, borderRadius:"50%", border:"2px solid #e2e8f0" }} />}
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bottom save bar */}
        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:16, paddingTop:16, borderTop:"1px solid #f1f5f9" }}>
          <button style={S.btn("secondary")} onClick={() => setEditingPage(null)}>Cancel</button>
          <button style={S.btn("success")} onClick={handleSave} disabled={saving}>
            {saving
              ? <><Loader2 size={14} style={{ animation:"spin 1s linear infinite" }} /> Saving…</>
              : <><Save size={14} /> Save Changes</>}
          </button>
        </div>

        <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── PAGE LIST VIEW ─────────────────────────────────────────────────────────
  return (
    <div style={S.wrap}>
      {/* Section nav */}
      <div style={S.sectNav}>
        {[
          { key:"pages",   label:"Page Meta",  icon:<Globe    size={14} /> },
          { key:"robots",  label:"Robots.txt", icon:<FileText size={14} /> },
          { key:"sitemap", label:"Sitemap",    icon:<Map      size={14} /> },
        ].map(s => (
          <button key={s.key} style={S.sectBtn(activeSection === s.key)} onClick={() => setActiveSection(s.key)}>
            <span style={{ display:"inline-flex", alignItems:"center", gap:6 }}>{s.icon}{s.label}</span>
          </button>
        ))}
      </div>

      {/* ── PAGES ── */}
      {activeSection === "pages" && (
        <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:12 }}>
            <div style={{ position:"relative", maxWidth:320, width:"100%" }}>
              <Search size={14} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#94a3b8" }} />
              <input
                placeholder="Search pages…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ padding:"8px 12px 8px 32px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:13, outline:"none", width:"100%", fontFamily:"inherit", boxSizing:"border-box" }}
              />
            </div>
            <button style={S.btn("secondary")} onClick={fetchPages}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          {loading ? (
            <div style={{ display:"flex", justifyContent:"center", padding:"60px 0" }}>
              <Loader2 size={32} style={{ color:"#3b82f6", animation:"spin 1s linear infinite" }} />
            </div>
          ) : (
            <>
              {/* Static pages */}
              <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>
                Static Pages
              </div>
              {filteredPages.filter(p => p.pageType === "static" && p.pageKey !== "robots-txt").map(page => {
                const issues = getPageHealth(page);
                return (
                  <div key={page.pageKey} style={{ ...S.card, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
                    <div style={{ flex:1, minWidth:200 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                        <span style={{ fontWeight:700, fontSize:14, color:"#0f172a" }}>{page.pageLabel || page.pageKey}</span>
                        <code style={{ background:"#f1f5f9", padding:"2px 6px", borderRadius:4, fontSize:11, color:"#64748b" }}>{page.pageKey}</code>
                        <span style={S.tag("blue")}>static</span>
                        {page.robots?.includes("noindex") && <span style={S.tag("red")}>noindex</span>}
                      </div>
                      <div style={{ fontSize:12, color:"#64748b", marginBottom:6 }}>
                        {page.title
                          ? <span style={{ color:"#0f172a" }}>{page.title}</span>
                          : <span style={{ color:"#f59e0b" }}>No title set</span>}
                      </div>
                      {issues.length > 0
                        ? <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                            {issues.map(issue => (
                              <span key={issue} style={{ ...S.tag("red"), fontSize:10 }}>
                                <AlertCircle size={10} /> {issue}
                              </span>
                            ))}
                          </div>
                        : <span style={{ ...S.tag("green"), fontSize:10 }}><CheckCircle size={10} /> All good</span>
                      }
                    </div>
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                      {page.updatedBy && (
                        <span style={{ fontSize:11, color:"#94a3b8" }}>Updated by {page.updatedBy.name}</span>
                      )}
                      <button style={S.btn("primary")} onClick={() => openEdit(page)}>
                        <Edit3 size={13} /> Edit
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Dynamic pages */}
              <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.08em", margin:"20px 0 10px" }}>
                Dynamic Page Templates
              </div>
              <div style={{ background:"#fffbeb", border:"1px solid #fcd34d", borderRadius:8, padding:"10px 14px", fontSize:12, color:"#92400e", marginBottom:12 }}>
                Dynamic page templates set default SEO for all job/company pages. Use the <code>useSeoMeta</code> hook with dynamic overrides for per-item customization.
              </div>
              {filteredPages.filter(p => p.pageType === "dynamic").map(page => {
                const issues = getPageHealth(page);
                return (
                  <div key={page.pageKey} style={{ ...S.card, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                        <span style={{ fontWeight:700, fontSize:14, color:"#0f172a" }}>{page.pageLabel || page.pageKey}</span>
                        <span style={S.tag("green")}>dynamic</span>
                      </div>
                      <div style={{ fontSize:12, color:"#64748b" }}>
                        {page.title || <span style={{ color:"#f59e0b" }}>No default title set</span>}
                      </div>
                      {issues.length === 0 && (
                        <span style={{ ...S.tag("green"), fontSize:10, marginTop:4, display:"inline-flex" }}><CheckCircle size={10} /> All good</span>
                      )}
                    </div>
                    <button style={S.btn("primary")} onClick={() => openEdit(page)}>
                      <Edit3 size={13} /> Edit Template
                    </button>
                  </div>
                );
              })}
            </>
          )}
        </>
      )}

      {/* ── ROBOTS ── */}
      {activeSection === "robots" && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:12 }}>
            <div>
              <h3 style={{ fontSize:16, fontWeight:700, color:"#0f172a", marginBottom:2 }}>Robots.txt</h3>
              <p style={{ fontSize:13, color:"#64748b" }}>Controls what search engines can crawl on your site.</p>
            </div>
            <a
              href={`${API_BASE_URL.replace(/\/api$/, "")}/robots.txt`}
              target="_blank"
              rel="noreferrer"
              style={S.btn("secondary")}
            >
              <ExternalLink size={13} /> View Live
            </a>
          </div>

          {robotsPage ? (
            <>
              <div style={S.card}>
                <Field hint="Read-only preview. Click Edit below to modify.">
                  <Textarea
                    value={robotsPage.robotsTxtContent || "# No content saved yet"}
                    onChange={() => {}}
                    rows={14}
                    mono
                  />
                </Field>
              </div>
              <button style={S.btn("primary")} onClick={() => openEdit(robotsPage)}>
                <Edit3 size={13} /> Edit Robots.txt
              </button>
            </>
          ) : (
            <div style={{ textAlign:"center", padding:40, color:"#64748b" }}>
              <Loader2 size={24} style={{ animation:"spin 1s linear infinite", marginBottom:8 }} />
              <div>Loading…</div>
            </div>
          )}
        </div>
      )}

      {/* ── SITEMAP ── */}
      {activeSection === "sitemap" && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:12 }}>
            <div>
              <h3 style={{ fontSize:16, fontWeight:700, color:"#0f172a", marginBottom:2 }}>Sitemap.xml</h3>
              <p style={{ fontSize:13, color:"#64748b" }}>Auto-generated from live jobs, approved companies and static pages.</p>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button style={S.btn("secondary")} onClick={loadSitemap} disabled={loadingSitemap}>
                {loadingSitemap
                  ? <><Loader2 size={13} style={{ animation:"spin 1s linear infinite" }} /> Loading…</>
                  : <><Eye size={13} /> Preview XML</>}
              </button>
              <a
                href={`${API_BASE_URL.replace(/\/api$/, "")}/sitemap.xml`}
                target="_blank"
                rel="noreferrer"
                style={S.btn("primary")}
              >
                <ExternalLink size={13} /> View Live
              </a>
            </div>
          </div>

          <div style={{ ...S.card, background:"#f0fdf4", border:"1px solid #bbf7d0" }}>
            <div style={{ fontSize:13, color:"#065f46", fontWeight:600, marginBottom:4 }}>Auto-generated sitemap</div>
            <div style={{ fontSize:12, color:"#059669" }}>
              The sitemap is generated dynamically — it always includes all live jobs and approved companies.
              Use the Page Meta editor above to toggle individual static pages in/out and adjust priority.
            </div>
          </div>

          {sitemapXml && (
            <div style={S.card}>
              <div style={{ fontSize:13, fontWeight:700, color:"#0f172a", marginBottom:12 }}>Sitemap Preview</div>
              <pre style={{
                background:"#0f172a", color:"#e2e8f0", padding:16, borderRadius:8,
                fontSize:11, overflow:"auto", maxHeight:400, lineHeight:1.6, fontFamily:"monospace",
              }}>
                {sitemapXml}
              </pre>
            </div>
          )}

          <div style={S.card}>
            <div style={{ fontSize:13, fontWeight:700, color:"#0f172a", marginBottom:8 }}>Page Sitemap Controls</div>
            <div style={{ fontSize:12, color:"#64748b", marginBottom:16 }}>
              Toggle individual pages in/out from the Page Meta editor.
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:10 }}>
              {pages.filter(p => p.pageKey !== "robots-txt").map(p => (
                <div key={p.pageKey} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:"#f8fafc", borderRadius:8, border:"1px solid #e2e8f0" }}>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:"#0f172a" }}>{p.pageLabel || p.pageKey}</div>
                    <div style={{ fontSize:11, color:"#94a3b8" }}>Priority: {p.sitemapPriority ?? "—"}</div>
                  </div>
                  <span style={S.tag(p.includeInSitemap !== false ? "green" : "red")}>
                    {p.includeInSitemap !== false ? "In" : "Out"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
    </div>
  );
};

export default AdminSeoDashboard;