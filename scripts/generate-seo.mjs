#!/usr/bin/env node
// Runs automatically right after `npm run build` (see the "postbuild"
// script in package.json — npm runs it for you, nothing to remember).
//
// What it does: it writes extra static files into dist/ so that every
// category and every product gets its OWN real page — with its own title,
// description, and preview photo — instead of every shared link always
// showing the generic homepage. That's what makes a product or category
// link actually show that product/category when pasted into WhatsApp,
// Instagram, Facebook, or an ad. It also regenerates dist/sitemap.xml to
// list every one of those pages so Google can find them.
//
// This never changes how the site behaves for a real visitor — it only adds
// extra files next to the ones Vite already built. A real visitor's browser
// always runs the normal React app, which is why these generated files are
// just copies of dist/index.html with different <head> tags.
//
// Safety: this reaches out to Firestore over the network at build time to
// include any products added through the admin portal. If that fails for
// any reason (or anything else in this file goes wrong), it's caught and
// logged as a warning — the build still succeeds and the site still
// deploys normally, just without that refresh for this one deploy.

import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SEED_PRODUCTS } from "../src/data/products.js";
import { categorySlug } from "../src/data/slug.js";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "../src/data/siteConfig.js";
import { firebaseConfig } from "../src/data/firebaseConfig.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIST = join(ROOT, "dist");
const FETCH_TIMEOUT_MS = 10000;
const DEFAULT_OG_IMAGE = `${SITE_URL}/og/default.jpg`;

async function main() {
  if (!existsSync(DIST)) {
    console.warn("[generate-seo] dist/ not found (did `vite build` run first?) — skipping.");
    return;
  }

  const template = readFileSync(join(DIST, "index.html"), "utf8");

  const firestoreProducts = await fetchFirestoreProducts().catch((err) => {
    console.warn(
      "[generate-seo] Couldn't fetch live products from Firestore for these pages — continuing with just the built-in catalog. Reason:",
      err.message
    );
    return [];
  });

  // Same rule the live site follows: merge, never replace the built-in catalog.
  const products = dedupeById([...firestoreProducts, ...SEED_PRODUCTS]);
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  let decodedImages = 0;
  for (const p of products) {
    try {
      const { url, decoded } = resolveOgImage(p);
      p.__ogImage = url;
      if (decoded) decodedImages++;
    } catch (err) {
      console.warn(`[generate-seo] Couldn't prepare a preview photo for "${p.name || p.id}" — using the default site photo instead. Reason:`, err.message);
      p.__ogImage = DEFAULT_OG_IMAGE;
    }
  }

  let productPageCount = 0;
  for (const p of products) {
    if (!p.id || !isSafePathPart(String(p.id))) continue;
    const url = `${SITE_URL}/product/${encodeURIComponent(p.id)}`;
    const html = renderPage(template, {
      title: `${p.name} — ${SITE_NAME}`,
      description: truncate(p.desc || SITE_DESCRIPTION, 300),
      url,
      image: p.__ogImage,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Product",
        name: p.name,
        description: p.desc || SITE_DESCRIPTION,
        category: p.category,
        image: p.__ogImage,
        brand: { "@type": "Brand", name: SITE_NAME },
        offers: {
          "@type": "Offer",
          priceCurrency: "PKR",
          price: p.price,
          availability: "https://schema.org/InStock",
          url,
        },
      },
    });
    writeFile(join(DIST, "product", String(p.id), "index.html"), html);
    productPageCount++;
  }

  let categoryPageCount = 0;
  for (const cat of categories) {
    const slug = categorySlug(cat);
    if (!isSafePathPart(slug)) continue;
    const url = `${SITE_URL}/category/${slug}`;
    const inCategory = products.filter((p) => p.category === cat);
    const sampleNames = inCategory.slice(0, 3).map((p) => p.name).filter(Boolean).join(", ");
    const image = inCategory.find((p) => p.__ogImage)?.__ogImage || DEFAULT_OG_IMAGE;
    const html = renderPage(template, {
      title: `${cat} — ${SITE_NAME}`,
      description: truncate(
        `Shop handmade ${cat} from Twist & Tangle Crochet (TTC) — made to order in Lahore, Pakistan.` +
          (sampleNames ? ` Including ${sampleNames}.` : ""),
        300
      ),
      url,
      image,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `${cat} — ${SITE_NAME}`,
        url,
        about: cat,
      },
    });
    writeFile(join(DIST, "category", slug, "index.html"), html);
    categoryPageCount++;
  }

  writeSitemap(products, categories);

  console.log(
    `[generate-seo] Wrote ${productPageCount} product page(s), ${categoryPageCount} category page(s), decoded ${decodedImages} preview photo(s), and refreshed sitemap.xml.`
  );
}

// ---------------------------------------------------------------------------
// Firestore (read-only, unauthenticated — the same "products" data the live
// site itself reads from the browser with no sign-in required).
// ---------------------------------------------------------------------------

