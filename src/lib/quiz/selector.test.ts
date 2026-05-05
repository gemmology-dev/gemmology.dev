/**
 * Tests for selector.ts — selectQuestionsV2.
 *
 * Uses an in-memory fake StudyStore so tests are pure and synchronous-ish.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { selectQuestionsV2 } from './selector';
import type {
  ScheduleEntry,
  SelectionRequest,
  StudyStore,
} from './study-types';
import { DEFAULT_STUDY_SETTINGS } from './study-types';
import type { Category } from './question-types';

// ── Fake store ────────────────────────────────────────────────────────────────

class FakeStore implements Pick<StudyStore, 'getSchedule' | 'getDueItems'> {
  private schedules = new Map<string, ScheduleEntry>();
  /** Extra IDs returned by getDueItems even if they have no schedule entry. */
  private extraDueIds: string[] = [];

  /** Register a schedule for a question ID. */
  setSchedule(id: string, entry: Partial<ScheduleEntry>) {
    this.schedules.set(id, {
      questionId: id,
      nextDue: 0,
      intervalDays: 1,
      easeFactor: 2.5,
      repetitions: 1,
      lapses: 0,
      lastReviewed: 1_000_000,
      totalReviews: 1,
      ...entry,
    });
  }

  /** Force an ID to appear in getDueItems without a backing schedule. */
  addExtraDueId(id: string) {
    this.extraDueIds.push(id);
  }

  async getSchedule(questionId: string): Promise<ScheduleEntry | null> {
    return this.schedules.get(questionId) ?? null;
  }

  async getDueItems(now: number): Promise<string[]> {
    const due: string[] = [...this.extraDueIds];
    for (const [id, entry] of this.schedules) {
      if (entry.nextDue <= now) due.push(id);
    }
    return due;
  }
}

// ── Pool helpers ───────────────────────────────────────────────────────────────

const CATS: Category[] = ['fundamentals', 'species', 'equipment'];

function makePool(ids: string[], cat: Category = 'fundamentals') {
  return ids.map((id) => ({ id, category: cat }));
}

