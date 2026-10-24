import React from "react";
import { X, BookOpen, ArrowRight, MessageCircle, Lightbulb } from "lucide-react";
import { COLORS } from "../data/colors.js";

// "Complete order guide": a bar under the top banner + a full guide page.
// Steps, tips and texts are edited in Admin → Website → Order guide.
export function GuideBar({ cfg, onOpen }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "6px 20px 18px" }}>
      <button
        type="button"
        onClick={onOpen}
        style={{ display: "flex", alignItems: "stretch", maxWidth: 440, width: "100%", border: `1.5px solid ${COLORS.gold}`, borderRadius: 12, overflow: "hidden", background: "#fff", padding: 0, boxShadow: "0 6px 18px rgba(63,18,32,.12)", cursor: "pointer", textAlign: "left" }}
      >
        <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", fontWeight: 700, fontSize: 14, color: COLORS.charcoal }}>
          <BookOpen size={18} color={COLORS.maroon} /> {cfg.buttonText}
        </span>
        <span style={{ background: COLORS.gold, color: COLORS.cream, display: "flex", alignItems: "center", gap: 6, padding: "0 18px", fontWeight: 800, fontSize: 14 }}>
          {cfg.goText} <ArrowRight size={15} />
        </span>
      </button>
    </div>
  );
}

export function GuidePage({ cfg, whatsapp, onClose }) {
  const steps = (Array.isArray(cfg.steps) ? cfg.steps : []).filter((s) => s && (String(s.title || "").trim() || String(s.text || "").trim()));
  const tips = (Array.isArray(cfg.tips) ? cfg.tips : []).map((x) => String(x).trim()).filter(Boolean);
  return (
    <div className="ttc-modal" role="dialog" aria-modal="true" aria-label={cfg.title} style={{ position: "fixed", inset: 0, zIndex: 90, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 12, overflowY: "auto" }}>
      <div className="ttc-backdrop" onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(43,36,32,0.55)" }} />
      <div className="ttc-modal-inner" style={{ position: "relative", background: COLORS.cream, borderRadius: 20, width: 640, maxWidth: "100%", margin: "20px 0", padding: "26px 22px 28px" }}>
        <button onClick={onClose} aria-label="Close" style={{ position: "absolute", top: 14, right: 14, background: COLORS.bgSoft, border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.charcoal }}><X size={18} /></button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, paddingRight: 40 }}>
          <BookOpen size={26} color={COLORS.maroon} />
          <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 26, color: COLORS.maroonDark, margin: 0 }}>{cfg.title}</h2>
        </div>
        {cfg.intro && <p style={{ fontSize: 14, color: "#5A4E46", lineHeight: 1.6, margin: "0 0 18px" }}>{cfg.intro}</p>}
        <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
          {steps.map((s, i) => (
            <li key={i} style={{ display: "flex", gap: 14, background: "#fff", borderRadius: 16, padding: "14px 16px", border: `1px solid ${COLORS.bgSoft}` }}>
              <span style={{ flexShrink: 0, width: 34, height: 34, borderRadius: "50%", background: COLORS.maroon, color: COLORS.cream, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15 }}>{i + 1}</span>
              <div style={{ minWidth: 0 }}>
                {s.title && <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.maroonDark, marginBottom: 3 }}>{s.title}</div>}
                {s.text && <div style={{ fontSize: 13.5, color: "#5A4E46", lineHeight: 1.6, whiteSpace: "pre-line" }}>{s.text}</div>}
              </div>
            </li>
          ))}
        </ol>
        {tips.length > 0 && (
          <div style={{ marginTop: 18, background: "#FBF0D4", border: "1px solid #E8CF8C", borderRadius: 14, padding: "12px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 13.5, color: "#6B4E10", marginBottom: 6 }}><Lightbulb size={16} /> Good to know</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#5A4E46", lineHeight: 1.65 }}>{tips.map((x, i) => <li key={i}>{x}</li>)}</ul>
          </div>
        )}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, minWidth: 150, background: COLORS.maroon, color: COLORS.cream, border: "none", borderRadius: 999, padding: "12px 0", fontWeight: 700, fontSize: 14 }}>Start shopping</button>
          <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, minWidth: 150, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#25D366", color: "#fff", borderRadius: 999, padding: "12px 0", fontWeight: 700, fontSize: 14, textDecoration: "none" }}><MessageCircle size={16} /> Ask on WhatsApp</a>
        </div>
      </div>
    </div>
  );
}
