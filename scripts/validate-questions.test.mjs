/**
 * validate-questions.test.mjs — drift-detection unit test.
 *
 * Verifies that the standalone Zod schema in scripts/_questions-schema.mjs
 * declares exactly the same top-level fields as the published schema in
 * src/content/config.ts (questionsCollection).
 *
 * Run with:
 *   node --test scripts/validate-questions.test.mjs
 *
 * If this test fails it means the two schemas have diverged. Update
 * scripts/_questions-schema.mjs to match src/content/config.ts.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SCHEMA_FIELD_NAMES, questionSchema, CATEGORIES, QUESTION_TYPES } from './_questions-schema.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── Parse field names from config.ts source text ───────────────────────────
// Rather than importing from Astro (which requires the Astro runtime), we
// extract the field names from the TypeScript source with a regex targeting
// the exact indentation used in questionsCollection's z.object() block.
//
// In config.ts the schema is formatted as:
//   const questionsCollection = defineCollection({
//     type: 'data',
//     schema: z
//       .object({
//         id: z.string()...          <-- 6-space indent
//         stem: z.string()...        <-- 6-space indent
//         ...
//       })
//       .refine(...)
//   });
//
// We locate the questionsCollection block, then collect all lines that match
// exactly the 6-space indented `fieldName:` pattern before the closing `})`.

function extractFieldNamesFromConfigTs() {
  const src = readFileSync(resolve(ROOT, 'src', 'content', 'config.ts'), 'utf8');

  // Find the questionsCollection block
  const qStart = src.indexOf('const questionsCollection');
  if (qStart === -1) throw new Error('Could not find questionsCollection in config.ts');

  // Find the closing of questionsCollection (next top-level const or end of file)
  const qEnd = src.indexOf('\nconst ', qStart + 1);
  const block = qEnd === -1 ? src.slice(qStart) : src.slice(qStart, qEnd);

  // Extract top-level field names: exactly 6 spaces + identifier + colon
  // (This is the indentation level inside z.object({...}) in config.ts)
  const fieldRegex = /^      ([a-zA-Z][a-zA-Z0-9]*)\s*:/gm;
  const fields = [];
  let m;
  while ((m = fieldRegex.exec(block)) !== null) {
    fields.push(m[1]);
  }

  return fields;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test('script schema has same fields as config.ts questionsCollection', () => {
  const configFields = extractFieldNamesFromConfigTs();

  // The script schema exposes SCHEMA_FIELD_NAMES from _questions-schema.mjs
  const scriptFields = SCHEMA_FIELD_NAMES;

  // Check same set of fields (order may vary)
  const configSet = new Set(configFields);
  const scriptSet = new Set(scriptFields);

  const missingInScript = [...configSet].filter((f) => !scriptSet.has(f));
  const extraInScript = [...scriptSet].filter((f) => !configSet.has(f));

  assert.deepEqual(
    missingInScript,
    [],
    `Fields in config.ts but missing from _questions-schema.mjs: ${missingInScript.join(', ')}`,
  );

  assert.deepEqual(
    extraInScript,
    [],
    `Fields in _questions-schema.mjs but not in config.ts: ${extraInScript.join(', ')}`,
  );
});

test('CATEGORIES matches the category enum in config.ts', () => {
  const src = readFileSync(
    resolve(ROOT, 'src', 'content', 'config.ts'),
    'utf8',
  );

  // Extract categories from the category enum inside questionsCollection
  const questionsCollectionStart = src.indexOf('const questionsCollection');
  const block = src.slice(questionsCollectionStart);
  const catEnumMatch = block.match(/category: z\.enum\(\[([\s\S]*?)\]\)/);
  assert.ok(catEnumMatch, 'Could not find category enum in questionsCollection');

  const configCats = catEnumMatch[1]
    .split(',')
    .map((s) => s.trim().replace(/['"]/g, ''))
    .filter(Boolean);

  assert.deepEqual(
    [...CATEGORIES].sort(),
    configCats.sort(),
    'CATEGORIES in _questions-schema.mjs do not match config.ts',
  );
});

test('QUESTION_TYPES matches the type enum in config.ts', () => {
  const src = readFileSync(
    resolve(ROOT, 'src', 'content', 'config.ts'),
    'utf8',
  );

  const questionsCollectionStart = src.indexOf('const questionsCollection');
  const block = src.slice(questionsCollectionStart);
  const typeEnumMatch = block.match(/type: z\.enum\(\[([\s\S]*?)\]\)/);
  assert.ok(typeEnumMatch, 'Could not find type enum in questionsCollection');

  const configTypes = typeEnumMatch[1]
    .split(',')
    .map((s) => s.trim().replace(/['"]/g, ''))
    .filter(Boolean);

  assert.deepEqual(
    [...QUESTION_TYPES].sort(),
    configTypes.sort(),
    'QUESTION_TYPES in _questions-schema.mjs do not match config.ts',
  );
});

test('script schema rejects a question with no correct option (mcq)', () => {
  const result = questionSchema.safeParse({
    id: 'test-001',
    stem: 'A red stone shows RI 1.762 to 1.770. What is it?',
    type: 'mcq',
    options: [
      { text: 'Ruby', isCorrect: false },
      { text: 'Spinel', isCorrect: false },
    ],
    rationaleCorrect: 'This is always ruby.',
    difficulty: 3,
    category: 'species',
    conceptTags: ['ri'],
  });
  assert.ok(!result.success, 'Should fail when no option is correct');
});

test('script schema accepts a minimal valid mcq', () => {
  const result = questionSchema.safeParse({
    id: 'test-valid-001',
    stem: 'A red stone shows RI 1.762 to 1.770 and SG 4.00. What is it?',
    type: 'mcq',
    options: [
      { text: 'Ruby', isCorrect: true, rationale: 'Correct.' },
      { text: 'Spinel', isCorrect: false, rationale: 'Spinel is isotropic.' },
    ],
    rationaleCorrect: 'Ruby diagnostic chain: optic character, then SG.',
    difficulty: 3,
    category: 'species',
    conceptTags: ['ri', 'sg'],
  });
  assert.ok(result.success, `Should pass: ${JSON.stringify(result.error?.errors)}`);
});

test('script schema accepts a minimal valid fill-blank', () => {
  const result = questionSchema.safeParse({
    id: 'fill-001',
    stem: 'The refractive index of corundum ranges from 1.762 to ___.',
    type: 'fill-blank',
    acceptedAnswers: ['1.770', '1.77'],
    rationaleCorrect: 'Corundum RI is 1.762–1.770.',
    difficulty: 2,
    category: 'fundamentals',
    conceptTags: ['ri', 'corundum'],
  });
  assert.ok(result.success, `Should pass: ${JSON.stringify(result.error?.errors)}`);
});

test('script schema accepts a minimal valid matching question', () => {
  const result = questionSchema.safeParse({
    id: 'match-001',
    stem: 'Match each gem species to its crystal system.',
    type: 'matching',
    pairs: [
      { left: 'Diamond', right: 'Cubic' },
      { left: 'Quartz', right: 'Trigonal' },
    ],
    rationaleCorrect: 'Crystal systems are fundamental for optic character.',
    difficulty: 2,
    category: 'fundamentals',
    conceptTags: ['crystal-systems'],
  });
  assert.ok(result.success, `Should pass: ${JSON.stringify(result.error?.errors)}`);
});

test('script schema rejects fill-blank with no acceptedAnswers', () => {
  const result = questionSchema.safeParse({
    id: 'fill-bad-001',
    stem: 'The refractive index of corundum ranges from 1.762 to ___.',
    type: 'fill-blank',
    rationaleCorrect: 'Corundum RI is 1.762–1.770.',
    difficulty: 2,
    category: 'fundamentals',
    conceptTags: ['ri'],
  });
  assert.ok(!result.success, 'fill-blank without acceptedAnswers should fail');
});

test('script schema rejects id with uppercase letters', () => {
  const result = questionSchema.safeParse({
    id: 'Invalid-ID',
    stem: 'A red stone shows RI 1.762 to 1.770 and SG 4.00. What is it?',
    type: 'mcq',
    options: [{ text: 'Ruby', isCorrect: true }],
    rationaleCorrect: 'Ruby.',
    difficulty: 3,
    category: 'species',
    conceptTags: ['ri'],
  });
  assert.ok(!result.success, 'Uppercase id should fail');
});
