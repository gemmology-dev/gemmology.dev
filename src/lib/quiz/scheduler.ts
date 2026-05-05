/**
 * SM-2 scheduler — contract & shared helper.
 *
 * Track T2 owns the full implementation; this file only carries the public
 * signatures so dependent tracks (T1, T3) can compile against the contract.
 *
 * See V1-PLAN.md §5.1 (SM-2 update) and §A.1.
 */

import type { Confidence, ScheduleEntry } from './study-types';

/** Initial easiness factor used by SM-2. */
export const DEFAULT_EASE = 2.5;
/** Lower bound for easiness factor — SM-2 paper. */
export const MIN_EASE = 1.3;

/**
 * Map a (correct, confidence) pair to an SM-2 quality score in [0, 5].
 *
 * 0–2 = lapse (resets repetitions).
 * 3–5 = recall (advances the streak).
 *
 * Pure; safe to call from anywhere.
 */
export function qualityOf(correct: boolean, confidence: Confidence): 0 | 1 | 2 | 3 | 4 | 5 {
  if (correct) {
    if (confidence === 'certain') return 5;
    if (confidence === 'fairly-sure') return 4;
    return 3;
  }
  if (confidence === 'unsure') return 2;
  if (confidence === 'fairly-sure') return 1;
  return 0;
}

/**
 * Compute the next ScheduleEntry from the previous one + the latest quality.
 *
 * Implementation lives on track T2's branch (`.trees/study-algorithms`).
 * Until then this throws to make incomplete integration loud rather than silent.
 *
 * V1-PLAN §5.1.
 */
export function applySM2(
  _previous: ScheduleEntry,
  _quality: 0 | 1 | 2 | 3 | 4 | 5,
  _now: number = Date.now(),
): ScheduleEntry {
  throw new Error('applySM2: implementation deferred to track T2 (study-algorithms)');
}
