/**
 * LocalStudyStore — localStorage-backed implementation of StudyStore.
 *
 * Owned by track T1 (`.trees/study-foundation`).
 * See V1-PLAN.md §3.6 (interface) and §A.2 (skeleton).
 *
 * Storage keys are sourced from STUDY_STORAGE_KEYS — never inline them.
 * The response log is capped at RESPONSE_LOG_CAP (10 000) records; older
 * entries are dropped from the head when the cap is exceeded.
 */

import type {
  StudyStore,
  ResponseRecord,
  ResponseStore,
  ScheduleEntry,
  ScheduleStore,
  StudySettings,
} from '../study-types';
import type { UserProgress } from '../question-types';
import {
  INITIAL_PROGRESS,
} from '../question-types';
import {
  DEFAULT_STUDY_SETTINGS,
  STUDY_STORAGE_KEYS,
  RESPONSE_LOG_CAP,
} from '../study-types';
import { runMigrations } from './migrations';

// ---------------------------------------------------------------------------
// Internal envelope shapes
// ---------------------------------------------------------------------------

interface ProgressStore {
  version: 1;
  progress: UserProgress;
}

interface SettingsStore {
  version: 1;
  settings: StudySettings;
}

// ---------------------------------------------------------------------------
// Export / import payload
// ---------------------------------------------------------------------------

interface ExportPayload {
  version: 1;
  responses: ResponseRecord[];
  schedule: Record<string, ScheduleEntry>;
  progress: UserProgress;
  settings: StudySettings;
}

// ---------------------------------------------------------------------------
// LocalStudyStore
// ---------------------------------------------------------------------------

export class LocalStudyStore implements StudyStore {
  /** Run migrations on construction so the store is always up-to-date. */
  constructor() {
    // Only run in browser environments; tests that mock localStorage still work.
    if (typeof localStorage !== 'undefined') {
      runMigrations(localStorage);
    }
  }

  // -------------------------------------------------------------------------
  // Responses
  // -------------------------------------------------------------------------

  async appendResponse(record: ResponseRecord): Promise<void> {
    const store = this._readResponses();
    store.responses.push(record);
    if (store.responses.length > RESPONSE_LOG_CAP) {
      // Trim from the head (oldest first).
      store.responses.splice(0, store.responses.length - RESPONSE_LOG_CAP);
    }
    this._write(STUDY_STORAGE_KEYS.responses, store);
  }

  async getResponsesFor(questionId: string): Promise<ResponseRecord[]> {
    const store = this._readResponses();
    return store.responses.filter(r => r.questionId === questionId);
  }

  /**
   * Return all responses with timestamp >= sinceMs.
   * Pass 0 to get every recorded response.
   */
  async getRecentResponses(sinceMs: number): Promise<ResponseRecord[]> {
    const store = this._readResponses();
    return store.responses.filter(r => r.timestamp >= sinceMs);
  }

  // -------------------------------------------------------------------------
  // Schedule
  // -------------------------------------------------------------------------

  async getSchedule(questionId: string): Promise<ScheduleEntry | null> {
    const store = this._readSchedule();
    return store.entries[questionId] ?? null;
  }

  async updateSchedule(entry: ScheduleEntry): Promise<void> {
    const store = this._readSchedule();
    store.entries[entry.questionId] = entry;
    this._write(STUDY_STORAGE_KEYS.schedule, store);
  }

  /** Return questionIds whose nextDue is at or before `now`. */
  async getDueItems(now: number): Promise<string[]> {
    const store = this._readSchedule();
    return Object.values(store.entries)
      .filter(e => e.nextDue <= now)
      .map(e => e.questionId);
  }

  // -------------------------------------------------------------------------
  // Progress
  // -------------------------------------------------------------------------

  async getProgress(): Promise<UserProgress> {
    const raw = this._read<ProgressStore | null>(STUDY_STORAGE_KEYS.progress, null);
    if (raw && raw.version === 1 && raw.progress) {
      return raw.progress;
    }
    return structuredClone(INITIAL_PROGRESS);
  }

