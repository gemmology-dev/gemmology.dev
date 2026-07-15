/**
 * Tests for LocalCaseStore.
 * Runs in a Node.js/jsdom environment with a Map-backed localStorage mock
 * (same pattern as src/lib/quiz/challenge-store.test.ts and
 * src/lib/quiz/store/local.test.ts).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocalCaseStore, getCaseStore, CASE_STORAGE_KEY } from './store';
import type { CaseRunnerState, CaseResult } from './case-types';

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

function makeState(overrides: Partial<CaseRunnerState> = {}): CaseRunnerState {
  return {
    caseId: 'case-1',
    currentStepIndex: 1,
    decisions: [
      {
        stepId: 'step-1',
        optionId: 'opt-1',
        weight: 'optimal',
        scoreAwarded: 10,
        timeCostIncurred: 1,
        timeMs: 500,
        timestamp: Date.now(),
      },
    ],
    revealedEvidence: [],
    status: 'in-progress',
    startedAt: Date.now(),
    ...overrides,
  };
}

function makeResult(overrides: Partial<CaseResult> = {}): CaseResult {
  return {
    caseId: 'case-1',
    rawScore: 40,
    maxScore: 50,
    percentage: 80,
    efficiencyBonus: 2,
    grade: 'B',
    decisions: [],
    completedAt: Date.now(),
    ...overrides,
  };
}

describe('getCaseState', () => {
  it('returns null for a case with no recorded attempt', () => {
    const store = new LocalCaseStore();
    expect(store.getCaseState('unknown-case')).toBeNull();
  });
});

describe('saveCaseState / resume', () => {
  it('persists and returns an in-progress state (mid-case resume)', () => {
    const store = new LocalCaseStore();
    const state = makeState();
    store.saveCaseState('case-1', state);

    const entry = store.getCaseState('case-1');
    expect(entry).not.toBeNull();
    expect(entry!.state).toEqual(state);
    expect(entry!.result).toBeUndefined();
  });

  it('persists a completed state alongside its result', () => {
    const store = new LocalCaseStore();
    const state = makeState({ status: 'complete', completedAt: Date.now() });
    const result = makeResult();
    store.saveCaseState('case-1', state, result);

    const entry = store.getCaseState('case-1');
    expect(entry!.state.status).toBe('complete');
    expect(entry!.result).toEqual(result);
  });

  it('overwrites the previous entry for the same caseId', () => {
    const store = new LocalCaseStore();
    store.saveCaseState('case-1', makeState({ currentStepIndex: 0 }));
    store.saveCaseState('case-1', makeState({ currentStepIndex: 2 }));

    expect(store.getCaseState('case-1')!.state.currentStepIndex).toBe(2);
  });

  it('keeps separate cases independent in getAllCaseSummaries', () => {
    const store = new LocalCaseStore();
    store.saveCaseState('case-1', makeState({ caseId: 'case-1' }));
    store.saveCaseState('case-2', makeState({ caseId: 'case-2' }));

    const all = store.getAllCaseSummaries();
    expect(Object.keys(all).sort()).toEqual(['case-1', 'case-2']);
  });

  it('persists across store instances via localStorage', () => {
    const storeA = new LocalCaseStore();
    storeA.saveCaseState('case-1', makeState());

    const storeB = new LocalCaseStore();
    expect(storeB.getCaseState('case-1')!.state.caseId).toBe('case-1');
  });
});

describe('clearCase', () => {
  it('removes only the targeted case', () => {
    const store = new LocalCaseStore();
    store.saveCaseState('case-1', makeState({ caseId: 'case-1' }));
    store.saveCaseState('case-2', makeState({ caseId: 'case-2' }));

    store.clearCase('case-1');

    expect(store.getCaseState('case-1')).toBeNull();
    expect(store.getCaseState('case-2')).not.toBeNull();
  });

  it('does not throw when clearing a case with no recorded state', () => {
    const store = new LocalCaseStore();
    expect(() => store.clearCase('never-started')).not.toThrow();
  });
});

describe('resilience to corrupted storage', () => {
  it('falls back to an empty envelope when the stored value is invalid JSON', () => {
    mockStorage.setItem(CASE_STORAGE_KEY, 'not-json{{{');
    const store = new LocalCaseStore();
    expect(store.getCaseState('case-1')).toBeNull();
  });

  it('falls back to an empty envelope when the stored value has the wrong shape', () => {
    mockStorage.setItem(CASE_STORAGE_KEY, JSON.stringify({ unexpected: true }));
    const store = new LocalCaseStore();
    expect(store.getAllCaseSummaries()).toEqual({});
  });

  it('does not throw when localStorage.setItem throws (e.g. quota exceeded)', () => {
    const store = new LocalCaseStore();
    const setItemSpy = vi.spyOn(mockStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(() => store.saveCaseState('case-1', makeState())).not.toThrow();
    expect(warnSpy).toHaveBeenCalled();
    setItemSpy.mockRestore();
  });
});

describe('getCaseStore', () => {
  it('returns the same singleton instance across calls', () => {
    expect(getCaseStore()).toBe(getCaseStore());
  });
});
