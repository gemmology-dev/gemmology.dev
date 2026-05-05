/**
 * Due-aware question selector — contract.
 *
 * Track T2 owns the implementation. See V1-PLAN.md §5.2.
 */

import type { ScheduleEntry, SelectionRequest, StudyStore } from './study-types';

/** Selection result is a list of question IDs in presentation order. */
export type SelectionResult = string[];

/** Helper for tests / non-async callers. */
export interface ScheduleLookup {
  get(id: string): ScheduleEntry | null;
}

/**
 * Pick `request.totalCount` question IDs from `request.pool` honouring:
 *  1. Due items first (up to `reviewMixRatio` of total).
 *  2. Fresh-fill: never-seen items for the remainder.
 *  3. Stale-fallback: if no due and no fresh, oldest reviewed.
 *
 * Implementation deferred to track T2.
 */
export async function selectQuestionsV2(
  _request: SelectionRequest,
  _store: Pick<StudyStore, 'getSchedule' | 'getDueItems'>,
): Promise<SelectionResult> {
  throw new Error(
    'selectQuestionsV2: implementation deferred to track T2 (study-algorithms)',
  );
}
