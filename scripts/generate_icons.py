from pathlib import Path
from PIL import Image, ImageDraw


output = Path(__file__).resolve().parents[1] / "public"
for size in (192, 512):
    image = Image.new("RGB", (size, size), "#123b5d")
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((1, 1, size - 2, size - 2), radius=size // 5, fill="#123b5d")
    draw.rounded_rectangle(
        (size * 0.17, size * 0.17, size * 0.83, size * 0.79),
        radius=size // 9,
        fill="#1c8fbd",
    )
    line_width = max(5, size // 28)
    for y in (0.34, 0.50, 0.66):
        draw.line(
            (size * 0.29, size * y, size * 0.71, size * y),
            fill="white",
            width=line_width,
        )
    for left in (0.23, 0.63):
        draw.ellipse(
            (size * left, size * 0.72, size * (left + 0.14), size * 0.86),
            fill="#0d2c45",
        )
    image.save(output / f"icon-{size}.png")
    if size == 192:
        image.save(Path(__file__).resolve().parents[1] / "app" / "icon.png")
