import { onSnapshot, getDoc, getDocs } from "firebase/firestore";
import { readCachedSettings } from "../data/siteSettings";

// "Load shop data once" (Admin → Speed): with the switch on, a document or list
// is read once per visit instead of staying connected. Same callbacks either way.
export function loadOnce() {
  try { return !!readCachedSettings().speed.noLive; } catch (e) { return false; }
}

export function watch(target, next, err, once) {
  if (!once) return onSnapshot(target, next, err);
  let dead = false;
  const run = target && target.type === "document" ? getDoc(target) : getDocs(target);
  run.then((snap) => { if (!dead) next(snap); }).catch((e) => { if (!dead && err) err(e); });
  return () => { dead = true; };
}

// Fast shop data (Admin → Speed): with "apiShop" on, try /api/shop first; if it
// has nothing for this item (pick() returns undefined) or fails, fall back to
// Firestore. Signature: watchApi(pick, applyApi, target, applySnap, err, once)
export function watchApi(pick, applyApi, target, applySnap, err, once) {
  let useApi = false, apiOnly = false;
  try { const s = readCachedSettings().speed; useApi = !!s.apiShop; apiOnly = !!s.apiOnly; } catch (e) {}
  if (!useApi) return watch(target, applySnap, err, once);
  let dead = false, stopFs = null;
  const startFs = () => { if (!dead && !stopFs) stopFs = watch(target, applySnap, err, once); };
  fetch("/api/shop")
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error("api " + r.status))))
    .then((d) => {
      if (dead) return;
      const v = pick(d || {});
      if (v === undefined) { startFs(); return; }
      applyApi(v);
      if (!apiOnly) startFs();
    })
    .catch(startFs);
  return () => { dead = true; if (stopFs) stopFs(); };
}
