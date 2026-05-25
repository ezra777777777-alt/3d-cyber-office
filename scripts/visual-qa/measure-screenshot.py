from __future__ import annotations

import sys
from pathlib import Path
from PIL import Image


def measure(path: Path, box: tuple[int, int, int, int]) -> dict[str, object]:
    img = Image.open(path).convert("RGB")
    crop = img.crop(box)
    pixels = list(crop.getdata())
    total = len(pixels)
    near_black = sum(1 for r, g, b in pixels if r < 8 and g < 8 and b < 8)
    avg = tuple(sum(px[i] for px in pixels) // total for i in range(3))
    return {
        "path": str(path),
        "size": img.size,
        "box": box,
        "near_black_ratio": round(near_black / total, 4),
        "avg_rgb": avg,
    }


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: measure-screenshot.py <png>")
        return 2

    path = Path(sys.argv[1])
    img = Image.open(path)
    width, height = img.size
    if width > 800:
        box = (360, 130, width, height - 110)
    else:
        box = (16, 150, width - 16, height - 140)

    print(measure(path, box))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
