import React, { useEffect, useState } from "react";
import { X, Check } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { COLORS } from "../data/colors.js";

// "Track your order": the customer types the order number and sees the steps
// the shop owner has set in the admin panel (Orders → Order tracking).
export const TRACK_STEPS = [
  ["placed", "Order placed"],
  ["confirmed", "Confirmed"],
  ["preparing", "Being prepared"],
  ["onway", "On the way"],
  ["delivered", "Delivered"],
];

export default function TrackOrder({ initial, whatsapp, onClose }) {
  const [no, setNo] = useState(initial || "");
  const [state, setState] = useState({ busy: false, data: null, none: false, error: "" });

  async function find(value) {
    const code = String(value || no).trim().toUpperCase().replace(/\s+/g, "");
    if (!/^[A-Z0-9-]{4,20}$/.test(code)) { setState({ busy: false, data: null, none: false, error: "Please type your order number, e.g. TTC-K7F3Q." }); return; }
    setState({ busy: true, data: null, none: false, error: "" });
    try {
      const snap = await getDoc(doc(db, "tracking", code));
      if (snap.exists()) setState({ busy: false, data: { ...snap.data(), code }, none: false, error: "" });
      else setState({ busy: false, data: null, none: true, error: "" });
    } catch (e) {
      setState({ busy: false, data: null, none: false, error: "Couldn't check right now. Please try again in a moment." });
    }
  }
  useEffect(() => { if (initial) find(initial); }, []); // eslint-disable-line

  const d = state.data;
  const cancelled = d && d.stage === "cancelled";
  const at = d ? Math.max(0, TRACK_STEPS.findIndex(([k]) => k === d.stage)) : -1;
  return (
    <div className="ttc-modal" role="dialog" aria-modal="true" aria-label="Track your order" style={{ position: "fixed", inset: 0, zIndex: 85, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div className="ttc-backdrop" onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(43,36,32,0.5)" }} />
      <div className="ttc-modal-inner" style={{ position: "relative", background: COLORS.cream, borderRadius: 18, padding: 24, width: 400, maxWidth: "100%", maxHeight: "calc(100vh - 32px)", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 20, color: COLORS.maroonDark }}>Track your order</span>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", color: COLORS.charcoal }}><X size={18} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); find(); }} style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <input value={no} onChange={(e) => setNo(e.target.value)} placeholder="Order number, e.g. TTC-K7F3Q" aria-label="Order number"
            style={{ flex: 1, minWidth: 0, padding: "10px 12px", borderRadius: 10, border: `1px solid ${COLORS.bgSoft}`, fontSize: 13, background: COLORS.bg }} />
          <button type="submit" style={{ background: COLORS.maroon, color: COLORS.cream, border: "none", borderRadius: 10, padding: "0 16px", fontWeight: 700, fontSize: 13 }}>{state.busy ? "…" : "Track"}</button>
        </form>
        {state.error && <div role="alert" style={{ color: "#8E2A1E", fontSize: 12.5, marginBottom: 8 }}>{state.error}</div>}
        {state.none && (
          <div style={{ fontSize: 13, color: "#5A5048", lineHeight: 1.55 }}>
            There is no update for this number yet. We update orders after we confirm them, so please check again soon, or message us on{" "}
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" style={{ color: "#1E8E4A", fontWeight: 700 }}>WhatsApp</a>.
          </div>
        )}
        {d && (
          <div>
            <div style={{ fontSize: 12, color: "#7A6E64", marginBottom: 10 }}>Order <strong style={{ color: COLORS.charcoal }}>{d.code}</strong></div>
            {cancelled ? (
              <div style={{ background: "#F8E1DE", color: "#8E2A1E", borderRadius: 10, padding: "10px 12px", fontSize: 13 }}>This order was cancelled.</div>
            ) : (
              <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {TRACK_STEPS.map(([k, label], n) => (
                  <li key={k} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", opacity: n <= at ? 1 : 0.45, fontWeight: n === at ? 700 : 500, fontSize: 14 }}>
                    <span style={{ width: 22, height: 22, borderRadius: "50%", background: n <= at ? COLORS.maroon : COLORS.bgSoft, color: COLORS.cream, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{n <= at ? <Check size={13} /> : null}</span>
                    {label}
                  </li>
                ))}
              </ol>
            )}
            {(d.courier || d.number) && (
              <div style={{ background: COLORS.bgSoft, borderRadius: 10, padding: "10px 12px", marginTop: 10, fontSize: 13, lineHeight: 1.6 }}>
                {d.courier && <div>Courier: <strong>{d.courier}</strong></div>}
                {d.number && <div>Tracking number: <strong>{d.number}</strong></div>}
              </div>
            )}
            {d.note && <div style={{ marginTop: 10, fontSize: 13, color: "#5A5048", lineHeight: 1.55 }}>{d.note}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
