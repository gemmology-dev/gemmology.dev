/**
 * Standalone Zod schema for the cases content collection.
 *
 * This module intentionally mirrors the schema declared in
 * src/content/config.ts (casesCollection / caseStepSchema / caseOptionSchema
 * / evidenceItemSchema / caseGroundTruthSchema / caseDebriefSchema) —
 * WITHOUT importing from Astro, so CI and Node scripts can validate YAML
 * files without booting the Astro runtime. Mirrors the existing
 * _questions-schema.mjs / _challenges-schema.mjs drift-prevention
 * convention.
 *
 * IMPORTANT: When src/content/config.ts's case schema is updated, this file
 * MUST be updated in lockstep.
 *
 * Dependency: zod (transitive, available via node_modules from astro).
 */

import { z } from 'zod';

export const EVIDENCE_KINDS = /** @type {const} */ ([
  'visual',
  'ri',
  'sg',
  'birefringence',
  'optic-character',
  'pleochroism',
  'spectroscope',
  'uv-fluorescence',
  'chelsea-filter',
  'inclusion',
  'hardness',
  'other',
]);

export const CASE_OPTION_WEIGHTS = /** @type {const} */ (['optimal', 'acceptable', 'poor']);

export const CASE_STEP_TYPES = /** @type {const} */ ([
  'choose-next-test',
  'reading-interpretation',
  'candidate-narrowing',
  'final-identification',
  'treatment-call',
]);

export const CASE_DIFFICULTIES = /** @type {const} */ (['foundation', 'intermediate', 'diploma']);

// ── Evidence ─────────────────────────────────────────────────────────────────

export const evidenceItemSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  kind: z.enum(EVIDENCE_KINDS),
  label: z.string(),
  value: z.string(),
  detail: z.string().optional(),
  toolHref: z.string().optional(),
});

// ── Option / step ────────────────────────────────────────────────────────────

export const caseOptionSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  text: z.string().min(1),
  weight: z.enum(CASE_OPTION_WEIGHTS),
  score: z.number().int().min(0).max(10),
  rationale: z.string(),
  revealsEvidenceIds: z.array(z.string()).optional(),
  candidatesAfter: z
    .array(z.object({ familyId: z.string(), name: z.string() }))
    .optional(),
  timeCost: z.number().int().min(0).max(5).optional(),
  // Escape hatch for the weight/score-consistency lint in validate-cases.mjs
  // (optimal->10, acceptable->5, poor->0 is the default expectation). Not a
  // content-schema field consumed at runtime — purely a validator directive.
  allowScoreOverride: z.boolean().optional(),
});

export const caseStepSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  type: z.enum(CASE_STEP_TYPES),
  prompt: z.string().min(1),
  evidenceRevealed: z.array(evidenceItemSchema).optional(),
  options: z.array(caseOptionSchema).min(2).max(6),
  pointsMultiplier: z.number().int().min(1).max(3).default(1),
  learnLinks: z.array(z.string()).optional(),
  toolLinks: z.array(z.object({ href: z.string(), label: z.string() })).optional(),
});

// ── Ground truth / debrief ───────────────────────────────────────────────────

export const caseGroundTruthSchema = z.object({
  speciesFamilyId: z.string(),
  variety: z.string().optional(),
  treatment: z.string().optional(),
  originNote: z.string().optional(),
});

export const caseDebriefSchema = z.object({
  summary: z.string(),
  expertPath: z.array(z.string()).min(1),
  furtherReading: z.array(z.string()).optional(),
});

// ── Main case schema ─────────────────────────────────────────────────────────

export const caseSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
    title: z.string(),
    difficulty: z.enum(CASE_DIFFICULTIES),
    estimatedMinutes: z.number().int(),
    backstory: z.string(),
    specimenSummary: z.string(),
    groundTruth: caseGroundTruthSchema,
    steps: z.array(caseStepSchema).min(3),
    debrief: caseDebriefSchema,
    conceptTags: z.array(z.string()).optional(),
    references: z
      .array(
        z.object({
          id: z.string(),
          citation: z.string(),
          url: z.string().url().optional(),
        }),
      )
      .optional(),
    unvetted: z.boolean().default(false),
  })
  .refine((c) => c.steps.some((s) => s.type === 'final-identification'), {
    message: 'Case must contain at least one final-identification step',
  });

/**
 * Ordered list of top-level field names declared in the schema.
 * Used by an optional future drift-detection test (mirrors
 * scripts/validate-questions.test.mjs's pattern for the questions schema).
 */
export const SCHEMA_FIELD_NAMES = Object.keys(
  /** @type {z.ZodObject<any>} */ (caseSchema._def.schema).shape,
);
