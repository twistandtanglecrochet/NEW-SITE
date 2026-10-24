import React from "react";
import { COLORS } from "../data/colors.js";
import { Img } from "../lib/cloudinary.jsx";

function photoOf(item) {
  if (!item) return null;
  if (item.photos && item.photos[0]) return item.photos[0];
  if (item.variants && item.variants[0] && item.variants[0].photo) return item.variants[0].photo;
  return null;
}

// A sideways strip of the products this customer looked at most recently.
export default function RecentStrip({ ids, products, onOpen, urlFor, t }) {
  const items = ids.map((id) => products.find((p) => String(p.id) === String(id))).filter(Boolean);
  if (items.length === 0) return null;
  return (
    <section style={{ padding: "var(--ttc-section-space, 20px) 20px", maxWidth: 1000, margin: "0 auto" }}>
      <div className="ttc-shop-panel" style={{ background: "rgba(251,246,240,0.82)", backdropFilter: "blur(4px)", borderRadius: "var(--ttc-panel-radius, 24px)" }}>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 22, color: COLORS.maroonDark, margin: "0 0 14px" }}>
          {t("recent.title")}
        </h2>
        <div style={{ display: "flex", gap: "var(--ttc-gap, 12px)", overflowX: "auto", paddingBottom: 6, scrollSnapType: "x proximity" }}>
          {items.map((p) => {
            const photo = photoOf(p);
            return (
              <a
                key={p.id}
                href={urlFor(p.id)}
                onClick={(e) => { e.preventDefault(); onOpen(p.id); }}
                style={{ flex: "0 0 120px", textDecoration: "none", color: COLORS.charcoal, scrollSnapAlign: "start" }}
              >
                <div style={{ width: 120, aspectRatio: "1", borderRadius: "var(--ttc-photo-radius, 14px)", overflow: "hidden", background: "#fff" }}>
                  {photo ? (
                    <Img src={photo} alt={p.name} loading="lazy" sizes="120px" widths={[120, 240]} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: p.swatch ? `linear-gradient(135deg, ${p.swatch[0]}, ${p.swatch[1]})` : COLORS.blushSoft }} />
                  )}
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 6, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.name}</div>
                <div style={{ fontSize: 12, color: COLORS.maroon }}>Rs{p.price}</div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
