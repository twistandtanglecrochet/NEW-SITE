import React, { useState, useMemo, useEffect, useRef, useContext, lazy, Suspense } from "react";
import { ShoppingBag, Heart, Instagram, MessageCircle, Plus, Minus, X, Facebook, Search, ChevronDown, ChevronLeft, ChevronRight, Menu, Star, ArrowUp, CheckCircle2, Clock, Shuffle, Package } from "lucide-react";
import { watch, watchApi, loadOnce } from "./lib/live";
import { collection, doc, query, orderBy, where, addDoc, setDoc, serverTimestamp, runTransaction } from "firebase/firestore";
import { db } from "./firebase";
import { COLORS } from "./data/colors.js";
import { LOGO_SRC, BG_SRC } from "./data/siteImages.js";
import { categorySlug } from "./data/slug.js";
import { setMetaEvents, metaTrack } from "./lib/metaEvents.js";
import { uploadReviewPhoto, PHOTO_MAX_MB } from "./lib/reviewPhoto.js";
import { promoHash } from "./lib/promoHash.js";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, SHOW_DIRECT_ORDER_LINKS, PAYMENT_METHODS, DELIVERY_LABEL } from "./data/siteConfig.js";
import {
  SEED_PRODUCTS,
  POUCH_FRONT_SRC,
  SUNFLOWER_1_SRC,
  JERSEY_KEYCHAIN_1_SRC,
  EARRING_EAR1_SRC,
} from "./data/products.js";
import { VariantPicker, ProductPhotoGallery, ProductSwatch, StarRating, RatingSummary } from "./components/shared.jsx";
import ProductCard, { saveText } from "./components/ProductCard.jsx";
import { AnnouncementBars, AdBanners, AdPopup, safeLink, liveAds } from "./components/Marketing.jsx";
import Reveal from "./components/Reveal.jsx";
import HeroHeading from "./components/HeroHeading.jsx";
import { FreeDeliveryBar, PriceFilter, LangToggle, InstallButton, useInstallPrompt } from "./components/UiBits.jsx";
import { SpeedContext, Img } from "./lib/cloudinary.jsx";
import { useSiteSettings, useI18n, useIdList, useExtraTranslations } from "./hooks/useSiteSettings.js";
import { SECTION_IDS, SETTINGS_CACHE_KEY, normalizedOrder, readCachedSettings } from "./data/siteSettings.js";
import { applyManifest, applySafeArea, applyServiceWorker } from "./lib/pwa.js";
import { PK_CITIES, findCity, strictPhone, strictName, strictAddress } from "./lib/pkCities.js";

// "Look & brand" (Admin → Website): colours and logo are changed in place while the switch is on.
const ORIG_COLORS = { ...COLORS };
let CURRENT_LOGO = LOGO_SRC;
const isHex = (v) => /^#[0-9a-f]{6}$/i.test(String(v || "").trim());
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
  return "#" + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => f(c).toString(16).padStart(2, "0")).join("");
}
function applyBrandColors(brand) {
  Object.assign(COLORS, ORIG_COLORS);
  CURRENT_LOGO = LOGO_SRC;
  if (!brand || !brand.on) return;
  const c = brand.colors || {};
  if (isHex(c.main)) { COLORS.maroon = c.main; COLORS.maroonDark = shade(c.main, -0.4); }
  if (isHex(c.second)) { COLORS.navy = c.second; COLORS.navyDeep = shade(c.second, -0.3); }
  if (isHex(c.accent)) COLORS.gold = c.accent;
  if (isHex(c.bg)) { COLORS.bg = c.bg; COLORS.bgSoft = shade(c.bg, -0.05); }
  if (/^https?:\/\//i.test(String(brand.logo || ""))) CURRENT_LOGO = brand.logo.trim();
}
const FONT_PAIRS = {
  classic: ["Playfair Display", "Poppins", "family=Playfair+Display:wght@500;600;700&family=Poppins:wght@400;500;600;700"],
  modern: ["DM Serif Display", "Inter", "family=DM+Serif+Display&family=Inter:wght@400;500;600;700"],
  soft: ["Lora", "Nunito", "family=Lora:wght@500;600;700&family=Nunito:wght@400;600;700"],
};

// Parts of the shop that are only needed when the matching switch is on in
// the admin panel — loaded on demand so the main page stays light.
const BentoStats = lazy(() => import("./components/BentoStats.jsx"));
const CategoryTiles = lazy(() => import("./components/CategoryTiles.jsx"));
const VisitStore = lazy(() => import("./components/VisitStore.jsx"));
const RecentStrip = lazy(() => import("./components/RecentStrip.jsx"));
const WishlistPanel = lazy(() => import("./components/WishlistPanel.jsx"));
const MaintenancePage = lazy(() => import("./components/MaintenancePage.jsx"));
const GuidePage = lazy(() => import("./components/OrderGuide.jsx").then((m) => ({ default: m.GuidePage })));
const GuideBar = lazy(() => import("./components/OrderGuide.jsx").then((m) => ({ default: m.GuideBar })));
const ProductTabs = lazy(() => import("./components/ProductInfo.jsx").then((m) => ({ default: m.ProductTabs })));
const ProductMeta = lazy(() => import("./components/ProductInfo.jsx").then((m) => ({ default: m.ProductMeta })));
const MyOrders = lazy(() => import("./components/MyOrders.jsx"));
import { rememberOrder } from "./components/MyOrders.jsx";
const SaleTimer = lazy(() => import("./components/Extras.jsx").then((m) => ({ default: m.SaleTimer })));
const SizeGuide = lazy(() => import("./components/Extras.jsx").then((m) => ({ default: m.SizeGuide })));
const PolicyPage = lazy(() => import("./components/Extras.jsx").then((m) => ({ default: m.PolicyPage })));
const FaqPage = lazy(() => import("./components/Extras.jsx").then((m) => ({ default: m.FaqPage })));
const ComboStrip = lazy(() => import("./components/Extras.jsx").then((m) => ({ default: m.ComboStrip })));
const InstaStrip = lazy(() => import("./components/Extras.jsx").then((m) => ({ default: m.InstaStrip })));
const GamesSection = lazy(() => import("./components/Games.jsx").then((m) => ({ default: m.GamesSection })));
const GamesModal = lazy(() => import("./components/Games.jsx").then((m) => ({ default: m.GamesModal })));
const ReviewDeck = lazy(() => import("./components/Extras.jsx").then((m) => ({ default: m.ReviewDeck })));
const ReviewWriter = lazy(() => import("./components/Extras.jsx").then((m) => ({ default: m.ReviewWriter })));
const CartSuggest = lazy(() => import("./components/Extras.jsx").then((m) => ({ default: m.CartSuggest })));
const SearchSuggest = lazy(() => import("./components/SearchSuggest.jsx"));
const SiteFooter = lazy(() => import("./components/SiteFooter.jsx"));
const TrackOrder = lazy(() => import("./components/TrackOrder.jsx"));

const WHATSAPP_NUMBER = "923027609899";

// ---- Website orders ----
// Readable order numbers like TTC-K7F3Q. Leaves out 0/O and 1/I so they
// can't be confused when read out over the phone.
const ORDER_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function makeOrderNo() {
  let out = "";
  const pick = new Uint32Array(5);
  try { crypto.getRandomValues(pick); } catch (e) { for (let i = 0; i < 5; i++) pick[i] = Math.floor(Math.random() * 1e9); }
  for (let i = 0; i < 5; i++) out += ORDER_CODE_CHARS[pick[i] % ORDER_CODE_CHARS.length];
  return "TTC-" + out;
}
// Plain numeric order numbers (2000, 2001, …) from a counter in Firestore
// (Admin → Order & checkout). Falls back to the TTC-XXXXX style if the counter can't be reached.
async function nextOrderNo(cfg) {
  if (!cfg || !cfg.numeric) return makeOrderNo();
  if (typeof navigator !== "undefined" && navigator.onLine === false) return makeOrderNo();
  try {
    const ref = doc(db, "config", "orderCounter");
    const start = Math.max(1, Math.floor(Number(cfg.start) || 2000));
    const n = await withTimeout(runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const last = snap.exists() ? Number(snap.data().n) || 0 : 0;
      const next = Math.max(start, last + 1);
      tx.set(ref, { n: next });
      return next;
    }), 8000);
    return String(n);
  } catch (e) { return makeOrderNo(); }
}
// Pakistani mobile numbers: 0300 1234567, 0300-1234567, +92 300 1234567, 92300…
function isValidPkMobile(phone) {
  const d = String(phone || "").replace(/[\s\-().]/g, "");
  return /^(?:\+92|0092|92|0)3\d{9}$/.test(d);
}
// One website order per browser every 30 seconds (simple spam guard). If
// storage is blocked, the guard is just skipped — it never stops the order.
const LAST_ORDER_KEY = "ttc_last_website_order_at";
const ORDER_COOLDOWN_MS = 30000;
function readLastOrderAt() {
  try { return Number(localStorage.getItem(LAST_ORDER_KEY)) || 0; } catch (e) { return 0; }
}
function writeLastOrderAt(ms) {
  try { localStorage.setItem(LAST_ORDER_KEY, String(ms)); } catch (e) {}
}
function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

// Promo codes: type "percent" (e.g. 10 = 10% off) or "flat" (fixed Rs amount off).
// These are only a fallback now — the live list is managed from the admin
// panel ("Promo codes") and read from Firestore (config/promoCodes). Until
// that's been saved once, these defaults are used.
const PROMO_CODES = {
  "TTC10": { type: "percent", value: 10 },
  "WELCOME50": { type: "flat", value: 50 },
};

// The one photo used to represent a cart/review item — the product's first
// plain photo, or its first variant's photo for variant-based products.
function mainPhotoFor(item) {
  if (!item) return null;
  if (item.photos && item.photos[0]) return item.photos[0];
  if (item.variants && item.variants[0] && item.variants[0].photo) return item.variants[0].photo;
  return null;
}

