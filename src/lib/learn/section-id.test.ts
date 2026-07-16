import { describe, it, expect } from 'vitest';
import { sectionSlug } from './section-id';

describe('sectionSlug', () => {
  it('passes an explicit id through unchanged', () => {
    expect(sectionSlug({ id: 'custom-id', title: 'Ignored Title' })).toBe('custom-id');
  });

  it('slugifies a plain title to lowercase-with-hyphens', () => {
    expect(sectionSlug({ title: 'Crystal Systems' })).toBe('crystal-systems');
  });

  it('strips special characters not in [a-z0-9-]', () => {
    expect(sectionSlug({ title: "Gübelin's Notes (2020)!" })).toBe('gbelins-notes-2020');
  });

  it('collapses runs of whitespace into a single hyphen', () => {
    expect(sectionSlug({ title: '  Multiple   Spaces   Here  ' })).toBe('-multiple-spaces-here-');
  });
});
