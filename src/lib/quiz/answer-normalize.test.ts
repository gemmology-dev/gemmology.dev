import { describe, it, expect } from 'vitest';
import { normalizeAnswer } from './answer-normalize';

describe('normalizeAnswer', () => {
  it('trims leading/trailing whitespace', () => {
    expect(normalizeAnswer('  ruby  ')).toBe('ruby');
  });

  it('lowercases the value', () => {
    expect(normalizeAnswer('Ruby')).toBe('ruby');
    expect(normalizeAnswer('RUBY')).toBe('ruby');
  });

  it('collapses internal whitespace runs to a single space', () => {
    expect(normalizeAnswer('star   sapphire')).toBe('star sapphire');
    expect(normalizeAnswer('star\tsapphire')).toBe('star sapphire');
    expect(normalizeAnswer('  star   sapphire  ')).toBe('star sapphire');
  });

  it('strips combining diacritics after NFKD decomposition', () => {
    expect(normalizeAnswer('café')).toBe('cafe');
    expect(normalizeAnswer('naïve')).toBe('naive');
    expect(normalizeAnswer('crème')).toBe('creme');
  });

  it('treats accented and unaccented forms as equal', () => {
    expect(normalizeAnswer('café')).toBe(normalizeAnswer('cafe'));
  });

  it('does not perform numeric-word equivalence (documented non-goal)', () => {
    expect(normalizeAnswer('10')).not.toBe(normalizeAnswer('ten'));
  });

  it('combines all rules together', () => {
    expect(normalizeAnswer('  Crème   Brûlée  ')).toBe('creme brulee');
  });
});
