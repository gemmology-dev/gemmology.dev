# Authoring Learn Content — Fact-Grammar Convention

> **Diataxis type:** How-to — a short authoring convention for anyone writing or
> editing `src/content/learn/**/*.yaml`.
>
> **Audience:** contributors editing learn article YAML. Assumes familiarity
> with the section/subsection shape documented inline in
> `src/content/config.ts` (`sectionSchema`, `subsectionSchema`, `itemSchema`,
> `tableSchema`).

## Why this doc exists

A learn section can present a set of name/value facts three different ways:

1. `items:` — rendered as a definition list by `PropertyList.astro`.
2. `table:` — rendered as a real `<table>` by `DataTable.astro`.
3. Plain markdown bullets inside `content:` (`- **Name**: value`) — rendered
   through `marked` into a generic `.prose ul` list.

All three exist for good reasons, but before the learn-rendering P2 pass they
diverged more than the underlying data warranted: the same kind of fact
(a short name paired with a value or one-line description) could show up as a
bordered icon-card in one article and a plain bulleted line in the next, with
no content-driven reason for the difference. `PropertyList.astro` now renders
as a single-column definition list (divider between rows, no card) so it
reads as the same grammar as a markdown bullet list — the guidance below is
about **which one to reach for**, so that convergence doesn't erode again as
new content is authored.

## Decision guide

| Use | When | Example |
|---|---|---|
| `items:` | A short, scannable set of **name → value/description** facts that benefit from an icon, a monospace value chip, example-gem badges, or an item-level citation. Still fundamentally one fact per row. | Crystal axes/angles/point-groups; a species' key properties (RI, SG, hardness) |
| `table:` | Data that is **genuinely tabular** — more than one value column per row, or rows that only make sense read across multiple headers. | Origin comparison (origin × characteristics × market position); the 32 point groups (system × H-M symbol × type × gem example) |
| Plain markdown bullets in `content:` | Prose-adjacent facts that are part of the surrounding explanation, don't need a citation cluster or example badges, and read naturally as a sentence fragment after the term (`**Term**: explanation`). Also the right choice for anything that isn't a flat fact list at all (steps, caveats, a short aside). | "Distinction from cleavage" (two bullet definitions inside a paragraph of prose); a numbered/ordered explanation |

**Rule of thumb:** if you find yourself writing `- **Name**: value` bullets
for *more than 3-4 items*, or the facts would benefit from per-item
citations, example badges, or a CDL/monospace value, move them to `items:`
instead — that's what the schema and renderer are for. Conversely, don't
reach for `items:` for a single aside fact buried in a paragraph; leave it as
prose.

**Don't use `table:` for simple name/value pairs** just because it looks more
official — a two-column table where the second column is always a single
short value is exactly what `items:` is for. Reserve `table:` for data with a
genuine multi-column shape (three or more meaningful columns, or where a
reader needs to scan a column across rows, not just read row-by-row).

## What NOT to do

- Don't hand-author HTML tables or definition lists inside `content:` — use
  `table:` / `items:` so citation markers (`{cite:id}`), mineral auto-linking,
  and dark-mode styling are applied consistently by the renderers.
- Don't mix redundant grammars in one section (e.g. an `items:` block that
  repeats the same facts as a `table:` in the same section) — pick one.
- Don't add `icon:` per item expecting a distinct icon per fact; icons are
  looked up heuristically by name (`getIconForProperty` in
  `src/components/learn/icons.ts`) and are decorative, not a content field to
  fine-tune per item.

## Where this is implemented

- `src/components/learn/PropertyList.astro` — `items:` renderer (dl/dt/dd)
- `src/components/learn/DataTable.astro` — `table:` renderer
- `src/components/learn/SectionRenderer.astro` — renders `content:` markdown
  through `marked`, and dispatches `items:`/`table:` to the two components
  above
- `src/styles/global.css` (`.prose ul`, `.prose table`) plus
  `tailwind.config.mjs` (`typography.extend`) — the shared markdown-bullet
  and markdown-table styling
- `src/content/config.ts` — `itemSchema` / `tableSchema` / `sectionSchema` /
  `subsectionSchema` — the Zod schema all three grammars validate against
