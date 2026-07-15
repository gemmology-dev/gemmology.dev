import { describe, it, expect } from 'vitest';
import {
  serializeQuizState,
  deserializeQuizState,
  type QuizState,
  type SerializedQuizState,
  type Question,
} from './question-types';

function makeQuestion(id: string): Question {
  return {
    id,
    type: 'multiple-choice',
    difficulty: 'beginner',
    category: 'fundamentals',
    topic: 'crystal-systems',
    questionText: `Question ${id}?`,
    options: ['A', 'B', 'C'],
    correctAnswer: 'A',
  };
}

describe('serializeQuizState / deserializeQuizState', () => {
  it('round-trips a state with skippedQuestions', () => {
    const state: QuizState = {
      questions: [makeQuestion('q1'), makeQuestion('q2')],
      currentIndex: 1,
      answers: new Map([['q1', 'A']]),
      startTime: 1000,
      endTime: 2000,
      flaggedQuestions: new Set(['q2']),
      submitted: true,
      skippedQuestions: new Set(['q2']),
    };

    const serialized = serializeQuizState(state);
    expect(serialized.skippedQuestions).toEqual(['q2']);

    const roundTripped = deserializeQuizState(serialized);
    expect(roundTripped.skippedQuestions).toEqual(new Set(['q2']));
    expect(roundTripped.answers).toEqual(new Map([['q1', 'A']]));
    expect(roundTripped.flaggedQuestions).toEqual(new Set(['q2']));
    expect(roundTripped.submitted).toBe(true);
  });

  it('defaults skippedQuestions to an empty Set for pre-v1 localStorage blobs', () => {
    // Hand-written old-shape fixture: no `skippedQuestions` key at all,
    // matching what was persisted before Study v1 shipped this field.
    const legacyBlob = {
      questions: [makeQuestion('q1')],
      currentIndex: 0,
      answers: [['q1', 'A']],
      startTime: 1000,
      flaggedQuestions: [],
      submitted: false,
      // no skippedQuestions field
    } as unknown as SerializedQuizState;

    expect(() => deserializeQuizState(legacyBlob)).not.toThrow();

    const state = deserializeQuizState(legacyBlob);
    expect(state.skippedQuestions).toEqual(new Set());
    expect(state.questions).toHaveLength(1);
    expect(state.answers.get('q1')).toBe('A');
  });
});
