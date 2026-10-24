import React from "react";
import { X, Heart, Plus } from "lucide-react";
import { COLORS } from "../data/colors.js";
import { Img } from "../lib/cloudinary.jsx";

function photoOf(item) {
  if (!item) return null;
  if (item.photos && item.photos[0]) return item.photos[0];
  if (item.variants && item.variants[0] && item.variants[0].photo) return item.variants[0].photo;
  return null;
}

// The customer's saved (hearted) products, kept in this browser only.
export default function WishlistPanel({ ids, products, onClose, onOpen, onAdd, onRemove, t, reminders }) {
  let saved = {}; if (reminders) { try { saved = JSON.parse(localStorage.getItem("ttc_wish_prices") || "{}") || {}; } catch (e) {} }
  const items = ids.map((id) => products.find((p) => String(p.id) === String(id))).filter(Boolean);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 52, display: "flex", justifyContent: "flex-end" }} className="ttc-safe-pad">
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(43,36,32,0.4)" }} />
      <div style={{ position: "relative", width: 340, maxWidth: "88vw", background: COLORS.cream, height: "100%", padding: 22, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 20, color: COLORS.maroonDark, display: "flex", alignItems: "center", gap: 8 }}>
            <Heart size={18} color={COLORS.maroon} fill={COLORS.maroon} /> {t("wish.title")}
          </span>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", color: COLORS.charcoal }}><X size={20} /></button>
        </div>
        {items.length === 0 ? (
          <p style={{ color: "#7A6E64", fontSize: 14 }}>{t("wish.empty")}</p>
        ) : (
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
            {items.map((p) => {
              const photo = photoOf(p);
              return (
                <div key={p.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <button onClick={() => { onOpen(p.id); onClose(); }} style={{ width: 56, height: 56, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "#fff", border: "none", padding: 0 }}>
                    {photo ? (
                      <Img src={photo} alt={p.name} loading="lazy" sizes="56px" widths={[112, 168]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: p.swatch ? `linear-gradient(135deg, ${p.swatch[0]}, ${p.swatch[1]})` : COLORS.blushSoft }} />
                    )}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: COLORS.maroon }}>Rs{p.price}</div>
                    {reminders && p.tag === "Sold Out" && <div style={{ fontSize: 11.5, fontWeight: 700, color: "#B3261E" }}>Sold out right now</div>}
                    {reminders && saved[String(p.id)] > Number(p.price) && <div style={{ fontSize: 11.5, fontWeight: 700, color: "#1B6B3A" }}>Price dropped! Was Rs{saved[String(p.id)]}</div>}
                  </div>
                  <button onClick={() => onAdd(p)} aria-label="Add to cart" style={{ background: COLORS.bgSoft, border: "none", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Plus size={14} />
                  </button>
                  <button onClick={() => onRemove(p.id)} aria-label={t("wish.remove")} style={{ background: "none", border: "none", color: "#7A6E64", display: "flex" }}>
                    <X size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
