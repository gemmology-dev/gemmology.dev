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

// ----------------------------------------------------------------------
// Study v1 — contracts (see study-types.ts) and pure modules
// ----------------------------------------------------------------------

export type {
  Confidence,
  StudyMode,
  ResponseRecord,
  ResponseStore,
  ScheduleEntry,
  ScheduleStore,
  StudySettings,
  StudyStore,
  CategoryBudget,
  SelectionRequest,
} from './study-types';

export {
  DEFAULT_STUDY_SETTINGS,
  STUDY_STORAGE_KEYS,
  RESPONSE_LOG_CAP,
  newScheduleEntry,
} from './study-types';

export { qualityOf, applySM2, DEFAULT_EASE, MIN_EASE } from './scheduler';
export { selectQuestionsV2 } from './selector';
export type { SelectionResult, ScheduleLookup } from './selector';
export { interleaveNearMisses } from './interleaver';

export { LocalStudyStore, getStudyStore } from './store';
