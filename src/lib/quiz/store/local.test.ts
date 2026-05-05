/**
 * Tests for LocalStudyStore.
 * Runs in a Node.js environment with a Map-backed localStorage mock.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocalStudyStore, getStudyStore } from './local';
import type { ResponseRecord, ScheduleEntry, StudySettings } from '../study-types';
import { RESPONSE_LOG_CAP, STUDY_STORAGE_KEYS } from '../study-types';
import { INITIAL_PROGRESS } from '../question-types';

// ---------------------------------------------------------------------------
// localStorage mock
// ---------------------------------------------------------------------------

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

// Override the global localStorage before each test.
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeResponse(overrides: Partial<ResponseRecord> = {}): ResponseRecord {
  return {
    questionId: 'q-001',
    timestamp: Date.now(),
    correct: true,
    confidence: 'fairly-sure',
    timeMs: 1500,
    mode: 'practice',
    sessionId: 'test-session-1',
    ...overrides,
  };
}

function makeScheduleEntry(questionId = 'q-001', overrides: Partial<ScheduleEntry> = {}): ScheduleEntry {
  return {
    questionId,
    nextDue: Date.now(),
    intervalDays: 1,
    easeFactor: 2.5,
    repetitions: 1,
    lapses: 0,
    lastReviewed: Date.now() - 86_400_000,
    totalReviews: 1,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// appendResponse
// ---------------------------------------------------------------------------

describe('appendResponse', () => {
  it('stores a response and reads it back via getResponsesFor', async () => {
    const store = new LocalStudyStore();
    const rec = makeResponse({ questionId: 'q-001' });
    await store.appendResponse(rec);
    const results = await store.getResponsesFor('q-001');
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(rec);
  });

  it('stores multiple responses for the same question', async () => {
    const store = new LocalStudyStore();
    await store.appendResponse(makeResponse({ questionId: 'q-abc', timestamp: 1000 }));
    await store.appendResponse(makeResponse({ questionId: 'q-abc', timestamp: 2000 }));
    const results = await store.getResponsesFor('q-abc');
    expect(results).toHaveLength(2);
  });

  it('does not cross-contaminate different questions', async () => {
    const store = new LocalStudyStore();
    await store.appendResponse(makeResponse({ questionId: 'q-A' }));
    await store.appendResponse(makeResponse({ questionId: 'q-B' }));
    expect(await store.getResponsesFor('q-A')).toHaveLength(1);
    expect(await store.getResponsesFor('q-B')).toHaveLength(1);
  });

  it('trims to RESPONSE_LOG_CAP when exceeded', async () => {
    const store = new LocalStudyStore();
    const CAP = RESPONSE_LOG_CAP;

    // Pre-populate storage with CAP records directly (bypassing the async loop)
    // so the test remains fast. Then append 5 more via the store API to verify
    // the trim logic kicks in.
    const existing: ResponseRecord[] = Array.from({ length: CAP }, (_, i) => ({
      questionId: `q-existing-${i}`,
      timestamp: i,
      correct: true,
      confidence: 'fairly-sure' as const,
      timeMs: 100,
      mode: 'practice' as const,
      sessionId: 'session-cap-test',
    }));
    mockStorage.setItem(
      STUDY_STORAGE_KEYS.responses,
      JSON.stringify({ version: 1, responses: existing })
    );

    // Append 5 more — should trigger trim.
    for (let i = 0; i < 5; i++) {
      await store.appendResponse(
        makeResponse({ questionId: `q-new-${i}`, timestamp: CAP + i })
      );
    }

    const all = await store.getRecentResponses(0);
    expect(all).toHaveLength(CAP);
    // The 5 oldest (timestamp 0–4) should have been trimmed.
    expect(all.some(r => r.questionId === 'q-existing-0')).toBe(false);
    expect(all.some(r => r.questionId === 'q-existing-4')).toBe(false);
    // The newest should be present.
    expect(all.some(r => r.questionId === 'q-new-4')).toBe(true);
  });

  it('RESPONSE_LOG_CAP constant equals 10 000', () => {
    expect(RESPONSE_LOG_CAP).toBe(10_000);
  });
});

// ---------------------------------------------------------------------------
// getRecentResponses
// ---------------------------------------------------------------------------

describe('getRecentResponses', () => {
  it('returns all records when sinceMs = 0', async () => {
    const store = new LocalStudyStore();
    await store.appendResponse(makeResponse({ timestamp: 1000 }));
    await store.appendResponse(makeResponse({ timestamp: 2000 }));
    const all = await store.getRecentResponses(0);
    expect(all).toHaveLength(2);
  });

  it('filters by sinceMs correctly', async () => {
    const store = new LocalStudyStore();
    await store.appendResponse(makeResponse({ timestamp: 1000 }));
    await store.appendResponse(makeResponse({ timestamp: 5000 }));
    await store.appendResponse(makeResponse({ timestamp: 9000 }));
    const recent = await store.getRecentResponses(3000);
    expect(recent).toHaveLength(2);
    expect(recent.every(r => r.timestamp >= 3000)).toBe(true);
  });

  it('returns empty array when store is empty', async () => {
    const store = new LocalStudyStore();
    expect(await store.getRecentResponses(0)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getResponsesFor
// ---------------------------------------------------------------------------

describe('getResponsesFor', () => {
  it('returns empty array for a never-seen questionId', async () => {
    const store = new LocalStudyStore();
    expect(await store.getResponsesFor('unknown')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getSchedule / updateSchedule
// ---------------------------------------------------------------------------

describe('schedule', () => {
  it('returns null for an unseen question', async () => {
    const store = new LocalStudyStore();
    expect(await store.getSchedule('q-unseen')).toBeNull();
  });

  it('stores and retrieves a schedule entry', async () => {
    const store = new LocalStudyStore();
    const entry = makeScheduleEntry('q-001');
    await store.updateSchedule(entry);
    const retrieved = await store.getSchedule('q-001');
    expect(retrieved).toEqual(entry);
  });

  it('overwrites an existing entry', async () => {
    const store = new LocalStudyStore();
    const entry1 = makeScheduleEntry('q-001', { intervalDays: 1 });
    const entry2 = makeScheduleEntry('q-001', { intervalDays: 6 });
    await store.updateSchedule(entry1);
    await store.updateSchedule(entry2);
    const retrieved = await store.getSchedule('q-001');
    expect(retrieved?.intervalDays).toBe(6);
  });

  it('persists multiple independent entries', async () => {
    const store = new LocalStudyStore();
    await store.updateSchedule(makeScheduleEntry('q-A', { intervalDays: 1 }));
    await store.updateSchedule(makeScheduleEntry('q-B', { intervalDays: 6 }));
    expect((await store.getSchedule('q-A'))?.intervalDays).toBe(1);
    expect((await store.getSchedule('q-B'))?.intervalDays).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// getDueItems
// ---------------------------------------------------------------------------

describe('getDueItems', () => {
  it('returns nothing when schedule is empty', async () => {
    const store = new LocalStudyStore();
    expect(await store.getDueItems(Date.now())).toEqual([]);
  });

  it('returns questionIds with nextDue <= now', async () => {
    const store = new LocalStudyStore();
    const now = Date.now();
    await store.updateSchedule(makeScheduleEntry('due-now', { nextDue: now - 1000 }));
    await store.updateSchedule(makeScheduleEntry('future', { nextDue: now + 100_000 }));
    const due = await store.getDueItems(now);
    expect(due).toContain('due-now');
    expect(due).not.toContain('future');
  });

  it('includes items where nextDue equals now exactly', async () => {
    const store = new LocalStudyStore();
    const now = 1_000_000;
    await store.updateSchedule(makeScheduleEntry('exact', { nextDue: now }));
    const due = await store.getDueItems(now);
    expect(due).toContain('exact');
  });
});

// ---------------------------------------------------------------------------
// getProgress / updateProgress
// ---------------------------------------------------------------------------

describe('progress', () => {
  it('returns INITIAL_PROGRESS when nothing has been stored', async () => {
    const store = new LocalStudyStore();
    const progress = await store.getProgress();
    expect(progress).toEqual(INITIAL_PROGRESS);
  });

  it('stores and retrieves progress', async () => {
    const store = new LocalStudyStore();
    const p = { ...INITIAL_PROGRESS, totalQuizzes: 5, totalCorrect: 20 };
    await store.updateProgress(p);
    const retrieved = await store.getProgress();
    expect(retrieved.totalQuizzes).toBe(5);
    expect(retrieved.totalCorrect).toBe(20);
  });
});

// ---------------------------------------------------------------------------
// getSettings / updateSettings
// ---------------------------------------------------------------------------

describe('settings', () => {
  it('returns default settings when nothing has been stored', async () => {
    const store = new LocalStudyStore();
    const settings = await store.getSettings();
    expect(settings.version).toBe(1);
    expect(settings.showRationaleOnSubmit).toBe(true);
    expect(settings.requireConfidence).toBe(true);
  });

  it('persists settings changes', async () => {
    const store = new LocalStudyStore();
    await store.updateSettings({ requireConfidence: false, preferredQuestionCount: 20 });
    const settings = await store.getSettings();
    expect(settings.requireConfidence).toBe(false);
    expect(settings.preferredQuestionCount).toBe(20);
  });

  it('merges partial updates with existing settings', async () => {
    const store = new LocalStudyStore();
    await store.updateSettings({ requireConfidence: false });
    await store.updateSettings({ preferredQuestionCount: 25 });
    const settings = await store.getSettings();
    expect(settings.requireConfidence).toBe(false);
    expect(settings.preferredQuestionCount).toBe(25);
    // Defaults unchanged.
    expect(settings.showRationaleOnSubmit).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// exportAll / importAll — round-trip
// ---------------------------------------------------------------------------

describe('exportAll / importAll', () => {
  it('exports non-empty JSON', async () => {
    const store = new LocalStudyStore();
    const json = await store.exportAll();
    expect(typeof json).toBe('string');
    const payload = JSON.parse(json);
    expect(payload.version).toBe(1);
    expect(Array.isArray(payload.responses)).toBe(true);
    expect(typeof payload.schedule).toBe('object');
    expect(typeof payload.progress).toBe('object');
    expect(typeof payload.settings).toBe('object');
  });

  it('round-trips 5 responses + schedule + progress + settings', async () => {
    const store = new LocalStudyStore();

    // Populate data.
    for (let i = 0; i < 5; i++) {
      await store.appendResponse(makeResponse({
        questionId: `q-${i}`,
        timestamp: 1000 + i,
        correct: i % 2 === 0,
      }));
    }
    await store.updateSchedule(makeScheduleEntry('q-0', { intervalDays: 3 }));
    await store.updateProgress({ ...INITIAL_PROGRESS, totalQuizzes: 2 });
    await store.updateSettings({ requireConfidence: false });

    const json = await store.exportAll();

    // Wipe store.
    mockStorage.clear();

    // Fresh store — import.
    const store2 = new LocalStudyStore();
    const result = await store2.importAll(json);
    expect(result.success).toBe(true);

    const responses = await store2.getRecentResponses(0);
    expect(responses).toHaveLength(5);

    const sched = await store2.getSchedule('q-0');
    expect(sched?.intervalDays).toBe(3);

    const progress = await store2.getProgress();
    expect(progress.totalQuizzes).toBe(2);

    const settings = await store2.getSettings();
    expect(settings.requireConfidence).toBe(false);
  });

  it('returns success:false on invalid JSON', async () => {
    const store = new LocalStudyStore();
    const result = await store.importAll('not json at all {{{');
    expect(result.success).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('returns success:false on wrong shape', async () => {
    const store = new LocalStudyStore();
    const result = await store.importAll(JSON.stringify({ foo: 'bar' }));
    expect(result.success).toBe(false);
  });

  it('deduplicates responses on import (same questionId + timestamp)', async () => {
    const store = new LocalStudyStore();
    const rec = makeResponse({ questionId: 'q-dup', timestamp: 99999 });
    await store.appendResponse(rec);

    const json = await store.exportAll();

    // Import into same store — should not duplicate.
    await store.importAll(json);
    const all = await store.getResponsesFor('q-dup');
    expect(all).toHaveLength(1);
  });

  it('appends new responses from import', async () => {
    const store = new LocalStudyStore();
    await store.appendResponse(makeResponse({ questionId: 'q-local', timestamp: 100 }));

    // Export from a "remote" store with a different response.
    const remoteStore = new LocalStudyStore();
    await remoteStore.appendResponse(makeResponse({ questionId: 'q-remote', timestamp: 200 }));
    const remoteJson = await remoteStore.exportAll();

    // Import remote data into local store.
    await store.importAll(remoteJson);
    const all = await store.getRecentResponses(0);
    expect(all.some(r => r.questionId === 'q-local')).toBe(true);
    expect(all.some(r => r.questionId === 'q-remote')).toBe(true);
  });

  it('upserts schedule entries by questionId on import', async () => {
    const store = new LocalStudyStore();
    await store.updateSchedule(makeScheduleEntry('q-X', { intervalDays: 1 }));

    // Build a payload with an updated schedule.
    const payload = JSON.parse(await store.exportAll());
    payload.schedule['q-X'].intervalDays = 10;
    await store.importAll(JSON.stringify(payload));

    const sched = await store.getSchedule('q-X');
    expect(sched?.intervalDays).toBe(10);
  });

  it('overwrites progress if imported lastActivity is newer', async () => {
    const store = new LocalStudyStore();
    await store.updateProgress({ ...INITIAL_PROGRESS, totalQuizzes: 1, lastActivity: 1000 });

    // Payload with newer lastActivity.
    const newerPayload = JSON.parse(await store.exportAll());
    newerPayload.progress.totalQuizzes = 5;
    newerPayload.progress.lastActivity = 9999999;

    await store.importAll(JSON.stringify(newerPayload));
    const progress = await store.getProgress();
    expect(progress.totalQuizzes).toBe(5);
  });

  it('does not overwrite progress if imported lastActivity is older', async () => {
    const store = new LocalStudyStore();
    await store.updateProgress({ ...INITIAL_PROGRESS, totalQuizzes: 3, lastActivity: 9999999 });

    // Payload with older lastActivity.
    const olderPayload = JSON.parse(await store.exportAll());
    olderPayload.progress.totalQuizzes = 1;
    olderPayload.progress.lastActivity = 1;

    await store.importAll(JSON.stringify(olderPayload));
    const progress = await store.getProgress();
    expect(progress.totalQuizzes).toBe(3); // Unchanged.
  });
});

// ---------------------------------------------------------------------------
// Storage round-trip shape preservation
// ---------------------------------------------------------------------------

describe('storage round-trip shape', () => {
  it('ResponseRecord shape is preserved exactly through storage', async () => {
    const store = new LocalStudyStore();
    const rec: ResponseRecord = {
      questionId: 'shape-test',
      timestamp: 1234567890,
      correct: false,
      confidence: 'unsure',
      timeMs: 3200,
      mode: 'exam',
      optionChosen: 'Spinel',
      sessionId: 'session-abc',
    };
    await store.appendResponse(rec);
    const [retrieved] = await store.getResponsesFor('shape-test');
    expect(retrieved).toStrictEqual(rec);
  });

  it('ScheduleEntry shape is preserved exactly through storage', async () => {
    const store = new LocalStudyStore();
    const entry: ScheduleEntry = {
      questionId: 'sched-shape',
      nextDue: 111111,
      intervalDays: 6,
      easeFactor: 2.3,
      repetitions: 2,
      lapses: 1,
      lastReviewed: 99999,
      totalReviews: 3,
    };
    await store.updateSchedule(entry);
    const retrieved = await store.getSchedule('sched-shape');
    expect(retrieved).toStrictEqual(entry);
  });

  it('StudySettings shape is preserved exactly through storage', async () => {
    const store = new LocalStudyStore();
    const settings: StudySettings = {
      version: 1,
      showRationaleOnSubmit: false,
      requireConfidence: false,
      preferredQuestionCount: 15,
      reviewMixRatio: 0.5,
    };
    await store.updateSettings(settings);
    const retrieved = await store.getSettings();
    expect(retrieved).toStrictEqual(settings);
  });
});

// ---------------------------------------------------------------------------
// Corruption resilience
// ---------------------------------------------------------------------------

describe('corruption resilience', () => {
  it('returns fallback when localStorage contains corrupt JSON', async () => {
    mockStorage.setItem(STUDY_STORAGE_KEYS.responses, 'CORRUPT{{{');
    const store = new LocalStudyStore();
    const all = await store.getRecentResponses(0);
    expect(all).toEqual([]);
  });

  it('returns fallback schedule when localStorage is corrupt', async () => {
    mockStorage.setItem(STUDY_STORAGE_KEYS.schedule, 'not-json');
    const store = new LocalStudyStore();
    const due = await store.getDueItems(Date.now());
    expect(due).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Singleton factory
// ---------------------------------------------------------------------------

describe('getStudyStore singleton', () => {
  it('returns the same instance on repeated calls', () => {
    // Reset singleton between describe blocks via the module.
    // Since vitest re-evaluates modules per test file we can test this directly.
    const a = getStudyStore();
    const b = getStudyStore();
    expect(a).toBe(b);
  });
});