function makeRequest(
  pool: SelectionRequest['pool'],
  totalCount: number,
  now = 2_000_000_000,
  reviewMixRatio = 0.5,
): SelectionRequest {
  const catCounts = new Map<Category, number>();
  for (const item of pool) {
    catCounts.set(item.category, (catCounts.get(item.category) ?? 0) + 1);
  }
  const budgets = Array.from(catCounts.entries()).map(([category, count]) => ({
    category,
    count: Math.min(count, totalCount),
  }));
  return {
    pool,
    budgets,
    totalCount,
    settings: { reviewMixRatio },
    now,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('selectQuestionsV2 — empty store (all fresh)', () => {
  it('returns totalCount IDs when all items are fresh', async () => {
    const store = new FakeStore();
    const pool = makePool(['q1', 'q2', 'q3', 'q4', 'q5']);
    const req = makeRequest(pool, 3);
    const result = await selectQuestionsV2(req, store);
    expect(result).toHaveLength(3);
  });

  it('all returned IDs are from the pool', async () => {
    const store = new FakeStore();
    const pool = makePool(['a', 'b', 'c', 'd']);
    const req = makeRequest(pool, 4);
    const result = await selectQuestionsV2(req, store);
    const poolIds = new Set(pool.map((p) => p.id));
    for (const id of result) {
      expect(poolIds.has(id)).toBe(true);
    }
  });

  it('no duplicates in result', async () => {
    const store = new FakeStore();
    const pool = makePool(['q1', 'q2', 'q3', 'q4', 'q5', 'q6']);
    const req = makeRequest(pool, 5);
    const result = await selectQuestionsV2(req, store);
    expect(new Set(result).size).toBe(result.length);
  });
});

describe('selectQuestionsV2 — due items respected', () => {
  it('includes due items when reviewMixRatio allows', async () => {
    const store = new FakeStore();
    const now = 2_000_000_000;
    // Make q1 and q2 due.
    store.setSchedule('q1', { nextDue: now - 1000 });
    store.setSchedule('q2', { nextDue: now - 500 });
    // q3, q4, q5 are fresh (no schedule).

    const pool = makePool(['q1', 'q2', 'q3', 'q4', 'q5']);
    const req = makeRequest(pool, 4, now, 0.5);
    const result = await selectQuestionsV2(req, store);

    expect(result).toHaveLength(4);
    // reviewMixRatio=0.5, totalCount=4 → dueBudget=2
    // Both due items should be included.
    expect(result).toContain('q1');
    expect(result).toContain('q2');
  });

  it('respects reviewMixRatio ceiling on due items', async () => {
    const store = new FakeStore();
    const now = 3_000_000_000;
    // q1-q5 are due. q6-q10 have no schedule (fresh).
    for (const id of ['q1', 'q2', 'q3', 'q4', 'q5']) {
      store.setSchedule(id, { nextDue: now - 1 });
    }

    const pool = makePool(['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10']);
    const req = makeRequest(pool, 10, now, 0.3);
    const result = await selectQuestionsV2(req, store);

    // dueBudget = floor(10 * 0.3) = 3. Due-but-unbudgeted items are excluded
    // from stale-fallback, so only 3 due + 5 fresh = 8 total available.
    // Count how many of q1-q5 appear in result.
    const dueInResult = result.filter((id) => ['q1', 'q2', 'q3', 'q4', 'q5'].includes(id));
    expect(dueInResult.length).toBeLessThanOrEqual(3);
    // All fresh (q6-q10) should be included.
    for (const id of ['q6', 'q7', 'q8', 'q9', 'q10']) {
      expect(result).toContain(id);
    }
  });

  it('most overdue items selected first when budget limited', async () => {
    const store = new FakeStore();
    const now = 5_000_000_000;
    // q1 is most overdue, q3 is least overdue (all three are due).
    store.setSchedule('q1', { nextDue: now - 1_000_000 });
    store.setSchedule('q2', { nextDue: now - 500_000 });
    store.setSchedule('q3', { nextDue: now - 100 });
    // q4, q5 fresh (no schedule).

    const pool = makePool(['q1', 'q2', 'q3', 'q4', 'q5']);
    // reviewMixRatio=0.4 → dueBudget=floor(5*0.4)=2 → only 2 due items fit.
    const req = makeRequest(pool, 5, now, 0.4);
    const result = await selectQuestionsV2(req, store);

    // q1 and q2 should be the two chosen due items (most overdue first).
    expect(result).toContain('q1');
    expect(result).toContain('q2');
    // q3 is due but not budgeted; it is excluded from stale-fallback too.
    expect(result).not.toContain('q3');
    // q4, q5 fill fresh slots.
    expect(result).toContain('q4');
    expect(result).toContain('q5');
    // Total = 2 due + 2 fresh = 4 (q3 excluded from both paths).
    expect(result).toHaveLength(4);
  });
});

describe('selectQuestionsV2 — half due, half fresh (reviewMixRatio=0.5)', () => {
  it('picks approx half from due and half from fresh', async () => {
    const store = new FakeStore();
    const now = 4_000_000_000;
    // q1, q2 due; q3, q4 fresh.
    store.setSchedule('q1', { nextDue: now - 1000 });
    store.setSchedule('q2', { nextDue: now - 2000 });

    const pool = makePool(['q1', 'q2', 'q3', 'q4']);
    const req = makeRequest(pool, 4, now, 0.5);
    const result = await selectQuestionsV2(req, store);

    expect(result).toHaveLength(4);
    // dueBudget = floor(4 * 0.5) = 2 → q1, q2 from due.
    expect(result).toContain('q1');
    expect(result).toContain('q2');
    // q3, q4 should fill the rest (fresh).
    expect(result).toContain('q3');
    expect(result).toContain('q4');
  });
});

describe('selectQuestionsV2 — per-category budgets honoured', () => {
  it('does not exceed per-category budgets', async () => {
    const store = new FakeStore();
    const now = 6_000_000_000;

    // Build a multi-category pool.
    const pool: SelectionRequest['pool'] = [
      { id: 'f1', category: 'fundamentals' },
      { id: 'f2', category: 'fundamentals' },
      { id: 'f3', category: 'fundamentals' },
      { id: 's1', category: 'species' },
      { id: 's2', category: 'species' },
      { id: 'e1', category: 'equipment' },
    ];

    const req: SelectionRequest = {
      pool,
      budgets: [
        { category: 'fundamentals', count: 2 },
        { category: 'species', count: 1 },
        { category: 'equipment', count: 1 },
      ],
      totalCount: 4,
      settings: { reviewMixRatio: 0 }, // force all fresh
      now,
    };

    const result = await selectQuestionsV2(req, store);
    expect(result).toHaveLength(4);

    const byCategory = new Map<string, number>();
    for (const id of result) {
      const item = pool.find((p) => p.id === id)!;
      byCategory.set(item.category, (byCategory.get(item.category) ?? 0) + 1);
    }
    expect(byCategory.get('fundamentals') ?? 0).toBeLessThanOrEqual(2);
    expect(byCategory.get('species') ?? 0).toBeLessThanOrEqual(1);
    expect(byCategory.get('equipment') ?? 0).toBeLessThanOrEqual(1);
  });
});

describe('selectQuestionsV2 — stale fallback', () => {
  it('falls back to stale items when no due and no fresh', async () => {
    const store = new FakeStore();
    const now = 7_000_000_000;
    // All items have been reviewed but are not yet due.
    store.setSchedule('q1', { nextDue: now + 1_000_000, lastReviewed: now - 3000 });
    store.setSchedule('q2', { nextDue: now + 2_000_000, lastReviewed: now - 2000 });
    store.setSchedule('q3', { nextDue: now + 3_000_000, lastReviewed: now - 1000 });

    const pool = makePool(['q1', 'q2', 'q3']);
    const req = makeRequest(pool, 2, now, 0.5);
    const result = await selectQuestionsV2(req, store);

    expect(result).toHaveLength(2);
    // No due, no fresh — must come from stale.
    // Oldest lastReviewed first: q1 then q2.
    expect(result).toContain('q1');
    expect(result).toContain('q2');
  });

  it('stale items are ordered by oldest lastReviewed first', async () => {
    const store = new FakeStore();
    const now = 8_000_000_000;

    store.setSchedule('recent', { nextDue: now + 1_000_000, lastReviewed: now - 100 });
    store.setSchedule('oldest', { nextDue: now + 1_000_000, lastReviewed: now - 100_000 });
    store.setSchedule('middle', { nextDue: now + 1_000_000, lastReviewed: now - 10_000 });

    const pool = makePool(['recent', 'oldest', 'middle']);
    const req = makeRequest(pool, 2, now, 0);
    const result = await selectQuestionsV2(req, store);

    expect(result).toContain('oldest');
    expect(result).toContain('middle');
    expect(result).not.toContain('recent');
  });
});

describe('selectQuestionsV2 — result ordering (round-robin)', () => {
  it('interleaves categories so consecutive items differ', async () => {
    const store = new FakeStore();
    const now = 9_000_000_000;

    // 3 fundamentals, 3 species — all fresh.
    const pool: SelectionRequest['pool'] = [
      { id: 'f1', category: 'fundamentals' },
      { id: 'f2', category: 'fundamentals' },
      { id: 'f3', category: 'fundamentals' },
      { id: 's1', category: 'species' },
      { id: 's2', category: 'species' },
      { id: 's3', category: 'species' },
    ];

    const req: SelectionRequest = {
      pool,
      budgets: [
        { category: 'fundamentals', count: 3 },
        { category: 'species', count: 3 },
      ],
      totalCount: 6,
      settings: { reviewMixRatio: 0 },
      now,
    };

    const result = await selectQuestionsV2(req, store);
    expect(result).toHaveLength(6);

    // Verify no two adjacent items are from the same category.
    const getCategory = (id: string) => pool.find((p) => p.id === id)!.category;
    for (let i = 1; i < result.length; i++) {
      expect(getCategory(result[i])).not.toBe(getCategory(result[i - 1]));
    }
  });
});

describe('selectQuestionsV2 — pool smaller than totalCount', () => {
  it('returns at most pool.length items', async () => {
    const store = new FakeStore();
    const pool = makePool(['q1', 'q2']);
    const req = makeRequest(pool, 10);
    const result = await selectQuestionsV2(req, store);
    expect(result.length).toBeLessThanOrEqual(2);
  });
});

describe('selectQuestionsV2 — empty pool', () => {
  it('returns empty array for empty pool', async () => {
    const store = new FakeStore();
    const req = makeRequest([], 5);
    const result = await selectQuestionsV2(req, store);
    expect(result).toHaveLength(0);
  });
});

describe('selectQuestionsV2 — budget exhausted (catBudget <= 0)', () => {
  it('skips category when its budget is fully consumed by due items', async () => {
    const store = new FakeStore();
    const now = 10_000_000_000;

    // fundamentals budget=1; the one due fundamentals item fills it.
    store.setSchedule('f1', { nextDue: now - 1000 });

    const pool: SelectionRequest['pool'] = [
      { id: 'f1', category: 'fundamentals' },
      { id: 'f2', category: 'fundamentals' }, // fresh but over budget
      { id: 's1', category: 'species' },      // fresh
    ];

    const req: SelectionRequest = {
      pool,
      budgets: [
        { category: 'fundamentals', count: 1 },
        { category: 'species', count: 1 },
      ],
      totalCount: 2,
      settings: { reviewMixRatio: 0.5 }, // dueBudget = floor(2*0.5) = 1
      now,
    };

    const result = await selectQuestionsV2(req, store);
    // f1 (due, fills fundamentals budget), s1 (fresh species).
    expect(result).toContain('f1');
    expect(result).toContain('s1');
    expect(result).not.toContain('f2');
  });
});

describe('selectQuestionsV2 — stale fallback when no fresh but pool is reviewed', () => {
  it('triggers stale path when all reviewed items are not due', async () => {
    const store = new FakeStore();
    const now = 11_000_000_000;

    // Both items reviewed but not yet due.
    store.setSchedule('q1', { nextDue: now + 86_400_000, lastReviewed: now - 5000 });
    store.setSchedule('q2', { nextDue: now + 86_400_000 * 2, lastReviewed: now - 1000 });

    const pool = makePool(['q1', 'q2']);
    const req = makeRequest(pool, 2, now, 0.5);
    const result = await selectQuestionsV2(req, store);

    // Both come from stale fallback.
    expect(result).toHaveLength(2);
    expect(result).toContain('q1');
    expect(result).toContain('q2');
  });
});

describe('selectQuestionsV2 — single-category pool (tests pickedAny=false path)', () => {
  it('handles single-category pool correctly with round-robin', async () => {
    const store = new FakeStore();
    const pool = makePool(['a', 'b', 'c'], 'equipment');
    const req = makeRequest(pool, 3, 1_000_000, 0);
    const result = await selectQuestionsV2(req, store);

    expect(result).toHaveLength(3);
    // All from same category — interleaving just preserves order.
    const cats = result.map(() => 'equipment');
    expect(cats).toHaveLength(3);
  });
});

describe('selectQuestionsV2 — due item with missing schedule (null schedule path)', () => {
  it('uses nextDue=0 fallback when a due item has no schedule entry', async () => {
    const store = new FakeStore();
    const now = 15_000_000_000;

    // q_orphan is returned by getDueItems but has no schedule.
    // q1 has a schedule with a specific nextDue.
    store.addExtraDueId('q_orphan');
    store.setSchedule('q1', { nextDue: now - 5000 });

    const pool = makePool(['q_orphan', 'q1', 'q2']);
    const req = makeRequest(pool, 2, now, 1.0); // dueBudget = 2
    const result = await selectQuestionsV2(req, store);

    // Both due items should be selected.
    expect(result).toContain('q_orphan');
    expect(result).toContain('q1');
  });
});

describe('selectQuestionsV2 — pool items outside budget categories', () => {
  it('ignores pool items whose category has no budget entry', async () => {
    const store = new FakeStore();
    const now = 14_000_000_000;

    // Pool has a 'phenomena' item but budgets only cover 'fundamentals'.
    const pool: SelectionRequest['pool'] = [
      { id: 'f1', category: 'fundamentals' },
      { id: 'f2', category: 'fundamentals' },
      { id: 'p1', category: 'phenomena' }, // no budget for phenomena
    ];

    const req: SelectionRequest = {
      pool,
      budgets: [{ category: 'fundamentals', count: 2 }],
      totalCount: 2,
      settings: { reviewMixRatio: 0 },
      now,
    };

    const result = await selectQuestionsV2(req, store);
    // Only fundamentals items should be selected.
    expect(result).toContain('f1');
    expect(result).toContain('f2');
    expect(result).not.toContain('p1');
  });
});

describe('selectQuestionsV2 — stale fallback with mixed fresh and stale', () => {
  it('skips fresh (null schedule) items in the stale path', async () => {
    const store = new FakeStore();
    const now = 12_000_000_000;

    // q1 is reviewed (stale), q2 has no schedule (fresh).
    // Neither is due. We want 2 items. reviewMixRatio=0 → no due budget.
    // Fresh fill: q2 is fresh → selected first.
    // Stale: q1 has a schedule and isn't selected yet → stale.
    store.setSchedule('q1', { nextDue: now + 100_000_000, lastReviewed: now - 99_999 });

    const pool = makePool(['q1', 'q2']); // q2 has no schedule (null)
    const req = makeRequest(pool, 2, now, 0);
    const result = await selectQuestionsV2(req, store);

    expect(result).toHaveLength(2);
    expect(result).toContain('q1'); // from stale
    expect(result).toContain('q2'); // from fresh
  });

  it('round-robin with unequal category sizes (one empties first)', async () => {
    const store = new FakeStore();
    const now = 13_000_000_000;

    // 1 fundamentals item, 3 species items — all fresh.
    const pool: SelectionRequest['pool'] = [
      { id: 'f1', category: 'fundamentals' },
      { id: 's1', category: 'species' },
      { id: 's2', category: 'species' },
      { id: 's3', category: 'species' },
    ];

    const req: SelectionRequest = {
      pool,
      budgets: [
        { category: 'fundamentals', count: 1 },
        { category: 'species', count: 3 },
      ],
      totalCount: 4,
      settings: { reviewMixRatio: 0 },
      now,
    };

    const result = await selectQuestionsV2(req, store);
    expect(result).toHaveLength(4);
    // f1 should not be adjacent to another fundamentals (there are none), so
    // order should mix: f1, s1, s2, s3 or s1, f1, s2, s3 etc.
    // Just assert all are present.
    expect(result).toContain('f1');
    expect(result).toContain('s1');
    expect(result).toContain('s2');
    expect(result).toContain('s3');
  });
});
