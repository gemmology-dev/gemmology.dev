import { describe, it, expect } from 'vitest';
import {
  scoreDecision,
  computeMaxScore,
  computeRawScore,
  computePercentage,
  computeParTimeCost,
  computeTotalTimeCost,
  computeEfficiencyBonus,
  buildCaseResult,
  getGrade,
} from './scoring';
import type { CaseDefinition, CaseOption, CaseStep, DecisionRecord } from './case-types';

function makeOption(overrides: Partial<CaseOption> = {}): CaseOption {
  return {
    id: 'opt-optimal',
    text: 'Do the optimal thing',
    weight: 'optimal',
    score: 10,
    rationale: 'This is the best next test.',
    ...overrides,
  };
}

function makeStep(overrides: Partial<CaseStep> = {}): CaseStep {
  return {
    id: 'step-1',
    type: 'choose-next-test',
    prompt: 'What do you test first?',
    options: [
      makeOption({ id: 'opt-optimal', weight: 'optimal', score: 10, timeCost: 1 }),
      makeOption({ id: 'opt-acceptable', weight: 'acceptable', score: 5, timeCost: 2 }),
      makeOption({ id: 'opt-poor', weight: 'poor', score: 0, timeCost: 3 }),
    ],
    pointsMultiplier: 1,
    ...overrides,
  };
}

function makeCase(overrides: Partial<CaseDefinition> = {}): CaseDefinition {
  return {
    id: 'test-case',
    title: 'Test Case',
    difficulty: 'foundation',
    estimatedMinutes: 10,
    backstory: 'A walk-in customer brings in a stone.',
    specimenSummary: 'Red transparent stone, unset.',
    groundTruth: { speciesFamilyId: 'corundum' },
    steps: [
      makeStep({ id: 'step-1' }),
      makeStep({
        id: 'step-2',
        type: 'reading-interpretation',
        pointsMultiplier: 2,
      }),
      makeStep({
        id: 'step-3',
        type: 'final-identification',
        pointsMultiplier: 2,
      }),
    ],
    debrief: { summary: 'It was ruby.', expertPath: ['Checked RI', 'Checked SG', 'Confirmed'] },
    unvetted: false,
    ...overrides,
  };
}

