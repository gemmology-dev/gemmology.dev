/**
 * Runtime types for Lab Simulation cases (Phase 3).
 *
 * These are plain TypeScript types (no `astro:content` import) so this
 * module — and everything that builds on it (scoring, mapper, store,
 * useCaseRunner) — can be unit-tested with plain fixtures, mirroring the
 * src/lib/quiz/challenges.ts convention.
 */

export type EvidenceKind =
  | 'visual'
  | 'ri'
  | 'sg'
  | 'birefringence'
  | 'optic-character'
  | 'pleochroism'
  | 'spectroscope'
  | 'uv-fluorescence'
  | 'chelsea-filter'
  | 'inclusion'
  | 'hardness'
  | 'other';

export interface EvidenceItem {
  id: string;
  kind: EvidenceKind;
  label: string;
  value: string;
  detail?: string;
  toolHref?: string;
}

export type CaseOptionWeight = 'optimal' | 'acceptable' | 'poor';

export interface CaseCandidate {
  familyId: string;
  name: string;
}

export interface CaseOption {
  id: string;
  text: string;
  weight: CaseOptionWeight;
  score: number;
  rationale: string;
  revealsEvidenceIds?: string[];
  candidatesAfter?: CaseCandidate[];
  timeCost?: number;
}

export type CaseStepType =
  | 'choose-next-test'
  | 'reading-interpretation'
  | 'candidate-narrowing'
  | 'final-identification'
  | 'treatment-call';

export interface CaseToolLink {
  href: string;
  label: string;
}

export interface CaseStep {
  id: string;
  type: CaseStepType;
  prompt: string;
  evidenceRevealed?: EvidenceItem[];
  options: CaseOption[];
  pointsMultiplier: number;
  learnLinks?: string[];
  toolLinks?: CaseToolLink[];
}

export interface CaseGroundTruth {
  speciesFamilyId: string;
  variety?: string;
  treatment?: string;
  originNote?: string;
}

export interface CaseDebriefInfo {
  summary: string;
  expertPath: string[];
  furtherReading?: string[];
}

export interface CaseReference {
  id: string;
  citation: string;
  url?: string;
}

export interface CaseDefinition {
  id: string;
  title: string;
  difficulty: 'foundation' | 'intermediate' | 'diploma';
  estimatedMinutes: number;
  backstory: string;
  specimenSummary: string;
  groundTruth: CaseGroundTruth;
  steps: CaseStep[];
  debrief: CaseDebriefInfo;
  conceptTags?: string[];
  references?: CaseReference[];
  unvetted: boolean;
}

/** One recorded decision within a case run. */
export interface DecisionRecord {
  stepId: string;
  optionId: string;
  weight: CaseOptionWeight;
  scoreAwarded: number;
  timeCostIncurred: number;
  /** Wall-clock time (ms) spent on this step before submitting. */
  timeMs: number;
  timestamp: number;
}

export type CaseRunStatus = 'in-progress' | 'complete';

/** Persisted/in-memory state of a single case attempt. */
export interface CaseRunnerState {
  caseId: string;
  currentStepIndex: number;
  decisions: DecisionRecord[];
  revealedEvidence: EvidenceItem[];
  status: CaseRunStatus;
  startedAt: number;
  completedAt?: number;
}

/** Final computed outcome of a completed case attempt. */
export interface CaseResult {
  caseId: string;
  rawScore: number;
  maxScore: number;
  percentage: number;
  efficiencyBonus: number;
  grade: string;
  decisions: DecisionRecord[];
  completedAt: number;
}
