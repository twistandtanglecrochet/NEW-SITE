import React from "react";
import { MessageCircle } from "lucide-react";
import { COLORS } from "../data/colors.js";
import { LOGO_SRC, BG_SRC } from "../data/siteImages.js";

// Shown instead of the shop while Maintenance mode is on (Admin → Site settings).
// The admin panel itself keeps working.
export default function MaintenancePage({ title, message, whatsapp }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      backgroundColor: COLORS.bg, backgroundImage: `url(${BG_SRC})`, backgroundSize: "cover", backgroundPosition: "top center",
      color: COLORS.charcoal, fontFamily: "'Karla', sans-serif",
    }}>
      <div style={{ background: "rgba(251,246,240,0.92)", borderRadius: 24, padding: "36px 28px", maxWidth: 420, textAlign: "center" }}>
        <img src={LOGO_SRC} alt="Twist & Tangle Crochet logo" style={{ height: 96, width: "auto", margin: "0 auto 12px", display: "block" }} />
        <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 30, color: COLORS.maroonDark, margin: "0 0 12px" }}>{title}</h1>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: "#5A4E46", margin: "0 0 22px" }}>{message}</p>
        <a
          href={`https://wa.me/${whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#25D366", color: "#fff", textDecoration: "none", borderRadius: 999, padding: "11px 22px", fontWeight: 700, fontSize: 14 }}
        >
          <MessageCircle size={16} /> WhatsApp
        </a>
      </div>
    </div>
  );
}