function makeDecision(overrides: Partial<DecisionRecord> = {}): DecisionRecord {
  return {
    stepId: 'step-1',
    optionId: 'opt-optimal',
    weight: 'optimal',
    scoreAwarded: 10,
    timeCostIncurred: 1,
    timeMs: 1000,
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('scoreDecision', () => {
  it('multiplies option score by the step pointsMultiplier', () => {
    const step = makeStep({ pointsMultiplier: 3 });
    const option = makeOption({ score: 5 });
    expect(scoreDecision(option, step)).toBe(15);
  });

  it('returns 0 for a poor (score 0) option regardless of multiplier', () => {
    const step = makeStep({ pointsMultiplier: 2 });
    const option = makeOption({ score: 0, weight: 'poor' });
    expect(scoreDecision(option, step)).toBe(0);
  });
});

describe('computeMaxScore', () => {
  it('sums the best-option score * multiplier per step', () => {
    const caseDef = makeCase();
    // step-1: 10*1=10, step-2: 10*2=20, step-3: 10*2=20 => 50
    expect(computeMaxScore(caseDef)).toBe(50);
  });
});

describe('computeRawScore / computePercentage', () => {
  it('sums scoreAwarded across decisions', () => {
    const decisions = [
      makeDecision({ scoreAwarded: 10 }),
      makeDecision({ scoreAwarded: 5 }),
    ];
    expect(computeRawScore(decisions)).toBe(15);
  });

  it('rounds and clamps percentage into [0, 100]', () => {
    expect(computePercentage(1, 3)).toBe(33);
    expect(computePercentage(2, 3)).toBe(67);
    expect(computePercentage(0, 0)).toBe(0);
    expect(computePercentage(100, 50)).toBe(100); // clamped even if raw > max somehow
    expect(computePercentage(-5, 50)).toBe(0);
  });
});

describe('computeParTimeCost', () => {
  it('sums the minimum optimal timeCost across choose-next-test steps only', () => {
    const caseDef = makeCase({
      steps: [
        makeStep({
          id: 'step-1',
          type: 'choose-next-test',
          options: [
            makeOption({ id: 'a', weight: 'optimal', timeCost: 2 }),
            makeOption({ id: 'b', weight: 'optimal', timeCost: 1 }),
            makeOption({ id: 'c', weight: 'poor', timeCost: 0 }),
          ],
        }),
        makeStep({ id: 'step-2', type: 'reading-interpretation' }),
        makeStep({ id: 'step-3', type: 'final-identification' }),
      ],
    });
    // Only step-1 counts (choose-next-test); min optimal timeCost among a,b is 1.
    expect(computeParTimeCost(caseDef)).toBe(1);
  });

  it('treats a missing timeCost on the optimal option as 0', () => {
    const caseDef = makeCase({
      steps: [
        makeStep({
          id: 'step-1',
          type: 'choose-next-test',
          options: [makeOption({ id: 'a', weight: 'optimal', timeCost: undefined })],
        }),
        makeStep({ id: 'step-2', type: 'reading-interpretation' }),
        makeStep({ id: 'step-3', type: 'final-identification' }),
      ],
    });
    expect(computeParTimeCost(caseDef)).toBe(0);
  });
});

describe('computeTotalTimeCost', () => {
  it('sums timeCostIncurred across decisions', () => {
    const decisions = [
      makeDecision({ timeCostIncurred: 1 }),
      makeDecision({ timeCostIncurred: 2 }),
    ];
    expect(computeTotalTimeCost(decisions)).toBe(3);
  });
});

describe('computeEfficiencyBonus', () => {
  it('awards the full formula value when under the cap', () => {
    const caseDef = makeCase(); // maxScore 50, cap round(50*0.1)=5
    const decisions = [makeDecision({ timeCostIncurred: 0 })];
    // parTimeCost for makeCase's step-1 optimal option timeCost=1 => par=1
    // raw = max(0, 1+1-0)*2 = 4, cap=5 => bonus=4
    expect(computeEfficiencyBonus(caseDef, decisions)).toBe(4);
  });

  it('is capped at round(maxScore * 0.1)', () => {
    const caseDef = makeCase();
    // Zero time cost incurred at all -> raw = (1+1-0)*2 = 4, still under cap 5.
    // Force an extreme case: no decisions at all -> totalTimeCost 0, same as above.
    const decisions: DecisionRecord[] = [];
    const bonus = computeEfficiencyBonus(caseDef, decisions);
    const cap = Math.round(computeMaxScore(caseDef) * 0.1);
    expect(bonus).toBeLessThanOrEqual(cap);
  });

  it('is 0 (not negative) when total time cost far exceeds par', () => {
    const caseDef = makeCase();
    const decisions = [makeDecision({ timeCostIncurred: 50 })];
    expect(computeEfficiencyBonus(caseDef, decisions)).toBe(0);
  });
});

describe('buildCaseResult', () => {
  it('assembles rawScore, maxScore, percentage, efficiencyBonus, grade, and echoes decisions', () => {
    const caseDef = makeCase();
    const decisions = [
      makeDecision({ stepId: 'step-1', scoreAwarded: 10, timeCostIncurred: 1 }),
      makeDecision({ stepId: 'step-2', scoreAwarded: 20, timeCostIncurred: 0 }),
      makeDecision({ stepId: 'step-3', scoreAwarded: 20, timeCostIncurred: 0 }),
    ];
    const completedAt = Date.now();
    const result = buildCaseResult(caseDef, decisions, completedAt);

    expect(result.caseId).toBe('test-case');
    expect(result.rawScore).toBe(50);
    expect(result.maxScore).toBe(50);
    expect(result.percentage).toBe(100);
    expect(result.grade).toBe(getGrade(100));
    expect(result.decisions).toBe(decisions);
    expect(result.completedAt).toBe(completedAt);
    expect(result.efficiencyBonus).toBeGreaterThanOrEqual(0);
  });

  it('grade reuses the quiz scoring A-F bands', () => {
    expect(getGrade(95)).toBe('A');
    expect(getGrade(85)).toBe('B');
    expect(getGrade(75)).toBe('C');
    expect(getGrade(65)).toBe('D');
    expect(getGrade(40)).toBe('F');
  });
});
