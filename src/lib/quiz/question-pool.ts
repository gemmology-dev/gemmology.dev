/**
 * Due-aware session question selection (A4c — highest risk, landed last).
 *
 * Wraps selector.ts's `selectQuestionsV2` (the pure, store-driven due/new/
 * stale algorithm) so the main quiz entry point can offer spaced-repetition
 * aware sessions while preserving two hard guarantees:
 *
 *  1. Curated-first pool order is preserved — `selectQuestionsV2` returns
 *     question ids; we project them back to `Question` objects through a
 *     map built from the (curated-first-ordered) filtered pool, and any
 *     shortfall is backfilled from the same pool in its original order.
 *  2. A broken store (rejected promise, thrown error, corrupted data) can
 *     never block quiz start — `selectSessionQuestions` always resolves,
 *     falling back to the existing `shuffle().slice()` behaviour
 *     (`selectQuestions` from question-generator.ts) on any failure.
 */

import type { Question, QuizConfig, Category } from './question-types';
import type { StudyStore, StudySettings, CategoryBudget, SelectionRequest } from './study-types';
import { selectQuestionsV2 } from './selector';
import { selectQuestions } from './question-generator';
import { isRenderable } from './question-validity';

/** Store dependency actually used by the selector (kept narrow for testing). */
export type QuestionPoolStore = Pick<StudyStore, 'getSchedule' | 'getDueItems'>;

/**
 * Select the questions for a session, preferring due-aware selection and
 * falling back to the current shuffle-and-slice behaviour if anything throws
 * (e.g. a corrupted or unavailable store) so quiz start is never blocked.
 */
export async function selectSessionQuestions(
  pool: Question[],
  config: QuizConfig,
  store: QuestionPoolStore,
  settings: Pick<StudySettings, 'reviewMixRatio'>
): Promise<Question[]> {
  try {
    return await selectDueAware(pool, config, store, settings);
  } catch (err) {
    console.warn(
      '[question-pool] due-aware selection failed, falling back to shuffle().slice():',
      err
    );
    return selectQuestions(pool, config);
  }
}

/** Evenly split `totalCount` across `categories`, extras going to the first ones. Sums exactly to totalCount. */
function distributeBudget(totalCount: number, categories: Category[]): CategoryBudget[] {
  const n = categories.length;
  if (n === 0) return [];
  const base = Math.floor(totalCount / n);
  let extra = totalCount - base * n;
  return categories.map(category => {
    const count = base + (extra > 0 ? 1 : 0);
    if (extra > 0) extra--;
    return { category, count };
  });
}

async function selectDueAware(
  pool: Question[],
  config: QuizConfig,
  store: QuestionPoolStore,
  settings: Pick<StudySettings, 'reviewMixRatio'>
): Promise<Question[]> {
  // Same pre-filtering as the legacy path: renderable, category, difficulty.
  let filtered = pool.filter(isRenderable);
  if (config.categories.length > 0) {
    filtered = filtered.filter(q => config.categories.includes(q.category));
  }
  if (config.difficulty && config.difficulty.length > 0) {
    filtered = filtered.filter(q => config.difficulty!.includes(q.difficulty));
  }

  if (filtered.length === 0) return [];

  const totalCount = Math.min(config.questionCount, filtered.length);
  const categoriesInPool = Array.from(new Set(filtered.map(q => q.category)));
  const budgets = distributeBudget(totalCount, categoriesInPool);

  const request: SelectionRequest = {
    pool: filtered.map(q => ({ id: q.id, category: q.category })),
    budgets,
    totalCount,
    settings,
    now: Date.now(),
  };

  const ids = await selectQuestionsV2(request, store);

  // Project ids back to Question objects, de-duplicating defensively.
  const byId = new Map(filtered.map(q => [q.id, q]));
  const selected: Question[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    const q = byId.get(id);
    if (q && !seen.has(id)) {
      selected.push(q);
      seen.add(id);
    }
  }

  // Backfill from the remaining pool (curated-first order preserved) if the
  // selector came up short for any reason — never leave a session smaller
  // than requested when enough renderable questions exist.
  if (selected.length < totalCount) {
    for (const q of filtered) {
      if (selected.length >= totalCount) break;
      if (!seen.has(q.id)) {
        selected.push(q);
        seen.add(q.id);
      }
    }
  }

  return selected;
}
