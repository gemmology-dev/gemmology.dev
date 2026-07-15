/**
 * Scoring for Lab Simulation cases.
 *
 * - Each decision's raw points are `option.score * step.pointsMultiplier`.
 * - `maxScore` is the sum, per step, of the best possible
 *   `option.score * step.pointsMultiplier` — i.e. what a perfect run scores.
 * - `percentage` is `round(rawScore / maxScore * 100)`, clamped to [0, 100].
 * - `grade` reuses `getGrade` from the quiz scoring module (same A–F bands).
 * - `efficiencyBonus` rewards resolving the case at or under a computed par
 *   time cost; it is always reported separately and never folded into the
 *   percentage.
 */

import { getGrade } from '../quiz/scoring';
import type { CaseDefinition, CaseOption, CaseStep, DecisionRecord, CaseResult } from './case-types';

export { getGrade };

/** Points awarded for choosing `option` on `step`. */
export function scoreDecision(option: CaseOption, step: CaseStep): number {
  return option.score * step.pointsMultiplier;
}

/** Sum, per step, of the best available `score * pointsMultiplier`. */
export function computeMaxScore(caseDef: CaseDefinition): number {
  return caseDef.steps.reduce((total, step) => {
    const best = step.options.reduce((max, option) => Math.max(max, option.score), 0);
    return total + best * step.pointsMultiplier;
  }, 0);
}

/** Sum of points actually awarded across all recorded decisions. */
export function computeRawScore(decisions: DecisionRecord[]): number {
  return decisions.reduce((total, decision) => total + decision.scoreAwarded, 0);
}

/** Clamped, rounded percentage. Returns 0 when `maxScore` is 0 (defensive; schema guarantees steps.length >= 3). */
export function computePercentage(rawScore: number, maxScore: number): number {
  if (maxScore <= 0) return 0;
  const pct = Math.round((rawScore / maxScore) * 100);
  return Math.min(100, Math.max(0, pct));
}

/**
 * The "par" time cost for a case: the sum, over every `choose-next-test`
 * step, of the minimum `timeCost` among that step's `optimal`-weight
 * options. This is *computed* from the authored data, never itself
 * authored, so it always stays in sync with whatever options a case
 * actually offers.
 *
 * A step with no optimal option (schema requires >= 1, so this is
 * defensive only) or where the optimal option(s) omit `timeCost`
 * contributes 0.
 */
export function computeParTimeCost(caseDef: CaseDefinition): number {
  return caseDef.steps.reduce((total, step) => {
    if (step.type !== 'choose-next-test') return total;
    const optimalCosts = step.options
      .filter((option) => option.weight === 'optimal')
      .map((option) => option.timeCost ?? 0);
    if (optimalCosts.length === 0) return total;
    return total + Math.min(...optimalCosts);
  }, 0);
}

/** Total time cost actually incurred across recorded decisions. */
export function computeTotalTimeCost(decisions: DecisionRecord[]): number {
  return decisions.reduce((total, decision) => total + decision.timeCostIncurred, 0);
}

/**
 * Efficiency bonus: `max(0, parTimeCost + 1 - totalTimeCost) * 2`, capped at
 * `round(maxScore * 0.1)`. The `+ 1` grants a one-unit grace margin over par
 * before the bonus starts shrinking, so an exactly-par run still earns a
 * bonus rather than zero.
 */
export function computeEfficiencyBonus(caseDef: CaseDefinition, decisions: DecisionRecord[]): number {
  const parTimeCost = computeParTimeCost(caseDef);
  const totalTimeCost = computeTotalTimeCost(decisions);
  const raw = Math.max(0, parTimeCost + 1 - totalTimeCost) * 2;
  const maxScore = computeMaxScore(caseDef);
  const cap = Math.round(maxScore * 0.1);
  return Math.min(raw, cap);
}

/** Build the final result summary for a completed case run. */
export function buildCaseResult(
  caseDef: CaseDefinition,
  decisions: DecisionRecord[],
  completedAt: number,
): CaseResult {
  const rawScore = computeRawScore(decisions);
  const maxScore = computeMaxScore(caseDef);
  const percentage = computePercentage(rawScore, maxScore);
  const efficiencyBonus = computeEfficiencyBonus(caseDef, decisions);

  return {
    caseId: caseDef.id,
    rawScore,
    maxScore,
    percentage,
    efficiencyBonus,
    grade: getGrade(percentage),
    decisions,
    completedAt,
  };
}
