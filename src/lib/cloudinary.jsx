import { createContext, useContext, useEffect } from "react";

// Cloudinary photos can be served in a size that matches the screen. This only
// touches res.cloudinary.com links — anything else is left exactly as it was.
const CLD = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;

export function cldUrl(url, width) {
  const m = typeof url === "string" ? CLD.exec(url) : null;
  if (!m) return url;
  return `${m[1]}f_auto,q_auto,c_limit,w_${width}/${m[2]}`;
}

export function cldSrcSet(url, widths) {
  if (typeof url !== "string" || !CLD.test(url)) return undefined;
  return widths.map((w) => `${cldUrl(url, w)} ${w}w`).join(", ");
}

// "Speed → Cloudinary srcset" switch from the admin panel, shared with every
// photo through context so no photo component needs an extra prop.
export const SpeedContext = createContext({ srcset: false, lcp: false });

const DEFAULT_WIDTHS = [240, 360, 480, 720, 960];

// Drop-in <img>: identical to a normal image unless the switch is on and the
// photo is a Cloudinary link.
export function Img({ src, sizes = "(max-width: 700px) 50vw, 300px", widths = DEFAULT_WIDTHS, priority = false, ...rest }) {
  const { srcset, lcp } = useContext(SpeedContext);
  const first = !!(priority && lcp);
  const set = srcset ? cldSrcSet(src, widths) : undefined;
  const best = set ? cldUrl(src, widths[Math.min(2, widths.length - 1)]) : src;
  // "First big photo first": remember the top photo so the next visit can start fetching it before the app code loads.
  useEffect(() => {
    if (!first) return;
    try { localStorage.setItem("ttc_hero_v1", JSON.stringify({ src: best, set: set || "", sizes })); } catch (e) {}
  }, [first, best, set, sizes]);
  const pri = first ? { fetchpriority: "high" } : null;
  if (set) {
    return <img src={best} srcSet={set} sizes={sizes} decoding="async" {...pri} {...rest} />;
  }
  return <img src={src} {...pri} {...rest} />;
}
