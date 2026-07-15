import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { Question, QuizConfig } from '../lib/quiz';
import { newScheduleEntry } from '../lib/quiz/study-types';
import { STORAGE_KEYS } from './useLocalStorage';

// ── Mock the study store singleton so SM-2 wiring is observable without
//    touching real localStorage-backed schedule state. ─────────────────────
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

// Import after the mock so useQuiz picks up the mocked store module.
const { useQuiz } = await import('./useQuiz');

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
    mode: 'practice',
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

describe('useQuiz — SM-2 wiring (A4a)', () => {
  it('submitAnswer reads the existing schedule and writes back an SM-2-updated entry', async () => {
    const question = makeQuestion();
    const { result } = renderHook(() =>
      useQuiz({ config: makeConfig(), questions: [question] })
    );

    act(() => {
      result.current.selectAnswer('Cubic');
    });
    act(() => {
      result.current.submitAnswer('certain');
    });

    await waitFor(() => {
      expect(mockStore.getSchedule).toHaveBeenCalledWith('q1');
      expect(mockStore.updateSchedule).toHaveBeenCalledTimes(1);
    });

    const written = mockStore.updateSchedule.mock.calls[0][0];
    expect(written.questionId).toBe('q1');
    // Correct + 'certain' => SM-2 quality 5 => first repetition => intervalDays 1.
    expect(written.repetitions).toBe(1);
    expect(written.intervalDays).toBe(1);
    expect(written.lapses).toBe(0);
  });

  it('falls back to a fresh schedule entry when none exists yet', async () => {
    mockStore.getSchedule.mockResolvedValue(null);
    const question = makeQuestion();
    const { result } = renderHook(() =>
      useQuiz({ config: makeConfig(), questions: [question] })
    );

    act(() => {
      result.current.selectAnswer('Trigonal'); // incorrect
    });
    act(() => {
      result.current.submitAnswer('unsure');
    });

    await waitFor(() => {
      expect(mockStore.updateSchedule).toHaveBeenCalledTimes(1);
    });

    const written = mockStore.updateSchedule.mock.calls[0][0];
    // Incorrect + 'unsure' => SM-2 quality 2 => lapse.
    expect(written.repetitions).toBe(0);
    expect(written.intervalDays).toBe(1);
    expect(written.lapses).toBe(1);
  });

  it('builds the next schedule from an existing entry rather than starting fresh', async () => {
    const existing = { ...newScheduleEntry('q1'), repetitions: 1, intervalDays: 1, easeFactor: 2.5 };
    mockStore.getSchedule.mockResolvedValue(existing);

    const question = makeQuestion();
    const { result } = renderHook(() =>
      useQuiz({ config: makeConfig(), questions: [question] })
    );

    act(() => {
      result.current.selectAnswer('Cubic');
    });
    act(() => {
      result.current.submitAnswer('certain');
    });

    await waitFor(() => {
      expect(mockStore.updateSchedule).toHaveBeenCalledTimes(1);
    });

    const written = mockStore.updateSchedule.mock.calls[0][0];
    // Second successful repetition => intervalDays jumps to 6 per SM-2.
    expect(written.repetitions).toBe(2);
    expect(written.intervalDays).toBe(6);
  });

  it('does not block on a rejected updateSchedule call (fire-and-forget)', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockStore.updateSchedule.mockRejectedValueOnce(new Error('boom'));

    const question = makeQuestion();
    const { result } = renderHook(() =>
      useQuiz({ config: makeConfig(), questions: [question] })
    );

    act(() => {
      result.current.selectAnswer('Cubic');
    });
    expect(() => {
      act(() => {
        result.current.submitAnswer('certain');
      });
    }).not.toThrow();

    await waitFor(() => {
      expect(warnSpy).toHaveBeenCalledWith(
        '[useQuiz] updateSchedule failed:',
        expect.any(Error)
      );
    });

    warnSpy.mockRestore();
  });
});

describe('useQuiz — persisted-state restore guard', () => {
  it('restores a persisted in-progress (unsubmitted) session', () => {
    const question = makeQuestion();
    const first = renderHook(() =>
      useQuiz({ config: makeConfig(), questions: [question], persist: true })
    );
    act(() => {
      first.result.current.selectAnswer('Cubic');
    });
    first.unmount();

    const second = renderHook(() =>
      useQuiz({ config: makeConfig(), questions: [question], persist: true })
    );
    expect(second.result.current.state.answers.get('q1')).toBe('Cubic');
  });

  it('never restores an already-submitted session as the current one', () => {
    const question = makeQuestion();
    const first = renderHook(() =>
      useQuiz({ config: makeConfig(), questions: [question], persist: true })
    );
    act(() => {
      first.result.current.selectAnswer('Cubic');
      first.result.current.submitAnswer();
    });
    act(() => {
      first.result.current.submitQuiz();
    });
    // useLocalStorage JSON-encodes the (already serialized) state string.
    const raw = window.localStorage.getItem(STORAGE_KEYS.QUIZ_STATE)!;
    expect(JSON.parse(JSON.parse(raw)).submitted).toBe(true);
    first.unmount();

    const fresh = makeQuestion({ id: 'q2', questionText: 'A different question?' });
    const second = renderHook(() =>
      useQuiz({ config: makeConfig(), questions: [fresh], persist: true })
    );
    expect(second.result.current.state.submitted).toBe(false);
    expect(second.result.current.state.questions[0].id).toBe('q2');
    expect(second.result.current.state.answers.size).toBe(0);
  });
});

describe('useQuiz — resetQuiz storage clearing', () => {
  it('clears the persisted quiz-state localStorage key', () => {
    const question = makeQuestion();
    const { result } = renderHook(() =>
      useQuiz({ config: makeConfig(), questions: [question], persist: true })
    );

    act(() => {
      result.current.selectAnswer('Cubic');
    });
    expect(window.localStorage.getItem(STORAGE_KEYS.QUIZ_STATE)).not.toBeNull();

    act(() => {
      result.current.resetQuiz();
    });

    expect(window.localStorage.getItem(STORAGE_KEYS.QUIZ_STATE)).toBeNull();
    expect(result.current.state.currentIndex).toBe(0);
    expect(result.current.state.answers.size).toBe(0);
  });
});