  async updateProgress(progress: UserProgress): Promise<void> {
    const store: ProgressStore = { version: 1, progress };
    this._write(STUDY_STORAGE_KEYS.progress, store);
  }

  // -------------------------------------------------------------------------
  // Settings
  // -------------------------------------------------------------------------

  async getSettings(): Promise<StudySettings> {
    const raw = this._read<SettingsStore | null>(STUDY_STORAGE_KEYS.settings, null);
    if (raw && raw.version === 1 && raw.settings) {
      // Merge stored settings with defaults so new fields are never undefined.
      return { ...DEFAULT_STUDY_SETTINGS, ...raw.settings };
    }
    return { ...DEFAULT_STUDY_SETTINGS };
  }

  async updateSettings(patch: Partial<StudySettings>): Promise<void> {
    const current = await this.getSettings();
    const updated: StudySettings = { ...current, ...patch, version: 1 };
    const store: SettingsStore = { version: 1, settings: updated };
    this._write(STUDY_STORAGE_KEYS.settings, store);
  }

  // -------------------------------------------------------------------------
  // Export / import
  // -------------------------------------------------------------------------

  /**
   * Serialise the entire study state to a JSON string.
   * Shape: `{ version: 1, responses, schedule, progress, settings }`.
   */
  async exportAll(): Promise<string> {
    const [progressResult, settingsResult] = await Promise.all([
      this.getProgress(),
      this.getSettings(),
    ]);

    const responseStore = this._readResponses();
    const scheduleStore = this._readSchedule();

    const payload: ExportPayload = {
      version: 1,
      responses: responseStore.responses,
      schedule: scheduleStore.entries,
      progress: progressResult,
      settings: settingsResult,
    };

    return JSON.stringify(payload);
  }

