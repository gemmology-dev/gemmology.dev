#!/usr/bin/env node
/**
 * Generate placeholder SVGs for any mineral_expressions row that has neither
 * a pre-generated `model_svg` in the database nor an existing file in
 * public/crystals/.
 *
 * Strategy (in priority order), per missing expression:
 *   1. Skip if public/crystals/{expression_id}.svg already exists (idempotent).
 *   2. Copy the family-level placeholder public/crystals/{family_id}.svg if
 *      it exists — this is the common case, since most expression-level
 *      gaps are for materials whose family already has a generic outline.
 *   3. Otherwise, emit an origin-appropriate template (composite/simulant/
 *      default) so the page never 404s on a broken <img> reference.
 *
 * Usage: node scripts/generate-missing-crystals.mjs
 */
import { existsSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import initSqlJs from 'sql.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CRYSTALS_DIR = join(ROOT, 'public', 'crystals');

const require = createRequire(import.meta.url);

function resolveDbPath() {
  try {
    const mineralData = require('@gemmology/mineral-data');
    if (mineralData?.dbPath && existsSync(mineralData.dbPath)) {
      return mineralData.dbPath;
    }
  } catch {
    // fall through to direct node_modules path
  }
  const fallback = join(ROOT, 'node_modules', '@gemmology', 'mineral-data', 'minerals.db');
  if (existsSync(fallback)) return fallback;
  throw new Error(
    `Could not locate @gemmology/mineral-data database. Run npm install first.`
  );
}

// Origin-appropriate templates, mirroring the existing family-level placeholder
// conventions in public/crystals/ (viewBox 0 0 200 200, width/height 568.8pt).
const TEMPLATES = {
  // Doublets/triplets/assembled stones: gray ellipse ("cabochon" silhouette),
  // matching e.g. public/crystals/opal-doublet.svg, garnet-topped-doublet.svg.
  composite: `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="568.8pt" height="568.8pt">
  <ellipse cx="100" cy="100" rx="80" ry="50" fill="#e2e8f0" stroke="#475569" stroke-width="1.5"/>
  <ellipse cx="100" cy="100" rx="80" ry="50" fill="none" stroke="#475569" stroke-width="0.8" stroke-dasharray="2 2"/>
  <line x1="20" y1="100" x2="180" y2="100" stroke="#334155" stroke-width="1"/>
</svg>
`,
  // Simulants (glass, gilson-process, etc.): pale-blue faceted outline,
  // matching e.g. public/crystals/glass-simulant.svg, synthetic-coral.svg.
  simulant: `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="568.8pt" height="568.8pt">
  <polygon points="100,30 160,80 130,160 70,160 40,80" fill="#e0f2fe" stroke="#0369a1" stroke-width="1.5"/>
  <polygon points="100,30 160,80 130,160 70,160 40,80" fill="none" stroke="#0369a1" stroke-width="0.5" stroke-dasharray="3 3"/>
  <line x1="100" y1="30" x2="100" y2="160" stroke="#0369a1" stroke-width="0.5" opacity="0.3"/>
</svg>
`,
  // Last-resort neutral-gray fallback (same content as public/crystals/placeholder.svg).
  default: `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="568.8pt" height="568.8pt">
  <polygon points="100,30 160,80 130,160 70,160 40,80" fill="#e2e8f0" stroke="#64748b" stroke-width="1.5"/>
  <polygon points="100,30 160,80 130,160 70,160 40,80" fill="none" stroke="#64748b" stroke-width="0.5" stroke-dasharray="3 3"/>
  <line x1="100" y1="30" x2="100" y2="160" stroke="#64748b" stroke-width="0.5" opacity="0.3"/>
</svg>
`,
};

const DB_PATH = resolveDbPath();
const SQL = await initSqlJs();
const db = new SQL.Database(readFileSync(DB_PATH));

const expressionsResult = db.exec(
  "SELECT id, family_id, model_svg FROM mineral_expressions ORDER BY id"
);
const expressions = expressionsResult.length
  ? expressionsResult[0].values.map(([id, family_id, model_svg]) => ({ id, family_id, model_svg }))
  : [];

const familyOriginResult = db.exec('SELECT id, origin FROM mineral_families');
const originByFamily = new Map(
  familyOriginResult.length ? familyOriginResult[0].values.map(([id, origin]) => [id, origin]) : []
);

let written = 0;
let skipped = 0;

for (const expr of expressions) {
  const hasModelSvg = typeof expr.model_svg === 'string' && expr.model_svg.trim().length > 0;
  if (hasModelSvg) continue;

  const targetPath = join(CRYSTALS_DIR, `${expr.id}.svg`);
  if (existsSync(targetPath)) {
    skipped++;
    continue;
  }

  const familySvgPath = join(CRYSTALS_DIR, `${expr.family_id}.svg`);
  if (existsSync(familySvgPath)) {
    copyFileSync(familySvgPath, targetPath);
    console.log(`wrote ${expr.id}.svg (copied from family placeholder ${expr.family_id}.svg)`);
    written++;
    continue;
  }

  const origin = originByFamily.get(expr.family_id);
  const template = TEMPLATES[origin] ?? TEMPLATES.default;
  const templateName = TEMPLATES[origin] ? origin : 'default';
  writeFileSync(targetPath, template);
  console.log(`wrote ${expr.id}.svg (${templateName} template, origin=${origin ?? 'unknown'})`);
  written++;
}

console.log(`\nDone. Wrote ${written} new SVG(s), skipped ${skipped} already-present file(s).`);
