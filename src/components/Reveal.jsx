import React, { useEffect, useRef, useState } from "react";

// Scroll reveal for home sections (Admin → Look & motion). When off, App.jsx
// doesn't use this wrapper at all.
const css = `
.ttc-rev { transition: opacity .7s ease, transform .7s cubic-bezier(.22,.61,.36,1); }
.ttc-rev.hide { opacity: 0; }
.ttc-rev.hide.fade-up { transform: translateY(26px); }
.ttc-rev.hide.zoom { transform: scale(0.96); }
.ttc-rev.hide.slide { transform: translateX(-36px); }
@media (prefers-reduced-motion: reduce) { .ttc-rev { transition: none; } .ttc-rev.hide { opacity: 1; transform: none; } }
`;

export default function Reveal({ style, children }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === "undefined");
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return undefined;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setSeen(true); io.disconnect(); }
    }, { threshold: 0.08 });
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  const kind = ["fade", "zoom", "slide"].includes(style) ? style : "fade-up";
  return (
    <div ref={ref} className={`ttc-rev ${kind}${seen ? "" : " hide"}`}>
      <style>{css}</style>
      {children}
    </div>
  );
}