async function fetchFirestoreProducts() {
  const projectId = firebaseConfig.projectId;
  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/products`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    let all = [];
    let pageToken;
    do {
      const url = new URL(base);
      url.searchParams.set("pageSize", "300");
      if (pageToken) url.searchParams.set("pageToken", pageToken);
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        // Any non-2xx (permission-denied, wrong project ID, network block,
        // etc.) is surfaced as a warning by the caller rather than silently
        // treated as "no products" — that keeps a real misconfiguration
        // visible in the Vercel build log instead of hiding it.
        const body = await res.text().catch(() => "");
        throw new Error(`Firestore REST request failed with HTTP ${res.status}${body ? `: ${body.slice(0, 200)}` : ""}`);
      }
      const data = await res.json();
      const docs = data.documents || [];
      all = all.concat(docs.map(parseFirestoreDoc));
      pageToken = data.nextPageToken;
    } while (pageToken);
    return all;
  } finally {
    clearTimeout(timer);
  }
}

function parseFirestoreDoc(doc) {
  const id = doc.name.split("/").pop();
  const fields = doc.fields || {};
  const obj = { id };
  for (const [key, val] of Object.entries(fields)) {
    obj[key] = firestoreValueToJs(val);
  }
  return obj;
}

function firestoreValueToJs(v) {
  if (v == null) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("timestampValue" in v) return v.timestampValue;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(firestoreValueToJs);
  if ("mapValue" in v) {
    const out = {};
    for (const [k, vv] of Object.entries(v.mapValue.fields || {})) out[k] = firestoreValueToJs(vv);
    return out;
  }
  return null;
}

function dedupeById(products) {
  const seen = new Set();
  const out = [];
  for (const p of products) {
    if (!p || !p.id || seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Preview photos
// ---------------------------------------------------------------------------

const MIME_TO_EXT = { jpeg: "jpg", jpg: "jpg", png: "png", webp: "webp", gif: "gif" };

function resolveOgImage(p) {
  const firstPhoto =
    (Array.isArray(p.photos) && p.photos[0]) ||
    (Array.isArray(p.variants) && p.variants[0] && p.variants[0].photo) ||
    null;

  if (!firstPhoto) return { url: DEFAULT_OG_IMAGE, decoded: false };

  if (/^https?:\/\//i.test(firstPhoto)) {
    // Already hosted somewhere (e.g. Cloudinary, for admin-added products) — use it directly.
    return { url: firstPhoto, decoded: false };
  }

  const dataUriMatch = /^data:image\/(\w+);base64,(.+)$/s.exec(firstPhoto);
  if (dataUriMatch) {
    const ext = MIME_TO_EXT[dataUriMatch[1].toLowerCase()] || "jpg";
    const buffer = Buffer.from(dataUriMatch[2], "base64");
    const outPath = join(DIST, "og", `${p.id}.${ext}`);
    writeFile(outPath, buffer);
    return { url: `${SITE_URL}/og/${p.id}.${ext}`, decoded: true };
  }

  return { url: DEFAULT_OG_IMAGE, decoded: false };
}

// ---------------------------------------------------------------------------
// HTML generation
// ---------------------------------------------------------------------------

function renderPage(template, { title, description, url, image, jsonLd }) {
  let html = template;
  html = replaceTagContent(html, /<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
  html = replaceMetaContent(html, "name", "description", description);
  html = replaceMetaContent(html, "property", "og:title", title);
  html = replaceMetaContent(html, "property", "og:description", description);
  html = replaceMetaContent(html, "property", "og:url", url);
  html = replaceMetaContent(html, "property", "og:image", image);
  html = replaceMetaContent(html, "name", "twitter:title", title);
  html = replaceMetaContent(html, "name", "twitter:description", description);
  html = replaceMetaContent(html, "name", "twitter:image", image);
  // Per-page image dimensions aren't known here (could be any decoded photo
  // or an external Cloudinary URL) — drop the homepage's fixed width/height
  // hints rather than state the wrong ones.
  html = html.replace(/\s*<meta property="og:image:width"[^>]*\/>\n?/i, "\n");
  html = html.replace(/\s*<meta property="og:image:height"[^>]*\/>\n?/i, "\n");
  html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${escapeHtml(url)}" />`);
  if (jsonLd) {
    const script = `    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n`;
    html = html.replace("</head>", `${script}  </head>`);
  }
  return html;
}

function replaceTagContent(html, pattern, replacement) {
  return html.replace(pattern, replacement);
}

function replaceMetaContent(html, attr, value, newContent) {
  const pattern = new RegExp(`(<meta ${attr}="${escapeRegExp(value)}" content=")[^"]*("\\s*/>)`);
  if (!pattern.test(html)) return html; // tag not present in this template — leave as-is
  return html.replace(pattern, (_, before, after) => `${before}${escapeHtml(newContent)}${after}`);
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function truncate(str, max) {
  const s = String(str || "");
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
}

function isSafePathPart(s) {
  return Boolean(s) && !s.includes("/") && !s.includes("..") && s.trim() === s;
}

// ---------------------------------------------------------------------------
// Sitemap
// ---------------------------------------------------------------------------

function writeSitemap(products, categories) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [{ loc: `${SITE_URL}/`, priority: "1.0" }];
  for (const cat of categories) {
    const slug = categorySlug(cat);
    if (isSafePathPart(slug)) urls.push({ loc: `${SITE_URL}/category/${slug}`, priority: "0.8" });
  }
  for (const p of products) {
    if (p.id && isSafePathPart(String(p.id))) {
      urls.push({ loc: `${SITE_URL}/product/${encodeURIComponent(p.id)}`, priority: "0.7" });
    }
  }
  const body = urls
    .map(
      (u) =>
        `  <url>\n    <loc>${escapeHtml(u.loc)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
    )
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  writeFile(join(DIST, "sitemap.xml"), xml);
}

// ---------------------------------------------------------------------------

function writeFile(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

main().catch((err) => {
  console.warn(
    "[generate-seo] Skipped the extra product/category pages due to an unexpected error (this does NOT affect the main site, which already built successfully):",
    err
  );
  process.exitCode = 0;
});
