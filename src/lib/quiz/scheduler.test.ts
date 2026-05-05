/**
 * Tests for scheduler.ts — SM-2 implementation.
 *
 * Verifies:
 *  - qualityOf mapping
 *  - Lapse behaviour (q < 3)
 *  - Recall behaviour (q ≥ 3)
 *  - EF clamped to ≥ 1.3
 *  - Interval growth on streak (hand-rolled property test)
 *  - Specific values from V1-PLAN §5.1 examples (q=5 streak)
 */

import { describe, it, expect } from 'vitest';
import {
  applySM2,
  qualityOf,
  DEFAULT_EASE,
  MIN_EASE,
  DAY_MS,
} from './scheduler';
import { newScheduleEntry } from './study-types';

// ── helpers ───────────────────────────────────────────────────────────────────

const NOW = 1_700_000_000_000; // arbitrary fixed timestamp

function freshEntry(id = 'q1') {
  return newScheduleEntry(id, NOW);
}

/** Apply n consecutive quality=5 answers and return all entries (including fresh). */
function runStreak(quality: 0 | 1 | 2 | 3 | 4 | 5, n: number) {
  const entries = [freshEntry()];
  for (let i = 0; i < n; i++) {
    entries.push(applySM2(entries[entries.length - 1], quality, NOW));
  }
  return entries;
}

// ── qualityOf ─────────────────────────────────────────────────────────────────

describe('qualityOf', () => {
  it('correct+certain → 5', () => expect(qualityOf(true, 'certain')).toBe(5));
  it('correct+fairly-sure → 4', () => expect(qualityOf(true, 'fairly-sure')).toBe(4));
  it('correct+unsure → 3', () => expect(qualityOf(true, 'unsure')).toBe(3));
  it('incorrect+unsure → 2', () => expect(qualityOf(false, 'unsure')).toBe(2));
  it('incorrect+fairly-sure → 1', () => expect(qualityOf(false, 'fairly-sure')).toBe(1));
  it('incorrect+certain → 0', () => expect(qualityOf(false, 'certain')).toBe(0));
});

// ── lapse (q < 3) ─────────────────────────────────────────────────────────────

describe('applySM2 — lapse (quality < 3)', () => {
  it('resets repetitions to 0', () => {
    // First build up a streak so repetitions > 0.
    const after2 = runStreak(5, 2);
    const entry = after2[after2.length - 1];
    expect(entry.repetitions).toBe(2);

    const lapsed = applySM2(entry, 0, NOW);
    expect(lapsed.repetitions).toBe(0);
  });

  it('sets intervalDays to 1 on lapse', () => {
    const streak = runStreak(5, 5);
    const entry = streak[streak.length - 1];
    expect(entry.intervalDays).toBeGreaterThan(6);

    const lapsed = applySM2(entry, 1, NOW);
    expect(lapsed.intervalDays).toBe(1);
  });

  it('increments lapses counter', () => {
    const entry = freshEntry();
    expect(entry.lapses).toBe(0);
    const lapsed = applySM2(entry, 0, NOW);
    expect(lapsed.lapses).toBe(1);
    const lapsed2 = applySM2(lapsed, 2, NOW);
    expect(lapsed2.lapses).toBe(2);
  });

  it('still updates totalReviews on lapse', () => {
    const entry = freshEntry();
    const result = applySM2(entry, 0, NOW);
    expect(result.totalReviews).toBe(1);
  });

  it('updates lastReviewed on lapse', () => {
    const entry = freshEntry();
    const result = applySM2(entry, 0, NOW + 1000);
    expect(result.lastReviewed).toBe(NOW + 1000);
  });

  it('sets nextDue to now + 1 day on lapse', () => {
    const entry = freshEntry();
    const t = NOW + 5000;
    const result = applySM2(entry, 2, t);
    expect(result.nextDue).toBe(t + DAY_MS);
  });

  it.each([0, 1, 2] as const)('q=%i is a lapse', (q) => {
    const result = applySM2(freshEntry(), q, NOW);
    expect(result.repetitions).toBe(0);
    expect(result.lapses).toBe(1);
  });
});

// ── recall (q ≥ 3) ───────────────────────────────────────────────────────────

describe('applySM2 — recall (quality ≥ 3)', () => {
  it('first recall: repetitions=1, intervalDays=1', () => {
    const entry = freshEntry();
    const result = applySM2(entry, 5, NOW);
    expect(result.repetitions).toBe(1);
    expect(result.intervalDays).toBe(1);
  });

  it('second recall: repetitions=2, intervalDays=6', () => {
    const after1 = applySM2(freshEntry(), 5, NOW);
    const after2 = applySM2(after1, 5, NOW);
    expect(after2.repetitions).toBe(2);
    expect(after2.intervalDays).toBe(6);
  });

  it('third recall: intervalDays = round(6 * EF)', () => {
    const after1 = applySM2(freshEntry(), 5, NOW);
    const after2 = applySM2(after1, 5, NOW);
    const ef = after2.easeFactor;
    const after3 = applySM2(after2, 5, NOW);
    expect(after3.intervalDays).toBe(Math.round(6 * ef));
  });

  it('does not change lapses on recall', () => {
    const result = applySM2(freshEntry(), 3, NOW);
    expect(result.lapses).toBe(0);
  });

  it.each([3, 4, 5] as const)('q=%i increments repetitions', (q) => {
    const result = applySM2(freshEntry(), q, NOW);
    expect(result.repetitions).toBe(1);
  });
});

