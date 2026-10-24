import React from "react";
import { X, HelpCircle, Gift, Instagram, ShoppingBag } from "lucide-react";
import { COLORS } from "../data/colors.js";

// Small shop extras, each with its own switch in the admin panel (all OFF by default):
// FAQ & returns page, combo offers, Instagram posts, cart suggestions.
const photoOf = (p) => (p.photos && p.photos[0]) || (p.variants && p.variants[0] && p.variants[0].photo) || "";
const safeUrl = (u) => (/^(https?:\/\/|\/)/i.test(String(u || "").trim()) ? String(u).trim() : "");
const head = { fontFamily: "'Fraunces', serif", fontWeight: 600, color: COLORS.maroonDark };

export function FaqPage({ cfg, whatsapp, onClose }) {
  const items = (Array.isArray(cfg.items) ? cfg.items : []).filter((x) => x && String(x.q || "").trim() && String(x.a || "").trim());
  return (
    <div className="ttc-modal" role="dialog" aria-modal="true" aria-label={cfg.title} style={{ position: "fixed", inset: 0, zIndex: 90, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 12, overflowY: "auto" }}>
      <div className="ttc-backdrop" onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(43,36,32,0.55)" }} />
      <div className="ttc-modal-inner" style={{ position: "relative", background: COLORS.cream, borderRadius: 20, width: 640, maxWidth: "100%", margin: "20px 0", padding: "26px 22px 28px" }}>
        <button onClick={onClose} aria-label="Close" style={{ position: "absolute", top: 14, right: 14, background: COLORS.bgSoft, border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}><X size={18} /></button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingRight: 40 }}><HelpCircle size={26} color={COLORS.maroon} /><h2 style={{ ...head, fontSize: 26, margin: 0 }}>{cfg.title}</h2></div>
        <div style={{ display: "grid", gap: 8 }}>
          {items.map((x, i) => (
            <details key={i} style={{ background: "#fff", borderRadius: 14, border: `1px solid ${COLORS.bgSoft}`, padding: "12px 16px" }}>
              <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: 14.5, color: COLORS.maroonDark }}>{x.q}</summary>
              <div style={{ fontSize: 13.5, color: "#5A4E46", lineHeight: 1.6, marginTop: 8, whiteSpace: "pre-line" }}>{x.a}</div>
            </details>
          ))}
        </div>
        {String(cfg.returns || "").trim() && (
          <div style={{ marginTop: 18, background: "#FBF0D4", border: "1px solid #E8CF8C", borderRadius: 14, padding: "14px 16px" }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#6B4E10", marginBottom: 6 }}>{cfg.returnsTitle}</div>
            <div style={{ fontSize: 13.5, color: "#5A4E46", lineHeight: 1.65, whiteSpace: "pre-line" }}>{cfg.returns}</div>
          </div>
        )}
        <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" style={{ display: "block", textAlign: "center", marginTop: 18, background: "#25D366", color: "#fff", borderRadius: 999, padding: "12px 0", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>Still have a question? WhatsApp us</a>
      </div>
    </div>
  );
}

// Bundle price: customer gets the combo discount automatically when all its products are in the cart.
export function ComboStrip({ cfg, products, onAdd }) {
  const combos = (Array.isArray(cfg.items) ? cfg.items : []).map((b) => {
    const list = (b.productIds || []).map((id) => products.find((p) => String(p.id) === String(id))).filter(Boolean);
    const full = list.reduce((n, p) => n + (Number(p.price) || 0), 0);
    return { b, list, full, save: Math.max(0, full - (Number(b.price) || 0)) };
  }).filter((c) => c.list.length >= 2 && Number(c.b.price) > 0 && c.save > 0);
  if (!combos.length) return null;
  return (
    <section style={{ maxWidth: 1000, margin: "0 auto", padding: "10px 20px 24px" }}>
      <h2 style={{ ...head, fontSize: 26, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}><Gift size={22} color={COLORS.maroon} /> {cfg.title}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {combos.map(({ b, list, full, save }, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 16, padding: 14, border: `1.5px solid ${COLORS.gold}` }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>{list.slice(0, 4).map((p) => photoOf(p) ? <img key={p.id} src={photoOf(p)} alt={p.name} loading="lazy" width="64" height="64" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 10 }} /> : null)}</div>
            <div style={{ fontWeight: 800, fontSize: 15, color: COLORS.maroonDark }}>{b.name || "Combo"}</div>
            <div style={{ fontSize: 12.5, color: "#7A6E64", margin: "2px 0 8px" }}>{list.map((p) => p.name).join(" + ")}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
              <b style={{ fontSize: 20, color: COLORS.maroon }}>Rs{Number(b.price)}</b><s style={{ fontSize: 13, color: "#9A8E84" }}>Rs{full}</s><span style={{ fontSize: 12, fontWeight: 800, color: "#1B6B3A" }}>Save Rs{save}</span>
            </div>
            <button type="button" onClick={() => onAdd(list)} style={{ width: "100%", background: COLORS.maroon, color: COLORS.cream, border: "none", borderRadius: 999, padding: "10px 0", fontWeight: 700, fontSize: 13.5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><ShoppingBag size={15} /> Add combo to cart</button>
          </div>
        ))}
      </div>
    </section>
  );
}

export function InstaStrip({ cfg }) {
  const posts = (Array.isArray(cfg.posts) ? cfg.posts : []).filter((x) => x && /^https?:\/\//i.test(String(x.image || "")));
  if (!posts.length) return null;
  const main = safeUrl(cfg.link);
  return (
    <section style={{ maxWidth: 1000, margin: "0 auto", padding: "10px 20px 24px" }}>
      <h2 style={{ ...head, fontSize: 26, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}><Instagram size={22} color={COLORS.maroon} /> {main ? <a href={main} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>{cfg.title}</a> : cfg.title}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
        {posts.slice(0, 6).map((x, i) => {
          const img = <img src={x.image} alt="Instagram post" loading="lazy" width="300" height="300" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 12, display: "block" }} />;
          const link = safeUrl(x.link) || main;
          return link ? <a key={i} href={link} target="_blank" rel="noopener noreferrer">{img}</a> : <div key={i}>{img}</div>;
        })}
      </div>
    </section>
  );
}

export function CartSuggest({ cartItems, products, onAdd }) {
  const inCart = new Set(cartItems.map((i) => String(i.id)));
  const cats = new Set(cartItems.map((i) => i.category));
  const list = products.filter((p) => !inCart.has(String(p.id)) && cats.has(p.category) && p.tag !== "Sold Out" && photoOf(p)).slice(0, 3);
  if (!list.length) return null;
  return (
    <div style={{ margin: "0 0 14px" }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.charcoal, marginBottom: 8 }}>Goes well with your order</div>
      <div style={{ display: "grid", gap: 8 }}>
        {list.map((p) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 12, padding: 8, border: `1px solid ${COLORS.bgSoft}` }}>
            <img src={photoOf(p)} alt="" loading="lazy" width="44" height="44" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8 }} />
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div><div style={{ fontSize: 12, color: COLORS.maroon, fontWeight: 800 }}>Rs{p.price}</div></div>
            <button type="button" onClick={() => onAdd(p)} style={{ background: COLORS.maroon, color: COLORS.cream, border: "none", borderRadius: 999, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Add</button>
          </div>
        ))}
      </div>
    </div>
  );
}
