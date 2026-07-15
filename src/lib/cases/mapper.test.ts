import { describe, it, expect } from 'vitest';
import { mapCaseSource, mapCaseSources, type CaseSource, type CaseStepSource } from './mapper';
import type { CaseOption } from './case-types';

function makeOption(overrides: Partial<CaseOption> = {}): CaseOption {
  return {
    id: 'opt-1',
    text: 'Option text',
    weight: 'optimal',
    score: 10,
    rationale: 'Because.',
    ...overrides,
  };
}

function makeStepSource(overrides: Partial<CaseStepSource> = {}): CaseStepSource {
  return {
    id: 'step-1',
    type: 'choose-next-test',
    prompt: 'What next?',
    options: [makeOption()],
    ...overrides,
  };
}

function makeSource(overrides: Partial<CaseSource> = {}): CaseSource {
  return {
    id: 'my-case',
    title: 'My Case',
    difficulty: 'foundation',
    estimatedMinutes: 8,
    backstory: 'Backstory.',
    specimenSummary: 'Summary.',
    groundTruth: { speciesFamilyId: 'corundum' },
    steps: [
      makeStepSource({ id: 'step-1' }),
      makeStepSource({ id: 'step-2', type: 'reading-interpretation' }),
      makeStepSource({ id: 'step-3', type: 'final-identification' }),
    ],
    debrief: { summary: 'Debrief.', expertPath: ['A', 'B'] },
    ...overrides,
  };
}

describe('mapCaseSource', () => {
  it('maps a well-formed source into a CaseDefinition, defaulting pointsMultiplier to 1', () => {
    const mapped = mapCaseSource(makeSource());
    expect(mapped).not.toBeNull();
    expect(mapped!.id).toBe('my-case');
    expect(mapped!.steps).toHaveLength(3);
    expect(mapped!.steps[0].pointsMultiplier).toBe(1);
  });

  it('preserves an explicit pointsMultiplier rather than overriding it', () => {
    const source = makeSource({
      steps: [
        makeStepSource({ id: 'step-1', pointsMultiplier: 3 }),
        makeStepSource({ id: 'step-2', type: 'reading-interpretation' }),
        makeStepSource({ id: 'step-3', type: 'final-identification' }),
      ],
    });
    const mapped = mapCaseSource(source);
    expect(mapped!.steps[0].pointsMultiplier).toBe(3);
  });

  it('defaults unvetted to false when omitted', () => {
    const mapped = mapCaseSource(makeSource({ unvetted: undefined }));
    expect(mapped!.unvetted).toBe(false);
  });

  it('preserves unvetted: true', () => {
    const mapped = mapCaseSource(makeSource({ unvetted: true }));
    expect(mapped!.unvetted).toBe(true);
  });

  it('returns null when there are fewer than 3 steps', () => {
    const source = makeSource({
      steps: [
        makeStepSource({ id: 'step-1' }),
        makeStepSource({ id: 'step-2', type: 'final-identification' }),
      ],
    });
    expect(mapCaseSource(source)).toBeNull();
  });

  it('returns null when there is no final-identification step', () => {
    const source = makeSource({
      steps: [
        makeStepSource({ id: 'step-1' }),
        makeStepSource({ id: 'step-2', type: 'reading-interpretation' }),
        makeStepSource({ id: 'step-3', type: 'candidate-narrowing' }),
      ],
    });
    expect(mapCaseSource(source)).toBeNull();
  });

  it('carries through evidenceRevealed, learnLinks, and toolLinks on a step', () => {
    const source = makeSource({
      steps: [
        makeStepSource({
          id: 'step-1',
          evidenceRevealed: [{ id: 'ev-1', kind: 'ri', label: 'RI', value: '1.762-1.770' }],
          learnLinks: ['crystal-systems'],
          toolLinks: [{ href: '/tools/measurement', label: 'RI tool' }],
        }),
        makeStepSource({ id: 'step-2', type: 'reading-interpretation' }),
        makeStepSource({ id: 'step-3', type: 'final-identification' }),
      ],
    });
    const mapped = mapCaseSource(source)!;
    expect(mapped.steps[0].evidenceRevealed).toEqual([
      { id: 'ev-1', kind: 'ri', label: 'RI', value: '1.762-1.770' },
    ]);
    expect(mapped.steps[0].learnLinks).toEqual(['crystal-systems']);
    expect(mapped.steps[0].toolLinks).toEqual([{ href: '/tools/measurement', label: 'RI tool' }]);
  });
});

describe('mapCaseSources', () => {
  it('drops unmappable entries and keeps the rest', () => {
    const good = makeSource({ id: 'good' });
    const bad = makeSource({
      id: 'bad',
      steps: [makeStepSource({ id: 's1' }), makeStepSource({ id: 's2' })],
    });
    const mapped = mapCaseSources([good, bad]);
    expect(mapped.map((c) => c.id)).toEqual(['good']);
  });

  it('returns an empty array for an empty input', () => {
    expect(mapCaseSources([])).toEqual([]);
  });
});
