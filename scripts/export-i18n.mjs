// Writes two small JSON files for the admin panel (a standalone page that
// can't import the site's code):
//   public/i18n-defaults.json          every shop text, English + Urdu
//   public/site-settings-defaults.json the starting value of every setting
// Runs automatically before `npm run dev` and `npm run build`.
import { writeFileSync, mkdirSync } from "node:fs";
import { STRINGS } from "../src/data/i18n.js";
import { DEFAULT_SETTINGS, SECTION_IDS } from "../src/data/siteSettings.js";

mkdirSync(new URL("../public/", import.meta.url), { recursive: true });
writeFileSync(new URL("../public/i18n-defaults.json", import.meta.url), JSON.stringify(STRINGS, null, 2) + "\n");
writeFileSync(
  new URL("../public/site-settings-defaults.json", import.meta.url),
  JSON.stringify({ defaults: DEFAULT_SETTINGS, sectionIds: SECTION_IDS }, null, 2) + "\n"
);
console.log("[admin-defaults] wrote public/i18n-defaults.json and public/site-settings-defaults.json");
