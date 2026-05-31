import { useEffect, useRef } from "react";
import axios from "axios";
import API_BASE_URL from "../config/api";

/**
 * useSeoMeta(pageKey, dynamicOverrides)
 *
 * Fetches SEO config from the admin-managed DB and injects it into <head>.
 * Pure DOM injection — no react-helmet needed.
 *
 * @param {string|null} pageKey          - matches pageKey in SeoMeta model.
 *                                         Pass null to skip (e.g. while data loads).
 * @param {object}      dynamicOverrides - per-item overrides merged on top of DB values.
 *
 * Usage:
 *   useSeoMeta("home");
 *   useSeoMeta(job ? "job-detail" : null, job ? {
 *     title:       `${job.title} at ${job.company} | GreenJobs`,
 *     description: job.description?.slice(0, 160),
 *     ogImage:     job.business?.profilePicture || "",
 *     canonical:   `https://jobs.solarismypassion.com/jobs/${job._id}`,
 *   } : {});
 */
export function useSeoMeta(pageKey, dynamicOverrides = {}) {
  // Stable serialised key — effect only re-runs when overrides actually change
  const overridesKey = JSON.stringify(dynamicOverrides);

  // Track which tags this hook instance injected so cleanup is precise
  const injectedMeta  = useRef([]);  // [{ attr, attrVal }]
  const injectedLinks = useRef([]);  // [rel]

  useEffect(() => {
    // null pageKey = caller wants to skip (data still loading)
    if (!pageKey) return;

    let cancelled = false;

    axios
      .get(`${API_BASE_URL}/api/seo/${pageKey}`)
      .then((res) => {
        if (cancelled) return;

        const m = res.data?.meta;
        if (!m) return;

        // Dynamic overrides win over DB values
        const meta = { ...m, ...JSON.parse(overridesKey) };

        // ── <title> ──────────────────────────────────────────────────────
        if (meta.title) document.title = meta.title;

        // ── Helper: upsert a <meta> tag ──────────────────────────────────
        const setMeta = (attr, attrVal, content) => {
          if (!content) return;
          let el = document.querySelector(`meta[${attr}="${attrVal}"]`);
          const isNew = !el;
          if (isNew) {
            el = document.createElement("meta");
            el.setAttribute(attr, attrVal);
            document.head.appendChild(el);
          }
          el.setAttribute("content", content);
          // Track only tags we created so we don't remove pre-existing ones
          if (isNew) injectedMeta.current.push({ attr, attrVal });
        };

        // ── Helper: upsert a <link> tag ──────────────────────────────────
        const setLink = (rel, href) => {
          if (!href) return;
          let el = document.querySelector(`link[rel="${rel}"]`);
          const isNew = !el;
          if (isNew) {
            el = document.createElement("link");
            el.setAttribute("rel", rel);
            document.head.appendChild(el);
          }
          el.setAttribute("href", href);
          if (isNew) injectedLinks.current.push(rel);
        };

        // ── og:url (was missing) ─────────────────────────────────────────
        const ogUrl = meta.canonical || window.location.href;

        // ── Core meta ────────────────────────────────────────────────────
        setMeta("name", "description", meta.description);
        setMeta("name", "keywords",    (meta.keywords || []).join(", "));
        setMeta("name", "robots",      meta.robots);

        // ── Open Graph ───────────────────────────────────────────────────
        setMeta("property", "og:title",       meta.ogTitle       || meta.title);
        setMeta("property", "og:description", meta.ogDescription || meta.description);
        setMeta("property", "og:image",       meta.ogImage);
        setMeta("property", "og:url",         ogUrl);                          // ← added
        setMeta("property", "og:type",        meta.ogType || "website");

        // ── Twitter ──────────────────────────────────────────────────────
        setMeta("name", "twitter:card",
          meta.twitterCard || "summary_large_image");
        setMeta("name", "twitter:title",
          meta.twitterTitle       || meta.ogTitle      || meta.title);
        setMeta("name", "twitter:description",
          meta.twitterDescription || meta.ogDescription || meta.description);
        setMeta("name", "twitter:image",
          meta.twitterImage       || meta.ogImage);

        // ── Canonical ────────────────────────────────────────────────────
        setLink("canonical", meta.canonical);

        // ── JSON-LD schema ───────────────────────────────────────────────
        if (meta.schemaMarkup?.trim()) {
          const scriptId = `schema-ld-${pageKey}`;
          let el = document.getElementById(scriptId);
          if (!el) {
            el = document.createElement("script");
            el.id   = scriptId;
            el.type = "application/ld+json";
            document.head.appendChild(el);
          }
          el.textContent = meta.schemaMarkup;
        }
      })
      .catch(() => {
        // Silently fail — SEO is non-critical, never break the page
      });

    return () => {
      cancelled = true;

      // ── Remove only the tags this instance created ────────────────────
      // (avoids wiping tags that existed before or belong to another page)
      injectedMeta.current.forEach(({ attr, attrVal }) => {
        const el = document.querySelector(`meta[${attr}="${attrVal}"]`);
        if (el) el.remove();
      });
      injectedLinks.current.forEach((rel) => {
        const el = document.querySelector(`link[rel="${rel}"]`);
        if (el) el.remove();
      });
      injectedMeta.current  = [];
      injectedLinks.current = [];

      // ── Remove JSON-LD so it doesn't bleed into the next page ─────────
      const schemaEl = document.getElementById(`schema-ld-${pageKey}`);
      if (schemaEl) schemaEl.remove();

      // ── Reset title to site default ───────────────────────────────────
      document.title = "GreenJobs";
    };

  }, [pageKey, overridesKey]);
}