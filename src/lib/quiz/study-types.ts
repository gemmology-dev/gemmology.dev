/**
 * Study system v1 contracts — shared by all parallel tracks.
 *
 * Owned by the orchestrator on `feature/study-v1-contracts`.
 * Do not modify these types from a track branch; raise an issue and have the
 * orchestrator publish the change so all tracks can rebase consistently.
 *
 * See V1-PLAN.md §3 (data model) and §3.6 (storage interface).
 */

import type { Category, UserProgress } from './question-types';

/** Confidence rating captured on every answer (V1-PLAN §3.1). */
export type Confidence = 'unsure' | 'fairly-sure' | 'certain';

/** Quiz/exam mode the response was captured in. */
export type StudyMode = 'practice' | 'exam' | 'pretest';

/** A single answered-question event (append-only log). */
export interface ResponseRecord {
  questionId: string;
  timestamp: number;
  correct: boolean;
  confidence: Confidence;
  timeMs: number;
  mode: StudyMode;
  /** Text or stable id of the chosen option (omitted for matching/fill-blank). */
  optionChosen?: string;
  /** Groups all responses from a single quiz/exam session. */
  sessionId: string;
}

/** Versioned envelope persisted at `gemmology-study-responses`. */
export interface ResponseStore {
  version: 1;
  responses: ResponseRecord[];
}

/** SM-2 schedule state per question (V1-PLAN §3.2). */
export interface ScheduleEntry {
  questionId: string;
  /** Unix ms; <=0 means "due now". */
  nextDue: number;
  /** SM-2 interval I_n in days. */
  intervalDays: number;
  /** SM-2 ease factor EF; starts at 2.5, clamped to ≥1.3. */
  easeFactor: number;
  /** Consecutive successful recalls (SM-2 n). */
  repetitions: number;
  /** Total times answered incorrectly. */
  lapses: number;
  /** Unix ms of the most recent review. */
  lastReviewed: number;
  /** Total reviews (correct + incorrect). */
  totalReviews: number;
}

/** Versioned envelope persisted at `gemmology-study-schedule`. */
export interface ScheduleStore {
  version: 1;
  entries: Record<string, ScheduleEntry>;
}

/** User-tunable behaviour (V1-PLAN §3.5). */
export interface StudySettings {
  version: 1;
  /** Show correct rationale + per-distractor rationales after submit. */
  showRationaleOnSubmit: boolean;
  /** Require ConfidenceTap before submit is enabled. */
  requireConfidence: boolean;
  /** Last-used question count, persisted across sessions. */
  preferredQuestionCount: number;
  /** Fraction of due (review) items vs new in a generated session, 0–1. */
  reviewMixRatio: number;
}

export const DEFAULT_STUDY_SETTINGS: StudySettings = {
  version: 1,
  showRationaleOnSubmit: true,
  requireConfidence: true,
  preferredQuestionCount: 10,
  reviewMixRatio: 0.7,
};

/** Per-category budget passed to the selector (V1-PLAN §5.2). */
export interface CategoryBudget {
  category: Category;
  count: number;
}

/** Selector input (V1-PLAN §5.2). */
export interface SelectionRequest {
  /** Question pool to draw from (already category/difficulty filtered). */
  pool: ReadonlyArray<{ id: string; category: Category; conceptTags?: string[] }>;
  /** Per-category budget. */
  budgets: CategoryBudget[];
  /** Total session size; should equal sum of budgets. */
  totalCount: number;
  /** Settings governing review-vs-new mix. */
  settings: Pick<StudySettings, 'reviewMixRatio'>;
  /** "Now" used for due calculations (Unix ms). */
  now: number;
}

/**
 * Storage interface implemented by both `LocalStudyStore` (v1.0) and
 * `RemoteStudyStore` (v1.1+). Track T2 develops against this contract; track T1
 * provides the localStorage implementation.
 *
 * V1-PLAN §3.6.
 */
export interface StudyStore {
  // responses
  appendResponse(record: ResponseRecord): Promise<void>;
  getResponsesFor(questionId: string): Promise<ResponseRecord[]>;
  getRecentResponses(sinceMs: number): Promise<ResponseRecord[]>;

  // schedule
  getSchedule(questionId: string): Promise<ScheduleEntry | null>;
  updateSchedule(entry: ScheduleEntry): Promise<void>;
  getDueItems(now: number): Promise<string[]>;

  // progress
  getProgress(): Promise<UserProgress>;
  updateProgress(progress: UserProgress): Promise<void>;

  // settings
  getSettings(): Promise<StudySettings>;
  updateSettings(patch: Partial<StudySettings>): Promise<void>;

  // export / import
  exportAll(): Promise<string>;
  importAll(json: string): Promise<{ success: boolean; warnings: string[] }>;
}

/**
 * Build a fresh ScheduleEntry for a never-seen question.
 * Pure helper shared by selector and scheduler so both agree on initial state.
 */
export function newScheduleEntry(questionId: string, now = Date.now()): ScheduleEntry {
  return {
    questionId,
    nextDue: now,
    intervalDays: 0,
    easeFactor: 2.5,
    repetitions: 0,
    lapses: 0,
    lastReviewed: 0,
    totalReviews: 0,
  };
}

/** Storage keys (single source of truth — never inline these). */
export const STUDY_STORAGE_KEYS = {
  responses: 'gemmology-study-responses',
  schedule: 'gemmology-study-schedule',
  progress: 'gemmology-study-progress',
  settings: 'gemmology-study-settings',
} as const;

/** Append-log capacity guard. */
export const RESPONSE_LOG_CAP = 10_000;
