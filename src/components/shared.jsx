import React, { useState, useEffect } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { COLORS } from "../data/colors.js";
import { Img } from "../lib/cloudinary.jsx";

// Controlled by the parent (App) via `index`/`onSelect` — NOT internal state
// — so that whichever color/style a customer taps is something the parent
// actually knows about and can put in the cart / WhatsApp order text,
// instead of the choice only ever changing the picture on screen.
export function VariantPicker({ variants, name, index, onSelect, onImageClick }) {
  return (
    <div>
      <div
        onClick={onImageClick}
        style={{
          width: "100%", aspectRatio: "4/5", borderRadius: "var(--ttc-photo-radius, 14px)", overflow: "hidden", background: "#fff",
          cursor: onImageClick ? "pointer" : "default",
        }}
      >
        <Img
          src={variants[index].photo}
          alt={`${name} — ${variants[index].name}`}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginTop: 8 }}>
        {variants.map((v, i) => (
          <button
            key={v.name}
            onClick={(e) => { e.stopPropagation(); onSelect(i); }}
            aria-label={v.name}
            style={{
              aspectRatio: "1", borderRadius: 8, overflow: "hidden", padding: 0,
              border: i === index ? `2px solid ${COLORS.navy}` : "2px solid transparent",
              background: "none",
            }}
          >
            <Img src={v.photo} alt={v.name} loading="lazy" sizes="80px" widths={[96, 160, 240]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function ProductPhotoGallery({ photos, name, autoPlay = false }) {
  const [index, setIndex] = useState(0);
  const go = (delta) => setIndex((i) => (i + delta + photos.length) % photos.length);

  // Auto-advance every 4 seconds — only used where a product has just been
  // opened (the quick view), not on the small grid thumbnails, so browsing
  // the shop isn't distracting. Any manual click also resets this timer
  // (via the `index` dependency) so it doesn't fight with the customer.
  useEffect(() => {
    if (!autoPlay || photos.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % photos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [autoPlay, photos.length, index]);

  return (
    <div style={{ position: "relative" }}>
      <div style={{
        width: "100%", aspectRatio: "4/5", borderRadius: "var(--ttc-photo-radius, 14px)", overflow: "hidden",
        background: "#fff",
      }}>
        <Img
          src={photos[index]}
          alt={`${name} — handmade crochet, Twist & Tangle Crochet`}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
      {photos.length > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            aria-label="Previous photo"
            style={{
              position: "absolute", left: 6, top: "50%", transform: "translateY(-50%)",
              background: "rgba(251,246,240,0.85)", border: "none", borderRadius: "50%",
              width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
              color: COLORS.navy,
            }}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => go(1)}
            aria-label="Next photo"
            style={{
              position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
              background: "rgba(251,246,240,0.85)", border: "none", borderRadius: "50%",
              width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
              color: COLORS.navy,
            }}
          >
            <ChevronRight size={14} />
          </button>
          <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 5 }}>
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Photo ${i + 1}`}
                style={{
                  width: i === index ? 14 : 5, height: 5, borderRadius: 999, border: "none",
                  background: i === index ? COLORS.cream : "rgba(251,246,240,0.5)",
                  transition: "width 0.2s",
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function ProductSwatch({ colors, real }) {
  return (
    <div
      style={{
        width: "100%", aspectRatio: "4/5", borderRadius: "var(--ttc-photo-radius, 14px)",
        background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[0]} 55%, ${colors[1]} 55%, ${colors[1]} 100%)`,
        position: "relative", overflow: "hidden",
      }}
    >
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.35 }}>
        <defs>
          <pattern id={`stitch-${colors[0]}-${colors[1]}`} width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="7" cy="7" r="1.4" fill={COLORS.cream} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#stitch-${colors[0]}-${colors[1]})`} />
      </svg>
      {!real && (
        <div
          style={{
            position: "absolute", bottom: 10, left: 10, right: 10,
            fontFamily: "'Karla', sans-serif", fontSize: 11, color: COLORS.cream,
            background: "rgba(43,36,32,0.55)", borderRadius: 8, padding: "4px 8px",
            textAlign: "center",
          }}
        >
          add your photo here
        </div>
      )}
    </div>
  );
}

// Filled/empty star row for one review's rating (1-5, whole stars only).
export function StarRating({ rating, size = 13 }) {
  return (
    <div style={{ display: "flex", gap: 1 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          fill={n <= rating ? COLORS.gold : "none"}
          color={COLORS.gold}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

// Compact "★ 4.8 (12)" summary used on product cards and the quick view.
// Returns null (renders nothing) when a product has no approved reviews yet —
// a "0 reviews" badge on every product would look worse than no badge at all.
export function RatingSummary({ reviews, size = 13, style }) {
  if (!reviews || reviews.length === 0) return null;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, margin: "5px 0", ...style }}>
      <Star size={size} fill={COLORS.gold} color={COLORS.gold} strokeWidth={1.5} />
      <span style={{ fontSize: 12.5, fontWeight: 700, color: COLORS.charcoal }}>{avg.toFixed(1)}</span>
      <span style={{ fontSize: 12, color: "#7A6E64" }}>({reviews.length})</span>
    </div>
  );
}
