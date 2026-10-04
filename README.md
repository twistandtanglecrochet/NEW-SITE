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
