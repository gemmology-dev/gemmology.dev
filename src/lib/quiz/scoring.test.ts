import { describe, it, expect } from 'vitest';
import { calculateResults, getWrongAnswerStats } from './scoring';
import type { Question, QuizConfig, QuizState } from './question-types';

function makeQuestion(id: string, overrides: Partial<Question> = {}): Question {
  return {
    id,
    type: 'multiple-choice',
    difficulty: 'beginner',
    category: 'fundamentals',
    topic: 'crystal-systems',
    questionText: `Question ${id}?`,
    options: ['A', 'B', 'C'],
    correctAnswer: 'A',
    ...overrides,
  };
}

function makeConfig(): QuizConfig {
  return {
    categories: ['fundamentals'],
    questionCount: 3,
    shuffleQuestions: false,
    shuffleOptions: false,
    mode: 'practice',
  };
}

function makeState(overrides: Partial<QuizState> = {}): QuizState {
  return {
    questions: [makeQuestion('q1'), makeQuestion('q2'), makeQuestion('q3')],
    currentIndex: 0,
    answers: new Map([
      ['q1', 'A'],
      ['q2', 'B'],
      ['q3', 'A'],
    ]),
    startTime: 1000,
    endTime: 2000,
    flaggedQuestions: new Set(),
    submitted: true,
    skippedQuestions: new Set(),
    ...overrides,
  };
}

describe('calculateResults', () => {
  it('with zero skips, produces the same score/percentage/totalQuestions as before skip support existed', () => {
    const state = makeState();
    const result = calculateResults(state, makeConfig());

    // q1: A === A correct, q2: B !== A incorrect, q3: A === A correct => 2/3
    expect(result.totalQuestions).toBe(3);
    expect(result.score).toBe(2);
    expect(result.percentage).toBe(67);
    expect(result.results).toHaveLength(3);
    expect(result.results.every(r => r.skipped === false)).toBe(true);
    expect(result.breakdown).toEqual([
      { category: 'fundamentals', correct: 2, total: 3, percentage: 67 },
    ]);
  });

  it('excludes skipped questions from totalQuestions/percentage but keeps them in results', () => {
    const state = makeState({ skippedQuestions: new Set(['q2']) });
    const result = calculateResults(state, makeConfig());

    // q2 is skipped: only q1 (correct) and q3 (correct) are scored => 2/2 = 100%
    expect(result.totalQuestions).toBe(2);
    expect(result.score).toBe(2);
    expect(result.percentage).toBe(100);
    expect(result.results).toHaveLength(3);

    const q2Result = result.results.find(r => r.question.id === 'q2');
    expect(q2Result?.skipped).toBe(true);
    expect(q2Result?.isCorrect).toBe(false);

    expect(result.breakdown).toEqual([
      { category: 'fundamentals', correct: 2, total: 2, percentage: 100 },
    ]);
  });

  it('does not count skipped questions as wrong answers', () => {
    const state = makeState({
      answers: new Map([
        ['q1', 'A'],
        ['q2', 'B'],
      ]),
      skippedQuestions: new Set(['q2']),
    });
    const result = calculateResults(state, makeConfig());
    const stats = getWrongAnswerStats(result.results);

    // q3 unanswered => wrong; q2 skipped => excluded even though its answer was wrong.
    expect(stats.categories.get('fundamentals')).toBe(1);
  });
});
