import { defineCollection, z } from 'astro:content';

// Schema for items within sections (property cards, definition lists)
const itemSchema = z.object({
  name: z.string(),
  value: z.string().optional(),
  description: z.string().optional(),
  examples: z.array(z.string()).optional(),
  icon: z.string().optional(),
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
});

// Learn collection schema
const learnCollection = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number(),
    category: z.enum(['fundamentals', 'identification', 'advanced']),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    icon: z.string().optional(),
    related: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    sections: z.array(sectionSchema),
  }),
});

export const collections = {
  learn: learnCollection,
};
