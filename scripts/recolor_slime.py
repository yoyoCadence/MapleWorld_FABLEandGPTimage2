# Recolor the "green slime" (mob_bubbling) sprite + its animation sheets from
# purple to green via an HSV hue shift. The monster is named "green slime" but
# the original art is purple. ASCII-only for Windows PowerShell safety.
#
# Usage:
#   py scripts/recolor_slime.py [hueDegrees]
# Default hue shift is -160 degrees (purple -> green).

import sys
from PIL import Image

deg = float(sys.argv[1]) if len(sys.argv) > 1 else -160.0
shift = int(round(deg / 360.0 * 255)) % 256

files = [
    "assets/sprites/mob_bubbling.png",
    "assets/sprites/monsters/anim/mob_slime_idle.png",
    "assets/sprites/monsters/anim/mob_slime_hit.png",
]

for f in files:
    im = Image.open(f).convert("RGBA")
    r, g, b, a = im.split()
    hsv = Image.merge("RGB", (r, g, b)).convert("HSV")
    H, S, V = hsv.split()
    H = H.point(lambda h: (h + shift) % 256)
    rgb = Image.merge("HSV", (H, S, V)).convert("RGB")
    out = Image.merge("RGBA", (rgb.split()[0], rgb.split()[1], rgb.split()[2], a))
    out.save(f)
    print("recolored", f)

print("done; hue shift", deg, "deg")
