#!/usr/bin/env python3
"""Generate og-image.png (1200x630) for Weathora — sky/cyan gradient + wordmark + weather motif."""
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
C1 = (14, 165, 233)   # sky  #0ea5e9
C2 = (34, 211, 238)   # cyan #22d3ee

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

img = Image.new("RGB", (W, H))
px = img.load()
for y in range(H):
    col = lerp(C1, C2, y / H)
    for x in range(W):
        px[x, y] = col

draw = ImageDraw.Draw(img, "RGBA")

# decorative sun (top-right) + cloud (bottom-right)
draw.ellipse([980, 70, 1080, 170], fill=(253, 224, 71, 235))
draw.ellipse([930, 150, 1080, 300], fill=(255, 255, 255, 60))
draw.ellipse([1000, 170, 1120, 290], fill=(255, 255, 255, 70))
draw.rounded_rectangle([930, 250, 1110, 300], radius=24, fill=(255, 255, 255, 55))

# white logo chip top-left
draw.rounded_rectangle([80, 70, 150, 140], radius=18, fill=(255, 255, 255, 235))
draw.text((96, 82), "W", font=ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 60), fill=(14, 165, 233))

font_candidates = [
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
    "/Library/Fonts/Arial.ttf",
]
font = font_sm = font_tag = None
for f in font_candidates:
    try:
        font = ImageFont.truetype(f, 92)
        font_tag = ImageFont.truetype(f, 34)
        font_sm = ImageFont.truetype(f, 26)
        break
    except Exception:
        continue
if font is None:
    font = font_tag = font_sm = ImageFont.load_default()

draw.text((170, 76), "Weathora", font=font, fill=(255, 255, 255, 255))
draw.text((82, 250), "Free Online Weather & Atmospheric Calculators", font=font_tag, fill=(255, 255, 255, 245))
draw.text((84, 318), "Heat Index  ·  Wind Chill  ·  Dew Point  ·  Humidex  ·  Feels-Like", font=font_sm, fill=(255, 255, 255, 215))
draw.text((84, 370), "Temperature  ·  Wind Speed  ·  Pressure to Altitude  —  100% in your browser",
          font=font_sm, fill=(255, 255, 255, 195))

img.convert("RGB").save("og-image.png")
print("wrote og-image.png", img.size)
