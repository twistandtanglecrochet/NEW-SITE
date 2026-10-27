// Uploads a customer's review photo to Cloudinary (same account as the admin portal). Returns the image URL.
export const PHOTO_MAX_MB = 8;
const CLOUD = "kqcnm3ge";
const PRESET = "TTC SITE";
export async function uploadReviewPhoto(file) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", PRESET);
  const r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, { method: "POST", body: fd });
  if (!r.ok) throw new Error("upload " + r.status);
  const j = await r.json();
  if (!j.secure_url) throw new Error("no url");
  return j.secure_url;
}
