/**
 * SM-2 scheduler — full implementation.
 *
 * Track T2 (`.trees/study-algorithms`) owns this file.
 *
 * See V1-PLAN.md §5.1 (SM-2 update) and §A.1.
 */

import type { Confidence, ScheduleEntry } from './study-types';

/** Initial easiness factor used by SM-2. */
export const DEFAULT_EASE = 2.5;
/** Lower bound for easiness factor — SM-2 paper. */
export const MIN_EASE = 1.3;
/** Milliseconds per day. */
export const DAY_MS = 86_400_000;

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
 * SM-2 algorithm:
 *  - quality < 3 → lapse: repetitions reset to 0, intervalDays = 1, lapses++.
 *  - quality ≥ 3 → recall: repetitions++, interval grows.
 *    - repetitions === 1 → intervalDays = 1
 *    - repetitions === 2 → intervalDays = 6
 *    - else             → intervalDays = round(prevInterval * EF)
 *  - EF always updated with the standard formula, clamped to ≥ MIN_EASE.
 *  - nextDue = now + intervalDays * DAY_MS
 *
 * V1-PLAN §5.1.
 */
export function applySM2(
  previous: ScheduleEntry,
  quality: 0 | 1 | 2 | 3 | 4 | 5,
  now: number = Date.now(),
): ScheduleEntry {
  let { intervalDays, easeFactor, repetitions, lapses, totalReviews } = previous;

  if (quality < 3) {
    // Lapse: reset streak, schedule for review tomorrow.
    repetitions = 0;
    intervalDays = 1;
    lapses += 1;
  } else {
    // Recall: advance the streak.
    repetitions += 1;
    if (repetitions === 1) {
      intervalDays = 1;
    } else if (repetitions === 2) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(previous.intervalDays * easeFactor);
    }
  }

  // EF update is applied unconditionally (lapse and recall), per SM-2 paper.
  easeFactor = Math.max(
    MIN_EASE,
    easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02),
  );

  return {
    questionId: previous.questionId,
    nextDue: now + intervalDays * DAY_MS,
    intervalDays,
    easeFactor,
    repetitions,
    lapses,
    lastReviewed: now,
    totalReviews: totalReviews + 1,
  };
}
