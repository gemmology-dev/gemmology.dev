/**
 * Barrel export for the Lab Simulation cases library (Phase 3).
 * Mirrors the export-barrel convention in src/lib/quiz/index.ts.
 */

export type {
  EvidenceKind,
  EvidenceItem,
  CaseOptionWeight,
  CaseCandidate,
  CaseOption,
  CaseStepType,
  CaseToolLink,
  CaseStep,
  CaseGroundTruth,
  CaseDebriefInfo,
  CaseReference,
  CaseDefinition,
  DecisionRecord,
  CaseRunStatus,
  CaseRunnerState,
  CaseResult,
} from './case-types';

export {
  getGrade,
  scoreDecision,
  computeMaxScore,
  computeRawScore,
  computePercentage,
  computeParTimeCost,
  computeTotalTimeCost,
  computeEfficiencyBonus,
  buildCaseResult,
} from './scoring';

export type { CaseSource, CaseStepSource } from './mapper';
export { mapCaseSource, mapCaseSources } from './mapper';

export type { CaseStoredEntry } from './store';
export { CASE_STORAGE_KEY, LocalCaseStore, getCaseStore } from './store';
