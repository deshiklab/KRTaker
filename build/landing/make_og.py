#!/usr/bin/env python3
"""Generate KRTaker OG image 1200x630 (brand blue gradient + logo + tagline)."""
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
img = Image.new('RGB', (W, H))
d = ImageDraw.Draw(img)

# Blue gradient background (top-left #1E5EB8 -> bottom-right #2F80ED -> #0B1B33)
top = (30, 94, 184)
bot = (11, 27, 51)
for y in range(H):
    t = y / H
    r = int(top[0] + (bot[0] - top[0]) * t)
    g = int(top[1] + (bot[1] - top[1]) * t)
    b = int(top[2] + (bot[2] - top[2]) * t)
    d.line([(0, y), (W, y)], fill=(r, g, b))

# Subtle glow circle top-right
glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
gd.ellipse([880, -180, 1380, 320], fill=(47, 128, 237, 60))
img = Image.alpha_composite(img.convert('RGBA'), glow).convert('RGB')
d = ImageDraw.Draw(img)

def font(size, bold=False):
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
              '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'):
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            continue
    return ImageFont.load_default()

# Logo mark
try:
    lf = font(64, True)
except Exception:
    lf = font(64)
d.rounded_rectangle([60, 60, 176, 176], radius=30, fill=(255, 255, 255))
d.text((88, 76), 'KR', font=font(58, True), fill=(47, 128, 237))

d.text((208, 92), 'KRTaker', font=font(58, True), fill=(255, 255, 255))
d.text((212, 168), 'Key Responsibility Taker', font=font(30), fill=(190, 214, 245))

# Tagline
d.text((60, 330), 'The AI-driven property management platform', font=font(44, True), fill=(255, 255, 255))
d.text((60, 398), 'for Bangladesh. Leases, rent, taxes, compliance,', font=font(36), fill=(210, 228, 250))
d.text((60, 450), 'maintenance — one digital caretaker, 24/7.', font=font(36), fill=(210, 228, 250))

# Bottom chips
for i, (x, label) in enumerate([(60, 'bKash'), (230, 'Nagad'), (400, 'SSLCommerz'), (570, 'e-Porcha')]):
    d.rounded_rectangle([x, 520, x + 150, 572], radius=16, outline=(120, 165, 230), width=2)
    d.text((x + 28, 534), label, font=font(26), fill=(220, 235, 252))

img.save('/root/KRTaker/web/assets/og-default.png', 'PNG')
print('OG image written: web/assets/og-default.png', img.size)
