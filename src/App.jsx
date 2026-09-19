import React, { useState, useMemo, useEffect } from "react";
import { ShoppingBag, Heart, Instagram, MessageCircle, Plus, Minus, X, Facebook, Search, ChevronDown, ChevronLeft, ChevronRight, Menu, Star } from "lucide-react";
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { COLORS } from "./data/colors.js";
import { LOGO_SRC, BG_SRC } from "./data/siteImages.js";
import { categorySlug } from "./data/slug.js";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "./data/siteConfig.js";
import {
  SEED_PRODUCTS,
  POUCH_FRONT_SRC,
  SUNFLOWER_1_SRC,
  JERSEY_KEYCHAIN_1_SRC,
  EARRING_EAR1_SRC,
} from "./data/products.js";

const WHATSAPP_NUMBER = "923027609899";

// Promo codes: type "percent" (e.g. 10 = 10% off) or "flat" (fixed Rs amount off)
const PROMO_CODES = {
  "TTC10": { type: "percent", value: 10 },
  "WELCOME50": { type: "flat", value: 50 },
};

function StitchDivider() {
  return (
    <svg viewBox="0 0 400 20" preserveAspectRatio="none" style={{ width: "100%", height: 16, display: "block" }}>
      <line
        x1="0" y1="10" x2="400" y2="10"
        stroke={COLORS.maroon}
        strokeWidth="2"
        strokeDasharray="1,11"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HeartLineDivider({ color = COLORS.navy }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", maxWidth: 340, margin: "0 auto" }}>
      <div style={{ flex: 1, height: 1, background: color, opacity: 0.5 }} />
      <svg width="14" height="13" viewBox="0 0 24 22" fill="none">
        <path d="M12 20 C-4 9 2 -2 12 6 C22 -2 28 9 12 20Z" stroke={color} strokeWidth="1.6" fill="none" />
      </svg>
      <div style={{ flex: 1, height: 1, background: color, opacity: 0.5 }} />
    </div>
  );
}

function LeafSprig({ side = "left", color = COLORS.gold }) {
  const flip = side === "right" ? "scaleX(-1)" : "none";
  return (
    <svg width="34" height="16" viewBox="0 0 60 28" fill="none" style={{ transform: flip }}>
      <path d="M2 14 Q30 4 58 14" stroke={color} strokeWidth="1.3" fill="none" />
      <ellipse cx="16" cy="10" rx="6" ry="2.6" fill={color} opacity="0.75" transform="rotate(-20 16 10)" />
      <ellipse cx="30" cy="6" rx="6" ry="2.6" fill={color} opacity="0.75" transform="rotate(-8 30 6)" />
      <ellipse cx="44" cy="10" rx="6" ry="2.6" fill={color} opacity="0.75" transform="rotate(10 44 10)" />
    </svg>
  );
}

function HandDrawnHeart({ size = 20 }) {
  return (
    <svg width={size} height={size * 0.9} viewBox="0 0 30 26" fill="none">
      <path
        d="M15 24 C-3 12 1 -1 15 7 C29 -1 33 12 15 24Z"
        stroke="#B23A2E" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function CornerFlorals({ corner = "top-left" }) {
  const isTop = corner.includes("top");
  const isLeft = corner.includes("left");
  return (
    <svg
      width="150" height="150" viewBox="0 0 150 150" fill="none"
      style={{
        position: "absolute",
        top: isTop ? -10 : "auto", bottom: isTop ? "auto" : -10,
        left: isLeft ? -10 : "auto", right: isLeft ? "auto" : -10,
        opacity: 0.5, pointerEvents: "none",
        transform: `scale(${isLeft ? 1 : -1}, ${isTop ? 1 : -1})`,
      }}
    >
      <path d="M10 10 Q40 30 55 65 Q65 90 50 130" stroke={COLORS.gold} strokeWidth="1.2" fill="none" />
      <path d="M10 10 Q40 30 55 65" stroke={COLORS.navy} strokeWidth="1" fill="none" opacity="0.6" />
      {[
        [22, 18], [34, 32], [44, 50], [50, 70], [46, 92],
      ].map(([cx, cy], i) => (
        <ellipse key={i} cx={cx} cy={cy} rx="7" ry="3.2" fill={COLORS.gold} opacity="0.55"
          transform={`rotate(${30 + i * 15} ${cx} ${cy})`} />
      ))}
    </svg>
  );
}

function Logo({ size = 72, scale = 2 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ height: size, width: size, display: "flex", alignItems: "center", justifyContent: "center", overflow: "visible", flexShrink: 0 }}>
        <img
          className="ttc-logo-img"
          src={LOGO_SRC}
          alt="Twist & Tangle Crochet logo"
          style={{ height: size * scale, width: "auto", objectFit: "contain" }}
        />
      </div>
      <div className="ttc-logo-text" style={{ lineHeight: 1.15 }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 15, color: COLORS.navy }}>
          Twist &amp; Tangle
        </div>
        <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 15, color: COLORS.navy }}>
          Crochet (TTC)
        </div>
      </div>
    </div>
  );
}

