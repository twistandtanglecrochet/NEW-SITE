import React, { useEffect, useState } from "react";
import { Instagram, Facebook, MessageCircle, Clock } from "lucide-react";
import { COLORS } from "../data/colors.js";
import { categorySlug } from "../data/slug.js";

// A sorted footer (switch on in Admin → Website → Footer): big line + button,
// link columns, "track your order", local time, social icons and credits.
const linkStyle = { color: "rgba(251,246,240,0.9)", fontSize: 14, textDecoration: "none", background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer", font: "inherit" };
const head = { fontSize: 12, fontWeight: 700, letterSpacing: 0.6, color: "rgba(251,246,240,0.6)", marginBottom: 12 };
const TikTok = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.6 3c.3 2.3 1.7 3.9 4 4.1v3.2c-1.5.1-2.9-.4-4-1.1v6.2c0 3.2-2.5 5.6-5.6 5.6S5.4 18.6 5.4 15.4c0-3.4 2.9-5.9 6.2-5.5v3.3c-1.6-.4-3 .8-3 2.2 0 1.3 1 2.3 2.3 2.3s2.4-1 2.4-2.4V3h3.3z" /></svg>
);

function pkTime() {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit", hour12: true });
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Karachi", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()).split(":");
    return { text: fmt.format(new Date()), minutes: Number(parts[0]) * 60 + Number(parts[1]) };
  } catch (e) { return null; }
}
const toMin = (hhmm) => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || "")); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
const fmt12 = (hhmm) => { const m = toMin(hhmm); if (m === null) return ""; const h = Math.floor(m / 60); return `${((h + 11) % 12) + 1}${m % 60 ? ":" + String(m % 60).padStart(2, "0") : ""} ${h < 12 ? "am" : "pm"}`; };
const safe = (u) => (/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(String(u || "").trim()) ? String(u).trim() : "");

