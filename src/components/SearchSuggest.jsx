import React, { useState, useMemo } from "react";
import { COLORS } from "../data/colors.js";

// Search box with a suggestions list (switch: Admin → Website → Product cards & filters → Search).
// Typing shows matching products; pressing Enter or picking one jumps to the result.
export default function SearchSuggest({ products, value, onChange, onBlurEmpty, onPick, onSubmit, placeholder, width = 130 }) {
  const [open, setOpen] = useState(true);
  const q = value.trim().toLowerCase();
  const list = useMemo(() => {
    if (!q) return [];
    const score = (p) => {
      const n = String(p.name || "").toLowerCase();
      if (n.startsWith(q)) return 0;
      if (n.includes(q)) return 1;
      if (String(p.category || "").toLowerCase().includes(q)) return 2;
      if (String(p.tag || "").toLowerCase().includes(q) || String(p.desc || "").toLowerCase().includes(q)) return 3;
      return 9;
    };
    return products.map((p) => [score(p), p]).filter((x) => x[0] < 9).sort((a, b) => a[0] - b[0]).slice(0, 6).map((x) => x[1]);
  }, [q, products]);
  return (
    <div style={{ position: "relative" }}>
      <input
        autoFocus value={value} role="combobox" aria-expanded={open && q ? true : false} aria-autocomplete="list"
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setOpen(false); onSubmit(); } else if (e.key === "Escape") setOpen(false); }}
        onBlur={() => { setTimeout(() => setOpen(false), 150); onBlurEmpty(); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        style={{ width, padding: "7px 10px", borderRadius: 999, border: `1.3px solid ${COLORS.navy}`, fontSize: 12.5, background: COLORS.cream }}
      />
      {open && q && (
        <div role="listbox" style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, width: 300, maxWidth: "86vw", background: "#fff", borderRadius: 14, boxShadow: "0 14px 36px rgba(63,18,32,.25)", border: `1px solid ${COLORS.bgSoft}`, zIndex: 80, overflow: "hidden" }}>
          {list.length === 0 ? (
            <div style={{ padding: "12px 14px", fontSize: 13, color: "#7A6E64" }}>Nothing found for “{value.trim()}”. Try another word.</div>
          ) : (
            <>
              {list.map((p) => (
                <button key={p.id} role="option" type="button" onMouseDown={(e) => { e.preventDefault(); setOpen(false); onPick(p); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", background: "#fff", border: "none", borderBottom: `1px solid ${COLORS.bgSoft}`, padding: "8px 12px", cursor: "pointer", fontFamily: "inherit" }}>
                  {p.photos && p.photos[0] ? <img src={p.photos[0]} alt="" width="40" height="40" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} /> : <span style={{ width: 40, height: 40, borderRadius: 8, background: COLORS.bgSoft, flexShrink: 0 }} />}
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: COLORS.charcoal, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                    <span style={{ display: "block", fontSize: 11.5, color: "#7A6E64" }}>{p.category}</span>
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: COLORS.maroon }}>Rs{p.price}</span>
                </button>
              ))}
              <button type="button" onMouseDown={(e) => { e.preventDefault(); setOpen(false); onSubmit(); }} style={{ width: "100%", border: "none", background: COLORS.bgSoft, padding: "9px 12px", fontSize: 12.5, fontWeight: 700, color: COLORS.maroon, cursor: "pointer", fontFamily: "inherit" }}>See all results</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
