/**
 * localStorage migrations for the study system.
 *
 * Versioning key: `gemmology-study-version` (not in STUDY_STORAGE_KEYS because
 * it is meta-infrastructure, not data).
 *
 * Rules:
 * - Each migration[i] takes the raw Storage object and upgrades from version i
 *   to version i+1.
 * - Migrations are idempotent: running them a second time on already-migrated
 *   data leaves storage unchanged.
 * - Only migrations[v0→v1] is needed at launch; extend the array as new
 *   schema versions land.
 *
 * See V1-PLAN.md §8.
 */

import type { UserProgress } from '../question-types';
import { INITIAL_PROGRESS } from '../question-types';
import { STUDY_STORAGE_KEYS } from '../study-types';

/** The migration version key — not a study data key, so not in STUDY_STORAGE_KEYS. */
export const MIGRATION_VERSION_KEY = 'gemmology-study-version';

/** Increment this when a new migration is added. */
export const CURRENT_VERSION = 1;

/**
 * Migration function signature.
 * Receives the raw Storage interface (supports real `localStorage` and test mocks).
 */
type Migration = (storage: Storage) => void;

/**
 * Ordered list of migrations.
 * `migrations[i]` upgrades version i → i+1.
 */
const migrations: Migration[] = [
  migrationV0toV1,
];

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Run all pending migrations against `storage`.
 * Idempotent — safe to call on every page load.
 */
export function runMigrations(storage: Storage): void {
  const stored = storage.getItem(MIGRATION_VERSION_KEY);
  let version = stored !== null ? parseInt(stored, 10) : 0;

  // Guard against NaN or negative numbers from corrupted storage.
  if (!Number.isFinite(version) || version < 0) {
    version = 0;
  }

  // Downgrade safety: if a future build wrote a version higher than we
  // understand, leave storage untouched. Stamping back to CURRENT_VERSION
  // would let a v2-aware tab re-run its v2 migration on data that already
  // contains v2 fields (T7b-05).
  if (version >= CURRENT_VERSION) {
    return;
  }

  for (let i = version; i < CURRENT_VERSION; i++) {
    migrations[i]!(storage);
  }

  storage.setItem(MIGRATION_VERSION_KEY, String(CURRENT_VERSION));
}

// ---------------------------------------------------------------------------
// Migration implementations
// ---------------------------------------------------------------------------

/**
 * v0 → v1
 *
 * Pre-v1 the prototype stored user progress at `gemmology-quiz-progress` as a
 * bare `UserProgress` JSON object (no envelope). The v1 store wraps it in a
 * versioned envelope at `gemmology-study-progress`.
 *
 * Steps:
 * 1. If `gemmology-study-progress` already exists with version:1 — skip (idempotent).
 * 2. Read `gemmology-quiz-progress`; if present and parseable, lift it into the
 *    new envelope and write to `gemmology-study-progress`.
 * 3. If `gemmology-quiz-progress` is absent or unparseable, write fresh defaults.
 *
 * No other keys existed in v0, so responses/schedule/settings get their
 * default values on first access (handled by LocalStudyStore._read fallbacks).
 */
function migrationV0toV1(storage: Storage): void {
  // Idempotency check: if destination already exists with version 1, skip.
  const existing = storage.getItem(STUDY_STORAGE_KEYS.progress);
  if (existing !== null) {
    try {
      const parsed = JSON.parse(existing) as Record<string, unknown>;
      if (parsed['version'] === 1) {
        return; // Already migrated.
      }
    } catch {
      // Corrupted — overwrite below.
    }
  }

  // Attempt to lift old progress data.
  const LEGACY_PROGRESS_KEY = 'gemmology-quiz-progress';
  let migratedProgress: UserProgress = structuredClone(INITIAL_PROGRESS);

  const legacyRaw = storage.getItem(LEGACY_PROGRESS_KEY);
  if (legacyRaw !== null) {
    try {
      const parsed = JSON.parse(legacyRaw) as unknown;
      if (isLegacyProgress(parsed)) {
        // Merge with INITIAL_PROGRESS so any new fields added later are present.
        migratedProgress = {
          ...structuredClone(INITIAL_PROGRESS),
          ...parsed,
          // Ensure nested objects are merged, not replaced, if they exist.
          completedTopics: {
            ...structuredClone(INITIAL_PROGRESS.completedTopics),
            ...(typeof parsed.completedTopics === 'object' && parsed.completedTopics !== null
              ? (parsed.completedTopics as Record<string, string[]>)
              : {}),
          },
          bestScores: {
            ...structuredClone(INITIAL_PROGRESS.bestScores),
            ...(typeof parsed.bestScores === 'object' && parsed.bestScores !== null
              ? (parsed.bestScores as Record<string, number>)
              : {}),
          },
        };
      }
    } catch {
      // Ignore parse errors; fall through to defaults.
    }
  }

  // Write v1 envelope.
  storage.setItem(
    STUDY_STORAGE_KEYS.progress,
    JSON.stringify({ version: 1, progress: migratedProgress })
  );
}

// ---------------------------------------------------------------------------
// Internal type guard
// ---------------------------------------------------------------------------

/**
 * Minimal guard for the legacy `UserProgress` shape (v0, no version field).
 * We accept partial objects and fill missing fields with INITIAL_PROGRESS
 * during migration.
 */
function isLegacyProgress(v: unknown): v is Partial<UserProgress> {
  if (typeof v !== 'object' || v === null) return false;
  const p = v as Record<string, unknown>;
  // At minimum we expect totalQuizzes to exist as a number for a real progress object.
  return typeof p['totalQuizzes'] === 'number';
}