function StitchDivider() {
  return (
    <svg viewBox="0 0 400 20" preserveAspectRatio="none" style={{ width: "100%", height: "var(--ttc-divider, 16px)", display: "block" }}>
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
          src={CURRENT_LOGO}
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


// The reviews block shown inside the quick view / product detail: the
// existing approved reviews for this one product, plus a form to leave a
// new one. New reviews are NOT shown immediately — they're saved with
// approved:false and only appear once approved from the admin portal, so a
// spam or inappropriate submission never reaches other customers.
function ReviewsSection({ productId, productName, reviews, photosOn }) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [photoFile, setPhotoFile] = useState(null);

  function pickPhoto(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) { setPhotoFile(null); return; }
    if (!/^image\//.test(f.type) || f.size > PHOTO_MAX_MB * 1024 * 1024) { setError("Please choose a photo (JPG or PNG) under " + PHOTO_MAX_MB + " MB."); e.target.value = ""; setPhotoFile(null); return; }
    setError(""); setPhotoFile(f);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !comment.trim() || rating < 1) {
      setError("Please add your name, a star rating, and a short comment.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      let photo = "";
      if (photosOn && photoFile) {
        try { photo = await uploadReviewPhoto(photoFile); }
        catch (pe) { setError("The photo couldn't be uploaded. Please try again, or remove the photo and submit without it."); setSubmitting(false); return; }
      }
      await addDoc(collection(db, "reviews"), {
        productId,
        productName,
        name: name.trim(),
        rating,
        comment: comment.trim(),
        ...(photo ? { photo } : {}),
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
              {/^https?:\/\//i.test(String(r.photo || "")) && (
                <a href={r.photo} target="_blank" rel="noopener noreferrer" aria-label="Open the photo of this review"><img src={r.photo} alt={"Photo shared by " + r.name} loading="lazy" style={{ marginTop: 8, maxWidth: "100%", maxHeight: 180, borderRadius: 10, display: "block", objectFit: "cover" }} /></a>
              )}
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
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: "100%", padding: "9px 12px", marginBottom: 8, borderRadius: 10,
              border: `1px solid ${COLORS.bgSoft}`, fontSize: 13, background: COLORS.bg,
            }}
          />
          <textarea
            placeholder="What did you think?"
            maxLength={1000}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            style={{
              width: "100%", padding: "9px 12px", marginBottom: 8, borderRadius: 10,
              border: `1px solid ${COLORS.bgSoft}`, fontSize: 13, background: COLORS.bg,
              resize: "vertical", fontFamily: "inherit",
            }}
          />
          {photosOn && (
            <label style={{ display: "block", fontSize: 12.5, color: COLORS.charcoal, marginBottom: 8 }}>
              <span style={{ fontWeight: 700 }}>Add a photo of your piece (optional)</span>
              <input type="file" accept="image/*" onChange={pickPhoto} style={{ display: "block", marginTop: 6, fontSize: 12.5, maxWidth: "100%" }} />
              {photoFile && <span style={{ color: "#7A6E64" }}>Selected: {photoFile.name}</span>}
            </label>
          )}
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

const slideCss = `
.ttc-sl { position: relative; width: 100%; aspect-ratio: 4/5; border-radius: var(--ttc-photo-radius, 14px); overflow: hidden; background: #fff; }
.ttc-sl-item { position: absolute; inset: 0; opacity: 0; pointer-events: none; transition: opacity .8s ease, transform .8s cubic-bezier(.22,.61,.36,1); }
.ttc-sl-item.on { opacity: 1; pointer-events: auto; transform: none; }
.ttc-sl.fx-slide .ttc-sl-item { transform: translateX(100%); opacity: 1; }
.ttc-sl.fx-slide .ttc-sl-item.out { transform: translateX(-100%); }
.ttc-sl.fx-zoom .ttc-sl-item { transform: scale(1.12); transition: opacity 1s ease, transform 3.2s ease-out; }
.ttc-sl.fx-zoom .ttc-sl-item.on { transform: scale(1); }
@media (prefers-reduced-motion: reduce) { .ttc-sl-item { transition: none !important; } }
`;

// `fx` is null for the original slideshow; "slide" | "fade" | "zoom" for the
// admin-managed carousel (Admin → Marketing → Homepage carousel).
function Slideshow({ slides, fx, speed, autoplay = true, onOpen }) {
  const bigDots = !!useContext(SpeedContext).touch; // Admin → Speed & access: bigger tap area for the little dots
  const [index, setIndex] = useState(0);
  const [prev, setPrev] = useState(-1);
  const ms = fx ? Math.max(1200, Number(speed) || 2500) : 2500;
  const reduce = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (fx && (!autoplay || reduce)) return undefined;
    const t = setInterval(() => setIndex((i) => { setPrev(i); return (i + 1) % slides.length; }), ms);
    return () => clearInterval(t);
  }, [slides.length, ms, fx, autoplay, reduce]);

  const go = (delta) => setIndex((i) => { setPrev(i); return (i + delta + slides.length) % slides.length; });
  const cur = index % slides.length;
  const dotsAndArrows = (
    <>
      <button
        onClick={() => go(-1)}
        aria-label="Previous slide"
        style={{
          position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", zIndex: 3,
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
          position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", zIndex: 3,
          background: "rgba(251,246,240,0.85)", border: "none", borderRadius: "50%",
          width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
          color: COLORS.navy,
        }}
      >
        <ChevronRight size={16} />
      </button>
      <div style={{ position: "absolute", bottom: bigDots ? 1 : 10, left: 0, right: 0, display: "flex", justifyContent: "center", gap: bigDots ? 0 : 6, zIndex: 3 }}>
        {slides.map((_, i) => bigDots ? (
          <button
            key={i}
            onClick={() => { setPrev(cur); setIndex(i); }}
            aria-label={`Go to slide ${i + 1}`}
            style={{ width: 24, height: 24, padding: 0, border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <span style={{ display: "block", width: i === cur ? 16 : 6, height: 6, borderRadius: 999, background: i === cur ? COLORS.cream : "rgba(251,246,240,0.5)", transition: "width 0.2s" }} />
          </button>
        ) : (
          <button
            key={i}
            onClick={() => { setPrev(cur); setIndex(i); }}
            aria-label={`Go to slide ${i + 1}`}
            style={{
              width: i === cur ? 16 : 6, height: 6, borderRadius: 999, border: "none",
              background: i === cur ? COLORS.cream : "rgba(251,246,240,0.5)",
              transition: "width 0.2s",
            }}
          />
        ))}
      </div>
    </>
  );

  if (fx) {
    return (
      <div style={{ position: "relative" }}>
        <style>{slideCss}</style>
        <div className={"ttc-sl fx-" + fx}>
          {slides.map((sl, i) => (
            <div
              key={i}
              className={"ttc-sl-item" + (i === cur ? " on" : i === prev % slides.length ? " out" : "")}
              onClick={sl.productId && onOpen ? () => onOpen(sl.productId) : undefined}
              style={{ cursor: sl.productId && onOpen ? "pointer" : "default" }}
            >
              {sl.photo ? (
                <Img priority={i === 0} src={sl.photo} alt={sl.name || "Twist & Tangle Crochet — handmade crochet product"} sizes="(max-width: 700px) 92vw, 460px" widths={[480, 720, 960]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <ProductSwatch colors={sl.colors} real={sl.real} />
              )}
            </div>
          ))}
        </div>
        {slides.length > 1 && dotsAndArrows}
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      {slides[index].photo ? (
        <div style={{ width: "100%", aspectRatio: "4/5", borderRadius: 14, overflow: "hidden", background: "#fff" }}>
          <Img priority={index === 0} src={slides[index].photo} alt="Twist & Tangle Crochet — handmade crochet product" sizes="(max-width: 700px) 92vw, 460px" widths={[480, 720, 960]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      ) : (
        <ProductSwatch colors={slides[index].colors} real={slides[index].real} />
      )}
      {dotsAndArrows}
    </div>
  );
}

// Links typed into the admin panel (footer links, "designed by") — only normal
// web, mail, phone and on-site links are allowed.
function safeHref(url) {
  const u = String(url || "").trim();
  return /^(https?:\/\/|mailto:|tel:|\/)/i.test(u) ? u : "";
}

// ---- Fast shop data (Admin → Site settings → Speed → "Fast shop data") ----
// The last good product list is kept in the browser so the shop can show it
// at once, and keep showing it if Firebase can't be reached.
const SHOP_CACHE_KEY = "ttc_shop_cache_v1";
function readShopCache() {
  try {
    if (!readCachedSettings().speed.apiShop) return null;
    const v = JSON.parse(localStorage.getItem(SHOP_CACHE_KEY) || "null");
    return v && Array.isArray(v.products) && v.products.length ? v.products : null;
  } catch (e) { return null; }
}
function writeShopCache(list) {
  try { localStorage.setItem(SHOP_CACHE_KEY, JSON.stringify({ products: list, at: Date.now() })); } catch (e) {}
}
function mergeWithSeed(fromFirestore) {
  const importedSeedIds = new Set(fromFirestore.map((p) => p.seedId).filter(Boolean));
  return [...fromFirestore, ...SEED_PRODUCTS.filter((p) => !importedSeedIds.has(p.id))];
}
// A stable "random" order for one visit: same on every re-render, different on the next visit.
function orderBySeed(list, seed) {
  const score = (id) => {
    let h = 2166136261 ^ Math.floor(seed * 4294967296);
    const str = String(id);
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0) / 4294967296;
  };
  return [...list].map((r) => [r, score(r.id)]).sort((a, b) => a[1] - b[1]).map((x) => x[0]);
}

// Every place that used to open WhatsApp/Instagram/Facebook via a
// JavaScript-simulated click (creating a hidden <a>, calling .click(), then
// window.open() as a fallback) has been changed to a real <a target="_blank">
// link instead. On phones and tablets in particular, a real link is the only
// version mobile browsers reliably treat as "open a new tab" rather than
// navigating the current tab away from the site before handing off to the
// WhatsApp/Instagram app.

export default function App() {
  // Switches and texts from Admin → Site settings (everything off by default).
  const [settings, applySettingsSeed] = useSiteSettings();
  applyBrandColors(settings.brand);
  const { lang, setLang, t: t0, enabled: i18nOn } = useI18n(settings);
  useExtraTranslations(i18nOn ? lang : "en", settings.i18n.extra);
  const brandOn = !!settings.brand.on;
  const brandAddr = [settings.brand.address1, settings.brand.address2, settings.brand.area].map((x) => String(x || "").trim()).filter(Boolean);
  const t = brandOn ? (k) => {
    const o = settings.brand.texts && settings.brand.texts[k];
    if (o && String(o).trim()) return String(o);
    if (k === "footer.location" && brandAddr.length) return brandAddr.join(", ");
    return t0(k);
  } : t0;
  const brandShop = (brandOn && String(settings.brand.shopName || "").trim()) || SITE_NAME;
  useEffect(() => {
    const id = "ttc-brand-fonts";
    let el = document.getElementById(id);
    const pair = brandOn ? FONT_PAIRS[settings.brand.fonts] : null;
    if (!pair) { if (el) el.remove(); return; }
    if (!el) { el = document.createElement("div"); el.id = id; document.head.appendChild(el); }
    el.innerHTML = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${pair[2]}&display=swap"><style>.ttc-bg-scroll, .ttc-bg-scroll button, .ttc-bg-scroll input, .ttc-bg-scroll select, .ttc-bg-scroll textarea { font-family: '${pair[1]}', system-ui, sans-serif; } .ttc-bg-scroll [style*="Fraunces"] { font-family: '${pair[0]}', serif !important; }</style>`;
  }, [brandOn, settings.brand.fonts]);
  const [wishIds, wishApi] = useIdList("ttc_wishlist", 200);
  const [recentIds, recentApi] = useIdList("ttc_recent", Math.max(1, Number(settings.recent.max) || 10));
  const wish = { on: settings.wishlist.on, has: wishApi.has, toggle: (id) => {
    if (settings.wishlist.reminders && !wishApi.has(id)) { try { const m = JSON.parse(localStorage.getItem("ttc_wish_prices") || "{}"); const p = products.find((x) => String(x.id) === String(id)); if (p) { m[String(id)] = Number(p.price) || 0; localStorage.setItem("ttc_wish_prices", JSON.stringify(m)); } } catch (e) {} }
    wishApi.toggle(id);
  } };
  const [wishOpen, setWishOpen] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);
  const installPrompt = useInstallPrompt(!!settings.pwa.install);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [shuffleSeed] = useState(() => Math.random());
  const [reviewTick, setReviewTick] = useState(0);
  const speedCtx = useMemo(() => ({ srcset: !!settings.speed.srcset, lcp: !!settings.speed.lcp, touch: !!settings.access.touch, contrast: !!settings.access.contrast }), [settings.speed.srcset, settings.speed.lcp, settings.access.touch, settings.access.contrast]);
  const apiShopRef = useRef(false);
  apiShopRef.current = !!settings.speed.apiShop;
  const liveProductsRef = useRef(false);

  useEffect(() => { applyManifest(!!settings.pwa.install); }, [settings.pwa.install]);
  useEffect(() => { applySafeArea(!!settings.pwa.safeArea); }, [settings.pwa.safeArea]);
  useEffect(() => { applyServiceWorker(!!settings.speed.sw); }, [settings.speed.sw]);
  useEffect(() => { document.documentElement.lang = lang === "ur" ? "ur" : "en"; }, [lang]);

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("ttc_cart");
      const parsed = saved ? JSON.parse(saved) : {};
      // The cart used to be stored as { [productId]: qty } — a plain number
      // per entry, with no room for which color/variant was chosen. A
      // customer's browser could still have one of those saved from before
      // this changed, so upgrade any old-shape entries on the fly rather
      // than losing whatever was already in their cart.
      const upgraded = {};
      Object.entries(parsed).forEach(([key, value]) => {
        if (typeof value === "number") {
          upgraded[key] = { id: key, variant: null, qty: value };
        } else if (value && typeof value === "object") {
          upgraded[key] = value;
        }
      });
      return upgraded;
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
  // Which color/style is currently selected for each variant-based product,
  // keyed by product id (index into that product's `variants` array).
  // Shared between the shop-grid card and Quick View so a color picked in
  // one place is still shown when the other opens.
  const [variantIndex, setVariantIndex] = useState({});
  function selectVariant(productId, index) {
    setVariantIndex((v) => ({ ...v, [productId]: index }));
  }
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  // "Back to top" button — only appears once the customer has scrolled down
  // some distance, so it doesn't clutter the hero section.
  const [showBackToTop, setShowBackToTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  // Brief "Added to cart" confirmation shown after any Add-to-cart click.
  const [cartToast, setCartToast] = useState(false);
  const cartToastTimer = React.useRef(null);
  // How many products to show on one shop-grid page.
  const [currentPage, setCurrentPage] = useState(1);
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
  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "", payment: PAYMENT_METHODS[0], apt: "", city: "", postal: "", email: "" });
  const [touched, setTouched] = useState({});
  const [cityOpen, setCityOpen] = useState(false); // strict checkout: city list open?
  const [cityFree, setCityFree] = useState(false);   // strict checkout: "my city is not listed"
  const [guideOpen, setGuideOpen] = useState(false);
  const [myOrdersOpen, setMyOrdersOpen] = useState(false);
  const [reviewWriteOpen, setReviewWriteOpen] = useState(false);
  const [gamesOpen, setGamesOpen] = useState(null); // null | "" (menu) | "match" | "puzzle" | "wheel"
  const [faqOpen, setFaqOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(""); // "returns" | "delivery" | "privacy" | ""
  function openPolicy(k) { setPolicyOpen(k); try { if (window.location.pathname !== "/" + k) window.history.pushState({}, "", "/" + k); } catch (e) {} }
  function closePolicy() { const k = policyOpen; setPolicyOpen(""); try { if (window.location.pathname === "/" + k) window.history.pushState({}, "", "/"); } catch (e) {} }
  function openFaq() { setFaqOpen(true); try { if (window.location.pathname !== "/faq") window.history.pushState({}, "", "/faq"); } catch (e) {} }
  function closeFaq() { setFaqOpen(false); try { if (window.location.pathname === "/faq") window.history.pushState({}, "", "/"); } catch (e) {} }
  const [giftNote, setGiftNote] = useState("");
  function openGuide() { setGuideOpen(true); try { if (window.location.pathname !== "/guide") window.history.pushState({}, "", "/guide"); } catch (e) {} }
  function closeGuide() { setGuideOpen(false); try { if (window.location.pathname === "/guide") window.history.pushState({}, "", "/"); } catch (e) {} }
  const [saveInfo, setSaveInfo] = useState(true);
  const [trackOpen, setTrackOpen] = useState(() => (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("track")) || false);
  const [waCountdown, setWaCountdown] = useState(null);
  // Website ordering ("Place order"):
  const [honeypot, setHoneypot] = useState(""); // hidden field only bots fill in
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState(null); // { text, offerWhatsApp, orderNo }
  const [placedOrder, setPlacedOrder] = useState(null); // shown on the thank-you screen
  const placingRef = useRef(false);
  const [quickViewId, setQuickViewId] = useState(null);
  const [quickViewQty, setQuickViewQty] = useState(1);
  const [quickViewSize, setQuickViewSize] = useState(null);
  const [instaCopied, setInstaCopied] = useState(false);
  // Remembers the last order saved to the admin panel, so tapping the
  // WhatsApp/Instagram button twice for the same order doesn't save it twice.
  const lastSavedOrderRef = React.useRef("");
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoRules, setPromoRules] = useState(null);
  const appliedPromoRef = useRef(null);
  appliedPromoRef.current = appliedPromo;
  const [promoCodes, setPromoCodes] = useState(PROMO_CODES);
  const [promoError, setPromoError] = useState("");
  const [products, setProducts] = useState(() => readShopCache() || SEED_PRODUCTS);
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

  // Reviews chosen for the homepage "What customers say" section. Being
  // approved isn't enough on its own — a review also has to be individually
  // starred/featured from the admin portal, so this only ever shows the
  // handful you've picked rather than every approved review on the site.
  const homepageReviews = useMemo(() => {
    const pool = reviews.filter((r) => r.approved && r.featured);
    const more = !!settings.reviewsMore.on; // "Explore more" needs the whole starred list, not only the first few
    if (!settings.reviewsShuffle.on) return pool.slice(0, more ? 60 : 6);
    const limit = more ? 60 : Math.max(1, Number(settings.reviewsShuffle.limit) || 6);
    return orderBySeed(pool, (shuffleSeed + reviewTick * 0.6180339887) % 1).slice(0, limit);
  }, [reviews, settings.reviewsShuffle.on, settings.reviewsShuffle.limit, settings.reviewsMore.on, shuffleSeed, reviewTick]);
  const [reviewsExpanded, setReviewsExpanded] = useState(false);
  const stackLook = settings.reviewsShuffle.on && settings.reviewsShuffle.layout === "stack";
  const reviewsFirst = Math.max(1, Number(settings.reviewsMore.initial) || 3);
  // With "Explore more" on, the grid starts with the first few; the stacked deck keeps its normal handful.
  const reviewsShown = settings.reviewsMore.on && !stackLook && !reviewsExpanded ? homepageReviews.slice(0, reviewsFirst) : homepageReviews;
  const deckReviews = settings.reviewsMore.on ? homepageReviews.slice(0, settings.reviewsShuffle.on ? Math.max(1, Number(settings.reviewsShuffle.limit) || 6) : 6) : homepageReviews;

  // Optional: reshuffle by itself every few seconds (Admin → Home sections → Reviews shuffle).
  useEffect(() => {
    const r = settings.reviewsShuffle;
    if (!r.on || !r.auto) return undefined;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = setInterval(() => setReviewTick((n) => n + 1), Math.max(3, Number(r.every) || 8) * 1000);
    return () => clearInterval(timer);
  }, [settings.reviewsShuffle.on, settings.reviewsShuffle.auto, settings.reviewsShuffle.every]);

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
    } else if (path === "/faq" && settings.faq.on) {
      setFaqOpen(true);
      routeAppliedRef.current = true;
    } else if (path === "/guide" && settings.guide.on) {
      setGuideOpen(true);
      routeAppliedRef.current = true;
    } else if (/^\/(returns|delivery|privacy)$/.test(path) && settings.policies && settings.policies.on) {
      setPolicyOpen(path.slice(1));
      routeAppliedRef.current = true;
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
      } else if (path === "/faq") {
        setFaqOpen(true);
      } else if (path === "/guide") {
        setGuideOpen(true);
      } else if (/^\/(returns|delivery|privacy)$/.test(path)) {
        setPolicyOpen(path.slice(1));
      } else {
        setPolicyOpen("");
        setActiveCategory("All");
        setQuickViewId(null);
        setGuideOpen(false);
        setFaqOpen(false);
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

  // Live promo codes from the admin panel. They arrive scrambled (config/promoPublic), so nobody can read the list;
  // a code the customer types is scrambled the same way and looked up. If the admin hasn't saved the list yet,
  // the built-in PROMO_CODES stay.
  useEffect(() => {
    const applyPublic = (all) => {
      const rules = {};
      for (const [h, p] of Object.entries(all || {})) {
        if (p && p.active !== false && (p.type === "percent" || p.type === "flat") && Number(p.value) > 0) {
          rules[h] = { type: p.type, value: Number(p.value), mode: p.mode === "only" || p.mode === "except" ? p.mode : "all", cats: Array.isArray(p.cats) ? p.cats : [], noIds: Array.isArray(p.noIds) ? p.noIds.map(String).slice(0, 200) : [] };
        }
      }
      setPromoRules(rules);
    };
    const unsub = watchApi(
      (d) => (d.promoPublic === undefined || d.promoPublic === null ? undefined : ((d.promoPublic && d.promoPublic.codes) || {})),
      applyPublic,
      doc(db, "config", "promoPublic"),
      (snap) => {
        if (!snap.exists()) return;
        applyPublic((snap.data() && snap.data().codes) || {});
      },
      () => {}, // keep the built-in codes if this can't be read
      loadOnce()
    );
    return () => unsub();
  }, []);
  // When the list changes: forget the codes unlocked so far, and re-check the one the customer already applied.
  useEffect(() => {
    if (!promoRules) return undefined;
    let dead = false;
    const cur = appliedPromoRef.current;
    if (!cur) { setPromoCodes({}); return undefined; }
    promoHash(cur).then((h) => {
      if (dead) return;
      if (promoRules[h]) setPromoCodes({ [cur]: promoRules[h] });
      else { setPromoCodes({}); setAppliedPromo(null); }
    }).catch(() => {});
    return () => { dead = true; };
  }, [promoRules]);

  useEffect(() => {
    const q = query(collection(db, "products"));
    const unsub = watchApi(
      (d) => (Array.isArray(d.products) ? d.products : undefined),
      (arr) => {
        const merged = mergeWithSeed(arr);
        setProducts(merged);
        liveProductsRef.current = true;
        writeShopCache(merged);
        setProductsLoaded(true);
      },
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
        const merged = [...fromFirestore, ...remainingSeed];
        setProducts(merged);
        liveProductsRef.current = true;
        if (apiShopRef.current) writeShopCache(merged);
        setProductsLoaded(true);
      },
      () => {
        // If Firestore can't be reached, fall back to the built-in catalog —
        // or, with "Fast shop data" on, to the last list we saved.
        setProducts((cur) => (apiShopRef.current && readShopCache() ? cur : SEED_PRODUCTS));
        setProductsLoaded(true);
      },
      loadOnce()
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
    // Only approved reviews are asked for (pending ones stay private; the Firestore rules allow this query).
    // One equality filter needs no index; the newest-first order is applied here.
    const q = query(collection(db, "reviews"), where("approved", "==", true));
    const ms = (r) => (r && r.createdAt && r.createdAt.toMillis ? r.createdAt.toMillis() : 0);
    const unsub = watchApi(
      (d) => (Array.isArray(d.reviews) ? d.reviews : undefined),
      (arr) => setReviews(arr.map((r) => { const t = Date.parse(r.createdAt || ""); return { ...r, createdAt: { toMillis: () => (isNaN(t) ? 0 : t) } }; }).sort((a, b) => ms(b) - ms(a))),
      q,
      (snap) => setReviews(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => ms(b) - ms(a))),
      () => setReviews([]),
      loadOnce()
    );
    return () => unsub();
  }, []);

  // "Fast shop data": a quick, cached copy of the products (and settings on a
  // first visit) from /api/shop, shown until the live Firebase data arrives.
  useEffect(() => {
    if (!settings.speed.apiShop) return undefined;
    let dead = false;
    // index.html may already have started this request ("Fast shop data" on): reuse it (safe to read twice).
    let early = null;
    try { early = window.__ttcEarly || null; } catch (e) {}
    (early || fetch("/api/shop").then((r) => (r.ok ? r.json() : Promise.reject(new Error("api " + r.status)))))
      .then((data) => {
        if (dead || !data) return;
        if (Array.isArray(data.products) && !liveProductsRef.current) {
          const merged = mergeWithSeed(data.products);
          setProducts(merged);
          writeShopCache(merged);
          setProductsLoaded(true);
        }
        let hasCached = false;
        try { hasCached = !!localStorage.getItem(SETTINGS_CACHE_KEY); } catch (e) {}
        if (data.settings && !hasCached) applySettingsSeed(data.settings);
      })
      .catch(() => {}); // Firebase (below) is still the source of truth
    return () => { dead = true; };
  }, [settings.speed.apiShop]);

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
  // "featured" keeps the admin portal's custom display order (the default);
  // the other two re-sort by price without touching that underlying order.
  const [sortBy, setSortBy] = useState("featured");
  const visibleProducts = useMemo(() => {
    let list = activeCategory === "All" ? products : products.filter((p) => p.category === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    if (settings.priceFilter.on) {
      const lo = priceMin === "" ? null : Number(priceMin);
      const hi = priceMax === "" ? null : Number(priceMax);
      if (lo !== null && Number.isFinite(lo)) list = list.filter((p) => Number(p.price) >= lo);
      if (hi !== null && Number.isFinite(hi)) list = list.filter((p) => Number(p.price) <= hi);
    }
    if (sortBy === "price-asc") {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      list = [...list].sort((a, b) => b.price - a.price);
    }
    return list;
  }, [activeCategory, searchQuery, products, sortBy, settings.priceFilter.on, priceMin, priceMax]);

  // Jump back to page 1 whenever the category, search, or sort changes —
  // otherwise a customer could be stranded on "page 3" of a filtered/sorted
  // list that only has one page.
  useEffect(() => {
    setCurrentPage(1);
    setShowAll(false);
  }, [activeCategory, searchQuery, sortBy, priceMin, priceMax]);
  const priceBounds = useMemo(() => {
    const prices = products.map((p) => Number(p.price)).filter((n) => Number.isFinite(n));
    return { min: prices.length ? Math.min(...prices) : 0, max: prices.length ? Math.max(...prices) : 0 };
  }, [products]);

  const PRODUCTS_PER_PAGE = 20;
  const totalPages = Math.max(1, Math.ceil(visibleProducts.length / PRODUCTS_PER_PAGE));
  // "Explore more": show a few products first, the rest after one tap.
  const exploreOn = !!settings.exploreMore.on;
  const [vw, setVw] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1200));
  useEffect(() => { const f = () => setVw(window.innerWidth); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, []);
  const exploreCfg = settings.exploreMore;
  const exploreInitial = Math.max(1, Number(exploreCfg.perDevice ? (vw < 640 ? exploreCfg.initialMobile : vw < 1024 ? exploreCfg.initialTablet : exploreCfg.initial) : exploreCfg.initial) || 8);
  // Lighter motion on phones (Admin → Speed): animations and transitions are cut to save battery and CPU.
  useEffect(() => {
    if (!settings.speed.lightMotion) return undefined;
    const st = document.createElement("style");
    st.textContent = "@media (max-width: 767px) { *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; scroll-behavior: auto !important; } }";
    document.head.appendChild(st);
    return () => st.remove();
  }, [settings.speed.lightMotion]);
  // "Skip drawing parts below the screen" (Admin → Speed): the footer is only drawn when it gets near the screen.
  useEffect(() => {
    if (!settings.speed.cv) return undefined;
    const st = document.createElement("style");
    st.textContent = "footer { content-visibility: auto; contain-intrinsic-size: auto 520px; }";
    document.head.appendChild(st);
    return () => st.remove();
  }, [settings.speed.cv]);
  const pagedProducts = useMemo(
    () => (exploreOn
      ? (showAll ? visibleProducts : visibleProducts.slice(0, exploreInitial))
      : visibleProducts.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE)),
    [visibleProducts, currentPage, exploreOn, showAll, exploreInitial]
  );

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        // A cart saved in the customer's browser can outlive a product — if
        // it was deleted or edited from the admin portal since they added
        // it, `products.find` below won't find it. Drop those instead of
        // showing a broken "Rsundefined" line item.
        .map(([cartKey, entry]) => {
          const p = products.find((pr) => pr.id === entry.id);
          if (!p) return null;
          const variantObj =
            entry.variant && p.variants ? p.variants.find((v) => v.name === entry.variant) : null;
          return {
            ...p,
            qty: entry.qty,
            cartKey,
            variantName: entry.variant || null,
            variantPhoto: variantObj ? variantObj.photo : null,
          };
        })
        .filter((i) => i && i.qty > 0),
    [cart, products]
  );
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const subtotal = cartItems.reduce((s, i) => s + i.qty * i.price, 0);

  // Promo codes can be limited to some categories (Admin → Promo codes).
  // A code can also skip chosen products ("noIds", Admin → Promo codes).
  function promoBase(promo, items, fallback) {
    if (!promo || !items) return fallback;
    const byCat = !!promo.mode && promo.mode !== "all" && Array.isArray(promo.cats) && promo.cats.length > 0;
    const skip = Array.isArray(promo.noIds) && promo.noIds.length > 0 ? promo.noIds.map(String) : null;
    if (!byCat && !skip) return fallback;
    return items.filter((i) => (!byCat || (promo.mode === "only") === promo.cats.includes(i.category)) && !(skip && skip.includes(String(i.id)))).reduce((n, i) => n + i.qty * i.price, 0);
  }
  function promoSkippedNames(code, items) {
    const promo = promoCodes[code];
    if (!promo || !Array.isArray(promo.noIds) || !promo.noIds.length || !items) return [];
    const skip = promo.noIds.map(String);
    return Array.from(new Set(items.filter((i) => skip.includes(String(i.id))).map((i) => i.name)));
  }
  // Combo offers: when every product of a combo is in the cart, the customer gets the combo price.
  function bundleDiscount(items) {
    if (!settings.bundles.on || !items) return 0;
    let d = 0;
    for (const b of settings.bundles.items || []) {
      const ids = (b.productIds || []).map(String);
      if (ids.length < 2 || !(Number(b.price) > 0)) continue;
      const sets = Math.min(...ids.map((id) => items.filter((i) => String(i.id) === id).reduce((n, i) => n + i.qty, 0)));
      if (sets < 1) continue;
      const full = ids.reduce((n, id) => n + ((items.find((i) => String(i.id) === id) || {}).price || 0), 0);
      d += sets * Math.max(0, full - Number(b.price));
    }
    return d;
  }
  function calcDiscount(subtotalAmount, items) {
    if (settings.promoRules && settings.promoRules.mode === "best") return Math.min(subtotalAmount, Math.max(calcPromoDiscount(subtotalAmount, items), bundleDiscount(items)));
    return Math.min(subtotalAmount, calcPromoDiscount(subtotalAmount, items) + bundleDiscount(items));
  }
  function calcPromoDiscount(subtotalAmount, items) {
    if (!appliedPromo) return 0;
    const promo = promoCodes[appliedPromo];
    if (!promo) return 0;
    subtotalAmount = promoBase(promo, items, subtotalAmount);
    if (promo.type === "percent") return Math.round((subtotalAmount * promo.value) / 100);
    return Math.min(promo.value, subtotalAmount);
  }
  // These three (subtotal/discount/total) describe the CART DRAWER — always
  // everything currently in the cart. The checkout modal uses its own
  // checkoutSubtotal/checkoutDiscount/checkoutTotal below instead, so that a
  // "Buy Now" purchase never mixes in whatever else happens to be in the cart.
  const discount = useMemo(() => calcDiscount(subtotal, cartItems), [appliedPromo, subtotal, promoCodes, cartItems, settings.bundles]);
  const total = Math.max(0, subtotal - discount);

  // What the checkout modal actually orders: just the one "Buy Now" item
  // when that's how the customer got here, otherwise the full cart.
  const checkoutItems = useMemo(() => {
    if (directBuyItem) {
      const p = products.find((pr) => pr.id === directBuyItem.id);
      if (!p) return [];
      const variantObj =
        directBuyItem.variant && p.variants ? p.variants.find((v) => v.name === directBuyItem.variant) : null;
      return [{
        ...p,
        qty: directBuyItem.qty,
        variantName: directBuyItem.variant || null,
        variantPhoto: variantObj ? variantObj.photo : null,
      }];
    }
    return cartItems;
  }, [directBuyItem, cartItems, products]);
  const checkoutSubtotal = checkoutItems.reduce((s, i) => s + i.qty * i.price, 0);
  const checkoutDiscount = useMemo(() => calcDiscount(checkoutSubtotal, checkoutItems), [appliedPromo, checkoutSubtotal, promoCodes, checkoutItems, settings.bundles]);
  const checkoutTotal = Math.max(0, checkoutSubtotal - checkoutDiscount);
  // Meta Pixel shop events (Admin → Control centre → "Meta Pixel shop events", OFF by default).
  // Size guide link: only when the switch is on, a chart is written and the product's category is listed (empty list = all products).
  function sizeGuideFor(prod) {
    const g = settings.sizeGuide;
    if (!g || !g.on || !String(g.table || "").trim() || !prod) return false;
    const cats = String(g.categories || "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
    return !cats.length || cats.includes(String(prod.category || "").trim().toLowerCase());
  }
  // Products that belong to a combo offer (for the "In a combo offer" badge).
  const comboIds = useMemo(() => {
    const set = new Set();
    if (settings.bundles && settings.bundles.on && settings.cardBadges && settings.cardBadges.comboOn) (settings.bundles.items || []).forEach((b) => (b.productIds || []).forEach((id) => set.add(String(id))));
    return set;
  }, [settings.bundles, settings.cardBadges]);
  const policyLinks = (settings.policies && settings.policies.on && settings.policies.footer)
    ? [["returns", "returnsTitle"], ["delivery", "deliveryTitle"], ["privacy", "privacyTitle"]].filter(([k]) => String(settings.policies[k] || "").trim()).map(([k, t]) => ({ key: k, label: settings.policies[t] || k, open: () => openPolicy(k) }))
    : [];
  const metaOn = !!(settings.metaPixel && settings.metaPixel.events);
  setMetaEvents(metaOn);
  useEffect(() => {
    if (!checkoutOpen) return;
    metaTrack("InitiateCheckout", { ids: checkoutItems.map((i) => i.id), num: checkoutItems.reduce((n, i) => n + (Number(i.qty) || 0), 0), value: checkoutTotal });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutOpen]);
  const giftFree = !!(settings.cartPlus.giftOn && Number(settings.cartPlus.giftOver) > 0 && checkoutSubtotal >= Number(settings.cartPlus.giftOver));
  const notesAll = (form.notes.trim() + (giftFree ? (form.notes.trim() ? "\n" : "") + settings.cartPlus.giftText : "") + (settings.checkout.giftNote && giftNote.trim() ? (form.notes.trim() ? "\n" : "") + "Gift note: " + giftNote.trim() : "")).trim();

  async function applyPromo() {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    // Admin → Offers & rules: "Only one promo code at a time".
    if (appliedPromo && settings.promoRules && settings.promoRules.oneAtATime) {
      setPromoError(code === appliedPromo ? code + " is already applied." : appliedPromo + " is already applied. Remove it first to use a different code.");
      return;
    }
    const items = checkoutOpen ? checkoutItems : cartItems;
    let rule = promoCodes[code];
    if (!rule && promoRules) { try { rule = promoRules[await promoHash(code)]; } catch (e) { rule = null; } }
    if (rule && promoBase(rule, items, 1) === 0) {
      setAppliedPromo(null);
      const skipped = Array.isArray(rule.noIds) && rule.noIds.length ? Array.from(new Set(items.filter((i) => rule.noIds.map(String).includes(String(i.id))).map((i) => i.name))) : [];
      setPromoError(skipped.length ? "This code doesn't work on: " + skipped.join(", ") : rule.mode === "only" ? "This code only works on: " + rule.cats.join(", ") : "This code doesn't work on the items in your cart");
    } else if (rule) {
      setPromoCodes((cur) => ({ ...cur, [code]: rule }));
      setAppliedPromo(code);
      setPromoError("");
    } else {
      setAppliedPromo(null);
      setPromoError("Invalid promo code");
    }
  }
  // With "Only one promo code at a time" ON: a small box under the applied code, so a second code gets a clear message.
  function promoMore() {
    const items = checkoutOpen ? checkoutItems : cartItems;
    const skipped = promoSkippedNames(appliedPromo, items);
    const one = !!(settings.promoRules && settings.promoRules.oneAtATime);
    if (!one && !skipped.length) return null;
    return (
      <div style={{ marginTop: 6 }}>
        {skipped.length > 0 && <div style={{ fontSize: 11.5, color: "#7A6E64" }}>{appliedPromo} doesn't apply to: {skipped.join(", ")}</div>}
        {one && (
          <>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <input value={promoInput} onChange={(e) => { setPromoInput(e.target.value); setPromoError(""); }} placeholder={t("cart.promo")} aria-label="Another promo code" style={{ flex: 1, minWidth: 0, padding: "8px 12px", borderRadius: 10, border: `1px solid ${COLORS.bgSoft}`, fontSize: 13, background: COLORS.bg }} />
              <button onClick={applyPromo} style={{ background: COLORS.navy, color: COLORS.cream, border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 700 }}>{t("cart.apply")}</button>
            </div>
            {promoError && <div style={{ fontSize: 11.5, color: "#C0392B", marginTop: 6 }}>{promoError}</div>}
          </>
        )}
      </div>
    );
  }
  function removePromo() {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoError("");
  }

  // `variant` is the chosen color/style name (or null for a product with no
  // variants) — kept as part of the cart key so "Red" and "Yellow" of the
  // same product are two separate lines, not merged into one.
  function addToCart(id, qty = 1, variant = null) {
    const key = variant ? `${id}::${variant}` : id;
    { const pp = products.find((x) => x.id === id); if (pp) metaTrack("AddToCart", { ids: [id], name: pp.name, num: qty, value: (Number(pp.price) || 0) * qty }); }
    setCart((c) => {
      const existing = c[key];
      return { ...c, [key]: { id, variant, qty: (existing ? existing.qty : 0) + qty } };
    });
    setCartToast(true);
    clearTimeout(cartToastTimer.current);
    cartToastTimer.current = setTimeout(() => setCartToast(false), 2200);
  }
  function buyNow(id, qty = 1, variant = null) {
    // Deliberately does NOT touch the shared cart — "Buy Now" checks out
    // just this one item, it doesn't add it to whatever's already in the
    // cart (see checkoutItems above).
    setDirectBuyItem({ id, qty, variant });
    setDrawerOpen(false);
    setCheckoutOpen(true);
  }
  // Adjusts quantity from inside the checkout popup itself — only meaningful
  // for a direct "Buy Now" purchase (a cart checkout can have several
  // different items, each already adjustable from the cart drawer).
  function changeCheckoutQty(delta) {
    setDirectBuyItem((item) => (item ? { ...item, qty: Math.max(1, item.qty + delta) } : item));
  }
  function closeCheckout() {
    setCheckoutOpen(false);
    setDirectBuyItem(null);
    setPlacedOrder(null);
    setPlaceError(null);
    setPhoneTouched(false);
    setTouched({}); setCityFree(false); setCityOpen(false);
    setWaCountdown(null);
  }
  useEffect(() => {
    if (!settings.productPage.seo || !quickViewId) return undefined;
    const p = products.find((x) => x.id === quickViewId); if (!p) return undefined;
    const oldTitle = document.title;
    let meta = document.querySelector('meta[name="description"]'); const hadMeta = !!meta; const oldDesc = meta ? meta.getAttribute("content") : "";
    if (!meta) { meta = document.createElement("meta"); meta.setAttribute("name", "description"); document.head.appendChild(meta); }
    document.title = `${p.name} | ${brandShop}`;
    meta.setAttribute("content", String(p.shortLine || p.desc || "").replace(/\s+/g, " ").slice(0, 155));
    const ld = document.createElement("script"); ld.type = "application/ld+json";
    ld.text = JSON.stringify({ "@context": "https://schema.org", "@type": "Product", name: p.name, image: (p.photos || []).slice(0, 4), description: String(p.desc || "").slice(0, 300), offers: { "@type": "Offer", priceCurrency: "PKR", price: Number(p.price) || 0, availability: p.tag === "Sold Out" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock" } });
    document.head.appendChild(ld);
    return () => { document.title = oldTitle; if (hadMeta) meta.setAttribute("content", oldDesc); else meta.remove(); ld.remove(); };
  }, [quickViewId, settings.productPage.seo, products]); // eslint-disable-line

  function openQuickView(id, push = true) {
    const p = products.find((pr) => pr.id === id);
    if (p) metaTrack("ViewContent", { ids: [id], name: p.name, value: Number(p.price) || 0 });
    setQuickViewId(id);
    if (settings.recent.on) recentApi.push(id);
    setQuickViewQty(1);
    setQuickViewSize(p && p.sizes ? p.sizes[0] : null);
    if (push) window.history.pushState({}, "", urlForProduct(id));
  }
  function changeQty(cartKey, delta) {
    setCart((c) => {
      const existing = c[cartKey];
      if (!existing) return c;
      const nextQty = Math.max(0, existing.qty + delta);
      if (nextQty === 0) {
        const rest = { ...c };
        delete rest[cartKey];
        return rest;
      }
      return { ...c, [cartKey]: { ...existing, qty: nextQty } };
    });
  }

  function buildOrderText(orderNo) {
    const lines = checkoutItems
      .map((i) => `• ${i.name}${i.variantName ? ` (${i.variantName})` : ""} x${i.qty} — Rs${i.price * i.qty}`)
      .join("\n");
    const promoLine = appliedPromo
      ? `Promo code: ${appliedPromo} (-Rs${checkoutDiscount})\n`
      : "";
    return (
      `Hi TTC! I'd like to order:\n` +
      (orderNo ? `(Website order ${orderNo} didn't go through, so I'm sending it here.)\n` : "") +
      `\n${lines}\n\nSubtotal: Rs${checkoutSubtotal}\n${promoLine}Total: Rs${checkoutTotal}\n\n` +
      `Name: ${form.name}\nPhone: ${form.phone}\nAddress: ${form.address}\nPayment: ${form.payment}\n` +
      (notesAll ? `Notes: ${notesAll}\n` : "")
    );
  }

  function buildWhatsAppLink(orderNo) {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildOrderText(orderNo))}`;
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

  // Saves a copy of the order to Firestore so it shows up under "Orders" in
  // the admin panel. Fire-and-forget on purpose: the WhatsApp/Instagram link
  // must open immediately (see the note above), and a failed save should
  // never stop the customer from sending their order.
  function saveOrderToAdmin(channel) {
    const signature = channel + "|" + buildOrderText();
    if (lastSavedOrderRef.current === signature) return;
    lastSavedOrderRef.current = signature;
    metaTrack("Purchase", { ids: orderItemsForSave().map((x) => x.productId).filter(Boolean), num: orderItemsForSave().reduce((n, x) => n + (Number(x.qty) || 0), 0), value: checkoutTotal });
    addDoc(collection(db, "orders"), {
      items: orderItemsForSave(),
      subtotal: checkoutSubtotal,
      discount: checkoutDiscount,
      promo: appliedPromo || null,
      total: checkoutTotal,
      customer: {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        notes: notesAll,
      },
      paymentMethod: form.payment || PAYMENT_METHODS[0],
      channel,
      status: "new",
      starred: false,
      createdAt: serverTimestamp(),
    }).catch((err) => {
      console.warn("Couldn't save order to admin panel:", err.message);
      lastSavedOrderRef.current = "";
    });
  }

  function orderItemsForSave() {
    return checkoutItems.map((i) => {
      const photo = i.variantPhoto || mainPhotoFor(i);
      return {
        productId: String(i.id),
        name: String(i.name || ""),
        variant: i.variantName || null,
        qty: i.qty,
        price: i.price,
        // Built-in starter products keep their photos inside the site's code
        // (very large) — only short web links are worth storing with an order.
        photo: typeof photo === "string" && /^https?:\/\//.test(photo) ? photo : null,
      };
    });
  }

  // "Place order": saves the order straight to the admin panel — no
  // WhatsApp needed. If saving fails, the customer is offered WhatsApp
  // with the full order written out, so the sale is never lost.
  async function placeWebsiteOrder() {
    if (placingRef.current) return;
    setPhoneTouched(true);
    setTouched({ name: true, address: true, city: true, email: true, postal: true });
    setPlaceError(null);
    if (!canSubmit) return;

    const firstName = form.name.trim().split(/\s+/)[0];
    const summary = {
      firstName,
      phone: form.phone.trim(),
      itemCount: checkoutItems.reduce((n, i) => n + i.qty, 0),
      total: checkoutTotal,
    };
    const placedText = buildPlacedText;

    // Bots fill in the hidden field — pretend it worked and save nothing.
    if (honeypot.trim()) {
      setPlacedOrder({ ...summary, orderNo: makeOrderNo() });
      return;
    }

    const wait = ORDER_COOLDOWN_MS - (Date.now() - readLastOrderAt());
    if (wait > 0) {
      setPlaceError({
        text: `You placed an order a moment ago. Please wait ${Math.ceil(wait / 1000)} seconds before placing another one.`,
        offerWhatsApp: false,
      });
      return;
    }

    const orderNo = await nextOrderNo(settings.orders);
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setPlaceError({ text: "You seem to be offline, so your order couldn't be placed.", offerWhatsApp: true, orderNo });
      return;
    }

    placingRef.current = true;
    setPlacing(true);
    try {
      await withTimeout(
        addDoc(collection(db, "orders"), {
          orderNo,
          items: orderItemsForSave(),
          subtotal: checkoutSubtotal,
          discount: checkoutDiscount,
          promo: appliedPromo || null,
          deliveryCharge: null, // delivery is charged separately, confirmed on the call
          total: checkoutTotal,
          customer: betterOn ? {
            name: form.name.trim(),
            phone: form.phone.trim(),
            address: [form.address.trim(), form.apt.trim(), form.city.trim() + (form.postal.trim() ? " " + form.postal.trim() : "")].filter(Boolean).join(", "),
            notes: notesAll,
            email: form.email.trim(), city: form.city.trim(), postal: form.postal.trim(), apartment: form.apt.trim(),
          } : {
            name: form.name.trim(),
            phone: form.phone.trim(),
            address: form.address.trim(),
            notes: notesAll,
          },
          paymentMethod: form.payment || PAYMENT_METHODS[0],
          channel: "website",
          status: "new",
          starred: false,
          createdAt: serverTimestamp(),
        }),
        15000
      );
      writeLastOrderAt(Date.now());
      rememberOrder(orderNo, checkoutTotal);
      metaTrack("Purchase", { ids: orderItemsForSave().map((x) => x.productId).filter(Boolean), num: orderItemsForSave().reduce((n, x) => n + (Number(x.qty) || 0), 0), value: checkoutTotal }, orderNo);
      if (settings.orderAlert && settings.orderAlert.telegram) { try { fetch("/api/notify", { method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true, body: JSON.stringify({ orderNo, total: checkoutTotal, city: form.city || "", items: orderItemsForSave().reduce((n, x) => n + (Number(x.qty) || 0), 0) }) }).catch(() => {}); } catch (e) {} }
      if (betterOn) { try { if (saveInfo) localStorage.setItem("ttc_checkout_info", JSON.stringify({ name: form.name, phone: form.phone, address: form.address, apt: form.apt, city: form.city, postal: form.postal, email: form.email })); else localStorage.removeItem("ttc_checkout_info"); } catch (e) {} }
      setPlacedOrder({ ...summary, orderNo, waText: placedText(orderNo) });
      if (!directBuyItem) setCart({});
      setAppliedPromo(null);
      setPromoInput("");
      setForm((f) => ({ ...f, notes: "" }));
    } catch (err) {
      console.warn("Website order failed:", err && err.message);
      setPlaceError({
        text: err && err.message === "timeout"
          ? "This is taking too long — your connection may be slow, so we couldn't confirm your order."
          : "Sorry, something went wrong and your order couldn't be placed.",
        offerWhatsApp: true,
        orderNo,
        // Shown small and grey so the shop owner can tell what went wrong
        // (e.g. "permission-denied" = Firestore rules not published).
        code: err && err.message === "timeout" ? "timeout" : (err && err.code) || "unknown",
      });
    } finally {
      placingRef.current = false;
      setPlacing(false);
    }
  }

  const betterOn = !!settings.checkout.betterForm;
  const strictOn = betterOn && !!settings.checkout.strict; // Admin → Order & checkout → "Strict checks"
  const phoneValid = isValidPkMobile(form.phone) && (!strictOn || strictPhone(form.phone));
  // Unfinished-cart reminders (Admin → Order & checkout, OFF by default): one small write per phone + cart total, after a valid phone is typed.
  const cartSavedRef = useRef("");
  useEffect(() => {
    if (!(settings.cartReminder && settings.cartReminder.on) || !checkoutOpen || placedOrder || !phoneValid || !checkoutItems.length) return;
    let digits = String(form.phone || "").replace(/\D/g, "");
    if (digits.startsWith("0")) digits = "92" + digits.slice(1);
    if (digits.length < 10 || digits.length > 15) return;
    const key = digits + "|" + checkoutTotal + "|" + checkoutItems.length;
    if (cartSavedRef.current === key) return;
    const t = setTimeout(() => {
      cartSavedRef.current = key;
      setDoc(doc(db, "carts", digits), {
        phone: digits,
        name: String(form.name || "").trim().slice(0, 120),
        items: checkoutItems.slice(0, 30).map((i) => ({ n: String(i.name || "").slice(0, 80), q: Number(i.qty) || 1, p: Number(i.price) || 0 })),
        total: checkoutTotal,
        at: serverTimestamp(),
      }).catch(() => {});
    }, 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutOpen, phoneValid, form.phone, checkoutTotal, checkoutItems.length, placedOrder]);
  const nameWords = form.name.trim().split(/\s+/).filter(Boolean);
  const betterErrors = betterOn ? {
    name: nameWords.length < 2 || (strictOn && !strictName(form.name)) ? "Please enter your real first and last name (letters only)." : "",
    address: !(form.address.trim().length >= 10 && /\d/.test(form.address) && form.address.trim().split(/\s+/).length >= 3) || (strictOn && !strictAddress(form.address)) ? "Please write the complete address: house or plot number, street and area." : "",
    city: strictOn ? (cityFree ? (/^[A-Za-z .\-]{3,}$/.test(form.city.trim()) ? "" : "Please type your city name (letters only).") : (findCity(form.city) ? "" : "Please choose your city from the list.")) : form.city.trim().length < 2 ? "Please enter your city." : "",
    email: form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()) ? "That email address doesn't look right." : "",
    postal: form.postal.trim() && !(strictOn ? /^\d{5}$/ : /^\d{4,6}$/).test(form.postal.trim()) ? (strictOn ? "The postal code is 5 digits, e.g. 54000." : "The postal code is 4 to 6 digits, e.g. 54000.") : "",
  } : {};
  const betterOk = Object.values(betterErrors).every((v) => !v);
  const canSubmit = !!(form.name.trim() && phoneValid && form.address.trim() && checkoutItems.length > 0 && betterOk);
  // The message the customer sends on WhatsApp right after the order is placed.
  function buildPlacedText(orderNo) {
    const lines = checkoutItems.map((i) => `• ${i.name}${i.variantName ? ` (${i.variantName})` : ""} x${i.qty} — Rs${i.price * i.qty}`).join("\n");
    const addr = betterOn ? [form.address.trim(), form.apt.trim(), form.city.trim()].filter(Boolean).join(", ") : form.address;
    return `Hi TTC! I placed an order on the website.\nOrder number: ${orderNo}\n\n${lines}\n\nTotal: Rs${checkoutTotal}\n\nName: ${form.name}\nPhone: ${form.phone}\nAddress: ${addr}\nPayment: ${form.payment}\n` + (notesAll ? `Notes: ${notesAll}\n` : "");
  }
  // After the thank-you screen: open WhatsApp by itself a moment later, with the order already written.
  const waAuto = !!(placedOrder && settings.checkout.whatsappAuto && placedOrder.waText);
  const waLink = waAuto ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(placedOrder.waText)}` : "";
  useEffect(() => {
    if (!waAuto) { setWaCountdown(null); return undefined; }
    let left = Math.min(10, Math.max(1, Number(settings.checkout.whatsappDelay) || 2));
    setWaCountdown(left);
    const timer = setInterval(() => {
      left -= 1;
      if (left <= 0) { clearInterval(timer); setWaCountdown(null); window.location.href = waLink; }
      else setWaCountdown(left);
    }, 1000);
    return () => clearInterval(timer);
  }, [waAuto, waLink]); // eslint-disable-line
  // "Save this information for next time" — fill the form again on the next visit.
  useEffect(() => {
    if (!betterOn) return;
    try { const saved = JSON.parse(localStorage.getItem("ttc_checkout_info") || "null"); if (saved) setForm((f) => ({ ...f, ...saved })); } catch (e) {}
  }, [betterOn]); // eslint-disable-line

  // ----- values used by the page below (all fall back to today's look) -----
  const arr = (v) => (Array.isArray(v) ? v : []);
  const num = (v, d) => (v !== "" && v !== null && Number.isFinite(Number(v)) ? Number(v) : d);
  const cardLayout = settings.cardLayout.on ? Math.min(11, Math.max(1, num(settings.cardLayout.layout, 1))) : 1;
  const rotWords = arr(lang === "ur" ? settings.rotator.wordsUr : settings.rotator.words).map(String).filter((w) => w.trim());
  const rotTarget = lang === "ur" ? settings.rotator.targetUr : settings.rotator.target;
  const fancyHeading = !!settings.heroReveal.on || (!!settings.rotator.on && rotWords.length >= 2 && String(rotTarget || "").trim() !== "");
  const lk = settings.look;
  // "Tighter spacing": smaller gaps between home sections, around the order-guide bar and inside the stats tiles.
  const tightVars = lk.tight ? { "--ttc-section-space": "8px", "--ttc-divider": "8px", "--ttc-guide-pad": "0px 20px 6px", "--ttc-tile-pad": "14px 14px" } : {};
  const lookVars = lk.on ? {
    "--ttc-gap": `${num(lk.gap, 22)}px`,
    "--ttc-card-radius": `${num(lk.cardRadius, 18)}px`,
    "--ttc-panel-radius": `${num(lk.panelRadius, 24)}px`,
    "--ttc-photo-radius": `${num(lk.photoRadius, 14)}px`,
    "--ttc-section-space": `${num(lk.sectionSpace, 20)}px`,
  } : {};
  const freeDeliveryApplies = !!settings.freeDelivery.on && num(settings.freeDelivery.threshold, 0) > 0 && checkoutTotal >= num(settings.freeDelivery.threshold, 0);
  const timingsText = settings.timings.on ? String(settings.timings.text || "").trim() : "";
  const footerLinks = settings.footerLinks.on
    ? arr(settings.footerLinks.links).map((l) => ({ label: String((l && l.label) || "").trim(), href: safeHref(l && l.url) })).filter((l) => l.label && l.href)
    : [];
  const designedByName = settings.designedBy.on ? String(settings.designedBy.name || "").trim() : "";
  const designedByHref = settings.designedBy.on ? safeHref(settings.designedBy.url) : "";
  function goToShop() { setTimeout(() => { const el = document.getElementById("shop"); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 60); }
  const searchBox = (width) => (
    <Suspense fallback={null}>
      <SearchSuggest products={products} value={searchQuery} onChange={setSearchQuery} width={width} placeholder={t("nav.search")}
        onBlurEmpty={() => { if (!searchQuery) setSearchOpen(false); }}
        onPick={(p) => { setSearchQuery(""); setSearchOpen(false); openQuickView(p.id); }}
        onSubmit={() => { setActiveCategory("All"); goToShop(); }} />
    </Suspense>
  );
  const ordersButton = settings.myOrders.on ? (
    <button onClick={() => setMyOrdersOpen(true)} aria-label="My orders" title="My orders" style={{ background: "none", border: "none", color: COLORS.navy, padding: 2, display: "flex", flexShrink: 0 }}>
      <Package size={19} />
    </button>
  ) : null;
  const wishButton = settings.wishlist.on ? (
    <button
      onClick={() => setWishOpen(true)}
      aria-label={t("wish.title")}
      style={{ position: "relative", background: "none", border: "none", color: COLORS.navy, padding: 2, display: "flex", flexShrink: 0 }}
    >
      <Heart size={19} />
      {wishIds.length > 0 && (
        <span style={{
          position: "absolute", top: -6, right: -7, background: COLORS.maroon, color: "#fff", fontSize: 10, fontWeight: 700,
          borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {wishIds.length}
        </span>
      )}
    </button>
  ) : null;

  const reviewsFx = settings.reviewsShuffle.on && ["rise", "fade", "flip", "pop"].includes(settings.reviewsShuffle.fx) ? settings.reviewsShuffle.fx : null;
  const reviewsShuffleButton = !!(settings.reviewsShuffle.on && settings.reviewsShuffle.button);
  const carouselSlides = settings.carousel.on
    ? arr(settings.carousel.slides).map((sl) => {
        const prod = sl && sl.productId ? products.find((p) => String(p.id) === String(sl.productId)) : null;
        if (sl && sl.productId && !prod && productsLoaded) return null;
        const photo = (prod && mainPhotoFor(prod)) || (sl && sl.photo) || "";
        return photo ? { photo, productId: prod ? prod.id : null, name: (prod && prod.name) || (sl && sl.name) || "" } : null;
      }).filter(Boolean)
    : [];
  const useCustomCarousel = carouselSlides.length > 0;
  const carouselFx = ["slide", "fade", "zoom"].includes(settings.carousel.transition) ? settings.carousel.transition : "slide";
  const mo = settings.motion;
  const cardsMotion = !!mo.cards.on;
  const motionClasses = [
    cardsMotion && mo.cards.hover === "lift" ? "ttc-m-lift" : "",
    cardsMotion && mo.cards.hover === "zoom" ? "ttc-m-zoom" : "",
    cardsMotion && mo.cards.enter !== "none" ? "ttc-m-enter" : "",
    mo.overlays.on ? "ttc-m-ov" : "",
  ].filter(Boolean).join(" ");
  const saleTimerNode = settings.saleTimer && settings.saleTimer.on ? <Suspense fallback={null}><SaleTimer cfg={settings.saleTimer} /></Suspense> : null;
  const announceNode = settings.announcements.on ? <AnnouncementBars cfg={settings.announcements} lang={lang} t={t} /> : null;

  const heroNode = (
      <section className="ttc-hero-section" style={{ maxWidth: 1000, margin: "0 auto", position: "relative" }}>
        <div className="ttc-hero-panel" style={{
          background: "rgba(251,246,240,0.82)", backdropFilter: "blur(4px)",
          borderRadius: "var(--ttc-panel-radius, 24px)",
        }}>
          <div style={{ margin: "0 auto 34px" }}>
            <HeartLineDivider />
          </div>
          <div className="ttc-hero-grid">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                <LeafSprig side="left" />
                <span style={{ fontFamily: "'Caveat', cursive", fontSize: 26, color: COLORS.charcoal }}>
                  {t("hero.kicker")}
                </span>
                <LeafSprig side="right" />
              </div>
              {fancyHeading ? (
                <HeroHeading
                  key={lang}
                  lines={[t("hero.l1"), t("hero.l2")]}
                  reveal={!!settings.heroReveal.on}
                  revealStyle={settings.heroReveal.style}
                  revealStep={settings.heroReveal.step}
                  rotatorFx={settings.rotator.fx}
                  rotatorWords={settings.rotator.on ? rotWords : null}
                  rotatorTarget={rotTarget}
                  rotatorSpeed={settings.rotator.speed}
                  className="ttc-hero-h1"
                  style={{
                    fontFamily: "'Fraunces', serif", fontWeight: 600,
                    lineHeight: 1.08, color: COLORS.maroonDark, margin: "0 0 16px",
                  }}
                />
              ) : (
                <h1
                  className="ttc-hero-h1"
                  style={{
                    fontFamily: "'Fraunces', serif", fontWeight: 600,
                    lineHeight: 1.08, color: COLORS.maroonDark, margin: "0 0 16px",
                  }}
                >
                  {t("hero.l1")}
                  <br />
                  {t("hero.l2")}
                </h1>
              )}
              <p style={{ fontSize: 16, lineHeight: 1.6, color: "#5A4E46", maxWidth: 420, marginBottom: 26 }}>
                {t("hero.sub")}
              </p>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <a href="#shop" style={{
                  background: COLORS.navy, color: COLORS.cream, textDecoration: "none",
                  padding: "13px 24px", borderRadius: 999, fontWeight: 700, fontSize: 14,
                }}>
                  {t("hero.cta")}
                </a>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'Caveat', cursive", fontSize: 22, color: COLORS.charcoal }}>
                  {t("hero.tag")} <HandDrawnHeart size={18} />
                </span>
              </div>
            </div>
            <div style={{ position: "relative" }}>
              {useCustomCarousel ? (
                <Slideshow
                  key={carouselSlides.length + ":" + carouselFx}
                  slides={carouselSlides}
                  fx={carouselFx}
                  speed={settings.carousel.speed}
                  autoplay={settings.carousel.autoplay !== false}
                  onOpen={(id) => openQuickView(id)}
                />
              ) : (
                <Slideshow slides={HERO_SLIDES} />
              )}
            </div>
          </div>
        </div>
      </section>
  );
  const shopNode = (
      <section id="shop" className="ttc-shop-section" style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div className="ttc-shop-panel" style={{ background: "rgba(251,246,240,0.82)", backdropFilter: "blur(4px)", borderRadius: "var(--ttc-panel-radius, 24px)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 22 }}>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 28, color: COLORS.maroonDark, margin: 0 }}>
              {t("shop.title")}
            </h2>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#7A6E64" }}>
              {t("shop.sortBy")}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort products"
                style={{
                  border: `1.3px solid ${COLORS.bgSoft}`, borderRadius: 999, padding: "7px 14px",
                  fontSize: 12.5, fontWeight: 600, color: COLORS.charcoal, background: COLORS.cream,
                  cursor: "pointer",
                }}
              >
                <option value="featured">{t("shop.featured")}</option>
                <option value="price-asc">{t("shop.priceAsc")}</option>
                <option value="price-desc">{t("shop.priceDesc")}</option>
              </select>
            </label>
          </div>

          {settings.priceFilter.on && (
            <PriceFilter
              min={priceMin} max={priceMax} onMin={setPriceMin} onMax={setPriceMax}
              onClear={() => { setPriceMin(""); setPriceMax(""); }} bounds={priceBounds} t={t}
            />
          )}

          <div
            className={"ttc-product-grid" + (cardLayout === 4 ? " ttc-grid-row" : "")}
            style={{
              display: "grid",
              gridTemplateColumns: cardLayout === 4 ? "repeat(auto-fill, minmax(min(100%, 420px), 1fr))" : "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "var(--ttc-gap, 22px)",
            }}
          >
            {visibleProducts.length === 0 ? (
              <p style={{ color: "#7A6E64", fontSize: 14, gridColumn: "1/-1" }}>{t("shop.noMatch")}</p>
            ) : pagedProducts.map((p, pIdx) => {
              // The color/style currently selected for this product, so the
              // Add/Buy buttons order exactly what's shown, not whatever the
              // first swatch happens to be.
              const selectedIndex = variantIndex[p.id] ?? 0;
              const selectedVariant = p.variants ? p.variants[selectedIndex] : null;
              const card = (
                <ProductCard
                  key={p.id}
                  p={p}
                  layout={cardLayout}
                  selectedIndex={selectedIndex}
                  onSelect={(i) => selectVariant(p.id, i)}
                  onOpen={() => openQuickView(p.id)}
                  onAdd={() => addToCart(p.id, 1, selectedVariant ? selectedVariant.name : null)}
                  onBuy={() => buyNow(p.id, 1, selectedVariant ? selectedVariant.name : null)}
                  reviews={reviewsByProduct[p.id]}
                  href={urlForProduct(p.id)}
                  wish={wish}
                  t={t}
                  saveBadge={settings.saveBadge}
                  cardBadges={settings.cardBadges}
                  comboIds={comboIds}
                />
              );
              return cardsMotion ? (
                <div key={p.id} className="ttc-cw" style={{ display: "contents", "--i": Math.min(pIdx, 12) }}>{card}</div>
              ) : card;
            })}
          </div>

          {exploreOn && !showAll && visibleProducts.length > exploreInitial && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 26 }}>
              <button
                onClick={() => setShowAll(true)}
                style={{
                  background: COLORS.navy, color: COLORS.cream, border: "none", borderRadius: 999,
                  padding: "12px 30px", fontSize: 14, fontWeight: 700,
                }}
              >
                {t("shop.exploreMore")}
              </button>
            </div>
          )}

          {!exploreOn && totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 26, flexWrap: "wrap" }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => {
                    setCurrentPage(pageNum);
                    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  aria-current={pageNum === currentPage ? "page" : undefined}
                  style={{
                    width: 34, height: 34, borderRadius: "50%", border: "none",
                    background: pageNum === currentPage ? COLORS.navy : COLORS.bgSoft,
                    color: pageNum === currentPage ? COLORS.cream : COLORS.charcoal,
                    fontSize: 13, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  {pageNum}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
  );
  const reviewsNode = (
          <section style={{ padding: "var(--ttc-section-space, 20px) 20px", maxWidth: 1000, margin: "0 auto" }}>
            <div className="ttc-shop-panel" style={{ background: "rgba(251,246,240,0.82)", backdropFilter: "blur(4px)", borderRadius: "var(--ttc-panel-radius, 24px)" }}>
              {reviewsShuffleButton ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 22 }}>
                  <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 28, color: COLORS.maroonDark, margin: 0 }}>
                    {t("reviews.title")}
                  </h2>
                  <button
                    onClick={() => setReviewTick((n) => n + 1)}
                    style={{ border: `1.3px solid ${COLORS.navy}`, background: "transparent", color: COLORS.navy, borderRadius: 999, padding: "7px 14px", fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <Shuffle size={14} /> {t("reviews.shuffle")}
                  </button>
                </div>
              ) : (
                <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 28, color: COLORS.maroonDark, marginBottom: 22 }}>
                  {t("reviews.title")}
                </h2>
              )}
              {settings.reviewsShuffle.on && settings.reviewsShuffle.layout === "stack" && homepageReviews.length > 0 ? (
                <Suspense fallback={null}><ReviewDeck reviews={deckReviews} products={products} onOpen={(id) => openQuickView(id)} auto every={settings.reviewsShuffle.auto ? settings.reviewsShuffle.every : 2} /></Suspense>
              ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 18 }}>
                {reviewsShown.map((r, ri) => {
                  const reviewProduct = products.find((p) => p.id === r.productId);
                  const reviewPhoto = mainPhotoFor(reviewProduct);
                  const goToProduct = () => { if (reviewProduct) openQuickView(reviewProduct.id); };
                  return (
                    <div
                      key={reviewsFx ? r.id + ":" + reviewTick : r.id}
                      className={reviewsFx ? "ttc-rvc ttc-rvc-" + reviewsFx : undefined}
                      style={{ background: COLORS.cream, borderRadius: 16, padding: 16, position: "relative", ...(reviewsFx ? { "--i": ri } : null) }}
                    >
                      <StarRating rating={r.rating} />
                      <p style={{ fontSize: 13, color: "#5A4E46", lineHeight: 1.5, margin: "8px 0", paddingRight: reviewPhoto ? 56 : 0 }}>
                        {r.comment}
                      </p>
                      <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.charcoal }}>{r.name}</div>
                      {/^https?:\/\//i.test(String(r.photo || "")) && (
                        <a href={r.photo} target="_blank" rel="noopener noreferrer" aria-label="Open the photo of this review"><img src={r.photo} alt={"Photo shared by " + r.name} loading="lazy" style={{ margin: "8px 0 4px", width: "100%", maxHeight: 150, borderRadius: 10, display: "block", objectFit: "cover" }} /></a>
                      )}
                      {reviewProduct ? (
                        <button
                          onClick={goToProduct}
                          style={{
                            fontSize: 11.5, color: COLORS.maroon, background: "none", border: "none",
                            padding: 0, textDecoration: "underline", cursor: "pointer",
                          }}
                        >
                          on {r.productName}
                        </button>
                      ) : (
                        <div style={{ fontSize: 11.5, color: "#7A6E64" }}>on {r.productName}</div>
                      )}
                      {reviewPhoto && (
                        <button
                          onClick={goToProduct}
                          aria-label={`View ${r.productName}`}
                          style={{
                            position: "absolute", bottom: 14, right: 14, width: 46, height: 46,
                            borderRadius: 10, overflow: "hidden", border: `1.5px solid ${COLORS.bgSoft}`,
                            padding: 0, background: "#fff", cursor: "pointer",
                          }}
                        >
                          <Img
                            sizes="46px"
                            widths={[92, 138]}
                            src={reviewPhoto}
                            alt={r.productName}
                            loading="lazy"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              )}
              {settings.reviewsMore.on && !stackLook && homepageReviews.length > reviewsFirst && (
                <div style={{ textAlign: "center", marginTop: 20 }}>
                  <button type="button" onClick={() => setReviewsExpanded((x) => !x)} aria-expanded={reviewsExpanded} style={{ border: `1.5px solid ${COLORS.navy}`, background: "transparent", color: COLORS.navy, borderRadius: 999, padding: "10px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                    {reviewsExpanded ? (settings.reviewsMore.less || "Show less") : (settings.reviewsMore.more || "Explore more")}
                  </button>
                </div>
              )}
              {settings.reviewsAdd.on && (
                <div style={{ textAlign: "center", marginTop: 22 }}>
                  <button type="button" onClick={() => setReviewWriteOpen(true)} style={{ border: `1.5px solid ${COLORS.maroon}`, background: "transparent", color: COLORS.maroon, borderRadius: 999, padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                    ✎ {settings.reviewsAdd.button || "Write a review"}
                  </button>
                </div>
              )}
            </div>
          </section>
  );

  // Home-page parts in the order set in Admin → Site settings → Home sections.
  // With that switch off, the original order is used (hero, shop, reviews).
  function renderSections() {
    const lazyBox = (node) => <Suspense fallback={null}>{node}</Suspense>;
    const withAds = (node, place) => (settings.ads.on && liveAds(settings.ads, place).length
      ? <>{node}<AdBanners cfg={settings.ads} place={place} t={t} /></> : node);
    const nodes = {
      hero: withAds(settings.guide.on && settings.guide.home ? <>{heroNode}<Suspense fallback={null}><GuideBar cfg={settings.guide} onOpen={openGuide} /></Suspense></> : heroNode, "underCarousel"),
      tiles: withAds(settings.categoryTiles.on ? lazyBox(
        <CategoryTiles
          categories={categories} products={products} title={t("tiles.title") === "Shop by category" ? settings.categoryTiles.title : t("tiles.title")}
          urlFor={urlForCategory} t={t} compact={!!settings.categoryTiles.compact}
          onSelect={(cat) => { selectCategory(cat); setTimeout(() => { const el = document.getElementById("shop"); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 50); }}
        />
      ) : null, "underTiles"),
      ads: settings.ads.on ? <AdBanners cfg={settings.ads} t={t} /> : null,
      bento: settings.bento.on ? lazyBox(<BentoStats items={arr(settings.bento.items)} />) : null,
      shop: withAds(settings.bundles.on ? <>
        <Suspense fallback={null}><ComboStrip cfg={settings.bundles} products={products} onAdd={(list) => list.forEach((p) => addToCart(p.id, 1, p.variants && p.variants[0] ? p.variants[0].name : null))} /></Suspense>{shopNode}</> : shopNode, "betweenProducts"),
      recent: settings.recent.on && recentIds.length > 0 ? lazyBox(
        <RecentStrip ids={recentIds} products={products} onOpen={(id) => openQuickView(id)} urlFor={urlForProduct} t={t} />
      ) : null,
      reviews: homepageReviews.length > 0 || settings.insta.on || settings.reviewsAdd.on ? <>{homepageReviews.length > 0 || settings.reviewsAdd.on ? reviewsNode : null}{settings.insta.on ? <Suspense fallback={null}><InstaStrip cfg={settings.insta} /></Suspense> : null}</> : null,
      games: settings.games.on && settings.games.where !== "footer" ? lazyBox(<GamesSection cfg={settings.games} onOpen={(k) => setGamesOpen(k)} />) : null,
      visit: settings.visit.on ? lazyBox(
        <VisitStore
          visit={{ ...settings.visit, address: String(settings.visit.address || "").trim() || (brandOn ? brandAddr.join("\n") : ""), title: t("visit.title") === "Visit our store" ? settings.visit.title : t("visit.title"), buttonLabel: t("visit.map") === "Open in Maps" ? settings.visit.buttonLabel : t("visit.map") }}
          timings={settings.timings} t={t} photos={brandOn && settings.brand.photos.on ? settings.brand.photos.list : null}
        />
      ) : null,
    };
    const custom = !!settings.sections.on;
    const order = custom ? normalizedOrder(settings.sections.order) : SECTION_IDS;
    const visible = settings.sections.visible || {};
    return order
      .filter((id) => nodes[id] && (!custom || visible[id] !== false))
      .map((id) => (
        <React.Fragment key={id}>
          {mo.sections.on && id !== "hero" ? <Reveal style={mo.sections.style}>{nodes[id]}</Reveal> : nodes[id]}
          <StitchDivider />
        </React.Fragment>
      ));
  }

  // Maintenance mode: the shop is replaced by a "back soon" page. Add
  // ?preview=1 to the address to look at the real shop meanwhile.
  const maintenancePreview = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("preview") === "1";
  if (settings.maintenance.on && !maintenancePreview) {
    return (
      <Suspense fallback={null}>
        <MaintenancePage title={settings.maintenance.title} message={settings.maintenance.message} whatsapp={WHATSAPP_NUMBER} />
      </Suspense>
    );
  }

  return (
    <SpeedContext.Provider value={speedCtx}>
    <div className={"ttc-bg-scroll" + (settings.pwa.safeArea ? " ttc-safe" : "") + (motionClasses ? " " + motionClasses : "")} dir={lang === "ur" ? "rtl" : undefined} style={{
      backgroundColor: COLORS.bg,
      backgroundImage: `url(${BG_SRC})`,
      backgroundSize: "cover",
      backgroundPosition: "top center",
      backgroundAttachment: "fixed",
      minHeight: "100%", color: COLORS.charcoal, fontFamily: "'Karla', sans-serif", position: "relative",
      overflowX: "hidden", width: "100%", ...tightVars, ...lookVars,
    }}>
      <style>{`
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
          .ttc-product-grid.ttc-grid-row { grid-template-columns: 1fr !important; }
        }
        /* Motion options (admin → Look & motion) — only used when switched on */
        @keyframes ttcCardIn { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
        @keyframes ttcOvFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ttcDrawerIn { from { transform: translateX(100%); } to { transform: none; } }
        @keyframes ttcPopIn { from { opacity: 0; transform: translateY(16px) scale(0.96); } to { opacity: 1; transform: none; } }
        .ttc-m-lift .ttc-product-card { transition: transform .25s ease, box-shadow .25s ease; }
        .ttc-m-lift .ttc-product-card:hover { transform: translateY(-5px); box-shadow: 0 12px 26px rgba(43,36,32,0.16); }
        .ttc-m-zoom .ttc-product-card img { transition: transform .5s ease; }
        .ttc-m-zoom .ttc-product-card:hover img { transform: scale(1.06); }
        .ttc-m-enter .ttc-product-card { animation: ttcCardIn .55s cubic-bezier(.22,.61,.36,1) both; animation-delay: calc(var(--i, 0) * 60ms); }
        .ttc-m-ov .ttc-backdrop { animation: ttcOvFade .25s ease both; }
        .ttc-m-ov .ttc-drawer-inner { animation: ttcDrawerIn .32s cubic-bezier(.22,.61,.36,1) both; }
        .ttc-m-ov .ttc-modal-inner { animation: ttcPopIn .3s cubic-bezier(.22,.61,.36,1) both; }
        @keyframes ttcRvRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
        @keyframes ttcRvFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ttcRvFlip { from { opacity: 0; transform: perspective(600px) rotateX(-70deg); } to { opacity: 1; transform: none; } }
        @keyframes ttcRvPop { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: none; } }
        .ttc-rvc { animation: ttcRvRise .6s cubic-bezier(.22,.61,.36,1) both; animation-delay: calc(var(--i, 0) * 90ms); }
        .ttc-rvc-fade { animation-name: ttcRvFade; }
        .ttc-rvc-flip { animation-name: ttcRvFlip; transform-origin: 50% 0; }
        .ttc-rvc-pop { animation-name: ttcRvPop; }
        @media (prefers-reduced-motion: reduce) {
          .ttc-m-enter .ttc-product-card, .ttc-m-ov .ttc-backdrop, .ttc-m-ov .ttc-drawer-inner, .ttc-m-ov .ttc-modal-inner, .ttc-rvc { animation: none !important; }
          .ttc-m-lift .ttc-product-card:hover { transform: none; }
        }
        /* "Safe-area padding" (admin → PWA): keep content out of an iPhone's notch and home bar */
        .ttc-safe header { padding-top: calc(10px + env(safe-area-inset-top)) !important; padding-left: calc(20px + env(safe-area-inset-left)) !important; padding-right: calc(20px + env(safe-area-inset-right)) !important; }
        .ttc-safe .ttc-fab-wa { bottom: calc(20px + env(safe-area-inset-bottom)) !important; right: calc(20px + env(safe-area-inset-right)) !important; }
        .ttc-safe .ttc-fab-top { bottom: calc(20px + env(safe-area-inset-bottom)) !important; left: calc(20px + env(safe-area-inset-left)) !important; }
        .ttc-safe .ttc-toast { bottom: calc(24px + env(safe-area-inset-bottom)) !important; }
        .ttc-safe .ttc-drawer-inner { padding-top: calc(22px + env(safe-area-inset-top)) !important; padding-bottom: calc(22px + env(safe-area-inset-bottom)) !important; }
        .ttc-safe .ttc-modal { padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left)) !important; }
        .ttc-safe footer { padding-bottom: calc(48px + env(safe-area-inset-bottom)) !important; }
        .ttc-safe .ttc-safe-pad { padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); }
      `}</style>

      {announceNode}
      {saleTimerNode}

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
              {activeCategory === "All" ? t("nav.categories") : activeCategory}
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
              style={{ background: "none", border: "none", color: settings.headerSocial.official ? "#C13584" : COLORS.navy, padding: 6, display: "flex", textDecoration: "none" }}
            >
              <Instagram size={18} />
            </a>
            <a
              href="https://www.facebook.com/twisttanlecrochet"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              style={{ background: "none", border: "none", color: settings.headerSocial.official ? "#1877F2" : COLORS.navy, padding: 6, display: "flex", textDecoration: "none" }}
            >
              <Facebook size={18} />
            </a>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              style={{ background: "none", border: "none", color: settings.headerSocial.official ? "#25D366" : COLORS.navy, padding: 6, display: "flex", textDecoration: "none" }}
            >
              <MessageCircle size={18} />
            </a>
          </div>

          {i18nOn && <LangToggle lang={lang} onChange={setLang} />}
          <InstallButton pwa={installPrompt} t={t} onIosHelp={() => setIosHelp(true)} />
          {wishButton}{ordersButton}

          <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            {searchOpen ? (settings.search.suggest ? searchBox(130) :
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
                placeholder={t("nav.search")}
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
            {t("nav.cart")} {cartCount > 0 && `(${cartCount})`}
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
              {t("nav.menu")}
            </button>
            {categoryMenuOpen && (
              <>
                <div onClick={() => setCategoryMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 34 }} />
                <div style={{
                  position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 35,
                  background: COLORS.cream, borderRadius: 14, boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                  padding: 8, minWidth: 190, maxHeight: 300, overflowY: "auto",
                }}>
                  {installPrompt.visible && (
                    <div style={{ padding: "4px 4px 8px" }}>
                      <InstallButton pwa={installPrompt} t={t} onIosHelp={() => { setCategoryMenuOpen(false); setIosHelp(true); }} compact />
                    </div>
                  )}
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
            <img src={CURRENT_LOGO} alt="Twist & Tangle Crochet logo" style={{ height: 30, width: "auto", objectFit: "contain" }} />
            <div className="ttc-mobile-title" style={{ lineHeight: 1.1 }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 11, color: COLORS.navy }}>Twist &amp; Tangle</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 11, color: COLORS.navy }}>Crochet (TTC)</div>
            </div>
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
            {i18nOn && <LangToggle lang={lang} onChange={setLang} compact />}
            {wishButton}{ordersButton}
            {searchOpen ? (settings.search.suggest ? searchBox(110) :
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
                placeholder={t("nav.search")}
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

      <main style={{ display: "contents" }}>{renderSections()}</main>

      {/* Footer */}
      {settings.ads.on && <AdBanners cfg={settings.ads} place="aboveFooter" t={t} />}
      {settings.reviewsAdd.on && settings.reviewsAdd.aboveFooter && (
        <div style={{ textAlign: "center", padding: "26px 16px 6px" }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 18, color: COLORS.maroonDark, marginBottom: 10 }}>{settings.reviewsAdd.footerText || "Bought from us? Tell us how it went"}</div>
          <button type="button" onClick={() => setReviewWriteOpen(true)} style={{ border: `1.5px solid ${COLORS.maroon}`, background: "transparent", color: COLORS.maroon, borderRadius: 999, padding: "11px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            ✎ {settings.reviewsAdd.button || "Write a review"}
          </button>
        </div>
      )}
      {settings.footer.on ? (
        <Suspense fallback={null}>
          <SiteFooter
            cfg={settings.footer} shopName={brandShop} logo={CURRENT_LOGO} categories={categories.filter((c) => c !== "All")} whatsapp={WHATSAPP_NUMBER}
            designedBy={designedByName ? { label: t("footer.designedBy"), name: designedByName, url: designedByHref } : null}
            footerLinks={footerLinks} guide={settings.guide.on && settings.guide.footer ? { label: settings.guide.buttonText, open: openGuide } : null} trackOn={!!settings.tracking.on} myOrders={settings.myOrders.on ? () => setMyOrdersOpen(true) : null} wishlist={settings.wishlist.on ? () => setWishOpen(true) : null} games={settings.games.on && settings.games.where !== "section" ? { label: settings.games.footerLabel || "Get Fun", open: () => setGamesOpen("") } : null} faq={settings.faq.on && settings.faq.footer ? { label: settings.faq.title, open: openFaq } : null} policies={policyLinks} onTrack={(no) => setTrackOpen(no || true)}
            onTop={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          />
        </Suspense>
      ) : (
      <footer style={{ padding: "36px 20px 48px", maxWidth: 1000, margin: "0 auto", textAlign: "center", position: "relative" }}>
        <div style={{ background: "rgba(251,246,240,0.82)", backdropFilter: "blur(4px)", borderRadius: "var(--ttc-panel-radius, 24px)", padding: "30px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontFamily: "'Caveat', cursive", fontSize: 24, color: COLORS.charcoal }}>
              {t("footer.handmade")}
            </span>
            <HandDrawnHeart size={18} />
          </div>
          <div style={{ fontSize: 13, color: COLORS.charcoal, marginBottom: 22 }}>{t("footer.loop")}</div>

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
              {t("footer.contact")}
            </div>
            <LeafSprig side="right" />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", maxWidth: 320, margin: "0 auto 22px" }}>
            <a href="https://www.instagram.com/twisttanglecrochet/" target="_blank" rel="noopener noreferrer"
               style={{ display: "flex", alignItems: "center", gap: 10, color: COLORS.charcoal, background: "none", border: "none", fontSize: 14, textDecoration: "none" }}>
              <span style={{ background: settings.footer.officialIcons ? "#C13584" : COLORS.navy, color: "#fff", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Instagram size={14} />
              </span>
              twisttanglecrochet
            </a>
            <a href="https://www.facebook.com/twisttanlecrochet" target="_blank" rel="noopener noreferrer"
               style={{ display: "flex", alignItems: "center", gap: 10, color: COLORS.charcoal, background: "none", border: "none", fontSize: 14, textDecoration: "none" }}>
              <span style={{ background: settings.footer.officialIcons ? "#1877F2" : COLORS.navy, color: "#fff", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Facebook size={14} />
              </span>
              twisttanglecrochet
            </a>
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer"
               style={{ display: "flex", alignItems: "center", gap: 10, color: COLORS.charcoal, background: "none", border: "none", fontSize: 14, textDecoration: "none" }}>
              <span style={{ background: settings.footer.officialIcons ? "#25D366" : COLORS.navy, color: "#fff", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MessageCircle size={14} />
              </span>
              0302 7609899
            </a>
          </div>

          <div style={{ fontSize: 12, color: "#7A6E64", marginBottom: 22 }}>{t("footer.location")}</div>
          {settings.guide.on && settings.guide.footer && <button type="button" onClick={openGuide} style={{ background: "none", border: "none", color: COLORS.navy, fontWeight: 700, fontSize: 13, textDecoration: "underline", marginBottom: 22, marginRight: 14 }}>{settings.guide.buttonText}</button>}
          {settings.faq.on && settings.faq.footer && <button type="button" onClick={openFaq} style={{ background: "none", border: "none", color: COLORS.navy, fontWeight: 700, fontSize: 13, textDecoration: "underline", marginBottom: 22, marginRight: 14 }}>{settings.faq.title}</button>}
          {policyLinks.map((l) => <button key={l.key} type="button" onClick={() => openPolicy(l.key)} style={{ background: "none", border: "none", color: COLORS.navy, fontWeight: 700, fontSize: 13, textDecoration: "underline", marginBottom: 22, marginRight: 14 }}>{l.label}</button>)}
          {settings.myOrders.on && <button type="button" onClick={() => setMyOrdersOpen(true)} style={{ background: "none", border: "none", color: COLORS.navy, fontWeight: 700, fontSize: 13, textDecoration: "underline", marginBottom: 22, marginRight: 14 }}>My orders</button>}
          {settings.games.on && settings.games.where !== "section" && <button type="button" onClick={() => setGamesOpen("")} style={{ background: "none", border: "none", color: COLORS.navy, fontWeight: 700, fontSize: 13, textDecoration: "underline", marginBottom: 22, marginRight: 14 }}>{settings.games.footerLabel || "Get Fun"}</button>}
          {settings.wishlist.on && <button type="button" onClick={() => setWishOpen(true)} style={{ background: "none", border: "none", color: COLORS.navy, fontWeight: 700, fontSize: 13, textDecoration: "underline", marginBottom: 22, marginRight: 14 }}>My wishlist</button>}
          {settings.tracking.on && <button type="button" onClick={() => setTrackOpen(true)} style={{ background: "none", border: "none", color: COLORS.navy, fontWeight: 700, fontSize: 13, textDecoration: "underline", marginBottom: 22 }}>Track your order</button>}

          {timingsText && (
            <div style={{ fontSize: 12.5, color: "#5A4E46", marginBottom: 22, lineHeight: 1.6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 700, marginBottom: 2 }}>
                <Clock size={14} /> {t("footer.hours")}
              </div>
              {timingsText.split("\n").map((line, i) => <div key={i}>{line}</div>)}
            </div>
          )}

          {footerLinks.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 18px", marginBottom: 22 }}>
              {footerLinks.map((l, i) => (
                <a
                  key={i}
                  href={l.href}
                  target={/^https?:/i.test(l.href) ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  style={{ fontSize: 13, color: COLORS.navy, fontWeight: 700, textDecoration: "underline" }}
                >
                  {l.label}
                </a>
              ))}
            </div>
          )}

          <div style={{ borderTop: `1px solid ${COLORS.bgSoft}`, paddingTop: 22, display: "flex", justifyContent: "center", gap: 30 }}>
            {[
              { emoji: "🧶", label: t("footer.b1a"), sub: t("footer.b1b") },
              { emoji: "❤️", label: t("footer.b2a"), sub: t("footer.b2b") },
              { emoji: "🎁", label: t("footer.b3a"), sub: t("footer.b3b") },
            ].map((b) => (
              <div key={b.label} style={{ maxWidth: 100 }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{b.emoji}</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 12, color: COLORS.navy }}>{b.label}</div>
                <div style={{ fontSize: 10.5, color: "#7A6E64" }}>{b.sub}</div>
              </div>
            ))}
          </div>

          {designedByName && (
            <div style={{ marginTop: 18, fontSize: 11.5, color: "#7A6E64" }}>
              {t("footer.designedBy")}{" "}
              {designedByHref ? (
                <a href={designedByHref} target="_blank" rel="noopener noreferrer" style={{ color: COLORS.navy, fontWeight: 700 }}>{designedByName}</a>
              ) : (
                <strong style={{ color: COLORS.charcoal }}>{designedByName}</strong>
              )}
            </div>
          )}
        </div>
      </footer>
      )}

      {/* Floating WhatsApp button — always reachable while browsing, so a
          customer with a question doesn't have to hunt for the footer link.
          Hidden while the cart drawer, checkout, or quick view is open so it
          never floats on top of those and blocks anything underneath. */}
      {!drawerOpen && !checkoutOpen && !quickViewId && (
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ttc-fab-wa"
          aria-label="Chat with us on WhatsApp"
          style={{
            position: "fixed", right: 20, bottom: 20, zIndex: 45,
            width: 54, height: 54, borderRadius: "50%",
            background: "#25D366", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 6px 18px rgba(0,0,0,0.25)", textDecoration: "none",
          }}
        >
          <MessageCircle size={26} />
        </a>
      )}

      {/* "Back to top" button — same hide-behind-overlays rule as the
          WhatsApp button, on the opposite corner so the two never collide. */}
      {showBackToTop && !drawerOpen && !checkoutOpen && !quickViewId && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="ttc-fab-top"
          aria-label="Back to top"
          style={{
            position: "fixed", ...(settings.footer.floatRight ? { right: 25, bottom: 86 } : { left: 20, bottom: 20 }), zIndex: 45,
            width: 48, height: 48, borderRadius: "50%",
            background: COLORS.navy, color: COLORS.cream, border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 6px 18px rgba(0,0,0,0.25)", cursor: "pointer",
          }}
        >
          <ArrowUp size={22} />
        </button>
      )}

      {/* "Added to cart" confirmation toast */}
      {cartToast && (
        <div
          className="ttc-toast"
          style={{
            position: "fixed", left: "50%", bottom: 24, transform: "translateX(-50%)",
            zIndex: 60, background: COLORS.maroonDark, color: COLORS.cream,
            borderRadius: 999, padding: "10px 20px", fontSize: 13.5, fontWeight: 700,
            display: "flex", alignItems: "center", gap: 8, boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
            pointerEvents: "none",
          }}
        >
          <ShoppingBag size={15} /> {t("cart.added")}
        </div>
      )}

      {/* Cart drawer */}
      {drawerOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 40, display: "flex", justifyContent: "flex-end" }}>
          <div
            className="ttc-backdrop"
            onClick={() => setDrawerOpen(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(43,36,32,0.4)" }}
          />
          <div className="ttc-drawer-inner" style={{
            position: "relative", width: 340, maxWidth: "88vw", background: COLORS.cream,
            height: "100%", padding: 22, display: "flex", flexDirection: "column",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 20, color: COLORS.maroonDark }}>
                {t("cart.title")}
              </span>
              <button onClick={() => setDrawerOpen(false)} style={{ background: "none", border: "none", color: COLORS.charcoal }}>
                <X size={20} />
              </button>
            </div>

            {cartItems.length === 0 ? (
              <p style={{ color: "#7A6E64", fontSize: 14 }}>{t("cart.empty")}</p>
            ) : (
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
                {cartItems.map((i) => (
                  <div key={i.cartKey} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ width: 50, height: 50, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "#fff" }}>
                      {(i.variantPhoto || mainPhotoFor(i)) ? (
                        <Img
                          sizes="50px"
                          widths={[100, 150]}
                          src={i.variantPhoto || mainPhotoFor(i)}
                          alt={i.name}
                          loading="lazy"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <ProductSwatch colors={i.swatch} real={i.real} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{i.name}</div>
                      {i.variantName && (
                        <div style={{ fontSize: 11.5, color: "#7A6E64" }}>{i.variantName}</div>
                      )}
                      <div style={{ fontSize: 12, color: COLORS.maroon }}>Rs{i.price}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button onClick={() => changeQty(i.cartKey, -1)} style={{ background: COLORS.bgSoft, border: "none", borderRadius: 6, width: 22, height: 22 }}>
                        <Minus size={12} />
                      </button>
                      <span style={{ fontSize: 13, width: 16, textAlign: "center" }}>{i.qty}</span>
                      <button onClick={() => changeQty(i.cartKey, 1)} style={{ background: COLORS.bgSoft, border: "none", borderRadius: 6, width: 22, height: 22 }}>
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ borderTop: `1px solid ${COLORS.bgSoft}`, paddingTop: 14, marginTop: 14 }}>
              <FreeDeliveryBar threshold={settings.freeDelivery.on ? settings.freeDelivery.threshold : 0} subtotal={total} t={t} />
              {settings.cartPlus.giftOn && Number(settings.cartPlus.giftOver) > 0 && cartItems.length > 0 && (
                <div style={{ background: subtotal >= Number(settings.cartPlus.giftOver) ? "#E8F6EC" : "#FBF0D4", border: "1px solid " + (subtotal >= Number(settings.cartPlus.giftOver) ? "#BFE3CB" : "#E8CF8C"), borderRadius: 10, padding: "8px 12px", fontSize: 12.5, marginBottom: 12, color: "#3E3A36" }}>
                  🎁 {subtotal >= Number(settings.cartPlus.giftOver) ? `${settings.cartPlus.giftText}: yours with this order!` : `Add Rs${Number(settings.cartPlus.giftOver) - subtotal} more to get: ${settings.cartPlus.giftText}`}
                </div>
              )}
              {settings.cartPlus.suggest && cartItems.length > 0 && <Suspense fallback={null}><CartSuggest cartItems={cartItems} products={products} onAdd={(p) => addToCart(p.id, 1, p.variants && p.variants[0] ? p.variants[0].name : null)} /></Suspense>}
              {cartItems.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  {appliedPromo ? (
                    <>
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
                  {promoMore()}
                  </>
                  ) : (
                    <div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          value={promoInput}
                          onChange={(e) => { setPromoInput(e.target.value); setPromoError(""); }}
                          placeholder={t("cart.promo")}
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
                          {t("cart.apply")}
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
                <span>{t("cart.subtotal")}</span>
                <span>Rs{subtotal}</span>
              </div>
              {bundleDiscount(cartItems) > 0 && <div style={{ fontSize: 12, color: "#1B6B3A", fontWeight: 700, marginBottom: 4 }}>🎁 Combo price applied</div>}
              {discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: COLORS.maroon, marginBottom: 4 }}>
                  <span>{t("cart.discount")}</span>
                  <span>-Rs{discount}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
                <span>{t("cart.total")}</span>
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
                {t("cart.checkout")}
              </button>
            </div>
          </div>
        </div>
      )}

      {settings.ads.on && <AdPopup cfg={settings.ads} t={t} />}

      {gamesOpen !== null && settings.games.on && (
        <Suspense fallback={null}><GamesModal cfg={settings.games} products={products} initial={gamesOpen} onClose={() => setGamesOpen(null)} onOpenProduct={(id) => openQuickView(id)} /></Suspense>
      )}
      {reviewWriteOpen && (
        <Suspense fallback={null}>
          <ReviewWriter cfg={settings.reviewsAdd} products={products} onClose={() => setReviewWriteOpen(false)}
            save={(d) => addDoc(collection(db, "reviews"), { ...d, approved: false, createdAt: serverTimestamp() })} />
        </Suspense>
      )}
      {wishOpen && (
        <Suspense fallback={null}>
          <WishlistPanel
            ids={wishIds} products={products} t={t} reminders={!!settings.wishlist.reminders}
            onClose={() => setWishOpen(false)}
            onOpen={(id) => openQuickView(id)}
            onAdd={(p) => addToCart(p.id, 1, p.variants && p.variants[0] ? p.variants[0].name : null)}
            onRemove={(id) => wishApi.remove(id)}
          />
        </Suspense>
      )}

      {iosHelp && (
        <div onClick={() => setIosHelp(false)} style={{ position: "fixed", left: 16, right: 16, bottom: 24, zIndex: 70, background: COLORS.maroonDark, color: COLORS.cream, borderRadius: 14, padding: "14px 16px", fontSize: 13.5, lineHeight: 1.5, textAlign: "center", boxShadow: "0 6px 20px rgba(0,0,0,0.25)" }}>
          {t("install.ios")}
        </div>
      )}

      {/* Quick view modal */}
      {quickViewId && (() => {
        const p = products.find((pr) => pr.id === quickViewId);
        if (!p) return null;
        const fullPage = !!settings.productPage.full;
        const qvSelectedIndex = variantIndex[p.id] ?? 0;
        const qvSelectedVariant = p.variants ? p.variants[qvSelectedIndex] : null;
        return (
          <div className={"ttc-modal" + (fullPage ? " ttc-qv-page" : "")} style={fullPage
            ? { position: "fixed", inset: 0, zIndex: 55, display: "block", overflowY: "auto", background: COLORS.bg, padding: "0 16px 40px" }
            : { position: "fixed", inset: 0, zIndex: 55, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            {!fullPage && <div className="ttc-backdrop" onClick={() => closeQuickView()} style={{ position: "absolute", inset: 0, background: "rgba(43,36,32,0.55)" }} />}
            {fullPage && (
              <div style={{ position: "sticky", top: 0, zIndex: 5, margin: "0 -16px", padding: "10px 16px", background: "rgba(251,246,240,0.94)", backdropFilter: "blur(6px)", borderBottom: `1px solid ${COLORS.bgSoft}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <button type="button" onClick={() => closeQuickView()} aria-label="Back to shop" style={{ display: "flex", alignItems: "center", gap: 4, background: "transparent", border: `1.3px solid ${COLORS.navy}`, color: COLORS.navy, borderRadius: 999, padding: "7px 14px 7px 9px", fontSize: 13, fontWeight: 700 }}>
                  <ChevronLeft size={16} /> Back
                </button>
                <button type="button" onClick={() => closeQuickView()} aria-label="Home" style={{ background: "none", border: "none", padding: 0, display: "flex" }}><Logo size={36} scale={1} /></button>
                <button type="button" onClick={() => { closeQuickView(); setDrawerOpen(true); }} aria-label="Cart" style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.navy, color: COLORS.cream, border: "none", borderRadius: 999, padding: "8px 14px", fontSize: 13, fontWeight: 700 }}>
                  <ShoppingBag size={16} /> {cartCount > 0 ? `(${cartCount})` : ""}
                </button>
              </div>
            )}
            {fullPage && (
              <nav aria-label="Breadcrumb" style={{ maxWidth: 1040, margin: "0 auto", padding: "16px 4px 12px", fontSize: 12.5, color: "#7A6E64" }}>
                <button type="button" onClick={() => closeQuickView()} style={{ background: "none", border: "none", color: COLORS.maroon, fontWeight: 700, cursor: "pointer", padding: 0, font: "inherit" }}>Home</button>
                {" / "}
                <button type="button" onClick={() => { closeQuickView(); selectCategory(p.category); goToShop(); }} style={{ background: "none", border: "none", color: COLORS.maroon, fontWeight: 700, cursor: "pointer", padding: 0, font: "inherit" }}>{p.category}</button>
                {" / "}<span>{p.name}</span>
              </nav>
            )}
            <div className="ttc-modal-inner" style={fullPage ? {
              position: "relative", background: COLORS.cream, borderRadius: 20, width: 1040, maxWidth: "100%", margin: "0 auto",
            } : {
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
                    <VariantPicker
                      variants={p.variants}
                      name={p.name}
                      index={qvSelectedIndex}
                      onSelect={(i) => selectVariant(p.id, i)}
                    />
                  ) : p.photos ? (
                    <ProductPhotoGallery key={p.id} photos={p.photos} name={p.name} autoPlay />
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
                  {settings.wishlist.on && (
                    <button
                      onClick={() => wishApi.toggle(p.id)}
                      aria-pressed={wishApi.has(p.id)}
                      style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: COLORS.maroon, fontSize: 12.5, fontWeight: 700, padding: 0, marginBottom: 12 }}
                    >
                      <Heart size={15} fill={wishApi.has(p.id) ? COLORS.maroon : "none"} />
                      {wishApi.has(p.id) ? t("wish.remove") : t("wish.add")}
                    </button>
                  )}
                  <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 21, color: COLORS.maroon, marginBottom: 14 }}>
                    Rs{p.price}
                    {settings.saveBadge && settings.saveBadge.showOld && Number(p.oldPrice) > Number(p.price) && <s style={{ fontSize: 15, fontWeight: 500, color: "#8A7E74", marginLeft: 10 }}>Rs{p.oldPrice}</s>}
                    {saveText(p, settings.saveBadge) && <span style={{ fontFamily: "inherit", fontSize: 12, fontWeight: 700, background: COLORS.maroon, color: COLORS.cream, borderRadius: 999, padding: "3px 10px", marginLeft: 10, verticalAlign: "middle" }}>{saveText(p, settings.saveBadge)}</span>}
                  </div>
                  {settings.productPage.tabs && String(p.shortLine || "").trim() && (
                    <div style={{ fontSize: 13, color: "#7A6E64", margin: "-8px 0 12px" }}>{p.shortLine}</div>
                  )}
                  {settings.productPage.tabs ? (
                    <Suspense fallback={null}><ProductTabs product={p} variant={qvSelectedVariant} t={t} /></Suspense>
                  ) : (
                    <p style={{ fontSize: 13.5, color: "#5A4E46", lineHeight: 1.6, marginBottom: 20 }}>
                      {p.desc}
                    </p>
                  )}
                  {(settings.productPage.sizes || settings.productPage.colours || settings.productPage.includes) && (
                    <Suspense fallback={null}><ProductMeta product={p} cfg={settings.productPage} /></Suspense>
                  )}

                  {settings.cardBadges && settings.cardBadges.readyOn && p.readyIn && <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.maroonDark, marginBottom: 12 }}>⏱ {String(p.readyIn).slice(0, 60)}</div>}
                  {sizeGuideFor(p) && (
                    <button type="button" onClick={() => setSizeGuideOpen(true)} style={{ background: "none", border: "none", padding: 0, marginBottom: 14, color: COLORS.navy, fontWeight: 700, fontSize: 13, textDecoration: "underline", cursor: "pointer" }}>📏 {settings.sizeGuide.label || "Size guide"}</button>
                  )}
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
                    <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.charcoal, marginBottom: 8 }}>{t("checkout.qty")}</div>
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
                      onClick={() => { addToCart(p.id, quickViewQty, qvSelectedVariant ? qvSelectedVariant.name : null); closeQuickView(); setDrawerOpen(true); }}
                      style={{
                        width: "100%", background: "transparent", color: COLORS.navy,
                        border: `1.5px solid ${COLORS.navy}`, borderRadius: 999, padding: "12px 0",
                        fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      }}
                    >
                      <ShoppingBag size={16} /> {t("shop.addToCart")}
                    </button>
                    <button
                      onClick={() => { buyNow(p.id, quickViewQty, qvSelectedVariant ? qvSelectedVariant.name : null); closeQuickView(); }}
                      style={{
                        width: "100%", background: COLORS.navy, color: COLORS.cream,
                        border: "none", borderRadius: 999, padding: "12px 0",
                        fontSize: 14, fontWeight: 700,
                      }}
                    >
                      {t("shop.buyNow")}
                    </button>
                    {settings.productPage.notify && p.tag === "Sold Out" && (
                      <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi! Please let me know when "${p.name}" is back in stock.`)}`} target="_blank" rel="noopener noreferrer"
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#25D366", color: "#fff", borderRadius: 999, padding: "12px 0", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
                        <MessageCircle size={16} /> Notify me when it's back
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ padding: "0 24px 26px" }}>
                <ReviewsSection productId={p.id} productName={p.name} reviews={reviewsByProduct[p.id] || []} photosOn={!!(settings.reviewPhotos && settings.reviewPhotos.on)} />
              </div>
              {settings.productPage.related && (() => {
                const rel = products.filter((x) => x.id !== p.id && x.category === p.category && x.photos && x.photos[0]).slice(0, 4);
                if (!rel.length) return null;
                return (
                  <div style={{ padding: "0 24px 28px" }}>
                    <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 19, color: COLORS.maroonDark, marginBottom: 12 }}>You may also like</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 12 }}>
                      {rel.map((x) => (
                        <button key={x.id} type="button" onClick={() => { openQuickView(x.id); const el = document.querySelector(".ttc-qv-page, .ttc-modal-inner"); if (el) el.scrollTop = 0; window.scrollTo(0, 0); }} style={{ background: "#fff", border: `1px solid ${COLORS.bgSoft}`, borderRadius: 12, padding: 8, textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}>
                          <img src={x.photos[0]} alt={x.name} loading="lazy" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 8, display: "block" }} />
                          <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 6, color: COLORS.charcoal }}>{x.name}</div>
                          <div style={{ fontSize: 12.5, color: COLORS.maroon, fontWeight: 800 }}>Rs{x.price}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        );
      })()}

      {/* Checkout modal */}
      {myOrdersOpen && settings.myOrders.on && <Suspense fallback={null}><MyOrders onClose={() => setMyOrdersOpen(false)} onTrack={(no) => { setMyOrdersOpen(false); setTrackOpen(no || true); }} /></Suspense>}
      {sizeGuideOpen && settings.sizeGuide && settings.sizeGuide.on && <Suspense fallback={null}><SizeGuide cfg={settings.sizeGuide} onClose={() => setSizeGuideOpen(false)} /></Suspense>}
      {policyOpen && settings.policies && settings.policies.on && <Suspense fallback={null}><PolicyPage kind={policyOpen} cfg={settings.policies} whatsapp={WHATSAPP_NUMBER} onClose={closePolicy} /></Suspense>}
      {faqOpen && settings.faq.on && <Suspense fallback={null}><FaqPage cfg={settings.faq} whatsapp={WHATSAPP_NUMBER} onClose={closeFaq} /></Suspense>}
      {guideOpen && settings.guide.on && <Suspense fallback={null}><GuidePage cfg={settings.guide} whatsapp={WHATSAPP_NUMBER} onClose={closeGuide} /></Suspense>}
      {trackOpen && <Suspense fallback={null}><TrackOrder initial={typeof trackOpen === "string" ? trackOpen : ""} whatsapp={WHATSAPP_NUMBER} onClose={() => { setTrackOpen(false); try { const u = new URL(window.location.href); if (u.searchParams.has("track")) { u.searchParams.delete("track"); window.history.replaceState({}, "", u.pathname + u.search); } } catch (e) {} }} /></Suspense>}
      {checkoutOpen && (
        <div className="ttc-modal" style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div className="ttc-backdrop" onClick={closeCheckout} style={{ position: "absolute", inset: 0, background: "rgba(43,36,32,0.5)" }} />
          <div className="ttc-modal-inner" style={{ position: "relative", background: COLORS.cream, borderRadius: 18, padding: 26, width: 380, maxWidth: "100%", maxHeight: "calc(100vh - 32px)", overflowY: "auto" }}>
            {placedOrder ? (
              <div style={{ textAlign: "center", padding: "10px 4px" }} role="status">
                <CheckCircle2 size={48} color={COLORS.maroon} style={{ margin: "0 auto 10px" }} />
                <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 22, color: COLORS.maroonDark, marginBottom: 6 }}>
                  Thank you, {placedOrder.firstName}!
                </div>
                <div style={{ fontSize: 13.5, color: COLORS.charcoal, marginBottom: 14 }}>Your order has been placed.</div>
                <div style={{ background: COLORS.bgSoft, borderRadius: 12, padding: "12px 14px", marginBottom: 14, fontSize: 13.5, lineHeight: 1.7 }}>
                  <div>Order number: <strong style={{ letterSpacing: 0.5 }}>{placedOrder.orderNo}</strong></div>
                  <div>{placedOrder.itemCount} {placedOrder.itemCount === 1 ? "item" : "items"} · <strong>Rs{placedOrder.total}</strong></div>
                </div>
                <p style={{ fontSize: 13, color: "#5A5048", lineHeight: 1.55, marginBottom: 18 }}>
                  We'll call or WhatsApp you on <strong>{placedOrder.phone}</strong> to confirm your order, delivery charges and payment.
                </p>
                {waAuto && (
                  <div style={{ background: "#E8F6EC", border: "1px solid #BFE3CB", borderRadius: 12, padding: 12, marginBottom: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1B6B3A", marginBottom: 6 }}>Last step: send your order on WhatsApp</div>
                    <div style={{ fontSize: 12.5, color: "#3E5A47", marginBottom: 10 }}>
                      Your order details are already written. {waCountdown ? `Opening WhatsApp in ${waCountdown}…` : "Tap the button to send."}
                    </div>
                    <a href={waLink} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#25D366", color: "#fff", borderRadius: 999, padding: "11px 0", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
                      <MessageCircle size={16} /> Send order on WhatsApp
                    </a>
                  </div>
                )}
                {settings.tracking.on && (
                  <button onClick={() => { const no = placedOrder.orderNo; closeCheckout(); setTrackOpen(no); }} style={{ width: "100%", background: "transparent", color: COLORS.maroon, border: `1.3px solid ${COLORS.maroon}`, borderRadius: 999, padding: "11px 0", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
                    Track this order
                  </button>
                )}
                <button
                  onClick={closeCheckout}
                  style={{ width: "100%", background: COLORS.maroon, color: COLORS.cream, border: "none", borderRadius: 999, padding: "12px 0", fontSize: 14, fontWeight: 700 }}
                >
                  Continue shopping
                </button>
              </div>
            ) : (<>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 19, color: COLORS.maroonDark }}>
                {t("checkout.title")}
              </span>
              <button onClick={closeCheckout} style={{ background: "none", border: "none", color: COLORS.charcoal }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ marginBottom: 14 }}>
              {checkoutItems.map((i) => (
                <div key={i.cartKey || `${i.id}-${i.variantName || ""}`} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13, padding: "7px 0", borderBottom: `1px solid ${COLORS.bgSoft}` }}>
                  <span>{i.name}{i.variantName ? ` (${i.variantName})` : ""} x{i.qty}</span>
                  <span style={{ whiteSpace: "nowrap" }}>Rs{i.price * i.qty}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "7px 0", borderBottom: `1px solid ${COLORS.bgSoft}` }}>
                <span>{t("checkout.delivery")}</span>
                <span style={{ color: "#7A6E64" }}>{freeDeliveryApplies ? t("delivery.freeLabel") : DELIVERY_LABEL}</span>
              </div>
            </div>
            {["name", "phone", "address"].map((field) => {
              const phoneError = field === "phone" && phoneTouched && form.phone.trim() && !phoneValid;
              return (
                <div key={field} style={{ marginBottom: 10 }}>
                  <label htmlFor={`co_${field}`} style={{ display: "block", fontSize: 12, color: "#5A5048", marginBottom: 4 }}>
                    {t(field === "name" ? "checkout.name" : field === "phone" ? "checkout.phone" : "checkout.address")}
                  </label>
                  <input
                    id={`co_${field}`}
                    placeholder={field === "name" ? "Ali Raza" : field === "phone" ? "0300 1234567" : "House 14, Street 2, Gulberg"}
                    value={form[field]}
                    maxLength={field === "name" ? 80 : field === "phone" ? 20 : 300}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    onBlur={field === "phone" ? () => setPhoneTouched(true) : undefined}
                    type={field === "phone" ? "tel" : "text"}
                    inputMode={field === "phone" ? "tel" : undefined}
                    autoComplete={field === "name" ? "name" : field === "phone" ? "tel" : "street-address"}
                    aria-label={t(field === "name" ? "checkout.name" : field === "phone" ? "checkout.phone" : "checkout.address")}
                    aria-invalid={phoneError ? "true" : undefined}
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: 10,
                      border: `1px solid ${phoneError ? "#C0392B" : COLORS.bgSoft}`, fontSize: 13, background: COLORS.bg,
                    }}
                  />
                  {phoneError && (
                    <div style={{ fontSize: 11.5, color: "#C0392B", marginTop: 4 }}>
                      {strictOn ? "This doesn't look like a real Pakistani mobile number. Example: 0300 1234567 or +92 300 1234567." : "Please enter a Pakistani mobile number, e.g. 0300 1234567 or +92 300 1234567."}
                    </div>
                  )}
                </div>
              );
            })}
            {betterOn && (() => {
              const err = (k) => touched[k] && betterErrors[k];
              const box = (k, label, props = {}) => (
                <div style={{ marginBottom: 10 }}>
                  <label htmlFor={`co_${k}`} style={{ display: "block", fontSize: 12, color: "#5A5048", marginBottom: 4 }}>{label}</label>
                  <input id={`co_${k}`} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} onBlur={() => setTouched((x) => ({ ...x, [k]: true }))}
                    aria-invalid={err(k) ? "true" : undefined} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${err(k) ? "#C0392B" : COLORS.bgSoft}`, fontSize: 13, background: COLORS.bg }} {...props} />
                  {err(k) && <div style={{ fontSize: 11.5, color: "#C0392B", marginTop: 4 }}>{betterErrors[k]}</div>}
                </div>
              );
              return (
                <>
                  {touched.name && betterErrors.name && <div style={{ fontSize: 11.5, color: "#C0392B", margin: "-6px 0 10px" }}>{betterErrors.name}</div>}
                  {touched.address && betterErrors.address && <div style={{ fontSize: 11.5, color: "#C0392B", margin: "-6px 0 10px" }}>{betterErrors.address}</div>}
                  <div style={{ fontSize: 11.5, color: "#8A6A99", margin: "-4px 0 10px", lineHeight: 1.45 }}>Complete address with plot / office / house number, street and area name. Example: House 01, Block 01, Street 01, Bahria Town.</div>
                  {box("apt", "Apartment, floor, landmark (optional)", { autoComplete: "address-line2" })}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {strictOn && !cityFree ? (() => {
                      const q = form.city.trim().toLowerCase();
                      const shown = (q ? PK_CITIES.filter((c) => c.toLowerCase().includes(q)) : PK_CITIES).slice(0, 40);
                      const pick = (c) => { setForm((f) => ({ ...f, city: c })); setCityOpen(false); setTouched((x) => ({ ...x, city: true })); };
                      return (
                        <div style={{ marginBottom: 10, position: "relative" }}>
                          <label htmlFor="co_city" style={{ display: "block", fontSize: 12, color: "#5A5048", marginBottom: 4 }}>City</label>
                          <input id="co_city" value={form.city} role="combobox" aria-expanded={cityOpen} aria-controls="co_city_list" aria-autocomplete="list" autoComplete="off" placeholder="Search your city"
                            onChange={(e) => { setForm({ ...form, city: e.target.value }); setCityOpen(true); }}
                            onFocus={() => setCityOpen(true)}
                            onBlur={() => setTimeout(() => { setCityOpen(false); setTouched((x) => ({ ...x, city: true })); }, 150)}
                            onKeyDown={(e) => { if (e.key === "Enter" && cityOpen && shown.length) { e.preventDefault(); pick(shown[0]); } else if (e.key === "Escape") setCityOpen(false); }}
                            aria-invalid={err("city") ? "true" : undefined}
                            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${err("city") ? "#C0392B" : COLORS.bgSoft}`, fontSize: 13, background: COLORS.bg }} />
                          {cityOpen && (
                            <ul id="co_city_list" role="listbox" style={{ position: "absolute", left: 0, right: 0, top: "100%", zIndex: 30, margin: "2px 0 0", padding: 4, listStyle: "none", maxHeight: 220, overflowY: "auto", background: "#fff", border: `1px solid ${COLORS.bgSoft}`, borderRadius: 10, boxShadow: "0 8px 20px rgba(0,0,0,.14)" }}>
                              {shown.map((c) => (
                                <li key={c} role="option" aria-selected={c === form.city} onMouseDown={(e) => { e.preventDefault(); pick(c); }} style={{ padding: "9px 10px", fontSize: 13, cursor: "pointer", borderRadius: 8 }}>{c}</li>
                              ))}
                              {!shown.length && <li style={{ padding: "9px 10px", fontSize: 12.5, color: "#7A6E64" }}>No city found.</li>}
                              <li role="option" onMouseDown={(e) => { e.preventDefault(); setCityFree(true); setCityOpen(false); setForm((f) => ({ ...f, city: "" })); }} style={{ padding: "9px 10px", fontSize: 12.5, cursor: "pointer", color: COLORS.maroon, fontWeight: 700, borderTop: `1px solid ${COLORS.bgSoft}` }}>My city is not listed</li>
                            </ul>
                          )}
                          {err("city") && <div style={{ fontSize: 11.5, color: "#C0392B", marginTop: 4 }}>{betterErrors.city}</div>}
                        </div>
                      );
                    })() : box("city", strictOn ? "City (type it)" : "City", { autoComplete: "address-level2" })}
                    {box("postal", "Postal code (optional)", { inputMode: "numeric", autoComplete: "postal-code" })}
                  </div>
                  {box("email", "Email (optional)", { type: "email", inputMode: "email", autoComplete: "email" })}
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#5A5048", marginBottom: 12 }}>
                    <input type="checkbox" checked={saveInfo} onChange={(e) => setSaveInfo(e.target.checked)} style={{ width: 16, height: 16, accentColor: COLORS.maroon }} /> Save this information for next time
                  </label>
                </>
              );
            })()}
            {/* Honeypot: hidden from people, but spam bots fill it in. */}
            <input
              type="text"
              name="company"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{ position: "absolute", left: -9999, width: 1, height: 1, opacity: 0 }}
            />
            <label htmlFor="co_payment" style={{ display: "block", fontSize: 12, color: "#5A5048", marginBottom: 4 }}>{t("checkout.payment")}</label>
            <select
              id="co_payment"
              value={form.payment}
              onChange={(e) => setForm({ ...form, payment: e.target.value })}
              style={{
                width: "100%", padding: "10px 12px", marginBottom: 10, borderRadius: 10,
                border: `1px solid ${COLORS.bgSoft}`, fontSize: 13, background: COLORS.bg, color: COLORS.charcoal,
              }}
            >
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <label htmlFor="co_notes" style={{ display: "block", fontSize: 12, color: "#5A5048", marginBottom: 4 }}>{t("checkout.notes")}</label>
            <textarea
              id="co_notes"
              placeholder="Colour preference, gift message, etc."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              style={{
                width: "100%", padding: "10px 12px", marginBottom: 14, borderRadius: 10,
                border: `1px solid ${COLORS.bgSoft}`, fontSize: 13, background: COLORS.bg, resize: "none",
              }}
            />
            {settings.checkout.giftNote && (
              <input
                type="text" maxLength={140} value={giftNote} onChange={(e) => setGiftNote(e.target.value)}
                placeholder="🎁 Gift note (optional): we write it on a card"
                style={{ width: "100%", padding: "10px 12px", marginTop: -6, marginBottom: 14, borderRadius: 10, border: `1px solid ${COLORS.bgSoft}`, fontSize: 13, background: COLORS.bg }}
              />
            )}

            {directBuyItem && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.charcoal, marginBottom: 8 }}>{t("checkout.qty")}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <button
                    onClick={() => changeCheckoutQty(-1)}
                    style={{ background: COLORS.bgSoft, border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <Minus size={14} />
                  </button>
                  <span style={{ fontSize: 15, fontWeight: 700, minWidth: 20, textAlign: "center" }}>{directBuyItem.qty}</span>
                  <button
                    onClick={() => changeCheckoutQty(1)}
                    style={{ background: COLORS.bgSoft, border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              {appliedPromo ? (
                <>
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
              {promoMore()}
              </>
              ) : (
                <div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      value={promoInput}
                      onChange={(e) => { setPromoInput(e.target.value); setPromoError(""); }}
                      placeholder={t("cart.promo")}
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
                      {t("cart.apply")}
                    </button>
                  </div>
                  {promoError && (
                    <div style={{ fontSize: 11.5, color: "#C0392B", marginTop: 6 }}>{promoError}</div>
                  )}
                </div>
              )}
            </div>

            {checkoutDiscount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: COLORS.maroon, marginBottom: 4 }}>
                <span>{t("cart.discount")} ({appliedPromo})</span>
                <span>-Rs{checkoutDiscount}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
              <span>{t("cart.total")}</span>
              <span>Rs{checkoutTotal}</span>
            </div>
            <div style={{ marginBottom: 12 }} />
            <button
              onClick={placeWebsiteOrder}
              disabled={placing}
              aria-disabled={!canSubmit || placing}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                width: "100%", background: canSubmit && !placing ? COLORS.maroon : "#C9BEB4", color: COLORS.cream,
                border: "none", borderRadius: 999, padding: "13px 0", fontSize: 14.5, fontWeight: 700,
                cursor: canSubmit && !placing ? "pointer" : "default",
              }}
            >
              {placing ? "Placing your order…" : `${t("checkout.place")} · Rs${checkoutTotal}`}
            </button>
            {!canSubmit && !placing && (
              <div style={{ fontSize: 11, color: "#A69A8E", marginTop: 8, textAlign: "center" }}>
                {betterOn ? "Please fill in the fields marked in red to continue." : "Fill in your name, a mobile number, and your address to continue."}
              </div>
            )}
            {placeError && (
              <div role="alert" style={{ background: "#F8E1DE", color: "#8E2A1E", borderRadius: 10, padding: "10px 12px", marginTop: 12, fontSize: 12.5, lineHeight: 1.5 }}>
                {placeError.text}
                {placeError.offerWhatsApp && (
                  <>
                    {" "}Don't worry — you can send the same order on WhatsApp instead.
                    <a
                      href={buildWhatsAppLink(placeError.orderNo)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => saveOrderToAdmin("whatsapp")}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10,
                        background: "#25D366", color: "#fff", borderRadius: 999, padding: "10px 0",
                        fontSize: 13.5, fontWeight: 700, textDecoration: "none",
                      }}
                    >
                      <MessageCircle size={15} /> Send this order on WhatsApp instead
                    </a>
                  </>
                )}
                {placeError.code && (
                  <div style={{ fontSize: 10.5, color: "#A69A8E", marginTop: 8, textAlign: "center" }}>
                    Error code: {placeError.code}
                  </div>
                )}
              </div>
            )}
            {SHOW_DIRECT_ORDER_LINKS && (
              <div style={{ fontSize: 12, color: "#7A6E64", marginTop: 12, textAlign: "center" }}>
                Or send it yourself:{" "}
                <a
                  href={canSubmit ? buildWhatsAppLink() : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!canSubmit) { e.preventDefault(); setPhoneTouched(true); return; }
                    saveOrderToAdmin("whatsapp");
                  }}
                  aria-disabled={!canSubmit}
                  style={{ color: canSubmit ? "#1E8E4A" : "#A69A8E", fontWeight: 700, cursor: canSubmit ? "pointer" : "default" }}
                >
                  WhatsApp
                </a>
                {" / "}
                <a
                  href={canSubmit ? "https://ig.me/m/twisttanglecrochet" : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!canSubmit) { e.preventDefault(); setPhoneTouched(true); return; }
                    copyOrderTextForInstagram();
                    saveOrderToAdmin("instagram");
                  }}
                  aria-disabled={!canSubmit}
                  style={{ color: canSubmit ? COLORS.navy : "#A69A8E", fontWeight: 700, cursor: canSubmit ? "pointer" : "default" }}
                >
                  Instagram
                </a>
              </div>
            )}
            {instaCopied && (
              <div style={{ fontSize: 11.5, color: COLORS.maroon, marginTop: 8, textAlign: "center" }}>
                Order details copied — paste them into the Instagram chat.
              </div>
            )}
            </>)}
          </div>
        </div>
      )}
    </div>
    </SpeedContext.Provider>
  );
}
