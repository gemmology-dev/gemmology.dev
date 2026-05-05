#!/usr/bin/env node
/**
 * questions-coverage.mjs — print a markdown coverage table for the question bank.
 *
 * Prints to stdout:
 *   | Category | Total | Vetted | Unvetted | Avg difficulty |
 *   |---|---|---|---|---|
 *   | fundamentals | 10 | 8 | 2 | 2.4 |
 *   ...
 *
 * Exits 0 always (this is a reporting tool, not a gate).
 *
 * Usage:
 *   node scripts/questions-coverage.mjs
 *   npm run questions:coverage
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import yaml from 'js-yaml';
import { questionSchema, CATEGORIES } from './_questions-schema.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const QUESTIONS_DIR = resolve(ROOT, 'src', 'content', 'questions');

// ── File collection (same logic as validate-questions.mjs) ────────────────────

function collectYamlFiles(dir) {
  let results = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (entry.startsWith('_')) continue;
    const full = resolve(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(collectYamlFiles(full));
    } else if (stat.isFile() && extname(entry) === '.yaml') {
      results.push(full);
    }
  }
  return results;
}

// ── Accumulate stats ──────────────────────────────────────────────────────────

const stats = {};
for (const cat of CATEGORIES) {
  stats[cat] = { total: 0, vetted: 0, unvetted: 0, difficultySum: 0 };
}

const files = collectYamlFiles(QUESTIONS_DIR);
let parseErrors = 0;

for (const filePath of files) {
  let raw;
  try {
    raw = yaml.load(readFileSync(filePath, 'utf8'));
  } catch {
    parseErrors += 1;
    continue;
  }

  const result = questionSchema.safeParse(raw);
  if (!result.success) continue; // skip invalid files; validate-questions reports them

  const q = result.data;
  const cat = q.category;
  if (!stats[cat]) continue;

  stats[cat].total += 1;
  if (q.unvetted) {
    stats[cat].unvetted += 1;
  } else {
    stats[cat].vetted += 1;
  }
  stats[cat].difficultySum += q.difficulty;
}

// ── Render markdown table ─────────────────────────────────────────────────────

const rows = CATEGORIES.map((cat) => {
  const s = stats[cat];
  const avgDiff = s.total > 0 ? (s.difficultySum / s.total).toFixed(1) : '-';
  return [cat, String(s.total), String(s.vetted), String(s.unvetted), avgDiff];
});

const headers = ['Category', 'Total', 'Vetted', 'Unvetted', 'Avg difficulty'];

// Compute column widths
const widths = headers.map((h, i) =>
  Math.max(h.length, ...rows.map((r) => r[i].length)),
);

function pad(s, w) {
  return s.padEnd(w);
}

function row(cells) {
  return '| ' + cells.map((c, i) => pad(c, widths[i])).join(' | ') + ' |';
}

function sep() {
  return '| ' + widths.map((w) => '-'.repeat(w)).join(' | ') + ' |';
}

console.log(row(headers));
console.log(sep());
for (const r of rows) {
  console.log(row(r));
}

if (parseErrors > 0) {
  console.error(`\nWarning: ${parseErrors} file(s) could not be parsed and were excluded.`);
  console.error('Run npm run validate:questions for details.');
}
