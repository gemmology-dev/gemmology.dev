#!/usr/bin/env node
/**
 * Verify that every mineral_families row AND every mineral_expressions row
 * has a corresponding SVG — either a pre-generated `model_svg` in the
 * database (expressions only) or a file in public/crystals/.
 * Exits non-zero if any are missing.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import initSqlJs from 'sql.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DB_PATH = join(ROOT, 'node_modules', '@gemmology', 'mineral-data', 'minerals.db');
const CRYSTALS_DIR = join(ROOT, 'public', 'crystals');

if (!existsSync(DB_PATH)) {
  console.error(`mineral-data not installed at ${DB_PATH} — run npm install`);
  process.exit(1);
}

const SQL = await initSqlJs();
const db = new SQL.Database(readFileSync(DB_PATH));

// 1. Family-level check (existing behaviour).
const familyResult = db.exec('SELECT id FROM mineral_families ORDER BY id');
const familyIds = familyResult.length ? familyResult[0].values.map((row) => row[0]) : [];
const missingFamilies = familyIds.filter((id) => !existsSync(join(CRYSTALS_DIR, `${id}.svg`)));

// 2. Expression-level check: a gap only counts if there is NEITHER an inline
// `model_svg` in the database NOR a file in public/crystals/.
const expressionResult = db.exec('SELECT id, model_svg FROM mineral_expressions ORDER BY id');
const expressionRows = expressionResult.length ? expressionResult[0].values : [];
const missingExpressions = expressionRows
  .filter(([, modelSvg]) => !(typeof modelSvg === 'string' && modelSvg.trim().length > 0))
  .map(([id]) => id)
  .filter((id) => !existsSync(join(CRYSTALS_DIR, `${id}.svg`)));

if (missingFamilies.length === 0 && missingExpressions.length === 0) {
  console.log(
    `OK: all ${familyIds.length} mineral families and ${expressionRows.length} mineral expressions have SVGs (file or model_svg) available`
  );
  process.exit(0);
}

if (missingFamilies.length > 0) {
  console.error(`MISSING ${missingFamilies.length}/${familyIds.length} family SVGs:`);
  for (const id of missingFamilies) console.error(`  - ${id}`);
}

if (missingExpressions.length > 0) {
  console.error(
    `MISSING ${missingExpressions.length}/${expressionRows.length} expression SVGs (no model_svg and no file):`
  );
  for (const id of missingExpressions) console.error(`  - ${id}`);
}

process.exit(1);
