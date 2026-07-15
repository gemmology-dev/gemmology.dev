/**
 * Maps curated question-bank entries (src/content/questions/*.yaml, validated
 * by the Zod schema in src/content/config.ts) into the runtime `Question`
 * shape used by the quiz engine.
 *
 * Pure module: no `astro:content` import, so it can be unit tested with plain
 * fixture objects. The caller (src/pages/quiz/index.astro) is responsible for
 * calling `getCollection('questions')` and passing the mapped `.data` shape
 * in; this module generalizes the inline mapper already used by the learn
 * pretest widget (`src/pages/learn/[...slug].astro`) to cover all five
 * curated question types instead of just plain MCQ.
 */

import type {
  Question,
  Difficulty,
  Category,
  QuestionType,
  OptionRationale,
} from './question-types';
import { isRenderable } from './question-validity';

/**
 * Minimal shape of a single curated question-bank entry, matching the Zod
 * schema in src/content/config.ts (`questionsCollection`). Declared locally
 * so this module has no dependency on `astro:content`.
 */
export interface CuratedQuestionSource {
  id: string;
  stem: string;
  type: 'mcq' | 'true-false' | 'fill-blank' | 'matching' | 'image-mcq';
  options?: Array<{ text: string; isCorrect: boolean; rationale?: string }>;
  acceptedAnswers?: string[];
  pairs?: Array<{ left: string; right: string }>;
  rationaleCorrect: string;
  difficulty: number;
  category: Category;
  sourceArticle?: string;
  /** Carried on the source but intentionally unused in v1 (image-mcq renders as plain MCQ). */
  imageRef?: string;
  unvetted?: boolean;
  deprecated?: boolean;
}

const TYPE_MAP: Record<CuratedQuestionSource['type'], QuestionType> = {
  mcq: 'multiple-choice',
  'true-false': 'true-false',
  // v1: image-mcq renders as a plain MCQ; imageRef is carried on the source
  // but not surfaced in the UI yet.
  'image-mcq': 'multiple-choice',
  'fill-blank': 'fill-blank',
  matching: 'matching',
};

/** Maps a curated 1-5 difficulty number onto the quiz engine's 3-level scale. */
export function difficultyFromNumber(n: number): Difficulty {
  if (n <= 2) return 'beginner';
  if (n === 3) return 'intermediate';
  return 'advanced';
}

/**
 * Maps one curated question-bank source entry into the runtime `Question`
 * shape. Returns `null` for `deprecated` entries or entries that fail
 * `isRenderable` after mapping — defensive, so malformed curated content can
 * never occupy a quiz session slot or crash the UI.
 */
export function mapCuratedQuestion(source: CuratedQuestionSource): Question | null {
  if (source.deprecated) return null;

  const type = TYPE_MAP[source.type];
  const topic = source.sourceArticle ?? source.category;
  const sourceRef = source.sourceArticle ? `/learn/${source.sourceArticle}` : undefined;

  let options: string[] | undefined;
  let correctAnswer: string | string[];
  let optionRationales: OptionRationale[] | undefined;
  let matchingPairs: Array<{ left: string; right: string }> | undefined;

  if (type === 'multiple-choice' || type === 'true-false') {
    const opts = source.options ?? [];
    options = opts.map(o => o.text);
    const correct = opts.find(o => o.isCorrect);
    correctAnswer = correct?.text ?? opts[0]?.text ?? '';
    optionRationales = opts.map(o => ({
      text: o.text,
      isCorrect: o.isCorrect,
      rationale: o.rationale ?? '',
    }));
  } else if (type === 'fill-blank') {
    correctAnswer = source.acceptedAnswers ?? [];
  } else {
    // matching
    matchingPairs = source.pairs ?? [];
    correctAnswer = matchingPairs.map(p => `${p.left}:${p.right}`);
  }

  const question: Question = {
    id: source.id,
    type,
    difficulty: difficultyFromNumber(source.difficulty),
    category: source.category,
    topic,
    questionText: source.stem,
    options,
    correctAnswer,
    sourceRef,
    matchingPairs,
    rationaleCorrect: source.rationaleCorrect,
    optionRationales,
    unvetted: source.unvetted ?? false,
  };

  return isRenderable(question) ? question : null;
}

/**
 * Maps a list of curated source entries, dropping any that don't map to a
 * valid, renderable `Question` (deprecated, malformed, or structurally
 * invalid after mapping).
 */
export function mapCuratedQuestions(sources: CuratedQuestionSource[]): Question[] {
  const mapped: Question[] = [];
  for (const source of sources) {
    const question = mapCuratedQuestion(source);
    if (question) mapped.push(question);
  }
  return mapped;
}
