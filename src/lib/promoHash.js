// Same scrambling as the admin portal, so customers can't list promo codes.
export async function promoHash(code) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(String(code || "").trim().toUpperCase()), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode("ttc-promo-v1"), iterations: 20000 }, key, 128);
  return Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
