#!/usr/bin/env node
/**
 * validate-questions.mjs — validate every YAML under src/content/questions/**
 * against the published Zod schema and print a per-category coverage summary.
 *
 * Exit codes:
 *   0 — all files valid (including the case of zero files found)
 *   1 — one or more files failed validation, or a parse/read error occurred
 *
 * Usage:
 *   node scripts/validate-questions.mjs
 *   npm run validate:questions
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, relative, extname, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import yaml from 'js-yaml';
import { questionSchema, CATEGORIES } from './_questions-schema.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const QUESTIONS_DIR = resolve(ROOT, 'src', 'content', 'questions');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Recursively collect all .yaml files under a directory, excluding paths
 * whose components start with '_' (Astro glob-loader convention).
 */
function collectYamlFiles(dir) {
  let results = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return results; // directory doesn't exist — zero questions, valid state
  }

  for (const entry of entries) {
    if (entry.startsWith('_')) continue; // skip _example, _schema, etc.
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

/**
 * Format a Zod error into a human-readable string.
 */
function formatZodError(zodError) {
  return zodError.errors
    .map((e) => {
      const path = e.path.length > 0 ? e.path.join('.') : '(root)';
      return `    [${path}] ${e.message}`;
    })
    .join('\n');
}

// ── Stats per category ────────────────────────────────────────────────────────

const stats = {};
for (const cat of CATEGORIES) {
  stats[cat] = {
    total: 0,
    vetted: 0,
    unvetted: 0,
    missingConfusionPairs: 0,
    missingReferences: 0,
    difficultySum: 0,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

const files = collectYamlFiles(QUESTIONS_DIR);

if (files.length === 0) {
  console.log('No question files found. Validation passed (nothing to validate).');
  printCoverageSummary();
  process.exit(0);
}

let hasErrors = false;
let validCount = 0;

for (const filePath of files) {
  const rel = relative(ROOT, filePath);
  let raw;

  // Parse YAML
  try {
    const src = readFileSync(filePath, 'utf8');
    raw = yaml.load(src);
  } catch (err) {
    console.error(`FAIL  ${rel}`);
    console.error(`    YAML parse error: ${err.message}`);
    hasErrors = true;
    continue;
  }

  // Validate with Zod
  const result = questionSchema.safeParse(raw);
  if (!result.success) {
    console.error(`FAIL  ${rel}`);
    console.error(formatZodError(result.error));
    hasErrors = true;
    continue;
  }

  // Accumulate stats
  const q = result.data;
  const cat = q.category;
  if (stats[cat]) {
    stats[cat].total += 1;
    if (q.unvetted) {
      stats[cat].unvetted += 1;
    } else {
      stats[cat].vetted += 1;
    }
    if (!q.confusionPairs || q.confusionPairs.length === 0) {
      stats[cat].missingConfusionPairs += 1;
    }
    if (!q.references || q.references.length === 0) {
      stats[cat].missingReferences += 1;
    }
    stats[cat].difficultySum += q.difficulty;
  }

  console.log(`ok    ${rel}`);
  validCount += 1;
}

console.log('');
console.log(`Validated ${validCount}/${files.length} files successfully.`);

printCoverageSummary();

process.exit(hasErrors ? 1 : 0);

// ── Coverage summary ──────────────────────────────────────────────────────────

function printCoverageSummary() {
  console.log('');
  console.log('Per-category coverage:');
  console.log('');

  // Build rows
  const rows = CATEGORIES.map((cat) => {
    const s = stats[cat];
    const avgDiff =
      s.total > 0 ? (s.difficultySum / s.total).toFixed(1) : '-';
    return {
      category: cat,
      total: s.total,
      vetted: s.vetted,
      unvetted: s.unvetted,
      noConfusion: s.missingConfusionPairs,
      noRefs: s.missingReferences,
      avgDiff,
    };
  });

  // Column widths
  const cols = {
    category: Math.max('category'.length, ...rows.map((r) => r.category.length)),
    total: Math.max('total'.length, ...rows.map((r) => String(r.total).length)),
    vetted: Math.max('vetted'.length, ...rows.map((r) => String(r.vetted).length)),
    unvetted: Math.max('unvetted'.length, ...rows.map((r) => String(r.unvetted).length)),
    noConfusion: Math.max('no confusionPairs'.length, ...rows.map((r) => String(r.noConfusion).length)),
    noRefs: Math.max('no references'.length, ...rows.map((r) => String(r.noRefs).length)),
    avgDiff: Math.max('avg difficulty'.length, ...rows.map((r) => String(r.avgDiff).length)),
  };

  function pad(s, w) {
    return String(s).padEnd(w);
  }

  const header =
    `| ${pad('category', cols.category)} ` +
    `| ${pad('total', cols.total)} ` +
    `| ${pad('vetted', cols.vetted)} ` +
    `| ${pad('unvetted', cols.unvetted)} ` +
    `| ${pad('no confusionPairs', cols.noConfusion)} ` +
    `| ${pad('no references', cols.noRefs)} ` +
    `| ${pad('avg difficulty', cols.avgDiff)} |`;

  const sep =
    `|-${'-'.repeat(cols.category)}-` +
    `|-${'-'.repeat(cols.total)}-` +
    `|-${'-'.repeat(cols.vetted)}-` +
    `|-${'-'.repeat(cols.unvetted)}-` +
    `|-${'-'.repeat(cols.noConfusion)}-` +
    `|-${'-'.repeat(cols.noRefs)}-` +
    `|-${'-'.repeat(cols.avgDiff)}-|`;

  console.log(header);
  console.log(sep);

  for (const r of rows) {
    const line =
      `| ${pad(r.category, cols.category)} ` +
      `| ${pad(r.total, cols.total)} ` +
      `| ${pad(r.vetted, cols.vetted)} ` +
      `| ${pad(r.unvetted, cols.unvetted)} ` +
      `| ${pad(r.noConfusion, cols.noConfusion)} ` +
      `| ${pad(r.noRefs, cols.noRefs)} ` +
      `| ${pad(r.avgDiff, cols.avgDiff)} |`;
    console.log(line);
  }

  console.log('');
}
