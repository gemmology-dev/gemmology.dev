import { describe, it, expect } from 'vitest';
import { selectQuestions, checkAnswer } from './question-generator';
import type { Question, QuizConfig } from './question-types';

function makeQuestion(overrides: Partial<Question>): Question {
  return {
    id: 'q1',
    type: 'multiple-choice',
    difficulty: 'beginner',
    category: 'fundamentals',
    topic: 'crystal-systems',
    questionText: 'Sample?',
    options: ['A', 'B', 'C'],
    correctAnswer: 'A',
    ...overrides,
  };
}

function makeConfig(overrides: Partial<QuizConfig> = {}): QuizConfig {
  return {
    categories: ['fundamentals'],
    questionCount: 10,
    shuffleQuestions: false,
    shuffleOptions: false,
    mode: 'practice',
    ...overrides,
  };
}

describe('selectQuestions', () => {
  it('filters out structurally unrenderable questions before selecting', () => {
    const good = makeQuestion({ id: 'good', options: ['A', 'B'] });
    const badMcq = makeQuestion({ id: 'bad-mcq', options: ['A'] });
    const badMatching = makeQuestion({
      id: 'bad-matching',
      type: 'matching',
      matchingPairs: [{ left: 'a', right: '1' }],
      correctAnswer: ['a:1'],
    });

    const result = selectQuestions([good, badMcq, badMatching], makeConfig({ questionCount: 10 }));

    expect(result.map(q => q.id)).toEqual(['good']);
  });

  it('respects category and questionCount filters', () => {
    const q1 = makeQuestion({ id: 'q1', category: 'fundamentals' });
    const q2 = makeQuestion({ id: 'q2', category: 'equipment' });
    const q3 = makeQuestion({ id: 'q3', category: 'fundamentals' });

    const result = selectQuestions(
      [q1, q2, q3],
      makeConfig({ categories: ['fundamentals'], questionCount: 1 })
    );

    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('fundamentals');
  });
});

describe('checkAnswer', () => {
  it('matches a simple string answer case-insensitively, trimmed', () => {
    const q = makeQuestion({ correctAnswer: 'Garnet' });
    expect(checkAnswer(q, '  garnet  ')).toBe(true);
    expect(checkAnswer(q, 'topaz')).toBe(false);
  });

  it('matches fill-blank questions with an array of accepted answers', () => {
    const q = makeQuestion({ type: 'fill-blank', correctAnswer: ['ruby', 'sapphire'] });
    expect(checkAnswer(q, 'Sapphire')).toBe(true);
    expect(checkAnswer(q, 'emerald')).toBe(false);
  });

  it('matches matching questions by unordered pair-array comparison', () => {
    const q = makeQuestion({
      type: 'matching',
      matchingPairs: [
        { left: 'a', right: '1' },
        { left: 'b', right: '2' },
      ],
      correctAnswer: ['a:1', 'b:2'],
    });
    expect(checkAnswer(q, ['b:2', 'a:1'])).toBe(true);
    expect(checkAnswer(q, ['a:1'])).toBe(false);
    expect(checkAnswer(q, ['a:2', 'b:1'])).toBe(false);
  });

  it('returns false for mismatched answer shapes', () => {
    const q = makeQuestion({ correctAnswer: 'A' });
    expect(checkAnswer(q, ['A'])).toBe(false);
  });
});
