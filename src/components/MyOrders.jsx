import React, { useEffect, useState } from "react";
import { X, Package } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { COLORS } from "../data/colors.js";
import { TRACK_STEPS } from "./TrackOrder.jsx";

// "My orders": the orders this customer placed from this phone/browser, with their latest step.
export function readMyOrders() {
  try { const a = JSON.parse(localStorage.getItem("ttc_my_orders") || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; }
}
export function rememberOrder(no, total) {
  try { const a = readMyOrders().filter((x) => x.no !== no); a.unshift({ no, total, at: Date.now() }); localStorage.setItem("ttc_my_orders", JSON.stringify(a.slice(0, 20))); } catch (e) {}
}

export default function MyOrders({ onClose, onTrack }) {
  const [list] = useState(() => readMyOrders());
  const [stage, setStage] = useState({});
  useEffect(() => {
    let dead = false;
    list.slice(0, 10).forEach(async (o) => {
      try { const s = await getDoc(doc(db, "tracking", String(o.no))); if (!dead && s.exists()) setStage((m) => ({ ...m, [o.no]: s.data().stage })); } catch (e) {}
    });
    return () => { dead = true; };
  }, [list]);
  const label = (k) => (k === "cancelled" ? "Cancelled" : (TRACK_STEPS.find(([x]) => x === k) || [])[1] || "Order placed");
  return (
    <div className="ttc-modal" role="dialog" aria-modal="true" aria-label="My orders" style={{ position: "fixed", inset: 0, zIndex: 85, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div className="ttc-backdrop" onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(43,36,32,0.5)" }} />
      <div className="ttc-modal-inner" style={{ position: "relative", background: COLORS.cream, borderRadius: 18, padding: 24, width: 420, maxWidth: "100%", maxHeight: "86vh", overflowY: "auto" }}>
        <button onClick={onClose} aria-label="Close" style={{ position: "absolute", top: 12, right: 12, background: COLORS.bgSoft, border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}><X size={17} /></button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}><Package size={22} color={COLORS.maroon} /><h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 22, color: COLORS.maroonDark, margin: 0 }}>My orders</h2></div>
        {list.length === 0 ? (
          <p style={{ fontSize: 13.5, color: "#5A4E46", lineHeight: 1.6 }}>No orders from this phone yet. When you place an order it will appear here. Have an order number from before? <button type="button" onClick={() => onTrack("")} style={{ background: "none", border: "none", color: COLORS.maroon, fontWeight: 700, textDecoration: "underline", cursor: "pointer", padding: 0, font: "inherit" }}>Track it</button>.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {list.map((o) => (
              <div key={o.no} style={{ background: "#fff", borderRadius: 14, padding: "12px 14px", border: `1px solid ${COLORS.bgSoft}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                  <strong style={{ fontSize: 15, letterSpacing: 0.4 }}>#{o.no}</strong>
                  <span style={{ fontSize: 12, color: "#7A6E64" }}>{new Date(o.at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</span>
                </div>
                <div style={{ fontSize: 13, color: "#5A4E46", margin: "4px 0 8px" }}>{o.total ? "Rs" + o.total + " · " : ""}<span style={{ color: stage[o.no] === "cancelled" ? "#B3261E" : COLORS.maroon, fontWeight: 700 }}>{label(stage[o.no])}</span></div>
                <button type="button" onClick={() => onTrack(String(o.no))} style={{ background: COLORS.maroon, color: COLORS.cream, border: "none", borderRadius: 999, padding: "7px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Track this order</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
