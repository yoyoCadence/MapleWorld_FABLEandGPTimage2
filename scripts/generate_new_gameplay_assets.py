from __future__ import annotations

import math
import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
ITEMS_DIR = ASSETS / "ui" / "items"
PLAYER_DIR = ASSETS / "sprites" / "player"
PET_DIR = ASSETS / "sprites" / "pet"
NPC_DIR = ASSETS / "sprites" / "npc"


def rgba(hex_color: str, alpha: int = 255) -> tuple[int, int, int, int]:
    hex_color = (hex_color or "#999999").strip("#")
    if len(hex_color) != 6:
        hex_color = "999999"
    return (int(hex_color[0:2], 16), int(hex_color[2:4], 16), int(hex_color[4:6], 16), alpha)


def adjust(c: tuple[int, int, int, int], amount: int) -> tuple[int, int, int, int]:
    return (
        max(0, min(255, c[0] + amount)),
        max(0, min(255, c[1] + amount)),
        max(0, min(255, c[2] + amount)),
        c[3],
    )


def parse_items() -> dict[str, dict[str, str]]:
    text = (ROOT / "js" / "data" / "items.js").read_text(encoding="utf-8")
    items: dict[str, dict[str, str]] = {}
    for match in re.finditer(r"^\s*([A-Za-z0-9_]+)\s*:\s*\{([^}]+)\}", text, flags=re.M):
        item_id, body = match.group(1), match.group(2)
        row: dict[str, str] = {}
        for key in ["type", "slot", "wtype", "icon", "color", "class"]:
            found = re.search(key + r":\s*'([^']+)'", body)
            if found:
                row[key] = found.group(1)
        row.setdefault("icon", "item")
        row.setdefault("color", "#95a5a6")
        items[item_id] = row
    return items


def icon_canvas() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    return img, ImageDraw.Draw(img, "RGBA")


def drop_shadow(img: Image.Image, radius: int = 2) -> Image.Image:
    alpha = img.getchannel("A")
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    shadow.putalpha(alpha.filter(ImageFilter.GaussianBlur(radius)).point(lambda a: int(a * 0.45)))
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 115))
    shadow.putalpha(alpha.filter(ImageFilter.GaussianBlur(radius)).point(lambda a: int(a * 0.35)))
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    out.alpha_composite(shadow, (1, 2))
    out.alpha_composite(img)
    return out


def draw_gem_frame(d: ImageDraw.ImageDraw, color: tuple[int, int, int, int]) -> None:
    d.rounded_rectangle((2, 2, 30, 30), radius=5, fill=(24, 19, 32, 82), outline=(255, 225, 140, 155), width=1)
    d.line((5, 3, 27, 3), fill=(255, 255, 255, 70), width=1)
    d.line((3, 28, 28, 28), fill=(0, 0, 0, 70), width=1)
    d.ellipse((23, 4, 27, 8), fill=adjust(color, 80))


def draw_potion(item_id: str, color: str) -> Image.Image:
    img, d = icon_canvas()
    c = rgba(color)
    draw_gem_frame(d, c)
    d.rounded_rectangle((13, 3, 19, 8), radius=2, fill=(112, 74, 38, 255), outline=(48, 30, 24, 220))
    d.polygon([(10, 8), (22, 8), (25, 24), (21, 29), (11, 29), (7, 24)], fill=(224, 240, 250, 118), outline=(54, 42, 56, 230))
    d.polygon([(9, 18), (23, 15), (24, 24), (20, 28), (12, 28), (8, 24)], fill=c)
    d.arc((9, 8, 23, 28), 205, 338, fill=adjust(c, 58), width=2)
    d.ellipse((13, 12, 17, 17), fill=(255, 255, 255, 150))
    if item_id in {"elixir", "powerElixir"}:
        d.polygon([(16, 11), (19, 18), (16, 25), (13, 18)], fill=(255, 245, 145, 210))
    return drop_shadow(img)


