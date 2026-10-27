// Meta (Facebook) Pixel standard events. Only fires when switched on in Admin and the pixel is loaded.
let enabled = false;
export function setMetaEvents(on) { enabled = !!on; }
export function metaTrack(event, d = {}, eventId) {
  try {
    if (!enabled || typeof window === "undefined" || typeof window.fbq !== "function") return;
    const data = { content_type: "product", currency: "PKR" };
    if (d.ids) data.content_ids = d.ids;
    if (d.name) data.content_name = d.name;
    if (d.num != null) data.num_items = d.num;
    if (d.value != null) data.value = d.value;
    if (eventId) window.fbq("track", event, data, { eventID: String(eventId) });
    else window.fbq("track", event, data);
  } catch (e) {}
}
