import React, { useEffect, useRef, useState } from "react";
import { COLORS } from "../data/colors.js";

// Small "bento" boxes such as "500+ Orders" / "100% Handmade". Numbers count
// up once, when the boxes scroll into view.

const TONES = [
  { bg: COLORS.cream, fg: COLORS.maroon, sub: COLORS.charcoal },
  { bg: COLORS.blushSoft, fg: COLORS.maroonDark, sub: COLORS.maroonDark },
  { bg: COLORS.navy, fg: COLORS.cream, sub: COLORS.cream },
  { bg: COLORS.bgSoft, fg: COLORS.navy, sub: COLORS.charcoal },
];

function CountUp({ value, run }) {
  const target = Number(value) || 0;
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return undefined;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || target <= 0) { setN(target); return undefined; }
    let raf;
    const start = performance.now();
    const dur = 1400;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, target]);
  return <>{n.toLocaleString("en-US")}</>;
}

export default function BentoStats({ items }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === "undefined") { setSeen(true); return undefined; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setSeen(true); io.disconnect(); }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const list = (items || []).filter((i) => i && (String(i.label || "").trim() || Number(i.value)));
  if (list.length === 0) return null;

  return (
    <section style={{ padding: "var(--ttc-section-space, 20px) 20px", maxWidth: 1000, margin: "0 auto" }}>
      <div ref={ref} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "var(--ttc-gap, 14px)" }}>
        {list.map((it, i) => {
          const tone = TONES[i % TONES.length];
          return (
            <div key={i} style={{
              background: tone.bg, borderRadius: "var(--ttc-card-radius, 18px)", padding: "22px 18px",
              textAlign: "center", gridColumn: list.length >= 3 && i === 0 ? "span 2" : undefined,
            }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 34, color: tone.fg, lineHeight: 1.1 }}>
                <CountUp value={it.value} run={seen} />{it.suffix || ""}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: tone.sub, opacity: 0.85, marginTop: 6 }}>{it.label}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
