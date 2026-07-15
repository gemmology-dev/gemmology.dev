/**
 * Structural validity checks for quiz questions.
 *
 * Auto-generated questions can occasionally end up malformed (e.g. a
 * matching question with fewer than 2 pairs after upstream YAML edits).
 * `isRenderable` is the single source of truth for "can this question be
 * shown to a user at all" — used both to pre-filter question pools
 * (question-generator.ts's `selectQuestions`) and to decide whether a
 * question that already made it into a session should be swapped for the
 * `UnrenderableQuestionCard` fallback + skip affordance.
 */

import type { Question } from './question-types';

/** Returns true when `question` has enough data to render its UI for its type. */
export function isRenderable(question: Question): boolean {
  switch (question.type) {
    case 'multiple-choice':
    case 'true-false':
      return Array.isArray(question.options) && question.options.length >= 2;
    case 'fill-blank':
      if (Array.isArray(question.correctAnswer)) {
        return question.correctAnswer.length > 0;
      }
      return typeof question.correctAnswer === 'string' && question.correctAnswer.trim().length > 0;
    case 'matching':
      return Array.isArray(question.matchingPairs) && question.matchingPairs.length >= 2;
    default:
      return false;
  }
}
