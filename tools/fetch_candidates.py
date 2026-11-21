"""Temporary: search Openverse for openly licensed photos and save candidates."""
import io, json, os, sys, time, urllib.parse, urllib.request
from PIL import Image, ImageDraw, ImageOps

UA = {"User-Agent": "on-demand-app-image-picker/1.0 (github.com/newarjun101/on-demand-app)"}
SLOTS = {
  # slot: (query, aspect, size)
  "avatar-aung-kyaw":   ("asian man plumber portrait", "square", (400, 400)),
  "avatar-ko-min":      ("asian electrician portrait", "square", (400, 400)),
  "avatar-ma-thida":    ("asian woman portrait smiling", "square", (400, 400)),
  "avatar-kyaw-zin":    ("mechanic portrait garage", "square", (400, 400)),
  "avatar-u-hla":       ("older asian man portrait", "square", (400, 400)),
  "avatar-ko-aye":      ("young asian man portrait", "square", (400, 400)),
  "avatar-zaw-lin":     ("asian man portrait casual", "square", (400, 400)),
  "avatar-admin":       ("business woman portrait office", "square", (400, 400)),
  "work-1-pipe-repair":    ("plumber fixing pipe", "wide", (800, 450)),
  "work-2-toilet-install": ("bathroom toilet installation", "wide", (800, 450)),
  "work-3-house-wiring":   ("electrician wiring electrical panel", "wide", (800, 450)),
  "work-4-deep-clean":     ("house cleaning mopping floor", "wide", (800, 450)),
  "work-5-engine-repair":  ("car engine repair mechanic", "wide", (800, 450)),
  "work-6-custom-shelf":   ("wooden shelf carpentry", "wide", (800, 450)),
  "work-7-delivery-run":   ("delivery scooter parcel", "wide", (800, 450)),
  "category-home-repair":       ("handyman tools repair home", "wide", (600, 400)),
  "category-home-services":     ("cleaning supplies home", "wide", (600, 400)),
  "category-vehicle":           ("auto repair workshop", "wide", (600, 400)),
  "category-delivery-helpers":  ("courier delivering package", "wide", (600, 400)),
  "hero-home":                  ("worker tools house renovation", "wide", (1600, 900)),
}
N = 4

def get(url, timeout=30):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()

def search(q, aspect):
    params = {"q": q, "license": "cc0,pdm,by", "page_size": 40, "mature": "false"}
    url = "https://api.openverse.org/v1/images/?" + urllib.parse.urlencode(params)
    for attempt in range(4):
        try:
            data = json.loads(get(url, timeout=60))
            print(f"  {q!r}: {data.get('result_count')} results")
            return data["results"]
        except Exception as e:
            print("  retry", attempt, e); time.sleep(5)
    raise RuntimeError("search failed")

os.makedirs("candidates", exist_ok=True)
meta = {}
for slot, (q, aspect, size) in SLOTS.items():
    try:
        results = search(q, aspect)
    except Exception as e:
        print("search failed", slot, e); continue
    picks = []
    for r in results:
        if len(picks) >= N: break
        img = None
        for key in ("url", "thumbnail"):
            try:
                img = Image.open(io.BytesIO(get(r[key]))).convert("RGB"); break
            except Exception as e:
                print("   skip", key, r["id"][:8], type(e).__name__, str(e)[:60])
        if img is None: continue
        if img.width < size[0] * 0.5 or img.height < size[1] * 0.5:
            print("   too small", img.size); continue
        img = ImageOps.fit(img, size, Image.LANCZOS, centering=(0.5, 0.4))
        path = f"candidates/{slot}-{len(picks)}.jpg"
        img.save(path, "JPEG", quality=82, optimize=True, progressive=True)
        picks.append({"file": path, "id": r["id"], "title": r.get("title"), "creator": r.get("creator"),
                      "license": r.get("license"), "license_version": r.get("license_version"),
                      "license_url": r.get("license_url"), "source": r.get("foreign_landing_url"),
                      "provider": r.get("provider")})
        time.sleep(0.3)
    meta[slot] = picks
    # contact sheet: candidates side by side with index numbers
    if picks:
        tw = 300; th = int(tw * size[1] / size[0])
        sheet = Image.new("RGB", (tw * len(picks), th + 24), "white")
        d = ImageDraw.Draw(sheet)
        for i, p in enumerate(picks):
            sheet.paste(Image.open(p["file"]).resize((tw, th)), (i * tw, 24))
            d.text((i * tw + 6, 4), f"#{i}  {p['license']}", fill="black")
        sheet.save(f"candidates/sheet-{slot}.jpg", "JPEG", quality=70)
    print(slot, len(picks))
    time.sleep(1)

json.dump(meta, open("candidates/meta.json", "w"), indent=2)
