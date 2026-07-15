import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { Question, QuizConfig } from '../lib/quiz';

// ── Mock the study store singleton so SM-2 wiring is observable. ───────────
const mockStore = {
  appendResponse: vi.fn().mockResolvedValue(undefined),
  getResponsesFor: vi.fn().mockResolvedValue([]),
  getRecentResponses: vi.fn().mockResolvedValue([]),
  getSchedule: vi.fn().mockResolvedValue(null),
  updateSchedule: vi.fn().mockResolvedValue(undefined),
  getDueItems: vi.fn().mockResolvedValue([]),
  getProgress: vi.fn().mockResolvedValue({
    completedTopics: {
      fundamentals: [], equipment: [], species: [], identification: [],
      phenomena: [], origin: [], market: [], care: [],
    },
    bestScores: {
      fundamentals: 0, equipment: 0, species: 0, identification: 0,
      phenomena: 0, origin: 0, market: 0, care: 0,
    },
    totalQuizzes: 0,
    totalCorrect: 0,
    totalAttempted: 0,
    lastActivity: 0,
  }),
  updateProgress: vi.fn().mockResolvedValue(undefined),
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
  exportAll: vi.fn(),
  importAll: vi.fn(),
};

vi.mock('../lib/quiz/store', () => ({
  getStudyStore: () => mockStore,
}));

const { useExam } = await import('./useExam');

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'q1',
    type: 'multiple-choice',
    difficulty: 'beginner',
    category: 'fundamentals',
    topic: 'crystal-systems',
    questionText: 'Which system has three equal axes at 90 degrees?',
    options: ['Cubic', 'Trigonal', 'Monoclinic'],
    correctAnswer: 'Cubic',
    ...overrides,
  };
}

function makeConfig(overrides: Partial<QuizConfig> = {}): QuizConfig {
  return {
    categories: ['fundamentals'],
    questionCount: 1,
    shuffleQuestions: false,
    shuffleOptions: false,
    mode: 'exam',
    ...overrides,
  };
}

beforeEach(() => {
  window.localStorage.clear();
  vi.clearAllMocks();
  mockStore.appendResponse.mockResolvedValue(undefined);
  mockStore.getSchedule.mockResolvedValue(null);
  mockStore.updateSchedule.mockResolvedValue(undefined);
});

describe('useExam — SM-2 wiring (A4a)', () => {
  it('submitExam updates the schedule for every answered question', async () => {
    const q1 = makeQuestion({ id: 'q1', correctAnswer: 'Cubic' });
    const q2 = makeQuestion({ id: 'q2', correctAnswer: 'Trigonal' });

    const { result } = renderHook(() =>
      useExam({ config: makeConfig(), questions: [q1, q2], timeLimit: 600, autoSubmitOnTimeout: false })
    );

    act(() => {
      result.current.selectAnswer('Cubic'); // q1, correct
    });
    act(() => {
      result.current.nextQuestion();
    });
    act(() => {
      result.current.selectAnswer('Monoclinic'); // q2, incorrect
    });

    act(() => {
      result.current.submitExam(new Map([
        ['q1', 'certain'],
        ['q2', 'unsure'],
      ]));
    });

    await waitFor(() => {
      expect(mockStore.updateSchedule).toHaveBeenCalledTimes(2);
    });

    const writtenIds = mockStore.updateSchedule.mock.calls.map(([entry]) => entry.questionId).sort();
    expect(writtenIds).toEqual(['q1', 'q2']);
  });

  it('does not throw when updateSchedule rejects (fire-and-forget)', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockStore.updateSchedule.mockRejectedValue(new Error('boom'));

    const q1 = makeQuestion({ id: 'q1' });
    const { result } = renderHook(() =>
      useExam({ config: makeConfig(), questions: [q1], timeLimit: 600, autoSubmitOnTimeout: false })
    );

    act(() => {
      result.current.selectAnswer('Cubic');
    });

    expect(() => {
      act(() => {
        result.current.submitExam();
      });
    }).not.toThrow();

    await waitFor(() => {
      expect(warnSpy).toHaveBeenCalledWith(
        '[useExam] updateSchedule failed:',
        expect.any(Error)
      );
    });

    warnSpy.mockRestore();
  });
});
