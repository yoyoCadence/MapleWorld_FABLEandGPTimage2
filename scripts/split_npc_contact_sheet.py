from pathlib import Path
import sys

from PIL import Image


NPCS = [
    "npc-blacksmith",
    "npc-elder",
    "npc-hunter",
    "npc-herbalist",
]
OUT_DIR = Path("assets/sprites/npc")
TARGET_SIZE = (120, 180)


def remove_magenta(img):
    rgba = img.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if r > 210 and g < 95 and b > 210:
                pixels[x, y] = (r, g, b, 0)
    return rgba


def content_box(img):
    alpha = img.getchannel("A")
    return alpha.point(lambda v: 255 if v > 20 else 0).getbbox()


def fit_to_canvas(img):
    box = content_box(img)
    if not box:
        return Image.new("RGBA", TARGET_SIZE, (0, 0, 0, 0))

    cropped = img.crop(box)
    max_w, max_h = TARGET_SIZE[0] - 12, TARGET_SIZE[1] - 12
    scale = min(max_w / cropped.width, max_h / cropped.height)
    resized = cropped.resize(
        (max(1, round(cropped.width * scale)), max(1, round(cropped.height * scale))),
        Image.Resampling.LANCZOS,
    )

    canvas = Image.new("RGBA", TARGET_SIZE, (0, 0, 0, 0))
    x = (TARGET_SIZE[0] - resized.width) // 2
    y = TARGET_SIZE[1] - resized.height - 4
    canvas.alpha_composite(resized, (x, y))
    return canvas


def main():
    if len(sys.argv) != 2:
        raise SystemExit("Usage: py scripts/split_npc_contact_sheet.py <raw-sheet.png>")

    raw_path = Path(sys.argv[1])
    sheet = Image.open(raw_path).convert("RGBA")
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    cell_w = sheet.width // len(NPCS)
    for i, name in enumerate(NPCS):
        left = i * cell_w
        right = sheet.width if i == len(NPCS) - 1 else (i + 1) * cell_w
        cell = sheet.crop((left, 0, right, sheet.height))
        sprite = fit_to_canvas(remove_magenta(cell))
        out_path = OUT_DIR / f"{name}.png"
        sprite.save(out_path)
        print(f"Wrote {out_path} {sprite.size[0]}x{sprite.size[1]}")


if __name__ == "__main__":
    main()
