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

// ---- Reviews: card-deck style + "Write a review" (each has its own switch, OFF by default) ----
const Stars = ({ n }) => (
  <span aria-label={n + " out of 5 stars"} style={{ color: COLORS.gold, letterSpacing: 1, fontSize: 15 }}>{"★".repeat(Math.max(0, Math.min(5, Math.round(n || 0))))}<span style={{ opacity: 0.25 }}>{"★".repeat(5 - Math.max(0, Math.min(5, Math.round(n || 0))))}</span></span>
);

// A stack of review cards: the front card flies to the back, one after another.
export function ReviewDeck({ reviews, products, onOpen, auto, every }) {
  const [order, setOrder] = React.useState(() => reviews.map((_, i) => i));
  const [leaving, setLeaving] = React.useState(false);
  const hold = React.useRef(false);
  const n = reviews.length;
  React.useEffect(() => { setOrder(reviews.map((_, i) => i)); }, [n]);
  const reduce = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const next = React.useCallback(() => {
    if (n < 2) return;
    if (reduce) { setOrder((o) => [...o.slice(1), o[0]]); return; }
    setLeaving(true);
    setTimeout(() => { setOrder((o) => [...o.slice(1), o[0]]); setLeaving(false); }, 420);
  }, [n, reduce]);
  const prev = () => { if (n > 1) setOrder((o) => [o[o.length - 1], ...o.slice(0, -1)]); };
  React.useEffect(() => {
    if (!auto || n < 2 || reduce) return undefined;
    const t = setInterval(() => { if (!hold.current) next(); }, Math.max(3, Number(every) || 5) * 1000);
    return () => clearInterval(t);
  }, [auto, every, n, reduce, next]);
  if (!n) return null;
  const shown = order.slice(0, 3);
  return (
    <div onMouseEnter={() => { hold.current = true; }} onMouseLeave={() => { hold.current = false; }} onTouchStart={() => { hold.current = true; setTimeout(() => { hold.current = false; }, 6000); }}>
      <div style={{ position: "relative", maxWidth: 440, margin: "0 auto", height: 236, paddingTop: 4 }}>
        {shown.map((idx, pos) => {
          const r = reviews[idx]; if (!r) return null;
          const prod = (products || []).find((p) => p.id === r.productId);
          const front = pos === 0;
          const base = [
            "translateY(0) scale(1) rotate(0deg)",
            "translateY(14px) scale(0.955) rotate(-2deg)",
            "translateY(28px) scale(0.91) rotate(2deg)",
          ];
          const tf = leaving ? (front ? "translate(70px,-34px) scale(1.02) rotate(7deg)" : base[pos - 1]) : base[pos]; // the others move up one place while the front leaves
          return (
            <div key={r.id || idx} style={{
              position: "absolute", left: 0, right: 0, top: 0, minHeight: 196, background: COLORS.cream, borderRadius: 18, padding: "18px 20px",
              boxShadow: "0 8px 22px rgba(60,30,40,0.14)", border: `1px solid ${COLORS.bgSoft}`, zIndex: 10 - pos,
              transform: tf, opacity: leaving && front ? 0 : 1, transition: reduce ? "none" : "transform .42s ease, opacity .42s ease", cursor: n > 1 && front ? "pointer" : "default",
            }} onClick={front ? next : undefined}>
              <Stars n={r.rating} />
              <p style={{ fontSize: 14, color: "#5A4E46", lineHeight: 1.55, margin: "10px 0", display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{r.comment}</p>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.charcoal }}>{r.name}</div>
              {front && /^https?:\/\//i.test(String(r.photo || "")) && (
                <a href={r.photo} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} aria-label="Open the photo of this review"><img src={r.photo} alt={"Photo shared by " + r.name} loading="lazy" style={{ margin: "6px 0", height: 54, borderRadius: 8, display: "block", objectFit: "cover" }} /></a>
              )}
              {prod && front
                ? <button type="button" onClick={(e) => { e.stopPropagation(); onOpen && onOpen(prod.id); }} style={{ fontSize: 12, color: COLORS.maroon, background: "none", border: "none", padding: 0, textDecoration: "underline", cursor: "pointer" }}>on {r.productName}</button>
                : <div style={{ fontSize: 12, color: "#7A6E64" }}>{r.productName ? "on " + r.productName : ""}</div>}
            </div>
          );
        })}
      </div>
      {n > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 14, marginTop: 8 }}>
          <button type="button" onClick={prev} aria-label="Previous review" style={{ border: `1.3px solid ${COLORS.navy}`, background: "transparent", color: COLORS.navy, borderRadius: 999, width: 40, height: 40, fontSize: 18, cursor: "pointer" }}>‹</button>
          <span style={{ fontSize: 12, color: "#7A6E64" }}>Tap the card or press ›</span>
          <button type="button" onClick={next} aria-label="Next review" style={{ border: `1.3px solid ${COLORS.navy}`, background: "transparent", color: COLORS.navy, borderRadius: 999, width: 40, height: 40, fontSize: 18, cursor: "pointer" }}>›</button>
        </div>
      )}
    </div>
  );
}

