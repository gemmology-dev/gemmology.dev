/**
 * LocalStudyStore — contract stub.
 *
 * Owned by track T1 (`.trees/study-foundation`). This file lives on the
 * contracts branch only as a placeholder so other tracks can compile.
 *
 * V1-PLAN.md §A.2 contains the full skeleton.
 */

import type {
  ResponseRecord,
  ScheduleEntry,
  StudyStore,
  StudySettings,
} from '../study-types';
import type { UserProgress } from '../question-types';
import { INITIAL_PROGRESS } from '../question-types';
import { DEFAULT_STUDY_SETTINGS } from '../study-types';

/**
 * In-memory placeholder used until track T1 ships the localStorage-backed
 * implementation. Calling any non-trivial method throws so missing wiring is
 * loud during development.
 */
export class LocalStudyStore implements StudyStore {
  // responses
  async appendResponse(_record: ResponseRecord): Promise<void> {
    throw new Error('LocalStudyStore.appendResponse: deferred to track T1');
  }
  async getResponsesFor(_questionId: string): Promise<ResponseRecord[]> {
    throw new Error('LocalStudyStore.getResponsesFor: deferred to track T1');
  }
  async getRecentResponses(_sinceMs: number): Promise<ResponseRecord[]> {
    throw new Error('LocalStudyStore.getRecentResponses: deferred to track T1');
  }
  // schedule
  async getSchedule(_questionId: string): Promise<ScheduleEntry | null> {
    throw new Error('LocalStudyStore.getSchedule: deferred to track T1');
  }
  async updateSchedule(_entry: ScheduleEntry): Promise<void> {
    throw new Error('LocalStudyStore.updateSchedule: deferred to track T1');
  }
  async getDueItems(_now: number): Promise<string[]> {
    throw new Error('LocalStudyStore.getDueItems: deferred to track T1');
  }
  // progress
  async getProgress(): Promise<UserProgress> {
    return INITIAL_PROGRESS;
  }
  async updateProgress(_progress: UserProgress): Promise<void> {
    throw new Error('LocalStudyStore.updateProgress: deferred to track T1');
  }
  // settings
  async getSettings(): Promise<StudySettings> {
    return DEFAULT_STUDY_SETTINGS;
  }
  async updateSettings(_patch: Partial<StudySettings>): Promise<void> {
    throw new Error('LocalStudyStore.updateSettings: deferred to track T1');
  }
  // export/import
  async exportAll(): Promise<string> {
    throw new Error('LocalStudyStore.exportAll: deferred to track T1');
  }
  async importAll(_json: string): Promise<{ success: boolean; warnings: string[] }> {
    throw new Error('LocalStudyStore.importAll: deferred to track T1');
  }
}

let _singleton: LocalStudyStore | null = null;
/** Lazy singleton. Track T1 may replace with a more sophisticated factory. */
export function getStudyStore(): StudyStore {
  if (_singleton === null) _singleton = new LocalStudyStore();
  return _singleton;
}
