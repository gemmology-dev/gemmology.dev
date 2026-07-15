/**
 * Study Challenge Tracks — pure logic (Phase 1).
 *
 * Maps `challenges` content-collection entries (src/content/challenges/*.yaml,
 * validated by the Zod schema in src/content/config.ts) into ordered,
 * fully-resolved question lists for each stage of a track.
 *
 * Pure module: no `astro:content` import, so it can be unit tested with plain
 * fixture objects, mirroring the style of curated-questions.ts. The caller
 * (src/pages/study/challenges/*.astro) is responsible for calling
 * `getCollection('challenges')` and `getCollection('questions')`, mapping the
 * latter through `mapCuratedQuestions` to build the `pool`, then passing both
 * into `resolveTrackStages`.
 */

import type { Category, Question } from './question-types';

/** Locally-declared mirror of the `challengeStageSchema` shape in src/content/config.ts. */
export interface ChallengeStageSource {
  id: string;
  title: string;
  description?: string;
  /** Explicit-ids path: an ordered set of curated question ids. */
  questionIds?: string[];
  /** Tag-fallback path: pull `count` questions matching conceptTags. */
  conceptTags?: string[];
  tagMatch: 'all' | 'any';
  count?: number;
  passThreshold: number;
}

/** Locally-declared mirror of the `challengeTrackSchema` shape in src/content/config.ts. */
export interface ChallengeTrackSource {
  id: string;
  title: string;
  description: string;
  icon?: string;
  categoryAffinity?: Category;
  conceptTags?: string[];
  estimatedMinutes?: number;
  stages: ChallengeStageSource[];
}

/** A stage with its `questionIds`/`conceptTags` selection fully resolved to `Question[]`. */
export interface ResolvedStage {
  id: string;
  title: string;
  description?: string;
  passThreshold: number;
  questions: Question[];
}

/**
 * Resolve a single stage's questions from the question pool.
 *
 * - Explicit-ids path (`questionIds` present): preserves the authored order.
 *   Missing ids are skipped (with a `console.warn`) rather than throwing, so
 *   a single stale reference in curated content never breaks the build or
 *   the page.
 * - Tag-fallback path (`conceptTags` + `count`): filters the pool by
 *   `tagMatch` ('all' requires every tag to be present on the question, 'any'
 *   requires at least one), sorts the matches by question id for a
 *   deterministic order, then truncates to `count`.
 */
export function resolveStageQuestions(
  stage: ChallengeStageSource,
  pool: Question[],
): Question[] {
  if (stage.questionIds && stage.questionIds.length > 0) {
    const byId = new Map(pool.map(q => [q.id, q] as const));
    const resolved: Question[] = [];
    for (const id of stage.questionIds) {
      const question = byId.get(id);
      if (!question) {
        console.warn(
          `[challenges] stage "${stage.id}": questionId "${id}" not found in question pool — skipping.`,
        );
        continue;
      }
      resolved.push(question);
    }
    return resolved;
  }

  if (stage.conceptTags && stage.conceptTags.length > 0 && stage.count) {
    const tags = stage.conceptTags;
    const matched = pool.filter(q => {
      const qTags = q.conceptTags ?? [];
      return stage.tagMatch === 'any'
        ? tags.some(t => qTags.includes(t))
        : tags.every(t => qTags.includes(t));
    });
    matched.sort((a, b) => a.id.localeCompare(b.id));
    return matched.slice(0, stage.count);
  }

  // Defensive: the content schema's refine() requires one of the two paths
  // above, but a malformed source (e.g. hand-built fixture) falls through
  // to an empty stage rather than throwing.
  return [];
}

/** Resolve every stage of a track into fully-ordered question lists. */
export function resolveTrackStages(
  track: ChallengeTrackSource,
  pool: Question[],
): ResolvedStage[] {
  return track.stages.map(stage => ({
    id: stage.id,
    title: stage.title,
    description: stage.description,
    passThreshold: stage.passThreshold,
    questions: resolveStageQuestions(stage, pool),
  }));
}

/** Whether a stage attempt clears its pass threshold. Zero-question stages never pass. */
export function trackStagePassed(
  passThreshold: number,
  correct: number,
  total: number,
): boolean {
  if (total <= 0) return false;
  return correct / total >= passThreshold;
}