// "Write a review" window. Reviews wait for your approval in Admin → Reviews before anyone sees them.
export function ReviewWriter({ cfg, products, onClose, save }) {
  const [name, setName] = React.useState("");
  const [rating, setRating] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const [pid, setPid] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [err, setErr] = React.useState("");
  const list = (products || []).filter((p) => p && p.id && p.name);
  async function submit(e) {
    e.preventDefault();
    if (!name.trim() || !comment.trim() || rating < 1) { setErr("Please add your name, a star rating and a short comment."); return; }
    const p = list.find((x) => String(x.id) === pid);
    setErr(""); setBusy(true);
    try { await save({ productId: p ? String(p.id) : "", productName: p ? p.name : (cfg.general || "Custom order"), name: name.trim(), rating, comment: comment.trim() }); setDone(true); }
    catch (x) { setErr("Couldn't send your review. Please check your connection and try again."); }
    finally { setBusy(false); }
  }
  const inp = { width: "100%", border: `1.3px solid ${COLORS.bgSoft}`, borderRadius: 12, padding: "11px 12px", fontSize: 14, background: "#fff", fontFamily: "inherit", boxSizing: "border-box" };
  return (
    <div role="dialog" aria-modal="true" aria-label="Write a review" onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(40,20,28,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: COLORS.cream, borderRadius: 20, width: "100%", maxWidth: 440, maxHeight: "92vh", overflowY: "auto", padding: 22, position: "relative" }}>
        <button type="button" onClick={onClose} aria-label="Close" style={{ position: "absolute", top: 12, right: 12, border: "none", background: "transparent", cursor: "pointer", color: COLORS.charcoal }}><X size={20} /></button>
        <div style={{ ...head, fontSize: 22, marginBottom: 4 }}>{cfg.title || "Write a review"}</div>
        {done ? (
          <p style={{ fontSize: 14, color: "#5A4E46", lineHeight: 1.6 }}>Thank you! Your review will appear on the shop once we have approved it. 🧶</p>
        ) : (
          <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
            <p style={{ fontSize: 13, color: "#7A6E64", margin: 0 }}>Bought from us, or ordered a custom piece? Tell others how it was.</p>
            <label style={{ fontSize: 12.5, fontWeight: 700 }}>Your name<input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} style={{ ...inp, marginTop: 4 }} autoComplete="name" /></label>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>Your rating</div>
              <div role="radiogroup" aria-label="Star rating" style={{ display: "flex", gap: 4 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} type="button" role="radio" aria-checked={rating === s} aria-label={s + " star" + (s > 1 ? "s" : "")} onClick={() => setRating(s)} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 30, lineHeight: 1, padding: 2, color: s <= rating ? COLORS.gold : "#D9CFC6" }}>★</button>
                ))}
              </div>
            </div>
            <label style={{ fontSize: 12.5, fontWeight: 700 }}>What was it for?
              <select value={pid} onChange={(e) => setPid(e.target.value)} style={{ ...inp, marginTop: 4 }}>
                <option value="">{cfg.general || "Custom order"}</option>
                {list.map((p) => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 12.5, fontWeight: 700 }}>Your review<textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} maxLength={600} style={{ ...inp, marginTop: 4, resize: "vertical" }} /></label>
            {err && <div role="alert" style={{ color: "#B3261E", fontSize: 13 }}>{err}</div>}
            <button type="submit" disabled={busy} style={{ border: "none", background: COLORS.maroon, color: COLORS.cream, borderRadius: 999, padding: "12px 18px", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>{busy ? "Sending…" : "Send review"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