export default function SiteFooter({ cfg, shopName, logo, categories, whatsapp, designedBy, footerLinks, onTrack, trackOn, onTop, guide, myOrders, faq }) {
  const [now, setNow] = useState(() => pkTime());
  useEffect(() => { const id = setInterval(() => setNow(pkTime()), 30000); return () => clearInterval(id); }, []);
  const o = toMin(cfg.hours && cfg.hours.open); const c = toMin(cfg.hours && cfg.hours.close);
  const hasHours = o !== null && c !== null;
  const isOpen = hasHours && now ? (o <= c ? now.minutes >= o && now.minutes < c : now.minutes >= o || now.minutes < c) : null;
  const year = new Date().getFullYear();
  const fill = (s) => String(s || "").replace(/\{year\}/g, String(year)).replace(/\{shop\}/g, shopName);
  const cols = (Array.isArray(cfg.columns) ? cfg.columns : []).map((col) => ({ title: col.title, links: (col.links || []).filter((l) => l && l.label && safe(l.url)) })).filter((col) => col.title && col.links.length);
  const soc = cfg.socials || {};
  const second = String(cfg.secondNumber || "").trim();
  const wa = `https://wa.me/${whatsapp}`;
  const bubble = (bg, href, label, icon) => href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} style={{ width: 32, height: 32, borderRadius: "50%", background: bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</a>
  ) : null;
  return (
    <footer style={{ background: COLORS.maroonDark, color: COLORS.cream, marginTop: 24 }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 22px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div style={{ maxWidth: 440 }}>
            {logo && <img src={logo} alt={shopName} style={{ height: 34, width: "auto", objectFit: "contain", marginBottom: 14, filter: "brightness(0) invert(1)" }} />}
            <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 26, lineHeight: 1.25 }}>{cfg.headline}</div>
          </div>
          {cfg.button && (
            <a href={wa} target="_blank" rel="noopener noreferrer" style={{ width: 92, height: 92, borderRadius: "50%", background: COLORS.gold, color: COLORS.maroonDark, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontSize: 12.5, fontWeight: 800, textDecoration: "none", padding: 10, lineHeight: 1.25 }}>{cfg.button}</a>
          )}
        </div>
        <div style={{ borderTop: "1px solid rgba(251,246,240,0.16)", margin: "26px 0" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 28 }}>
          {cfg.shopColumn && categories.length > 0 && (
            <div><div style={head}>Shop</div><div style={{ display: "grid", gap: 9 }}>{categories.slice(0, 7).map((cat) => <a key={cat} href={`/category/${categorySlug(cat)}`} style={linkStyle}>{cat}</a>)}</div></div>
          )}
          {cols.map((col, i) => (
            <div key={i}><div style={head}>{col.title}</div><div style={{ display: "grid", gap: 9 }}>{col.links.map((l, j) => <a key={j} href={safe(l.url)} target={/^https?:/i.test(l.url) ? "_blank" : undefined} rel="noopener noreferrer" style={linkStyle}>{l.label}</a>)}</div></div>
          ))}
          <div><div style={head}>Help</div><div style={{ display: "grid", gap: 9 }}>
            {trackOn && <button type="button" onClick={() => onTrack("")} style={linkStyle}>Track your order</button>}
            {guide && <button type="button" onClick={guide.open} style={linkStyle}>{guide.label}</button>}
            {faq && <button type="button" onClick={faq.open} style={linkStyle}>{faq.label}</button>}
            {myOrders && <button type="button" onClick={myOrders} style={linkStyle}>My orders</button>}
            <a href={wa} target="_blank" rel="noopener noreferrer" style={linkStyle}>Chat on WhatsApp</a>
            <button type="button" onClick={onTop} style={linkStyle}>Back to top</button>
          </div></div>
          {trackOn && cfg.track && (
            <form onSubmit={(e) => { e.preventDefault(); onTrack(e.currentTarget.elements.no.value.trim()); }}>
              <div style={head}>Track your order</div>
              <div style={{ display: "flex" }}>
                <input name="no" aria-label="Order number" placeholder="Order number, e.g. TTC-K7F3Q" style={{ flex: 1, minWidth: 0, border: "none", borderRadius: "8px 0 0 8px", padding: "10px 12px", fontSize: 13, background: "#fff", color: COLORS.charcoal }} />
                <button type="submit" style={{ border: "none", background: COLORS.gold, color: COLORS.maroonDark, fontWeight: 700, padding: "0 14px", borderRadius: "0 8px 8px 0", fontSize: 13 }}>Track</button>
              </div>
            </form>
          )}
          <div><div style={head}>Follow</div><div style={{ display: "grid", gap: 9 }}>
            {[["instagram", "Instagram", "#C13584", <Instagram size={13} />], ["facebook", "Facebook", "#1877F2", <Facebook size={13} />], ["tiktok", "TikTok", "#000", <TikTok size={12} />]].map(([k, label, bg, icon]) => soc[k] ? (
              <a key={k} href={safe(soc[k])} target="_blank" rel="noopener noreferrer" style={{ ...linkStyle, display: "flex", alignItems: "center", gap: 8 }}>
                {cfg.officialIcons && <span style={{ width: 22, height: 22, borderRadius: "50%", background: bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: k === "tiktok" ? "0 0 0 1px rgba(255,255,255,.35)" : "none" }}>{icon}</span>}
                {label}
              </a>
            ) : null)}
          </div></div>
        </div>
        {(cfg.showTime || second) && (
          <>
            <div style={{ borderTop: "1px solid rgba(251,246,240,0.16)", margin: "26px 0 18px" }} />
            <div style={{ display: "flex", gap: 32, flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
                {cfg.showTime && now && (
                  <div>
                    <div style={{ ...head, marginBottom: 6 }}>Local time</div>
                    <div style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
                      <Clock size={14} /> {now.text} PKT
                      {isOpen !== null && <span style={{ fontSize: 12, color: isOpen ? "#8FE3A8" : "#F4A6A6" }}>● {isOpen ? "Open now" : "Closed now"}</span>}
                    </div>
                    {hasHours && <div style={{ fontSize: 12, color: "rgba(251,246,240,0.65)", marginTop: 4 }}>Today: {fmt12(cfg.hours.open)} to {fmt12(cfg.hours.close)}</div>}
                  </div>
                )}
                {second && <div><div style={{ ...head, marginBottom: 6 }}>Second number</div><a href={`tel:${second.replace(/\s+/g, "")}`} style={{ ...linkStyle, fontSize: 14 }}>{second}</a></div>}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {soc.whatsapp !== false && bubble("#25D366", wa, "WhatsApp", <MessageCircle size={15} />)}
                {bubble("#C13584", safe(soc.instagram), "Instagram", <Instagram size={15} />)}
                {bubble("#1877F2", safe(soc.facebook), "Facebook", <Facebook size={15} />)}
                {bubble("#000", safe(soc.tiktok), "TikTok", <TikTok />)}
              </div>
            </div>
          </>
        )}
        {footerLinks.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 18px", marginTop: 22 }}>
            {footerLinks.map((l, i) => <a key={i} href={l.href} target={/^https?:/i.test(l.href) ? "_blank" : undefined} rel="noopener noreferrer" style={{ ...linkStyle, fontSize: 13, textDecoration: "underline" }}>{l.label}</a>)}
          </div>
        )}
        <div style={{ textAlign: "center", marginTop: 28, fontSize: 13, display: "grid", gap: 8, justifyItems: "center" }}>
          {cfg.copyright && <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 15 }}>{fill(cfg.copyright)}</div>}
          {designedBy && <div style={{ fontSize: 12, color: "rgba(251,246,240,0.7)" }}>{designedBy.label} {designedBy.url ? <a href={designedBy.url} target="_blank" rel="noopener noreferrer" style={{ color: COLORS.gold, fontWeight: 700, textDecoration: "none", letterSpacing: 0.5 }}>{designedBy.name}</a> : <strong style={{ color: COLORS.gold }}>{designedBy.name}</strong>}</div>}
          {cfg.lastLine && <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 14, color: COLORS.gold }}>{fill(cfg.lastLine)}</div>}
        </div>
      </div>
    </footer>
  );
}
