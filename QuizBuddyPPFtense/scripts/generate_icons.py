#!/usr/bin/env python3
"""Generate the QuizBuddy PWA icon set (procedural, no external assets).

Design: deep-space canvas + neon aurora ring + bold Q glyph, matching the
in-app palette (--color-primary #7fb5ff, --color-secondary #64f4c4).
"""

from __future__ import annotations

import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "icons")
FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

BG = (5, 9, 20)
PRIMARY = (127, 181, 255)
SECONDARY = (100, 244, 196)
TEXT = (240, 246, 255)


def build_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), BG + (255,))

    # Aurora glow behind the mark.
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse(
        [size * 0.1, size * 0.1, size * 0.9, size * 0.9], fill=PRIMARY + (80,)
    )
    glow = glow.filter(ImageFilter.GaussianBlur(size * 0.09))
    img = Image.alpha_composite(img, glow)

    draw = ImageDraw.Draw(img)

    # Neon ring.
    draw.ellipse(
        [size * 0.16, size * 0.16, size * 0.84, size * 0.84],
        outline=SECONDARY + (235,),
        width=max(2, int(size * 0.026)),
    )

    # Glyph.
    font = ImageFont.truetype(FONT_PATH, int(size * 0.5))
    text = "Q"
    bbox = draw.textbbox((0, 0), text, font=font)
    x = (size - (bbox[2] - bbox[0])) / 2 - bbox[0]
    y = (size - (bbox[3] - bbox[1])) / 2 - bbox[1]
    draw.text((x, y), text, font=font, fill=TEXT + (255,))

    return img


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    master = build_icon(512)
    for size in (192, 180, 512):
        icon = master if size == 512 else master.resize((size, size), Image.LANCZOS)
        path = os.path.join(OUT_DIR, f"icon-{size}.png")
        icon.save(path, "PNG", optimize=True)
        print(f"wrote {path} ({os.path.getsize(path)} bytes)")


if __name__ == "__main__":
    main()
