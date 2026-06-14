from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
SPRITES = ASSETS / "sprites"


def ensure_dirs() -> None:
    for path in [
        SPRITES / "monsters" / "anim",
        SPRITES / "weapons" / "anim",
        SPRITES / "fx" / "impact",
        SPRITES / "fx" / "explosion",
    ]:
        path.mkdir(parents=True, exist_ok=True)


def alpha_bbox(img: Image.Image) -> tuple[int, int, int, int] | None:
    return img.convert("RGBA").getchannel("A").getbbox()


def trim(img: Image.Image, pad: int = 8) -> Image.Image:
    img = img.convert("RGBA")
    bbox = alpha_bbox(img)
    if not bbox:
        return img
    x1, y1, x2, y2 = bbox
    return img.crop((
        max(0, x1 - pad),
        max(0, y1 - pad),
        min(img.width, x2 + pad),
        min(img.height, y2 + pad),
    ))


def paste_center(base: Image.Image, img: Image.Image, cx: int, bottom: int) -> None:
    base.alpha_composite(img, (int(cx - img.width / 2), int(bottom - img.height)))


def fit_frame(src: Image.Image, size: tuple[int, int], scale: float = 1.0) -> Image.Image:
    src = trim(src, 10)
    max_w, max_h = int(size[0] * 0.86 * scale), int(size[1] * 0.84 * scale)
    src.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)
    frame = Image.new("RGBA", size, (0, 0, 0, 0))
    paste_center(frame, src, size[0] // 2, int(size[1] * 0.92))
    return frame


def shadow(frame: Image.Image) -> None:
    d = ImageDraw.Draw(frame, "RGBA")
    y = int(frame.height * 0.91)
    d.ellipse((frame.width * 0.25, y - 8, frame.width * 0.75, y + 10), fill=(24, 18, 28, 62))


def tint(img: Image.Image, color: tuple[int, int, int], strength: float) -> Image.Image:
    img = img.convert("RGBA")
    overlay = Image.new("RGBA", img.size, (*color, 0))
    overlay.putalpha(img.getchannel("A").point(lambda a: int(a * strength)))
    return Image.alpha_composite(img, overlay)


def make_monster_sheet(src_path: Path, out_idle: Path, out_hit: Path) -> None:
    src = Image.open(src_path).convert("RGBA")
    frame_size = (192, 192)
    idle = Image.new("RGBA", (frame_size[0] * 4, frame_size[1]), (0, 0, 0, 0))
    hit = Image.new("RGBA", (frame_size[0] * 4, frame_size[1]), (0, 0, 0, 0))

    for i in range(4):
        phase = [0, 1, 0, -1][i]
        scale = 1 + phase * 0.025
        body = fit_frame(src, frame_size, scale)
        body = body.transform(
            frame_size,
            Image.Transform.AFFINE,
            (1, phase * 0.018, 0, 0, 1, -phase * 3),
            resample=Image.Resampling.BICUBIC,
        )
        frame = Image.new("RGBA", frame_size, (0, 0, 0, 0))
        shadow(frame)
        frame.alpha_composite(body)
        idle.alpha_composite(frame, (i * frame_size[0], 0))

        flash = fit_frame(src, frame_size, 1 + i * 0.018)
        flash = tint(flash, (255, 80, 92), max(0.08, 0.45 - i * 0.1))
        if i % 2 == 0:
            flash = ImageEnhance.Brightness(flash).enhance(1.22)
        frame = Image.new("RGBA", frame_size, (0, 0, 0, 0))
        shadow(frame)
        frame.alpha_composite(flash, (-8 + i * 5, -2))
        d = ImageDraw.Draw(frame, "RGBA")
        for s in range(4):
            x = 42 + s * 34 + i * 3
            y = 44 + ((s + i) % 3) * 24
            d.line((x, y, x + 16, y - 9), fill=(255, 245, 210, 210 - i * 35), width=3)
        hit.alpha_composite(frame, (i * frame_size[0], 0))

    out_idle.parent.mkdir(parents=True, exist_ok=True)
    idle.save(out_idle)
    hit.save(out_hit)


def generate_monster_sheets() -> None:
    for src in sorted(SPRITES.glob("mob_*.png")):
        name = src.stem.replace("mob_", "", 1)
        make_monster_sheet(
            src,
            SPRITES / "monsters" / "anim" / f"mob_{name}_idle.png",
            SPRITES / "monsters" / "anim" / f"mob_{name}_hit.png",
        )
    aliases = {
        "snail": "blue_snail",
        "slime": "bubbling",
        "mushroom": "zombie_mushroom",
        "purpleMush": "zombie_mushroom",
        "golem": "stump",
        "boss": "darklord",
    }
    for target, source in aliases.items():
        for state in ["idle", "hit"]:
            src = SPRITES / "monsters" / "anim" / f"mob_{source}_{state}.png"
            dst = SPRITES / "monsters" / "anim" / f"mob_{target}_{state}.png"
            if src.exists():
                dst.write_bytes(src.read_bytes())


def weapon_frame(src: Image.Image, frame_size: tuple[int, int], angle: float, scale: float, glow: tuple[int, int, int]) -> Image.Image:
    blade = trim(src, 4)
    blade.thumbnail((54, 150), Image.Resampling.LANCZOS)
    blade = blade.resize((max(1, int(blade.width * scale)), max(1, int(blade.height * scale))), Image.Resampling.LANCZOS)
    blade = blade.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)
    frame = Image.new("RGBA", frame_size, (0, 0, 0, 0))
    aura = Image.new("RGBA", blade.size, (*glow, 0))
    aura.putalpha(blade.getchannel("A").filter(ImageFilter.GaussianBlur(5)).point(lambda a: min(155, int(a * 1.6))))
    paste_center(frame, aura, frame_size[0] // 2, int(frame_size[1] * 0.88))
    paste_center(frame, blade, frame_size[0] // 2, int(frame_size[1] * 0.84))
    return frame


def generate_weapon_sheets() -> None:
    colors = [(115, 205, 255), (255, 230, 130), (255, 120, 72), (175, 120, 255), (255, 255, 255), (255, 205, 80)]
    angles = [-58, -36, -12, 18, 48, 74]
    frame_size = (128, 192)
    for src in sorted((SPRITES / "weapons").glob("weapon_*.png")):
        if src.parent.name == "anim":
            continue
        sheet = Image.new("RGBA", (frame_size[0] * 6, frame_size[1]), (0, 0, 0, 0))
        img = Image.open(src).convert("RGBA")
        for i, angle in enumerate(angles):
            frame = weapon_frame(img, frame_size, angle, 1 + math.sin(i / 5 * math.pi) * 0.12, colors[i])
            d = ImageDraw.Draw(frame, "RGBA")
            if 1 <= i <= 4:
                d.arc((18, 22, 112, 172), 198 - i * 18, 288 - i * 9, fill=(*colors[i], 170), width=5)
                d.arc((28, 36, 104, 158), 208 - i * 18, 282 - i * 9, fill=(255, 255, 255, 160), width=2)
            sheet.alpha_composite(frame, (i * frame_size[0], 0))
        sheet.save(SPRITES / "weapons" / "anim" / f"{src.stem}_swing.png")


def radial_disc(size: int, color: tuple[int, int, int], inner_alpha: int, outer_alpha: int = 0) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    pix = img.load()
    cx = cy = size / 2
    for y in range(size):
        for x in range(size):
            r = math.dist((x, y), (cx, cy)) / (size / 2)
            if r <= 1:
                a = int(inner_alpha * (1 - r) + outer_alpha * r)
                pix[x, y] = (*color, max(0, min(255, a)))
    return img


def draw_impact_layers(style: str, color: tuple[int, int, int]) -> None:
    base = SPRITES / "fx" / "impact" / style
    base.mkdir(parents=True, exist_ok=True)
    frame_size = (128, 128)
    sheet = Image.new("RGBA", (frame_size[0] * 4, frame_size[1]), (0, 0, 0, 0))
    core_layer = Image.new("RGBA", sheet.size, (0, 0, 0, 0))
    sparks_layer = Image.new("RGBA", sheet.size, (0, 0, 0, 0))
    ring_layer = Image.new("RGBA", sheet.size, (0, 0, 0, 0))
    for i in range(4):
        p = i / 3
        frame = Image.new("RGBA", frame_size, (0, 0, 0, 0))
        core = radial_disc(int(36 + p * 18), color, int(230 * (1 - p * 0.45)))
        paste_center(frame, core, 64, 74)
        d = ImageDraw.Draw(frame, "RGBA")
        d.ellipse((32 - p * 18, 34 - p * 15, 96 + p * 18, 98 + p * 15), outline=(*color, int(210 * (1 - p))), width=max(1, int(5 - p * 2)))
        for s in range(9):
            a = s / 9 * math.tau + p * 0.7
            r1, r2 = 17 + p * 12, 35 + p * 32
            x1, y1 = 64 + math.cos(a) * r1, 70 + math.sin(a) * r1
            x2, y2 = 64 + math.cos(a) * r2, 70 + math.sin(a) * r2
            d.line((x1, y1, x2, y2), fill=(255, 245, 220, int(220 * (1 - p * 0.65))), width=2)
        sheet.alpha_composite(frame, (i * frame_size[0], 0))

        core_only = Image.new("RGBA", frame_size, (0, 0, 0, 0))
        paste_center(core_only, core, 64, 74)
        core_layer.alpha_composite(core_only, (i * frame_size[0], 0))

        sparks_only = Image.new("RGBA", frame_size, (0, 0, 0, 0))
        sd = ImageDraw.Draw(sparks_only, "RGBA")
        for s in range(9):
            a = s / 9 * math.tau + p * 0.7
            sd.line((64 + math.cos(a) * 18, 70 + math.sin(a) * 18, 64 + math.cos(a) * (42 + p * 24), 70 + math.sin(a) * (42 + p * 24)), fill=(255, 245, 220, int(210 * (1 - p * 0.65))), width=2)
        sparks_layer.alpha_composite(sparks_only, (i * frame_size[0], 0))

        ring_only = Image.new("RGBA", frame_size, (0, 0, 0, 0))
        rd = ImageDraw.Draw(ring_only, "RGBA")
        rd.ellipse((32 - p * 18, 34 - p * 15, 96 + p * 18, 98 + p * 15), outline=(*color, int(210 * (1 - p))), width=max(1, int(5 - p * 2)))
        ring_layer.alpha_composite(ring_only, (i * frame_size[0], 0))
    sheet.save(base / "sheet-transparent.png")
    core_layer.save(base / "core.png")
    sparks_layer.save(base / "sparks.png")
    ring_layer.save(base / "ring.png")


def draw_explosion(style: str, color: tuple[int, int, int], smoke: tuple[int, int, int]) -> None:
    out = SPRITES / "fx" / "explosion" / style
    out.mkdir(parents=True, exist_ok=True)
    frame_size = (192, 192)
    sheet = Image.new("RGBA", (frame_size[0] * 6, frame_size[1]), (0, 0, 0, 0))
    for i in range(6):
        p = i / 5
        frame = Image.new("RGBA", frame_size, (0, 0, 0, 0))
        d = ImageDraw.Draw(frame, "RGBA")
        glow = radial_disc(int(70 + p * 88), color, int(210 * (1 - p * 0.3)))
        paste_center(frame, glow, 96, 108)
        for s in range(14):
            a = s / 14 * math.tau + p * 0.5
            r = 16 + p * 70 + (s % 3) * 6
            x, y = 96 + math.cos(a) * r, 98 + math.sin(a) * r * 0.8
            rad = max(3, 18 * (1 - p) + (s % 4))
            d.ellipse((x - rad, y - rad, x + rad, y + rad), fill=(*smoke, int(95 * p)), outline=(*color, int(130 * (1 - p))))
        for s in range(10):
            a = s / 10 * math.tau - p * 0.9
            d.line((96, 100, 96 + math.cos(a) * (42 + p * 70), 100 + math.sin(a) * (34 + p * 48)), fill=(255, 245, 190, int(230 * (1 - p))), width=max(1, int(5 - p * 3)))
        sheet.alpha_composite(frame, (i * frame_size[0], 0))
    sheet.save(out / "sheet-transparent.png")


def generate_fx() -> None:
    impact_styles = {
        "physical": (255, 230, 130),
        "fire": (255, 96, 36),
        "ice": (120, 225, 255),
        "magic": (175, 110, 255),
        "shadow": (108, 80, 180),
        "holy": (255, 245, 170),
        "bullet": (255, 210, 95),
    }
    for style, color in impact_styles.items():
        draw_impact_layers(style, color)
    explosions = {
        "fire": ((255, 96, 32), (92, 54, 42)),
        "ice": ((130, 230, 255), (125, 160, 180)),
        "arcane": ((180, 105, 255), (70, 54, 105)),
        "shadow": ((110, 76, 190), (45, 38, 60)),
    }
    for style, (color, smoke) in explosions.items():
        draw_explosion(style, color, smoke)


def main() -> None:
    ensure_dirs()
    generate_monster_sheets()
    generate_weapon_sheets()
    generate_fx()


if __name__ == "__main__":
    main()
