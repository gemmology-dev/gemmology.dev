#!/usr/bin/env node
/**
 * Verify that every mineral_families row has a corresponding SVG in public/crystals/.
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
const result = db.exec('SELECT id FROM mineral_families ORDER BY id');
const ids = result[0].values.map((row) => row[0]);

const missing = ids.filter((id) => !existsSync(join(CRYSTALS_DIR, `${id}.svg`)));

if (missing.length === 0) {
  console.log(`OK: all ${ids.length} mineral families have SVGs in public/crystals/`);
  process.exit(0);
}

console.error(`MISSING ${missing.length}/${ids.length} SVGs:`);
for (const id of missing) console.error(`  - ${id}`);
process.exit(1);
