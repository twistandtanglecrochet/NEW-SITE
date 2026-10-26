// Site settings that the shop owner controls from the admin panel
// (Admin → Site settings). They are saved in Firestore at config/siteSettings.
//
// EVERYTHING here is OFF by default, so until a switch is turned on in the
// admin panel the site looks and behaves exactly as it always did.
// Changing a number/text below only changes what the admin form starts with.

export const SETTINGS_PATH = ["config", "siteSettings"];
export const SETTINGS_CACHE_KEY = "ttc_settings_v1";

// Home-page parts that can be re-ordered / hidden from the admin panel.
export const SECTION_IDS = ["hero", "ads", "tiles", "bento", "shop", "recent", "reviews", "visit", "games"];

export const DEFAULT_SETTINGS = {
  // 0. Maintenance mode — shows a "back soon" page instead of the shop.
  maintenance: {
    on: false,
    title: "Jaldi wapas aayenge",
    message: "Hum site par thora kaam kar rahe hain. Order ya sawal ke liye WhatsApp par message karein.",
  },

  // Home
  heroReveal: { on: false, style: "rise", step: 140 }, // style: rise | fade | blur | slide | zoom
  rotator: { on: false, target: "Handmade", words: ["Handmade", "Cute", "Cozy"], targetUr: "", wordsUr: [], speed: 2200, fx: "rise" }, // fx: rise | fade | slide | flip | blur | zoom
  bento: {
    on: false,
    items: [
      { value: 500, suffix: "+", label: "Orders" },
      { value: 100, suffix: "%", label: "Handmade" },
    ],
  },
  reviewsShuffle: { on: false, limit: 6, fx: "rise", auto: false, every: 8, button: false, layout: "grid" }, reviewsAdd: { on: false, title: "Write a review", button: "Write a review", general: "Custom order", aboveFooter: false, footerText: "Bought from us? Tell us how it went" }, // fx: none | rise | fade | flip | pop
  categoryTiles: { on: false, title: "Shop by category", compact: false },
  visit: { on: false, title: "Visit our store", address: "", mapUrl: "", buttonLabel: "Open in Maps" },
  // Section order / visibility. While `on` is false the home page keeps its
  // original order (hero → shop → reviews).
  sections: {
    on: false,
    order: [...SECTION_IDS],
    visible: { hero: true, ads: true, tiles: true, bento: true, shop: true, recent: true, reviews: true, visit: true, games: true },
  },

  // "Get Fun" games (Yarn match, Photo puzzle, Spin the wheel). where: section | footer | both
  games: {
    on: false, title: "Get Fun by Playing Games", subtitle: "Play a quick game and win a little treat.", where: "section", footerLabel: "Get Fun",
    match: { on: true, size: "4x5", choose: true, code: "", prizeText: "" },
    puzzle: { on: true, size: 3, choose: true, pick: "random", ids: [], code: "", prizeText: "" },
    wheel: { on: true, oncePerDay: true, prizeText: "Use this code in your cart.", prizes: [{ label: "5% off", code: "", chance: 25 }, { label: "Free delivery", code: "", chance: 10 }, { label: "Try again", code: "", chance: 55 }, { label: "10% off", code: "", chance: 10 }] },
  },

  // Discount rules. mode: "both" = a promo code and a combo price add up (as it always was) | "best" = only the bigger one counts
  promoRules: { mode: "both" },

  // Header social icons (Instagram / Facebook / WhatsApp) in their own brand colours
  headerSocial: { official: false },

  // Home reviews: show the first few, then an "Explore more" button; "Show less" folds them back
  reviewsMore: { on: false, initial: 3, more: "Explore more", less: "Show less" },

  // Accessibility (PageSpeed): contrast = easier-to-read "Go" button and footer headings; touch = bigger tap area for the carousel dots
  access: { contrast: false, touch: false },

  // Marketing
  announcements: { on: false, style: "rotate", transition: "fade", speed: 4000, bars: [] }, // style: rotate | stack | marquee
  carousel: { on: false, autoplay: true, speed: 2500, transition: "slide", slides: [] }, // transition: slide | fade | zoom
  ads: { on: false, popupDelay: 3, items: [] },

  // Orders
  checkout: { giftNote: false, betterForm: false, strict: false, whatsappAuto: false, whatsappDelay: 2 }, // betterForm = city/email/postal + strict checks; whatsappAuto = open WhatsApp after the thank-you screen
  tracking: { on: false },
  faq: { on: false, footer: true, title: "Questions & returns", items: [
    { q: "How do I order?", a: "Choose a product, press Add to Cart or Buy Now, write your name, mobile number and full address, then press Place order. We confirm every order on WhatsApp or by call." },
    { q: "How can I pay?", a: "Payment is confirmed with you when we confirm your order on WhatsApp." },
    { q: "How do I track my order?", a: "Press “Track your order” and type your order number." },
    { q: "Are the pieces handmade?", a: "Yes. Every piece is crocheted by hand, so tiny differences are normal and make it special." },
  ], returnsTitle: "Returns & exchange", returns: "If something is wrong with your order, message us on WhatsApp with a photo and we will help you. (Please edit this text in Admin → Website → FAQ & returns.)" },
  bundles: { on: false, title: "Combo offers", items: [] },      // items: [{ name, price, productIds: [] }]
  cartPlus: { suggest: false, giftOn: false, giftOver: 2000, giftText: "Free gift wrap" },
  insta: { on: false, title: "Follow us on Instagram", link: "", posts: [] }, // posts: [{ image, link }]
  search: { suggest: false },                    // suggestions list under the search box
  orders: { numeric: false, start: 2000, slipWA: false },       // order numbers 2000, 2001, … instead of TTC-XXXXX
  myOrders: { on: false },                       // "My orders" for the customer (orders placed on this phone)

  // Product page + order guide
  productPage: { tabs: false, sizes: false, colours: false, includes: false, full: false, related: false, notify: false, seo: false }, // tabs = Description / Details; sizes & colours = "available" lines
  guide: {
    on: false, home: true, footer: true, buttonText: "Complete order guide", goText: "Go",
    title: "Complete order guide", intro: "Everything about ordering from Twist & Tangle Crochet, step by step.",
    steps: [
      { title: "Choose your product", text: "Browse the collection. Tap a product to see its photos, colours and details." },
      { title: "Pick colour and quantity", text: "Choose the colour you like (if there are several) and how many you want." },
      { title: "Add to cart or Buy now", text: "Add several things to your cart, or press Buy now to order one item quickly." },
      { title: "Enter your delivery details", text: "Write your full name, mobile number and complete address with house number, street, area and city." },
      { title: "Place your order", text: "Press Place order. You get an order number. Keep it safe: you need it to track your order." },
      { title: "We confirm your order", text: "We call or WhatsApp you to confirm your order, delivery charges and payment." },
      { title: "Track your order", text: "Use “Track your order” and type your order number to see where your parcel is." },
    ],
    tips: ["Payment: Cash on Delivery, JazzCash or Easypaisa.", "Every piece is handmade, so tiny differences are normal and make it special.", "Questions? Message us on WhatsApp, we are happy to help."],
  },

  // Footer (sorted layout) and Look & brand — all off until switched on
  footer: {
    on: false, headline: "Need help choosing? Message us and we'll guide you.", button: "Chat on WhatsApp",
    shopColumn: true, officialIcons: false, floatRight: false, columns: [], track: true, showTime: true, hours: { open: "", close: "" }, secondNumber: "",
    socials: { whatsapp: true, instagram: "https://www.instagram.com/twisttanglecrochet/", facebook: "https://www.facebook.com/twisttanlecrochet", tiktok: "" },
    copyright: "Copyright © {year} {shop}", lastLine: "Thanks for visiting",
  },
  brand: {
    on: false, shopName: "", logo: "", address1: "", address2: "", area: "",
    colors: { main: "", second: "", accent: "", bg: "" }, fonts: "default",
    texts: {}, // text overrides by key, e.g. "shop.title"
    photos: { on: false, list: [] },
  },

  // Motion (everything off until switched on)
  motion: {
    sections: { on: false, style: "fade-up" }, // fade-up | fade | zoom | slide
    cards: { on: false, hover: "lift", enter: "stagger" }, // hover: lift | zoom | none ; enter: stagger | none
    overlays: { on: false },
  },

  // Products
  cardLayout: { on: false, layout: 1 }, // 1 = the current card design
  priceFilter: { on: false },
  wishlist: { on: false, reminders: false }, // reminders: "Sold out" / "price dropped" notes on saved items
  recent: { on: false, max: 10 },
  exploreMore: { on: false, initial: 8, perDevice: false, initialTablet: 8, initialMobile: 6 },

  // Cart / delivery
  freeDelivery: { on: false, threshold: 0 }, // Rs; 0 = nothing to show

  // Footer / shop info
  footerLinks: { on: false, links: [] }, // [{ label, url }]
  timings: { on: false, text: "" },
  designedBy: { on: false, name: "", url: "" },

  // Look (defaults below equal today's look)
  look: { on: false, tight: false, gap: 22, cardRadius: 18, panelRadius: 24, photoRadius: 14, sectionSpace: 20 },

  // Languages
  i18n: { on: false, defaultLang: "en", en: {}, ur: {}, extra: [{"en": "Description", "ur": ""}, {"en": "Details", "ur": ""}, {"en": "Sizes available", "ur": ""}, {"en": "Colours available", "ur": ""}, {"en": "Price includes:", "ur": ""}, {"en": "My orders", "ur": ""}, {"en": "Track this order", "ur": ""}, {"en": "You may also like", "ur": ""}, {"en": "Notify me when it's back", "ur": ""}, {"en": "Complete order guide", "ur": ""}, {"en": "Start shopping", "ur": ""}, {"en": "Ask on WhatsApp", "ur": ""}, {"en": "Good to know", "ur": ""}, {"en": "Goes well with your order", "ur": ""}, {"en": "Add combo to cart", "ur": ""}, {"en": "Follow us on Instagram", "ur": ""}, {"en": "Combo offers", "ur": ""}, {"en": "Questions & returns", "ur": ""}, {"en": "Home", "ur": ""}, {"en": "See all results", "ur": ""}, {"en": "Add to Cart", "ur": ""}, {"en": "Buy Now", "ur": ""}] }, // extra: any English text on the shop -> your Urdu

  // Speed
  speed: { srcset: false, apiShop: false, sw: false, lightMotion: false, resizeUploads: false, uploadMax: 1600, lcp: false, boot: false, noLive: false, cv: false },

  // PWA
  pwa: { install: false, safeArea: false },
};

function isPlainObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

// Fills in anything missing from `remote` with the defaults (arrays are taken
// as-is from `remote`).
export function mergeSettings(remote, base = DEFAULT_SETTINGS) {
  const out = {};
  for (const key of Object.keys(base)) {
    const b = base[key];
    const r = remote ? remote[key] : undefined;
    if (isPlainObject(b)) out[key] = mergeSettings(isPlainObject(r) ? r : {}, b);
    else out[key] = r === undefined || r === null ? b : r;
  }
  // keep unknown keys inside free-form maps (i18n.en / i18n.ur, sections.visible)
  if (remote && base === DEFAULT_SETTINGS.i18n) {
    out.en = isPlainObject(remote.en) ? remote.en : {};
    out.ur = isPlainObject(remote.ur) ? remote.ur : {};
  }
  if (remote && base === DEFAULT_SETTINGS.brand) out.texts = isPlainObject(remote.texts) ? remote.texts : {};
  return out;
}

export function readCachedSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_CACHE_KEY);
    if (raw) return mergeSettings(JSON.parse(raw));
  } catch (e) {}
  // First visit: index.html asked /api/shop for the live settings while the page was loading.
  try { if (typeof window !== "undefined" && window.__ttcEarlySettings) return mergeSettings(window.__ttcEarlySettings); } catch (e) {}
  return mergeSettings({});
}

export function writeCachedSettings(remote) {
  try { localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(remote || {})); } catch (e) {}
}

// A section id list that is always complete and free of duplicates, even if an
// old or hand-edited setting is missing something.
export function normalizedOrder(order) {
  const seen = new Set();
  const out = [];
  (Array.isArray(order) ? order : []).forEach((id) => {
    if (SECTION_IDS.includes(id) && !seen.has(id)) { seen.add(id); out.push(id); }
  });
  SECTION_IDS.forEach((id) => { if (!seen.has(id)) out.push(id); });
  return out;
}
