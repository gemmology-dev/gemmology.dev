import { describe, it, expect, vi } from 'vitest';
import { selectSessionQuestions } from './question-pool';
import { selectQuestions } from './question-generator';
import type { Question, QuizConfig } from './question-types';
import type { QuestionPoolStore } from './question-pool';
import { DEFAULT_STUDY_SETTINGS, newScheduleEntry } from './study-types';

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
    categories: [],
    questionCount: 3,
    shuffleQuestions: false,
    shuffleOptions: false,
    mode: 'practice',
    ...overrides,
  };
}

/** A store with no history: everything is "never seen". */
function makeEmptyStore(): QuestionPoolStore {
  return {
    getSchedule: vi.fn().mockResolvedValue(null),
    getDueItems: vi.fn().mockResolvedValue([]),
  };
}

describe('selectSessionQuestions (A4c)', () => {
  it('returns the requested number of questions from a healthy store (fresh-fill path)', async () => {
    const pool = [
      makeQuestion({ id: 'q1' }),
      makeQuestion({ id: 'q2' }),
      makeQuestion({ id: 'q3' }),
      makeQuestion({ id: 'q4' }),
    ];
    const store = makeEmptyStore();

    const result = await selectSessionQuestions(
      pool,
      makeConfig({ questionCount: 3 }),
      store,
      DEFAULT_STUDY_SETTINGS
    );

    expect(result).toHaveLength(3);
    // Every returned question must come from the pool.
    const poolIds = new Set(pool.map(q => q.id));
    for (const q of result) {
      expect(poolIds.has(q.id)).toBe(true);
    }
    // No duplicates.
    expect(new Set(result.map(q => q.id)).size).toBe(3);
  });

  it('filters out structurally unrenderable questions before selecting', async () => {
    const pool = [
      makeQuestion({ id: 'bad', options: ['OnlyOne'] }),
      makeQuestion({ id: 'good1' }),
      makeQuestion({ id: 'good2' }),
    ];
    const store = makeEmptyStore();

    const result = await selectSessionQuestions(
      pool,
      makeConfig({ questionCount: 5 }),
      store,
      DEFAULT_STUDY_SETTINGS
    );

    expect(result.map(q => q.id)).not.toContain('bad');
    expect(result).toHaveLength(2);
  });

  it('respects config.categories filtering', async () => {
    const pool = [
      makeQuestion({ id: 'f1', category: 'fundamentals' }),
      makeQuestion({ id: 'e1', category: 'equipment' }),
    ];
    const store = makeEmptyStore();

    const result = await selectSessionQuestions(
      pool,
      makeConfig({ categories: ['equipment'], questionCount: 5 }),
      store,
      DEFAULT_STUDY_SETTINGS
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('e1');
  });

  it('prioritises due items (per selectQuestionsV2) ahead of never-seen items', async () => {
    const pool = [
      makeQuestion({ id: 'due1' }),
      makeQuestion({ id: 'fresh1' }),
      makeQuestion({ id: 'fresh2' }),
    ];
    const dueEntry = { ...newScheduleEntry('due1'), totalReviews: 1, nextDue: Date.now() - 1000 };
    const store: QuestionPoolStore = {
      getDueItems: vi.fn().mockResolvedValue(['due1']),
      getSchedule: vi.fn().mockImplementation(async (id: string) =>
        id === 'due1' ? dueEntry : null
      ),
    };

    const result = await selectSessionQuestions(
      pool,
      makeConfig({ questionCount: 2 }),
      store,
      DEFAULT_STUDY_SETTINGS
    );

    expect(result).toHaveLength(2);
    // Due items are selected ahead of never-seen ones (subject to the
    // reviewMixRatio budget), so 'due1' leads.
    expect(result[0].id).toBe('due1');
    expect(result.map(q => q.id)).toContain('due1');
  });

  it('falls back to the plain shuffle().slice() selection if the store throws', async () => {
    const pool = [
      makeQuestion({ id: 'q1' }),
      makeQuestion({ id: 'q2' }),
      makeQuestion({ id: 'q3' }),
    ];
    const config = makeConfig({ questionCount: 2, shuffleQuestions: false });
    const brokenStore: QuestionPoolStore = {
      getDueItems: vi.fn().mockRejectedValue(new Error('storage unavailable')),
      getSchedule: vi.fn().mockRejectedValue(new Error('storage unavailable')),
    };

    const result = await selectSessionQuestions(pool, config, brokenStore, DEFAULT_STUDY_SETTINGS);

    // Deterministic because shuffleQuestions is false — matches the legacy
    // selectQuestions() output exactly.
    expect(result).toEqual(selectQuestions(pool, config));
  });

  it('never blocks (always resolves) even if getSchedule throws only sometimes', async () => {
    const pool = [makeQuestion({ id: 'q1' }), makeQuestion({ id: 'q2' })];
    const flakyStore: QuestionPoolStore = {
      getDueItems: vi.fn().mockResolvedValue([]),
      getSchedule: vi.fn().mockRejectedValue(new Error('boom')),
    };

    await expect(
      selectSessionQuestions(pool, makeConfig({ questionCount: 2 }), flakyStore, DEFAULT_STUDY_SETTINGS)
    ).resolves.toHaveLength(2);
  });

  it('returns an empty array when the pool has no renderable questions', async () => {
    const pool = [makeQuestion({ id: 'bad', options: [] })];
    const store = makeEmptyStore();

    const result = await selectSessionQuestions(
      pool,
      makeConfig({ questionCount: 5 }),
      store,
      DEFAULT_STUDY_SETTINGS
    );

    expect(result).toEqual([]);
  });
});
