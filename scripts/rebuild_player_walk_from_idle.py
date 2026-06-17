from pathlib import Path

from PIL import Image


JOBS = ["warrior", "magician", "archer", "thief", "pirate"]
PLAYER_DIR = Path("assets/sprites/player")
FRAME_SIZE = (96, 96)
VISIBLE_H = 86


def alpha_box(img):
    return img.getchannel("A").point(lambda v: 255 if v > 12 else 0).getbbox()


def crop_subject(img):
    box = alpha_box(img)
    if not box:
        return img
    pad = 8
    return img.crop((
        max(0, box[0] - pad),
        max(0, box[1] - pad),
        min(img.width, box[2] + pad),
        min(img.height, box[3] + pad),
    ))


def fit_subject(src):
    scale = VISIBLE_H / src.height
    w = max(1, round(src.width * scale))
    h = max(1, round(src.height * scale))
    return src.resize((w, h), Image.Resampling.LANCZOS)


def paste_center_bottom(canvas, img, y_offset=0):
    x = (FRAME_SIZE[0] - img.width) // 2
    y = FRAME_SIZE[1] - img.height - 3 + y_offset
    canvas.alpha_composite(img, (x, y))


def make_frame(subject, phase):
    # Keep the feet baseline stable; only the body leans and the lower half
    # shifts subtly, so the loop reads as walking without changing scale.
    lean = [0, -1.6, 0.8, 1.6, 0, -0.8][phase]
    lower_shift = [0, 2, 1, -2, 0, -1][phase]
    arm_shift = [0, -1, 0, 1, 0, 1][phase]

    subject = subject.rotate(lean, resample=Image.Resampling.BICUBIC, expand=True)
    box = alpha_box(subject)
    subject = subject.crop(box) if box else subject

    split_y = round(subject.height * 0.58)
    upper = subject.crop((0, 0, subject.width, split_y))
    lower = subject.crop((0, split_y, subject.width, subject.height))

    assembled = Image.new("RGBA", (subject.width + 8, subject.height + 2), (0, 0, 0, 0))
    assembled.alpha_composite(upper, (4 + arm_shift, 0))
    assembled.alpha_composite(lower, (4 + lower_shift, split_y))

    frame = Image.new("RGBA", FRAME_SIZE, (0, 0, 0, 0))
    paste_center_bottom(frame, assembled)
    return frame


def build_walk(job):
    src = Image.open(PLAYER_DIR / f"hero-{job}.png").convert("RGBA")
    subject = fit_subject(crop_subject(src))
    frames = [make_frame(subject, i) for i in range(6)]
    sheet = Image.new("RGBA", (FRAME_SIZE[0] * 6, FRAME_SIZE[1]), (0, 0, 0, 0))
    for i, frame in enumerate(frames):
        sheet.alpha_composite(frame, (i * FRAME_SIZE[0], 0))
    out = PLAYER_DIR / f"hero-{job}-walk-sheet.png"
    sheet.save(out)
    print(f"wrote {out}")


def main():
    for job in JOBS:
        build_walk(job)


if __name__ == "__main__":
    main()
