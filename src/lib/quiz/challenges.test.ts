import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  resolveStageQuestions,
  resolveTrackStages,
  trackStagePassed,
  type ChallengeStageSource,
  type ChallengeTrackSource,
} from './challenges';
import type { Question } from './question-types';

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'q-1',
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

function makeStage(overrides: Partial<ChallengeStageSource> = {}): ChallengeStageSource {
  return {
    id: 'stage-1',
    title: 'Stage One',
    tagMatch: 'all',
    passThreshold: 0.7,
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('resolveStageQuestions — explicit questionIds', () => {
  it('preserves the order given in questionIds, independent of pool order', () => {
    const pool = [
      makeQuestion({ id: 'a' }),
      makeQuestion({ id: 'b' }),
      makeQuestion({ id: 'c' }),
    ];
    const stage = makeStage({ questionIds: ['c', 'a', 'b'] });
    const resolved = resolveStageQuestions(stage, pool);
    expect(resolved.map(q => q.id)).toEqual(['c', 'a', 'b']);
  });

  it('skips missing ids and warns, without throwing', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const pool = [makeQuestion({ id: 'a' })];
    const stage = makeStage({ questionIds: ['a', 'missing-id'] });

    const resolved = resolveStageQuestions(stage, pool);

    expect(resolved.map(q => q.id)).toEqual(['a']);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('missing-id'),
    );
  });

  it('returns an empty array (not throwing) when every id is missing', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const pool = [makeQuestion({ id: 'a' })];
    const stage = makeStage({ questionIds: ['nope'] });
    expect(resolveStageQuestions(stage, pool)).toEqual([]);
  });
});

describe('resolveStageQuestions — tag fallback', () => {
  const pool = [
    makeQuestion({ id: 'z', conceptTags: ['ri', 'sg'] }),
    makeQuestion({ id: 'a', conceptTags: ['ri'] }),
    makeQuestion({ id: 'm', conceptTags: ['ri', 'sg', 'fluorescence'] }),
    makeQuestion({ id: 'n', conceptTags: ['unrelated'] }),
  ];

  it('tagMatch "all" requires every tag to be present', () => {
    const stage = makeStage({ conceptTags: ['ri', 'sg'], tagMatch: 'all', count: 10 });
    const resolved = resolveStageQuestions(stage, pool);
    expect(resolved.map(q => q.id).sort()).toEqual(['m', 'z']);
  });

  it('tagMatch "any" matches if at least one tag is present', () => {
    const stage = makeStage({ conceptTags: ['fluorescence', 'sg'], tagMatch: 'any', count: 10 });
    const resolved = resolveStageQuestions(stage, pool);
    expect(resolved.map(q => q.id).sort()).toEqual(['m', 'z']);
  });

  it('sorts matches deterministically by id before truncating to count', () => {
    const stage = makeStage({ conceptTags: ['ri'], tagMatch: 'any', count: 2 });
    const resolved = resolveStageQuestions(stage, pool);
    // Matches (by id): a, m, z -> sorted -> a, m, z -> sliced to 2 -> a, m
    expect(resolved.map(q => q.id)).toEqual(['a', 'm']);
  });

  it('truncates to count even when more questions match', () => {
    const stage = makeStage({ conceptTags: ['ri'], tagMatch: 'any', count: 1 });
    const resolved = resolveStageQuestions(stage, pool);
    expect(resolved).toHaveLength(1);
  });

  it('treats a question with no conceptTags as never matching', () => {
    const poolWithUntagged = [...pool, makeQuestion({ id: 'untagged' })];
    const stage = makeStage({ conceptTags: ['ri'], tagMatch: 'all', count: 10 });
    const resolved = resolveStageQuestions(stage, poolWithUntagged);
    expect(resolved.map(q => q.id)).not.toContain('untagged');
  });
});

describe('resolveStageQuestions — neither selection path configured', () => {
  it('returns an empty array', () => {
    const stage = makeStage();
    expect(resolveStageQuestions(stage, [makeQuestion()])).toEqual([]);
  });
});

describe('resolveTrackStages', () => {
  it('resolves every stage in order, carrying id/title/description/passThreshold through', () => {
    const pool = [makeQuestion({ id: 'a' }), makeQuestion({ id: 'b' })];
    const track: ChallengeTrackSource = {
      id: 'track-1',
      title: 'Track One',
      description: 'A test track.',
      stages: [
        makeStage({ id: 'stage-a', title: 'Stage A', description: 'first', questionIds: ['a'] }),
        makeStage({ id: 'stage-b', title: 'Stage B', questionIds: ['b'], passThreshold: 0.9 }),
      ],
    };

    const resolved = resolveTrackStages(track, pool);

    expect(resolved).toHaveLength(2);
    expect(resolved[0]).toEqual({
      id: 'stage-a',
      title: 'Stage A',
      description: 'first',
      passThreshold: 0.7,
      questions: [pool[0]],
    });
    expect(resolved[1].passThreshold).toBe(0.9);
    expect(resolved[1].questions).toEqual([pool[1]]);
  });
});

describe('trackStagePassed', () => {
  it('passes when the score is exactly at the threshold', () => {
    expect(trackStagePassed(0.7, 7, 10)).toBe(true);
  });

  it('passes when the score is above the threshold', () => {
    expect(trackStagePassed(0.7, 8, 10)).toBe(true);
  });

  it('fails when the score is below the threshold', () => {
    expect(trackStagePassed(0.7, 6, 10)).toBe(false);
  });

  it('fails (does not throw) when total is zero', () => {
    expect(trackStagePassed(0.7, 0, 0)).toBe(false);
  });
});
