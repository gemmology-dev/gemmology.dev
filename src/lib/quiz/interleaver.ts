/**
 * Near-miss interleaver — contract.
 *
 * Track T2 owns the implementation. See V1-PLAN.md §5.3.
 */

/**
 * Re-order a list of question IDs so that items declared `confusionPairs` for
 * each other are spaced ≥ N positions apart. Falls back to the input order
 * if the constraint cannot be satisfied.
 *
 * Implementation deferred to track T2.
 */
export function interleaveNearMisses(
  _ids: ReadonlyArray<string>,
  _confusionPairs: ReadonlyMap<string, string[]>,
  _minSpacing: number = 3,
): string[] {
  throw new Error(
    'interleaveNearMisses: implementation deferred to track T2 (study-algorithms)',
  );
}
