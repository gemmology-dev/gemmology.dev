import { describe, it, expect } from 'vitest';
import {
  stripCitations,
  extractCitations,
  collectCitations,
  citationLabel,
  CITATION_LABELS,
} from './citations';

describe('stripCitations', () => {
  it('removes a single citation marker without leaving stray spaces', () => {
    const input =
      'Tourmaline is trigonal [ref:read-gemmology-3e]. The 3̄ axis is distinct.';
    expect(stripCitations(input)).toBe(
      'Tourmaline is trigonal. The 3̄ axis is distinct.',
    );
  });

  it('removes multiple distinct citations from one paragraph', () => {
    const input =
      'Asterism arises from oriented inclusions [ref:gubelin-koivula-vol1] of rutile in corundum [ref:anderson-gem-testing].';
    const out = stripCitations(input);
    expect(out).not.toMatch(/\[ref:/);
    expect(out).toBe('Asterism arises from oriented inclusions of rutile in corundum.');
  });

  it('collapses double spaces left between words', () => {
    const input = 'word [ref:slug] word';
    expect(stripCitations(input)).toBe('word word');
  });

  it('handles empty input gracefully', () => {
    expect(stripCitations('')).toBe('');
  });

  it('leaves text unchanged when no citation markers are present', () => {
    const input = 'A plain sentence with no refs.';
    expect(stripCitations(input)).toBe(input);
  });

  it('preserves brackets that are not citation markers', () => {
    const input = 'See figure [3] for the optic figure [ref:read-gemmology-3e].';
    expect(stripCitations(input)).toBe('See figure [3] for the optic figure.');
  });
});

describe('extractCitations', () => {
  it('returns unique slugs in order of first appearance', () => {
    const input =
      'A [ref:read-gemmology-3e] B [ref:anderson-gem-testing] C [ref:read-gemmology-3e] D';
    expect(extractCitations(input)).toEqual([
      'read-gemmology-3e',
      'anderson-gem-testing',
    ]);
  });

  it('returns an empty array for empty or no-citation input', () => {
    expect(extractCitations('')).toEqual([]);
    expect(extractCitations('Plain text.')).toEqual([]);
  });
});

describe('collectCitations', () => {
  it('merges multiple inputs and dedupes preserving first-seen order', () => {
    const a = 'one [ref:read-gemmology-3e] two';
    const b = 'three [ref:gubelin-koivula-vol1] four [ref:read-gemmology-3e] five';
    expect(collectCitations(a, b)).toEqual([
      'read-gemmology-3e',
      'gubelin-koivula-vol1',
    ]);
  });

  it('skips undefined or empty entries', () => {
    expect(collectCitations(undefined, '', 'x [ref:anderson-gem-testing] y')).toEqual([
      'anderson-gem-testing',
    ]);
  });
});

describe('citationLabel', () => {
  it('resolves known slugs to their human label', () => {
    expect(citationLabel('read-gemmology-3e')).toBe(CITATION_LABELS['read-gemmology-3e']);
    expect(citationLabel('gubelin-koivula-vol1')).toBe(
      CITATION_LABELS['gubelin-koivula-vol1'],
    );
  });

  it('falls back to the slug itself for unknown citations', () => {
    expect(citationLabel('some-unknown-slug')).toBe('some-unknown-slug');
  });
});
