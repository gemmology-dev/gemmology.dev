/**
 * React hook for running a single Lab Simulation case.
 * Handles step navigation, decision recording, evidence reveal, scoring,
 * and localStorage persistence via LocalCaseStore (mid-case resume).
 *
 * Modeled on useQuiz.ts's structure, but persistence is synchronous
 * (LocalCaseStore, like Phase 1's LocalChallengeStore) rather than the
 * async StudyStore used by the quiz system.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  CaseDefinition,
  CaseStep,
  CaseRunnerState,
  DecisionRecord,
  EvidenceItem,
  CaseResult,
} from '../lib/cases/case-types';
import { scoreDecision, buildCaseResult } from '../lib/cases/scoring';
import { getCaseStore } from '../lib/cases/store';

interface UseCaseRunnerOptions {
  /** The case definition to run. */
  caseData: CaseDefinition;
  /** Whether to persist state to localStorage (mid-case resume). Defaults to true. */
  persist?: boolean;
}

interface UseCaseRunnerReturn {
  /** Current runner state. */
  state: CaseRunnerState;
  /** The current step, or `null` once complete. */
  currentStep: CaseStep | null;
  /** Currently selected (not-yet-submitted) option id for the current step. */
  selectedOptionId: string | null;
  /** Select an option for the current step (before submitting). */
  selectOption: (optionId: string) => void;
  /** Whether the current step's decision has already been submitted. */
  isSubmitted: boolean;
  /** Submit the selected option as the decision for the current step. */
  submitDecision: () => void;
  /** The decision recorded for the current step, if submitted. */
  currentDecision: DecisionRecord | null;
  /** Advance past the current (submitted) step, or complete the case from the last step. */
  nextStep: () => void;
  /** Reset the case to a fresh, in-progress attempt (clears persisted state). */
  resetCase: () => void;
  /** Whether the case run is complete. */
  isComplete: boolean;
  /** Final result, once complete. */
  result: CaseResult | null;
  /** Evidence accumulated so far, in reveal order. */
  revealedEvidence: EvidenceItem[];
}

function freshState(caseId: string): CaseRunnerState {
  return {
    caseId,
    currentStepIndex: 0,
    decisions: [],
    revealedEvidence: [],
    status: 'in-progress',
    startedAt: Date.now(),
  };
}

/** All evidence items defined anywhere in the case, keyed by id (for revealsEvidenceIds lookups). */
function allEvidenceById(caseData: CaseDefinition): Map<string, EvidenceItem> {
  const map = new Map<string, EvidenceItem>();
  for (const step of caseData.steps) {
    for (const item of step.evidenceRevealed ?? []) {
      map.set(item.id, item);
    }
  }
  return map;
}

export function useCaseRunner({ caseData, persist = true }: UseCaseRunnerOptions): UseCaseRunnerReturn {
  const store = useRef(getCaseStore()).current;
  const stepStartTime = useRef<number>(Date.now());
  const evidenceById = useRef(allEvidenceById(caseData)).current;

  // Always initialize to the deterministic fresh state so server-rendered and
  // first-client-render markup match; persisted state (mid-case resume or a
  // completed case reopening to its debrief) hydrates in the mount effect
  // below. Reading localStorage inside the useState initializer caused React
  // hydration errors (#418/#423) on reload with saved progress.
  const [state, setState] = useState<CaseRunnerState>(() => freshState(caseData.id));
  const [result, setResult] = useState<CaseResult | null>(null);

  useEffect(() => {
    if (!persist) return;
    const existing = store.getCaseState(caseData.id);
    if (existing) {
      setState(existing.state);
      if (existing.result) setResult(existing.result);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  // The stepId of the most recently submitted step. A step can only be
  // submitted once — options are disabled thereafter, mirroring AnswerOption.
  const [submittedStepId, setSubmittedStepId] = useState<string | null>(null);

  const currentStep: CaseStep | null = caseData.steps[state.currentStepIndex] ?? null;
  const isComplete = state.status === 'complete';
  const isSubmitted = currentStep !== null && submittedStepId === currentStep.id;
  const currentDecision = currentStep
    ? state.decisions.find((d) => d.stepId === currentStep.id) ?? null
    : null;

  const selectOption = useCallback(
    (optionId: string) => {
      if (!currentStep || isSubmitted) return;
      setSelectedOptionId(optionId);
    },
    [currentStep, isSubmitted],
  );

  const submitDecision = useCallback(() => {
    if (!currentStep || !selectedOptionId || isSubmitted) return;
    const option = currentStep.options.find((o) => o.id === selectedOptionId);
    if (!option) return;

    const decision: DecisionRecord = {
      stepId: currentStep.id,
      optionId: option.id,
      weight: option.weight,
      scoreAwarded: scoreDecision(option, currentStep),
      timeCostIncurred: option.timeCost ?? 0,
      timeMs: Date.now() - stepStartTime.current,
      timestamp: Date.now(),
    };

    const revealed = [...state.revealedEvidence];
    const seen = new Set(revealed.map((e) => e.id));
    const addEvidence = (item: EvidenceItem) => {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        revealed.push(item);
      }
    };

    (currentStep.evidenceRevealed ?? []).forEach(addEvidence);
    (option.revealsEvidenceIds ?? []).forEach((id) => {
      const item = evidenceById.get(id);
      if (item) addEvidence(item);
    });

    const newState: CaseRunnerState = {
      ...state,
      decisions: [...state.decisions, decision],
      revealedEvidence: revealed,
    };

    setState(newState);
    setSubmittedStepId(currentStep.id);
    if (persist) store.saveCaseState(caseData.id, newState);
  }, [currentStep, selectedOptionId, isSubmitted, state, evidenceById, persist, store, caseData.id]);

  const nextStep = useCallback(() => {
    if (!currentStep || !isSubmitted) return;

    const isLastStep = state.currentStepIndex >= caseData.steps.length - 1;

    if (!isLastStep) {
      stepStartTime.current = Date.now();
      const newState: CaseRunnerState = {
        ...state,
        currentStepIndex: state.currentStepIndex + 1,
      };
      setState(newState);
      setSelectedOptionId(null);
      setSubmittedStepId(null);
      if (persist) store.saveCaseState(caseData.id, newState);
      return;
    }

    const completedAt = Date.now();
    const finalState: CaseRunnerState = {
      ...state,
      status: 'complete',
      completedAt,
    };
    const caseResult = buildCaseResult(caseData, finalState.decisions, completedAt);
    setState(finalState);
    setResult(caseResult);
    if (persist) store.saveCaseState(caseData.id, finalState, caseResult);
  }, [currentStep, isSubmitted, state, caseData, persist, store]);

  const resetCase = useCallback(() => {
    if (persist) store.clearCase(caseData.id);
    stepStartTime.current = Date.now();
    setState(freshState(caseData.id));
    setResult(null);
    setSelectedOptionId(null);
    setSubmittedStepId(null);
  }, [persist, store, caseData.id]);

  return {
    state,
    currentStep,
    selectedOptionId,
    selectOption,
    isSubmitted,
    submitDecision,
    currentDecision,
    nextStep,
    resetCase,
    isComplete,
    result,
    revealedEvidence: state.revealedEvidence,
  };
}
