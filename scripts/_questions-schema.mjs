/**
 * Standalone Zod schema for the questions content collection.
 *
 * This module intentionally mirrors the schema declared in
 * src/content/config.ts (questionsCollection) — WITHOUT importing from Astro,
 * so CI and Node scripts can validate YAML files without booting the Astro
 * runtime.
 *
 * IMPORTANT: When src/content/config.ts is updated by the sole schema owner
 * (T4 / track-lead), this file MUST be updated in lockstep. The drift-
 * detection unit test at scripts/validate-questions.test.mjs enforces this
 * by comparing field-by-field.
 *
 * Dependency: zod (transitive, available via node_modules from astro).
 */

import { z } from 'zod';

// ── Option sub-schema ────────────────────────────────────────────────────────

export const questionOptionSchema = z.object({
  text: z.string().min(1),
  isCorrect: z.boolean(),
  rationale: z.string().optional(),
});

// ── Main question schema ─────────────────────────────────────────────────────

export const questionSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
    stem: z.string().min(10),
    type: z.enum(['mcq', 'true-false', 'fill-blank', 'matching', 'image-mcq']),

    // mcq / true-false / image-mcq
    options: z.array(questionOptionSchema).min(2).max(5).optional(),

    // fill-blank
    acceptedAnswers: z.array(z.string()).optional(),

    // matching
    pairs: z
      .array(z.object({ left: z.string(), right: z.string() }))
      .optional(),

    // universal
    rationaleCorrect: z.string(),
    difficulty: z.number().int().min(1).max(5),
    category: z.enum([
      'fundamentals',
      'equipment',
      'species',
      'identification',
      'phenomena',
      'origin',
      'market',
      'care',
    ]),
    conceptTags: z.array(z.string()),
    sourceArticle: z.string().optional(),
    examRelevance: z
      .enum(['FGA-foundation', 'FGA-diploma', 'GIA-GG'])
      .optional(),
    confusionPairs: z.array(z.string()).optional(),
    similarTo: z.array(z.string()).optional(),
    imageRef: z.string().optional(),
    unvetted: z.boolean().default(false),
    authorReviewed: z.string().optional(),
    lastReviewed: z.string().datetime().optional(),
    deprecated: z.boolean().default(false),
    references: z
      .array(
        z.object({
          id: z.string(),
          citation: z.string(),
          url: z.string().url().optional(),
        }),
      )
      .optional(),
  })
  .refine(
    (q) => {
      if (q.type === 'mcq' || q.type === 'true-false' || q.type === 'image-mcq') {
        return Boolean(q.options && q.options.some((o) => o.isCorrect));
      }
      if (q.type === 'fill-blank') {
        return Boolean(q.acceptedAnswers && q.acceptedAnswers.length > 0);
      }
      if (q.type === 'matching') {
        return Boolean(q.pairs && q.pairs.length >= 2);
      }
      return false;
    },
    { message: 'Question must have valid answer data for its type' },
  );

/**
 * Ordered list of top-level field names declared in the schema.
 * Used by the drift-detection test to compare against config.ts.
 */
export const SCHEMA_FIELD_NAMES = Object.keys(
  /** @type {z.ZodObject<any>} */ (questionSchema._def.schema).shape,
);

/**
 * The valid question types, as a plain array for use in scripts.
 */
export const QUESTION_TYPES = /** @type {const} */ ([
  'mcq',
  'true-false',
  'fill-blank',
  'matching',
  'image-mcq',
]);

/**
 * The valid categories, matching src/content/config.ts exactly.
 */
export const CATEGORIES = /** @type {const} */ ([
  'fundamentals',
  'equipment',
  'species',
  'identification',
  'phenomena',
  'origin',
  'market',
  'care',
]);
