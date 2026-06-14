from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "sprites" / "player"
FRAME_SIZE = (220, 260)
COLS = 6


def chroma_key_magenta(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if r > 228 and b > 208 and g < 88:
                px[x, y] = (r, g, b, 0)
            elif r > 205 and b > 180 and g < 116:
                px[x, y] = (r, g, b, int(a * 0.12))
    return img


def trim_rope_margins(img: Image.Image) -> Image.Image:
    alpha = img.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        return img
    x1, y1, x2, y2 = bbox
    rows = []
    for y in range(y1, y2):
        count = 0
        for x in range(x1, x2):
            if alpha.getpixel((x, y)) > 45:
                count += 1
        rows.append((y, count))
    wide_rows = [y for y, count in rows if count > 32]
    if wide_rows:
        y1 = max(0, min(wide_rows) - 12)
        y2 = min(img.height, max(wide_rows) + 13)
    return img.crop((max(0, x1 - 12), y1, min(img.width, x2 + 12), y2))


def fit_frame(img: Image.Image) -> Image.Image:
    img = trim_rope_margins(img)
    bbox = img.getchannel("A").getbbox()
    if bbox:
        img = img.crop(bbox)
    img.thumbnail((FRAME_SIZE[0] - 8, FRAME_SIZE[1] - 8), Image.Resampling.LANCZOS)
    frame = Image.new("RGBA", FRAME_SIZE, (0, 0, 0, 0))
    x = (FRAME_SIZE[0] - img.width) // 2
    y = FRAME_SIZE[1] - img.height - 4
    frame.alpha_composite(img, (x, y))
    return frame


def split(job: str, raw_path: Path) -> None:
    img = chroma_key_magenta(Image.open(raw_path))
    cell_w = img.width // COLS
    sheet = Image.new("RGBA", (FRAME_SIZE[0] * COLS, FRAME_SIZE[1]), (0, 0, 0, 0))
    for i in range(COLS):
        x1 = i * cell_w
        x2 = img.width if i == COLS - 1 else (i + 1) * cell_w
        frame = fit_frame(img.crop((x1, 0, x2, img.height)))
        sheet.alpha_composite(frame, (i * FRAME_SIZE[0], 0))
        frame.save(OUT_DIR / f"hero-{job}-climb-{i + 1}.png")
    sheet.save(OUT_DIR / f"hero-{job}-climb-sheet.png")
    # Keep the old single-image hook as the first frame fallback.
    (OUT_DIR / f"hero-{job}-climb.png").write_bytes((OUT_DIR / f"hero-{job}-climb-1.png").read_bytes())


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("Usage: py scripts/split_climb_animation_sheets.py job=raw.png ...")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for arg in sys.argv[1:]:
        if "=" not in arg:
            raise SystemExit(f"Expected job=path argument, got: {arg}")
        job, raw = arg.split("=", 1)
        split(job, Path(raw))
    warrior_sheet = OUT_DIR / "hero-warrior-climb-sheet.png"
    if warrior_sheet.exists():
        (OUT_DIR / "hero-adventurer-climb-sheet.png").write_bytes(warrior_sheet.read_bytes())
        (OUT_DIR / "hero-adventurer-climb.png").write_bytes((OUT_DIR / "hero-warrior-climb.png").read_bytes())
        for i in range(COLS):
            (OUT_DIR / f"hero-adventurer-climb-{i + 1}.png").write_bytes((OUT_DIR / f"hero-warrior-climb-{i + 1}.png").read_bytes())


if __name__ == "__main__":
    main()
