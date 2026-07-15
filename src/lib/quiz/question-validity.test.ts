import { describe, it, expect } from 'vitest';
import { isRenderable } from './question-validity';
import type { Question } from './question-types';

function base(overrides: Partial<Question>): Question {
  return {
    id: 'q1',
    type: 'multiple-choice',
    difficulty: 'beginner',
    category: 'fundamentals',
    topic: 'crystal-systems',
    questionText: 'Sample?',
    correctAnswer: 'A',
    ...overrides,
  };
}

describe('isRenderable', () => {
  it('accepts multiple-choice with 2+ options', () => {
    expect(isRenderable(base({ type: 'multiple-choice', options: ['A', 'B'] }))).toBe(true);
  });

  it('rejects multiple-choice with fewer than 2 options', () => {
    expect(isRenderable(base({ type: 'multiple-choice', options: ['A'] }))).toBe(false);
    expect(isRenderable(base({ type: 'multiple-choice', options: undefined }))).toBe(false);
  });

  it('accepts true-false with 2 options', () => {
    expect(isRenderable(base({ type: 'true-false', options: ['True', 'False'] }))).toBe(true);
  });

  it('accepts fill-blank with a non-empty string answer', () => {
    expect(isRenderable(base({ type: 'fill-blank', correctAnswer: 'garnet' }))).toBe(true);
  });

  it('rejects fill-blank with an empty string answer', () => {
    expect(isRenderable(base({ type: 'fill-blank', correctAnswer: '   ' }))).toBe(false);
  });

  it('accepts fill-blank with a non-empty array of answers', () => {
    expect(isRenderable(base({ type: 'fill-blank', correctAnswer: ['a', 'b'] }))).toBe(true);
  });

  it('rejects fill-blank with an empty array', () => {
    expect(isRenderable(base({ type: 'fill-blank', correctAnswer: [] }))).toBe(false);
  });

  it('accepts matching with 2+ pairs', () => {
    expect(
      isRenderable(
        base({
          type: 'matching',
          matchingPairs: [
            { left: 'a', right: '1' },
            { left: 'b', right: '2' },
          ],
        })
      )
    ).toBe(true);
  });

  it('rejects matching with fewer than 2 pairs', () => {
    expect(
      isRenderable(base({ type: 'matching', matchingPairs: [{ left: 'a', right: '1' }] }))
    ).toBe(false);
    expect(isRenderable(base({ type: 'matching', matchingPairs: undefined }))).toBe(false);
  });
});
