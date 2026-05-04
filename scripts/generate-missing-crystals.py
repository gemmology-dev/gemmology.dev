#!/usr/bin/env python3
"""
Generate SVGs for mineral families missing from public/crystals/.

Reads CDL expressions from the @gemmology/mineral-data SQLite DB
and renders missing families. For amorphous/composite/simulant
materials with no crystal morphology, writes a placeholder SVG.

Usage:
    python scripts/generate-missing-crystals.py
"""

import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
OUTPUT_DIR = ROOT / "public" / "crystals"
DB_PATH = ROOT / "node_modules" / "@gemmology" / "mineral-data" / "minerals.db"

PLACEHOLDER_TEMPLATES = {
    "amorphous": '''<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="568.8pt" height="568.8pt">
  <defs>
    <radialGradient id="g" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#cbd5e1"/>
      <stop offset="100%" stop-color="#64748b"/>
    </radialGradient>
  </defs>
  <ellipse cx="100" cy="110" rx="70" ry="55" fill="url(#g)" stroke="#334155" stroke-width="1.5"/>
  <ellipse cx="78" cy="92" rx="20" ry="12" fill="#f1f5f9" opacity="0.5"/>
</svg>''',
    "composite": '''<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="568.8pt" height="568.8pt">
  <ellipse cx="100" cy="100" rx="80" ry="50" fill="#e2e8f0" stroke="#475569" stroke-width="1.5"/>
  <ellipse cx="100" cy="100" rx="80" ry="50" fill="none" stroke="#475569" stroke-width="0.8" stroke-dasharray="2 2"/>
  <line x1="20" y1="100" x2="180" y2="100" stroke="#334155" stroke-width="1"/>
</svg>''',
    "simulant": '''<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="568.8pt" height="568.8pt">
  <polygon points="100,30 160,80 130,160 70,160 40,80" fill="#e0f2fe" stroke="#0369a1" stroke-width="1.5"/>
  <polygon points="100,30 160,80 130,160 70,160 40,80" fill="none" stroke="#0369a1" stroke-width="0.5" stroke-dasharray="3 3"/>
  <line x1="100" y1="30" x2="100" y2="160" stroke="#0369a1" stroke-width="0.5" opacity="0.3"/>
</svg>''',
    "default": '''<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="568.8pt" height="568.8pt">
  <polygon points="100,30 160,80 130,160 70,160 40,80" fill="#cbd5e1" stroke="#334155" stroke-width="1.5"/>
  <line x1="100" y1="30" x2="100" y2="160" stroke="#334155" stroke-width="0.6" opacity="0.5"/>
  <line x1="40" y1="80" x2="160" y2="80" stroke="#334155" stroke-width="0.6" opacity="0.5"/>
</svg>''',
}


def render_cdl_to_svg(cdl_string: str, output_path: Path) -> bool:
    try:
        from cdl_parser import parse_cdl
        from crystal_geometry import cdl_to_geometry
        from crystal_renderer.visualization import generate_geometry_svg
    except ImportError as e:
        print(f"ERR: missing toolchain: {e}", file=sys.stderr)
        return False

    try:
        parsed = parse_cdl(cdl_string)
        geometry = cdl_to_geometry(parsed)
        if not geometry or not geometry.is_valid or len(geometry.vertices) == 0:
            return False
        generate_geometry_svg(
            geometry.vertices,
            geometry.faces,
            output_path,
            face_normals=geometry.face_normals,
            show_axes=False,
            show_grid=False,
            dpi=144,
        )
        return True
    except Exception as e:
        print(f"  parse/render failed: {e}")
        return False


def main():
    if not DB_PATH.exists():
        print(f"DB not found at {DB_PATH}; run npm install first.", file=sys.stderr)
        sys.exit(1)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    families = conn.execute(
        "SELECT id, crystal_system, origin, category FROM mineral_families ORDER BY id"
    ).fetchall()

    rendered = 0
    placeholder = 0
    skipped = 0
    failed = []

    for fam in families:
        fid = fam["id"]
        out = OUTPUT_DIR / f"{fid}.svg"
        if out.exists():
            skipped += 1
            continue

        # Find the best expression — prefer "default", else first non-empty CDL
        rows = conn.execute(
            "SELECT slug, cdl FROM mineral_expressions WHERE family_id = ? ORDER BY (slug = 'default') DESC, slug",
            (fid,),
        ).fetchall()

        cdl = ""
        for row in rows:
            if row["cdl"] and row["cdl"].strip():
                cdl = row["cdl"]
                break

        # Try CDL render first
        if cdl and "amorphous" not in cdl.lower():
            if render_cdl_to_svg(cdl, out):
                print(f"  RENDER: {fid}")
                rendered += 1
                continue

        # Pick placeholder type
        system = (fam["crystal_system"] or "").lower()
        origin = (fam["origin"] or "").lower()
        if origin == "composite":
            template = PLACEHOLDER_TEMPLATES["composite"]
        elif origin == "simulant":
            template = PLACEHOLDER_TEMPLATES["simulant"]
        elif system == "amorphous":
            template = PLACEHOLDER_TEMPLATES["amorphous"]
        else:
            template = PLACEHOLDER_TEMPLATES["default"]

        out.write_text(template)
        print(f"  PLACEHOLDER ({origin or system or 'default'}): {fid}")
        placeholder += 1

    print("-" * 50)
    print(f"Rendered: {rendered}, Placeholder: {placeholder}, Skipped: {skipped}")
    if failed:
        print(f"Failed: {len(failed)}: {failed}")


if __name__ == "__main__":
    main()
