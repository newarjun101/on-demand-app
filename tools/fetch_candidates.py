"""Temporary: search Wikimedia Commons for freely licensed photos and save candidates."""
import io, json, os, re, time, urllib.parse, urllib.request
from PIL import Image, ImageDraw, ImageOps

UA = {"User-Agent": "on-demand-app-image-picker/1.0 (https://github.com/newarjun101/on-demand-app)"}
SLOTS = {
  "work-1-pipe-repair":    (["plumber repairing pipe", "plumbing repair pipe wrench"], (800, 450)),
  "work-2-toilet-install": (["toilet installation plumber", "new toilet bathroom renovation"], (800, 450)),
  "work-3-house-wiring":   (["electrician wiring", "electrician installing electrical panel"], (800, 450)),
  "work-4-deep-clean":     (["cleaning floor mop", "house cleaning service"], (800, 450)),
  "work-5-engine-repair":  (["mechanic repairing car engine", "auto mechanic engine"], (800, 450)),
  "work-6-custom-shelf":   (["wooden shelves carpentry", "carpenter making furniture"], (800, 450)),
  "work-7-delivery-run":   (["delivery motorbike parcel", "courier delivering parcel"], (800, 450)),
  "category-home-repair":      (["handyman tools", "hand tools toolbox"], (600, 400)),
  "category-home-services":    (["cleaning products bucket", "housekeeping cleaning"], (600, 400)),
  "category-vehicle":          (["car repair workshop", "auto repair shop garage"], (600, 400)),
  "category-delivery-helpers": (["parcel delivery", "delivery boxes van"], (600, 400)),
  "hero-home":                 (["home renovation worker", "construction worker house interior"], (1600, 900)),
}
N = 4
OK_LICENSE = re.compile(r"^(cc0|public domain|pd|cc by(-sa)? [0-9.]+)", re.I)

def get(url, timeout=60):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()

def strip(html):
    return re.sub(r"<[^>]+>", "", html or "").strip()

def search(q, width):
    params = {"action": "query", "format": "json", "generator": "search", "gsrnamespace": 6,
              "gsrsearch": f"{q} filetype:bitmap", "gsrlimit": 30, "prop": "imageinfo",
              "iiprop": "url|size|mime|extmetadata", "iiurlwidth": width}
    data = json.loads(get("https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)))
    pages = sorted((data.get("query") or {}).get("pages", {}).values(), key=lambda p: p.get("index", 99))
    return pages

os.makedirs("candidates", exist_ok=True)
meta = {}
for slot, (queries, size) in SLOTS.items():
    picks, seen = [], set()
    for q in queries:
        if len(picks) >= N: break
        try: pages = search(q, size[0])
        except Exception as e: print(" search failed", q, e); continue
        print(f" {q!r}: {len(pages)} files")
        for p in pages:
            if len(picks) >= N: break
            if p["title"] in seen: continue
            seen.add(p["title"])
            ii = (p.get("imageinfo") or [{}])[0]
            em = ii.get("extmetadata", {})
            lic = strip(em.get("LicenseShortName", {}).get("value"))
            if not OK_LICENSE.match(lic): continue
            if ii.get("mime") not in ("image/jpeg", "image/png"): continue
            if ii.get("width", 0) < size[0] * 0.8 or ii.get("height", 0) < size[1] * 0.8: continue
            try: img = Image.open(io.BytesIO(get(ii["thumburl"]))).convert("RGB")
            except Exception as e: print("  dl fail", e); continue
            img = ImageOps.fit(img, size, Image.LANCZOS, centering=(0.5, 0.45))
            path = f"candidates/{slot}-{len(picks)}.jpg"
            img.save(path, "JPEG", quality=82, optimize=True, progressive=True)
            picks.append({"file": path, "title": p["title"], "license": lic,
                          "license_url": strip(em.get("LicenseUrl", {}).get("value")),
                          "artist": strip(em.get("Artist", {}).get("value"))[:200],
                          "source": ii.get("descriptionurl")})
            time.sleep(0.5)
        time.sleep(1)
    meta[slot] = picks
    if picks:
        tw = 320; th = int(tw * size[1] / size[0])
        sheet = Image.new("RGB", (tw * len(picks), th + 22), "white")
        d = ImageDraw.Draw(sheet)
        for i, pk in enumerate(picks):
            sheet.paste(Image.open(pk["file"]).resize((tw, th)), (i * tw, 22))
            d.text((i * tw + 6, 4), f"#{i} {pk['license']}", fill="black")
        sheet.save(f"candidates/sheet-{slot}.jpg", "JPEG", quality=75)
    print(slot, len(picks))

json.dump(meta, open("candidates/meta.json", "w"), indent=2)
