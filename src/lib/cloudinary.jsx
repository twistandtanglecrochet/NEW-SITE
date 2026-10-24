import { createContext, useContext } from "react";

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
export const SpeedContext = createContext({ srcset: false });

const DEFAULT_WIDTHS = [240, 360, 480, 720, 960];

// Drop-in <img>: identical to a normal image unless the switch is on and the
// photo is a Cloudinary link.
export function Img({ src, sizes = "(max-width: 700px) 50vw, 300px", widths = DEFAULT_WIDTHS, ...rest }) {
  const { srcset } = useContext(SpeedContext);
  if (srcset) {
    const set = cldSrcSet(src, widths);
    if (set) {
      return <img src={cldUrl(src, widths[Math.min(2, widths.length - 1)])} srcSet={set} sizes={sizes} decoding="async" {...rest} />;
    }
  }
  return <img src={src} {...rest} />;
}
