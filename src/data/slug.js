// Turns a category name into the URL-safe slug used in /category/<slug>
// links. Shared between the running site (src/App.jsx) and the build-time
// SEO page generator (scripts/generate-seo.mjs) so the two can never drift
// apart and produce mismatched links.
export function categorySlug(cat) {
  return encodeURIComponent(String(cat).trim().toLowerCase().replace(/\s+/g, "-"));
}
