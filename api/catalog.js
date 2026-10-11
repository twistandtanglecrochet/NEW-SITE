// GET /api/catalog
// Public list of products that are currently for sale, for the invoicing
// app. Response is a JSON array with only name and price:
//   [ { "name": "Crochet Flower", "price": 450 }, ... ]
//
// Uses the same product list as the shop: products from the admin panel
// (Firestore), plus any built-in starter product (src/data/products.js)
// that hasn't been imported into the admin panel yet. Products tagged
// "Sold Out" in the admin panel are left out.
//
// This is a Vercel serverless function (the site is React + Vite, so it
// lives in /api rather than a Next.js app/api route).

import { SEED_PRODUCTS } from "../src/data/products.js";
import { firebaseConfig } from "../src/data/firebaseConfig.js";

const FIRESTORE_TIMEOUT_MS = 8000;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, OPTIONS");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let fromFirestore = [];
  try {
    fromFirestore = await fetchFirestoreProducts();
  } catch (err) {
    // Same as the shop: if Firestore can't be reached, fall back to the
    // built-in starter products rather than returning nothing.
    console.warn("[api/catalog] Firestore unavailable, using starter products only:", err.message);
  }

  fromFirestore.sort((a, b) => {
    const aHas = typeof a.order === "number";
    const bHas = typeof b.order === "number";
    if (aHas && bHas) return a.order - b.order;
    if (aHas) return -1;
    if (bHas) return 1;
    return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
  });

  const importedSeedIds = new Set(fromFirestore.map((p) => p.seedId).filter(Boolean));
  const remainingSeed = SEED_PRODUCTS.filter((p) => !importedSeedIds.has(p.id));

  const catalog = [...fromFirestore, ...remainingSeed]
    .filter((p) => p && p.tag !== "Sold Out")
    .map((p) => ({ name: String(p.name || "").trim(), price: Number(p.price) }))
    .filter((p) => p.name && Number.isFinite(p.price));

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  // Cached on Vercel's edge for 60s, so admin-panel changes show up within a minute.
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  res.status(200).send(JSON.stringify(catalog));
}

async function fetchFirestoreProducts() {
  const base = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/products`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FIRESTORE_TIMEOUT_MS);
  try {
    let all = [];
    let pageToken;
    do {
      const url = new URL(base);
      url.searchParams.set("pageSize", "300");
      url.searchParams.set("key", firebaseConfig.apiKey);
      if (pageToken) url.searchParams.set("pageToken", pageToken);
      const r = await fetch(url, { signal: controller.signal });
      if (!r.ok) throw new Error(`Firestore HTTP ${r.status}`);
      const data = await r.json();
      all = all.concat((data.documents || []).map(parseDoc));
      pageToken = data.nextPageToken;
    } while (pageToken);
    return all;
  } finally {
    clearTimeout(timer);
  }
}

function parseDoc(doc) {
  const obj = { id: doc.name.split("/").pop() };
  for (const [k, v] of Object.entries(doc.fields || {})) obj[k] = toJs(v);
  return obj;
}

function toJs(v) {
  if (v == null) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("timestampValue" in v) return v.timestampValue;
  if ("nullValue" in v) return null;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(toJs);
  if ("mapValue" in v) {
    const out = {};
    for (const [k, vv] of Object.entries(v.mapValue.fields || {})) out[k] = toJs(vv);
    return out;
  }
  return null;
}
