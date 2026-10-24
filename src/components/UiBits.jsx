import React, { useEffect, useState } from "react";
import { Download, Truck } from "lucide-react";
import { COLORS } from "../data/colors.js";

// Small pieces used in several places: free-delivery bar, price filter,
// language button and the "Install app" button.

export function FreeDeliveryBar({ threshold, subtotal, t }) {
  const goal = Number(threshold) || 0;
  if (goal <= 0 || subtotal <= 0) return null;
  const left = Math.max(0, goal - subtotal);
  const pct = Math.min(100, Math.round((subtotal / goal) * 100));
  return (
    <div style={{ background: COLORS.blushSoft, borderRadius: 12, padding: "10px 12px", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color: COLORS.maroonDark, marginBottom: 7 }}>
        <Truck size={15} />
        {left > 0 ? t("delivery.left", { amount: left }) : t("delivery.free")}
      </div>
      <div style={{ height: 6, borderRadius: 999, background: "rgba(110,30,54,0.15)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: left > 0 ? COLORS.maroon : COLORS.gold, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

export function PriceFilter({ min, max, onMin, onMax, onClear, bounds, t }) {
  const field = {
    width: 92, padding: "7px 10px", borderRadius: 999, border: `1.3px solid ${COLORS.bgSoft}`,
    fontSize: 12.5, background: COLORS.cream, color: COLORS.charcoal,
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 12.5, color: "#7A6E64", marginBottom: 18 }}>
      <span>{t("price.label")}</span>
      <input
        type="number" inputMode="numeric" min="0" value={min} onChange={(e) => onMin(e.target.value)}
        placeholder={`${t("price.min")} ${bounds.min}`} aria-label={t("price.min")} style={field}
      />
      <span>–</span>
      <input
        type="number" inputMode="numeric" min="0" value={max} onChange={(e) => onMax(e.target.value)}
        placeholder={`${t("price.max")} ${bounds.max}`} aria-label={t("price.max")} style={field}
      />
      {(min !== "" || max !== "") && (
        <button onClick={onClear} style={{ background: "none", border: "none", color: COLORS.maroon, fontWeight: 700, fontSize: 12.5, textDecoration: "underline" }}>
          {t("price.clear")}
        </button>
      )}
    </div>
  );
}

export function LangToggle({ lang, onChange, compact }) {
  const next = lang === "ur" ? "en" : "ur";
  return (
    <button
      onClick={() => onChange(next)}
      aria-label={next === "ur" ? "اردو میں دیکھیں" : "Switch to English"}
      style={{
        border: `1.3px solid ${COLORS.navy}`, background: "transparent", color: COLORS.navy, borderRadius: 999,
        padding: compact ? "3px 10px" : "6px 13px", fontSize: compact ? 12 : 12.5, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0,
      }}
    >
      {next === "ur" ? "اردو" : "English"}
    </button>
  );
}

// Remembers the browser's "install this app" offer so our own button can use it.
export function useInstallPrompt(enabled) {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(false);
  const standalone = typeof window !== "undefined" && (
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true
  );
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isIOS = /iphone|ipad|ipod/i.test(ua);

  useEffect(() => {
    if (!enabled) return undefined;
    const onPrompt = (e) => { e.preventDefault(); setDeferred(e); };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [enabled]);

  return {
    visible: enabled && !standalone && !installed && (!!deferred || isIOS),
    isIOS,
    async install() {
      if (!deferred) return false;
      deferred.prompt();
      try { await deferred.userChoice; } catch (e) {}
      setDeferred(null);
      return true;
    },
  };
}

export function InstallButton({ pwa, t, onIosHelp, compact }) {
  if (!pwa.visible) return null;
  return (
    <button
      onClick={() => { pwa.install().then((ok) => { if (!ok && onIosHelp) onIosHelp(); }); }}
      style={{
        display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", flexShrink: 0,
        border: `1.3px solid ${COLORS.maroon}`, background: "transparent", color: COLORS.maroon,
        borderRadius: 999, padding: compact ? "3px 10px" : "6px 13px", fontSize: compact ? 12 : 12.5, fontWeight: 700,
      }}
    >
      <Download size={compact ? 13 : 14} /> {t("install.button")}
    </button>
  );
}
