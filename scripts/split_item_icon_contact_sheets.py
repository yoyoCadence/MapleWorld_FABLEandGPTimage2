from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ITEMS_DIR = ROOT / "assets" / "ui" / "items"
UI_DIR = ROOT / "assets" / "ui"
SIZE = 64

GROUPS = {
    "consumables": {
        "cols": 3,
        "rows": 3,
        "ids": [
            "redPotion", "orangePotion", "whitePotion",
            "bluePotion", "manaElixir", "elixir",
            "powerElixir", "returnScroll", "icon_meso",
        ],
    },
    "materials": {
        "cols": 4,
        "rows": 3,
        "ids": [
            "snailShell", "slimeGel", "mushSpore", "hardLeather",
            "crystalShard", "iceShard", "fireOre", "boneFrag",
            "darkEssence", "dragonScale", "goldOre", "mapleLeafMat",
        ],
    },
    "weapons_a": {
        "cols": 4,
        "rows": 4,
        "ids": [
            "woodSword", "ironSword", "battleAxe", "mapleSword",
            "warMace", "kingSword", "dragonSlayer", "darkBlade",
            "beginnerWand", "mapleWand", "crystalStaff", "flameStaff",
            "arcaneStaff", "voidStaff", "beginnerBow", "hunterBow",
        ],
    },
    "weapons_b": {
        "cols": 4,
        "rows": 4,
        "ids": [
            "mapleBow", "windBow", "stormCrossbow", "phoenixBow",
            "beginnerDagger", "steelDagger", "mapleDagger", "shadowClaw",
            "venomDagger", "darkClaw", "beginnerKnuckle", "ironKnuckle",
            "mapleKnuckle", "pirateGun", "cannonGun", "krakenKnuckle",
        ],
    },
    "armor_a": {
        "cols": 5,
        "rows": 4,
        "ids": [
            "leafHat", "ironHelm", "wizardHat", "kingCrown", "dragonHelm",
            "travelTop", "ironArmor", "mageRobe", "dragonMail", "clothPants",
            "ironGreaves", "dragonGreaves", "strawShoes", "leatherBoots", "windBoots",
            "dragonBoots", "clothGloves", "battleGloves", "dragonGloves", "travelCape",
        ],
    },
    "armor_b": {
        "cols": 5,
        "rows": 3,
        "ids": [
            "mapleCape", "dragonCape", "woodShield", "ironShield", "dragonShield",
            "jadeEarring", "rubyEarring", "powerRing", "dragonRing", "moonPendant",
            "dragonPendant", "leatherBelt", "dragonBelt",
        ],
    },
}


def chroma_key_magenta(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if r > 228 and b > 210 and g < 90:
                px[x, y] = (r, g, b, 0)
            elif r > 198 and b > 180 and g < 124:
                px[x, y] = (r, g, b, int(a * 0.14))
    return img


def fit_icon(cell: Image.Image, out_size: int = SIZE) -> Image.Image:
    cell = chroma_key_magenta(cell)
    bbox = cell.getchannel("A").getbbox()
    if bbox:
        cell = cell.crop(bbox)
    cell.thumbnail((out_size - 6, out_size - 6), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (out_size, out_size), (0, 0, 0, 0))
    out.alpha_composite(cell, ((out_size - cell.width) // 2, (out_size - cell.height) // 2))
    return out


def split_group(group: str, raw_path: Path) -> list[str]:
    spec = GROUPS[group]
    img = Image.open(raw_path).convert("RGBA")
    cols = spec["cols"]
    rows = spec["rows"]
    ids = spec["ids"]
    cell_w = img.width / cols
    cell_h = img.height / rows
    written: list[str] = []
    ITEMS_DIR.mkdir(parents=True, exist_ok=True)
    UI_DIR.mkdir(parents=True, exist_ok=True)
    for idx, item_id in enumerate(ids):
        col = idx % cols
        row = idx // cols
        if row >= rows:
            raise ValueError(f"{group} has too many ids for {cols}x{rows}")
        box = (
            round(col * cell_w),
            round(row * cell_h),
            round((col + 1) * cell_w),
            round((row + 1) * cell_h),
        )
        icon = fit_icon(img.crop(box))
        if item_id == "icon_meso":
            small = icon.resize((32, 32), Image.Resampling.LANCZOS)
            small.save(UI_DIR / "icon_meso.png")
            written.append("assets/ui/icon_meso.png")
        else:
            icon.save(ITEMS_DIR / f"{item_id}.png")
            written.append(f"assets/ui/items/{item_id}.png")
    return written


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("Usage: py scripts/split_item_icon_contact_sheets.py group=raw.png ...")
    all_written: list[str] = []
    for arg in sys.argv[1:]:
        if "=" not in arg:
            raise SystemExit(f"Expected group=path argument, got: {arg}")
        group, raw = arg.split("=", 1)
        if group not in GROUPS:
            raise SystemExit(f"Unknown group {group}. Known: {', '.join(GROUPS)}")
        all_written.extend(split_group(group, Path(raw)))
    manifest = {
        "size": "64x64 item icons, 32x32 meso coin",
        "groups": {name: spec["ids"] for name, spec in GROUPS.items()},
        "written": all_written,
    }
    (UI_DIR / "item-icon-manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"wrote {len([p for p in all_written if '/items/' in p])} item icons")


if __name__ == "__main__":
    main()
