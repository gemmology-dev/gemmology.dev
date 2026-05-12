/**
 * Citation index builder for /learn/ pages.
 *
 * Scans every prose string in a learn article's sections for {cite:id} markers
 * and section/item-level citations arrays. Assigns sequential citation numbers
 * in first-appearance order across the entire page (not per-section).
 *
 * The index is built once in [...slug].astro frontmatter and passed as a prop
 * into the renderer chain so all components share the same numbering.
 */

import type { ReferenceEntry } from '../../content/config';

export type { ReferenceEntry };

export interface CitationRef {
  /** The stable YAML-defined id slug (e.g. "read-3rd"). */
  id: string;
  /** Order of first appearance across the page, 1-based. */
  n: number;
  /** The full reference record from the YAML references array. */
  ref: ReferenceEntry;
}

export type CitationIndex = Map<string, CitationRef>;

/** Regex that matches {cite:some-id} markers in prose strings. */
const CITE_PATTERN = /\{cite:([a-z0-9][a-z0-9-]*)\}/g;

interface SectionLike {
  content?: string;
  callout?: { text?: string };
  citations?: string[];
  items?: Array<{
    description?: string;
    citations?: string[];
  }>;
  table?: {
    rows?: string[][];
  };
  subsections?: Array<{
    content?: string;
    items?: Array<{
      description?: string;
      citations?: string[];
    }>;
    table?: {
      rows?: string[][];
    };
  }>;
}

/**
 * Build a CitationIndex from a learn article's sections and references array.
 *
 * Silently skips any {cite:id} marker whose id is not present in the
 * references array — this prevents build errors when content editing is
 * in progress. A dangling cite produces no output in the renderer either.
 *
 * Wrapped in a try/catch at call sites so that a malformed YAML references
 * block cannot 404 a page.
 */
export function buildCitationIndex(
  sections: SectionLike[],
  references: ReferenceEntry[] = [],
): CitationIndex {
  const refMap = new Map(references.map((r) => [r.id, r]));
  const index: CitationIndex = new Map();
  let counter = 1;

  function register(id: string): void {
    if (index.has(id)) return;
    const ref = refMap.get(id);
    if (!ref) return; // dangling id — silently skip
    index.set(id, { id, n: counter++, ref });
  }

  for (const section of sections) {
    // Inline markers in prose content
    for (const match of (section.content ?? '').matchAll(CITE_PATTERN)) {
      register(match[1]);
    }
    // Callout prose
    for (const match of (section.callout?.text ?? '').matchAll(CITE_PATTERN)) {
      register(match[1]);
    }
    // Section-level citations array
    for (const id of section.citations ?? []) register(id);
    // Items
    for (const item of section.items ?? []) {
      for (const id of item.citations ?? []) register(id);
      for (const match of (item.description ?? '').matchAll(CITE_PATTERN)) {
        register(match[1]);
      }
    }
    // Table cells
    for (const row of section.table?.rows ?? []) {
      for (const cell of row) {
        for (const match of cell.matchAll(CITE_PATTERN)) {
          register(match[1]);
        }
      }
    }
    // Subsections (one level deep — the schema does not nest deeper)
    for (const sub of section.subsections ?? []) {
      for (const match of (sub.content ?? '').matchAll(CITE_PATTERN)) {
        register(match[1]);
      }
      for (const item of sub.items ?? []) {
        for (const id of item.citations ?? []) register(id);
        for (const match of (item.description ?? '').matchAll(CITE_PATTERN)) {
          register(match[1]);
        }
      }
      for (const row of sub.table?.rows ?? []) {
        for (const cell of row) {
          for (const match of cell.matchAll(CITE_PATTERN)) {
            register(match[1]);
          }
        }
      }
    }
  }

  return index;
}

/**
 * Return a short "Author, Year" label suitable for aria-label attributes.
 * Uses the first author's family name; falls back to the title excerpt.
 */
export function formatCiteLabel(ref: ReferenceEntry): string {
  const authors = 'authors' in ref && ref.authors ? ref.authors : [];
  const firstAuthor = authors[0]?.family ?? ref.title.slice(0, 30);
  return `${firstAuthor}, ${ref.year ?? 'n.d.'}`;
}

/**
 * Replace {cite:id} markers in an already-rendered HTML string with
 * accessible <sup> citation links that point to the reference list.
 *
 * Must run AFTER marked.parse() so Markdown does not escape the output,
 * and BEFORE the HTML is passed to set:html in the template.
 */
export function resolveCiteMarkers(html: string, index: CitationIndex): string {
  return html.replace(CITE_PATTERN, (_, id: string) => {
    const entry = index.get(id);
    if (!entry) return ''; // dangling ref — render nothing
    const label = formatCiteLabel(entry.ref);
    return (
      `<sup>` +
      `<a class="citation-ref" ` +
      `id="citeref-${id}-${entry.n}" ` +
      `href="#cite-${id}" ` +
      `aria-label="Reference ${entry.n}: ${label}" ` +
      `data-cite-id="${id}"` +
      `>[${entry.n}]</a>` +
      `</sup>`
    );
  });
}
