from pathlib import Path
import argparse
import json

from PIL import Image


ROOT = Path(".")
MAGENTA = (255, 0, 255)

JOBS = ["warrior", "magician", "archer", "thief", "pirate"]
SWINGS = ["sword", "axe", "mace", "dagger", "claw", "knuckle"]
PROJECTILES = ["magic", "arrow", "star", "bullet", "energy", "fire", "ice", "arcane"]
SKILL_GROUPS = {
    "warrior": ["powerStrike", "spinSlash", "energyWave", "heal", "rage", "groundSmash", "crusherCombo", "heroWill"],
    "magician": ["fireball", "iceSpike", "thunderBolt", "healAura", "frostNova", "magicGuard", "meteor", "arcaneBlast"],
    "archer": ["powerShot", "arrowRain", "pierceArrow", "eagleEye", "tripleShot", "evasion", "meteorArrow", "phoenixStrike"],
    "thief": ["luckySeven", "doubleStab", "shadowFlurry", "hasteBuff", "tripleThrow", "smokeBomb", "assassinate", "shadowStorm"],
    "pirate": ["knucklePunch", "whirlKick", "cannonBlast", "battleRage", "dragonStrike", "cannonBarrage", "octopus", "fistFury"],
}
PETS = ["pig", "fox"]


def key_to_alpha(img):
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r > 200 and g < 100 and b > 200:
                px[x, y] = (r, g, b, 0)
    return rgba


def bbox(img):
    return img.getchannel("A").point(lambda v: 255 if v > 16 else 0).getbbox()


def split_grid(path, rows, cols):
    sheet = Image.open(path).convert("RGBA")
    cell_w = sheet.width // cols
    cell_h = sheet.height // rows
    cells = []
    for r in range(rows):
        row = []
        for c in range(cols):
            left = c * cell_w
            upper = r * cell_h
            right = sheet.width if c == cols - 1 else (c + 1) * cell_w
            lower = sheet.height if r == rows - 1 else (r + 1) * cell_h
            row.append(key_to_alpha(sheet.crop((left, upper, right, lower))))
        cells.append(row)
    return cells


def compose_frames(cells, frame_size, align="center", fit=0.86, shared_scale=True):
    boxes = [bbox(cell) for cell in cells]
    boxes = [b for b in boxes if b]
    max_w, max_h = frame_size[0] * fit, frame_size[1] * fit
    if boxes and shared_scale:
        scale = min(max_w / max(b[2] - b[0] for b in boxes), max_h / max(b[3] - b[1] for b in boxes))
    else:
        scale = None
    frames = []
    for cell in cells:
        b = bbox(cell)
        canvas = Image.new("RGBA", frame_size, (0, 0, 0, 0))
        if not b:
            frames.append(canvas)
            continue
        cropped = cell.crop(b)
        s = scale if scale else min(max_w / cropped.width, max_h / cropped.height)
        size = (max(1, round(cropped.width * s)), max(1, round(cropped.height * s)))
        resized = cropped.resize(size, Image.Resampling.LANCZOS)
        x = (frame_size[0] - resized.width) // 2
        if align == "bottom":
            y = frame_size[1] - resized.height - max(2, round(frame_size[1] * 0.04))
        else:
            y = (frame_size[1] - resized.height) // 2
        canvas.alpha_composite(resized, (x, y))
        frames.append(canvas)
    return frames


def remove_tiny_components(img, min_area=36):
    alpha = img.getchannel("A")
    data = alpha.load()
    w, h = img.size
    seen = set()
    keep = set()
    for y in range(h):
        for x in range(w):
            if (x, y) in seen or data[x, y] <= 16:
                continue
            stack = [(x, y)]
            comp = []
            seen.add((x, y))
            while stack:
                cx, cy = stack.pop()
                comp.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in seen and data[nx, ny] > 16:
                        seen.add((nx, ny))
                        stack.append((nx, ny))
            if len(comp) >= min_area:
                keep.update(comp)
    out = img.copy()
    px = out.load()
    for y in range(h):
        for x in range(w):
            if data[x, y] > 16 and (x, y) not in keep:
                r, g, b, a = px[x, y]
                px[x, y] = (r, g, b, 0)
    return out