// ── EF clamping ───────────────────────────────────────────────────────────────

describe('applySM2 — ease factor', () => {
  it('initialises at DEFAULT_EASE (2.5)', () => {
    expect(freshEntry().easeFactor).toBe(DEFAULT_EASE);
  });

  it('EF increases on q=5', () => {
    const result = applySM2(freshEntry(), 5, NOW);
    expect(result.easeFactor).toBeGreaterThan(DEFAULT_EASE);
  });

  it('EF decreases on q=3', () => {
    const result = applySM2(freshEntry(), 3, NOW);
    expect(result.easeFactor).toBeLessThan(DEFAULT_EASE);
  });

  it('EF is clamped to MIN_EASE (1.3)', () => {
    // Drive EF down with repeated low-quality answers.
    let entry = freshEntry();
    for (let i = 0; i < 30; i++) {
      entry = applySM2(entry, 3, NOW);
    }
    expect(entry.easeFactor).toBeGreaterThanOrEqual(MIN_EASE);
  });

  it('EF never goes below MIN_EASE even on q=0', () => {
    // Force entry with very low EF by cheating via object spread.
    const lowEF = { ...freshEntry(), easeFactor: 1.3 };
    const result = applySM2(lowEF, 0, NOW);
    expect(result.easeFactor).toBeGreaterThanOrEqual(MIN_EASE);
  });

  it('EF grows linearly with q=5 (no upper cap in SM-2) — stays finite', () => {
    let entry = freshEntry();
    for (let i = 0; i < 100; i++) {
      entry = applySM2(entry, 5, NOW);
    }
    // SM-2 has no upper cap on EF; with q=5 it grows by +0.1 per review.
    // After 100 perfect reviews: EF ≈ 2.5 + 100*0.1 = 12.5.
    expect(Number.isFinite(entry.easeFactor)).toBe(true);
    expect(entry.easeFactor).toBeGreaterThan(2.5);
    // Verify the growth is approximately +0.1/review.
    expect(entry.easeFactor).toBeCloseTo(2.5 + 100 * 0.1, 0);
  });
});

// ── interval growth invariant (property test) ────────────────────────────────

describe('applySM2 — interval growth property', () => {
  /**
   * For any sequence of correct answers (q ∈ {3,4,5}), after the first two
   * items the sequence of intervalDays must be non-decreasing.
   */
  function assertNonDecreasingIntervals(qualities: (3 | 4 | 5)[]) {
    const entries = [freshEntry()];
    for (const q of qualities) {
      entries.push(applySM2(entries[entries.length - 1], q, NOW));
    }
    const intervals = entries.slice(2).map((e) => e.intervalDays);
    for (let i = 1; i < intervals.length; i++) {
      expect(intervals[i]).toBeGreaterThanOrEqual(intervals[i - 1]);
    }
  }

  it('all-5 streak: intervals non-decreasing after first two', () => {
    assertNonDecreasingIntervals([5, 5, 5, 5, 5, 5, 5, 5]);
  });

  it('all-4 streak: intervals non-decreasing after first two', () => {
    assertNonDecreasingIntervals([4, 4, 4, 4, 4, 4, 4, 4]);
  });

  it('all-3 streak: intervals non-decreasing after first two', () => {
    assertNonDecreasingIntervals([3, 3, 3, 3, 3, 3, 3, 3]);
  });

  it('mixed 3/4/5 streak: intervals non-decreasing after first two', () => {
    assertNonDecreasingIntervals([3, 5, 4, 3, 5, 5, 4, 3, 5]);
  });

  /**
   * Hand-rolled property test: generate 20 random quality sequences of length
   * 10 (all ≥ 3) and assert the invariant holds for each.
   */
  it('non-decreasing intervals: hand-rolled property over 20 sequences', () => {
    const possible: (3 | 4 | 5)[] = [3, 4, 5];
    // Deterministic via LCG seeded from NOW to keep test reproducible.
    let seed = 42;
    function nextInt(n: number) {
      seed = (seed * 1664525 + 1013904223) & 0x7fffffff;
      return seed % n;
    }

    for (let trial = 0; trial < 20; trial++) {
      const seq: (3 | 4 | 5)[] = Array.from({ length: 10 }, () => possible[nextInt(3)]);
      assertNonDecreasingIntervals(seq);
    }
  });
});

// ── concrete examples from V1-PLAN §5.1 ──────────────────────────────────────

describe('applySM2 — concrete examples (q=5 streak)', () => {
  it('intervals follow 1 → 6 → ~15 → ~38 pattern with q=5', () => {
    const entries = runStreak(5, 5);
    const intervals = entries.slice(1).map((e) => e.intervalDays);
    // rep1 → 1, rep2 → 6, rep3 → round(6 * EF_after_2), …
    expect(intervals[0]).toBe(1);
    expect(intervals[1]).toBe(6);
    // After two perfect reps, EF ≈ 2.6 → interval[2] ≈ 16
    expect(intervals[2]).toBeGreaterThan(12);
    expect(intervals[2]).toBeLessThan(20);
    // interval[3] should be larger than interval[2]
    expect(intervals[3]).toBeGreaterThan(intervals[2]);
    expect(intervals[4]).toBeGreaterThan(intervals[3]);
  });
});

// ── preserves questionId ───────────────────────────────────────────────────────

describe('applySM2 — identity fields', () => {
  it('preserves questionId', () => {
    const entry = freshEntry('my-question');
    const result = applySM2(entry, 5, NOW);
    expect(result.questionId).toBe('my-question');
  });
});
