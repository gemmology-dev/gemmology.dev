/**
 * Quiz system library exports.
 */

// Types
export type {
  QuestionType,
  Difficulty,
  Category,
  Question,
  QuizConfig,
  QuizState,
  QuestionResult,
  QuizResult,
  CategoryBreakdown,
  UserProgress,
  SerializedQuizState,
} from './question-types';

export {
  CATEGORIES,
  CATEGORY_LABELS,
  DEFAULT_QUIZ_CONFIG,
  INITIAL_PROGRESS,
  serializeQuizState,
  deserializeQuizState,
} from './question-types';

// Question generation
export type { LearnEntry } from './question-generator';
export {
  generateQuestions,
  selectQuestions,
  checkAnswer,
  getQuestionStats,
} from './question-generator';

// Scoring
export {
  calculateResults,
  getGrade,
  getFeedback,
  formatDuration,
  getPassStatus,
  getWrongAnswerStats,
} from './scoring';

// Progress tracking
export {
  updateProgress,
  calculateOverallProgress,
  getCategoryProgress,
  getProgressSummary,
  hasCategoryMastery,
  getStudySuggestions,
  resetCategoryProgress,
  calculateStreak,
} from './progress-tracker';

// Shuffle utilities
export {
  shuffle,
  shuffleInPlace,
  pickRandom,
  pickOne,
  shuffleWithCorrectIndex,
  generateWrongAnswers,
} from './shuffle';
