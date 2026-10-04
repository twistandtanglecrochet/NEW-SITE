// One place for the site's live URL and name, used for canonical links,
// Open Graph tags, and the structured data (JSON-LD) the site generates.
//
// If TTC ever moves to a custom domain instead of the free vercel.app one,
// this is the one spot to update on the React side. (public/admin.html has
// no need for it, and index.html's own static JSON-LD block has this same
// URL written out by hand — update that one too if the domain changes.)
export const SITE_URL = "https://twisttanglecrochet.vercel.app";
export const SITE_NAME = "Twist & Tangle Crochet (TTC)";
export const SITE_DESCRIPTION =
  "Handmade crochet flowers, earrings, keychains, purses, coasters, hair clips, and more. Made to order in Lahore, Pakistan.";

// Checkout: customers place orders right on the website ("Place order").
// When this is true, small "Or send it yourself: WhatsApp / Instagram" links
// also show under the button. Set it to false to hide them.
export const SHOW_DIRECT_ORDER_LINKS = true;

// Checkout: payment choices shown in the "Payment" dropdown (first one is
// selected by default). Edit, add or remove options here.
export const PAYMENT_METHODS = ["Cash on Delivery", "Bank transfer / JazzCash / Easypaisa"];

// Checkout: what the "Delivery" line says (TTC confirms delivery charges on
// the call). Change to e.g. "Free" or "Rs 200" if you fix a price later.
export const DELIVERY_LABEL = "Charges are separate";
