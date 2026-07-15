/**
 * Tests for LocalChallengeStore.
 * Runs in a Node.js/jsdom environment with a Map-backed localStorage mock
 * (same pattern as src/lib/quiz/store/local.test.ts).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocalChallengeStore, getChallengeStore, CHALLENGE_STORAGE_KEY } from './challenge-store';

class LocalStorageMock implements Storage {
  private store: Map<string, string> = new Map();
  get length() { return this.store.size; }
  clear() { this.store.clear(); }
  getItem(key: string) { return this.store.get(key) ?? null; }
  setItem(key: string, value: string) { this.store.set(key, value); }
  removeItem(key: string) { this.store.delete(key); }
  key(index: number) { return [...this.store.keys()][index] ?? null; }
}

let mockStorage: LocalStorageMock;

beforeEach(() => {
  mockStorage = new LocalStorageMock();
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockStorage,
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getProgress', () => {
  it('returns a fresh empty progress for a track with no recorded attempts', () => {
    const store = new LocalChallengeStore();
    const progress = store.getProgress('track-1');
    expect(progress).toEqual({ trackId: 'track-1', stages: {} });
  });
});

describe('recordStageResult', () => {
  it('records the first attempt with attempts=1 and the correct bestScore/passed', () => {
    const store = new LocalChallengeStore();
    const result = store.recordStageResult('track-1', 'stage-1', 8, 10, 0.7, ['stage-1']);

    expect(result.stages['stage-1']).toMatchObject({
      stageId: 'stage-1',
      attempts: 1,
      bestScore: 0.8,
      passed: true,
    });
    expect(result.stages['stage-1'].lastAttemptAt).toBeGreaterThan(0);
  });

  it('increments attempts on every subsequent call', () => {
    const store = new LocalChallengeStore();
    store.recordStageResult('track-1', 'stage-1', 5, 10, 0.7, ['stage-1']);
    store.recordStageResult('track-1', 'stage-1', 6, 10, 0.7, ['stage-1']);
    const result = store.recordStageResult('track-1', 'stage-1', 7, 10, 0.7, ['stage-1']);

    expect(result.stages['stage-1'].attempts).toBe(3);
  });

  it('bestScore only ever improves, never regresses on a worse later attempt', () => {
    const store = new LocalChallengeStore();
    store.recordStageResult('track-1', 'stage-1', 9, 10, 0.7, ['stage-1']);
    const result = store.recordStageResult('track-1', 'stage-1', 3, 10, 0.7, ['stage-1']);

    expect(result.stages['stage-1'].bestScore).toBe(0.9);
  });

  it('passed is sticky: a later attempt below threshold does not un-pass the stage', () => {
    const store = new LocalChallengeStore();
    store.recordStageResult('track-1', 'stage-1', 8, 10, 0.7, ['stage-1']);
    const result = store.recordStageResult('track-1', 'stage-1', 2, 10, 0.7, ['stage-1']);

    expect(result.stages['stage-1'].passed).toBe(true);
  });

  it('does not mark passed on a first attempt below threshold', () => {
    const store = new LocalChallengeStore();
    const result = store.recordStageResult('track-1', 'stage-1', 5, 10, 0.7, ['stage-1']);
    expect(result.stages['stage-1'].passed).toBe(false);
  });

  it('sets completedAt only once every stage id in allStageIds has passed', () => {
    const store = new LocalChallengeStore();
    const allStageIds = ['stage-1', 'stage-2'];

    let result = store.recordStageResult('track-1', 'stage-1', 8, 10, 0.7, allStageIds);
    expect(result.completedAt).toBeUndefined();

    result = store.recordStageResult('track-1', 'stage-2', 3, 10, 0.7, allStageIds);
    expect(result.completedAt).toBeUndefined();

    result = store.recordStageResult('track-1', 'stage-2', 9, 10, 0.7, allStageIds);
    expect(result.completedAt).toBeGreaterThan(0);
  });

  it('completedAt is sticky once set, even if a stage is later retried', () => {
    const store = new LocalChallengeStore();
    const allStageIds = ['stage-1'];
    const first = store.recordStageResult('track-1', 'stage-1', 8, 10, 0.7, allStageIds);
    const completedAt = first.completedAt;
    expect(completedAt).toBeDefined();

    const second = store.recordStageResult('track-1', 'stage-1', 9, 10, 0.7, allStageIds);
    expect(second.completedAt).toBe(completedAt);
  });

  it('persists progress across store instances via localStorage', () => {
    const storeA = new LocalChallengeStore();
    storeA.recordStageResult('track-1', 'stage-1', 8, 10, 0.7, ['stage-1']);

    const storeB = new LocalChallengeStore();
    const progress = storeB.getProgress('track-1');
    expect(progress.stages['stage-1'].bestScore).toBe(0.8);
  });

  it('keeps separate tracks independent in getAllProgress', () => {
    const store = new LocalChallengeStore();
    store.recordStageResult('track-1', 'stage-1', 8, 10, 0.7, ['stage-1']);
    store.recordStageResult('track-2', 'stage-1', 2, 10, 0.7, ['stage-1']);

    const all = store.getAllProgress();
    expect(Object.keys(all).sort()).toEqual(['track-1', 'track-2']);
    expect(all['track-1'].stages['stage-1'].passed).toBe(true);
    expect(all['track-2'].stages['stage-1'].passed).toBe(false);
  });
});

describe('resilience to corrupted storage', () => {
  it('falls back to an empty envelope when the stored value is invalid JSON', () => {
    mockStorage.setItem(CHALLENGE_STORAGE_KEY, 'not-json{{{');
    const store = new LocalChallengeStore();
    expect(store.getProgress('track-1')).toEqual({ trackId: 'track-1', stages: {} });
  });

  it('falls back to an empty envelope when the stored value has the wrong shape', () => {
    mockStorage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify({ unexpected: true }));
    const store = new LocalChallengeStore();
    expect(store.getAllProgress()).toEqual({});
  });

  it('does not throw when localStorage.setItem throws (e.g. quota exceeded)', () => {
    const store = new LocalChallengeStore();
    const setItemSpy = vi.spyOn(mockStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(() =>
      store.recordStageResult('track-1', 'stage-1', 8, 10, 0.7, ['stage-1']),
    ).not.toThrow();
    expect(warnSpy).toHaveBeenCalled();
    setItemSpy.mockRestore();
  });
});

describe('getChallengeStore', () => {
  it('returns the same singleton instance across calls', () => {
    expect(getChallengeStore()).toBe(getChallengeStore());
  });
});
