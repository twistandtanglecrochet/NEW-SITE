import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { COLORS } from "../data/colors.js";
import { Img } from "../lib/cloudinary.jsx";

// Announcement bars (top of the page), ad banners and the ad pop-up.
// All of it is controlled from Admin → Marketing.

export function safeLink(url) {
  const u = String(url || "").trim();
  return /^(https?:\/\/|mailto:|tel:|\/)/i.test(u) ? u : "";
}

const TONES = {
  maroon: { bg: COLORS.maroon, fg: COLORS.cream },
  navy: { bg: COLORS.navy, fg: COLORS.cream },
  gold: { bg: COLORS.gold, fg: COLORS.cream },
  blush: { bg: COLORS.blushSoft, fg: COLORS.maroonDark },
  dark: { bg: COLORS.maroonDark, fg: COLORS.cream },
};

const css = `
@keyframes ttcMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
.ttc-ann-marquee { display: inline-flex; white-space: nowrap; animation: ttcMarquee var(--ttc-marq, 24s) linear infinite; }
.ttc-ann-marquee:hover { animation-play-state: paused; }
.ttc-ann-slot { display: grid; }
.ttc-ann-slot > div { grid-area: 1 / 1; opacity: 0; pointer-events: none; transition: opacity .5s ease, transform .5s ease; }
.ttc-ann-slot.slide > div { transform: translateY(100%); }
.ttc-ann-slot > div.on { opacity: 1; pointer-events: auto; transform: none; }
.ttc-ann-slot.slide > div.out { transform: translateY(-100%); }
@media (prefers-reduced-motion: reduce) { .ttc-ann-marquee { animation: none; } .ttc-ann-slot > div { transition: none; } }
`;

function dismissedSet() {
  try { return new Set(JSON.parse(sessionStorage.getItem("ttc_ann_closed") || "[]")); } catch (e) { return new Set(); }
}

export function AnnouncementBars({ cfg, lang, t }) {
  const [closed, setClosed] = useState(dismissedSet);
  const [i, setI] = useState(0);
  const [prev, setPrev] = useState(-1);
  const reduce = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const bars = (cfg.bars || [])
    .map((b, n) => {
      const text = String((lang === "ur" && b.textUr) || b.text || "").trim();
      return { ...b, key: n + ":" + text, text, link: safeLink(b.link) };
    })
    .filter((b) => b.on !== false && b.text && !closed.has(b.key));

  const rotate = cfg.style === "rotate" && bars.length > 1 && !reduce;
  useEffect(() => {
    if (!rotate) return undefined;
    const timer = setInterval(() => setI((n) => { setPrev(n); return (n + 1) % bars.length; }), Math.max(1500, Number(cfg.speed) || 4000));
    return () => clearInterval(timer);
  }, [rotate, bars.length, cfg.speed]);

  if (bars.length === 0) return null;
  const close = (key) => setClosed((cur) => {
    const next = new Set(cur); next.add(key);
    try { sessionStorage.setItem("ttc_ann_closed", JSON.stringify([...next])); } catch (e) {}
    return next;
  });

  const one = (b, extra) => {
    const tone = TONES[b.tone] || TONES.maroon;
    const label = String(b.linkLabel || "").trim();
    const inner = (
      <>
        <span>{b.text}</span>
        {b.link && label && <span style={{ textDecoration: "underline", fontWeight: 700, marginInlineStart: 8 }}>{label}</span>}
      </>
    );
    return (
      <div key={b.key} className={extra && extra.cls} style={{ background: tone.bg, color: tone.fg, position: "relative", ...(extra && extra.style) }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "8px 40px", fontSize: 13, lineHeight: 1.4, textAlign: "center", minHeight: 36 }}>
          {b.link ? <a href={b.link} target={/^https?:/i.test(b.link) ? "_blank" : undefined} rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>{inner}</a> : <span>{inner}</span>}
        </div>
        {b.dismissible !== false && (
          <button onClick={() => close(b.key)} aria-label={t("announce.close")} style={{ position: "absolute", top: "50%", insetInlineEnd: 8, transform: "translateY(-50%)", background: "none", border: "none", color: "inherit", display: "flex", padding: 4, opacity: 0.85 }}>
            <X size={15} />
          </button>
        )}
      </div>
    );
  };

  const wrapStyle = {};
  if (cfg.style === "marquee") {
    const tone = TONES[bars[0].tone] || TONES.maroon;
    const items = bars.map((b) => (b.link ? `${b.text}${b.linkLabel ? " — " + b.linkLabel : ""}` : b.text));
    const strip = items.map((x, n) => <span key={n} style={{ padding: "0 36px" }}>{x}</span>);
    const speed = Math.max(8, Math.min(90, (Number(cfg.speed) || 4000) / 160));
    return (
      <div className="ttc-ann" style={{ ...wrapStyle, background: tone.bg, color: tone.fg, overflow: "hidden", fontSize: 13, padding: "9px 0" }}>
        <style>{css}</style>
        <div className="ttc-ann-marquee" style={{ "--ttc-marq": `${speed}s` }}>{strip}{strip}</div>
      </div>
    );
  }
  if (rotate) {
    const idx = i % bars.length;
    return (
      <div className="ttc-ann" style={wrapStyle}>
        <style>{css}</style>
        <div className={"ttc-ann-slot" + (cfg.transition === "slide" ? " slide" : "")}>
          {bars.map((b, n) => one(b, { cls: n === idx ? "on" : bars[prev % bars.length] === b ? "out" : "" }))}
        </div>
      </div>
    );
  }
  return (
    <div className="ttc-ann" style={wrapStyle}>
      <style>{css}</style>
      {bars.map((b) => one(b))}
    </div>
  );
}

