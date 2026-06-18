"""Generate Yuma-branded slide backgrounds with the iconic Y symbol.

Creates background PNGs featuring the oversized Yuma "Y" symbol in the
two-tone style used across Yuma brand materials. Pass --symbol-svg and
--output-dir to choose the source asset and destination directory.

Requirements: cairosvg, Pillow (and the cairo system library).
"""

from __future__ import annotations

import io
import re
import argparse
import importlib
from pathlib import Path
from typing import Any, Sequence

# Resolve paths relative to this script's location
SCRIPT_DIR = Path(__file__).resolve().parent
PACKAGE_ROOT = SCRIPT_DIR.parent
REPO_ROOT = PACKAGE_ROOT.parent.parent

# Slide dimensions (1920×1080 for high-quality backgrounds)
W, H = 1920, 1080

# Yuma brand colors (RGB tuples)
FOREST_GREEN = (0, 93, 70)  # 005D46
BRIGHT_GREEN = (33, 228, 103)  # 21E467
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
PINK = (235, 169, 255)  # EBA9FF


def format_path(path: Path) -> str:
    """Print paths relative to the repo when possible."""
    try:
        return str(path.relative_to(REPO_ROOT))
    except ValueError:
        return str(path)


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate Yuma-branded slide background PNGs."
    )
    parser.add_argument(
        "--symbol-svg",
        type=Path,
        required=True,
        help="Path to Yuma_Symbol_Black-RGB.svg.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        required=True,
        help="Directory for generated PNGs.",
    )
    return parser.parse_args(argv)


def load_rendering_dependencies() -> tuple[Any, Any]:
    try:
        cairosvg = importlib.import_module("cairosvg")
        image = importlib.import_module("PIL.Image")
    except ModuleNotFoundError as exc:
        raise SystemExit(
            "Missing rendering dependency. Install cairosvg and Pillow before generating backgrounds."
        ) from exc
    return cairosvg, image


def render_symbol(
    fill_color_hex: str, size: int, symbol_svg: Path, cairosvg: Any, image: Any
) -> Any:
    """Render the Y symbol SVG at given size with given fill color."""
    svg = symbol_svg.read_text()
    svg = re.sub(r"<path ", f'<path fill="{fill_color_hex}" ', svg)
    png_data = cairosvg.svg2png(bytestring=svg.encode(), output_height=size)
    return image.open(io.BytesIO(png_data)).convert("RGBA")


def make_background(
    bg_color: tuple,
    symbol_color_hex: str,
    symbol_scale: float,
    x_offset_pct: float,
    y_offset_pct: float,
    filename: str,
    symbol_svg: Path,
    output_dir: Path,
    cairosvg: Any,
    image: Any,
) -> Path:
    """Create a slide background with the Y symbol.

    Args:
        bg_color: RGB tuple for background
        symbol_color_hex: hex color for the Y symbol (e.g. "#21E467")
        symbol_scale: symbol height relative to slide height (2.5 = 250%)
        x_offset_pct: horizontal center as fraction of slide width
        y_offset_pct: vertical center as fraction of slide height
        filename: output filename
        symbol_svg: path to the source Yuma symbol SVG
        output_dir: directory where the generated image should be written
    """
    bg = image.new("RGB", (W, H), bg_color)
    sym_h = int(H * symbol_scale)
    symbol = render_symbol(symbol_color_hex, sym_h, symbol_svg, cairosvg, image)

    sym_w = symbol.width
    x = int(W * x_offset_pct - sym_w / 2)
    y = int(H * y_offset_pct - sym_h / 2)

    bg.paste(symbol, (x, y), symbol)
    output_dir.mkdir(parents=True, exist_ok=True)
    out_path = output_dir / filename
    bg.save(str(out_path), quality=95)
    print(f"Created {format_path(out_path)} ({bg.size})")
    return out_path


def main(argv: Sequence[str] | None = None):
    args = parse_args(argv)
    symbol_svg = args.symbol_svg.resolve()
    output_dir = args.output_dir.resolve()
    cairosvg, image = load_rendering_dependencies()

    # Title slide: Forest Green bg + bright green Y on right side
    make_background(
        bg_color=FOREST_GREEN,
        symbol_color_hex="#21E467",
        symbol_scale=2.5,
        x_offset_pct=0.85,
        y_offset_pct=0.45,
        filename="yuma-bg-title-green.png",
        symbol_svg=symbol_svg,
        output_dir=output_dir,
        cairosvg=cairosvg,
        image=image,
    )

    # Section divider: Forest Green bg + green Y on LEFT side
    make_background(
        bg_color=FOREST_GREEN,
        symbol_color_hex="#21E467",
        symbol_scale=2.5,
        x_offset_pct=0.15,
        y_offset_pct=0.45,
        filename="yuma-bg-section-green.png",
        symbol_svg=symbol_svg,
        output_dir=output_dir,
        cairosvg=cairosvg,
        image=image,
    )

    # Subtle accent: White bg + grey Y for statement slides
    make_background(
        bg_color=WHITE,
        symbol_color_hex="#F0ECE9",
        symbol_scale=2.5,
        x_offset_pct=0.85,
        y_offset_pct=0.45,
        filename="yuma-bg-content-subtle.png",
        symbol_svg=symbol_svg,
        output_dir=output_dir,
        cairosvg=cairosvg,
        image=image,
    )

    # Closing slide: Pink bg + darker pink Y
    make_background(
        bg_color=PINK,
        symbol_color_hex="#D88AEE",
        symbol_scale=2.5,
        x_offset_pct=0.85,
        y_offset_pct=0.45,
        filename="yuma-bg-closing-pink.png",
        symbol_svg=symbol_svg,
        output_dir=output_dir,
        cairosvg=cairosvg,
        image=image,
    )

    print("\nDone! Background images generated.")


if __name__ == "__main__":
    main()
