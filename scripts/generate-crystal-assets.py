#!/usr/bin/env python3
"""
Generate SVG assets for all mineral database presets.

This script generates static SVG files for each mineral preset,
which are then used by the Gallery component for fast loading.

Usage:
    python scripts/generate-crystal-assets.py

Requirements:
    pip install cdl-parser crystal-geometry crystal-renderer mineral-database
"""

import sys
from pathlib import Path

# Output directory for SVG files
OUTPUT_DIR = Path(__file__).parent.parent / "public" / "crystals"


def generate_assets():
    """Generate SVG assets for all mineral presets."""
    try:
        from mineral_database import list_presets, get_preset
        from cdl_parser import parse_cdl
        from crystal_geometry import cdl_to_geometry
        from crystal_renderer import generate_svg
    except ImportError as e:
        print(f"Error: Missing required package: {e}")
        print("\nInstall required packages:")
        print("  pip install cdl-parser crystal-geometry crystal-renderer mineral-database")
        sys.exit(1)

    # Ensure output directory exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    presets = list_presets()
    total = len(presets)
    success = 0
    failed = []

    print(f"Generating {total} crystal SVG assets...")
    print(f"Output directory: {OUTPUT_DIR}")
    print("-" * 50)

    for i, name in enumerate(presets, 1):
        preset = get_preset(name)
        if not preset or not preset.cdl:
            print(f"[{i}/{total}] SKIP: {name} (no CDL)")
            continue

        # Normalize filename (lowercase, replace spaces with hyphens)
        filename = name.lower().replace(" ", "-").replace("'", "")
        output_path = OUTPUT_DIR / f"{filename}.svg"

        try:
            # Parse CDL
            desc = parse_cdl(preset.cdl)

            # Generate geometry
            geom = cdl_to_geometry(desc)

            # Generate SVG with consistent styling
            generate_svg(
                geom,
                str(output_path),
                width=300,
                height=300,
                elevation=30,
                azimuth=-45,
                face_color="#0ea5e9",
                edge_color="#0369a1",
                edge_width=1.5,
                opacity=0.85,
                gradient=True,
                show_axes=False,
                show_labels=False,
            )

            print(f"[{i}/{total}] OK: {name} -> {filename}.svg")
            success += 1

        except Exception as e:
            print(f"[{i}/{total}] FAIL: {name} - {e}")
            failed.append((name, str(e)))

    print("-" * 50)
    print(f"Generated: {success}/{total} SVG files")

    if failed:
        print(f"\nFailed ({len(failed)}):")
        for name, error in failed:
            print(f"  - {name}: {error}")

    return success, failed


def generate_placeholder_svg(name: str) -> str:
    """Generate a simple placeholder SVG for testing without dependencies."""
    # Simple octahedron placeholder
    return f'''<svg viewBox="-150 -150 300 300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="face1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:#0284c7;stop-opacity:0.9" />
    </linearGradient>
    <linearGradient id="face2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#38bdf8;stop-opacity:0.7" />
      <stop offset="100%" style="stop-color:#0ea5e9;stop-opacity:0.8" />
    </linearGradient>
  </defs>
  <polygon points="0,-100 -80,0 0,100" fill="url(#face2)" stroke="#0369a1" stroke-width="1.5" opacity="0.6"/>
  <polygon points="0,-100 0,100 80,0" fill="url(#face1)" stroke="#0369a1" stroke-width="1.5" opacity="0.7"/>
  <polygon points="0,-100 -80,0 80,0" fill="url(#face1)" stroke="#0369a1" stroke-width="2"/>
  <polygon points="0,100 -80,0 80,0" fill="url(#face2)" stroke="#0369a1" stroke-width="2"/>
</svg>'''


def generate_placeholder_assets():
    """Generate placeholder SVG assets when packages are not available."""
    # Common mineral names for placeholder generation
    minerals = [
        "alexandrite", "almandine", "amazonite", "amethyst", "andalusite",
        "apatite", "aquamarine", "beryl", "calcite", "carnelian",
        "chrysoberyl", "chrysoprase", "citrine", "demantoid", "diamond",
        "diopside", "emerald", "epidote", "fluorite", "garnet",
        "grossular", "heliodor", "hessonite", "hiddenite", "iolite",
        "jadeite", "kunzite", "kyanite", "labradorite", "lapis-lazuli",
        "malachite", "moonstone", "morganite", "nephrite", "opal",
        "orthoclase", "peridot", "pyrope", "quartz", "rhodolite",
        "ruby", "sapphire", "scapolite", "sphene", "spessartine",
        "spinel", "spodumene", "sunstone", "tanzanite", "topaz",
        "tourmaline", "tsavorite", "turquoise", "zircon", "zoisite",
        # Additional varieties
        "rose-quartz", "smoky-quartz", "star-ruby", "star-sapphire",
        "cats-eye-chrysoberyl", "padparadscha", "paraiba-tourmaline",
        "watermelon-tourmaline", "rubellite", "indicolite",
        # Cubic minerals
        "pyrite", "magnetite", "galena",
        # Hexagonal/Trigonal
        "corundum", "hematite", "cinnabar",
        # Tetragonal
        "rutile", "cassiterite", "vesuvianite",
        # Orthorhombic
        "olivine", "barite", "celestine",
        # Monoclinic
        "gypsum", "realgar", "orpiment",
    ]

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Generating {len(minerals)} placeholder SVG assets...")
    print(f"Output directory: {OUTPUT_DIR}")
    print("-" * 50)

    for i, name in enumerate(minerals, 1):
        output_path = OUTPUT_DIR / f"{name}.svg"
        svg_content = generate_placeholder_svg(name)

        with open(output_path, "w") as f:
            f.write(svg_content)

        print(f"[{i}/{len(minerals)}] OK: {name}.svg")

    print("-" * 50)
    print(f"Generated: {len(minerals)} placeholder SVG files")
    print("\nNote: These are placeholder octahedron shapes.")
    print("Install the gemmology packages for accurate crystal rendering.")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Generate crystal SVG assets for gemmology.dev"
    )
    parser.add_argument(
        "--placeholder",
        action="store_true",
        help="Generate placeholder SVGs without requiring gemmology packages",
    )

    args = parser.parse_args()

    if args.placeholder:
        generate_placeholder_assets()
    else:
        try:
            generate_assets()
        except ImportError:
            print("\nGemmology packages not found. Generating placeholders instead.")
            print("Use --placeholder flag to skip this check.\n")
            generate_placeholder_assets()
