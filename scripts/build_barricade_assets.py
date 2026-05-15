from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/assets/sprites/barricades/generated/barricade_sheet_chroma.png"
OUTPUT = ROOT / "public/assets/sprites/barricades/generated/barricade_cells.png"

VARIANTS = 4
COLUMNS = 6
ROWS = 3
SOURCE_Y = 168
SOURCE_HEIGHT = 360
KEY_GREEN_MIN = 120
KEY_MARGIN = 28


def remove_green_key(image: Image.Image) -> Image.Image:
    keyed = image.convert("RGBA")
    pixels = keyed.load()

    for y in range(keyed.height):
        for x in range(keyed.width):
            red, green, blue, alpha = pixels[x, y]
            strongest_non_green = max(red, blue)

            if green > KEY_GREEN_MIN and green > strongest_non_green + KEY_MARGIN:
                pixels[x, y] = (red, min(green, strongest_non_green + 24), blue, 0)
            elif green > strongest_non_green + 8:
                pixels[x, y] = (
                    red,
                    min(green, strongest_non_green + 16),
                    blue,
                    alpha,
                )

    return keyed


def main() -> None:
    source = remove_green_key(Image.open(SOURCE))
    segment_width = source.width / VARIANTS
    cell_width = round(segment_width / COLUMNS)
    cell_height = round(SOURCE_HEIGHT / ROWS)
    atlas = Image.new("RGBA", (cell_width * COLUMNS * VARIANTS, cell_height * ROWS))

    for variant in range(VARIANTS):
        segment_x = segment_width * variant

        for row in range(ROWS):
            for col in range(COLUMNS):
                left = round(segment_x + (segment_width * col) / COLUMNS)
                right = round(segment_x + (segment_width * (col + 1)) / COLUMNS)
                top = round(SOURCE_Y + (SOURCE_HEIGHT * row) / ROWS)
                bottom = round(SOURCE_Y + (SOURCE_HEIGHT * (row + 1)) / ROWS)
                cell = source.crop((left, top, right, bottom))

                if cell.size != (cell_width, cell_height):
                    padded = Image.new("RGBA", (cell_width, cell_height))
                    padded.alpha_composite(cell, ((cell_width - cell.width) // 2, 0))
                    cell = padded

                atlas.alpha_composite(
                    cell,
                    ((variant * COLUMNS + col) * cell_width, row * cell_height),
                )

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(OUTPUT)
    print(f"Wrote {OUTPUT.relative_to(ROOT)} ({atlas.width}x{atlas.height})")


if __name__ == "__main__":
    main()
