from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "sprites" / "player"
HEROES = [
    "hero-adventurer.png",
    "hero-magician.png",
    "hero-archer.png",
    "hero-thief.png",
    "hero-pirate.png",
]


def chroma_key_magenta(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    pixels = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = pixels[x, y]
            if r > 232 and b > 220 and g < 70:
                pixels[x, y] = (r, g, b, 0)
            elif r > 215 and b > 190 and g < 88:
                pixels[x, y] = (r, g, b, int(a * 0.18))
    return img


def trim_and_fit(cell: Image.Image, size: tuple[int, int] = (360, 460)) -> Image.Image:
    keyed = keep_primary_component(cell.convert("RGBA"))
    bbox = keyed.getchannel("A").getbbox()
    if bbox:
        keyed = keyed.crop(bbox)
    keyed.thumbnail((size[0] - 24, size[1] - 24), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    canvas.alpha_composite(keyed, ((size[0] - keyed.width) // 2, size[1] - keyed.height - 12))
    return canvas


def keep_primary_component(img: Image.Image) -> Image.Image:
    alpha = img.getchannel("A")
    pix = alpha.load()
    width, height = img.size
    seen = bytearray(width * height)
    best: list[tuple[int, int]] = []

    for y in range(height):
        for x in range(width):
            idx = y * width + x
            if seen[idx] or pix[x, y] <= 72:
                continue
            stack = [(x, y)]
            seen[idx] = 1
            pixels: list[tuple[int, int]] = []
            while stack:
                cx, cy = stack.pop()
                pixels.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if nx < 0 or ny < 0 or nx >= width or ny >= height:
                        continue
                    nidx = ny * width + nx
                    if seen[nidx] or pix[nx, ny] <= 72:
                        continue
                    seen[nidx] = 1
                    stack.append((nx, ny))
            if len(pixels) > len(best):
                best = pixels

    if not best:
        return img

    cleaned = Image.new("RGBA", img.size, (0, 0, 0, 0))
    src = img.load()
    dst = cleaned.load()
    for x, y in best:
        dst[x, y] = src[x, y]
    return cleaned


def component_boxes(img: Image.Image) -> list[tuple[int, int, int, int, int]]:
    alpha = img.getchannel("A")
    pix = alpha.load()
    width, height = img.size
    seen = bytearray(width * height)
    boxes: list[tuple[int, int, int, int, int]] = []

    for y in range(height):
        for x in range(width):
            idx = y * width + x
            if seen[idx] or pix[x, y] <= 72:
                continue
            stack = [(x, y)]
            seen[idx] = 1
            min_x = max_x = x
            min_y = max_y = y
            area = 0
            while stack:
                cx, cy = stack.pop()
                area += 1
                if cx < min_x:
                    min_x = cx
                if cx > max_x:
                    max_x = cx
                if cy < min_y:
                    min_y = cy
                if cy > max_y:
                    max_y = cy
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if nx < 0 or ny < 0 or nx >= width or ny >= height:
                        continue
                    nidx = ny * width + nx
                    if seen[nidx] or pix[nx, ny] <= 72:
                        continue
                    seen[nidx] = 1
                    stack.append((nx, ny))
            if area > 900:
                boxes.append((min_x, min_y, max_x + 1, max_y + 1, area))
    return boxes


def padded_crop(img: Image.Image, box: tuple[int, int, int, int, int], pad: int = 18) -> Image.Image:
    x1, y1, x2, y2, _ = box
    return img.crop((
        max(0, x1 - pad),
        max(0, y1 - pad),
        min(img.width, x2 + pad),
        min(img.height, y2 + pad),
    ))


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: py scripts/split_hero_sheet.py <sheet.png>")
    sheet = chroma_key_magenta(Image.open(sys.argv[1]))
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    boxes = sorted(component_boxes(sheet), key=lambda b: b[4], reverse=True)[: len(HEROES)]
    boxes.sort(key=lambda b: (b[0] + b[2]) / 2)
    if len(boxes) != len(HEROES):
        raise SystemExit(f"Expected {len(HEROES)} hero components, found {len(boxes)}")
    for box, name in zip(boxes, HEROES):
        trim_and_fit(padded_crop(sheet, box)).save(OUT_DIR / name)
    (OUT_DIR / "hero-warrior.png").write_bytes((OUT_DIR / "hero-adventurer.png").read_bytes())


if __name__ == "__main__":
    main()