// ---- Ads: 1 to 5 pictures each, placed where the admin chooses ----
export const AD_PLACES = ["underCarousel", "underTiles", "betweenProducts", "aboveFooter", "popup"];
const AD_SIZES = { strip: { ratio: "970 / 90", max: 1000 }, banner: { ratio: "970 / 120", max: 1000 }, square: { ratio: "300 / 250", max: 340 }, wide: { ratio: "16 / 9", max: 640 }, card: { ratio: "300 / 400", max: 320 } };
const adCss = `
@keyframes ttcAdIn { from { opacity: 0; } to { opacity: 1; } }
.ttc-ad-stack { position: relative; display: grid; overflow: hidden; }
.ttc-ad-stack > a, .ttc-ad-stack > div.ttc-ad-slide { grid-area: 1 / 1; opacity: 0; pointer-events: none; transition: opacity .6s ease, transform .6s ease; }
.ttc-ad-stack.slide > a, .ttc-ad-stack.slide > div.ttc-ad-slide { transform: translateX(40px); }
.ttc-ad-stack > .on { opacity: 1; pointer-events: auto; transform: none; }
.ttc-ad-dots { position: absolute; left: 0; right: 0; bottom: 8px; display: flex; gap: 6px; justify-content: center; }
.ttc-ad-dots i { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,.55); }
.ttc-ad-dots i.on { background: #fff; }
@media (prefers-reduced-motion: reduce) { .ttc-ad-stack > a, .ttc-ad-stack > div.ttc-ad-slide { transition: none; } }
`;

function dayMs(v, end) {
  if (!v) return null;
  const t = Date.parse(String(v) + (end ? "T23:59:59" : "T00:00:00"));
  return Number.isFinite(t) ? t : null;
}
export function adImages(a) {
  const raw = Array.isArray(a.images) && a.images.length ? a.images : (a.image ? [a.image] : []);
  return raw.map((x) => (typeof x === "string" ? { src: x } : x)).filter((x) => x && String(x.src || "").trim()).slice(0, 5);
}
function adPlaces(a) {
  if (Array.isArray(a.places) && a.places.length) return a.places;
  return [(a.placement || "banner") === "popup" ? "popup" : "section"];
}
export function liveAds(cfg, place) {
  const now = Date.now();
  return (cfg.items || []).filter((a) => {
    if (!a || a.on === false || adImages(a).length === 0) return false;
    const from = dayMs(a.from, false); const until = dayMs(a.until, true);
    if ((from && now < from) || (until && now > until)) return false;
    return adPlaces(a).includes(place);
  });
}
function adKey(a) { return "ttc_ad_x_" + String((adImages(a)[0] || {}).src || "").slice(-40); }
function closedBefore(a) {
  const mode = a.comesBack || "visit";
  if (mode === "reload") return false;
  try { return (mode === "never" ? localStorage : sessionStorage).getItem(adKey(a)) === "1"; } catch (e) { return false; }
}

function AdPic({ im, alt, sizes }) {
  const phone = String(im.phone || "").trim();
  if (phone) {
    return (
      <picture>
        <source media="(max-width: 640px)" srcSet={phone} />
        <img src={im.src} alt={alt} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </picture>
    );
  }
  return <Img src={im.src} alt={alt} loading="lazy" sizes={sizes} widths={[480, 800, 1200]} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />;
}

