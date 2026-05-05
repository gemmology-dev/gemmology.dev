/**
 * Near-miss interleaver — full implementation.
 *
 * Track T2 (`.trees/study-algorithms`) owns this file.
 *
 * See V1-PLAN.md §5.3.
 */

/**
 * Re-order a list of question IDs so that items declared as confusion pairs
 * for each other are spaced ≥ `minSpacing` positions apart.
 *
 * Algorithm (greedy, deterministic given input order):
 *  Walk the list. When placing item at position i, check if it is a confusion
 *  partner of any item already placed within the last `minSpacing` positions.
 *  If so, swap it forward with the next safe candidate (earliest item in the
 *  not-yet-placed tail that does NOT conflict). If no safe swap exists, accept
 *  the violation and continue.
 *
 * Pure and deterministic: same input always produces same output.
 *
 * V1-PLAN §5.3.
 */
export function interleaveNearMisses(
  ids: ReadonlyArray<string>,
  confusionPairs: ReadonlyMap<string, string[]>,
  minSpacing: number = 3,
): string[] {
  // Work on a mutable copy.
  const result: string[] = [];
  const remaining = [...ids];

  while (remaining.length > 0) {
    // Index of the current candidate (first in remaining).
    let chosen = 0;

    // Check if placing remaining[chosen] here violates minSpacing with any
    // already-placed item.
    const candidate = remaining[chosen];
    if (causesConflict(candidate, result, confusionPairs, minSpacing)) {
      // Search forward for a safe swap candidate.
      let safeIdx = -1;
      for (let j = 1; j < remaining.length; j++) {
        if (!causesConflict(remaining[j], result, confusionPairs, minSpacing)) {
          safeIdx = j;
          break;
        }
      }

      if (safeIdx !== -1) {
        chosen = safeIdx;
      }
      // else: accept the violation and use chosen = 0.
    }

    // Remove from remaining and push to result.
    const [picked] = remaining.splice(chosen, 1);
    result.push(picked);
  }

  return result;
}

/**
 * Returns true if placing `id` at the current tail of `placed` would put it
 * within `minSpacing` positions of any of its confusion partners.
 */
function causesConflict(
  id: string,
  placed: string[],
  confusionPairs: ReadonlyMap<string, string[]>,
  minSpacing: number,
): boolean {
  const partners = confusionPairs.get(id);
  if (!partners || partners.length === 0) return false;

  const partnerSet = new Set(partners);
  const start = Math.max(0, placed.length - minSpacing);
  for (let i = start; i < placed.length; i++) {
    if (partnerSet.has(placed[i])) return true;
  }
  return false;
}
