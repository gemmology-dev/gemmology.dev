import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCaseRunner } from './useCaseRunner';
import type { CaseDefinition } from '../lib/cases/case-types';
import { CASE_STORAGE_KEY } from '../lib/cases/store';

function makeCase(overrides: Partial<CaseDefinition> = {}): CaseDefinition {
  return {
    id: 'dealers-ruby',
    title: "A Dealer's Ruby",
    difficulty: 'foundation',
    estimatedMinutes: 10,
    backstory: 'A dealer brings in an unset red stone.',
    specimenSummary: 'Transparent red stone, ~2ct, unset.',
    groundTruth: { speciesFamilyId: 'corundum', treatment: 'heat' },
    steps: [
      {
        id: 'step-1',
        type: 'choose-next-test',
        prompt: 'What do you test first?',
        options: [
          {
            id: 'ri-first',
            text: 'Refractometer',
            weight: 'optimal',
            score: 10,
            rationale: 'RI is fast and non-destructive.',
            timeCost: 1,
            revealsEvidenceIds: ['ri-reading'],
          },
          {
            id: 'hardness-first',
            text: 'Hardness pick',
            weight: 'poor',
            score: 0,
            rationale: 'Risks damaging the stone.',
            timeCost: 3,
          },
        ],
        pointsMultiplier: 1,
        evidenceRevealed: [
          { id: 'ri-reading', kind: 'ri', label: 'RI', value: '1.762-1.770' },
        ],
      },
      {
        id: 'step-2',
        type: 'reading-interpretation',
        prompt: 'What does the RI reading suggest?',
        options: [
          {
            id: 'corundum',
            text: 'Corundum, not garnet or spinel',
            weight: 'optimal',
            score: 10,
            rationale: 'Birefringence confirms uniaxial corundum.',
          },
          {
            id: 'garnet',
            text: 'Garnet',
            weight: 'poor',
            score: 0,
            rationale: 'Garnet is singly refractive; this is birefringent.',
          },
        ],
        pointsMultiplier: 2,
      },
      {
        id: 'step-3',
        type: 'final-identification',
        prompt: 'What is your final identification?',
        options: [
          {
            id: 'natural-ruby-heated',
            text: 'Natural ruby (corundum), heat-treated',
            weight: 'optimal',
            score: 10,
            rationale: 'Consistent with all evidence gathered.',
          },
          {
            id: 'spinel',
            text: 'Red spinel',
            weight: 'poor',
            score: 0,
            rationale: 'Spinel is singly refractive; ruled out by RI.',
          },
        ],
        pointsMultiplier: 2,
      },
    ],
    debrief: {
      summary: 'The stone was a heat-treated natural ruby.',
      expertPath: ['Checked RI', 'Checked SG', 'Noted silk halos', 'Confirmed ruby'],
    },
    unvetted: false,
    ...overrides,
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('useCaseRunner — decision flow', () => {
  it('starts at step 0, in-progress, with no decisions', () => {
    const { result } = renderHook(() => useCaseRunner({ caseData: makeCase(), persist: false }));
    expect(result.current.state.currentStepIndex).toBe(0);
    expect(result.current.state.status).toBe('in-progress');
    expect(result.current.state.decisions).toHaveLength(0);
    expect(result.current.currentStep?.id).toBe('step-1');
  });

  it('submitDecision records a DecisionRecord and reveals evidence', () => {
    const { result } = renderHook(() => useCaseRunner({ caseData: makeCase(), persist: false }));

    act(() => result.current.selectOption('ri-first'));
    act(() => result.current.submitDecision());

    expect(result.current.isSubmitted).toBe(true);
    expect(result.current.currentDecision).toMatchObject({
      stepId: 'step-1',
      optionId: 'ri-first',
      weight: 'optimal',
      scoreAwarded: 10,
      timeCostIncurred: 1,
    });
    expect(result.current.revealedEvidence.map((e) => e.id)).toEqual(['ri-reading']);
  });

  it('does not allow selecting a new option after submission', () => {
    const { result } = renderHook(() => useCaseRunner({ caseData: makeCase(), persist: false }));
    act(() => result.current.selectOption('ri-first'));
    act(() => result.current.submitDecision());
    act(() => result.current.selectOption('hardness-first'));
    expect(result.current.selectedOptionId).toBe('ri-first');
  });

  it('nextStep advances to the next step and resets submission state', () => {
    const { result } = renderHook(() => useCaseRunner({ caseData: makeCase(), persist: false }));
    act(() => result.current.selectOption('ri-first'));
    act(() => result.current.submitDecision());
    act(() => result.current.nextStep());

    expect(result.current.state.currentStepIndex).toBe(1);
    expect(result.current.currentStep?.id).toBe('step-2');
    expect(result.current.isSubmitted).toBe(false);
    expect(result.current.selectedOptionId).toBeNull();
  });

  it('accumulates score across steps and completes after the final step', () => {
    const { result } = renderHook(() => useCaseRunner({ caseData: makeCase(), persist: false }));

    act(() => result.current.selectOption('ri-first'));
    act(() => result.current.submitDecision());
    act(() => result.current.nextStep());

    act(() => result.current.selectOption('corundum'));
    act(() => result.current.submitDecision());
    act(() => result.current.nextStep());

    act(() => result.current.selectOption('natural-ruby-heated'));
    act(() => result.current.submitDecision());
    act(() => result.current.nextStep());

    expect(result.current.isComplete).toBe(true);
    expect(result.current.result).not.toBeNull();
    expect(result.current.result!.rawScore).toBe(10 + 20 + 20);
    expect(result.current.result!.maxScore).toBe(10 + 20 + 20);
    expect(result.current.result!.percentage).toBe(100);
  });

  it('resetCase clears decisions and returns to step 0', () => {
    const { result } = renderHook(() => useCaseRunner({ caseData: makeCase(), persist: false }));
    act(() => result.current.selectOption('ri-first'));
    act(() => result.current.submitDecision());
    act(() => result.current.nextStep());

    act(() => result.current.resetCase());

    expect(result.current.state.currentStepIndex).toBe(0);
    expect(result.current.state.decisions).toHaveLength(0);
    expect(result.current.revealedEvidence).toHaveLength(0);
    expect(result.current.isComplete).toBe(false);
    expect(result.current.result).toBeNull();
  });
});

describe('useCaseRunner — persistence / resume', () => {
  it('persists progress to localStorage under CASE_STORAGE_KEY when persist is true', () => {
    const { result } = renderHook(() => useCaseRunner({ caseData: makeCase(), persist: true }));
    act(() => result.current.selectOption('ri-first'));
    act(() => result.current.submitDecision());

    const raw = window.localStorage.getItem(CASE_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.cases['dealers-ruby'].state.decisions).toHaveLength(1);
  });

  it('resumes an in-progress case from a fresh hook instance', () => {
    const first = renderHook(() => useCaseRunner({ caseData: makeCase(), persist: true }));
    act(() => first.result.current.selectOption('ri-first'));
    act(() => first.result.current.submitDecision());
    act(() => first.result.current.nextStep());

    const second = renderHook(() => useCaseRunner({ caseData: makeCase(), persist: true }));
    expect(second.result.current.state.currentStepIndex).toBe(1);
    expect(second.result.current.state.decisions).toHaveLength(1);
  });

  it('does not resume a completed case into an active session', () => {
    const first = renderHook(() => useCaseRunner({ caseData: makeCase(), persist: true }));
    act(() => first.result.current.selectOption('ri-first'));
    act(() => first.result.current.submitDecision());
    act(() => first.result.current.nextStep());
    act(() => first.result.current.selectOption('corundum'));
    act(() => first.result.current.submitDecision());
    act(() => first.result.current.nextStep());
    act(() => first.result.current.selectOption('natural-ruby-heated'));
    act(() => first.result.current.submitDecision());
    act(() => first.result.current.nextStep());
    expect(first.result.current.isComplete).toBe(true);

    // A fresh mount should surface the already-computed result, not silently
    // resume "in-progress" (there is no more progress to resume).
    const second = renderHook(() => useCaseRunner({ caseData: makeCase(), persist: true }));
    expect(second.result.current.isComplete).toBe(true);
    expect(second.result.current.result).not.toBeNull();
  });
});