def save_strip(frames, out_path):
    out_path.parent.mkdir(parents=True, exist_ok=True)
    w, h = frames[0].size
    sheet = Image.new("RGBA", (w * len(frames), h), (0, 0, 0, 0))
    for i, frame in enumerate(frames):
        sheet.alpha_composite(frame, (i * w, 0))
    sheet.save(out_path)


def save_single(frame, out_path):
    out_path.parent.mkdir(parents=True, exist_ok=True)
    frame.save(out_path)


def process_walk(path):
    cells = split_grid(path, 5, 6)
    written = []
    for r, job in enumerate(JOBS):
        frames = compose_frames(cells[r], (80, 96), align="bottom", fit=0.92, shared_scale=True)
        frames = [remove_tiny_components(frame, 42) for frame in frames]
        # Player source art faces left; the renderer mirrors it when p.facing === 1.
        frames = [frame.transpose(Image.Transpose.FLIP_LEFT_RIGHT) for frame in frames]
        out = ROOT / "assets/sprites/player" / f"hero-{job}-walk-sheet.png"
        save_strip(frames, out)
        written.append(str(out))
    return written


def process_swing(path):
    cells = split_grid(path, 6, 6)
    written = []
    for r, style in enumerate(SWINGS):
        frames = compose_frames(cells[r], (96, 96), align="center", fit=0.94, shared_scale=True)
        out = ROOT / "assets/sprites/fx/swing" / f"{style}-sheet.png"
        save_strip(frames, out)
        written.append(str(out))
    return written


def process_projectiles(path):
    cells = split_grid(path, 8, 4)
    written = []
    for r, style in enumerate(PROJECTILES):
        frames = compose_frames(cells[r], (48, 32), align="center", fit=0.90, shared_scale=True)
        sheet_out = ROOT / "assets/sprites/fx/proj" / f"{style}-sheet.png"
        single_out = ROOT / "assets/sprites/fx/proj" / f"{style}.png"
        spec_single_out = ROOT / "assets/sprites/proj" / f"{style}.png"
        save_strip(frames, sheet_out)
        save_single(frames[0], single_out)
        save_single(frames[0], spec_single_out)
        written.extend([str(sheet_out), str(single_out), str(spec_single_out)])
    return written


def process_icons(paths):
    written = []
    for group, path in paths.items():
        cells = split_grid(path, 1, 8)[0]
        frames = compose_frames(cells, (64, 64), align="center", fit=0.90, shared_scale=False)
        for name, frame in zip(SKILL_GROUPS[group], frames):
            out = ROOT / "assets/ui/skills" / f"{name}.png"
            save_single(frame, out)
            written.append(str(out))
    return written


def process_pets(path):
    cells = split_grid(path, 1, 2)[0]
    frames = compose_frames(cells, (64, 64), align="bottom", fit=0.88, shared_scale=True)
    frames = [remove_tiny_components(frame, 28) for frame in frames]
    written = []
    for kind, frame in zip(PETS, frames):
        out = ROOT / "assets/sprites/pet" / f"pet-{kind}.png"
        save_single(frame, out)
        written.append(str(out))
    return written


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--walk", required=True)
    parser.add_argument("--swing", required=True)
    parser.add_argument("--projectiles", required=True)
    parser.add_argument("--pets", required=True)
    for group in SKILL_GROUPS:
        parser.add_argument(f"--icons-{group}", required=True)
    args = parser.parse_args()

    written = []
    written.extend(process_walk(Path(args.walk)))
    written.extend(process_swing(Path(args.swing)))
    written.extend(process_projectiles(Path(args.projectiles)))
    icon_paths = {group: Path(getattr(args, f"icons_{group}")) for group in SKILL_GROUPS}
    written.extend(process_icons(icon_paths))
    written.extend(process_pets(Path(args.pets)))

    print(json.dumps({"written": written, "count": len(written)}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
