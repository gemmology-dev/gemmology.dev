#!/usr/bin/env python3
"""
Generate all crystal assets (SVG, STL, glTF, OBJ) for all mineral database presets.

This script generates static files for each mineral preset in multiple formats,
which are then used by the website for downloads and 3D viewing.

Usage:
    python scripts/generate-all-assets.py [--formats svg,stl,gltf,obj] [--preset NAME]

Requirements:
    pip install gemmology-cdl-parser gemmology-crystal-geometry gemmology-crystal-renderer gemmology-mineral-database
"""

import sys
import argparse
from pathlib import Path
from typing import Optional

import numpy as np

# Output directories
BASE_DIR = Path(__file__).parent.parent / "public"
OUTPUT_DIRS = {
    "svg": BASE_DIR / "crystals",
    "stl": BASE_DIR / "models" / "stl",
    "gltf": BASE_DIR / "models" / "gltf",
    "obj": BASE_DIR / "models" / "obj",
}


def normalize_filename(name: str) -> str:
    """Normalize mineral name to filename."""
    return name.lower().replace(" ", "-").replace("'", "").replace("(", "").replace(")", "")


def generate_assets(formats: list[str], preset_filter: Optional[str] = None):
    """Generate assets for all mineral presets."""
    try:
        from mineral_database import list_presets, get_preset
        from cdl_parser import parse_cdl
        from crystal_geometry import cdl_to_geometry
        from crystal_renderer import generate_geometry_svg
        from crystal_renderer import export_stl, export_gltf
        from crystal_renderer.formats.obj import export_obj
    except ImportError as e:
        print(f"Error: Missing required package: {e}")
        print("\nInstall required packages:")
        print("  pip install gemmology-cdl-parser gemmology-crystal-geometry gemmology-crystal-renderer gemmology-mineral-database")
        sys.exit(1)

    # Ensure output directories exist
    for fmt in formats:
        OUTPUT_DIRS[fmt].mkdir(parents=True, exist_ok=True)

    # Get presets
    presets = list_presets()
    if preset_filter:
        presets = [p for p in presets if preset_filter.lower() in p.lower()]

    total = len(presets)
    stats = {fmt: {"success": 0, "failed": []} for fmt in formats}

    print(f"Generating assets for {total} mineral presets...")
    print(f"Formats: {', '.join(formats)}")
    print(f"Output base: {BASE_DIR}")
    print("-" * 60)

    for i, name in enumerate(presets, 1):
        preset = get_preset(name)
        cdl = preset.get("cdl") if isinstance(preset, dict) else getattr(preset, "cdl", None)
        if not preset or not cdl:
            print(f"[{i}/{total}] SKIP: {name} (no CDL)")
            continue

        filename = normalize_filename(name)
        print(f"[{i}/{total}] {name}")

        try:
            # Parse and generate geometry
            desc = parse_cdl(cdl)
            geom = cdl_to_geometry(desc)

            # Extract vertices and faces from geometry
            vertices = np.array(geom.vertices)
            faces = geom.faces
            face_normals = [np.array(n) for n in geom.face_normals] if geom.face_normals else None

            # Generate each format
            for fmt in formats:
                try:
                    if fmt == "svg":
                        output_path = OUTPUT_DIRS[fmt] / f"{filename}.svg"
                        generate_geometry_svg(
                            vertices=vertices,
                            faces=faces,
                            output_path=str(output_path),
                            face_normals=face_normals,
                            show_axes=False,
                            show_grid=False,
                            elev=30,
                            azim=-45,
                            face_color="#0ea5e9",
                            edge_color="#0369a1",
                            figsize=(6, 6),
                            dpi=100,
                        )
                        stats[fmt]["success"] += 1
                        print(f"    ✓ SVG: {filename}.svg")

                    elif fmt == "stl":
                        output_path = OUTPUT_DIRS[fmt] / f"{filename}.stl"
                        export_stl(vertices, faces, str(output_path), binary=True)
                        stats[fmt]["success"] += 1
                        print(f"    ✓ STL: {filename}.stl")

                    elif fmt == "gltf":
                        output_path = OUTPUT_DIRS[fmt] / f"{filename}.glb"
                        export_gltf(vertices, faces, str(output_path), name=name)
                        stats[fmt]["success"] += 1
                        print(f"    ✓ glTF: {filename}.glb")

                    elif fmt == "obj":
                        output_path = OUTPUT_DIRS[fmt] / f"{filename}.obj"
                        export_obj(vertices, faces, str(output_path), name=name, face_normals=face_normals)
                        stats[fmt]["success"] += 1
                        print(f"    ✓ OBJ: {filename}.obj")

                except Exception as e:
                    print(f"    ✗ {fmt.upper()} error: {e}")
                    stats[fmt]["failed"].append(name)

        except Exception as e:
            print(f"    ✗ Geometry error: {e}")
            for fmt in formats:
                stats[fmt]["failed"].append(name)

    # Summary
    print("-" * 60)
    print("Summary:")
    for fmt in formats:
        s = stats[fmt]
        print(f"  {fmt.upper()}: {s['success']}/{total} generated")
        if s["failed"]:
            print(f"    Failed: {', '.join(s['failed'][:5])}" + ("..." if len(s["failed"]) > 5 else ""))

    return stats


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate crystal assets for gemmology.dev"
    )
    parser.add_argument(
        "--formats",
        default="svg,stl,gltf,obj",
        help="Comma-separated list of formats to generate (default: svg,stl,gltf,obj)",
    )
    parser.add_argument(
        "--preset",
        default=None,
        help="Filter to specific preset(s) by name substring",
    )

    args = parser.parse_args()
    formats = [f.strip().lower() for f in args.formats.split(",")]

    # Validate formats
    valid_formats = {"svg", "stl", "gltf", "obj"}
    invalid = set(formats) - valid_formats
    if invalid:
        print(f"Error: Invalid format(s): {invalid}")
        print(f"Valid formats: {valid_formats}")
        sys.exit(1)

    generate_assets(formats, args.preset)
