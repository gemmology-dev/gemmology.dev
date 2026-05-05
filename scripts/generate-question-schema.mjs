#!/usr/bin/env node
/**
 * generate-question-schema.mjs — emit a JSON Schema for the question YAML format.
 *
 * Output: schemas/question.json
 *
 * Used by IDEs (VS Code yaml.schemas) for autocomplete when authoring questions.
 * The schema is also registered in .vscode/settings.json.
 *
 * Usage:
 *   node scripts/generate-question-schema.mjs
 *   npm run schema:questions
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { zodToJsonSchema } from 'zod-to-json-schema';
import { questionSchema } from './_questions-schema.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = resolve(ROOT, 'schemas', 'question.json');

const jsonSchema = zodToJsonSchema(questionSchema, {
  name: 'GemmologyQuestion',
  $refStrategy: 'none', // inline all refs for simpler IDE consumption
  target: 'jsonSchema7',
});

// Inject a helpful title and description at the top level
jsonSchema.title = 'Gemmology Question';
jsonSchema.description =
  'A single question in the gemmology.dev curated question bank. ' +
  'See src/content/questions/_example/example-mcq.yaml for a full annotated example.';

const out = JSON.stringify(jsonSchema, null, 2) + '\n';
mkdirSync(resolve(ROOT, 'schemas'), { recursive: true });
writeFileSync(OUT, out, 'utf8');

console.log(`Written: ${OUT}`);
console.log('');
console.log('To enable YAML autocomplete in VS Code, add this to .vscode/settings.json:');
console.log(
  JSON.stringify(
    {
      'yaml.schemas': {
        './schemas/question.json': 'src/content/questions/**/*.yaml',
      },
    },
    null,
    2,
  ),
);
