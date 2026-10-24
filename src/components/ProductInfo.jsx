import React, { useState } from "react";
import { Package } from "lucide-react";
import { COLORS } from "../data/colors.js";

// Product page extras (each has its own switch in Admin → Website → Product page):
//   • Description / Details tabs      • Sizes available / Colours available
//   • "Price includes" box
export function ProductTabs({ product, variant, t }) {
  const [tab, setTab] = useState("desc");
  const rows = (Array.isArray(product.details) ? product.details : []).filter((r) => r && String(r.label || "").trim() && String(r.value || "").trim());
  const colour = variant && variant.name ? String(variant.name) : "";
  const hasDetails = rows.length > 0 || !!colour;
  const tabBtn = (id, label) => (
    <button type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
      style={{ background: "none", border: "none", borderBottom: `3px solid ${tab === id ? COLORS.charcoal : "transparent"}`, padding: "10px 4px", marginRight: 22, fontWeight: 800, fontSize: 13, letterSpacing: 0.4, textTransform: "uppercase", color: COLORS.charcoal, cursor: "pointer" }}>{label}</button>
  );
  if (!hasDetails) return <p style={{ fontSize: 13.5, color: "#5A4E46", lineHeight: 1.6, marginBottom: 20, whiteSpace: "pre-line" }}>{product.desc}</p>;
  return (
    <div style={{ marginBottom: 20 }}>
      <div role="tablist" style={{ borderBottom: `1px solid ${COLORS.bgSoft}`, marginBottom: 12 }}>
        {tabBtn("desc", "Description")}{tabBtn("details", "Details")}
      </div>
      {tab === "desc" ? (
        <p style={{ fontSize: 13.5, color: "#5A4E46", lineHeight: 1.6, margin: 0, whiteSpace: "pre-line" }}>{product.desc}</p>
      ) : (
        <div style={{ display: "grid", gap: 6, fontSize: 13.5, lineHeight: 1.5 }}>
          {rows.map((r, i) => <div key={i}><strong>{r.label}:</strong> <span style={{ color: "#5A4E46" }}>{r.value}</span></div>)}
          {colour && <div><strong>Colour:</strong> <span style={{ color: COLORS.maroon, fontWeight: 600 }}>{colour}</span></div>}
        </div>
      )}
    </div>
  );
}

export function ProductMeta({ product, cfg }) {
  const sizes = (Array.isArray(product.sizesAvailable) && product.sizesAvailable.length ? product.sizesAvailable : Array.isArray(product.sizes) ? product.sizes : []).map(String).filter(Boolean);
  const variantNames = (Array.isArray(product.variants) ? product.variants : []).map((v) => v && v.name).filter(Boolean);
  const colours = variantNames.length ? variantNames : String(product.coloursText || "").split(",").map((x) => x.trim()).filter(Boolean);
  const includes = (Array.isArray(product.includes) ? product.includes : []).map(String).filter(Boolean);
  const pill = (txt, key) => <span key={key} style={{ border: `1.2px solid ${COLORS.bgSoft}`, background: "#fff", borderRadius: 999, padding: "4px 12px", fontSize: 12.5, fontWeight: 600, color: COLORS.charcoal }}>{txt}</span>;
  const line = (label, items) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.charcoal, marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{items.map((x, i) => pill(x, i))}</div>
    </div>
  );
  return (
    <>
      {cfg.sizes && sizes.length > 0 && line("Sizes available", sizes)}
      {cfg.colours && colours.length > 0 && line("Colours available", colours)}
      {cfg.includes && includes.length > 0 && (
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#FBF0D4", border: "1px solid #E8CF8C", borderRadius: 12, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#5A4E46" }}>
          <Package size={16} color="#8A6A10" style={{ flexShrink: 0, marginTop: 2 }} />
          <div><strong style={{ color: COLORS.charcoal }}>Price includes:</strong> {includes.join(", ")}</div>
        </div>
      )}
    </>
  );
}