  /**
   * Import a JSON string produced by `exportAll`.
   *
   * Merge strategy:
   * - responses: appended (de-duplicated by questionId+timestamp).
   * - schedule: upserted by questionId.
   * - progress: overwritten if imported lastActivity is newer.
   * - settings: always overwritten.
   *
   * Returns `{ success: true, warnings: [] }` on full success or
   * `{ success: false, warnings: [...] }` when the payload is invalid.
   */
  async importAll(json: string): Promise<{ success: boolean; warnings: string[] }> {
    const warnings: string[] = [];

    let payload: unknown;
    try {
      payload = JSON.parse(json);
    } catch {
      return { success: false, warnings: ['Import failed: invalid JSON.'] };
    }

    if (!isExportPayload(payload)) {
      return {
        success: false,
        warnings: ['Import failed: payload does not match expected shape (version 1).'],
      };
    }

    // --- Responses: append, drop exact duplicates ---
    try {
      const existing = this._readResponses();
      const existingKeys = new Set(
        existing.responses.map(r => `${r.questionId}::${r.timestamp}`)
      );
      const toAppend = payload.responses.filter(
        r => !existingKeys.has(`${r.questionId}::${r.timestamp}`)
      );
      existing.responses.push(...toAppend);
      if (existing.responses.length > RESPONSE_LOG_CAP) {
        existing.responses.splice(0, existing.responses.length - RESPONSE_LOG_CAP);
      }
      this._write(STUDY_STORAGE_KEYS.responses, existing);
    } catch (err) {
      warnings.push(`Response import partial: ${String(err)}`);
    }

    // --- Schedule: upsert by questionId ---
    try {
      const existing = this._readSchedule();
      for (const [qid, entry] of Object.entries(payload.schedule)) {
        if (isScheduleEntry(entry)) {
          existing.entries[qid] = entry;
        } else {
          warnings.push(`Skipped invalid schedule entry for questionId "${qid}".`);
        }
      }
      this._write(STUDY_STORAGE_KEYS.schedule, existing);
    } catch (err) {
      warnings.push(`Schedule import partial: ${String(err)}`);
    }

    // --- Progress: overwrite if imported is newer ---
    try {
      const current = await this.getProgress();
      if (
        isUserProgress(payload.progress) &&
        payload.progress.lastActivity >= current.lastActivity
      ) {
        await this.updateProgress(payload.progress);
      } else if (!isUserProgress(payload.progress)) {
        warnings.push('Progress not imported: invalid shape.');
      }
    } catch (err) {
      warnings.push(`Progress import failed: ${String(err)}`);
    }

    // --- Settings: always overwrite ---
    try {
      if (isStudySettings(payload.settings)) {
        await this.updateSettings(payload.settings);
      } else {
        warnings.push('Settings not imported: invalid shape.');
      }
    } catch (err) {
      warnings.push(`Settings import failed: ${String(err)}`);
    }

    return { success: true, warnings };
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private _readResponses(): ResponseStore {
    return this._read<ResponseStore>(STUDY_STORAGE_KEYS.responses, {
      version: 1,
      responses: [],
    });
  }

  private _readSchedule(): ScheduleStore {
    return this._read<ScheduleStore>(STUDY_STORAGE_KEYS.schedule, {
      version: 1,
      entries: {},
    });
  }

  private _read<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  private _write(key: string, value: unknown): void {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

// ---------------------------------------------------------------------------
// Type guards for import validation
// ---------------------------------------------------------------------------

function isExportPayload(v: unknown): v is ExportPayload {
  if (typeof v !== 'object' || v === null) return false;
  const p = v as Record<string, unknown>;
  return (
    p['version'] === 1 &&
    Array.isArray(p['responses']) &&
    typeof p['schedule'] === 'object' &&
    p['schedule'] !== null &&
    typeof p['progress'] === 'object' &&
    p['progress'] !== null &&
    typeof p['settings'] === 'object' &&
    p['settings'] !== null
  );
}

function isScheduleEntry(v: unknown): v is ScheduleEntry {
  if (typeof v !== 'object' || v === null) return false;
  const e = v as Record<string, unknown>;
  return (
    typeof e['questionId'] === 'string' &&
    typeof e['nextDue'] === 'number' &&
    typeof e['intervalDays'] === 'number' &&
    typeof e['easeFactor'] === 'number' &&
    typeof e['repetitions'] === 'number' &&
    typeof e['lapses'] === 'number' &&
    typeof e['lastReviewed'] === 'number' &&
    typeof e['totalReviews'] === 'number'
  );
}

function isUserProgress(v: unknown): v is UserProgress {
  if (typeof v !== 'object' || v === null) return false;
  const p = v as Record<string, unknown>;
  return (
    typeof p['totalQuizzes'] === 'number' &&
    typeof p['totalCorrect'] === 'number' &&
    typeof p['totalAttempted'] === 'number' &&
    typeof p['lastActivity'] === 'number' &&
    typeof p['completedTopics'] === 'object' &&
    p['completedTopics'] !== null &&
    typeof p['bestScores'] === 'object' &&
    p['bestScores'] !== null
  );
}

function isStudySettings(v: unknown): v is StudySettings {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as Record<string, unknown>;
  return (
    s['version'] === 1 &&
    typeof s['showRationaleOnSubmit'] === 'boolean' &&
    typeof s['requireConfidence'] === 'boolean' &&
    typeof s['preferredQuestionCount'] === 'number' &&
    typeof s['reviewMixRatio'] === 'number'
  );
}

// ---------------------------------------------------------------------------
// Singleton factory
// ---------------------------------------------------------------------------

let _singleton: LocalStudyStore | null = null;

/** Lazy singleton. Call this from hooks rather than constructing directly. */
export function getStudyStore(): StudyStore {
  if (_singleton === null) _singleton = new LocalStudyStore();
  return _singleton;
}
