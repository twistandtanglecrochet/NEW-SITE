/* Twist & Tangle Crochet — service worker (switched on from Admin → Site settings → Speed).
   - The shop page and its files are saved after the first visit, so the site opens quickly
     and still opens on a weak or missing connection.
   - Photos and fonts are shown from the saved copy and refreshed in the background.
   - Orders, Firebase, analytics, /api and the admin pages are NEVER touched by this file. */
const VERSION = "ttc-v1";
const SHELL = `${VERSION}-shell`;
const STATIC = `${VERSION}-static`;
const MEDIA = `${VERSION}-media`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL).then((c) => c.addAll(["/", "/favicon.png"]).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("ttc-") && !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isMedia(url) {
  return url.hostname === "res.cloudinary.com" || url.hostname === "fonts.gstatic.com" || url.hostname === "fonts.googleapis.com";
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Pages: network first (always fresh when online), saved copy when offline.
  if (req.mode === "navigate") {
    if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/api/") || url.pathname.endsWith(".html")) return;
    event.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(SHELL).then((c) => c.put("/", copy)); return res; })
        .catch(() => caches.match("/").then((hit) => hit || new Response("You're offline. Please check your connection and try again.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } })))
    );
    return;
  }

  // Our own built files (hashed names never change): saved copy first.
  if (url.origin === self.location.origin && url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(STATIC).then((c) => c.put(req, copy)); }
        return res;
      }))
    );
    return;
  }

  // Photos and fonts: show the saved copy, refresh it in the background.
  if (isMedia(url)) {
    event.respondWith(
      caches.open(MEDIA).then((cache) =>
        cache.match(req).then((hit) => {
          const refresh = fetch(req).then((res) => { if (res.ok || res.type === "opaque") cache.put(req, res.clone()); return res; }).catch(() => hit);
          return hit || refresh;
        })
      )
    );
  }
  // everything else (Firebase, analytics, /api, …) goes straight to the network
});