function VariantPicker({ variants, name, onImageClick }) {
  const [index, setIndex] = useState(0);
  return (
    <div>
      <div
        onClick={onImageClick}
        style={{
          width: "100%", aspectRatio: "4/5", borderRadius: 14, overflow: "hidden", background: "#fff",
          cursor: onImageClick ? "pointer" : "default",
        }}
      >
        <img
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
            onClick={(e) => { e.stopPropagation(); setIndex(i); }}
            aria-label={v.name}
            style={{
              aspectRatio: "1", borderRadius: 8, overflow: "hidden", padding: 0,
              border: i === index ? `2px solid ${COLORS.navy}` : "2px solid transparent",
              background: "none",
            }}
          >
            <img src={v.photo} alt={v.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductPhotoGallery({ photos, name }) {
  const [index, setIndex] = useState(0);
  const go = (delta) => setIndex((i) => (i + delta + photos.length) % photos.length);

  return (
    <div style={{ position: "relative" }}>
      <div style={{
        width: "100%", aspectRatio: "4/5", borderRadius: 14, overflow: "hidden",
        background: "#fff",
      }}>
        <img
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

function ProductSwatch({ colors, real }) {
  return (
    <div
      style={{
        width: "100%", aspectRatio: "4/5", borderRadius: 14,
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
function StarRating({ rating, size = 13 }) {
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
function RatingSummary({ reviews, size = 13, style }) {
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

// The reviews block shown inside the quick view / product detail: the
// existing approved reviews for this one product, plus a form to leave a
// new one. New reviews are NOT shown immediately — they're saved with
// approved:false and only appear once approved from the admin portal, so a
// spam or inappropriate submission never reaches other customers.
function ReviewsSection({ productId, productName, reviews }) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !comment.trim() || rating < 1) {
      setError("Please add your name, a star rating, and a short comment.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await addDoc(collection(db, "reviews"), {
        productId,
        productName,
        name: name.trim(),
        rating,
        comment: comment.trim(),
        approved: false,
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (err) {
      setError("Couldn't submit your review — please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ marginTop: 28, borderTop: `1px solid ${COLORS.bgSoft}`, paddingTop: 20 }}>
      <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 16, color: COLORS.maroonDark, marginBottom: 12 }}>
        Reviews {reviews.length > 0 && `(${reviews.length})`}
      </div>

      {reviews.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
          {reviews.map((r) => (
            <div key={r.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <StarRating rating={r.rating} />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: COLORS.charcoal }}>{r.name}</span>
              </div>
              <p style={{ fontSize: 13, color: "#5A4E46", lineHeight: 1.5, margin: 0 }}>{r.comment}</p>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 13, color: "#7A6E64", marginBottom: 18 }}>
          No reviews yet — be the first to share what you think.
        </p>
      )}

      {submitted ? (
        <p style={{ fontSize: 13, color: "#2E7D32", fontWeight: 600 }}>
          Thanks! Your review will appear here once it's been approved.
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.charcoal, marginBottom: 8 }}>Write a review</div>
          <div style={{ display: "flex", gap: 3, marginBottom: 10 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                style={{ background: "none", border: "none", padding: 2, display: "flex" }}
              >
                <Star
                  size={22}
                  fill={n <= (hoverRating || rating) ? COLORS.gold : "none"}
                  color={COLORS.gold}
                  strokeWidth={1.5}
                />
              </button>
            ))}
          </div>
          <input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: "100%", padding: "9px 12px", marginBottom: 8, borderRadius: 10,
              border: `1px solid ${COLORS.bgSoft}`, fontSize: 13, background: COLORS.bg,
            }}
          />
          <textarea
            placeholder="What did you think?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            style={{
              width: "100%", padding: "9px 12px", marginBottom: 8, borderRadius: 10,
              border: `1px solid ${COLORS.bgSoft}`, fontSize: 13, background: COLORS.bg,
              resize: "vertical", fontFamily: "inherit",
            }}
          />
          {error && <div style={{ fontSize: 12, color: "#C0392B", marginBottom: 8 }}>{error}</div>}
          <button
            type="submit"
            disabled={submitting}
            style={{
              background: COLORS.navy, color: COLORS.cream, border: "none", borderRadius: 999,
              padding: "9px 18px", fontSize: 13, fontWeight: 700, opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? "Submitting..." : "Submit review"}
          </button>
        </form>
      )}
    </div>
  );
}

const HERO_SLIDES = [
  { photo: POUCH_FRONT_SRC, colors: [COLORS.maroon, COLORS.blushSoft], real: true },
  { photo: SUNFLOWER_1_SRC, colors: [COLORS.gold, "#3B2A1A"], real: true },
  { photo: JERSEY_KEYCHAIN_1_SRC, colors: [COLORS.navy, COLORS.cream], real: true },
  { photo: EARRING_EAR1_SRC, colors: [COLORS.gold, COLORS.navy], real: true },
];

function Slideshow({ slides }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 2500);
    return () => clearInterval(t);
  }, [slides.length]);

  const go = (delta) => setIndex((i) => (i + delta + slides.length) % slides.length);

  return (
    <div style={{ position: "relative" }}>
      {slides[index].photo ? (
        <div style={{ width: "100%", aspectRatio: "4/5", borderRadius: 14, overflow: "hidden", background: "#fff" }}>
          <img src={slides[index].photo} alt="Twist & Tangle Crochet — handmade crochet product" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      ) : (
        <ProductSwatch colors={slides[index].colors} real={slides[index].real} />
      )}
      <button
        onClick={() => go(-1)}
        aria-label="Previous slide"
        style={{
          position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
          background: "rgba(251,246,240,0.85)", border: "none", borderRadius: "50%",
          width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
          color: COLORS.navy,
        }}
      >
        <ChevronLeft size={16} />
      </button>
      <button
        onClick={() => go(1)}
        aria-label="Next slide"
        style={{
          position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
          background: "rgba(251,246,240,0.85)", border: "none", borderRadius: "50%",
          width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
          color: COLORS.navy,
        }}
      >
        <ChevronRight size={16} />
      </button>
      <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6 }}>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            style={{
              width: i === index ? 16 : 6, height: 6, borderRadius: 999, border: "none",
              background: i === index ? COLORS.cream : "rgba(251,246,240,0.5)",
              transition: "width 0.2s",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Every place that used to open WhatsApp/Instagram/Facebook via a
// JavaScript-simulated click (creating a hidden <a>, calling .click(), then
// window.open() as a fallback) has been changed to a real <a target="_blank">
// link instead. On phones and tablets in particular, a real link is the only
// version mobile browsers reliably treat as "open a new tab" rather than
// navigating the current tab away from the site before handing off to the
// WhatsApp/Instagram app.

export default function App() {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("ttc_cart");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("ttc_cart", JSON.stringify(cart));
    } catch (e) {
      // storage unavailable (e.g. private browsing) — ignore
    }
  }, [cart]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  // Set only by the "Buy Now" buttons, to { id, qty } for that one product.
  // While this is set, the checkout modal orders just that single item,
  // regardless of anything else sitting in the cart — "Buy Now" is meant to
  // be a direct, one-item purchase, not "add this to my cart and check out
  // whatever's in there." It's cleared whenever the checkout modal closes.
  const [directBuyItem, setDirectBuyItem] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "" });
  const [quickViewId, setQuickViewId] = useState(null);
  const [quickViewQty, setQuickViewQty] = useState(1);
  const [quickViewSize, setQuickViewSize] = useState(null);
  const [instaCopied, setInstaCopied] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [products, setProducts] = useState(SEED_PRODUCTS);
  // True once the products listener has responded at least once (success or
  // failure) — used so a bad /product/xyz or /category/xyz link isn't
  // declared "not found" before Firestore's admin-added products have even
  // had a chance to arrive.
  const [productsLoaded, setProductsLoaded] = useState(false);
  // Set when a direct link points at a product or category that genuinely
  // doesn't exist (deleted, mistyped, or an old ad link) — shown as a small
  // dismissible notice instead of leaving the visitor looking at what seems
  // like a blank/broken page.
  const [routeNotice, setRouteNotice] = useState(null);
  const [reviews, setReviews] = useState([]);
  const routeAppliedRef = React.useRef(false);

  // Approved reviews, grouped by product id — used for the star rating shown
  // on product cards/quick view, and the "no reviews yet" fallback.
  const reviewsByProduct = useMemo(() => {
    const map = {};
    reviews.forEach((r) => {
      if (!r.approved) return;
      (map[r.productId] = map[r.productId] || []).push(r);
    });
    return map;
  }, [reviews]);

  // Most recent approved reviews across every product, for the homepage
  // "What customers say" section — reviews are already newest-first from the
  // Firestore query below, so this is just "take the approved ones".
  const homepageReviews = useMemo(
    () => reviews.filter((r) => r.approved).slice(0, 6),
    [reviews]
  );

  function urlForCategory(cat) {
    return cat === "All" ? "/" : `/category/${categorySlug(cat)}`;
  }
  function urlForProduct(id) {
    return `/product/${encodeURIComponent(id)}`;
  }
  function selectCategory(cat, push = true) {
    setActiveCategory(cat);
    setCategoryMenuOpen(false);
    if (push) window.history.pushState({}, "", urlForCategory(cat));
  }
  function closeQuickView(push = true) {
    setQuickViewId(null);
    if (push) window.history.pushState({}, "", urlForCategory(activeCategory));
  }

  // Apply a deep link from the URL (a specific product or category) once the
  // relevant data has loaded — this is what makes ad links work. Also
  // handles the case where the link points at something that no longer
  // exists (a deleted product, an old/mistyped ad link): rather than
  // silently doing nothing — which just looks like a blank or broken page —
  // it falls back to the normal homepage with a small "we couldn't find
  // that" notice.
  useEffect(() => {
    if (routeAppliedRef.current) return;
    const path = window.location.pathname;
    const productMatch = path.match(/^\/product\/([^/]+)/);
    const categoryMatch = path.match(/^\/category\/([^/]+)/);
    if (productMatch) {
      const id = decodeURIComponent(productMatch[1]);
      const found = products.find((p) => p.id === id);
      if (found) {
        openQuickView(id, false);
        routeAppliedRef.current = true;
      } else if (productsLoaded) {
        // Only give up once we've actually heard back from Firestore at
        // least once — otherwise an admin-added product's link could be
        // wrongly declared "not found" while that data is still loading.
        setRouteNotice({ type: "product" });
        window.history.replaceState({}, "", "/");
        routeAppliedRef.current = true;
      }
    } else if (categoryMatch) {
      const slug = categoryMatch[1];
      const cats = ["All", ...Array.from(new Set(products.map((p) => p.category)))];
      const found = cats.find((c) => categorySlug(c) === slug);
      if (found) {
        setActiveCategory(found);
        routeAppliedRef.current = true;
      } else if (productsLoaded) {
        setRouteNotice({ type: "category" });
        window.history.replaceState({}, "", "/");
        routeAppliedRef.current = true;
      }
    } else {
      routeAppliedRef.current = true;
    }
  }, [products, productsLoaded]);

  // Support the browser's back/forward buttons between category & product URLs.
  useEffect(() => {
    function onPopState() {
      const path = window.location.pathname;
      const productMatch = path.match(/^\/product\/([^/]+)/);
      const categoryMatch = path.match(/^\/category\/([^/]+)/);
      if (productMatch) {
        const id = decodeURIComponent(productMatch[1]);
        if (products.find((p) => p.id === id)) openQuickView(id, false);
      } else if (categoryMatch) {
        const slug = categoryMatch[1];
        const cats = ["All", ...Array.from(new Set(products.map((p) => p.category)))];
        const found = cats.find((c) => categorySlug(c) === slug);
        setActiveCategory(found || "All");
        setQuickViewId(null);
      } else {
        setActiveCategory("All");
        setQuickViewId(null);
      }
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [products]);

  // Keep the browser tab title, the meta description, and the Open Graph
  // tags in sync with whatever is actually open (a product, a category, or
  // the homepage). This is what makes a link shared while a product/category
  // is open — or the URL bar copied at that point — describe that specific
  // page instead of always showing the generic store info. (Link previews in
  // WhatsApp/Instagram/Facebook read the page's *static* HTML and don't run
  // this JavaScript, so this effect mainly helps the browser tab itself and
  // any crawler that does execute JS — the build step covers the rest, see
  // scripts/generate-seo.mjs.)
  useEffect(() => {
    function setMeta(selector, content) {
      const el = document.querySelector(selector);
      if (el) el.setAttribute("content", content);
    }
    function setCanonical(href) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = href;
    }

    const openProduct = quickViewId ? products.find((p) => p.id === quickViewId) : null;

    if (openProduct) {
      const title = `${openProduct.name} — ${SITE_NAME}`;
      const desc = openProduct.desc || SITE_NAME;
      document.title = title;
      setMeta('meta[name="description"]', desc);
      setMeta('meta[property="og:title"]', title);
      setMeta('meta[property="og:description"]', desc);
      setCanonical(SITE_URL + urlForProduct(openProduct.id));
    } else if (activeCategory !== "All") {
      const title = `${activeCategory} — ${SITE_NAME}`;
      const desc = `Shop handmade ${activeCategory} from Twist & Tangle Crochet (TTC) — made to order in Lahore, Pakistan.`;
      document.title = title;
      setMeta('meta[name="description"]', desc);
      setMeta('meta[property="og:title"]', title);
      setMeta('meta[property="og:description"]', desc);
      setCanonical(SITE_URL + urlForCategory(activeCategory));
    } else {
      document.title = SITE_NAME;
      setMeta('meta[name="description"]', SITE_DESCRIPTION);
      setMeta('meta[property="og:title"]', SITE_NAME);
      setMeta('meta[property="og:description"]', SITE_DESCRIPTION);
      setCanonical(SITE_URL + "/");
    }
  }, [quickViewId, activeCategory, products]);

  useEffect(() => {
    const q = query(collection(db, "products"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        // Keep the built-in starter catalog, plus anything from the admin
        // portal on top of it — except a starter product that's been
        // imported into the admin database (it carries a matching
        // `seedId`), which is dropped here so it isn't shown twice once
        // it's editable from the admin portal instead.
        const fromFirestore = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Sort by the admin portal's custom "order" field (set via the
        // up/down arrows there) so shop owners can control display order.
        // Anything without an order yet (not migrated) falls back to
        // newest-first, matching the site's old default.
        fromFirestore.sort((a, b) => {
          const aHas = typeof a.order === "number";
          const bHas = typeof b.order === "number";
          if (aHas && bHas) return a.order - b.order;
          if (aHas) return -1;
          if (bHas) return 1;
          const aTime = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
          const bTime = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
          return bTime - aTime;
        });
        const importedSeedIds = new Set(fromFirestore.map((p) => p.seedId).filter(Boolean));
        const remainingSeed = SEED_PRODUCTS.filter((p) => !importedSeedIds.has(p.id));
        setProducts([...fromFirestore, ...remainingSeed]);
        setProductsLoaded(true);
      },
      () => {
        // If Firestore can't be reached, fall back to the built-in catalog.
        setProducts(SEED_PRODUCTS);
        setProductsLoaded(true);
      }
    );
    return () => unsub();
  }, []);

  // Reviews — a single listener for all of them (approved and pending),
  // filtered/sorted in memory (see reviewsByProduct/homepageReviews above).
  // Deliberately not filtering by `approved` in the query itself: a
  // compound Firestore query (equality filter + orderBy on a different
  // field) needs a manually-created index, which would otherwise silently
  // break this the first time it ran in production.
  useEffect(() => {
    const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => setReviews(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => setReviews([])
    );
    return () => unsub();
  }, []);

  // Re-builds the JSON-LD "structured data" Google uses to understand the
  // catalog. This depends on `products` (not `[]`) on purpose — otherwise it
  // would freeze on the first render and never include anything added later
  // through the admin portal.
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "itemListElement": products.map((p, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "item": {
          "@type": "Product",
          "name": p.name,
          "description": p.desc,
          "category": p.category,
          "brand": { "@type": "Brand", "name": SITE_NAME },
          "offers": {
            "@type": "Offer",
            "priceCurrency": "PKR",
            "price": p.price,
            "availability": "https://schema.org/InStock",
            "url": SITE_URL + urlForProduct(p.id)
          }
        }
      }))
    };
    let script = document.getElementById("ttc-product-schema");
    if (!script) {
      script = document.createElement("script");
      script.id = "ttc-product-schema";
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schema);
  }, [products]);

  const categories = useMemo(() => ["All", ...Array.from(new Set(products.map((p) => p.category)))], [products]);
  const visibleProducts = useMemo(() => {
    let list = activeCategory === "All" ? products : products.filter((p) => p.category === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    return list;
  }, [activeCategory, searchQuery, products]);

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        // A cart saved in the customer's browser can outlive a product — if
        // it was deleted or edited from the admin portal since they added
        // it, `products.find` below won't find it. Drop those instead of
        // showing a broken "Rsundefined" line item.
        .map(([id, qty]) => {
          const p = products.find((pr) => pr.id === id);
          return p ? { ...p, qty } : null;
        })
        .filter((i) => i && i.qty > 0),
    [cart, products]
  );
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const subtotal = cartItems.reduce((s, i) => s + i.qty * i.price, 0);

  function calcDiscount(subtotalAmount) {
    if (!appliedPromo) return 0;
    const promo = PROMO_CODES[appliedPromo];
    if (!promo) return 0;
    if (promo.type === "percent") return Math.round((subtotalAmount * promo.value) / 100);
    return Math.min(promo.value, subtotalAmount);
  }
  // These three (subtotal/discount/total) describe the CART DRAWER — always
  // everything currently in the cart. The checkout modal uses its own
  // checkoutSubtotal/checkoutDiscount/checkoutTotal below instead, so that a
  // "Buy Now" purchase never mixes in whatever else happens to be in the cart.
  const discount = useMemo(() => calcDiscount(subtotal), [appliedPromo, subtotal]);
  const total = Math.max(0, subtotal - discount);

  // What the checkout modal actually orders: just the one "Buy Now" item
  // when that's how the customer got here, otherwise the full cart.
  const checkoutItems = useMemo(() => {
    if (directBuyItem) {
      const p = products.find((pr) => pr.id === directBuyItem.id);
      return p ? [{ ...p, qty: directBuyItem.qty }] : [];
    }
    return cartItems;
  }, [directBuyItem, cartItems, products]);
  const checkoutSubtotal = checkoutItems.reduce((s, i) => s + i.qty * i.price, 0);
  const checkoutDiscount = useMemo(() => calcDiscount(checkoutSubtotal), [appliedPromo, checkoutSubtotal]);
  const checkoutTotal = Math.max(0, checkoutSubtotal - checkoutDiscount);

  function applyPromo() {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    if (PROMO_CODES[code]) {
      setAppliedPromo(code);
      setPromoError("");
    } else {
      setAppliedPromo(null);
      setPromoError("Invalid promo code");
    }
  }
  function removePromo() {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoError("");
  }

  function addToCart(id, qty = 1) {
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + qty }));
  }
  function buyNow(id, qty = 1) {
    // Deliberately does NOT touch the shared cart — "Buy Now" checks out
    // just this one item, it doesn't add it to whatever's already in the
    // cart (see checkoutItems above).
    setDirectBuyItem({ id, qty });
    setDrawerOpen(false);
    setCheckoutOpen(true);
  }
  function closeCheckout() {
    setCheckoutOpen(false);
    setDirectBuyItem(null);
  }
  function openQuickView(id, push = true) {
    const p = products.find((pr) => pr.id === id);
    setQuickViewId(id);
    setQuickViewQty(1);
    setQuickViewSize(p && p.sizes ? p.sizes[0] : null);
    if (push) window.history.pushState({}, "", urlForProduct(id));
  }
  function changeQty(id, delta) {
    setCart((c) => {
      const next = Math.max(0, (c[id] || 0) + delta);
      return { ...c, [id]: next };
    });
  }

  function buildOrderText() {
    const lines = checkoutItems.map((i) => `• ${i.name} x${i.qty} — Rs${i.price * i.qty}`).join("\n");
    const promoLine = appliedPromo
      ? `Promo code: ${appliedPromo} (-Rs${checkoutDiscount})\n`
      : "";
    return (
      `Hi TTC! I'd like to order:\n\n${lines}\n\nSubtotal: Rs${checkoutSubtotal}\n${promoLine}Total: Rs${checkoutTotal}\n\n` +
      `Name: ${form.name}\nPhone: ${form.phone}\nAddress: ${form.address}\n` +
      (form.notes ? `Notes: ${form.notes}\n` : "")
    );
  }

  function buildWhatsAppLink() {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildOrderText())}`;
  }

  // Copies the order text for pasting into Instagram. Deliberately does NOT
  // await this before the "Order via Instagram DM" link navigates — on
  // mobile browsers, opening a new tab only reliably counts as part of the
  // original tap if it happens synchronously; waiting on the clipboard
  // promise first (as this used to) can make the browser block the new tab
  // or fall back to navigating the current one away instead.
  function copyOrderTextForInstagram() {
    navigator.clipboard
      .writeText(buildOrderText())
      .then(() => {
        setInstaCopied(true);
        setTimeout(() => setInstaCopied(false), 4000);
      })
      .catch(() => {
        // Clipboard unavailable — the Instagram tab still opens either way.
      });
  }

  const canSubmit = form.name.trim() && form.phone.trim() && form.address.trim() && checkoutItems.length > 0;

  return (
    <div className="ttc-bg-scroll" style={{
      backgroundColor: COLORS.bg,
      backgroundImage: `url(${BG_SRC})`,
      backgroundSize: "cover",
      backgroundPosition: "top center",
      backgroundAttachment: "fixed",
      minHeight: "100%", color: COLORS.charcoal, fontFamily: "'Karla', sans-serif", position: "relative",
      overflowX: "hidden", width: "100%",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Karla:wght@400;500;700&family=Caveat:wght@600&display=swap');
        * { box-sizing: border-box; }
        button { font-family: inherit; cursor: pointer; }
        input, textarea { font-family: inherit; }
        .ttc-header-desktop { display: flex; }
        .ttc-header-mobile { display: none; }
        .ttc-hero-grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 40px; align-items: center; }
        .ttc-hero-h1 { font-size: 46px; }
        .ttc-hero-section { padding: 40px 20px 40px; }
        .ttc-hero-panel { padding: 32px 28px; }
        .ttc-shop-section { padding: 48px 20px 20px; }
        .ttc-shop-panel { padding: 26px 24px; }
        .ttc-product-card { padding: 14px; }
        @media (max-width: 1024px) {
          .ttc-header-desktop { display: none; }
          .ttc-header-mobile { display: flex; }
        }
        @media (max-width: 360px) {
          .ttc-mobile-title { display: none; }
        }
        @media (max-width: 700px) {
          .ttc-hero-grid { grid-template-columns: 1fr; gap: 24px; }
          .ttc-hero-h1 { font-size: 32px; }
          .ttc-hero-section { padding: 24px 14px 28px; }
          .ttc-hero-panel { padding: 20px 16px; }
          /* Products were feeling cramped on phones: the section, the panel,
             and each card were all adding their own left/right padding on
             top of each other, leaving very little width for the actual
             product photo. Cut down to a small edge margin (not zero — a
             sliver of space keeps photos from butting right against the
             phone's bezel) so products use close to the full screen width. */
          .ttc-shop-section { padding: 24px 6px 14px; }
          .ttc-shop-panel { padding: 14px 4px; }
          .ttc-product-card { padding: 6px; }
          .ttc-product-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
          .ttc-qv-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <style>{`
        @media (max-width: 700px) {
          .ttc-bg-scroll { background-attachment: scroll !important; }
        }
      `}</style>

      {/* Header */}
      <header
        style={{
          position: "sticky", top: 0, zIndex: 30,
          background: "rgba(251,246,240,0.9)", backdropFilter: "blur(6px)",
          borderBottom: `1px solid ${COLORS.bgSoft}`, padding: "10px 20px",
        }}
      >
        {/* ===== Desktop header (1024px and up) ===== */}
        <div className="ttc-header-desktop" style={{
          alignItems: "center", gap: 14, maxWidth: 1200, margin: "0 auto",
        }}>
          <Logo size={48} scale={1} />

          <div style={{ position: "relative" }}>
            <button
              onClick={() => setCategoryMenuOpen((o) => !o)}
              style={{
                display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
                border: `1.3px solid ${COLORS.navy}`, background: "transparent",
                color: COLORS.navy, borderRadius: 999, padding: "7px 15px",
                fontSize: 12.5, fontWeight: 700,
              }}
            >
              {activeCategory === "All" ? "Categories" : activeCategory}
              <ChevronDown size={14} style={{ transform: categoryMenuOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
            </button>
            {categoryMenuOpen && (
              <>
                <div onClick={() => setCategoryMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 34 }} />
                <div style={{
                  position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 35,
                  background: COLORS.cream, borderRadius: 14, boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                  padding: 8, minWidth: 200, maxHeight: 320, overflowY: "auto",
                }}>
                  {categories.map((cat) => (
                    <a
                      key={cat}
                      href={urlForCategory(cat)}
                      onClick={(e) => { e.preventDefault(); selectCategory(cat); }}
                      style={{
                        display: "block", width: "100%", textAlign: "left", whiteSpace: "nowrap",
                        border: "none", background: activeCategory === cat ? COLORS.bgSoft : "transparent",
                        color: COLORS.charcoal, borderRadius: 8, padding: "8px 12px",
                        fontSize: 13, fontWeight: activeCategory === cat ? 700 : 500,
                        textDecoration: "none", cursor: "pointer",
                      }}
                    >
                      {cat}
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 8 }} />

          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <a
              href="https://www.instagram.com/twisttanglecrochet/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              style={{ background: "none", border: "none", color: COLORS.navy, padding: 6, display: "flex", textDecoration: "none" }}
            >
              <Instagram size={18} />
            </a>
            <a
              href="https://www.facebook.com/twisttanlecrochet"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              style={{ background: "none", border: "none", color: COLORS.navy, padding: 6, display: "flex", textDecoration: "none" }}
            >
              <Facebook size={18} />
            </a>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              style={{ background: "none", border: "none", color: COLORS.navy, padding: 6, display: "flex", textDecoration: "none" }}
            >
              <MessageCircle size={18} />
            </a>
          </div>

          <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            {searchOpen ? (
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
                placeholder="Search..."
                style={{
                  width: 130, padding: "7px 10px", borderRadius: 999,
                  border: `1.3px solid ${COLORS.navy}`, fontSize: 12.5, background: COLORS.cream,
                }}
              />
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                style={{ background: "none", border: "none", color: COLORS.navy, display: "flex" }}
                aria-label="Search"
              >
                <Search size={19} />
              </button>
            )}
          </div>

          <button
            onClick={() => setDrawerOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: 8, background: COLORS.navy,
              color: COLORS.cream, border: "none", borderRadius: 999, padding: "9px 15px",
              fontSize: 13, fontWeight: 700, flexShrink: 0,
            }}
          >
            <ShoppingBag size={16} />
            Cart {cartCount > 0 && `(${cartCount})`}
          </button>
        </div>

        {/* ===== Mobile / tablet header (below 1024px) ===== */}
        <div className="ttc-header-mobile" style={{ alignItems: "center", gap: 10, maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setCategoryMenuOpen((o) => !o)}
              style={{
                display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
                background: "none", border: "none", color: COLORS.navy,
                fontSize: 13, fontWeight: 600, padding: "4px 2px", flexShrink: 0,
              }}
            >
              <Menu size={19} />
              Menu
            </button>
            {categoryMenuOpen && (
              <>
                <div onClick={() => setCategoryMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 34 }} />
                <div style={{
                  position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 35,
                  background: COLORS.cream, borderRadius: 14, boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                  padding: 8, minWidth: 190, maxHeight: 300, overflowY: "auto",
                }}>
                  {categories.map((cat) => (
                    <a
                      key={cat}
                      href={urlForCategory(cat)}
                      onClick={(e) => { e.preventDefault(); selectCategory(cat); }}
                      style={{
                        display: "block", width: "100%", textAlign: "left", whiteSpace: "nowrap",
                        border: "none", background: activeCategory === cat ? COLORS.bgSoft : "transparent",
                        color: COLORS.charcoal, borderRadius: 8, padding: "8px 12px",
                        fontSize: 13, fontWeight: activeCategory === cat ? 700 : 500,
                        textDecoration: "none", cursor: "pointer",
                      }}
                    >
                      {cat}
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <img src={LOGO_SRC} alt="Twist & Tangle Crochet logo" style={{ height: 30, width: "auto", objectFit: "contain" }} />
            <div className="ttc-mobile-title" style={{ lineHeight: 1.1 }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 11, color: COLORS.navy }}>Twist &amp; Tangle</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 11, color: COLORS.navy }}>Crochet (TTC)</div>
            </div>
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
            {searchOpen ? (
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
                placeholder="Search..."
                style={{
                  width: 110, padding: "6px 10px", borderRadius: 999,
                  border: `1.2px solid ${COLORS.navy}`, fontSize: 12, background: COLORS.cream,
                }}
              />
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                style={{ background: "none", border: "none", color: COLORS.navy, padding: 2, display: "flex" }}
                aria-label="Search"
              >
                <Search size={19} />
              </button>
            )}

            <button
              onClick={() => setDrawerOpen(true)}
              style={{ position: "relative", background: "none", border: "none", color: COLORS.navy, padding: 2, display: "flex" }}
              aria-label="Cart"
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span style={{
                  position: "absolute", top: -6, right: -7,
                  background: COLORS.maroon, color: "#fff", fontSize: 10, fontWeight: 700,
                  borderRadius: "50%", width: 16, height: 16,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {routeNotice && (
        <div style={{
          maxWidth: 1000, margin: "16px auto 0", padding: "0 20px",
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
            background: COLORS.blushSoft, color: COLORS.maroonDark, borderRadius: 12,
            padding: "10px 16px", fontSize: 13,
          }}>
            <span>
              {routeNotice.type === "product"
                ? "That product isn't available anymore — but here's the current collection."
                : "That category doesn't exist — showing everything instead."}
            </span>
            <button
              onClick={() => setRouteNotice(null)}
              aria-label="Dismiss"
              style={{ background: "none", border: "none", color: COLORS.maroonDark, flexShrink: 0, display: "flex" }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="ttc-hero-section" style={{ maxWidth: 1000, margin: "0 auto", position: "relative" }}>
        <div className="ttc-hero-panel" style={{
          background: "rgba(251,246,240,0.82)", backdropFilter: "blur(4px)",
          borderRadius: 24,
        }}>
          <div style={{ margin: "0 auto 34px" }}>
            <HeartLineDivider />
          </div>
          <div className="ttc-hero-grid">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                <LeafSprig side="left" />
                <span style={{ fontFamily: "'Caveat', cursive", fontSize: 26, color: COLORS.charcoal }}>
                  Don't Forget to Fall in Love with
                </span>
                <LeafSprig side="right" />
              </div>
              <h1
                className="ttc-hero-h1"
                style={{
                  fontFamily: "'Fraunces', serif", fontWeight: 600,
                  lineHeight: 1.08, color: COLORS.maroonDark, margin: "0 0 16px",
                }}
              >
                Handmade with love,
                <br />
                stitched just for you.
              </h1>
              <p style={{ fontSize: 16, lineHeight: 1.6, color: "#5A4E46", maxWidth: 420, marginBottom: 26 }}>
                Every piece from Twist &amp; Tangle Crochet is made by hand in small batches —
                no two are quite the same.
              </p>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <a href="#shop" style={{
                  background: COLORS.navy, color: COLORS.cream, textDecoration: "none",
                  padding: "13px 24px", borderRadius: 999, fontWeight: 700, fontSize: 14,
                }}>
                  Shop the collection
                </a>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'Caveat', cursive", fontSize: 22, color: COLORS.charcoal }}>
                  love in every loop <HandDrawnHeart size={18} />
                </span>
              </div>
            </div>
            <div style={{ position: "relative" }}>
              <Slideshow slides={HERO_SLIDES} />
            </div>
          </div>
        </div>
      </section>

      <StitchDivider />

      {/* Shop grid */}
      <section id="shop" className="ttc-shop-section" style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div className="ttc-shop-panel" style={{ background: "rgba(251,246,240,0.82)", backdropFilter: "blur(4px)", borderRadius: 24 }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 28, color: COLORS.maroonDark, marginBottom: 22 }}>
            The collection
          </h2>

          <div className="ttc-product-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 22 }}>
            {visibleProducts.length === 0 ? (
              <p style={{ color: "#7A6E64", fontSize: 14, gridColumn: "1/-1" }}>No items match your search.</p>
            ) : visibleProducts.map((p) => (
              <div key={p.id} className="ttc-product-card" style={{ background: COLORS.cream, borderRadius: 18 }}>
                <div onClick={p.variants ? undefined : () => openQuickView(p.id)} style={{ cursor: p.variants ? "default" : "pointer" }}>
                  {p.variants ? (
                    <VariantPicker variants={p.variants} name={p.name} onImageClick={() => openQuickView(p.id)} />
                  ) : p.photos ? (
                    <ProductPhotoGallery photos={p.photos} name={p.name} />
                  ) : (
                    <ProductSwatch colors={p.swatch} real={p.real} />
                  )}
                </div>
                <div style={{ marginTop: 12 }}>
                  {p.real && (
                    <span style={{
                      display: "inline-block", marginBottom: 8,
                      fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase",
                      color: COLORS.maroon, border: `1px solid ${COLORS.maroon}`,
                      borderRadius: 999, padding: "3px 9px",
                    }}>
                      {p.tag}
                    </span>
                  )}
                  <a
                    href={urlForProduct(p.id)}
                    onClick={(e) => { e.preventDefault(); openQuickView(p.id); }}
                    style={{
                      display: "block", fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 16,
                      color: COLORS.charcoal, cursor: "pointer", textDecoration: "none",
                    }}
                  >
                    {p.name}
                  </a>
                  <RatingSummary reviews={reviewsByProduct[p.id]} />
                  <div style={{ fontSize: 13, color: "#7A6E64", margin: "6px 0 10px", lineHeight: 1.4 }}>
                    {p.desc}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 17, color: COLORS.maroon }}>
                      Rs{p.price}
                    </span>
                    <button
                      onClick={() => addToCart(p.id)}
                      style={{
                        background: "transparent", color: COLORS.navy, border: `1.3px solid ${COLORS.navy}`,
                        borderRadius: 999, padding: "8px 14px", fontSize: 12, fontWeight: 700,
                        display: "flex", alignItems: "center", gap: 6,
                      }}
                    >
                      <Plus size={13} /> Add
                    </button>
                  </div>
                  <button
                    onClick={() => buyNow(p.id)}
                    style={{
                      width: "100%", background: COLORS.navy, color: COLORS.cream, border: "none",
                      borderRadius: 999, padding: "9px 0", fontSize: 12.5, fontWeight: 700,
                    }}
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {homepageReviews.length > 0 && (
        <>
          <StitchDivider />
          {/* What customers say — the most recent approved reviews across every
              product. Hidden entirely (not shown as an empty section) until
              at least one review has been approved. */}
          <section style={{ padding: "20px 20px 20px", maxWidth: 1000, margin: "0 auto" }}>
            <div className="ttc-shop-panel" style={{ background: "rgba(251,246,240,0.82)", backdropFilter: "blur(4px)", borderRadius: 24 }}>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 28, color: COLORS.maroonDark, marginBottom: 22 }}>
                What customers say
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 18 }}>
                {homepageReviews.map((r) => (
                  <div key={r.id} style={{ background: COLORS.cream, borderRadius: 16, padding: 16 }}>
                    <StarRating rating={r.rating} />
                    <p style={{ fontSize: 13, color: "#5A4E46", lineHeight: 1.5, margin: "8px 0" }}>{r.comment}</p>
                    <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.charcoal }}>{r.name}</div>
                    <div style={{ fontSize: 11.5, color: "#7A6E64" }}>on {r.productName}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      <StitchDivider />

      {/* Footer */}
      <footer style={{ padding: "36px 20px 48px", maxWidth: 1000, margin: "0 auto", textAlign: "center", position: "relative" }}>
        <div style={{ background: "rgba(251,246,240,0.82)", backdropFilter: "blur(4px)", borderRadius: 24, padding: "30px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontFamily: "'Caveat', cursive", fontSize: 24, color: COLORS.charcoal }}>
              Handmade with Love
            </span>
            <HandDrawnHeart size={18} />
          </div>
          <div style={{ fontSize: 13, color: COLORS.charcoal, marginBottom: 22 }}>Love in Every Loop</div>

          <div style={{ marginBottom: 22 }}>
            <HeartLineDivider />
          </div>

          <div id="contact" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 18 }}>
            <LeafSprig side="left" />
            <div style={{
              background: COLORS.navy, color: COLORS.cream,
              fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
              borderRadius: 999, padding: "8px 22px",
            }}>
              Contact Us
            </div>
            <LeafSprig side="right" />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", maxWidth: 320, margin: "0 auto 22px" }}>
            <a href="https://www.instagram.com/twisttanglecrochet/" target="_blank" rel="noopener noreferrer"
               style={{ display: "flex", alignItems: "center", gap: 10, color: COLORS.charcoal, background: "none", border: "none", fontSize: 14, textDecoration: "none" }}>
              <span style={{ background: COLORS.navy, color: "#fff", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Instagram size={14} />
              </span>
              twisttanglecrochet
            </a>
            <a href="https://www.facebook.com/twisttanlecrochet" target="_blank" rel="noopener noreferrer"
               style={{ display: "flex", alignItems: "center", gap: 10, color: COLORS.charcoal, background: "none", border: "none", fontSize: 14, textDecoration: "none" }}>
              <span style={{ background: COLORS.navy, color: "#fff", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Facebook size={14} />
              </span>
              twisttanglecrochet
            </a>
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer"
               style={{ display: "flex", alignItems: "center", gap: 10, color: COLORS.charcoal, background: "none", border: "none", fontSize: 14, textDecoration: "none" }}>
              <span style={{ background: COLORS.navy, color: "#fff", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MessageCircle size={14} />
              </span>
              0302 7609899
            </a>
          </div>

          <div style={{ fontSize: 12, color: "#7A6E64", marginBottom: 22 }}>Lahore, Punjab, Pakistan</div>

          <div style={{ borderTop: `1px solid ${COLORS.bgSoft}`, paddingTop: 22, display: "flex", justifyContent: "center", gap: 30 }}>
            {[
              { emoji: "🧶", label: "Handmade", sub: "with Care" },
              { emoji: "❤️", label: "Unique", sub: "and Beautiful" },
              { emoji: "🎁", label: "Perfect", sub: "for Every Occasion" },
            ].map((b) => (
              <div key={b.label} style={{ maxWidth: 100 }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{b.emoji}</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 12, color: COLORS.navy }}>{b.label}</div>
                <div style={{ fontSize: 10.5, color: "#7A6E64" }}>{b.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </footer>

      {/* Cart drawer */}
      {drawerOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 40, display: "flex", justifyContent: "flex-end" }}>
          <div
            onClick={() => setDrawerOpen(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(43,36,32,0.4)" }}
          />
          <div style={{
            position: "relative", width: 340, maxWidth: "88vw", background: COLORS.cream,
            height: "100%", padding: 22, display: "flex", flexDirection: "column",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 20, color: COLORS.maroonDark }}>
                Your cart
              </span>
              <button onClick={() => setDrawerOpen(false)} style={{ background: "none", border: "none", color: COLORS.charcoal }}>
                <X size={20} />
              </button>
            </div>

            {cartItems.length === 0 ? (
              <p style={{ color: "#7A6E64", fontSize: 14 }}>Your cart is empty — add a piece from the collection.</p>
            ) : (
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
                {cartItems.map((i) => (
                  <div key={i.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ width: 50, height: 50, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                      <ProductSwatch colors={i.swatch} real={i.real} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{i.name}</div>
                      <div style={{ fontSize: 12, color: COLORS.maroon }}>Rs{i.price}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button onClick={() => changeQty(i.id, -1)} style={{ background: COLORS.bgSoft, border: "none", borderRadius: 6, width: 22, height: 22 }}>
                        <Minus size={12} />
                      </button>
                      <span style={{ fontSize: 13, width: 16, textAlign: "center" }}>{i.qty}</span>
                      <button onClick={() => changeQty(i.id, 1)} style={{ background: COLORS.bgSoft, border: "none", borderRadius: 6, width: 22, height: 22 }}>
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ borderTop: `1px solid ${COLORS.bgSoft}`, paddingTop: 14, marginTop: 14 }}>
              {cartItems.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  {appliedPromo ? (
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: COLORS.bgSoft, borderRadius: 10, padding: "8px 12px", fontSize: 13,
                    }}>
                      <span style={{ color: COLORS.maroon, fontWeight: 700 }}>
                        {appliedPromo} applied
                      </span>
                      <button onClick={removePromo} style={{ background: "none", border: "none", color: COLORS.charcoal }}>
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          value={promoInput}
                          onChange={(e) => { setPromoInput(e.target.value); setPromoError(""); }}
                          placeholder="Promo code"
                          style={{
                            flex: 1, padding: "8px 12px", borderRadius: 10,
                            border: `1px solid ${COLORS.bgSoft}`, fontSize: 13, background: COLORS.bg,
                          }}
                        />
                        <button
                          onClick={applyPromo}
                          style={{
                            background: COLORS.navy, color: COLORS.cream, border: "none",
                            borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 700,
                          }}
                        >
                          Apply
                        </button>
                      </div>
                      {promoError && (
                        <div style={{ fontSize: 11.5, color: "#C0392B", marginTop: 6 }}>{promoError}</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#7A6E64", marginBottom: 4 }}>
                <span>Subtotal</span>
                <span>Rs{subtotal}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: COLORS.maroon, marginBottom: 4 }}>
                  <span>Discount</span>
                  <span>-Rs{discount}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
                <span>Total</span>
                <span>Rs{total}</span>
              </div>
              <button
                disabled={cartItems.length === 0}
                onClick={() => { setDirectBuyItem(null); setDrawerOpen(false); setCheckoutOpen(true); }}
                style={{
                  width: "100%", background: cartItems.length ? COLORS.navy : "#C9BEB4",
                  color: COLORS.cream, border: "none", borderRadius: 999, padding: "12px 0",
                  fontSize: 14, fontWeight: 700,
                }}
              >
                Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick view modal */}
      {quickViewId && (() => {
        const p = products.find((pr) => pr.id === quickViewId);
        if (!p) return null;
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 55, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div onClick={() => closeQuickView()} style={{ position: "absolute", inset: 0, background: "rgba(43,36,32,0.55)" }} />
            <div style={{
              position: "relative", background: COLORS.cream, borderRadius: 20,
              width: 720, maxWidth: "100%", maxHeight: "88vh", overflowY: "auto",
            }}>
              <button
                onClick={() => closeQuickView()}
                style={{
                  position: "absolute", top: 14, right: 14, zIndex: 2,
                  background: "rgba(251,246,240,0.9)", border: "none", borderRadius: "50%",
                  width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                  color: COLORS.charcoal,
                }}
              >
                <X size={18} />
              </button>

              <div className="ttc-qv-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
                <div style={{ padding: 20 }}>
                  {p.variants ? (
                    <VariantPicker variants={p.variants} name={p.name} />
                  ) : p.photos ? (
                    <ProductPhotoGallery photos={p.photos} name={p.name} />
                  ) : (
                    <ProductSwatch colors={p.swatch} real={p.real} />
                  )}
                </div>

                <div style={{ padding: "24px 24px 28px" }}>
                  {p.real && (
                    <span style={{
                      display: "inline-block", marginBottom: 10,
                      fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase",
                      color: COLORS.maroon, border: `1px solid ${COLORS.maroon}`,
                      borderRadius: 999, padding: "3px 9px",
                    }}>
                      {p.tag}
                    </span>
                  )}
                  <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 22, color: COLORS.maroonDark, margin: "0 0 8px" }}>
                    {p.name}
                  </h3>
                  <RatingSummary reviews={reviewsByProduct[p.id]} style={{ marginBottom: 10 }} />
                  <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 21, color: COLORS.maroon, marginBottom: 14 }}>
                    Rs{p.price}
                  </div>
                  <p style={{ fontSize: 13.5, color: "#5A4E46", lineHeight: 1.6, marginBottom: 20 }}>
                    {p.desc}
                  </p>

                  {p.sizes && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.charcoal, marginBottom: 8 }}>
                        Size: <span style={{ fontWeight: 500, color: "#7A6E64" }}>{quickViewSize}</span>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {p.sizes.map((sz) => (
                          <button
                            key={sz}
                            onClick={() => setQuickViewSize(sz)}
                            style={{
                              border: `1.3px solid ${quickViewSize === sz ? COLORS.navy : COLORS.bgSoft}`,
                              background: quickViewSize === sz ? COLORS.navy : "transparent",
                              color: quickViewSize === sz ? COLORS.cream : COLORS.charcoal,
                              borderRadius: 999, padding: "7px 16px", fontSize: 12.5, fontWeight: 600,
                            }}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ marginBottom: 22 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.charcoal, marginBottom: 8 }}>Quantity</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <button
                        onClick={() => setQuickViewQty((q) => Math.max(1, q - 1))}
                        style={{ background: COLORS.bgSoft, border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <Minus size={14} />
                      </button>
                      <span style={{ fontSize: 15, fontWeight: 700, minWidth: 20, textAlign: "center" }}>{quickViewQty}</span>
                      <button
                        onClick={() => setQuickViewQty((q) => q + 1)}
                        style={{ background: COLORS.bgSoft, border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <button
                      onClick={() => { addToCart(p.id, quickViewQty); closeQuickView(); setDrawerOpen(true); }}
                      style={{
                        width: "100%", background: "transparent", color: COLORS.navy,
                        border: `1.5px solid ${COLORS.navy}`, borderRadius: 999, padding: "12px 0",
                        fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      }}
                    >
                      <ShoppingBag size={16} /> Add to Cart
                    </button>
                    <button
                      onClick={() => { buyNow(p.id, quickViewQty); closeQuickView(); }}
                      style={{
                        width: "100%", background: COLORS.navy, color: COLORS.cream,
                        border: "none", borderRadius: 999, padding: "12px 0",
                        fontSize: 14, fontWeight: 700,
                      }}
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ padding: "0 24px 26px" }}>
                <ReviewsSection productId={p.id} productName={p.name} reviews={reviewsByProduct[p.id] || []} />
              </div>
            </div>
          </div>
        );
      })()}

      {/* Checkout modal */}
      {checkoutOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={closeCheckout} style={{ position: "absolute", inset: 0, background: "rgba(43,36,32,0.5)" }} />
          <div style={{ position: "relative", background: COLORS.cream, borderRadius: 18, padding: 26, width: 380, maxWidth: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 19, color: COLORS.maroonDark }}>
                Complete your order
              </span>
              <button onClick={closeCheckout} style={{ background: "none", border: "none", color: COLORS.charcoal }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: 12.5, color: "#7A6E64", marginBottom: 16, lineHeight: 1.5 }}>
              Fill in your details — this sends your order straight to TTC on WhatsApp to confirm and arrange payment.
            </p>
            {["name", "phone", "address"].map((field) => (
              <input
                key={field}
                placeholder={field === "name" ? "Full name" : field === "phone" ? "Phone number" : "Delivery address"}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                style={{
                  width: "100%", padding: "10px 12px", marginBottom: 10, borderRadius: 10,
                  border: `1px solid ${COLORS.bgSoft}`, fontSize: 13, background: COLORS.bg,
                }}
              />
            ))}
            <textarea
              placeholder="Notes (colour preference, gift message, etc.) — optional"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              style={{
                width: "100%", padding: "10px 12px", marginBottom: 14, borderRadius: 10,
                border: `1px solid ${COLORS.bgSoft}`, fontSize: 13, background: COLORS.bg, resize: "none",
              }}
            />
            {checkoutDiscount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: COLORS.maroon, marginBottom: 4 }}>
                <span>Discount ({appliedPromo})</span>
                <span>-Rs{checkoutDiscount}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
              <span>Total</span>
              <span>Rs{checkoutTotal}</span>
            </div>
            <div style={{ fontSize: 11.5, color: "#C0392B", textAlign: "right", marginBottom: 14 }}>
              * Delivery charges are separate
            </div>
            <a
              href={canSubmit ? buildWhatsAppLink() : undefined}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => { if (!canSubmit) e.preventDefault(); }}
              aria-disabled={!canSubmit}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                width: "100%", background: canSubmit ? "#25D366" : "#C9BEB4", color: "#fff",
                border: "none", borderRadius: 999, padding: "12px 0", fontSize: 14, fontWeight: 700,
                textDecoration: "none", cursor: canSubmit ? "pointer" : "default", boxSizing: "border-box",
              }}
            >
              <MessageCircle size={16} /> Send order via WhatsApp
            </a>
            <a
              href={canSubmit ? "https://ig.me/m/twisttanglecrochet" : undefined}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (!canSubmit) { e.preventDefault(); return; }
                copyOrderTextForInstagram();
              }}
              aria-disabled={!canSubmit}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                width: "100%", background: canSubmit ? COLORS.navy : "#C9BEB4", color: "#fff",
                border: "none", borderRadius: 999, padding: "12px 0", fontSize: 14, fontWeight: 700,
                marginTop: 10, textDecoration: "none", cursor: canSubmit ? "pointer" : "default", boxSizing: "border-box",
              }}
            >
              <Instagram size={16} /> Order via Instagram DM
            </a>
            {instaCopied && (
              <div style={{ fontSize: 11.5, color: COLORS.maroon, marginTop: 8, textAlign: "center" }}>
                Order details copied — paste them into the Instagram chat.
              </div>
            )}
            {!canSubmit && (
              <div style={{ fontSize: 11, color: "#A69A8E", marginTop: 8, textAlign: "center" }}>
                Fill in name, phone, and address to continue.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
