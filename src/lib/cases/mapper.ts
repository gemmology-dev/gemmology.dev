/**
 * Maps case content-collection entries (src/content/cases/**\/*.yaml, validated
 * by the Zod schema in src/content/config.ts) into the runtime `CaseDefinition`
 * shape consumed by useCaseRunner / CaseRunner.
 *
 * Pure module: no `astro:content` import, so it can be unit tested with plain
 * fixture objects (mirrors src/lib/quiz/curated-questions.ts). The caller
 * (src/pages/study/cases/[id].astro) calls `getCollection('cases')` and
 * passes the mapped `.data` shape in.
 *
 * The content schema and the runtime type are structurally very close (the
 * schema *is* the source of truth for shape), so this mapper is mostly a
 * defensive pass-through: it re-applies the same defaults the Zod schema
 * already applies (`pointsMultiplier` default 1, `unvetted` default false)
 * so this module stays correct even if called with data that bypassed the
 * schema (e.g. hand-built test fixtures).
 */

import type {
  CaseDefinition,
  CaseStep,
  CaseOption,
  EvidenceItem,
  CaseGroundTruth,
  CaseDebriefInfo,
  CaseReference,
} from './case-types';

/** Minimal shape of a single case content-collection entry. */
export interface CaseSource {
  id: string;
  title: string;
  difficulty: 'foundation' | 'intermediate' | 'diploma';
  estimatedMinutes: number;
  backstory: string;
  specimenSummary: string;
  groundTruth: CaseGroundTruth;
  steps: CaseStepSource[];
  debrief: CaseDebriefInfo;
  conceptTags?: string[];
  references?: CaseReference[];
  unvetted?: boolean;
}

export interface CaseStepSource {
  id: string;
  type: CaseStep['type'];
  prompt: string;
  evidenceRevealed?: EvidenceItem[];
  options: CaseOption[];
  pointsMultiplier?: number;
  learnLinks?: string[];
  toolLinks?: CaseStep['toolLinks'];
}

function mapStep(source: CaseStepSource): CaseStep {
  return {
    id: source.id,
    type: source.type,
    prompt: source.prompt,
    evidenceRevealed: source.evidenceRevealed,
    options: source.options,
    pointsMultiplier: source.pointsMultiplier ?? 1,
    learnLinks: source.learnLinks,
    toolLinks: source.toolLinks,
  };
}

/**
 * Maps one case content-collection source entry into the runtime
 * `CaseDefinition` shape. Returns `null` when the case is structurally
 * unusable — fewer than 3 steps, or no `final-identification` step — so
 * malformed content can never reach the runner UI. (`validate-cases.mjs`
 * and the Zod schema should already have caught this at author time; this
 * is a last-resort defensive check.)
 */
export function mapCaseSource(source: CaseSource): CaseDefinition | null {
  if (!Array.isArray(source.steps) || source.steps.length < 3) return null;
  const hasFinalIdentification = source.steps.some((s) => s.type === 'final-identification');
  if (!hasFinalIdentification) return null;

  return {
    id: source.id,
    title: source.title,
    difficulty: source.difficulty,
    estimatedMinutes: source.estimatedMinutes,
    backstory: source.backstory,
    specimenSummary: source.specimenSummary,
    groundTruth: source.groundTruth,
    steps: source.steps.map(mapStep),
    debrief: source.debrief,
    conceptTags: source.conceptTags,
    references: source.references,
    unvetted: source.unvetted ?? false,
  };
}

/** Maps a list of case sources, dropping any that fail to map. */
export function mapCaseSources(sources: CaseSource[]): CaseDefinition[] {
  const mapped: CaseDefinition[] = [];
  for (const source of sources) {
    const caseDef = mapCaseSource(source);
    if (caseDef) mapped.push(caseDef);
  }
  return mapped;
}
