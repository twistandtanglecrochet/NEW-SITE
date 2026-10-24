import React from "react";
import { Plus, Heart } from "lucide-react";
import { COLORS } from "../data/colors.js";
import { VariantPicker, ProductPhotoGallery, ProductSwatch, RatingSummary } from "./shared.jsx";

// Ten product-card designs. Layout 1 is the card the shop has always had;
// the admin panel (Site settings → Card layouts) picks one for the whole shop.
// Only the site's own colors and fonts are used.

export const CARD_LAYOUT_NAMES = [
  "Classic (current)",
  "Minimal",
  "Floating info",
  "Horizontal",
  "Outlined",
  "Compact",
  "Polaroid",
  "Price badge",
  "Banner",
  "Elegant",
];

const serif = "'Fraunces', serif";

function Media({ p, selectedIndex, onSelect, onOpen }) {
  return (
    <div onClick={p.variants ? undefined : onOpen} style={{ cursor: p.variants ? "default" : "pointer" }}>
      {p.variants ? (
        <VariantPicker variants={p.variants} name={p.name} index={selectedIndex} onSelect={onSelect} onImageClick={onOpen} />
      ) : p.photos ? (
        <ProductPhotoGallery photos={p.photos} name={p.name} />
      ) : (
        <ProductSwatch colors={p.swatch} real={p.real} />
      )}
    </div>
  );
}

function HeartBtn({ wish, id, t }) {
  if (!wish || !wish.on) return null;
  const saved = wish.has(id);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); wish.toggle(id); }}
      aria-label={saved ? t("wish.remove") : t("wish.add")}
      aria-pressed={saved}
      style={{
        position: "absolute", top: 8, right: 8, zIndex: 3, width: 32, height: 32, borderRadius: "50%",
        border: "none", background: "rgba(251,246,240,0.92)", display: "flex", alignItems: "center",
        justifyContent: "center", color: COLORS.maroon, boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
      }}
    >
      <Heart size={16} fill={saved ? COLORS.maroon : "none"} />
    </button>
  );
}

function TagPill({ p, style }) {
  if (!p.real) return null;
  return (
    <span style={{
      display: "inline-block", marginBottom: 8,
      fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase",
      color: COLORS.maroon, border: `1px solid ${COLORS.maroon}`,
      borderRadius: 999, padding: "3px 9px", ...style,
    }}>
      {p.tag}
    </span>
  );
}

function NameLink({ p, href, onOpen, style }) {
  return (
    <a
      href={href}
      onClick={(e) => { e.preventDefault(); onOpen(); }}
      style={{
        display: "block", fontFamily: serif, fontWeight: 600, fontSize: 16,
        color: COLORS.charcoal, cursor: "pointer", textDecoration: "none", ...style,
      }}
    >
      {p.name}
    </a>
  );
}

const outlineBtn = {
  background: "transparent", color: COLORS.navy, border: `1.3px solid ${COLORS.navy}`,
  borderRadius: 999, padding: "8px 14px", fontSize: 12, fontWeight: 700,
  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
};
const solidBtn = {
  width: "100%", background: COLORS.navy, color: COLORS.cream, border: "none",
  borderRadius: 999, padding: "9px 0", fontSize: 12.5, fontWeight: 700,
};
const priceStyle = { fontFamily: serif, fontWeight: 600, fontSize: 17, color: COLORS.maroon };
const descStyle = { fontSize: 13, color: "#7A6E64", margin: "6px 0 10px", lineHeight: 1.4 };
const cardRadius = "var(--ttc-card-radius, 18px)";

