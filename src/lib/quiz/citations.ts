/**
 * Citation helpers for question rationales.
 *
 * Curated question rationales contain inline citation markers like
 * `[ref:read-gemmology-3e]` that were never resolved to links. They snag
 * the eye mid-sentence. We strip them at render time and surface a single
 * "Sources" footer line per rationale instead.
 *
 * If a slug isn't in the map, it's still extracted but rendered as the raw
 * slug — better than dropping a real citation silently.
 */

export const CITATION_LABELS: Record<string, string> = {
  'read-gemmology-3e': 'Read, Gemmology (3rd ed.)',
  'anderson-gem-testing': 'Anderson, Gem Testing',
  'gubelin-koivula-vol1': 'Gübelin & Koivula, Photoatlas vol. 1',
  'gubelin-koivula-vol3': 'Gübelin & Koivula, Photoatlas vol. 3',
};

const REF_PATTERN = /\s*\[ref:([^\]]+)\]/g;

/**
 * Remove `[ref:...]` markers from a rationale string and tidy whitespace.
 * Preserves all surrounding punctuation and spacing as the reader expects it.
 */
export function stripCitations(text: string): string {
  if (!text) return text;
  return text
    .replace(REF_PATTERN, '')
    // Collapse double spaces a removed citation may have left behind.
    .replace(/ {2,}/g, ' ')
    // Tighten cases where the citation sat just before a period or comma.
    .replace(/ ([.,;:!?])/g, '$1')
    .trim();
}

/**
 * Return unique citation slugs found in a rationale string, in order of
 * first appearance. Returns an empty array for empty input.
 */
export function extractCitations(text: string): string[] {
  if (!text) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const match of text.matchAll(/\[ref:([^\]]+)\]/g)) {
    const slug = match[1].trim();
    if (slug && !seen.has(slug)) {
      seen.add(slug);
      out.push(slug);
    }
  }
  return out;
}

/**
 * Merge citations from many rationale strings into a single deduped list,
 * preserving first-seen order across the inputs.
 */
export function collectCitations(...texts: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of texts) {
    if (!t) continue;
    for (const slug of extractCitations(t)) {
      if (!seen.has(slug)) {
        seen.add(slug);
        out.push(slug);
      }
    }
  }
  return out;
}

/** Resolve a citation slug to a human label, falling back to the slug itself. */
export function citationLabel(slug: string): string {
  return CITATION_LABELS[slug] ?? slug;
}
