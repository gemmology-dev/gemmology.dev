/**
 * Due-aware question selector — full implementation.
 *
 * Track T2 (`.trees/study-algorithms`) owns this file.
 *
 * See V1-PLAN.md §5.2.
 */

import type { CategoryBudget, SelectionRequest, StudyStore } from './study-types';
import type { Category } from './question-types';

/** Selection result is a list of question IDs in presentation order. */
export type SelectionResult = string[];

/** Helper for tests / non-async callers. */
export interface ScheduleLookup {
  get(id: string): import('./study-types').ScheduleEntry | null;
}

/**
 * Pick `request.totalCount` question IDs from `request.pool` honouring:
 *  1. Due items first (up to `reviewMixRatio` of total, most overdue first).
 *  2. Fresh-fill: never-seen items (no schedule entry) for the remainder,
 *     distributed across categories per `request.budgets`.
 *  3. Stale-fallback: oldest `lastReviewed` items if still short.
 *  4. Result is interleaved in round-robin category order to prevent runs.
 *
 * V1-PLAN §5.2.
 */
export async function selectQuestionsV2(
  request: SelectionRequest,
  store: Pick<StudyStore, 'getSchedule' | 'getDueItems'>,
): Promise<SelectionResult> {
  const { pool, budgets, totalCount, settings, now } = request;

  // Index pool items by id for fast lookup.
  const poolById = new Map(pool.map((item) => [item.id, item]));
  const poolIds = new Set(pool.map((item) => item.id));

  // ── 1. Due items ──────────────────────────────────────────────────────────
  const allDueIds = await store.getDueItems(now);
  // Intersect with pool.
  const dueInPool = allDueIds.filter((id) => poolIds.has(id));

  // Fetch schedules for due items to sort by most overdue (lowest nextDue first).
  const dueWithSchedule: Array<{ id: string; nextDue: number }> = [];
  for (const id of dueInPool) {
    const sched = await store.getSchedule(id);
    dueWithSchedule.push({ id, nextDue: sched?.nextDue ?? 0 });
  }
  // Most overdue = smallest nextDue relative to now.
  dueWithSchedule.sort((a, b) => a.nextDue - b.nextDue);

  const dueBudget = Math.floor(totalCount * settings.reviewMixRatio);
  const selectedDue = dueWithSchedule.slice(0, dueBudget).map((d) => d.id);
  const selectedSet = new Set(selectedDue);

  // ── 2. Fresh-fill per category budget ─────────────────────────────────────
  // Remaining slots after due items.
  let remaining = totalCount - selectedDue.length;

  // Build per-category remaining budgets, subtracting already-selected due items.
  const budgetMap = new Map<Category, number>(budgets.map((b) => [b.category, b.count]));
  for (const id of selectedDue) {
    const item = poolById.get(id);
    if (item) {
      const cat = item.category;
      budgetMap.set(cat, (budgetMap.get(cat) ?? 0) - 1);
    }
  }

  // Collect fresh (never-seen) items per category.
  const freshByCategory = new Map<Category, string[]>();
  for (const [cat] of budgetMap) {
    freshByCategory.set(cat, []);
  }

  for (const id of poolIds) {
    if (selectedSet.has(id)) continue;
    const item = poolById.get(id)!;
    const sched = await store.getSchedule(id);
    if (sched === null) {
      // Never seen.
      const catList = freshByCategory.get(item.category);
      if (catList !== undefined) catList.push(id);
    }
  }

  const selectedFresh: string[] = [];
  for (const [cat, catBudget] of budgetMap) {
    if (catBudget <= 0 || remaining <= 0) continue;
    const fresh = freshByCategory.get(cat) ?? [];
    const take = Math.min(catBudget, remaining, fresh.length);
    for (let i = 0; i < take; i++) {
      selectedFresh.push(fresh[i]);
      selectedSet.add(fresh[i]);
    }
    remaining -= take;
  }

  // ── 3. Stale-fallback ─────────────────────────────────────────────────────
  // Stale items = reviewed but NOT currently due and not yet selected.
  // Explicitly exclude due-in-pool items that weren't chosen within the due budget.
  const dueInPoolSet = new Set(dueInPool);
  const selectedStale: string[] = [];
  if (remaining > 0) {
    const staleItems: Array<{ id: string; lastReviewed: number }> = [];
    for (const id of poolIds) {
      if (selectedSet.has(id)) continue;
      if (dueInPoolSet.has(id)) continue; // skip un-budgeted due items
      const sched = await store.getSchedule(id);
      if (sched !== null) {
        staleItems.push({ id, lastReviewed: sched.lastReviewed });
      }
    }
    // Oldest first (smallest lastReviewed).
    staleItems.sort((a, b) => a.lastReviewed - b.lastReviewed);
    for (const { id } of staleItems.slice(0, remaining)) {
      selectedStale.push(id);
      selectedSet.add(id);
    }
  }

  // ── 4. Round-robin interleaving across categories ─────────────────────────
  const all = [...selectedDue, ...selectedFresh, ...selectedStale];
  return roundRobinInterleave(all, poolById);
}

/**
 * Interleave a flat list of IDs by their category in true round-robin order:
 * one item per category per cycle, so consecutive items are from different
 * categories (when multiple categories are present).
 */
function roundRobinInterleave(
  ids: string[],
  poolById: Map<string, { id: string; category: Category }>,
): string[] {
  // Group by category preserving encounter order within each category.
  const byCategory = new Map<Category, string[]>();
  for (const id of ids) {
    const item = poolById.get(id);
    if (!item) continue;
    const cat = item.category;
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(id);
  }

  const queues = Array.from(byCategory.values());
  const result: string[] = [];
  let cycleStart = 0;

  // Each outer iteration picks ONE item from the next non-empty queue.
  while (result.length < ids.length) {
    let pickedAny = false;
    for (let q = 0; q < queues.length; q++) {
      const queue = queues[(cycleStart + q) % queues.length];
      if (queue.length > 0) {
        result.push(queue.shift()!);
        pickedAny = true;
        // Advance cycleStart so the next pick starts from the following queue.
        cycleStart = (cycleStart + q + 1) % queues.length;
        break;
      }
    }
    if (!pickedAny) break;
  }
  return result;
}
