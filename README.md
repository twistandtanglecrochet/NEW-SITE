# Twist & Tangle Crochet (TTC) — shop website

React + Vite storefront, auto-deployed to Vercel on every push to GitHub.
Products, reviews, orders and settings live in Firebase Firestore; product
photos are on Cloudinary.

## How ordering works

- **Website orders (main way):** the customer fills in name, mobile number
  and address and taps **Place order · Rs…**. The order is saved to the
  `orders` collection with a number like `TTC-K7F3Q`, and the customer sees
  a thank-you screen. Delivery charges and payment are confirmed on a call
  or WhatsApp afterwards.
- **If saving fails** (offline, slow connection, error) the customer gets a
  "Send this order on WhatsApp instead" button with the full order written
  out, so the sale isn't lost.
- **WhatsApp / Instagram links:** small "Or send it yourself" links under the
  button. Turn them off with `SHOW_DIRECT_ORDER_LINKS = false` in
  `src/data/siteConfig.js`.
- **Spam protection:** a hidden honeypot field (bots get a fake success and
  nothing is saved) and one website order per browser every 30 seconds.

## Admin panel (`/admin.html`)

Google sign-in, admins only. Sidebar sections: Import products, Add new
product, Manage products, Reviews, Manage reviews, Orders, and under
"More": Promo codes and Tools (photo migration, Meta catalog CSV, admin list).

**New order alerts** (Orders section): while the admin page is open, a new
order plays a chime, shows a banner, shows a browser notification (after
"Allow notifications") and puts the count in the tab title. Use the
"New order alerts" switch to turn them off and "Test alert sound" to check
your volume. Alerts only work while the page is open; phones may pause it
when the screen locks.

## Firestore rules

The full rules are in `firestore-rules.txt` (delivered alongside this
README). Paste them in Firebase Console → Firestore Database → Rules and
click **Publish**. They cover products, reviews, orders, promo codes and the
admin list.

## Analytics

Vercel Web Analytics (`<Analytics />` in `src/main.jsx`) and Google
Analytics (GA4, in `index.html`).

## Building

`npm install` then `npm run build`. The `postbuild` step
(`scripts/generate-seo.mjs`) pre-renders SEO pages for every product.

## Site settings (Admin → Site settings)

New shop options live in one Firestore document, `config/siteSettings`, and
are edited from **Admin → Site settings**. Every switch is OFF by default, so
the shop looks exactly as before until one is turned on. They cover: heading
reveal and word rotator, stats boxes, reviews shuffle, category tiles,
visit-store section, home section order, 10 product-card designs, price
filter, wishlist, recently viewed, "Explore more", free-delivery bar, footer
links, timings, "designed by", spacing/corner look, English/اردو translations,
maintenance mode, speed options (Cloudinary sizes, `/api/shop`, offline mode)
and phone-app options (install button, safe-area padding). The admin panel
can also switch between a Classic and a New look and download a product's
photos from Manage products.

Firestore rule needed (read for everyone, write for admins only):

```
match /config/siteSettings {
  allow read: if true;
  allow write: if <same admin check as config/promoCodes>;
}
```

`public/i18n-defaults.json` and `public/site-settings-defaults.json` are made
automatically by `scripts/export-i18n.mjs` before `npm run dev` / `build`.
Shop texts are in `src/data/i18n.js`.

## Round 2 — admin restructure + marketing (all OFF by default)

- **Admin menu** is now grouped (Orders / Products / Marketing / Website / Shop / More) with coloured icons, a search box (pages, switches, products, orders, reviews), a **Back** button, and the "TTC Admin" name opens the shop home page. Every feature has its own page and its own Save.
- **Announcement bars** (Marketing): any number of bars, each with its own on/off; rotate, stack or scrolling; fade/slide.
- **Homepage carousel**: in *All products* press **Carousel +** to put a product's main photo in the home slideshow (**In carousel ✓** removes it). Fade / slide / zoom, autoplay, speed.
- **Ads**: picture ads (home banner or pop-up) with link and per-ad on/off. Uploads go to Cloudinary.
- **Transitions**: heading reveal styles, word-rotator effects, reviews shuffle (animation, auto, button), carousel, scroll reveal for sections, card hover/entrance, smooth cart/pop-up.
- Firestore rule still needed for `config/siteSettings` (read: everyone, write: admins).

## Round 3 — ads, orders, sales, links, footer, brand (all OFF by default)

- **Ads**: each ad has 1–5 pictures (optional phone picture), size, places (under carousel / categories / below products / above footer / pop-up), close button with delay, "comes back" rule, From/Until dates.
- **Orders** (admin): "Came from" channel, order tracking (stage, courier, number, note, WhatsApp message, copy link), Cancelled list, Print slip, **Place an order** (custom items with price + picture) for WhatsApp/phone customers.
- **Sales** (done orders only), **Links** (copy / open / WhatsApp / QR), "On this page" shortcuts and sub-links in the menu.
- **Shop → Order & checkout**: better order form (only correct details place the order), WhatsApp opens by itself after the thank-you screen, "Track your order".
- **Footer**: sorted dark footer with columns, track box, local time open/closed, social icons.
- **Look & brand**: shop name, logo, address, colours, font pairs, website text, shop photos.
- Firestore: `config/siteSettings` and `tracking/{orderNo}` — read for everyone, write for admins only.

## Round 4 — product page, order guide, print slip (all OFF by default)

- **Product page** (Admin → Website → Product page): switches for Description/Details tabs (+ short line), "Sizes available", "Colours available", "Price includes". Per-product fields (short line, Details lines, sizes, colours, price-includes chips) are in the product form.
- **Complete order guide** (Admin → Website → Order guide): bar under the home banner + guide page (`/guide`), footer link, editable steps and tips; a demo guide is included.
- **Print slip**: branded, interactive slip (Small/A5/A4, hide pictures/prices, WhatsApp customer, copy address, tick items while packing).
