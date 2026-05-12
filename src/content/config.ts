import { defineCollection, z } from 'astro:content';

// ----------------------------------------------------------------------
// Citation / reference schema (used by learnCollection)
// ----------------------------------------------------------------------

const referenceAuthorSchema = z.object({
  family: z.string(),
  given: z.string().optional(),
});

const bookReferenceSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  kind: z.literal('book'),
  authors: z.array(referenceAuthorSchema),
  title: z.string(),
  year: z.number().int(),
  publisher: z.string().optional(),
  edition: z.union([z.string(), z.number()]).optional(),
  isbn: z.string().optional(),
  doi: z.string().optional(),
  url: z.string().url().optional(),
  pages: z.string().optional(),
});

const journalReferenceSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  kind: z.literal('journal'),
  authors: z.array(referenceAuthorSchema),
  title: z.string(),
  journal: z.string(),
  year: z.number().int(),
  volume: z.number().int().optional(),
  issue: z.number().int().optional(),
  pages: z.string().optional(),
  doi: z.string().optional(),
  url: z.string().url().optional(),
});

const webReferenceSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  kind: z.literal('web'),
  authors: z.array(referenceAuthorSchema).optional(),
  title: z.string(),
  publisher: z.string().optional(),
  url: z.string().url(),
  accessed: z.string().optional(),
  year: z.number().int().optional(),
});

const standardReferenceSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  kind: z.literal('standard'),
  authors: z.array(referenceAuthorSchema).optional(),
  organization: z.string().optional(),
  title: z.string(),
  year: z.number().int(),
  identifier: z.string().optional(),
  url: z.string().url().optional(),
  publisher: z.string().optional(),
});

// Discriminated union on `kind` — preferred over flat union for type narrowing.
export const referenceSchema = z.discriminatedUnion('kind', [
  bookReferenceSchema,
  journalReferenceSchema,
  webReferenceSchema,
  standardReferenceSchema,
]);

export type ReferenceEntry = z.infer<typeof referenceSchema>;

// ----------------------------------------------------------------------
// Schema for items within sections (property cards, definition lists)
// ----------------------------------------------------------------------
const itemSchema = z.object({
  name: z.string(),
  value: z.string().optional(),
  description: z.string().optional(),
  examples: z.array(z.string()).optional(),
  icon: z.string().optional(),
  citations: z.array(z.string()).optional(),
});

// Schema for table data
const tableSchema = z.object({
  caption: z.string().optional(),
  headers: z.array(z.string()),
  rows: z.array(z.array(z.string())),
});

// Schema for callout blocks
const calloutSchema = z.object({
  type: z.enum(['info', 'warning', 'tip', 'error']),
  title: z.string().optional(),
  text: z.string(),
});

// Schema for comparison blocks (side-by-side columns)
const comparisonSchema = z.object({
  items: z.array(z.object({
    title: z.string(),
    points: z.array(z.string()),
    variant: z.enum(['default', 'success', 'warning', 'danger']).optional(),
  })),
});

// Schema for crystal demo blocks
const crystalSchema = z.object({
  cdl: z.string(),
  caption: z.string().optional(),
  interactive: z.boolean().optional(),
});

// Schema for image blocks
const imageSchema = z.object({
  src: z.string(),
  alt: z.string(),
  caption: z.string().optional(),
});

// Schema for subsections (nested H3 content)
const subsectionSchema = z.object({
  title: z.string(),
  content: z.string().optional(),
  items: z.array(itemSchema).optional(),
  table: tableSchema.optional(),
});

// Main section schema
const sectionSchema = z.object({
  title: z.string(),
  id: z.string().optional(),
  content: z.string().optional(),
  callout: calloutSchema.optional(),
  items: z.array(itemSchema).optional(),
  table: tableSchema.optional(),
  comparison: comparisonSchema.optional(),
  crystal: crystalSchema.optional(),
  image: imageSchema.optional(),
  subsections: z.array(subsectionSchema).optional(),
  citations: z.array(z.string()).optional(),
});

// ----------------------------------------------------------------------
// Questions collection (study v1)
// ----------------------------------------------------------------------
// See V1-PLAN.md §4.1. Track T4 owns expansions to this schema; other tracks
// must not alter it without orchestrator coordination.

const questionOptionSchema = z.object({
  text: z.string().min(1),
  isCorrect: z.boolean(),
  rationale: z.string().optional(),
});

const questionsCollection = defineCollection({
  type: 'data',
  schema: z
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
    ),
});

// Learn collection schema
const learnCollection = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number(),
    category: z.enum([
      'fundamentals',  // Core science: crystallography, properties, chemistry
      'equipment',     // All testing instruments & techniques
      'species',       // Gem families and individual species
      'identification', // Identification methods: inclusions, synthetics, treatments
      'phenomena',     // Optical phenomena (star, cat's eye, etc.)
      'origin',        // Geographic origin determination
      'market',        // Grading, valuation, professional practice
      'care',          // Durability, cleaning, storage, settings
    ]),
    subcategory: z.string().optional(),  // Groups related files (e.g., "inclusions")
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    icon: z.string().optional(),
    related: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    author: z.string().optional(),
    reviewedBy: z.string().optional(),
    reviewedAt: z.string().optional(),
    publishedAt: z.string().optional(),
    references: z.array(referenceSchema).optional(),
    sections: z.array(sectionSchema),
  }),
});

export const collections = {
  learn: learnCollection,
  questions: questionsCollection,
};
