/**
 * LocalChallengeStore — localStorage-backed progress tracking for Study
 * Challenge Tracks (Phase 1).
 *
 * Mirrors the defensive read/write try/catch style of
 * src/lib/quiz/store/local.ts (LocalStudyStore), but is a smaller,
 * self-contained store: it does not implement the `StudyStore` interface,
 * since challenge progress is tracked per stage/track rather than
 * per-question.
 */

export const CHALLENGE_STORAGE_KEY = 'gemmology-challenge-progress';

export interface ChallengeStageResult {
  stageId: string;
  /** Number of times this stage has been attempted (submitted). */
  attempts: number;
  /** Best score achieved so far, 0..1. Only ever improves. */
  bestScore: number;
  /** Sticky once true — a later, worse attempt never un-passes a stage. */
  passed: boolean;
  lastAttemptAt: number;
}

export interface ChallengeProgress {
  trackId: string;
  stages: Record<string, ChallengeStageResult>;
  /** Set the first time every stage id in the track has `passed: true`. Sticky thereafter. */
  completedAt?: number;
}

interface ChallengeProgressEnvelope {
  version: 1;
  tracks: Record<string, ChallengeProgress>;
}

function emptyEnvelope(): ChallengeProgressEnvelope {
  return { version: 1, tracks: {} };
}

function emptyProgress(trackId: string): ChallengeProgress {
  return { trackId, stages: {} };
}

function isEnvelope(v: unknown): v is ChallengeProgressEnvelope {
  return (
    typeof v === 'object' &&
    v !== null &&
    (v as ChallengeProgressEnvelope).version === 1 &&
    typeof (v as ChallengeProgressEnvelope).tracks === 'object' &&
    (v as ChallengeProgressEnvelope).tracks !== null
  );
}

export class LocalChallengeStore {
  /** Progress for a single track. Returns a fresh empty progress if none is recorded yet. */
  getProgress(trackId: string): ChallengeProgress {
    const envelope = this._read();
    return envelope.tracks[trackId] ?? emptyProgress(trackId);
  }

  /** All recorded track progress, keyed by trackId — used by the hub for summary cards. */
  getAllProgress(): Record<string, ChallengeProgress> {
    return this._read().tracks;
  }

  /**
   * Record the result of a stage attempt.
   *
   * - `attempts` increments on every call.
   * - `bestScore` only ever improves (max of previous and this attempt).
   * - `passed` is sticky: once true, it never reverts to false even if a
   *   later attempt scores below `passThreshold`.
   * - `completedAt` is set (once, and only once) the first time every id in
   *   `allStageIds` has `passed: true`; it is never cleared afterwards.
   */
  recordStageResult(
    trackId: string,
    stageId: string,
    correct: number,
    total: number,
    passThreshold: number,
    allStageIds: string[],
  ): ChallengeProgress {
    const envelope = this._read();
    const existing = envelope.tracks[trackId] ?? emptyProgress(trackId);
    const score = total > 0 ? correct / total : 0;
    const passedThisAttempt = total > 0 && score >= passThreshold;

    const previous = existing.stages[stageId];
    const nextResult: ChallengeStageResult = {
      stageId,
      attempts: (previous?.attempts ?? 0) + 1,
      bestScore: Math.max(previous?.bestScore ?? 0, score),
      passed: (previous?.passed ?? false) || passedThisAttempt,
      lastAttemptAt: Date.now(),
    };

    const updatedStages: Record<string, ChallengeStageResult> = {
      ...existing.stages,
      [stageId]: nextResult,
    };

    const allPassed =
      allStageIds.length > 0 && allStageIds.every(id => updatedStages[id]?.passed === true);

    const updated: ChallengeProgress = {
      trackId,
      stages: updatedStages,
      completedAt: allPassed ? existing.completedAt ?? Date.now() : existing.completedAt,
    };

    envelope.tracks[trackId] = updated;
    this._write(envelope);
    return updated;
  }

  private _read(): ChallengeProgressEnvelope {
    try {
      if (typeof localStorage === 'undefined') return emptyEnvelope();
      const raw = localStorage.getItem(CHALLENGE_STORAGE_KEY);
      if (raw === null) return emptyEnvelope();
      const parsed: unknown = JSON.parse(raw);
      return isEnvelope(parsed) ? parsed : emptyEnvelope();
    } catch {
      return emptyEnvelope();
    }
  }

  private _write(envelope: ChallengeProgressEnvelope): void {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify(envelope));
    } catch (err) {
      console.warn('[challenge-store] write failed:', err);
    }
  }
}

let _singleton: LocalChallengeStore | null = null;

/** Lazy singleton. Call this from components rather than constructing directly. */
export function getChallengeStore(): LocalChallengeStore {
  if (_singleton === null) _singleton = new LocalChallengeStore();
  return _singleton;
}
