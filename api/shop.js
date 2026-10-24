// GET /api/shop
// A fast, cached copy of the shop's data for the storefront:
//   { products: [...], settings: {...} | null, at: "<time>" }
// Products come from the same Firestore collection the shop uses (the built-in
// starter products are added by the shop itself). The storefront uses this
// only when "Fast shop data" is switched on in Admin → Site settings → Speed,
// and still talks to Firebase directly for live updates. If Firestore can't be
// reached this answers with the last good copy (or a 503 so the shop falls
// back to its own saved copy).
//
// Vercel's edge keeps each answer for 60 seconds, so most visitors get it
// without Firestore being asked at all.

import { firebaseConfig } from "../src/data/firebaseConfig.js";

const FIRESTORE_TIMEOUT_MS = 8000;
let lastGood = null; // survives between calls while the function is warm

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, OPTIONS");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let body = null;
  try {
    const [products, settings] = await Promise.all([fetchCollection("products"), fetchDoc("config", "siteSettings")]);
    products.sort((a, b) => {
      const aHas = typeof a.order === "number";
      const bHas = typeof b.order === "number";
      if (aHas && bHas) return a.order - b.order;
      if (aHas) return -1;
      if (bHas) return 1;
      return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
    });
    body = { products, settings, at: new Date().toISOString() };
    lastGood = body;
  } catch (err) {
    console.warn("[api/shop] Firestore unavailable:", err.message);
    body = lastGood;
  }

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (!body) {
    res.setHeader("Cache-Control", "no-store");
    res.status(503).send(JSON.stringify({ error: "shop data unavailable" }));
    return;
  }
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=600");
  res.status(200).send(JSON.stringify(body));
}

function base() {
  return `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;
}

async function fetchCollection(name) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FIRESTORE_TIMEOUT_MS);
  try {
    let all = [];
    let pageToken;
    do {
      const url = new URL(`${base()}/${name}`);
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

// null when the document doesn't exist or can't be read (settings are optional).
async function fetchDoc(collection, id) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FIRESTORE_TIMEOUT_MS);
  try {
    const url = new URL(`${base()}/${collection}/${id}`);
    url.searchParams.set("key", firebaseConfig.apiKey);
    const r = await fetch(url, { signal: controller.signal });
    if (!r.ok) return null;
    const d = parseDoc(await r.json());
    delete d.id;
    return d;
  } catch (e) {
    return null;
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
