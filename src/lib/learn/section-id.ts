/**
 * Shared section-id slug derivation for learn articles.
 *
 * Single source of truth for how a section's DOM id is computed, so that
 * anchors built anywhere else (e.g. the table-of-contents rail) always match
 * the ids SectionRenderer.astro actually renders. An explicit `section.id`
 * (set in the YAML source) always wins; otherwise the title is slugified.
 */

export interface SectionLike {
  id?: string;
  title: string;
}

/** Derive the DOM id used for a learn-article section's `<section>` element. */
export function sectionSlug(section: SectionLike): string {
  if (section.id) return section.id;
  return section.title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}
