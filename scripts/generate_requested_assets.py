from __future__ import annotations

import colorsys
import math
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"


def ensure() -> None:
    for path in [
        ASSETS / "backgrounds",
        ASSETS / "sprites" / "player",
        ASSETS / "sprites" / "weapons",
        ASSETS / "sprites" / "fx" / "proj",
        ASSETS / "ui" / "items",
    ]:
        path.mkdir(parents=True, exist_ok=True)


def rgba(hex_color: str, alpha: int = 255) -> tuple[int, int, int, int]:
    hex_color = hex_color.strip("#")
    return (int(hex_color[0:2], 16), int(hex_color[2:4], 16), int(hex_color[4:6], 16), alpha)


def tint_image(img: Image.Image, color: str, strength: float = 0.45) -> Image.Image:
    img = img.convert("RGBA")
    r, g, b, _ = rgba(color)
    tint = Image.new("RGBA", img.size, (r, g, b, 0))
    alpha = img.getchannel("A").point(lambda a: int(a * strength))
    tint.putalpha(alpha)
    return Image.alpha_composite(img, tint)


def fit_crop(img: Image.Image, size: tuple[int, int], y_bias: float = 0.55) -> Image.Image:
    img = img.convert("RGBA")
    w, h = img.size
    tw, th = size
    scale = max(tw / w, th / h)
    nw, nh = int(w * scale), int(h * scale)
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    x = max(0, (nw - tw) // 2)
    y = max(0, int((nh - th) * y_bias))
    return resized.crop((x, y, x + tw, y + th))


def bbox_in_region(img: Image.Image, box: tuple[int, int, int, int], pad: int = 12) -> tuple[int, int, int, int]:
    region = img.crop(box).convert("RGBA")
    alpha_box = region.getchannel("A").getbbox()
    if not alpha_box:
        return box
    x1, y1, x2, y2 = alpha_box
    return (
        max(0, box[0] + x1 - pad),
        max(0, box[1] + y1 - pad),
        min(img.width, box[0] + x2 + pad),
        min(img.height, box[1] + y2 + pad),
    )


def crop_region(src: Path, box: tuple[int, int, int, int], out: Path, pad: int = 12, size: tuple[int, int] | None = None) -> None:
    img = Image.open(src).convert("RGBA")
    real = bbox_in_region(img, box, pad)
    crop = img.crop(real)
    if size:
        crop.thumbnail(size, Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", size, (0, 0, 0, 0))
        canvas.alpha_composite(crop, ((size[0] - crop.width) // 2, size[1] - crop.height))
        crop = canvas
    crop.save(out)


def draw_background_overlay(img: Image.Image, map_id: str, theme: str) -> Image.Image:
    img = img.convert("RGBA")
    d = ImageDraw.Draw(img, "RGBA")
    w, h = img.size
    if theme == "meadow":
        d.rectangle((0, h - 155, w, h), fill=(50, 118, 42, 36))
        for i in range(9):
            x = (i * 127 + len(map_id) * 31) % w
            y = h - 118 - (i % 3) * 16
            d.ellipse((x - 32, y - 16, x + 32, y + 16), fill=(86, 160, 62, 95))
        if "snail" in map_id:
            for x in range(90, w, 190):
                d.arc((x, h - 108, x + 48, h - 60), 20, 330, fill=(72, 132, 190, 120), width=5)
    elif theme == "forest":
        d.rectangle((0, 0, w, h), fill=(12, 40, 24, 42))
        for x in range(-40, w, 115):
            d.polygon([(x, h - 120), (x + 52, h - 260), (x + 104, h - 120)], fill=(22, 72, 34, 105))
            d.rectangle((x + 46, h - 124, x + 58, h - 70), fill=(70, 44, 26, 120))
    elif theme == "cave":
        d.rectangle((0, 0, w, h), fill=(20, 16, 46, 65))
        for x in range(40, w, 120):
            col = (96, 220, 255, 120) if x % 240 else (210, 120, 255, 120)
            d.polygon([(x, h - 92), (x + 18, h - 170), (x + 36, h - 92)], fill=col)
            d.polygon([(x + 14, 0), (x + 34, 108), (x + 52, 0)], fill=(25, 20, 58, 155))
    elif theme == "snow":
        d.rectangle((0, 0, w, h), fill=(155, 220, 255, 40))
        d.rectangle((0, h - 120, w, h), fill=(228, 248, 255, 86))
        for x in range(70, w, 145):
            d.polygon([(x, h - 105), (x + 46, h - 220), (x + 92, h - 105)], fill=(230, 248, 255, 130))
    elif theme == "lava":
        d.rectangle((0, 0, w, h), fill=(96, 18, 8, 52))
        for x in range(-80, w, 160):
            d.polygon([(x, h), (x + 75, h - 118), (x + 150, h)], fill=(255, 78, 24, 95))
            d.line((x + 75, h - 118, x + 112, h - 18), fill=(255, 202, 74, 150), width=5)
    elif theme == "castle":
        d.rectangle((0, 0, w, h), fill=(18, 12, 34, 54))
        for x in range(40, w, 140):
            d.rectangle((x, h - 270, x + 54, h - 90), fill=(32, 28, 48, 135))
            d.polygon([(x - 8, h - 270), (x + 27, h - 330), (x + 62, h - 270)], fill=(45, 34, 65, 150))
    d.rectangle((0, h - 86, w, h), fill=(6, 8, 18, 55))
    return img


def generate_backgrounds() -> None:
    specs = {
        "meadow": ("meadow", "meadow-bg.png"),
        "forest": ("forest", "forest-bg.png"),
        "cave": ("cave", "cave-bg.png"),
        "altar": ("altar", "shrine-bg.png"),
        "town": ("meadow", "meadow-bg.png"),
        "meadowHill": ("meadow", "meadow-bg.png"),
        "snailHill": ("meadow", "meadow-bg.png"),
        "deepForest": ("forest", "forest-bg.png"),
        "antTunnel": ("cave", "cave-bg.png"),
        "crystalDepths": ("cave", "cave-bg.png"),
        "snowField": ("snow", "snow-bg.png"),
        "snowPeak": ("snow", "snow-bg.png"),
        "iceCave": ("snow", "snow-bg.png"),
        "frostValley": ("snow", "snow-bg.png"),
        "yetiLair": ("snow", "snow-bg.png"),
        "lavaPath": ("lava", "lava-bg.png"),
        "lavaBridge": ("lava", "lava-bg.png"),
        "lavaCore": ("lava", "lava-bg.png"),
        "emberCave": ("lava", "lava-bg.png"),
        "flameAltar": ("lava", "lava-bg.png"),
        "castleGate": ("castle", "castle-bg.png"),
        "castleHall": ("castle", "castle-bg.png"),
        "castleDungeon": ("castle", "castle-bg.png"),
        "castleTower": ("castle", "castle-bg.png"),
        "throneRoom": ("castle", "castle-bg.png"),
    }
    for map_id, (theme, base_file) in specs.items():
        out = ASSETS / "backgrounds" / f"{map_id}-bg.png"
        if out.exists():
            continue
        base = Image.open(ASSETS / "backgrounds" / base_file)
        bg = fit_crop(base, (920, 700))
        bg = draw_background_overlay(bg, map_id, theme)
        bg.save(out)


def generate_heroes() -> None:
    base = Image.open(ASSETS / "sprites" / "player" / "hero-adventurer.png").convert("RGBA")
    specs = {
        "hero-warrior.png": ("#e8542f", "warrior"),
        "hero-magician.png": ("#7a5cff", "magician"),
        "hero-archer.png": ("#3fae5a", "archer"),
        "hero-thief.png": ("#9b59b6", "thief"),
        "hero-pirate.png": ("#e67e22", "pirate"),
    }
    for name, (color, kind) in specs.items():
        out = ASSETS / "sprites" / "player" / name
        if out.exists():
            continue
        img = tint_image(base, color, 0.18)
        d = ImageDraw.Draw(img, "RGBA")
        w, h = img.size
        col = rgba(color, 225)
        if kind == "magician":
            d.polygon([(w * 0.35, h * 0.1), (w * 0.52, h * -0.03), (w * 0.66, h * 0.18)], fill=col, outline=(50, 28, 90, 220))
            d.rectangle((w * 0.36, h * 0.18, w * 0.68, h * 0.22), fill=(236, 205, 92, 230))
            d.line((w * 0.22, h * 0.56, w * 0.07, h * 0.22), fill=(120, 80, 45, 230), width=8)
            d.ellipse((w * 0.02, h * 0.13, w * 0.14, h * 0.25), fill=(165, 120, 255, 220))
        elif kind == "archer":
            d.arc((w * 0.02, h * 0.28, w * 0.28, h * 0.72), -90, 90, fill=(120, 74, 32, 230), width=7)
            d.line((w * 0.15, h * 0.3, w * 0.16, h * 0.7), fill=(235, 235, 210, 180), width=2)
            d.polygon([(w * 0.62, h * 0.42), (w * 0.9, h * 0.58), (w * 0.62, h * 0.75)], fill=rgba("#2c8f4a", 160))
        elif kind == "thief":
            d.polygon([(w * 0.28, h * 0.13), (w * 0.55, h * 0.01), (w * 0.77, h * 0.18), (w * 0.61, h * 0.28), (w * 0.38, h * 0.26)], fill=rgba("#38234f", 210))
            d.rectangle((w * 0.28, h * 0.31, w * 0.58, h * 0.38), fill=(30, 24, 38, 205))
            d.line((w * 0.17, h * 0.62, w * 0.36, h * 0.48), fill=(210, 218, 230, 230), width=5)
        elif kind == "pirate":
            d.pieslice((w * 0.28, h * 0.1, w * 0.75, h * 0.33), 180, 360, fill=rgba("#382018", 230), outline=(30, 20, 15, 220))
            d.rectangle((w * 0.33, h * 0.2, w * 0.7, h * 0.25), fill=col)
            d.line((w * 0.17, h * 0.58, w * 0.02, h * 0.63), fill=(80, 70, 65, 230), width=9)
            d.rectangle((w * 0.00, h * 0.60, w * 0.15, h * 0.66), fill=(90, 70, 55, 230))
        else:
            d.polygon([(w * 0.66, h * 0.28), (w * 0.92, h * 0.42), (w * 0.72, h * 0.56)], fill=rgba("#b72f2a", 170))
        img.save(out)


WEAPONS = {
    "woodSword": ("sword", "#8a5a33"),
    "ironSword": ("sword", "#aab2bd"),
    "battleAxe": ("axe", "#9aa0a6"),
    "mapleSword": ("sword", "#e8542f"),
    "warMace": ("mace", "#b8923e"),
    "kingSword": ("sword", "#f1c40f"),
    "dragonSlayer": ("axe", "#e74c3c"),
    "darkBlade": ("sword", "#6c5ce7"),
    "beginnerWand": ("wand", "#a29bfe"),
    "mapleWand": ("wand", "#e8542f"),
    "crystalStaff": ("staff", "#74e0ff"),
    "flameStaff": ("staff", "#ff7a3a"),
    "arcaneStaff": ("staff", "#b06ad8"),
    "voidStaff": ("staff", "#5c3aa8"),
    "beginnerBow": ("bow", "#c8a85a"),
    "hunterBow": ("bow", "#8e5a2b"),
    "mapleBow": ("bow", "#e8542f"),
    "windBow": ("bow", "#4fae8a"),
    "stormCrossbow": ("crossbow", "#5a93e8"),
    "phoenixBow": ("bow", "#ff7a3a"),
    "beginnerDagger": ("dagger", "#bdc3c7"),
    "steelDagger": ("dagger", "#95a5a6"),
    "mapleDagger": ("dagger", "#e8542f"),
    "shadowClaw": ("claw", "#9b59b6"),
    "venomDagger": ("dagger", "#27ae60"),
    "darkClaw": ("claw", "#6c5ce7"),
    "beginnerKnuckle": ("knuckle", "#c8a85a"),
    "ironKnuckle": ("knuckle", "#95a5a6"),
    "mapleKnuckle": ("knuckle", "#e8542f"),
    "pirateGun": ("gun", "#7f8c8d"),
    "cannonGun": ("gun", "#34495e"),
    "krakenKnuckle": ("knuckle", "#16a085"),
}


def glow(draw: ImageDraw.ImageDraw, xy, color: str, radius: int = 16) -> None:
    x, y = xy
    for r in range(radius, 2, -3):
        a = int(90 * (r / radius) ** 2)
        draw.ellipse((x - r, y - r, x + r, y + r), fill=rgba(color, a))


def generate_weapons() -> None:
    for wid, (kind, color) in WEAPONS.items():
        img = Image.new("RGBA", (120, 320), (0, 0, 0, 0))
        d = ImageDraw.Draw(img, "RGBA")
        outline = (45, 32, 38, 230)
        metal = (236, 242, 250, 255)
        c = rgba(color)
        if kind in {"sword", "dagger"}:
            length = 210 if kind == "sword" else 150
            width = 20 if kind == "sword" else 16
            top = 25 if kind == "sword" else 70
            d.polygon([(60, top), (60 + width, top + length), (60, top + length + 26), (60 - width, top + length)], fill=metal, outline=outline)
            d.polygon([(60, top + 8), (60 + width - 7, top + length), (60, top + length + 15)], fill=rgba(color, 185))
            d.rounded_rectangle((30, top + length, 90, top + length + 14), radius=6, fill=rgba("#d7a43e"), outline=outline, width=3)
            d.rounded_rectangle((52, top + length + 10, 68, 302), radius=7, fill=rgba("#5a351a"), outline=outline, width=3)
        elif kind == "axe":
            d.rounded_rectangle((53, 55, 67, 302), radius=7, fill=rgba("#5a351a"), outline=outline, width=3)
            d.pieslice((20, 52, 92, 146), 80, 285, fill=metal, outline=outline)
            d.pieslice((36, 80, 108, 174), 250, 95, fill=tint_tuple(c, 0.8), outline=outline)
            glow(d, (72, 110), color, 14)
        elif kind == "mace":
            d.rounded_rectangle((53, 95, 67, 302), radius=7, fill=rgba("#5a351a"), outline=outline, width=3)
            d.ellipse((28, 35, 92, 102), fill=tint_tuple(c, 0.9), outline=outline, width=4)
            for a in range(0, 360, 45):
                x = 60 + math.cos(math.radians(a)) * 42
                y = 68 + math.sin(math.radians(a)) * 42
                d.polygon([(60, 68), (x, y), (60 + math.cos(math.radians(a + 14)) * 28, 68 + math.sin(math.radians(a + 14)) * 28)], fill=rgba("#eadfba", 180))
        elif kind in {"wand", "staff"}:
            d.rounded_rectangle((54, 48, 66, 304), radius=6, fill=rgba("#6a4324"), outline=outline, width=3)
            if kind == "staff":
                d.line((60, 48, 60, 304), fill=rgba(color, 120), width=4)
            glow(d, (60, 45), color, 28)
            d.ellipse((38, 22, 82, 66), fill=rgba(color, 220), outline=outline, width=4)
            d.ellipse((50, 34, 70, 54), fill=(255, 255, 255, 180))
        elif kind in {"bow", "crossbow"}:
            d.arc((20, 32, 100, 292), 82, 278, fill=rgba(color), width=9)
            d.line((58, 42, 58, 282), fill=(240, 232, 205, 230), width=3)
            if kind == "crossbow":
                d.rounded_rectangle((24, 142, 96, 166), radius=6, fill=rgba("#604220"), outline=outline, width=3)
                d.line((24, 154, 96, 154), fill=rgba(color), width=5)
        elif kind == "claw":
            for x in [42, 58, 74]:
                d.polygon([(x, 42), (x + 12, 185), (x + 2, 206), (x - 10, 185)], fill=metal, outline=outline)
            d.rounded_rectangle((28, 198, 88, 260), radius=22, fill=rgba(color, 220), outline=outline, width=4)
        elif kind == "knuckle":
            d.rounded_rectangle((28, 116, 92, 196), radius=24, fill=rgba(color, 225), outline=outline, width=4)
            for x in [38, 52, 66, 80]:
                d.ellipse((x - 8, 82, x + 8, 126), fill=metal, outline=outline, width=3)
            d.rounded_rectangle((42, 190, 78, 250), radius=14, fill=rgba("#5a351a"), outline=outline, width=3)
        elif kind == "gun":
            d.rounded_rectangle((28, 92, 98, 126), radius=8, fill=rgba(color), outline=outline, width=4)
            d.rectangle((12, 100, 34, 116), fill=metal, outline=outline)
            d.polygon([(65, 124), (86, 192), (66, 194), (52, 128)], fill=rgba("#5a351a"), outline=outline)
            d.ellipse((84, 84, 108, 108), fill=rgba("#caa45a"), outline=outline)
        d.ellipse((50, 276, 70, 306), fill=rgba("#caa45a"), outline=outline, width=3)
        img.save(ASSETS / "sprites" / "weapons" / f"weapon_{wid}.png")


def tint_tuple(c: tuple[int, int, int, int], mul: float) -> tuple[int, int, int, int]:
    return (min(255, int(c[0] * mul)), min(255, int(c[1] * mul)), min(255, int(c[2] * mul)), c[3])


def crop_actor_component(out_name: str, box: tuple[int, int, int, int], size: tuple[int, int]) -> None:
    crop_region(ASSETS / "sprites" / "actors.png", box, ASSETS / "sprites" / out_name, 18, size)


def generate_monsters() -> None:
    sprites = ASSETS / "sprites"
    crop_actor_component("mob_boss.png", (920, 420, 1520, 960), (320, 320))
    transforms = {
        "mob_boar.png": ("mob_pig.png", "#7a3b2a", 0.20, 1.05),
        "mob_fireGoblin.png": ("mob_goblin.png", "#ff4f24", 0.42, 1.12),
        "mob_redSnail.png": ("mob_blue_snail.png", "#e84848", 0.55, 1.05),
        "mob_spore.png": ("mob_zombie_mushroom.png", "#83c86a", 0.38, 0.72),
        "mob_iceSlime.png": ("mob_bubbling.png", "#74e0ff", 0.58, 1.2),
        "mob_lavaSlime.png": ("mob_bubbling.png", "#ff5a24", 0.65, 1.05),
        "mob_magmaGolem.png": ("mob_stump.png", "#ff4b24", 0.45, 1.08),
        "mob_zombie.png": ("mob_mummy.png", "#64a05e", 0.35, 0.95),
        "mob_darkKnight.png": ("mob_darklord.png", "#34304a", 0.28, 0.82),
        "mob_yetiKing.png": ("mob_yeti.png", "#dff6ff", 0.22, 1.24),
        "mob_flameDrake.png": ("mob_drake.png", "#ff7a24", 0.34, 1.18),
        "mob_darkLord.png": ("mob_darklord.png", "#7042d8", 0.30, 1.12),
    }
    for out_name, (base_name, color, strength, scale) in transforms.items():
        out = sprites / out_name
        if out.exists():
            continue
        base = Image.open(sprites / base_name).convert("RGBA")
        img = tint_image(base, color, strength)
        if scale != 1:
            nw, nh = int(img.width * scale), int(img.height * scale)
            img = img.resize((nw, nh), Image.Resampling.LANCZOS)
        img.save(out)
    draw_penguin(sprites / "mob_penguin.png")
    draw_snowman(sprites / "mob_snowman.png")
    draw_skeleton(sprites / "mob_skeleton.png")


def draw_penguin(out: Path) -> None:
    img = Image.new("RGBA", (260, 260), (0, 0, 0, 0))
    d = ImageDraw.Draw(img, "RGBA")
    outline = (38, 34, 48, 235)
    d.ellipse((58, 38, 202, 218), fill=(38, 68, 104, 255), outline=outline, width=7)
    d.ellipse((82, 72, 178, 216), fill=(238, 250, 255, 255))
    d.ellipse((86, 72, 112, 100), fill=(255, 255, 255, 255), outline=outline, width=3)
    d.ellipse((148, 72, 174, 100), fill=(255, 255, 255, 255), outline=outline, width=3)
    d.ellipse((96, 82, 107, 94), fill=(20, 20, 26, 255))
    d.ellipse((154, 82, 165, 94), fill=(20, 20, 26, 255))
    d.polygon([(130, 102), (112, 116), (148, 116)], fill=(245, 150, 42, 255), outline=outline)
    d.pieslice((38, 120, 100, 190), 90, 250, fill=(42, 74, 112, 255), outline=outline)
    d.pieslice((160, 120, 222, 190), -70, 90, fill=(42, 74, 112, 255), outline=outline)
    d.ellipse((80, 210, 125, 232), fill=(245, 150, 42, 255), outline=outline, width=3)
    d.ellipse((135, 210, 180, 232), fill=(245, 150, 42, 255), outline=outline, width=3)
    img.save(out)


def draw_snowman(out: Path) -> None:
    img = Image.new("RGBA", (280, 300), (0, 0, 0, 0))
    d = ImageDraw.Draw(img, "RGBA")
    outline = (58, 76, 96, 230)
    d.ellipse((52, 118, 228, 286), fill=(238, 250, 255, 255), outline=outline, width=7)
    d.ellipse((76, 38, 204, 164), fill=(246, 253, 255, 255), outline=outline, width=7)
    d.ellipse((102, 84, 116, 98), fill=(20, 28, 38, 255))
    d.ellipse((164, 84, 178, 98), fill=(20, 28, 38, 255))
    d.polygon([(140, 105), (176, 116), (140, 126)], fill=(245, 132, 38, 255), outline=outline)
    d.rounded_rectangle((74, 42, 206, 64), radius=8, fill=(54, 100, 142, 255), outline=outline, width=4)
    d.rectangle((100, 8, 180, 50), fill=(54, 100, 142, 255), outline=outline, width=4)
    d.line((60, 160, 20, 124), fill=(110, 70, 36, 255), width=8)
    d.line((220, 160, 260, 124), fill=(110, 70, 36, 255), width=8)
    img.save(out)


def draw_skeleton(out: Path) -> None:
    img = Image.new("RGBA", (260, 300), (0, 0, 0, 0))
    d = ImageDraw.Draw(img, "RGBA")
    outline = (44, 40, 48, 235)
    bone = (230, 222, 196, 255)
    d.ellipse((82, 24, 178, 116), fill=bone, outline=outline, width=6)
    d.ellipse((104, 58, 122, 78), fill=outline)
    d.ellipse((140, 58, 158, 78), fill=outline)
    d.rectangle((118, 92, 145, 102), fill=outline)
    d.rounded_rectangle((94, 124, 166, 210), radius=18, fill=bone, outline=outline, width=6)
    for y in range(140, 194, 14):
        d.line((102, y, 158, y), fill=outline, width=2)
    d.line((82, 138, 42, 206), fill=bone, width=14)
    d.line((178, 138, 226, 102), fill=bone, width=14)
    d.line((226, 102, 236, 32), fill=(190, 198, 210, 255), width=8)
    d.line((110, 208, 94, 278), fill=bone, width=14)
    d.line((150, 208, 172, 278), fill=bone, width=14)
    img.save(out)


def generate_projectiles() -> None:
    specs = {
        "energy": "#6ec8ff",
        "fire": "#ff7043",
        "ice": "#74e0ff",
        "magic": "#b48cff",
        "arrow": "#d8b46a",
        "star": "#f4d35e",
        "bullet": "#7f8c8d",
    }
    for name, color in specs.items():
        img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
        d = ImageDraw.Draw(img, "RGBA")
        if name == "arrow":
            d.line((8, 32, 48, 32), fill=rgba(color), width=5)
            d.polygon([(56, 32), (42, 24), (42, 40)], fill=rgba("#f4f0d8"), outline=rgba("#463424"))
            d.polygon([(8, 32), (0, 24), (14, 28)], fill=rgba("#5a93e8"))
            d.polygon([(8, 32), (0, 40), (14, 36)], fill=rgba("#5a93e8"))
        elif name == "star":
            pts = []
            for i in range(8):
                r = 26 if i % 2 == 0 else 8
                a = -math.pi / 2 + i * math.pi / 4
                pts.append((32 + math.cos(a) * r, 32 + math.sin(a) * r))
            d.polygon(pts, fill=rgba(color), outline=rgba("#3a2a16"))
            d.ellipse((27, 27, 37, 37), fill=(255, 255, 255, 220))
        elif name == "bullet":
            d.ellipse((14, 20, 50, 44), fill=rgba(color), outline=rgba("#2a2424"))
            d.rectangle((4, 24, 28, 40), fill=rgba("#c6a258"), outline=rgba("#2a2424"))
            d.ellipse((42, 24, 58, 40), fill=rgba("#f6d16b"))
        else:
            for r in range(30, 4, -5):
                d.ellipse((32 - r, 32 - r, 32 + r, 32 + r), fill=rgba(color, int(80 * r / 30)))
            d.ellipse((18, 18, 46, 46), fill=rgba(color, 230))
            d.ellipse((25, 23, 37, 35), fill=(255, 255, 255, 210))
            if name == "fire":
                d.polygon([(32, 4), (45, 32), (34, 58), (24, 36)], fill=rgba("#ffb347", 190))
            if name == "ice":
                d.polygon([(32, 5), (48, 32), (32, 59), (16, 32)], fill=rgba("#d8fbff", 175))
        img.save(ASSETS / "sprites" / "fx" / "proj" / f"{name}.png")


def generate_ui() -> None:
    ui = ASSETS / "ui"
    ui.mkdir(exist_ok=True)
    panel = Image.new("RGBA", (64, 64), (22, 19, 36, 232))
    d = ImageDraw.Draw(panel, "RGBA")
    d.rounded_rectangle((3, 3, 61, 61), radius=8, fill=(24, 22, 42, 235), outline=(218, 172, 72, 255), width=3)
    d.rounded_rectangle((10, 10, 54, 54), radius=5, outline=(255, 230, 150, 80), width=1)
    panel.save(ui / "ui_panel.png")
    title = Image.new("RGBA", (192, 28), (0, 0, 0, 0))
    d = ImageDraw.Draw(title, "RGBA")
    d.rounded_rectangle((0, 0, 191, 27), radius=8, fill=(46, 36, 72, 245), outline=(228, 186, 86, 255), width=2)
    d.line((16, 22, 176, 22), fill=(255, 224, 128, 110), width=1)
    title.save(ui / "ui_titlebar.png")
    close = Image.new("RGBA", (24, 24), (0, 0, 0, 0))
    d = ImageDraw.Draw(close, "RGBA")
    d.rounded_rectangle((2, 2, 22, 22), radius=6, fill=(112, 38, 48, 245), outline=(246, 190, 124, 255), width=2)
    d.line((8, 8, 16, 16), fill=(255, 240, 220, 255), width=3)
    d.line((16, 8, 8, 16), fill=(255, 240, 220, 255), width=3)
    close.save(ui / "ui_btn_close.png")
    plus = Image.new("RGBA", (56, 28), (0, 0, 0, 0))
    d = ImageDraw.Draw(plus, "RGBA")
    for x, fill in [(0, (64, 64, 82, 245)), (28, (52, 150, 80, 245))]:
        d.rounded_rectangle((x + 2, 2, x + 26, 26), radius=7, fill=fill, outline=(236, 205, 110, 255), width=2)
        d.line((x + 14, 8, x + 14, 20), fill=(255, 255, 230, 255), width=3)
        d.line((x + 8, 14, x + 20, 14), fill=(255, 255, 230, 255), width=3)
    plus.save(ui / "ui_btn_plus.png")
    slot = Image.new("RGBA", (48, 48), (0, 0, 0, 0))
    d = ImageDraw.Draw(slot, "RGBA")
    d.rounded_rectangle((2, 2, 46, 46), radius=7, fill=(18, 17, 30, 235), outline=(96, 80, 118, 255), width=2)
    d.rounded_rectangle((7, 7, 41, 41), radius=5, fill=(38, 34, 54, 210), outline=(255, 230, 160, 65), width=1)
    slot.save(ui / "ui_slot.png")
    for name, col in [("hp", "#e74c3c"), ("mp", "#3498db"), ("exp", "#f1c40f")]:
        bar = Image.new("RGBA", (128, 16), (0, 0, 0, 0))
        d = ImageDraw.Draw(bar, "RGBA")
        d.rounded_rectangle((0, 1, 127, 15), radius=7, fill=(20, 18, 30, 235), outline=(60, 50, 80, 255), width=1)
        d.rounded_rectangle((3, 4, 125, 12), radius=4, fill=rgba(col, 235))
        d.line((8, 5, 116, 5), fill=(255, 255, 255, 100), width=1)
        bar.save(ui / f"ui_bar_{name}.png")
    cursor = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(cursor, "RGBA")
    d.polygon([(4, 3), (25, 15), (16, 18), (21, 29), (14, 31), (10, 20), (4, 26)], fill=(255, 244, 208, 255), outline=(50, 38, 28, 255))
    cursor.save(ui / "ui_cursor.png")
    meso = draw_item_icon("coin", "#f1c40f")
    meso.save(ui / "icon_meso.png")


def draw_item_icon(icon: str, color: str) -> Image.Image:
    img = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(img, "RGBA")
    col = rgba(color)
    outline = (40, 32, 40, 230)
    if icon == "potion":
        d.rounded_rectangle((12, 3, 20, 10), radius=2, fill=(114, 76, 45, 255), outline=outline)
        d.ellipse((7, 8, 25, 29), fill=(220, 240, 250, 95), outline=outline, width=2)
        d.pieslice((8, 12, 24, 30), 0, 180, fill=col)
        d.ellipse((11, 10, 17, 16), fill=(255, 255, 255, 135))
    elif icon == "scroll":
        d.rounded_rectangle((7, 5, 25, 27), radius=3, fill=(238, 226, 190, 255), outline=outline, width=2)
        d.rectangle((6, 4, 26, 9), fill=col)
        d.rectangle((6, 23, 26, 28), fill=col)
        for y in [13, 17, 21]:
            d.line((11, y, 22, y), fill=(130, 98, 56, 180), width=1)
    elif icon == "material":
        d.polygon([(16, 3), (27, 13), (22, 29), (10, 29), (5, 13)], fill=col, outline=outline)
        d.polygon([(16, 3), (11, 27), (16, 20)], fill=(255, 255, 255, 100))
    elif icon == "coin":
        d.ellipse((5, 5, 27, 27), fill=col, outline=(130, 92, 24, 255), width=2)
        d.arc((10, 10, 22, 22), 30, 330, fill=(130, 92, 24, 170), width=2)
        d.polygon([(16, 10), (19, 16), (16, 22), (13, 16)], fill=(255, 245, 160, 170))
    else:
        d.rounded_rectangle((5, 5, 27, 27), radius=7, fill=col, outline=outline, width=2)
        d.ellipse((10, 8, 18, 16), fill=(255, 255, 255, 120))
        if icon in {"hat", "top", "bottom", "shoes", "gloves", "cape", "shield", "ring", "pendant", "earring", "belt"}:
            d.line((9, 21, 23, 21), fill=(255, 232, 150, 180), width=2)
    return img


def parse_items() -> dict[str, tuple[str, str]]:
    text = (ROOT / "js" / "data" / "items.js").read_text(encoding="utf-8")
    items: dict[str, tuple[str, str]] = {}
    for match in re.finditer(r"^\s*([A-Za-z0-9_]+)\s*:\s*\{([^}]+)\}", text, flags=re.M):
        item_id, body = match.group(1), match.group(2)
        icon = re.search(r"icon:\s*'([^']+)'", body)
        color = re.search(r"color:\s*'([^']+)'", body)
        items[item_id] = (icon.group(1) if icon else "item", color.group(1) if color else "#95a5a6")
    return items


def generate_item_icons() -> None:
    out_dir = ASSETS / "ui" / "items"
    for item_id, (icon, color) in parse_items().items():
        out = out_dir / f"{item_id}.png"
        if icon in {"sword", "axe", "mace", "wand", "staff", "bow", "crossbow", "dagger", "claw", "knuckle", "gun"}:
            weapon = ASSETS / "sprites" / "weapons" / f"weapon_{item_id}.png"
            if weapon.exists():
                img = Image.open(weapon).convert("RGBA")
                img.thumbnail((30, 30), Image.Resampling.LANCZOS)
                canvas = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
                canvas.alpha_composite(img, ((32 - img.width) // 2, (32 - img.height) // 2))
                canvas.save(out)
                continue
        draw_item_icon(icon, color).save(out)


def main() -> None:
    ensure()
    generate_backgrounds()
    generate_heroes()
    generate_weapons()
    generate_monsters()
    generate_projectiles()
    generate_ui()
    generate_item_icons()


if __name__ == "__main__":
    main()
