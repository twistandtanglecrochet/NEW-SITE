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