export default function ProductCard(props) {
  const { p, layout = 1, selectedIndex, onSelect, onOpen, onAdd, onBuy, reviews, href, wish, t } = props;
  const media = <Media p={p} selectedIndex={selectedIndex} onSelect={onSelect} onOpen={onOpen} />;
  const heart = <HeartBtn wish={wish} id={p.id} t={t} />;
  const mediaBox = (
    <div style={{ position: "relative" }}>
      {media}
      {heart}
    </div>
  );
  const addBtn = (extra) => (
    <button onClick={onAdd} style={{ ...outlineBtn, ...extra }}>
      <Plus size={13} /> {t("shop.add")}
    </button>
  );
  const buyBtn = (extra) => (
    <button onClick={onBuy} style={{ ...solidBtn, ...extra }}>{t("shop.buyNow")}</button>
  );

  // 1 — Classic: unchanged from the original shop card.
  if (layout === 1 || !layout) {
    return (
      <div className="ttc-product-card" style={{ background: COLORS.cream, borderRadius: cardRadius }}>
        {mediaBox}
        <div style={{ marginTop: 12 }}>
          <TagPill p={p} />
          <NameLink p={p} href={href} onOpen={onOpen} />
          <RatingSummary reviews={reviews} />
          <div style={descStyle}>{p.desc}</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={priceStyle}>Rs{p.price}</span>
            {addBtn()}
          </div>
          {buyBtn()}
        </div>
      </div>
    );
  }

  // 2 — Minimal: photo, name, price, two small buttons.
  if (layout === 2) {
    return (
      <div className="ttc-product-card" style={{ background: "transparent", borderRadius: cardRadius }}>
        {mediaBox}
        <div style={{ marginTop: 10, textAlign: "center" }}>
          <NameLink p={p} href={href} onOpen={onOpen} style={{ fontSize: 15 }} />
          <div style={{ ...priceStyle, margin: "4px 0 10px" }}>Rs{p.price}</div>
          <div style={{ display: "flex", gap: 8 }}>
            {addBtn({ flex: 1, padding: "8px 6px" })}
            {buyBtn({ flex: 1, width: "auto", padding: "8px 6px" })}
          </div>
        </div>
      </div>
    );
  }

  // 3 — Floating info: details sit on a card that overlaps the photo's bottom edge.
  if (layout === 3) {
    return (
      <div className="ttc-product-card" style={{ background: COLORS.bgSoft, borderRadius: cardRadius }}>
        {mediaBox}
        <div style={{
          background: COLORS.cream, borderRadius: 14, padding: "12px 12px 12px", marginTop: 10,
          boxShadow: "0 3px 12px rgba(43,36,32,0.10)",
        }}>
          <TagPill p={p} />
          <NameLink p={p} href={href} onOpen={onOpen} />
          <RatingSummary reviews={reviews} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "8px 0 10px" }}>
            <span style={priceStyle}>Rs{p.price}</span>
            {addBtn()}
          </div>
          {buyBtn()}
        </div>
      </div>
    );
  }

  // 4 — Horizontal: photo on the left, details on the right.
  if (layout === 4) {
    return (
      <div className="ttc-product-card ttc-card-row" style={{ background: COLORS.cream, borderRadius: cardRadius, display: "grid", gridTemplateColumns: "42% 1fr", gap: 14, alignItems: "start" }}>
        {mediaBox}
        <div>
          <TagPill p={p} />
          <NameLink p={p} href={href} onOpen={onOpen} />
          <RatingSummary reviews={reviews} />
          <div style={descStyle}>{p.desc}</div>
          <div style={{ ...priceStyle, marginBottom: 10 }}>Rs{p.price}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {addBtn()}
            {buyBtn()}
          </div>
        </div>
      </div>
    );
  }

  // 5 — Outlined: white card with a soft pink border.
  if (layout === 5) {
    return (
      <div className="ttc-product-card" style={{ background: "#fff", borderRadius: cardRadius, border: `1.5px solid ${COLORS.blush}`, boxShadow: "0 2px 10px rgba(110,30,54,0.08)" }}>
        {mediaBox}
        <div style={{ marginTop: 12 }}>
          <TagPill p={p} />
          <NameLink p={p} href={href} onOpen={onOpen} />
          <RatingSummary reviews={reviews} />
          <div style={descStyle}>{p.desc}</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={priceStyle}>Rs{p.price}</span>
            {addBtn({ borderColor: COLORS.maroon, color: COLORS.maroon })}
          </div>
          {buyBtn({ background: COLORS.maroon })}
        </div>
      </div>
    );
  }

  // 6 — Compact: no description, one full-width Add button.
  if (layout === 6) {
    return (
      <div className="ttc-product-card" style={{ background: COLORS.cream, borderRadius: cardRadius }}>
        {mediaBox}
        <div style={{ marginTop: 10 }}>
          <NameLink p={p} href={href} onOpen={onOpen} style={{
            fontSize: 14.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          }} />
          <div style={{ ...priceStyle, margin: "4px 0 8px" }}>Rs{p.price}</div>
          {addBtn({ width: "100%" })}
          <button onClick={onBuy} style={{ marginTop: 6, width: "100%", background: "none", border: "none", color: COLORS.navy, fontSize: 12, fontWeight: 700, textDecoration: "underline" }}>
            {t("shop.buyNow")}
          </button>
        </div>
      </div>
    );
  }

  // 7 — Polaroid: white frame with a handwritten caption.
  if (layout === 7) {
    return (
      <div className="ttc-product-card" style={{ background: "#fff", borderRadius: 6, padding: 10, boxShadow: "0 4px 14px rgba(43,36,32,0.16)" }}>
        {mediaBox}
        <div style={{ marginTop: 10, textAlign: "center" }}>
          <NameLink p={p} href={href} onOpen={onOpen} style={{ fontFamily: "'Caveat', cursive", fontSize: 21, fontWeight: 600 }} />
          <div style={{ ...priceStyle, margin: "2px 0 10px" }}>Rs{p.price}</div>
          <div style={{ display: "flex", gap: 8 }}>
            {addBtn({ flex: 1, padding: "8px 6px" })}
            {buyBtn({ flex: 1, width: "auto", padding: "8px 6px" })}
          </div>
        </div>
      </div>
    );
  }

  // 8 — Price badge: price pill on the photo.
  if (layout === 8) {
    return (
      <div className="ttc-product-card" style={{ background: COLORS.cream, borderRadius: cardRadius }}>
        <div style={{ position: "relative" }}>
          {media}
          <span style={{
            position: "absolute", top: 8, left: 8, zIndex: 3, background: COLORS.maroon, color: COLORS.cream,
            fontFamily: serif, fontWeight: 600, fontSize: 13.5, borderRadius: 999, padding: "4px 11px",
          }}>
            Rs{p.price}
          </span>
          {heart}
        </div>
        <div style={{ marginTop: 12 }}>
          <NameLink p={p} href={href} onOpen={onOpen} />
          <RatingSummary reviews={reviews} />
          <div style={descStyle}>{p.desc}</div>
          <div style={{ display: "flex", gap: 8 }}>
            {addBtn({ flex: 1 })}
            {buyBtn({ flex: 1, width: "auto", padding: "8px 6px" })}
          </div>
        </div>
      </div>
    );
  }

  // 9 — Banner: a ribbon with the tag above the photo.
  if (layout === 9) {
    return (
      <div className="ttc-product-card" style={{ background: COLORS.cream, borderRadius: cardRadius, overflow: "hidden" }}>
        {p.real && p.tag ? (
          <div style={{
            background: COLORS.gold, color: COLORS.cream, textAlign: "center", fontSize: 11, fontWeight: 700,
            letterSpacing: 1, textTransform: "uppercase", padding: "5px 0", margin: "0 0 8px", borderRadius: 8,
          }}>
            {p.tag}
          </div>
        ) : null}
        {mediaBox}
        <div style={{ marginTop: 12, textAlign: "center" }}>
          <NameLink p={p} href={href} onOpen={onOpen} />
          <RatingSummary reviews={reviews} style={{ justifyContent: "center" }} />
          <div style={{ ...priceStyle, fontSize: 19, margin: "4px 0 10px" }}>Rs{p.price}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {addBtn()}
            {buyBtn()}
          </div>
        </div>
      </div>
    );
  }

  // 10 — Elegant: centered serif text on a soft background.
  return (
    <div className="ttc-product-card" style={{ background: COLORS.bgSoft, borderRadius: cardRadius }}>
      {mediaBox}
      <div style={{ marginTop: 14, textAlign: "center" }}>
        <NameLink p={p} href={href} onOpen={onOpen} style={{ fontSize: 17 }} />
        <div style={{ width: 36, height: 1, background: COLORS.gold, margin: "8px auto" }} />
        <div style={{ ...descStyle, margin: "0 0 10px" }}>{p.desc}</div>
        <div style={{ ...priceStyle, fontSize: 18, marginBottom: 12 }}>Rs{p.price}</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          {addBtn({ flex: 1 })}
          {buyBtn({ flex: 1, width: "auto", padding: "8px 6px" })}
        </div>
      </div>
    </div>
  );
}
