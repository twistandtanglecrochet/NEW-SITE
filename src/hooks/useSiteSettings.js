import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
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
export function useSiteSettings(seed) {
  const [settings, setSettings] = useState(() => (seed ? mergeSettings(seed) : readCachedSettings()));

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, ...SETTINGS_PATH),
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data() || {};
        writeCachedSettings(data);
        setSettings(mergeSettings(data));
      },
      () => {} // keep whatever we already have
    );
    return () => unsub();
  }, []);

  return [settings, (raw) => { writeCachedSettings(raw); setSettings(mergeSettings(raw)); }];
}

const LANG_KEY = "ttc_lang";

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
