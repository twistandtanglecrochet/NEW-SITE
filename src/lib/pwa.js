// Install-as-app and offline support, switched on from the admin panel.
// Nothing here runs unless the matching switch is on.

const MANIFEST_ID = "ttc-manifest-link";
const SW_FLAG_KEY = "ttc_sw_on";

export function applyManifest(on) {
  const existing = document.getElementById(MANIFEST_ID);
  if (on && !existing) {
    const link = document.createElement("link");
    link.id = MANIFEST_ID;
    link.rel = "manifest";
    link.href = "/manifest.webmanifest";
    document.head.appendChild(link);
    let theme = document.querySelector('meta[name="theme-color"]');
    if (!theme) {
      theme = document.createElement("meta");
      theme.name = "theme-color";
      theme.content = "#6E1E36";
      theme.id = "ttc-theme-color";
      document.head.appendChild(theme);
    }
  } else if (!on && existing) {
    existing.remove();
    const theme = document.getElementById("ttc-theme-color");
    if (theme) theme.remove();
  }
}

// Lets the page use the area behind an iPhone's notch / home bar; the
// "safe-area" padding in App.jsx then keeps content out of those corners.
export function applySafeArea(on) {
  const meta = document.querySelector('meta[name="viewport"]');
  if (!meta) return;
  const content = meta.getAttribute("content") || "";
  const has = /viewport-fit=cover/.test(content);
  if (on && !has) meta.setAttribute("content", content + ", viewport-fit=cover");
  if (!on && has) meta.setAttribute("content", content.replace(/,\s*viewport-fit=cover/, ""));
}

export function applyServiceWorker(on) {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  let wasOn = false;
  try { wasOn = localStorage.getItem(SW_FLAG_KEY) === "1"; } catch (e) {}
  if (!on && !wasOn) return; // never switched on: leave everything alone
  try { localStorage.setItem(SW_FLAG_KEY, on ? "1" : "0"); } catch (e) {}
  if (on) {
    const register = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  } else {
    navigator.serviceWorker.getRegistrations()
      .then((regs) => regs.forEach((r) => r.unregister()))
      .catch(() => {});
    if (window.caches) caches.keys().then((keys) => keys.filter((k) => k.startsWith("ttc-")).forEach((k) => caches.delete(k))).catch(() => {});
  }
}
