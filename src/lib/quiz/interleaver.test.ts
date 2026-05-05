/**
 * Tests for interleaver.ts — interleaveNearMisses.
 *
 * Verifies:
 *  - Confusion pairs are spaced ≥ minSpacing apart
 *  - Deterministic: same input always produces same output
 *  - Graceful fallback when constraint cannot be satisfied
 *  - No-op when no confusion pairs
 *  - Input IDs all present in output (no loss / no duplication)
 */

import { describe, it, expect } from 'vitest';
import { interleaveNearMisses } from './interleaver';

// ── helpers ───────────────────────────────────────────────────────────────────

function pairs(map: Record<string, string[]>): ReadonlyMap<string, string[]> {
  return new Map(Object.entries(map));
}

/** Check that every confusion pair in the map is ≥ minSpacing apart in result. */
function assertSpaced(result: string[], confusionPairs: ReadonlyMap<string, string[]>, minSpacing: number) {
  for (const [id, partners] of confusionPairs) {
    const idxA = result.indexOf(id);
    if (idxA === -1) continue;
    for (const partner of partners) {
      const idxB = result.indexOf(partner);
      if (idxB === -1) continue;
      const distance = Math.abs(idxA - idxB);
      expect(distance).toBeGreaterThanOrEqual(minSpacing);
    }
  }
}

// ── basic correctness ─────────────────────────────────────────────────────────

describe('interleaveNearMisses — basic correctness', () => {
  it('preserves all input IDs (no additions, no deletions)', () => {
    const ids = ['a', 'b', 'c', 'd', 'e'];
    const result = interleaveNearMisses(ids, pairs({ a: ['b'] }), 3);
    expect(result.sort()).toEqual([...ids].sort());
  });

  it('no duplicates in output', () => {
    const ids = ['a', 'b', 'c', 'd'];
    const result = interleaveNearMisses(ids, pairs({ a: ['b'] }), 2);
    expect(new Set(result).size).toBe(result.length);
  });

  it('returns empty array for empty input', () => {
    const result = interleaveNearMisses([], pairs({}), 3);
    expect(result).toEqual([]);
  });

  it('single-item input is unchanged', () => {
    const result = interleaveNearMisses(['only'], pairs({}), 3);
    expect(result).toEqual(['only']);
  });
});

// ── no confusion pairs — input preserved in order ────────────────────────────

describe('interleaveNearMisses — no confusion pairs', () => {
  it('returns input order when no pairs defined', () => {
    const ids = ['a', 'b', 'c', 'd', 'e'];
    const result = interleaveNearMisses(ids, new Map(), 3);
    expect(result).toEqual(ids);
  });

  it('returns input order when pairs map is empty', () => {
    const ids = ['x', 'y', 'z'];
    const result = interleaveNearMisses(ids, pairs({}), 3);
    expect(result).toEqual(ids);
  });
});

// ── spacing enforcement ───────────────────────────────────────────────────────

describe('interleaveNearMisses — spacing enforcement', () => {
  it('spaces confusion pair ≥ 3 apart (default)', () => {
    // 'a' and 'b' start adjacent; should be spaced out.
    const ids = ['a', 'b', 'c', 'd', 'e', 'f'];
    const cp = pairs({ a: ['b'], b: ['a'] });
    const result = interleaveNearMisses(ids, cp, 3);
    assertSpaced(result, cp, 3);
  });

  it('spaces confusion pair ≥ 2 apart when minSpacing=2', () => {
    const ids = ['a', 'b', 'c', 'd'];
    const cp = pairs({ a: ['b'], b: ['a'] });
    const result = interleaveNearMisses(ids, cp, 2);
    assertSpaced(result, cp, 2);
  });

  it('spaces multiple disjoint pairs', () => {
    const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const cp = pairs({ a: ['b'], b: ['a'], c: ['d'], d: ['c'] });
    const result = interleaveNearMisses(ids, cp, 3);
    assertSpaced(result, cp, 3);
  });

  it('spaces overlapping confusion sets (a confused with b and c)', () => {
    const ids = ['a', 'b', 'c', 'd', 'e', 'f'];
    const cp = pairs({ a: ['b', 'c'], b: ['a'], c: ['a'] });
    const result = interleaveNearMisses(ids, cp, 2);
    assertSpaced(result, cp, 2);
  });
});

// ── determinism ───────────────────────────────────────────────────────────────

describe('interleaveNearMisses — determinism', () => {
  it('same inputs always produce same output', () => {
    const ids = ['a', 'b', 'c', 'd', 'e', 'f'];
    const cp = pairs({ a: ['b'], b: ['a'] });
    const r1 = interleaveNearMisses(ids, cp, 3);
    const r2 = interleaveNearMisses(ids, cp, 3);
    const r3 = interleaveNearMisses(ids, cp, 3);
    expect(r1).toEqual(r2);
    expect(r1).toEqual(r3);
  });

  it('different input orders produce deterministic (possibly different) outputs', () => {
    const cp = pairs({ a: ['b'], b: ['a'] });
    const r1 = interleaveNearMisses(['a', 'b', 'c', 'd'], cp, 3);
    const r2 = interleaveNearMisses(['b', 'a', 'c', 'd'], cp, 3);
    // Both must be self-consistent — calling twice each gives the same result.
    expect(r1).toEqual(interleaveNearMisses(['a', 'b', 'c', 'd'], cp, 3));
    expect(r2).toEqual(interleaveNearMisses(['b', 'a', 'c', 'd'], cp, 3));
  });
});

// ── fallback when constraint cannot be satisfied ──────────────────────────────

describe('interleaveNearMisses — impossible constraint fallback', () => {
  it('returns a valid permutation even when spacing is impossible', () => {
    // Only 2 items; minSpacing=5 is impossible.
    const ids = ['a', 'b'];
    const cp = pairs({ a: ['b'], b: ['a'] });
    const result = interleaveNearMisses(ids, cp, 5);
    // Must still contain both items, no duplicates.
    expect(result.sort()).toEqual(['a', 'b']);
  });

  it('handles fully entangled pairs (all confused with all)', () => {
    const ids = ['a', 'b', 'c'];
    const cp = pairs({ a: ['b', 'c'], b: ['a', 'c'], c: ['a', 'b'] });
    // minSpacing=3 is impossible for 3 items.
    const result = interleaveNearMisses(ids, cp, 3);
    expect(result.sort()).toEqual(['a', 'b', 'c']);
  });

  it('accepts violation gracefully and terminates', () => {
    // Ensure no infinite loop.
    const ids = Array.from({ length: 10 }, (_, i) => `q${i}`);
    const allPairs: Record<string, string[]> = {};
    for (const id of ids) allPairs[id] = ids.filter((x) => x !== id);
    const cp = pairs(allPairs);

    // Should complete (not hang).
    const result = interleaveNearMisses(ids, cp, 9);
    expect(result).toHaveLength(10);
  });
});

// ── large input ───────────────────────────────────────────────────────────────

describe('interleaveNearMisses — larger inputs', () => {
  it('correctly spaces 20 items with 5 confusion pairs', () => {
    const ids = Array.from({ length: 20 }, (_, i) => `q${i}`);
    const cp = pairs({
      q0: ['q1'],
      q1: ['q0'],
      q5: ['q6'],
      q6: ['q5'],
      q10: ['q11'],
      q11: ['q10'],
      q15: ['q16'],
      q16: ['q15'],
    });
    const result = interleaveNearMisses(ids, cp, 3);
    expect(result).toHaveLength(20);
    expect(new Set(result).size).toBe(20);
    assertSpaced(result, cp, 3);
  });
});
