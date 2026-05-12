#!/usr/bin/env node
/**
 * validate-citations.mjs
 *
 * Validates citation markers and reference declarations across every YAML file
 * under src/content/learn/. Runs against the synced content tree, so execute
 * AFTER `npm run sync`.
 *
 * Checks performed:
 *   - All reference ids are unique within a file.
 *   - Each reference has a valid `kind` and a year >= 1800.
 *   - Every {cite:id} marker in prose (content, description, callout.text,
 *     table cells) refers to a declared reference id.
 *   - Every id in a section/item `citations` array refers to a declared id.
 *   - Every declared reference is cited at least once (warning only).
 *
 * Exit codes:
 *   0 — no ERRORs (warnings are printed but do not fail the run).
 *   1 — one or more ERRORs found.
 *
 * Output format:
 *   ERROR: <file>:<line> <message>
 *   WARN:  <file>:<line> <message>
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, relative, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const LEARN_DIR = resolve(ROOT, 'src', 'content', 'learn');

const VALID_KINDS = new Set(['book', 'journal', 'web', 'standard']);
const CITE_PATTERN = /\{cite:([a-z0-9][a-z0-9-]*)\}/g;

// ── File collection ───────────────────────────────────────────────────────────

function collectYamlFiles(dir) {
  let results = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return results;
  }
  for (const entry of entries) {
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

// ── Line-number helper ────────────────────────────────────────────────────────

/**
 * Return the 1-based line number of the first occurrence of a plain string
 * in the source text. Returns 0 when not found (location unknown).
 */
function lineOf(src, needle) {
  const idx = src.indexOf(needle);
  if (idx === -1) return 0;
  return src.slice(0, idx).split('\n').length;
}

// ── Prose string extraction ───────────────────────────────────────────────────

/**
 * Recursively collect all prose strings from the sections array where
 * {cite:id} markers or citations arrays might appear.
 */
function collectProseStrings(data) {
  const strings = [];

  function walkSection(section) {
    if (section.content)       strings.push(section.content);
    if (section.callout?.text) strings.push(section.callout.text);
    for (const item of section.items ?? []) {
      if (item.description) strings.push(item.description);
    }
    for (const row of section.table?.rows ?? []) {
      for (const cell of row) strings.push(cell);
    }
    for (const sub of section.subsections ?? []) {
      if (sub.content) strings.push(sub.content);
      for (const item of sub.items ?? []) {
        if (item.description) strings.push(item.description);
      }
      for (const row of sub.table?.rows ?? []) {
        for (const cell of row) strings.push(cell);
      }
    }
  }

  for (const section of data.sections ?? []) {
    walkSection(section);
  }
  return strings;
}

/**
 * Collect all ids from `citations` arrays in sections and items.
 */
function collectCitationArrayIds(data) {
  const ids = [];

  function walkSection(section) {
    for (const id of section.citations ?? []) ids.push(id);
    for (const item of section.items ?? []) {
      for (const id of item.citations ?? []) ids.push(id);
    }
    for (const sub of section.subsections ?? []) {
      for (const item of sub.items ?? []) {
        for (const id of item.citations ?? []) ids.push(id);
      }
    }
  }

  for (const section of data.sections ?? []) {
    walkSection(section);
  }
  return ids;
}

// ── Main ──────────────────────────────────────────────────────────────────────

const files = collectYamlFiles(LEARN_DIR);

if (files.length === 0) {
  console.log('No learn YAML files found — run `npm run sync` first.');
  process.exit(0);
}

let errorCount = 0;
let warnCount  = 0;

function report(level, filePath, line, message) {
  const rel = relative(ROOT, filePath);
  const loc = line > 0 ? `${rel}:${line}` : rel;
  console.log(`${level}: ${loc} ${message}`);
  if (level === 'ERROR') errorCount++;
  else warnCount++;
}

for (const filePath of files) {
  let src;
  let data;

  try {
    src = readFileSync(filePath, 'utf8');
    data = yaml.load(src);
  } catch (err) {
    report('ERROR', filePath, 0, `YAML parse error: ${err.message}`);
    continue;
  }

  // Skip files with no references block entirely.
  const references = data.references;
  if (!references || references.length === 0) {
    continue;
  }

  // ── 1. Validate reference declarations ─────────────────────────────────────

  const declaredIds = new Map(); // id → line number in source

  for (const ref of references) {
    // Unique id check
    if (declaredIds.has(ref.id)) {
      const line = lineOf(src, ref.id);
      report('ERROR', filePath, line, `duplicate reference id "${ref.id}"`);
    } else {
      declaredIds.set(ref.id, lineOf(src, ref.id));
    }

    // Valid kind check
    if (!VALID_KINDS.has(ref.kind)) {
      const line = lineOf(src, `kind: ${ref.kind}`);
      report(
        'ERROR',
        filePath,
        line,
        `reference "${ref.id}" has unknown kind "${ref.kind}" (expected: book, journal, web, standard)`,
      );
    }

    // Year range check
    if (ref.year != null && (ref.year < 1800 || !Number.isInteger(ref.year))) {
      const line = lineOf(src, `year: ${ref.year}`);
      report(
        'ERROR',
        filePath,
        line,
        `reference "${ref.id}" has invalid year ${ref.year} (must be integer >= 1800)`,
      );
    }
  }

  // ── 2. Collect cited ids ────────────────────────────────────────────────────

  const citedIds = new Set();

  // Inline {cite:id} markers in prose strings
  for (const text of collectProseStrings(data)) {
    for (const match of text.matchAll(CITE_PATTERN)) {
      const id = match[1];
      citedIds.add(id);
      if (!declaredIds.has(id)) {
        const line = lineOf(src, match[0]);
        report('ERROR', filePath, line, `dangling citation marker {cite:${id}} — id not declared in references`);
      }
    }
  }

  // Explicit citations arrays
  for (const id of collectCitationArrayIds(data)) {
    citedIds.add(id);
    if (!declaredIds.has(id)) {
      const line = lineOf(src, id);
      report('ERROR', filePath, line, `citations array references undeclared id "${id}"`);
    }
  }

  // ── 3. Unused reference warnings ───────────────────────────────────────────

  for (const [id, line] of declaredIds.entries()) {
    if (!citedIds.has(id)) {
      report('WARN', filePath, line, `reference "${id}" is declared but never cited`);
    }
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────

if (errorCount === 0 && warnCount === 0) {
  console.log(`validate-citations: all ${files.length} learn files passed (no citations declared yet).`);
} else {
  console.log('');
  console.log(`validate-citations: ${errorCount} error(s), ${warnCount} warning(s) across ${files.length} files.`);
}

process.exit(errorCount > 0 ? 1 : 0);
