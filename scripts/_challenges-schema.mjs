/**
 * Standalone Zod schema for the challenges content collection.
 *
 * This module intentionally mirrors the schema declared in
 * src/content/config.ts (challengeTrackSchema / challengeStageSchema) —
 * WITHOUT importing from Astro, so CI and Node scripts can validate YAML
 * files without booting the Astro runtime.
 *
 * IMPORTANT: When src/content/config.ts's challenge schema is updated, this
 * file MUST be updated in lockstep (mirrors the existing
 * _questions-schema.mjs / config.ts drift-prevention convention).
 *
 * Dependency: zod (transitive, available via node_modules from astro).
 */

import { z } from 'zod';

// ── Categories (must match src/content/config.ts exactly) ──────────────────

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

// ── Stage sub-schema ─────────────────────────────────────────────────────────

export const challengeStageSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
    title: z.string(),
    description: z.string().optional(),
    // Explicit-ids path: an ordered set of curated question ids.
    questionIds: z.array(z.string()).min(1).optional(),
    // Tag-fallback path: pull `count` questions matching conceptTags.
    conceptTags: z.array(z.string()).min(1).optional(),
    tagMatch: z.enum(['all', 'any']).default('all'),
    count: z.number().int().min(1).optional(),
    passThreshold: z.number().min(0).max(1).default(0.7),
  })
  .refine(
    (stage) => Boolean(stage.questionIds) || Boolean(stage.conceptTags && stage.count),
    {
      message:
        'Stage must define either questionIds, or both conceptTags and count (tag-fallback selection)',
    },
  );

// ── Main track schema ────────────────────────────────────────────────────────

export const challengeTrackSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  title: z.string(),
  description: z.string(),
  icon: z.string().optional(),
  categoryAffinity: z.enum(CATEGORIES).optional(),
  conceptTags: z.array(z.string()).optional(),
  estimatedMinutes: z.number().int().optional(),
  stages: z.array(challengeStageSchema).min(1),
});

/**
 * Ordered list of top-level field names declared in the schema.
 * Used by an optional future drift-detection test (mirrors
 * scripts/validate-questions.test.mjs's pattern for the questions schema).
 */
export const SCHEMA_FIELD_NAMES = Object.keys(challengeTrackSchema.shape);

export const STAGE_SCHEMA_FIELD_NAMES = Object.keys(
  /** @type {z.ZodObject<any>} */ (challengeStageSchema._def.schema).shape,
);