function AdBox({ ad, radius = "var(--ttc-panel-radius, 24px)", fixedRatio, onLinkClick, t }) {
  const imgs = adImages(ad);
  const size = AD_SIZES[ad.size] || AD_SIZES.banner;
  const [i, setI] = useState(0);
  const [hidden, setHidden] = useState(() => closedBefore(ad));
  const [canClose, setCanClose] = useState(() => !(Number(ad.closeAfter) > 0));
  const seconds = Math.min(30, Math.max(2, Number(ad.seconds) || 5));
  useEffect(() => {
    if (imgs.length < 2) return undefined;
    const reduce = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return undefined;
    const timer = setInterval(() => setI((n) => (n + 1) % imgs.length), seconds * 1000);
    return () => clearInterval(timer);
  }, [imgs.length, seconds]);
  useEffect(() => {
    const d = Number(ad.closeAfter) || 0;
    if (!ad.closable || d <= 0) return undefined;
    const timer = setTimeout(() => setCanClose(true), d * 1000);
    return () => clearTimeout(timer);
  }, [ad.closable, ad.closeAfter]);
  if (hidden || imgs.length === 0) return null;
  const link = safeLink(ad.link);
  const close = () => {
    setHidden(true);
    const mode = ad.comesBack || "visit";
    try { if (mode !== "reload") (mode === "never" ? localStorage : sessionStorage).setItem(adKey(ad), "1"); } catch (e) {}
  };
  const slides = imgs.map((im, n) => {
    const pic = <AdPic im={im} alt={ad.title || "Offer"} sizes={`(max-width: 1000px) 94vw, ${size.max}px`} />;
    const cls = n === i ? "on" : "";
    return link
      ? <a key={n} className={cls} href={link} target={/^https?:/i.test(link) ? "_blank" : undefined} rel="noopener noreferrer" onClick={onLinkClick} style={{ display: "block" }}>{pic}</a>
      : <div key={n} className={"ttc-ad-slide " + cls}>{pic}</div>;
  });
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: size.max, margin: "0 auto" }}>
      <style>{adCss}</style>
      <div className={"ttc-ad-stack" + (ad.fx === "slide" ? " slide" : "")} style={{ aspectRatio: fixedRatio || size.ratio, borderRadius: radius, background: "rgba(255,255,255,.4)" }}>
        {slides}
        {imgs.length > 1 && <div className="ttc-ad-dots" aria-hidden="true">{imgs.map((_, n) => <i key={n} className={n === i ? "on" : ""} />)}</div>}
      </div>
      {ad.closable && canClose && (
        <button onClick={close} aria-label={t ? t("ads.close") : "Close"} style={{ position: "absolute", top: 8, right: 8, zIndex: 2, width: 30, height: 30, borderRadius: "50%", border: "none", background: COLORS.cream, color: COLORS.charcoal, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,.3)" }}>
          <X size={16} />
        </button>
      )}
    </div>
  );
}

// An ad strip at one of the places on the home page. place "section" = the
// older "Ad banners" section whose spot is set in Home sections.
export function AdBanners({ cfg, place = "section", t }) {
  const list = liveAds(cfg, place);
  if (list.length === 0) return null;
  return (
    <section style={{ padding: "var(--ttc-section-space, 20px) 20px", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "grid", gap: "var(--ttc-gap, 14px)" }}>
        {list.map((a, n) => <AdBox key={n + ":" + (adImages(a)[0] || {}).src} ad={a} t={t} />)}
      </div>
    </section>
  );
}

export function AdPopup({ cfg, t }) {
  const ad = liveAds(cfg, "popup")[0];
  const [open, setOpen] = useState(false);
  const shown = useRef(false);
  useEffect(() => {
    if (!ad || shown.current || closedBefore(ad)) return undefined;
    let seen = false;
    try { seen = sessionStorage.getItem("ttc_ad_seen") === "1"; } catch (e) {}
    if (seen) return undefined;
    const timer = setTimeout(() => { shown.current = true; setOpen(true); try { sessionStorage.setItem("ttc_ad_seen", "1"); } catch (e) {} }, Math.max(0, Number(cfg.popupDelay) || 0) * 1000);
    return () => clearTimeout(timer);
  }, [ad && (adImages(ad)[0] || {}).src, cfg.popupDelay]);
  if (!ad || !open) return null;
  const done = () => {
    setOpen(false);
    const mode = ad.comesBack || "visit";
    try { if (mode === "never") localStorage.setItem(adKey(ad), "1"); } catch (e) {}
  };
  return (
    <div className="ttc-modal" role="dialog" aria-modal="true" aria-label={ad.title || "Offer"} style={{ position: "fixed", inset: 0, zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div className="ttc-backdrop" onClick={done} style={{ position: "absolute", inset: 0, background: "rgba(43,36,32,0.55)" }} />
      <div className="ttc-modal-inner" style={{ position: "relative", width: 420, maxWidth: "100%", maxHeight: "88vh" }}>
        <button onClick={done} aria-label={t("ads.close")} style={{ position: "absolute", top: -12, right: -4, zIndex: 3, width: 34, height: 34, borderRadius: "50%", border: "none", background: COLORS.cream, color: COLORS.charcoal, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,.3)" }}>
          <X size={18} />
        </button>
        <AdBox ad={{ ...ad, closable: false }} radius="18px" onLinkClick={done} />
      </div>
    </div>
  );
}
