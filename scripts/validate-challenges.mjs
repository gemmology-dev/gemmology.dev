#!/usr/bin/env node
/**
 * validate-challenges.mjs — validate every YAML under src/content/challenges/**
 * against the published Zod schema, then cross-reference each stage against
 * the curated question bank (src/content/questions/**):
 *
 *   - explicit-ids stages: every id in `questionIds` must exist as a
 *     non-deprecated question.
 *   - tag-fallback stages: the number of non-deprecated questions matching
 *     `conceptTags` (per `tagMatch`) must be >= `count`.
 *
 * Exit codes:
 *   0 — all files valid (including the case of zero files found)
 *   1 — one or more files failed validation or cross-reference, or a
 *       parse/read error occurred
 *
 * Usage:
 *   node scripts/validate-challenges.mjs
 *   npm run validate:challenges
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, relative, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import yaml from 'js-yaml';
import { challengeTrackSchema } from './_challenges-schema.mjs';
import { questionSchema } from './_questions-schema.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CHALLENGES_DIR = resolve(ROOT, 'src', 'content', 'challenges');
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

// ── Load the question bank (for cross-referencing) ─────────────────────────

/**
 * Returns { byId: Map<string, question>, all: question[] } of every
 * non-deprecated, schema-valid curated question. Malformed question files
 * are silently skipped here — validate-questions.mjs is the source of truth
 * for question-bank shape errors; this script only needs a best-effort pool
 * to cross-reference against.
 */
function loadQuestionPool() {
  const files = collectYamlFiles(QUESTIONS_DIR);
  const byId = new Map();
  const all = [];

  for (const filePath of files) {
    let raw;
    try {
      raw = yaml.load(readFileSync(filePath, 'utf8'));
    } catch {
      continue;
    }
    const result = questionSchema.safeParse(raw);
    if (!result.success) continue;
    const q = result.data;
    if (q.deprecated) continue;
    byId.set(q.id, q);
    all.push(q);
  }

  return { byId, all };
}

function questionMatchesTags(question, tags, tagMatch) {
  const qTags = question.conceptTags ?? [];
  return tagMatch === 'any'
    ? tags.some((t) => qTags.includes(t))
    : tags.every((t) => qTags.includes(t));
}

// ── Main ──────────────────────────────────────────────────────────────────────

const files = collectYamlFiles(CHALLENGES_DIR);

if (files.length === 0) {
  console.log('No challenge track files found. Validation passed (nothing to validate).');
  process.exit(0);
}

const { byId: questionsById, all: allQuestions } = loadQuestionPool();

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

  const result = challengeTrackSchema.safeParse(raw);
  if (!result.success) {
    console.error(`FAIL  ${rel}`);
    console.error(formatZodError(result.error));
    hasErrors = true;
    continue;
  }

  const track = result.data;
  const crossRefErrors = [];

  for (const stage of track.stages) {
    if (stage.questionIds && stage.questionIds.length > 0) {
      for (const id of stage.questionIds) {
        if (!questionsById.has(id)) {
          crossRefErrors.push(
            `    [stages] stage "${stage.id}": questionId "${id}" not found in the non-deprecated question bank`,
          );
        }
      }
    } else if (stage.conceptTags && stage.count) {
      const matched = allQuestions.filter((q) =>
        questionMatchesTags(q, stage.conceptTags, stage.tagMatch),
      );
      if (matched.length < stage.count) {
        crossRefErrors.push(
          `    [stages] stage "${stage.id}": tag-fallback needs ${stage.count} matching question(s) ` +
            `(tags: ${stage.conceptTags.join(', ')}; tagMatch: ${stage.tagMatch}) but only ${matched.length} found`,
        );
      }
    }
  }

  if (crossRefErrors.length > 0) {
    console.error(`FAIL  ${rel}`);
    console.error(crossRefErrors.join('\n'));
    hasErrors = true;
    continue;
  }

  console.log(`ok    ${rel}`);
  validCount += 1;
}

console.log('');
console.log(`Validated ${validCount}/${files.length} files successfully.`);

process.exit(hasErrors ? 1 : 0);
