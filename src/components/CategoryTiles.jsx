import React from "react";
import { COLORS } from "../data/colors.js";
import { Img } from "../lib/cloudinary.jsx";

// Picture tiles, one per category. Tapping a tile opens that category (the
// same /category/<name> page the menu opens).

function photoOf(item) {
  if (!item) return null;
  if (item.photos && item.photos[0]) return item.photos[0];
  if (item.variants && item.variants[0] && item.variants[0].photo) return item.variants[0].photo;
  return null;
}

export default function CategoryTiles({ categories, products, title, urlFor, onSelect, t }) {
  const tiles = categories
    .filter((c) => c !== "All")
    .map((cat) => {
      const inCat = products.filter((p) => p.category === cat);
      const withPhoto = inCat.find((p) => photoOf(p));
      return { cat, count: inCat.length, photo: withPhoto ? photoOf(withPhoto) : null, swatch: inCat[0] && inCat[0].swatch };
    })
    .filter((x) => x.count > 0);
  if (tiles.length === 0) return null;

  return (
    <section style={{ padding: "var(--ttc-section-space, 20px) 20px", maxWidth: 1000, margin: "0 auto" }}>
      <div className="ttc-shop-panel" style={{ background: "rgba(251,246,240,0.82)", backdropFilter: "blur(4px)", borderRadius: "var(--ttc-panel-radius, 24px)" }}>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 28, color: COLORS.maroonDark, margin: "0 0 18px" }}>
          {title || t("tiles.title")}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "var(--ttc-gap, 14px)" }}>
          {tiles.map((x) => (
            <a
              key={x.cat}
              href={urlFor(x.cat)}
              onClick={(e) => { e.preventDefault(); onSelect(x.cat); }}
              style={{
                position: "relative", display: "block", aspectRatio: "1", borderRadius: "var(--ttc-card-radius, 18px)",
                overflow: "hidden", textDecoration: "none", background: COLORS.bgSoft,
              }}
            >
              {x.photo ? (
                <Img src={x.photo} alt={x.cat} loading="lazy" sizes="(max-width: 700px) 45vw, 220px" widths={[200, 320, 480]} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", background: x.swatch ? `linear-gradient(135deg, ${x.swatch[0]}, ${x.swatch[1]})` : COLORS.blushSoft }} />
              )}
              <div style={{
                position: "absolute", left: 0, right: 0, bottom: 0, padding: "22px 10px 9px",
                background: "linear-gradient(to top, rgba(43,36,32,0.72), rgba(43,36,32,0))", color: COLORS.cream, textAlign: "center",
              }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 14.5 }}>{x.cat}</div>
                <div style={{ fontSize: 11, opacity: 0.85 }}>{x.count} {t("tiles.items")}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
