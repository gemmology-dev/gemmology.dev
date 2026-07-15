#!/usr/bin/env node
/**
 * new-case.mjs — scaffold a new Lab Simulation case YAML stub.
 *
 * Usage:
 *   node scripts/new-case.mjs --category=<dir> --slug=<id> [--difficulty=<difficulty>]
 *
 * Options:
 *   --category    Required. Content subdirectory under src/content/cases/
 *                 (e.g. identification, treatments, origin). Free-form —
 *                 unlike questions, cases are not tied to the 8 quiz
 *                 categories; use whatever grouping makes sense for cases.
 *   --slug        Required. Kebab-case identifier. Becomes the case `id`
 *                 field. Must match /^[a-z0-9][a-z0-9-]*$/.
 *   --difficulty  Optional. Default: intermediate.
 *                 One of: foundation intermediate diploma
 *
 * Behaviour:
 *   - Writes  src/content/cases/<category>/<slug>.yaml
 *   - Refuses to overwrite an existing file (idempotent)
 *   - Exits 0 on success, 1 on any error
 */

import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CASE_DIFFICULTIES } from './_cases-schema.mjs';

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
const difficulty = args['difficulty'] ?? 'intermediate';

// ── Validation ────────────────────────────────────────────────────────────────

const errors = [];

if (!category) {
  errors.push('--category is required.');
} else if (!/^[a-z0-9][a-z0-9-]*$/.test(category)) {
  errors.push(
    `--category="${category}" is invalid. Must match /^[a-z0-9][a-z0-9-]*$/ (lowercase, digits, hyphens only).`,
  );
}

if (!slug) {
  errors.push('--slug is required.');
} else if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
  errors.push(
    `--slug="${slug}" is invalid. Must match /^[a-z0-9][a-z0-9-]*$/ (lowercase, digits, hyphens only, no leading hyphen).`,
  );
}

if (!CASE_DIFFICULTIES.includes(difficulty)) {
  errors.push(`--difficulty="${difficulty}" is invalid. Valid values: ${CASE_DIFFICULTIES.join(', ')}`);
}

if (errors.length > 0) {
  for (const e of errors) {
    console.error(`Error: ${e}`);
  }
  process.exit(1);
}

// ── Output path ───────────────────────────────────────────────────────────────

const outDir = resolve(ROOT, 'src', 'content', 'cases', category);
const outPath = resolve(outDir, `${slug}.yaml`);

if (existsSync(outPath)) {
  console.error(`Error: File already exists — ${outPath}`);
  console.error('Refusing to overwrite. Rename or delete it first.');
  process.exit(1);
}

// ── Stub generation ───────────────────────────────────────────────────────────

const stub = `# Case stub — fill in every placeholder marked with TODO.
# Run  npm run validate:cases  to check this file before committing.
# See  src/content/cases/_example/example-case.yaml  for a complete,
# heavily-commented example and docs/authoring-cases.md for the full guide.

id: ${slug}
title: "TODO: Case title (e.g. \\"The Dealer's Ruby\\")"
difficulty: ${difficulty}
estimatedMinutes: 10

backstory: |
  TODO: Set the scene — who brought the stone in, and why. One or two
  sentences, written as a real consulting-room / lab-bench situation.

specimenSummary: |
  TODO: Describe what the learner can see before any testing: shape, colour,
  transparency, approximate weight. No instrument readings here yet — those
  belong in evidenceRevealed on the relevant steps.

groundTruth:
  speciesFamilyId: TODO-mineral-database-family-id
  # variety: TODO
  # treatment: TODO
  # originNote: TODO

# Every property value cited anywhere in this case (RI, SG, spectroscope
# bands, treatment clues, etc.) MUST match mineral_families data or
# SPECTROSCOPE_REFERENCE, with a citation in the \`references\` block below.
# See docs/authoring-cases.md's verification checklist before setting
# unvetted: false.

steps:
  # At least 3 steps required; exactly one must be type: final-identification.
  - id: step-1
    type: choose-next-test
    prompt: "TODO: What does the learner decide to check first?"
    options:
      - id: opt-a
        text: "TODO: the diagnostically fastest choice"
        weight: optimal
        score: 10
        rationale: "TODO: why this is the best next test"
        # revealsEvidenceIds: [ev-1]
        # timeCost: 1
      - id: opt-b
        text: "TODO: a slower but still useful choice"
        weight: acceptable
        score: 5
        rationale: "TODO: why this works but isn't optimal"
        # timeCost: 2
      - id: opt-c
        text: "TODO: a poor choice"
        weight: poor
        score: 0
        rationale: "TODO: why this doesn't help"
        # timeCost: 3
    pointsMultiplier: 1
    # evidenceRevealed:
    #   - id: ev-1
    #     kind: ri
    #     label: "TODO"
    #     value: "TODO"
    #     detail: "TODO"
    #     toolHref: /tools/measurement
    # learnLinks: [TODO-learn-slug]
    # toolLinks:
    #   - href: /tools/measurement
    #     label: "TODO tool label"

  - id: step-2
    type: reading-interpretation
    prompt: "TODO"
    options:
      - id: opt-a
        text: "TODO"
        weight: optimal
        score: 10
        rationale: "TODO"
      - id: opt-b
        text: "TODO"
        weight: poor
        score: 0
        rationale: "TODO"
    pointsMultiplier: 1

  - id: step-3
    type: final-identification
    prompt: "TODO: What is the final identification?"
    options:
      - id: opt-a
        text: "TODO: correct identification"
        weight: optimal
        score: 10
        rationale: "TODO"
      - id: opt-b
        text: "TODO: plausible near-miss"
        weight: poor
        score: 0
        rationale: "TODO"
    pointsMultiplier: 2

debrief:
  summary: |
    TODO: State the final identification plainly and summarize the
    diagnostic chain that led there.
  expertPath:
    - "TODO: step 1 of what an expert would actually do"
    - "TODO: step 2"
    - "TODO: step 3"
  # furtherReading:
  #   - "TODO: e.g. Hughes, R.W. Ruby & Sapphire: A Gemologist's Guide."

# conceptTags:
#   - TODO-tag-1

# references:
#   - id: TODO-citation-id
#     citation: "TODO: full citation"
#     url: https://example.com/optional-url

unvetted: true  # Set to false only after FGA-qualified review and property verification.
`;

// ── Write ─────────────────────────────────────────────────────────────────────

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, stub, 'utf8');

console.log(`Created: ${outPath}`);
console.log(`Next steps:`);
console.log(`  1. Open the file and fill in every TODO placeholder.`);
console.log(`  2. Verify every property value against mineral_families / SPECTROSCOPE_REFERENCE with a citation.`);
console.log(`  3. Run: npm run validate:cases`);
console.log(`  4. Set unvetted: false after FGA-qualified review.`);
