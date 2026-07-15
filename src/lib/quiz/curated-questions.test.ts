import { describe, it, expect } from 'vitest';
import {
  mapCuratedQuestion,
  mapCuratedQuestions,
  difficultyFromNumber,
  type CuratedQuestionSource,
} from './curated-questions';

function mcqSource(overrides: Partial<CuratedQuestionSource> = {}): CuratedQuestionSource {
  return {
    id: 'corundum-ri-001',
    stem: 'A red stone gives RI 1.762-1.770, SG 4.00, uniaxial negative. What is it?',
    type: 'mcq',
    options: [
      { text: 'Ruby', isCorrect: true, rationale: 'Matches RI/SG/optic character exactly.' },
      { text: 'Spinel', isCorrect: false, rationale: 'Spinel is isotropic.' },
      { text: 'Pyrope', isCorrect: false, rationale: 'Pyrope is isotropic.' },
    ],
    rationaleCorrect: 'Optic character first, then SG.',
    difficulty: 3,
    category: 'species',
    sourceArticle: 'species/corundum',
    unvetted: false,
    deprecated: false,
    ...overrides,
  };
}

describe('difficultyFromNumber', () => {
  it('maps 1-2 to beginner', () => {
    expect(difficultyFromNumber(1)).toBe('beginner');
    expect(difficultyFromNumber(2)).toBe('beginner');
  });

  it('maps 3 to intermediate', () => {
    expect(difficultyFromNumber(3)).toBe('intermediate');
  });

  it('maps 4-5 to advanced', () => {
    expect(difficultyFromNumber(4)).toBe('advanced');
    expect(difficultyFromNumber(5)).toBe('advanced');
  });
});

describe('mapCuratedQuestion — mcq', () => {
  it('maps options, correctAnswer, and per-option rationales', () => {
    const q = mapCuratedQuestion(mcqSource());
    expect(q).not.toBeNull();
    expect(q!.type).toBe('multiple-choice');
    expect(q!.options).toEqual(['Ruby', 'Spinel', 'Pyrope']);
    expect(q!.correctAnswer).toBe('Ruby');
    expect(q!.optionRationales).toHaveLength(3);
    expect(q!.optionRationales![0]).toEqual({
      text: 'Ruby',
      isCorrect: true,
      rationale: 'Matches RI/SG/optic character exactly.',
    });
    expect(q!.rationaleCorrect).toBe('Optic character first, then SG.');
    expect(q!.unvetted).toBe(false);
    expect(q!.sourceRef).toBe('/learn/species/corundum');
    expect(q!.difficulty).toBe('intermediate');
  });

  it('defaults unvetted to false when absent from the source', () => {
    const { unvetted: _unvetted, ...rest } = mcqSource();
    const q = mapCuratedQuestion(rest as CuratedQuestionSource);
    expect(q!.unvetted).toBe(false);
  });

  it('leaves sourceRef undefined when sourceArticle is absent', () => {
    const { sourceArticle: _sourceArticle, ...rest } = mcqSource();
    const q = mapCuratedQuestion(rest as CuratedQuestionSource);
    expect(q!.sourceRef).toBeUndefined();
    expect(q!.topic).toBe('species');
  });
});

describe('mapCuratedQuestion — true-false', () => {
  it('maps to the true-false question type', () => {
    const q = mapCuratedQuestion(
      mcqSource({
        id: 'tf-1',
        type: 'true-false',
        options: [
          { text: 'True', isCorrect: false },
          { text: 'False', isCorrect: true },
        ],
      })
    );
    expect(q!.type).toBe('true-false');
    expect(q!.correctAnswer).toBe('False');
  });
});

describe('mapCuratedQuestion — image-mcq', () => {
  it('renders as a plain multiple-choice question in v1, carrying imageRef unused', () => {
    const q = mapCuratedQuestion(
      mcqSource({ id: 'img-1', type: 'image-mcq', imageRef: '/images/crystal.svg' })
    );
    expect(q!.type).toBe('multiple-choice');
    expect(q!.options).toEqual(['Ruby', 'Spinel', 'Pyrope']);
  });
});

describe('mapCuratedQuestion — fill-blank', () => {
  it('maps acceptedAnswers to correctAnswer', () => {
    const q = mapCuratedQuestion(
      mcqSource({
        id: 'fb-1',
        type: 'fill-blank',
        stem: 'Diamond has a Mohs hardness of ___.',
        acceptedAnswers: ['10', 'ten'],
        options: undefined,
      })
    );
    expect(q!.type).toBe('fill-blank');
    expect(q!.correctAnswer).toEqual(['10', 'ten']);
    expect(q!.options).toBeUndefined();
  });

  it('returns null when acceptedAnswers is empty (fails isRenderable)', () => {
    const q = mapCuratedQuestion(
      mcqSource({ id: 'fb-bad', type: 'fill-blank', acceptedAnswers: [], options: undefined })
    );
    expect(q).toBeNull();
  });
});

describe('mapCuratedQuestion — matching', () => {
  it('maps pairs to matchingPairs and correctAnswer as left:right strings', () => {
    const q = mapCuratedQuestion(
      mcqSource({
        id: 'match-1',
        type: 'matching',
        pairs: [
          { left: 'Diamond', right: 'Cubic' },
          { left: 'Quartz', right: 'Trigonal' },
        ],
        options: undefined,
      })
    );
    expect(q!.type).toBe('matching');
    expect(q!.matchingPairs).toEqual([
      { left: 'Diamond', right: 'Cubic' },
      { left: 'Quartz', right: 'Trigonal' },
    ]);
    expect(q!.correctAnswer).toEqual(['Diamond:Cubic', 'Quartz:Trigonal']);
  });

  it('returns null when fewer than 2 pairs (fails isRenderable)', () => {
    const q = mapCuratedQuestion(
      mcqSource({
        id: 'match-bad',
        type: 'matching',
        pairs: [{ left: 'Diamond', right: 'Cubic' }],
        options: undefined,
      })
    );
    expect(q).toBeNull();
  });
});

describe('mapCuratedQuestion — deprecated', () => {
  it('returns null for deprecated entries regardless of otherwise-valid data', () => {
    const q = mapCuratedQuestion(mcqSource({ deprecated: true }));
    expect(q).toBeNull();
  });
});

describe('mapCuratedQuestions', () => {
  it('drops deprecated and malformed entries, keeping valid ones in order', () => {
    const sources: CuratedQuestionSource[] = [
      mcqSource({ id: 'good-1' }),
      mcqSource({ id: 'deprecated-1', deprecated: true }),
      mcqSource({ id: 'bad-fill', type: 'fill-blank', acceptedAnswers: [], options: undefined }),
      mcqSource({ id: 'good-2' }),
    ];
    const result = mapCuratedQuestions(sources);
    expect(result.map(q => q.id)).toEqual(['good-1', 'good-2']);
  });
});
