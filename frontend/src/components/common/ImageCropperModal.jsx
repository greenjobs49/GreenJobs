import React, { useState, useRef, useEffect, useCallback } from "react";

/**
 * ImageCropperModal — reusable crop modal
 *
 * Key behaviour change:
 *  • The image always COVERS the crop box — it can never be smaller than the crop
 *    area, so there are no empty/grey gaps inside the selection.
 *  • Pan is clamped so the crop box never reveals the background.
 *  • "Fit" button snaps zoom back to the minimum-cover level instantly.
 *  • Scroll-to-zoom still works, but zoom floor is enforced per crop size.
 *
 * Props: (same public API as before)
 *   isOpen, onClose, onCrop, imageSrc,
 *   aspectRatio, cropShape, title, hint,
 *   outputMimeType, outputQuality
 */

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export default function ImageCropperModal({
  isOpen,
  onClose,
  onCrop,
  imageSrc,
  aspectRatio = null,
  cropShape = "rect",
  title = "Crop Image",
  hint = "",
  outputMimeType = "image/jpeg",
  outputQuality = 0.92,
}) {
  const canvasRef    = useRef(null);
  const imgRef       = useRef(null);
  const dragState    = useRef(null);
  const rafRef       = useRef(null);

  // natural image dimensions
  const [naturalW, setNaturalW] = useState(0);
  const [naturalH, setNaturalH] = useState(0);

  // canvas display dimensions
  const [canvasW, setCanvasW] = useState(0);
  const [canvasH, setCanvasH] = useState(0);

  // scale: naturalPx → canvasPx at zoom=1
  const [baseScale, setBaseScale] = useState(1);

  // crop rect in natural-image pixels
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });

  // zoom multiplier (1 = covers crop exactly)
  const [zoom, setZoom] = useState(1);

  // pan offset in canvas pixels
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  const [loading,   setLoading]   = useState(true);
  const [exporting, setExporting] = useState(false);

  /* ─────────────────────────────────────────────────────────────
     Compute the MINIMUM zoom so the image always covers the crop
  ───────────────────────────────────────────────────────────── */
  const minZoom = useCallback((cropW, cropH, nw, nh, bs) => {
    if (!cropW || !cropH || !nw || !nh || !bs) return 1;
    // at zoom=z, image in canvas pixels is nw*bs*z × nh*bs*z
    // we need nw*bs*z >= cropW  AND  nh*bs*z >= cropH
    const zx = cropW / (nw * bs);
    const zy = cropH / (nh * bs);
    return Math.max(zx, zy, 0.1);          // whichever axis needs more zoom
  }, []);

  /* ─────────────────────────────────────────────────────────────
     Clamp pan so the crop box never reveals the grey background
  ───────────────────────────────────────────────────────────── */
  const clampPan = useCallback((px, py, cropW, cropH, nw, nh, bs, z) => {
    const imgW = nw * bs * z;
    const imgH = nh * bs * z;

    // crop box centre in canvas coords
    const cropCX = canvasW / 2;
    const cropCY = canvasH / 2;

    // image origin (top-left) when pan = 0
    // draw: ctx.drawImage at (ox, oy) where ox = panX + (canvasW - imgW) / 2
    // crop in canvas: cx = crop.x * bs * z + ox
    // For the crop left edge (canvas) not to go left of image left:
    //   crop.x * bs*z + (px + (canvasW - imgW)/2) >= 0
    //   px >= -crop.x * bs*z - (canvasW - imgW)/2
    // For crop right edge not to exceed image right:
    //   (crop.x + crop.w) * bs*z + (px + (canvasW - imgW)/2) <= imgW
    //   px <= imgW - (crop.x + crop.w) * bs*z - (canvasW - imgW)/2

    const ox0 = (canvasW - imgW) / 2;  // image left when pan=0
    const oy0 = (canvasH - imgH) / 2;

    const minPx = -(crop.x * bs * z + ox0);                          // crop left = image left
    const maxPx = imgW - (crop.x + cropW) * bs * z - ox0;            // crop right = image right

    const minPy = -(crop.y * bs * z + oy0);
    const maxPy = imgH - (crop.y + cropH) * bs * z - oy0;

    return {
      px: clamp(px, Math.min(minPx, maxPx), Math.max(minPx, maxPx)),
      py: clamp(py, Math.min(minPy, maxPy), Math.max(minPy, maxPy)),
    };
  }, [canvasW, canvasH, crop]);

  /* ─────────────────────────────────────────────────────────────
     Load / reset when imageSrc or aspectRatio changes
  ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!isOpen || !imageSrc) return;
    setLoading(true);

    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      setNaturalW(nw);
      setNaturalH(nh);

      // Canvas size — fit within 520×340, never upscale
      const maxW = Math.min(520, window.innerWidth - 80);
      const maxH = 340;
      const s = Math.min(maxW / nw, maxH / nh, 1);
      const cw = Math.round(nw * s);
      const ch = Math.round(nh * s);
      setCanvasW(cw);
      setCanvasH(ch);
      setBaseScale(s);

      // Crop rect in natural pixels
      let cropW, cropH;
      if (aspectRatio) {
        if (nw / nh > aspectRatio) { cropH = nh; cropW = Math.round(nh * aspectRatio); }
        else { cropW = nw; cropH = Math.round(nw / aspectRatio); }
      } else { cropW = nw; cropH = nh; }

      const cx = Math.round((nw - cropW) / 2);
      const cy = Math.round((nh - cropH) / 2);
      const newCrop = { x: cx, y: cy, w: cropW, h: cropH };
      setCrop(newCrop);

      // Initial zoom: cover the crop exactly
      const mz = Math.max(cropW / (nw * s), cropH / (nh * s), 0.1);
      setZoom(mz);
      setPanX(0);
      setPanY(0);
      setLoading(false);
    };
    img.src = imageSrc;
  }, [isOpen, imageSrc, aspectRatio]);

  /* ─────────────────────────────────────────────────────────────
     Draw
  ───────────────────────────────────────────────────────────── */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img    = imgRef.current;
    if (!canvas || !img || !canvasW || !canvasH) return;

    canvas.width  = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvasW, canvasH);

    const s  = baseScale * zoom;
    const ox = panX + (canvasW - naturalW * s) / 2;
    const oy = panY + (canvasH - naturalH * s) / 2;

    // Draw full image
    ctx.drawImage(img, ox, oy, naturalW * s, naturalH * s);

    // Crop rect in canvas coords
    const cx = crop.x * s + ox;
    const cy = crop.y * s + oy;
    const cw = crop.w * s;
    const ch = crop.h * s;

    // Dim area outside crop
    ctx.save();
    ctx.fillStyle = "rgba(15,23,42,0.52)";
    ctx.fillRect(0, 0, canvasW, canvasH);

    if (cropShape === "circle") {
      ctx.beginPath();
      ctx.ellipse(cx + cw / 2, cy + ch / 2, cw / 2, ch / 2, 0, 0, Math.PI * 2);
      ctx.clip();
    } else {
      ctx.clearRect(cx, cy, cw, ch);
      ctx.beginPath();
      ctx.rect(cx, cy, cw, ch);
      ctx.clip();
    }
    ctx.drawImage(img, ox, oy, naturalW * s, naturalH * s);
    ctx.restore();

    // Border
    ctx.save();
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 2;
    if (cropShape === "circle") {
      ctx.beginPath();
      ctx.ellipse(cx + cw / 2, cy + ch / 2, cw / 2, ch / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeRect(cx, cy, cw, ch);
      // Rule of thirds
      ctx.strokeStyle = "rgba(16,185,129,0.3)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(cx + (cw / 3) * i, cy); ctx.lineTo(cx + (cw / 3) * i, cy + ch); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy + (ch / 3) * i); ctx.lineTo(cx + cw, cy + (ch / 3) * i); ctx.stroke();
      }
      // Corner handles
      const hs = 10;
      ctx.fillStyle = "#10b981";
      ctx.shadowColor = "rgba(16,185,129,0.5)";
      ctx.shadowBlur  = 6;
      const handles = [
        [cx, cy], [cx + cw, cy], [cx, cy + ch], [cx + cw, cy + ch],
        [cx + cw / 2, cy], [cx + cw / 2, cy + ch],
        [cx, cy + ch / 2], [cx + cw, cy + ch / 2],
      ];
      for (const [hx, hy] of handles) ctx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs);
    }
    ctx.restore();
  }, [canvasW, canvasH, crop, baseScale, zoom, panX, panY, naturalW, naturalH, cropShape]);

  useEffect(() => {
    if (!loading) {
      rafRef.current = requestAnimationFrame(draw);
      return () => cancelAnimationFrame(rafRef.current);
    }
  }, [draw, loading]);

  /* ─────────────────────────────────────────────────────────────
     Interaction helpers
  ───────────────────────────────────────────────────────────── */
  const getHandleAt = useCallback((cx, cy) => {
    const s  = baseScale * zoom;
    const ox = panX + (canvasW - naturalW * s) / 2;
    const oy = panY + (canvasH - naturalH * s) / 2;
    const bx = crop.x * s + ox;
    const by = crop.y * s + oy;
    const bw = crop.w * s;
    const bh = crop.h * s;
    const tol = 14;
    const near = (ax, ay) => Math.abs(cx - ax) < tol && Math.abs(cy - ay) < tol;
    if (near(bx,       by))        return "nw";
    if (near(bx + bw,  by))        return "ne";
    if (near(bx,       by + bh))   return "sw";
    if (near(bx + bw,  by + bh))   return "se";
    if (near(bx + bw/2, by))       return "n";
    if (near(bx + bw/2, by + bh))  return "s";
    if (near(bx,        by + bh/2))return "w";
    if (near(bx + bw,   by + bh/2))return "e";
    if (cx > bx && cx < bx + bw && cy > by && cy < by + bh) return "move";
    return "pan";  // outside crop = pan the image
  }, [crop, baseScale, zoom, panX, panY, canvasW, canvasH, naturalW, naturalH]);

  const getCursor = (h) => ({
    nw: "nw-resize", ne: "ne-resize", sw: "sw-resize", se: "se-resize",
    n: "n-resize", s: "s-resize", w: "w-resize", e: "e-resize",
    move: "grab", pan: "grab",
  }[h] || "crosshair");

  const getPos = (e, canvas) => {
    const r  = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: cx - r.left, y: cy - r.top };
  };

  const onPointerDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    const { x, y } = getPos(e, canvas);
    const handle = getHandleAt(x, y);
    dragState.current = {
      type: handle,
      startX: x, startY: y,
      startCrop: { ...crop },
      startPanX: panX,
      startPanY: panY,
    };
    canvas.style.cursor = handle === "move" || handle === "pan" ? "grabbing" : getCursor(handle);
  };

  const onPointerMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getPos(e, canvas);

    if (!dragState.current) {
      canvas.style.cursor = getCursor(getHandleAt(x, y));
      return;
    }
    e.preventDefault();

    const { type, startX, startY, startCrop, startPanX, startPanY } = dragState.current;
    const s = baseScale * zoom;
    const dx = (x - startX) / s;
    const dy = (y - startY) / s;
    const minSize = 20;

    if (type === "pan") {
      // Pan the image (outside crop drag)
      const rawPx = startPanX + (x - startX);
      const rawPy = startPanY + (y - startY);
      const { px, py } = clampPan(rawPx, rawPy, crop.w, crop.h, naturalW, naturalH, baseScale, zoom);
      setPanX(px);
      setPanY(py);
      return;
    }

    if (type === "move") {
      // Move crop box
      let nx = clamp(startCrop.x + dx, 0, naturalW - startCrop.w);
      let ny = clamp(startCrop.y + dy, 0, naturalH - startCrop.h);
      const newCrop = { ...startCrop, x: Math.round(nx), y: Math.round(ny) };
      // After moving, re-clamp pan
      const { px, py } = clampPan(panX, panY, newCrop.w, newCrop.h, naturalW, naturalH, baseScale, zoom);
      setCrop(newCrop);
      setPanX(px); setPanY(py);
      return;
    }

    // Resize handles
    let { x: cx, y: cy, w: cw, h: ch } = startCrop;
    let nx = cx, ny = cy, nw = cw, nh = ch;

    if (type.includes("e")) nw = Math.max(minSize, cw + dx);
    if (type.includes("s")) nh = Math.max(minSize, ch + dy);
    if (type.includes("w")) { nx = Math.min(cx + dx, cx + cw - minSize); nw = cw - (nx - cx); }
    if (type.includes("n")) { ny = Math.min(cy + dy, cy + ch - minSize); nh = ch - (ny - cy); }

    if (aspectRatio) {
      if (type.includes("e") || type.includes("w")) nh = nw / aspectRatio;
      else nw = nh * aspectRatio;
      if (type.includes("n")) ny = cy + ch - nh;
      if (type.includes("w")) nx = cx + cw - nw;
    }

    nx = clamp(nx, 0, naturalW - minSize);
    ny = clamp(ny, 0, naturalH - minSize);
    nw = clamp(nw, minSize, naturalW - nx);
    nh = clamp(nh, minSize, naturalH - ny);

    const newCrop = { x: Math.round(nx), y: Math.round(ny), w: Math.round(nw), h: Math.round(nh) };

    // Enforce zoom covers new crop size
    const mz = minZoom(newCrop.w, newCrop.h, naturalW, naturalH, baseScale);
    const safeZoom = Math.max(zoom, mz);
    if (safeZoom !== zoom) setZoom(safeZoom);

    const { px, py } = clampPan(panX, panY, newCrop.w, newCrop.h, naturalW, naturalH, baseScale, safeZoom);
    setCrop(newCrop);
    setPanX(px); setPanY(py);
  };

  const onPointerUp = () => {
    dragState.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = "crosshair";
  };

  const onWheel = (e) => {
    e.preventDefault();
    const mz = minZoom(crop.w, crop.h, naturalW, naturalH, baseScale);
    const newZoom = clamp(zoom - e.deltaY * 0.001, mz, 4);
    setZoom(newZoom);
    // Re-clamp pan at new zoom
    const { px, py } = clampPan(panX, panY, crop.w, crop.h, naturalW, naturalH, baseScale, newZoom);
    setPanX(px); setPanY(py);
  };

  /* ─────────────────────────────────────────────────────────────
     "Fit" — snap image to cover the crop perfectly, centred
  ───────────────────────────────────────────────────────────── */
  const fitToCrop = () => {
    const mz = minZoom(crop.w, crop.h, naturalW, naturalH, baseScale);
    setZoom(mz);
    setPanX(0);
    setPanY(0);
  };

  /* ─────────────────────────────────────────────────────────────
     Zoom slider — enforce floor
  ───────────────────────────────────────────────────────────── */
  const handleZoomSlider = (val) => {
    const mz = minZoom(crop.w, crop.h, naturalW, naturalH, baseScale);
    // Slider 0–100 maps to mz–4
    const newZoom = mz + (val / 100) * (4 - mz);
    setZoom(newZoom);
    const { px, py } = clampPan(panX, panY, crop.w, crop.h, naturalW, naturalH, baseScale, newZoom);
    setPanX(px); setPanY(py);
  };

  // Convert current zoom back to slider 0–100
  const zoomSliderVal = () => {
    const mz = minZoom(crop.w, crop.h, naturalW, naturalH, baseScale);
    if (mz >= 4) return 0;
    return Math.round(((zoom - mz) / (4 - mz)) * 100);
  };

  /* ─────────────────────────────────────────────────────────────
     Presets
  ───────────────────────────────────────────────────────────── */
  const applyCropPreset = (preset) => {
    let ar;
    if (preset === "fill")  ar = aspectRatio || naturalW / naturalH;
    else if (preset === "1:1")  ar = 1;
    else if (preset === "16:9") ar = 16 / 9;
    else if (preset === "4:3")  ar = 4 / 3;
    else if (preset === "3:1")  ar = 3;
    else ar = aspectRatio || naturalW / naturalH;

    let cw, ch;
    if (naturalW / naturalH > ar) { ch = naturalH; cw = Math.round(ch * ar); }
    else { cw = naturalW; ch = Math.round(cw / ar); }

    const newCrop = {
      x: Math.round((naturalW - cw) / 2),
      y: Math.round((naturalH - ch) / 2),
      w: cw, h: ch,
    };
    const mz = minZoom(cw, ch, naturalW, naturalH, baseScale);
    const safeZoom = Math.max(zoom, mz);
    setCrop(newCrop);
    setZoom(safeZoom);
    const { px, py } = clampPan(0, 0, cw, ch, naturalW, naturalH, baseScale, safeZoom);
    setPanX(px); setPanY(py);
  };

  /* ─────────────────────────────────────────────────────────────
     Export
  ───────────────────────────────────────────────────────────── */
  const handleCrop = async () => {
    const img = imgRef.current;
    if (!img) return;
    setExporting(true);
    const out = document.createElement("canvas");
    out.width  = Math.round(crop.w);
    out.height = Math.round(crop.h);
    const ctx = out.getContext("2d");
    if (cropShape === "circle") {
      ctx.beginPath();
      ctx.arc(out.width / 2, out.height / 2, Math.min(out.width, out.height) / 2, 0, Math.PI * 2);
      ctx.clip();
    }
    ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, out.width, out.height);
    out.toBlob((blob) => {
      const dataUrl = out.toDataURL(outputMimeType, outputQuality);
      setExporting(false);
      onCrop(blob, dataUrl);
    }, outputMimeType, outputQuality);
  };

  if (!isOpen) return null;

  const currentAR = crop.w && crop.h ? (crop.w / crop.h).toFixed(2) : "—";
  const mzForDisplay = minZoom(crop.w, crop.h, naturalW, naturalH, baseScale);
  const atMinZoom = Math.abs(zoom - mzForDisplay) < 0.005;

  return (
    <>
      <style>{`
        @keyframes icmOverlayIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes icmSlideUp   { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes icmSpin      { to { transform: rotate(360deg); } }

        .icm-overlay {
          position: fixed; inset: 0; z-index: 99999;
          background: rgba(15,23,42,0.65);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          animation: icmOverlayIn 0.2s ease;
        }
        .icm-modal {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          width: 100%; max-width: 620px;
          max-height: 94vh; overflow-y: auto;
          box-shadow: 0 24px 80px rgba(15,23,42,0.2), 0 4px 20px rgba(15,23,42,0.08);
          display: flex; flex-direction: column;
          animation: icmSlideUp 0.28s cubic-bezier(0.16,1,0.3,1);
        }
        .icm-modal::-webkit-scrollbar { width: 5px; }
        .icm-modal::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }

        .icm-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 24px 16px;
          border-bottom: 1px solid #f1f5f9;
          background: linear-gradient(to right, #f8fffe, white);
          flex-shrink: 0;
        }
        .icm-header-left { display: flex; align-items: center; gap: 12px; }
        .icm-icon-wrap {
          width: 36px; height: 36px; border-radius: 10px;
          background: linear-gradient(135deg, #10b981, #059669);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(16,185,129,0.3); flex-shrink: 0;
        }
        .icm-title { font-size: 17px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px; }
        .icm-hint  { font-size: 12px; color: #94a3b8; margin-top: 2px; font-weight: 500; }
        .icm-close-btn {
          width: 36px; height: 36px; border-radius: 9px;
          background: #f8fafc; border: 1.5px solid #e2e8f0;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          color: #64748b; font-size: 15px; transition: all 0.15s; flex-shrink: 0;
          font-family: inherit;
        }
        .icm-close-btn:hover { background: #fef2f2; border-color: #fecaca; color: #dc2626; }

        .icm-canvas-wrap { padding: 20px 24px 0; flex-shrink: 0; }
        .icm-canvas-container {
          position: relative; border-radius: 12px; overflow: hidden;
          background: #e2e8f0;
          border: 1.5px solid #e2e8f0;
          margin: 0 auto;
        }
        .icm-canvas-container canvas {
          display: block; cursor: crosshair;
          touch-action: none; max-width: 100%;
        }
        .icm-zoom-hint {
          position: absolute; bottom: 8px; right: 10px;
          background: rgba(15,23,42,0.55); color: rgba(255,255,255,0.8);
          font-size: 10px; font-weight: 600;
          padding: 3px 9px; border-radius: 100px; pointer-events: none;
        }
        .icm-loading {
          height: 260px; display: flex; align-items: center; justify-content: center;
          background: #f8fafc; border-radius: 12px; border: 1.5px solid #e2e8f0;
          color: #94a3b8; font-size: 14px; gap: 10px; font-weight: 500;
        }
        .icm-spin { animation: icmSpin 0.8s linear infinite; display: inline-block; color: #10b981; font-size: 18px; }

        .icm-info-bar {
          display: flex; gap: 8px; align-items: center; justify-content: center;
          margin-top: 12px; flex-wrap: wrap;
        }
        .icm-info-chip {
          background: #f8fafc; border: 1px solid #e2e8f0;
          border-radius: 8px; padding: 5px 12px; text-align: center; min-width: 68px;
        }
        .icm-info-chip-label { font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
        .icm-info-chip-value { font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 1px; }

        .icm-controls { padding: 16px 24px 0; flex-shrink: 0; }
        .icm-ctrl-label {
          font-size: 11px; font-weight: 700; color: #64748b;
          text-transform: uppercase; letter-spacing: 0.6px;
        }
        .icm-zoom-row {
          display: flex; align-items: center; justify-content: space-between; margin-bottom: 7px;
        }
        .icm-zoom-right { display: flex; align-items: center; gap: 8px; }
        .icm-zoom-val { font-size: 12px; font-weight: 700; color: #10b981; }
        .icm-fit-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px; border-radius: 7px; font-size: 11px; font-weight: 700;
          cursor: pointer; border: 1.5px solid #e2e8f0;
          background: #f8fafc; color: #64748b;
          font-family: 'Inter', sans-serif; transition: all 0.15s;
        }
        .icm-fit-btn:hover  { background: #f0fdf4; border-color: #6ee7b7; color: #065f46; }
        .icm-fit-btn.active { background: #d1fae5; border-color: #10b981; color: #065f46; }
        .icm-range {
          width: 100%; accent-color: #10b981; cursor: pointer;
          height: 4px; border-radius: 2px;
        }

        .icm-presets-wrap { margin-top: 16px; margin-bottom: 4px; }
        .icm-presets-row  { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
        .icm-preset-btn {
          padding: 5px 13px; border-radius: 8px; font-size: 12px; font-weight: 600;
          cursor: pointer; border: 1.5px solid #e2e8f0;
          background: #f8fafc; color: #64748b;
          font-family: 'Inter', sans-serif; transition: all 0.15s;
        }
        .icm-preset-btn:hover { background: #f0fdf4; border-color: #6ee7b7; color: #065f46; }

        .icm-tip {
          display: flex; gap: 9px; align-items: flex-start;
          background: #f0fdf4; border: 1px solid #bbf7d0;
          border-radius: 10px; padding: 10px 13px; margin-top: 14px;
        }
        .icm-tip-icon { font-size: 13px; flex-shrink: 0; margin-top: 1px; }
        .icm-tip-text { font-size: 12.5px; color: #374151; line-height: 1.55; }
        .icm-tip-text strong { color: #065f46; }

        .icm-footer {
          display: flex; align-items: center; justify-content: flex-end;
          gap: 10px; padding: 18px 24px 20px; flex-shrink: 0;
        }
        .icm-btn-cancel {
          padding: 10px 20px; border-radius: 10px;
          border: 1.5px solid #e2e8f0; background: white;
          color: #374151; font-size: 14px; font-weight: 700;
          cursor: pointer; font-family: inherit; transition: all 0.15s;
        }
        .icm-btn-cancel:hover { background: #f8fafc; border-color: #94a3b8; color: #0f172a; }
        .icm-btn-apply {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 24px; border-radius: 10px; border: none;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white; font-size: 14px; font-weight: 700;
          cursor: pointer; font-family: inherit; transition: all 0.18s;
          box-shadow: 0 4px 12px rgba(16,185,129,0.35);
        }
        .icm-btn-apply:hover:not(:disabled) {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          box-shadow: 0 6px 20px rgba(16,185,129,0.45); transform: translateY(-1px);
        }
        .icm-btn-apply:disabled {
          background: #e2e8f0; color: #94a3b8;
          box-shadow: none; cursor: not-allowed; transform: none;
        }

        @media (max-width: 600px) {
          .icm-modal  { border-radius: 16px; }
          .icm-header, .icm-canvas-wrap, .icm-controls, .icm-footer { padding-left: 16px; padding-right: 16px; }
          .icm-footer { flex-direction: column; }
          .icm-btn-cancel, .icm-btn-apply { width: 100%; justify-content: center; }
        }
      `}</style>

      <div className="icm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="icm-modal">

          {/* Header */}
          <div className="icm-header">
            <div className="icm-header-left">
              <div className="icm-icon-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 2 6 18 22 18"/><polyline points="2 6 18 6 18 22"/>
                  <rect x="9" y="9" width="9" height="9" rx="1" strokeDasharray="2 2"/>
                </svg>
              </div>
              <div>
                <div className="icm-title">{title}</div>
                {hint && <div className="icm-hint">{hint}</div>}
              </div>
            </div>
            <button className="icm-close-btn" onClick={onClose} aria-label="Close">✕</button>
          </div>

          {/* Canvas */}
          <div className="icm-canvas-wrap">
            {loading ? (
              <div className="icm-loading">
                <span className="icm-spin">⟳</span>
                Loading image…
              </div>
            ) : (
              <div className="icm-canvas-container" style={{ width: canvasW }}>
                <canvas
                  ref={canvasRef}
                  width={canvasW}
                  height={canvasH}
                  onMouseDown={onPointerDown}
                  onMouseMove={onPointerMove}
                  onMouseUp={onPointerUp}
                  onMouseLeave={onPointerUp}
                  onTouchStart={onPointerDown}
                  onTouchMove={onPointerMove}
                  onTouchEnd={onPointerUp}
                  onWheel={onWheel}
                />
                <div className="icm-zoom-hint">Scroll · drag to pan</div>
              </div>
            )}

            {/* Info chips */}
            {!loading && (
              <div className="icm-info-bar">
                {[
                  { label: "Width",  value: `${Math.round(crop.w)}px` },
                  { label: "Height", value: `${Math.round(crop.h)}px` },
                  { label: "Ratio",  value: currentAR },
                ].map(({ label, value }) => (
                  <div className="icm-info-chip" key={label}>
                    <div className="icm-info-chip-label">{label}</div>
                    <div className="icm-info-chip-value">{value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Controls */}
          {!loading && (
            <div className="icm-controls">

              {/* Zoom row */}
              <div className="icm-zoom-row">
                <span className="icm-ctrl-label">Zoom</span>
                <div className="icm-zoom-right">
                  <span className="icm-zoom-val">{(zoom * 100).toFixed(0)}%</span>
                  {/* Fit button */}
                  <button
                    type="button"
                    className={`icm-fit-btn${atMinZoom ? " active" : ""}`}
                    onClick={fitToCrop}
                    title="Fit image to fill the crop area perfectly"
                  >
                    {/* fit-to-frame icon */}
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/>
                      <path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
                    </svg>
                    Fit
                  </button>
                </div>
              </div>
              <input
                type="range" min={0} max={100} step={1}
                value={zoomSliderVal()}
                onChange={e => handleZoomSlider(Number(e.target.value))}
                className="icm-range"
              />

              {/* Presets */}
              <div className="icm-presets-wrap">
                <span className="icm-ctrl-label">Quick Presets</span>
                <div className="icm-presets-row">
                  {[
                    { label: "Fill All", preset: "fill"  },
                    { label: "1 : 1",    preset: "1:1"   },
                    { label: "16 : 9",   preset: "16:9"  },
                    { label: "4 : 3",    preset: "4:3"   },
                    { label: "3 : 1",    preset: "3:1"   },
                  ].map(({ label, preset }) => (
                    <button key={preset} type="button" onClick={() => applyCropPreset(preset)} className="icm-preset-btn">
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tip */}
              <div className="icm-tip">
                <span className="icm-tip-icon">💡</span>
                <span className="icm-tip-text">
                  Drag <strong>handles</strong> to resize the crop box · drag <strong>inside the box</strong> to reposition it ·
                  drag <strong>outside the box</strong> or <strong>scroll</strong> to pan &amp; zoom the image ·
                  hit <strong>Fit</strong> to snap the image flush to the crop area
                </span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="icm-footer">
            <button className="icm-btn-cancel" onClick={onClose}>Cancel</button>
            <button
              className="icm-btn-apply"
              onClick={handleCrop}
              disabled={loading || exporting}
            >
              {exporting ? (
                <><span className="icm-spin" style={{ fontSize: 14 }}>⟳</span>Exporting…</>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Apply Crop
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}