from pathlib import Path
import math
import wave

import numpy as np


OUT_DIR = Path("assets/audio")
SAMPLE_RATE = 22050
DURATION = 18.0


THEMES = {
    "meadow": {
        "scale": [261.63, 329.63, 392.00, 493.88, 523.25, 659.25, 783.99, 987.77],
        "bass": [130.81, 146.83, 164.81, 196.00],
        "tempo": 0.42,
        "lead": "triangle",
        "amp": 0.17,
    },
    "forest": {
        "scale": [220.00, 261.63, 329.63, 392.00, 440.00, 523.25, 659.25, 783.99],
        "bass": [110.00, 130.81, 146.83, 164.81],
        "tempo": 0.48,
        "lead": "soft_square",
        "amp": 0.15,
    },
    "cave": {
        "scale": [196.00, 233.08, 261.63, 293.66, 349.23, 392.00, 466.16, 523.25],
        "bass": [65.41, 73.42, 87.31, 98.00],
        "tempo": 0.60,
        "lead": "sine",
        "amp": 0.16,
    },
    "altar": {
        "scale": [164.81, 196.00, 207.65, 246.94, 293.66, 329.63, 392.00, 415.30],
        "bass": [82.41, 98.00, 103.83, 123.47],
        "tempo": 0.54,
        "lead": "saw",
        "amp": 0.14,
    },
    "snow": {
        "scale": [293.66, 369.99, 440.00, 587.33, 739.99, 880.00, 1174.66, 1479.98],
        "bass": [146.83, 185.00, 220.00, 293.66],
        "tempo": 0.50,
        "lead": "bell",
        "amp": 0.13,
    },
    "lava": {
        "scale": [174.61, 207.65, 261.63, 311.13, 349.23, 415.30, 523.25, 622.25],
        "bass": [43.65, 51.91, 65.41, 77.78],
        "tempo": 0.44,
        "lead": "saw",
        "amp": 0.18,
    },
    "castle": {
        "scale": [146.83, 185.00, 220.00, 293.66, 369.99, 440.00, 587.33, 739.99],
        "bass": [73.42, 92.50, 110.00, 146.83],
        "tempo": 0.46,
        "lead": "triangle",
        "amp": 0.16,
    },
}


def osc(kind, freq, t):
    phase = 2.0 * math.pi * freq * t
    if kind == "triangle":
        return (2.0 / math.pi) * np.arcsin(np.sin(phase))
    if kind == "soft_square":
        return np.tanh(np.sin(phase) * 2.2)
    if kind == "saw":
        return 2.0 * (freq * t - np.floor(0.5 + freq * t))
    if kind == "bell":
        return np.sin(phase) + 0.45 * np.sin(phase * 2.01) + 0.22 * np.sin(phase * 3.98)
    return np.sin(phase)


def add_note(buf, start, dur, freq, amp, kind):
    start_i = int(start * SAMPLE_RATE)
    end_i = min(len(buf), int((start + dur) * SAMPLE_RATE))
    if end_i <= start_i:
        return

    t = np.arange(end_i - start_i, dtype=np.float32) / SAMPLE_RATE
    attack = max(1, int(0.018 * SAMPLE_RATE))
    release = max(1, int(0.16 * SAMPLE_RATE))
    env = np.ones_like(t)
    env[:attack] = np.linspace(0.0, 1.0, attack)
    env *= np.exp(-t / max(0.01, dur * 0.78))
    env[-release:] *= np.linspace(1.0, 0.0, min(release, len(env)))
    buf[start_i:end_i] += osc(kind, freq, t) * env * amp


def add_room(buf, amount):
    wet = np.copy(buf)
    for delay, gain in [(0.11, 0.20), (0.23, 0.13), (0.37, 0.08)]:
        n = int(delay * SAMPLE_RATE)
        wet[n:] += buf[:-n] * gain
    buf[:] = buf * (1.0 - amount) + wet * amount


def make_theme(name, cfg):
    buf = np.zeros(int(DURATION * SAMPLE_RATE), dtype=np.float32)
    step = cfg["tempo"]
    scale = cfg["scale"]
    bass = cfg["bass"]
    pattern = [0, 2, 4, 2, 1, 3, 5, 3, 2, 4, 6, 4, 3, 5, 7, 5]

    for i in range(int(DURATION / step) + 1):
        at = i * step
        degree = pattern[i % len(pattern)]
        octave = 1.0 if i % 8 < 6 else 0.5
        add_note(buf, at, step * 0.86, scale[degree] * octave, cfg["amp"], cfg["lead"])

        if i % 2 == 0:
            add_note(buf, at, step * 1.6, bass[(i // 2) % len(bass)], 0.10, "sine")
        if name in ("altar", "cave") and i % 4 == 0:
            add_note(buf, at, step * 3.2, bass[(i // 4) % len(bass)] * 0.5, 0.12, "sine")
        if name == "snow" and i % 3 == 0:
            add_note(buf, at + step * 0.5, step * 1.3, scale[(degree + 2) % len(scale)] * 1.5, 0.08, "bell")
        if name == "lava" and i % 4 == 0:
            add_note(buf, at, step * 0.5, 49.0, 0.16, "soft_square")

    add_room(buf, 0.36 if name in ("cave", "altar", "castle") else 0.22)
    peak = max(0.01, float(np.max(np.abs(buf))))
    return np.clip(buf / peak * 0.82, -1.0, 1.0)


def write_wav(path, mono):
    pcm = (mono * 32767.0).astype("<i2")
    with wave.open(str(path), "wb") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SAMPLE_RATE)
        f.writeframes(pcm.tobytes())


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, cfg in THEMES.items():
        audio = make_theme(name, cfg)
        out_path = OUT_DIR / f"bgm_{name}.wav"
        write_wav(out_path, audio)
        print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
