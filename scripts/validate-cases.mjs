#!/usr/bin/env node
/**
 * validate-cases.mjs — validate every YAML under src/content/cases/**
 * against the published Zod schema, then apply case-specific lints that the
 * schema alone cannot express:
 *
 *   - Option ids must be unique within a step.
 *   - Every step must have at least one `optimal`-weight option.
 *   - The case must contain exactly one `final-identification` step.
 *   - `candidatesAfter` list length must be non-increasing across the
 *     sequence of steps that declare it (candidate narrowing should never
 *     widen the field).
 *   - weight/score consistency: optimal -> 10, acceptable -> 5, poor -> 0,
 *     unless the option sets `allowScoreOverride: true`.
 *   - Every `revealsEvidenceIds` entry must resolve to an evidence item
 *     defined somewhere in the case (any step's `evidenceRevealed`).
 *
 * Exit codes:
 *   0 — all files valid (including the case of zero files found)
 *   1 — one or more files failed validation or lint, or a parse/read error
 *       occurred
 *
 * Usage:
 *   node scripts/validate-cases.mjs
 *   npm run validate:cases
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, relative, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import yaml from 'js-yaml';
import { caseSchema } from './_cases-schema.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CASES_DIR = resolve(ROOT, 'src', 'content', 'cases');

const EXPECTED_SCORE_BY_WEIGHT = {
  optimal: 10,
  acceptable: 5,
  poor: 0,
};

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
    return results; // directory doesn't exist — zero files, valid state
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

function formatZodError(zodError) {
  return zodError.errors
    .map((e) => {
      const path = e.path.length > 0 ? e.path.join('.') : '(root)';
      return `    [${path}] ${e.message}`;
    })
    .join('\n');
}

/** Applies the case-specific lints described in the module docblock. */
function lintCase(caseData) {
  const errors = [];

  // ── Exactly one final-identification step ──────────────────────────────
  const finalSteps = caseData.steps.filter((s) => s.type === 'final-identification');
  if (finalSteps.length !== 1) {
    errors.push(
      `    [steps] expected exactly 1 final-identification step, found ${finalSteps.length}`,
    );
  }

  // ── Evidence catalogue: every evidence item defined anywhere ────────────
  const evidenceIds = new Set();
  for (const step of caseData.steps) {
    for (const item of step.evidenceRevealed ?? []) {
      evidenceIds.add(item.id);
    }
  }

  let previousCandidateCount = null;

  for (const step of caseData.steps) {
    // ── Option ids unique per step ─────────────────────────────────────
    const seenOptionIds = new Set();
    for (const option of step.options) {
      if (seenOptionIds.has(option.id)) {
        errors.push(`    [steps.${step.id}] duplicate option id "${option.id}"`);
      }
      seenOptionIds.add(option.id);
    }

    // ── At least one optimal option per step ───────────────────────────
    if (!step.options.some((o) => o.weight === 'optimal')) {
      errors.push(`    [steps.${step.id}] step has no "optimal"-weight option`);
    }

    // ── weight/score consistency ────────────────────────────────────────
    for (const option of step.options) {
      const expected = EXPECTED_SCORE_BY_WEIGHT[option.weight];
      if (option.score !== expected && !option.allowScoreOverride) {
        errors.push(
          `    [steps.${step.id}.options.${option.id}] weight "${option.weight}" expects ` +
            `score ${expected}, got ${option.score} (set allowScoreOverride: true to permit this deliberately)`,
        );
      }
    }

    // ── revealsEvidenceIds resolve to a defined evidence item ───────────
    for (const option of step.options) {
      for (const id of option.revealsEvidenceIds ?? []) {
        if (!evidenceIds.has(id)) {
          errors.push(
            `    [steps.${step.id}.options.${option.id}] revealsEvidenceIds references undefined evidence id "${id}"`,
          );
        }
      }
    }

    // ── candidatesAfter non-increasing across narrowing steps ──────────
    // Checked on any step whose options declare candidatesAfter (not just
    // steps typed candidate-narrowing — a reading-interpretation step can
    // narrow the field too), in step order across the whole case.
    const counts = step.options
      .map((o) => o.candidatesAfter?.length)
      .filter((n) => typeof n === 'number');
    if (counts.length > 0) {
      const maxCount = Math.max(...counts);
      if (previousCandidateCount !== null && maxCount > previousCandidateCount) {
        errors.push(
          `    [steps.${step.id}] candidatesAfter widens the candidate field (previous narrowing step ` +
            `allowed ${previousCandidateCount}, this step allows up to ${maxCount})`,
        );
      }
      previousCandidateCount = maxCount;
    }
  }

  return errors;
}

// ── Main ──────────────────────────────────────────────────────────────────────

const files = collectYamlFiles(CASES_DIR);

if (files.length === 0) {
  console.log('No case files found. Validation passed (nothing to validate).');
  process.exit(0);
}

let hasErrors = false;
let validCount = 0;

for (const filePath of files) {
  const rel = relative(ROOT, filePath);
  let raw;

  try {
    const src = readFileSync(filePath, 'utf8');
    raw = yaml.load(src);
  } catch (err) {
    console.error(`FAIL  ${rel}`);
    console.error(`    YAML parse error: ${err.message}`);
    hasErrors = true;
    continue;
  }

  const result = caseSchema.safeParse(raw);
  if (!result.success) {
    console.error(`FAIL  ${rel}`);
    console.error(formatZodError(result.error));
    hasErrors = true;
    continue;
  }

  const lintErrors = lintCase(result.data);
  if (lintErrors.length > 0) {
    console.error(`FAIL  ${rel}`);
    console.error(lintErrors.join('\n'));
    hasErrors = true;
    continue;
  }

  console.log(`ok    ${rel}`);
  validCount += 1;
}

console.log('');
console.log(`Validated ${validCount}/${files.length} files successfully.`);

process.exit(hasErrors ? 1 : 0);
