/**
 * Tests for localStorage migrations.
 *
 * Key invariants:
 * - Migrations are idempotent (safe to run twice).
 * - Existing `gemmology-quiz-progress` data is preserved.
 * - Version sentinel is updated to CURRENT_VERSION after migration.
 * - If no legacy data exists, fresh defaults are written.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  runMigrations,
  MIGRATION_VERSION_KEY,
  CURRENT_VERSION,
} from './migrations';
import { STUDY_STORAGE_KEYS } from '../study-types';
import { INITIAL_PROGRESS } from '../question-types';
import type { UserProgress } from '../question-types';

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

const LEGACY_PROGRESS_KEY = 'gemmology-quiz-progress';

let storage: LocalStorageMock;
beforeEach(() => {
  storage = new LocalStorageMock();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readProgressFromStorage(): { version: number; progress: UserProgress } | null {
  const raw = storage.getItem(STUDY_STORAGE_KEYS.progress);
  if (!raw) return null;
  return JSON.parse(raw);
}

// ---------------------------------------------------------------------------
// Version bookkeeping
// ---------------------------------------------------------------------------

describe('version bookkeeping', () => {
  it('sets MIGRATION_VERSION_KEY to CURRENT_VERSION after migration', () => {
    runMigrations(storage);
    expect(storage.getItem(MIGRATION_VERSION_KEY)).toBe(String(CURRENT_VERSION));
  });

  it('CURRENT_VERSION is 1', () => {
    expect(CURRENT_VERSION).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// v0 → v1 (fresh storage — no legacy data)
// ---------------------------------------------------------------------------

describe('v0 → v1 migration (fresh storage)', () => {
  it('writes a versioned progress envelope with INITIAL_PROGRESS defaults', () => {
    runMigrations(storage);
    const stored = readProgressFromStorage();
    expect(stored).not.toBeNull();
    expect(stored!.version).toBe(1);
    expect(stored!.progress.totalQuizzes).toBe(0);
    expect(stored!.progress.totalCorrect).toBe(0);
    expect(stored!.progress.totalAttempted).toBe(0);
  });

  it('does not write responses or schedule keys', () => {
    runMigrations(storage);
    expect(storage.getItem(STUDY_STORAGE_KEYS.responses)).toBeNull();
    expect(storage.getItem(STUDY_STORAGE_KEYS.schedule)).toBeNull();
    expect(storage.getItem(STUDY_STORAGE_KEYS.settings)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// v0 → v1 (with legacy gemmology-quiz-progress data)
// ---------------------------------------------------------------------------

describe('v0 → v1 migration (legacy data preserved)', () => {
  it('lifts legacy progress into new envelope', () => {
    const legacyProgress: UserProgress = {
      ...INITIAL_PROGRESS,
      totalQuizzes: 7,
      totalCorrect: 42,
      totalAttempted: 60,
      lastActivity: 1_700_000_000_000,
    };
    storage.setItem(LEGACY_PROGRESS_KEY, JSON.stringify(legacyProgress));

    runMigrations(storage);

    const stored = readProgressFromStorage();
    expect(stored).not.toBeNull();
    expect(stored!.version).toBe(1);
    expect(stored!.progress.totalQuizzes).toBe(7);
    expect(stored!.progress.totalCorrect).toBe(42);
    expect(stored!.progress.totalAttempted).toBe(60);
    expect(stored!.progress.lastActivity).toBe(1_700_000_000_000);
  });

  it('merges partial legacy data with INITIAL_PROGRESS defaults', () => {
    // Legacy object missing some fields (e.g. bestScores).
    const partial = { totalQuizzes: 3 };
    storage.setItem(LEGACY_PROGRESS_KEY, JSON.stringify(partial));

    runMigrations(storage);

    const stored = readProgressFromStorage();
    expect(stored!.progress.totalQuizzes).toBe(3);
    // Fields not in partial should default.
    expect(stored!.progress.totalCorrect).toBe(0);
    expect(typeof stored!.progress.bestScores).toBe('object');
  });

  it('preserves completedTopics from legacy data', () => {
    const legacyProgress: UserProgress = {
      ...INITIAL_PROGRESS,
      totalQuizzes: 1,
      completedTopics: {
        ...INITIAL_PROGRESS.completedTopics,
        fundamentals: ['crystal-systems', 'optical-properties'],
      },
    };
    storage.setItem(LEGACY_PROGRESS_KEY, JSON.stringify(legacyProgress));

    runMigrations(storage);

    const stored = readProgressFromStorage();
    expect(stored!.progress.completedTopics.fundamentals).toEqual([
      'crystal-systems',
      'optical-properties',
    ]);
  });

  it('preserves bestScores from legacy data', () => {
    const legacyProgress: UserProgress = {
      ...INITIAL_PROGRESS,
      totalQuizzes: 1,
      bestScores: {
        ...INITIAL_PROGRESS.bestScores,
        fundamentals: 85,
        species: 70,
      },
    };
    storage.setItem(LEGACY_PROGRESS_KEY, JSON.stringify(legacyProgress));

    runMigrations(storage);

    const stored = readProgressFromStorage();
    expect(stored!.progress.bestScores.fundamentals).toBe(85);
    expect(stored!.progress.bestScores.species).toBe(70);
  });

  it('ignores corrupted legacy progress JSON', () => {
    storage.setItem(LEGACY_PROGRESS_KEY, 'CORRUPT{{{');
    runMigrations(storage);
    // Should fall back to defaults without throwing.
    const stored = readProgressFromStorage();
    expect(stored!.progress.totalQuizzes).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Idempotency
// ---------------------------------------------------------------------------

describe('idempotency', () => {
  it('is safe to run twice on fresh storage (no legacy)', () => {
    runMigrations(storage);
    runMigrations(storage);
    const stored = readProgressFromStorage();
    expect(stored!.version).toBe(1);
    expect(stored!.progress.totalQuizzes).toBe(0);
    expect(storage.getItem(MIGRATION_VERSION_KEY)).toBe(String(CURRENT_VERSION));
  });

  it('does not overwrite migrated data on second run', () => {
    const legacyProgress: UserProgress = {
      ...INITIAL_PROGRESS,
      totalQuizzes: 5,
    };
    storage.setItem(LEGACY_PROGRESS_KEY, JSON.stringify(legacyProgress));

    runMigrations(storage);

    // Manually mutate the stored progress to simulate user activity.
    const stored = readProgressFromStorage()!;
    stored.progress.totalQuizzes = 99;
    storage.setItem(STUDY_STORAGE_KEYS.progress, JSON.stringify(stored));

    // Running migrations again must not reset totalQuizzes to 5.
    runMigrations(storage);

    const final = readProgressFromStorage();
    expect(final!.progress.totalQuizzes).toBe(99);
  });

  it('skips migration entirely if already at CURRENT_VERSION', () => {
    // Pre-populate version sentinel.
    storage.setItem(MIGRATION_VERSION_KEY, String(CURRENT_VERSION));
    // Set a known progress state.
    storage.setItem(
      STUDY_STORAGE_KEYS.progress,
      JSON.stringify({ version: 1, progress: { ...INITIAL_PROGRESS, totalQuizzes: 42 } })
    );

    runMigrations(storage);

    // Progress should be untouched.
    const stored = readProgressFromStorage();
    expect(stored!.progress.totalQuizzes).toBe(42);
  });
});

// ---------------------------------------------------------------------------
// Version guard edge cases
// ---------------------------------------------------------------------------

describe('version guard edge cases', () => {
  it('treats NaN version as 0 and runs migrations', () => {
    storage.setItem(MIGRATION_VERSION_KEY, 'not-a-number');
    runMigrations(storage);
    // Should have run the v0→v1 migration.
    expect(storage.getItem(MIGRATION_VERSION_KEY)).toBe(String(CURRENT_VERSION));
    const stored = readProgressFromStorage();
    expect(stored!.version).toBe(1);
  });

  it('treats negative version as 0 and runs migrations', () => {
    storage.setItem(MIGRATION_VERSION_KEY, '-99');
    runMigrations(storage);
    expect(storage.getItem(MIGRATION_VERSION_KEY)).toBe(String(CURRENT_VERSION));
  });
});