def draw_scroll(color: str) -> Image.Image:
    img, d = icon_canvas()
    c = rgba(color)
    draw_gem_frame(d, c)
    d.rounded_rectangle((7, 6, 25, 27), radius=3, fill=(240, 218, 170, 255), outline=(95, 65, 42, 230), width=2)
    d.rectangle((6, 5, 26, 10), fill=adjust(c, -12), outline=(95, 65, 42, 230))
    d.rectangle((6, 23, 26, 28), fill=adjust(c, -12), outline=(95, 65, 42, 230))
    for y in [13, 17, 21]:
        d.line((11, y, 22, y), fill=(120, 80, 48, 160), width=1)
    d.arc((19, 11, 27, 19), -90, 90, fill=(255, 255, 255, 100), width=1)
    return drop_shadow(img)


def draw_weapon_icon(item_id: str, icon: str, color: str) -> Image.Image:
    img, d = icon_canvas()
    c = rgba(color)
    draw_gem_frame(d, c)
    weapon = ASSETS / "sprites" / "weapons" / f"weapon_{item_id}.png"
    if weapon.exists():
        blade = Image.open(weapon).convert("RGBA")
        blade.thumbnail((28, 28), Image.Resampling.LANCZOS)
        glow = Image.new("RGBA", blade.size, c)
        glow.putalpha(blade.getchannel("A").filter(ImageFilter.GaussianBlur(2)).point(lambda a: int(a * 0.5)))
        img.alpha_composite(glow, ((32 - blade.width) // 2, (32 - blade.height) // 2))
        img.alpha_composite(blade, ((32 - blade.width) // 2, (32 - blade.height) // 2))
        return img

    if icon in {"bow", "crossbow"}:
        d.arc((7, 5, 25, 28), -95, 95, fill=c, width=3)
        d.line((17, 7, 17, 27), fill=(235, 230, 200, 220), width=1)
        d.line((6, 18, 27, 14), fill=(180, 110, 52, 255), width=2)
        d.polygon([(27, 14), (22, 11), (23, 17)], fill=(230, 235, 240, 255))
    elif icon in {"wand", "staff"}:
        d.line((9, 27, 22, 6), fill=(105, 65, 42, 255), width=3)
        d.ellipse((18, 3, 27, 12), fill=c, outline=(245, 235, 180, 240), width=2)
        d.line((18, 8, 27, 8), fill=(255, 255, 255, 120), width=1)
    elif icon in {"knuckle", "claw"}:
        d.rounded_rectangle((8, 13, 25, 24), radius=5, fill=c, outline=(42, 32, 44, 240), width=2)
        for x in [10, 15, 20]:
            d.ellipse((x, 8, x + 7, 16), fill=adjust(c, 45), outline=(42, 32, 44, 220))
        if icon == "claw":
            for x in [11, 17, 23]:
                d.line((x, 9, x + 4, 2), fill=(235, 235, 245, 255), width=2)
    elif icon == "gun":
        d.rounded_rectangle((7, 11, 24, 17), radius=2, fill=c, outline=(40, 36, 42, 230), width=2)
        d.rectangle((22, 12, 29, 15), fill=(205, 205, 210, 255), outline=(55, 55, 60, 220))
        d.polygon([(12, 16), (18, 16), (15, 25), (10, 25)], fill=(94, 60, 42, 255), outline=(42, 30, 24, 220))
    else:
        d.line((9, 27, 23, 5), fill=(92, 58, 34, 255), width=4)
        d.polygon([(23, 3), (28, 9), (15, 21), (11, 17)], fill=adjust(c, 35), outline=(48, 42, 50, 230))
        d.line((12, 22, 17, 27), fill=(245, 220, 130, 255), width=3)
    return drop_shadow(img)


def draw_equip_icon(icon: str, color: str) -> Image.Image:
    img, d = icon_canvas()
    c = rgba(color)
    draw_gem_frame(d, c)
    outline = (44, 36, 44, 235)
    if icon == "hat":
        d.polygon([(6, 20), (16, 5), (26, 20)], fill=c, outline=outline)
        d.rounded_rectangle((5, 18, 27, 23), radius=3, fill=adjust(c, -18), outline=outline, width=2)
    elif icon == "top":
        d.polygon([(8, 10), (13, 7), (19, 7), (24, 10), (25, 27), (7, 27)], fill=c, outline=outline)
        d.line((16, 8, 16, 27), fill=adjust(c, -45), width=2)
        d.line((10, 16, 22, 16), fill=(255, 255, 255, 70), width=1)
    elif icon == "bottom":
        d.polygon([(10, 7), (22, 7), (24, 27), (17, 27), (16, 15), (15, 27), (8, 27)], fill=c, outline=outline)
        d.line((16, 9, 16, 27), fill=adjust(c, -50), width=2)
    elif icon == "shoes":
        d.rounded_rectangle((5, 18, 16, 25), radius=4, fill=c, outline=outline, width=2)
        d.rounded_rectangle((15, 16, 28, 24), radius=4, fill=adjust(c, -8), outline=outline, width=2)
        d.line((8, 21, 25, 20), fill=(255, 255, 255, 70), width=1)
    elif icon == "gloves":
        d.ellipse((5, 11, 17, 26), fill=c, outline=outline, width=2)
        d.ellipse((15, 9, 28, 25), fill=adjust(c, 12), outline=outline, width=2)
        for x in [9, 14, 20, 25]:
            d.line((x, 8, x - 1, 15), fill=outline, width=1)
    elif icon == "cape":
        d.polygon([(10, 6), (22, 6), (28, 28), (16, 24), (4, 28)], fill=c, outline=outline)
        d.line((12, 8, 19, 25), fill=(255, 255, 255, 80), width=1)
    elif icon == "shield":
        d.polygon([(16, 4), (27, 9), (25, 21), (16, 29), (7, 21), (5, 9)], fill=c, outline=outline)
        d.line((16, 6, 16, 27), fill=(255, 255, 255, 70), width=1)
        d.line((8, 13, 24, 13), fill=adjust(c, -45), width=2)
    elif icon in {"ring", "earring"}:
        d.ellipse((8, 8, 24, 24), outline=c, width=5)
        d.ellipse((13, 13, 19, 19), fill=(0, 0, 0, 0), outline=(255, 245, 180, 160), width=1)
        d.ellipse((14, 3, 20, 9), fill=adjust(c, 70), outline=outline)
    elif icon == "pendant":
        d.line((10, 6, 16, 15, 22, 6), fill=(220, 195, 115, 230), width=2)
        d.polygon([(16, 11), (24, 19), (16, 29), (8, 19)], fill=c, outline=outline)
        d.polygon([(16, 13), (20, 19), (16, 25), (12, 19)], fill=adjust(c, 60))
    elif icon == "belt":
        d.rounded_rectangle((4, 13, 28, 21), radius=3, fill=c, outline=outline, width=2)
        d.rounded_rectangle((13, 11, 20, 23), radius=2, fill=(235, 205, 115, 255), outline=outline)
    else:
        d.rounded_rectangle((7, 7, 25, 25), radius=5, fill=c, outline=outline, width=2)
    return drop_shadow(img)


def draw_material_icon(item_id: str, color: str) -> Image.Image:
    img, d = icon_canvas()
    c = rgba(color)
    draw_gem_frame(d, c)
    outline = (44, 36, 44, 235)
    if item_id == "snailShell":
        d.ellipse((6, 8, 26, 27), fill=c, outline=outline, width=2)
        for r in [3, 6, 9]:
            d.arc((16 - r, 17 - r, 16 + r, 17 + r), 20, 330, fill=(255, 255, 255, 150), width=1)
        d.line((16, 17, 25, 20), fill=adjust(c, -55), width=2)
    elif item_id == "slimeGel":
        d.ellipse((6, 11, 26, 27), fill=c, outline=outline, width=2)
        d.ellipse((11, 10, 18, 17), fill=adjust(c, 70))
        d.ellipse((19, 15, 23, 19), fill=(255, 255, 255, 120))
    elif item_id == "mushSpore":
        for x, y, r in [(11, 15, 5), (20, 12, 4), (18, 23, 5), (9, 24, 3)]:
            d.ellipse((x - r, y - r, x + r, y + r), fill=c, outline=outline)
            d.ellipse((x - 1, y - 2, x + 1, y), fill=(255, 255, 255, 120))
    elif item_id == "hardLeather":
        d.polygon([(7, 8), (25, 6), (23, 26), (9, 28)], fill=c, outline=outline)
        for y in [12, 18, 24]:
            d.line((10, y, 22, y - 1), fill=adjust(c, -55), width=1)
    elif item_id in {"crystalShard", "iceShard", "goldOre", "fireOre"}:
        pts = [(16, 3), (26, 13), (22, 28), (10, 28), (6, 13)]
        d.polygon(pts, fill=c, outline=outline)
        d.polygon([(16, 4), (11, 26), (16, 20)], fill=(255, 255, 255, 110))
        if item_id == "fireOre":
            d.polygon([(16, 8), (21, 18), (16, 26), (11, 18)], fill=(255, 230, 90, 180))
    elif item_id == "boneFrag":
        d.line((8, 23, 24, 8), fill=c, width=6)
        for x, y in [(7, 23), (24, 8)]:
            d.ellipse((x - 5, y - 4, x + 3, y + 4), fill=c, outline=outline)
            d.ellipse((x - 1, y - 6, x + 7, y + 2), fill=c, outline=outline)
    elif item_id == "darkEssence":
        d.ellipse((8, 6, 24, 28), fill=c, outline=outline, width=2)
        d.polygon([(16, 7), (21, 17), (16, 27), (11, 17)], fill=(32, 20, 60, 210))
        d.ellipse((13, 11, 18, 16), fill=(255, 255, 255, 90))
    elif item_id == "dragonScale":
        d.polygon([(16, 4), (27, 14), (22, 29), (10, 29), (5, 14)], fill=c, outline=outline)
        d.arc((8, 9, 24, 31), 205, 335, fill=(255, 210, 150, 140), width=2)
    elif item_id == "mapleLeafMat":
        leaf = [(16, 4), (19, 12), (27, 10), (21, 17), (25, 25), (17, 21), (16, 29), (14, 21), (7, 25), (11, 17), (5, 10), (13, 12)]
        d.polygon(leaf, fill=c, outline=outline)
        d.line((16, 9, 16, 28), fill=adjust(c, -55), width=1)
    else:
        d.polygon([(16, 4), (27, 13), (22, 28), (10, 28), (5, 13)], fill=c, outline=outline)
        d.polygon([(16, 4), (11, 26), (16, 20)], fill=(255, 255, 255, 105))
    return drop_shadow(img)


def draw_generic_item_icon(item_id: str, row: dict[str, str]) -> Image.Image:
    icon = row.get("icon", "item")
    color = row.get("color", "#999999")
    if icon == "potion":
        return draw_potion(item_id, color)
    if icon == "scroll":
        return draw_scroll(color)
    if icon in {"sword", "axe", "mace", "wand", "staff", "bow", "crossbow", "dagger", "claw", "knuckle", "gun"}:
        return draw_weapon_icon(item_id, icon, color)
    if row.get("type") == "material" or icon == "material":
        return draw_material_icon(item_id, color)
    return draw_equip_icon(icon, color)


def draw_meso() -> Image.Image:
    img, d = icon_canvas()
    d.ellipse((4, 4, 28, 28), fill=(245, 186, 52, 255), outline=(112, 74, 20, 255), width=2)
    d.ellipse((8, 8, 24, 24), fill=(255, 218, 88, 255), outline=(180, 122, 32, 220), width=1)
    leaf = [(16, 8), (18, 13), (23, 12), (19, 16), (22, 21), (17, 18), (16, 24), (14, 18), (10, 21), (13, 16), (9, 12), (14, 13)]
    d.polygon(leaf, fill=(255, 247, 160, 230), outline=(152, 98, 24, 160))
    d.ellipse((9, 7, 14, 12), fill=(255, 255, 255, 95))
    return drop_shadow(img, 1)


def generate_item_icons() -> int:
    ITEMS_DIR.mkdir(parents=True, exist_ok=True)
    count = 0
    for item_id, row in parse_items().items():
        draw_generic_item_icon(item_id, row).save(ITEMS_DIR / f"{item_id}.png")
        count += 1
    draw_meso().save(ASSETS / "ui" / "icon_meso.png")
    return count


def chroma_key_magenta(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if r > 230 and b > 210 and g < 80:
                px[x, y] = (r, g, b, 0)
            elif r > 205 and b > 185 and g < 105:
                px[x, y] = (r, g, b, int(a * 0.16))
    return img


def component_boxes(img: Image.Image, threshold: int = 40) -> list[tuple[int, int, int, int, int]]:
    alpha = img.getchannel("A")
    pix = alpha.load()
    w, h = img.size
    seen = bytearray(w * h)
    boxes: list[tuple[int, int, int, int, int]] = []
    for y in range(h):
        for x in range(w):
            idx = y * w + x
            if seen[idx] or pix[x, y] <= threshold:
                continue
            stack = [(x, y)]
            seen[idx] = 1
            min_x = max_x = x
            min_y = max_y = y
            area = 0
            while stack:
                cx, cy = stack.pop()
                area += 1
                min_x, max_x = min(min_x, cx), max(max_x, cx)
                min_y, max_y = min(min_y, cy), max(max_y, cy)
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if nx < 0 or ny < 0 or nx >= w or ny >= h:
                        continue
                    nidx = ny * w + nx
                    if seen[nidx] or pix[nx, ny] <= threshold:
                        continue
                    seen[nidx] = 1
                    stack.append((nx, ny))
            if area > 850:
                boxes.append((min_x, min_y, max_x + 1, max_y + 1, area))
    return boxes


def crop_component(img: Image.Image, box: tuple[int, int, int, int, int], pad: int) -> Image.Image:
    x1, y1, x2, y2, _ = box
    return img.crop((max(0, x1 - pad), max(0, y1 - pad), min(img.width, x2 + pad), min(img.height, y2 + pad)))


def fit_asset(img: Image.Image, size: tuple[int, int], align: str = "bottom") -> Image.Image:
    bbox = img.getchannel("A").getbbox()
    if bbox:
        img = img.crop(bbox)
    max_w, max_h = size[0] - 8, size[1] - 8
    img.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", size, (0, 0, 0, 0))
    x = (size[0] - img.width) // 2
    y = size[1] - img.height - 4 if align == "bottom" else (size[1] - img.height) // 2
    out.alpha_composite(img, (x, y))
    return out


def split_gameplay_sheet(sheet_path: Path) -> None:
    sheet = chroma_key_magenta(Image.open(sheet_path))
    boxes = sorted(component_boxes(sheet), key=lambda b: b[4], reverse=True)[:7]
    if len(boxes) != 7:
        raise SystemExit(f"Expected 7 sprite components, found {len(boxes)}")
    boxes.sort(key=lambda b: (b[0] + b[2]) / 2)
    jobs = ["warrior", "magician", "archer", "thief", "pirate"]
    PLAYER_DIR.mkdir(parents=True, exist_ok=True)
    PET_DIR.mkdir(parents=True, exist_ok=True)
    NPC_DIR.mkdir(parents=True, exist_ok=True)

    for idx, job in enumerate(jobs):
        fit_asset(crop_component(sheet, boxes[idx], 14), (220, 260)).save(PLAYER_DIR / f"hero-{job}-climb.png")
    (PLAYER_DIR / "hero-adventurer-climb.png").write_bytes((PLAYER_DIR / "hero-warrior-climb.png").read_bytes())
    fit_asset(crop_component(sheet, boxes[5], 12), (96, 96), "bottom").save(PET_DIR / "pet-default.png")
    fit_asset(crop_component(sheet, boxes[6], 12), (120, 180), "bottom").save(NPC_DIR / "npc-merchant.png")


def main() -> None:
    sheet = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    count = generate_item_icons()
    if sheet:
        split_gameplay_sheet(sheet)
    print(f"generated {count} item icons")


if __name__ == "__main__":
    main()
