import React from "react";
import { MapPin, Clock } from "lucide-react";
import { COLORS } from "../data/colors.js";

// "Visit our store": address, timings and a map button.
export default function VisitStore({ visit, timings, t, photos }) {
  const pics = (Array.isArray(photos) ? photos : []).filter((u) => /^https?:\/\//i.test(String(u || ""))).slice(0, 6);
  const address = String(visit.address || "").trim();
  const mapUrl = String(visit.mapUrl || "").trim() || (address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : "");
  const hours = timings && timings.on ? String(timings.text || "").trim() : "";
  if (!address && !mapUrl && !hours) return null;
  const rows = (s) => s.split("\n").map((line, i) => <div key={i}>{line}</div>);

  return (
    <section style={{ padding: "var(--ttc-section-space, 20px) 20px", maxWidth: 1000, margin: "0 auto" }}>
      <div className="ttc-shop-panel" style={{ background: "rgba(251,246,240,0.82)", backdropFilter: "blur(4px)", borderRadius: "var(--ttc-panel-radius, 24px)" }}>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 28, color: COLORS.maroonDark, margin: "0 0 16px" }}>
          {visit.title || t("visit.title")}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "var(--ttc-gap, 14px)" }}>
          {address && (
            <div style={{ background: COLORS.cream, borderRadius: "var(--ttc-card-radius, 18px)", padding: 18, display: "flex", gap: 12 }}>
              <MapPin size={20} color={COLORS.maroon} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 14, lineHeight: 1.6, color: COLORS.charcoal }}>{rows(address)}</div>
            </div>
          )}
          {hours && (
            <div style={{ background: COLORS.cream, borderRadius: "var(--ttc-card-radius, 18px)", padding: 18, display: "flex", gap: 12 }}>
              <Clock size={20} color={COLORS.maroon} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#7A6E64", marginBottom: 2 }}>{t("visit.hours")}</div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: COLORS.charcoal }}>{rows(hours)}</div>
              </div>
            </div>
          )}
        </div>
        {pics.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--ttc-gap, 14px)", marginTop: 16 }}>
            {pics.map((u, i) => <img key={i} src={u} alt="" loading="lazy" style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", borderRadius: "var(--ttc-card-radius, 18px)", display: "block" }} />)}
          </div>
        )}
        {mapUrl && (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8, marginTop: 16, background: COLORS.navy,
              color: COLORS.cream, textDecoration: "none", padding: "12px 22px", borderRadius: 999, fontWeight: 700, fontSize: 14,
            }}
          >
            <MapPin size={16} /> {visit.buttonLabel || t("visit.map")}
          </a>
        )}
      </div>
    </section>
  );
}
