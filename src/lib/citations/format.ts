/**
 * Shared citation-formatting utilities used by:
 *   - src/components/learn/References.astro   (per-article reference list)
 *   - src/pages/about/sources/index.astro      (aggregate bibliography page)
 *
 * All functions return plain strings; the anchor tags use HTML attribute
 * syntax that is safe to pass to set:html in Astro templates.
 */

import type { ReferenceEntry } from '../../content/config';

export type { ReferenceEntry };

// ── Author formatting ────────────────────────────────────────────────────────

/**
 * Format an author list as "Family, G.; Family2, G2." --
 * single-initial given names; returns empty string when authors is absent.
 */
export function formatAuthors(
  authors: Array<{ family: string; given?: string }> | undefined,
): string {
  if (!authors || authors.length === 0) return '';
  return authors
    .map((a) => (a.given ? `${a.family}, ${a.given[0]}.` : a.family))
    .join('; ');
}

// ── Link helpers ─────────────────────────────────────────────────────────────

/**
 * Build a DOI anchor. DOIs contain no HTML special characters so the
 * string is already safe for set:html.
 */
export function doiLink(doi: string): string {
  return (
    `DOI: <a href="https://doi.org/${doi}" ` +
    `rel="external noopener noreferrer">${doi}</a>`
  );
}

/** Build an ISBN WorldCat anchor. */
export function isbnLink(isbn: string): string {
  const bare = isbn.replace(/-/g, '');
  return (
    `ISBN: <a href="https://www.worldcat.org/isbn/${bare}" ` +
    `rel="external noopener noreferrer">${isbn}</a>`
  );
}

/** Build a plain URL anchor. */
export function urlLink(url: string, label?: string): string {
  const text = label ?? url;
  return `<a href="${url}" rel="external noopener noreferrer">${text}</a>`;
}

// ── Full reference formatter ─────────────────────────────────────────────────

/** Format a full reference entry as an HTML string suitable for set:html. */
export function formatReference(ref: ReferenceEntry): string {
  switch (ref.kind) {
    case 'book': {
      const authors = formatAuthors(ref.authors);
      const edition = ref.edition ? ` (${ref.edition} ed.)` : '';
      const pub = ref.publisher ? ` ${ref.publisher}.` : '';
      const isbn = ref.isbn ? ` ${isbnLink(ref.isbn)}.` : '';
      const doi = ref.doi ? ` ${doiLink(ref.doi)}.` : '';
      return `${authors} (${ref.year}). <cite>${ref.title}</cite>${edition}.${pub}${isbn}${doi}`;
    }
    case 'journal': {
      const authors = formatAuthors(ref.authors);
      const vol = ref.volume != null ? `, ${ref.volume}` : '';
      const iss = ref.issue != null ? `(${ref.issue})` : '';
      const pages = ref.pages ? `, ${ref.pages}` : '';
      const doi = ref.doi ? `. ${doiLink(ref.doi)}` : '';
      const url = !ref.doi && ref.url ? `. ${urlLink(ref.url)}` : '';
      return (
        `${authors} (${ref.year}). ${ref.title}. ` +
        `<cite>${ref.journal}</cite>${vol}${iss}${pages}${doi}${url}.`
      );
    }
    case 'web': {
      const authors = formatAuthors(ref.authors ?? []);
      const year = ref.year ? `(${ref.year})` : '(n.d.)';
      const pub = ref.publisher ? ` ${ref.publisher}.` : '';
      const accessed = ref.accessed ? ` Retrieved ${ref.accessed}, from` : '';
      const link = ref.url ? ` ${urlLink(ref.url)}` : '';
      return `${authors} ${year}. <cite>${ref.title}</cite>.${pub}${accessed}${link}`;
    }
    case 'standard': {
      const org =
        ref.organization ??
        formatAuthors(ref.authors ?? []) ??
        (ref.publisher ?? '');
      const pub = ref.publisher && ref.publisher !== org ? ` ${ref.publisher}.` : '';
      const id = ref.identifier ? ` ${ref.identifier}.` : '';
      const url = ref.url ? ` ${urlLink(ref.url)}.` : '';
      return `${org} (${ref.year}). <cite>${ref.title}</cite>.${id}${pub}${url}`;
    }
  }
}

// ── Sort helpers ─────────────────────────────────────────────────────────────

/** Primary sort key: first author family name (case-insensitive). */
export function sortKeyAuthor(ref: ReferenceEntry): string {
  const authors =
    'authors' in ref && ref.authors && ref.authors.length > 0
      ? ref.authors
      : undefined;
  const org = 'organization' in ref ? (ref.organization ?? '') : '';
  return (authors?.[0]?.family ?? org ?? ref.title).toLowerCase();
}

/** Secondary sort key: year (treat missing/undefined as 0). */
export function sortKeyYear(ref: ReferenceEntry): number {
  return ref.year ?? 0;
}
