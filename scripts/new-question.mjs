#!/usr/bin/env node
/**
 * new-question.mjs — scaffold a new question YAML stub.
 *
 * Usage:
 *   node scripts/new-question.mjs --category=<cat> --slug=<id> [--type=<type>]
 *
 * Options:
 *   --category  Required. One of: fundamentals equipment species identification
 *               phenomena origin market care
 *   --slug      Required. Kebab-case identifier. Becomes the question `id` field.
 *               Must match /^[a-z0-9][a-z0-9-]*$/.
 *   --type      Optional. Default: mcq. One of: mcq true-false fill-blank matching image-mcq
 *
 * Behaviour:
 *   - Writes  src/content/questions/<category>/<slug>.yaml
 *   - Refuses to overwrite an existing file (idempotent)
 *   - Exits 0 on success, 1 on any error
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CATEGORIES, QUESTION_TYPES } from './_questions-schema.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── Argument parsing ─────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {};
  for (const arg of argv.slice(2)) {
    const m = arg.match(/^--([a-z-]+)=(.+)$/);
    if (m) {
      args[m[1]] = m[2];
    }
  }
  return args;
}

const args = parseArgs(process.argv);

const category = args['category'];
const slug = args['slug'];
const type = args['type'] ?? 'mcq';

// ── Validation ────────────────────────────────────────────────────────────────

const errors = [];

if (!category) {
  errors.push('--category is required.');
} else if (!CATEGORIES.includes(category)) {
  errors.push(`--category="${category}" is invalid. Valid categories: ${CATEGORIES.join(', ')}`);
}

if (!slug) {
  errors.push('--slug is required.');
} else if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
  errors.push(
    `--slug="${slug}" is invalid. Must match /^[a-z0-9][a-z0-9-]*$/ (lowercase, digits, hyphens only, no leading hyphen).`,
  );
}

if (!QUESTION_TYPES.includes(type)) {
  errors.push(`--type="${type}" is invalid. Valid types: ${QUESTION_TYPES.join(', ')}`);
}

if (errors.length > 0) {
  for (const e of errors) {
    console.error(`Error: ${e}`);
  }
  process.exit(1);
}

// ── Output path ───────────────────────────────────────────────────────────────

const outDir = resolve(ROOT, 'src', 'content', 'questions', category);
const outPath = resolve(outDir, `${slug}.yaml`);

if (existsSync(outPath)) {
  console.error(`Error: File already exists — ${outPath}`);
  console.error('Refusing to overwrite. Rename or delete it first.');
  process.exit(1);
}

// ── Stub generation ───────────────────────────────────────────────────────────

function buildStub(type, slug, category) {
  const base = `# Question stub — fill in every placeholder marked with TODO
# Run  npm run validate:questions  to check this file before committing.
# See  src/content/questions/_example/example-mcq.yaml  for a complete example.

id: ${slug}
stem: |
  TODO: Write the question stem here. Should be scenario-based (≥ 10 chars).
  For FGA-quality questions, describe an observation and ask for an identification
  or interpretation — not a bare fact lookup.
type: ${type}
`;

  let typeBlock = '';
  if (type === 'mcq' || type === 'image-mcq') {
    typeBlock = `
# 3 options is the recommended default; 2–5 are accepted by the schema.
options:
  - text: "TODO: Correct answer text"
    isCorrect: true
    rationale: "TODO: Explain WHY this is correct in diagnostic terms."
  - text: "TODO: Plausible distractor 1"
    isCorrect: false
    rationale: "TODO: Explain why this distractor is wrong."
  - text: "TODO: Plausible distractor 2"
    isCorrect: false
    rationale: "TODO: Explain why this distractor is wrong."
`;
    if (type === 'image-mcq') {
      typeBlock += `imageRef: /crystals/TODO-crystal-name.svg  # path relative to /public\n`;
    }
  } else if (type === 'true-false') {
    typeBlock = `
options:
  - text: "True"
    isCorrect: true   # TODO: set exactly one isCorrect: true
    rationale: "TODO: Why true is correct."
  - text: "False"
    isCorrect: false
    rationale: "TODO: Why false is incorrect."
`;
  } else if (type === 'fill-blank') {
    typeBlock = `
# acceptedAnswers is case-insensitive-compared by the quiz engine.
acceptedAnswers:
  - "TODO: primary accepted answer"
  - "TODO: alternative phrasing (optional)"
`;
  } else if (type === 'matching') {
    typeBlock = `
# At least 2 pairs required.
pairs:
  - left: "TODO: term or concept"
    right: "TODO: matching definition or value"
  - left: "TODO: term or concept"
    right: "TODO: matching definition or value"
  - left: "TODO: term or concept"
    right: "TODO: matching definition or value"
`;
  }

  const footer = `
rationaleCorrect: |
  TODO: Explain the underlying principle or diagnostic chain that makes the
  correct answer correct. Should go beyond merely restating the answer —
  connect it to the broader gemmological context.

difficulty: 3  # 1 (trivial) to 5 (expert); default 3
category: ${category}
conceptTags:
  - TODO-tag-1
  - TODO-tag-2

# Optional metadata — fill in where known; leave commented if unsure.
# sourceArticle: learn-slug/article-slug   # Which learn article this tests
# examRelevance: FGA-foundation             # FGA-foundation | FGA-diploma | GIA-GG
# confusionPairs:                           # ids of near-miss questions
#   - other-question-id
# similarTo:                               # for interleaving — near-concept questions
#   - other-question-id

unvetted: true  # Set to false only after FGA-qualified review
# authorReviewed: "Your name or reviewer identifier"
# lastReviewed: "2026-01-01T00:00:00Z"   # ISO 8601 datetime
deprecated: false

# references:
#   - id: ref-001
#     citation: "Read, P.G. (2008). Gemmology (3rd ed.). Butterworth-Heinemann."
#     url: https://example.com/optional-url
`;

  return base + typeBlock + footer;
}

const stub = buildStub(type, slug, category);

// ── Write ─────────────────────────────────────────────────────────────────────

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, stub, 'utf8');

console.log(`Created: ${outPath}`);
console.log(`Next steps:`);
console.log(`  1. Open the file and fill in every TODO placeholder.`);
console.log(`  2. Run: npm run validate:questions`);
console.log(`  3. Set unvetted: false after FGA-qualified review.`);
