import { useEffect, useMemo, useState } from "react";
import { doc } from "firebase/firestore";
import { watch, loadOnce } from "../lib/live";
import { db } from "../firebase";
import {
  SETTINGS_PATH,
  mergeSettings,
  readCachedSettings,
  writeCachedSettings,
} from "../data/siteSettings.js";
import { makeT, tEnglish } from "../data/i18n.js";

// Live site settings from the admin panel. The last seen copy is kept in the
// browser, so a returning visitor sees the right layout instantly and the
// site still works if Firebase can't be reached. A first-time visitor (or a
// failed read) simply gets the defaults — everything OFF.
// Admin "Preview before saving": /?previewSettings=1 shows the shop with the unsaved settings the admin
// panel stored in this browser. Nothing is saved or changed for customers.
function readPreviewSettings() {
  try {
    if (typeof window === "undefined" || new URLSearchParams(window.location.search).get("previewSettings") !== "1") return null;
    const raw = JSON.parse(localStorage.getItem("ttc_preview_settings") || "null");
    return raw ? mergeSettings(raw) : null;
  } catch (e) { return null; }
}

export function useSiteSettings(seed) {
  const [settings, setSettings] = useState(() => readPreviewSettings() || (seed ? mergeSettings(seed) : readCachedSettings()));

  useEffect(() => {
    if (readPreviewSettings()) {
      const bar = document.createElement("div");
      bar.textContent = "PREVIEW: these changes are not saved yet. Close this tab and press Save in the admin to publish.";
      bar.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:9999;background:#B98A2E;color:#fff;font:700 13px system-ui;padding:8px 12px;text-align:center";
      document.body.appendChild(bar);
      return () => bar.remove();
    }
    const unsub = watch(
      doc(db, ...SETTINGS_PATH),
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data() || {};
        writeCachedSettings(data);
        setSettings(mergeSettings(data));
      },
      () => {}, // keep whatever we already have
      loadOnce()
    );
    return () => unsub();
  }, []);

  return [settings, (raw) => { writeCachedSettings(raw); setSettings(mergeSettings(raw)); }];
}

const LANG_KEY = "ttc_lang";

// Your own English -> Urdu pairs (Admin → Translations → “Other text”). While the shop is in Urdu, any text on
// the page that matches an English entry exactly is shown in Urdu. Switching back to English restores it.
export function useExtraTranslations(lang, extra) {
  useEffect(() => {
    const map = new Map((Array.isArray(extra) ? extra : []).filter((x) => x && String(x.en || "").trim() && String(x.ur || "").trim()).map((x) => [String(x.en).trim(), String(x.ur).trim()]));
    if (lang !== "ur" || !map.size || typeof document === "undefined") return undefined;
    const originals = new WeakMap(); const attrs = new WeakMap(); let busy = false;
    const walk = (root) => {
      busy = true;
      try {
        const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        let n; while ((n = w.nextNode())) {
          const par = n.parentNode && n.parentNode.nodeName; if (par === "SCRIPT" || par === "STYLE" || par === "TEXTAREA") continue;
          const cur = n.nodeValue.trim(); const base = originals.has(n) ? originals.get(n) : cur;
          if (map.has(base) && (cur === base || cur === map.get(base))) { if (!originals.has(n)) originals.set(n, base); n.nodeValue = n.nodeValue.replace(cur, map.get(base)); }
        }
        if (root.querySelectorAll) root.querySelectorAll("[placeholder]").forEach((el) => { const p = el.getAttribute("placeholder"); const b = attrs.has(el) ? attrs.get(el) : p; if (map.has(b)) { attrs.set(el, b); el.setAttribute("placeholder", map.get(b)); } });
      } finally { busy = false; }
    };
    walk(document.body);
    const mo = new MutationObserver((ms) => { if (busy) return; ms.forEach((m) => m.addedNodes.forEach((a) => { if (a.nodeType === 1) walk(a); else if (a.nodeType === 3 && a.parentNode) walk(a.parentNode); })); });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
      while ((n = w.nextNode())) { if (originals.has(n)) n.nodeValue = n.nodeValue.replace(n.nodeValue.trim(), originals.get(n)); }
      document.querySelectorAll("[placeholder]").forEach((el) => { if (attrs.has(el)) el.setAttribute("placeholder", attrs.get(el)); });
    };
  }, [lang, extra]);
}

// Language + t("key"). With Translations switched off this is plain English,
// identical to the original text.
export function useI18n(settings) {
  const on = !!(settings.i18n && settings.i18n.on);
  const [chosen, setChosen] = useState(() => {
    try { return localStorage.getItem(LANG_KEY) || ""; } catch (e) { return ""; }
  });
  const lang = on ? (chosen === "ur" || chosen === "en" ? chosen : settings.i18n.defaultLang === "ur" ? "ur" : "en") : "en";

  const t = useMemo(
    () => (on ? makeT(lang, settings.i18n) : tEnglish),
    [on, lang, settings.i18n]
  );

  function setLang(next) {
    setChosen(next);
    try { localStorage.setItem(LANG_KEY, next); } catch (e) {}
  }
  return { lang, setLang, t, enabled: on };
}

// Small helper for "list of product ids saved in this browser" — used by the
// wishlist and the recently-viewed strip. Works without login.
export function useIdList(storageKey, max) {
  const [ids, setIds] = useState(() => {
    try {
      const v = JSON.parse(localStorage.getItem(storageKey) || "[]");
      return Array.isArray(v) ? v.map(String) : [];
    } catch (e) { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(ids)); } catch (e) {}
  }, [ids, storageKey]);

  return [
    ids,
    {
      has: (id) => ids.includes(String(id)),
      toggle: (id) => setIds((cur) => (cur.includes(String(id)) ? cur.filter((x) => x !== String(id)) : [String(id), ...cur].slice(0, max || 200))),
      remove: (id) => setIds((cur) => cur.filter((x) => x !== String(id))),
      // newest first, no duplicates
      push: (id) => setIds((cur) => [String(id), ...cur.filter((x) => x !== String(id))].slice(0, max || 20)),
    },
  ];
}
