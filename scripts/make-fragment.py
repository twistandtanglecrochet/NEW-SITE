import os, re, glob

DIST = os.path.join(os.path.dirname(__file__), "..", "dist")
OUT = os.path.join(os.path.dirname(__file__), "..", "preview", "fragment.html")

js_files = glob.glob(os.path.join(DIST, "assets", "index-*.js"))
if not js_files:
    raise SystemExit("No built JS bundle found in dist/assets. Run `npm run build` first.")
js_path = sorted(js_files, key=os.path.getmtime)[-1]

with open(js_path, "r", encoding="utf-8") as f:
    bundle = f.read()

# Scripts must not contain a literal "</script>" sequence.
bundle = bundle.replace("</script>", "<\\/script>")

fragment = f"""<title>Twist & Tangle Crochet — Live Preview</title>
<div style="position:sticky;top:0;z-index:9999;background:#3F1220;color:#FBF6F0;font-family:-apple-system,sans-serif;font-size:12.5px;text-align:center;padding:7px 10px;line-height:1.4;">
  Interactive preview — browse, add to cart, leave a review, and click through categories/products just like the real site. Checkout and the admin portal need the live database, so those parts won't fully work here (submitting a review will show a loading spinner but won't complete).
</div>
<div id="root"></div>
<script type="module">
{bundle}
</script>
"""

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    f.write(fragment)

print(f"Wrote {OUT} ({len(fragment):,} chars) from {os.path.basename(js_path)}")
