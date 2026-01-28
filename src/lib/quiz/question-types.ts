/**
 * Core TypeScript types for the quiz and exam system.
 * Questions are generated from the gemmology-knowledge YAML content.
 */

/** Question types supported by the quiz system */
export type QuestionType =
  | 'multiple-choice'
  | 'true-false'
  | 'matching'
  | 'fill-blank';

/** Difficulty levels matching the learn content metadata */
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

/** Categories matching the learn content structure */
export type Category =
  | 'fundamentals'
  | 'equipment'
  | 'species'
  | 'identification'
  | 'phenomena'
  | 'origin'
  | 'market'
  | 'care';

/** All available categories */
export const CATEGORIES: Category[] = [
  'fundamentals',
  'equipment',
  'species',
  'identification',
  'phenomena',
  'origin',
  'market',
  'care',
];

/** Display names for categories */
export const CATEGORY_LABELS: Record<Category, string> = {
  fundamentals: 'Fundamentals',
  equipment: 'Equipment',
  species: 'Gem Species',
  identification: 'Identification',
  phenomena: 'Phenomena',
  origin: 'Origin',
  market: 'Market & Grading',
  care: 'Care & Durability',
};

/** A single quiz question */
export interface Question {
  /** Unique identifier for this question */
  id: string;
  /** The type of question */
  type: QuestionType;
  /** Difficulty level */
  difficulty: Difficulty;
  /** Category this question belongs to */
  category: Category;
  /** Source topic/file name */
  topic: string;
  /** The question text to display */
  questionText: string;
  /** Answer options for multiple-choice questions */
  options?: string[];
  /** Correct answer(s) - single string or array for matching */
  correctAnswer: string | string[];
  /** Explanation shown after answering (practice mode) */
  explanation?: string;
  /** Link back to learn content */
  sourceRef?: string;
  /** For matching questions: items to match */
  matchingPairs?: Array<{ left: string; right: string }>;
}

/** Configuration for starting a quiz */
export interface QuizConfig {
  /** Which categories to include */
  categories: Category[];
  /** Filter by difficulty (optional) */
  difficulty?: Difficulty[];
  /** Number of questions to include */
  questionCount: number;
  /** Time limit in seconds (exam mode only) */
  timeLimit?: number;
  /** Whether to shuffle question order */
  shuffleQuestions: boolean;
  /** Whether to shuffle answer options */
  shuffleOptions: boolean;
  /** Quiz mode */
  mode: 'practice' | 'exam';
}

/** Default quiz configuration */
export const DEFAULT_QUIZ_CONFIG: QuizConfig = {
  categories: ['fundamentals'],
  questionCount: 10,
  shuffleQuestions: true,
  shuffleOptions: true,
  mode: 'practice',
};

/** State during an active quiz */
export interface QuizState {
  /** The questions in this quiz */
  questions: Question[];
  /** Current question index (0-based) */
  currentIndex: number;
  /** User's answers: questionId -> answer */
  answers: Map<string, string | string[]>;
  /** When the quiz started (timestamp) */
  startTime: number;
  /** When the quiz ended (timestamp, if completed) */
  endTime?: number;
  /** Flagged questions for review (exam mode) */
  flaggedQuestions: Set<string>;
  /** Whether the quiz has been submitted */
  submitted: boolean;
}

/** Result for a single answered question */
export interface QuestionResult {
  /** The question that was answered */
  question: Question;
  /** What the user answered (null if skipped) */
  userAnswer: string | string[] | null;
  /** Whether the answer was correct */
  isCorrect: boolean;
  /** Time taken to answer in milliseconds */
  timeTaken?: number;
  /** Whether the question was flagged for review (exam mode) */
  wasFlagged?: boolean;
}

/** Final results after completing a quiz */
export interface QuizResult {
  /** Individual question results */
  results: QuestionResult[];
  /** Number of correct answers */
  score: number;
  /** Total number of questions */
  totalQuestions: number;
  /** Score as percentage */
  percentage: number;
  /** Total time taken in milliseconds */
  timeTaken: number;
  /** Breakdown by category */
  breakdown: CategoryBreakdown[];
  /** The original config used */
  config: QuizConfig;
  /** When the quiz was completed */
  completedAt: number;
}

/** Score breakdown for a single category */
export interface CategoryBreakdown {
  category: Category;
  correct: number;
  total: number;
  percentage: number;
}

/** Progress tracking for completed quizzes */
export interface UserProgress {
  /** Completed topics by category */
  completedTopics: Record<Category, string[]>;
  /** Best score per category (percentage) */
  bestScores: Record<Category, number>;
  /** Total quizzes completed */
  totalQuizzes: number;
  /** Total questions answered correctly */
  totalCorrect: number;
  /** Total questions attempted */
  totalAttempted: number;
  /** Last activity timestamp */
  lastActivity: number;
}

/** Initial empty progress state */
export const INITIAL_PROGRESS: UserProgress = {
  completedTopics: {
    fundamentals: [],
    equipment: [],
    species: [],
    identification: [],
    phenomena: [],
    origin: [],
    market: [],
    care: [],
  },
  bestScores: {
    fundamentals: 0,
    equipment: 0,
    species: 0,
    identification: 0,
    phenomena: 0,
    origin: 0,
    market: 0,
    care: 0,
  },
  totalQuizzes: 0,
  totalCorrect: 0,
  totalAttempted: 0,
  lastActivity: 0,
};

/** Serializable version of QuizState for localStorage */
export interface SerializedQuizState {
  questions: Question[];
  currentIndex: number;
  answers: Array<[string, string | string[]]>;
  startTime: number;
  endTime?: number;
  flaggedQuestions: string[];
  submitted: boolean;
}

/** Convert QuizState to serializable format */
export function serializeQuizState(state: QuizState): SerializedQuizState {
  return {
    questions: state.questions,
    currentIndex: state.currentIndex,
    answers: Array.from(state.answers.entries()),
    startTime: state.startTime,
    endTime: state.endTime,
    flaggedQuestions: Array.from(state.flaggedQuestions),
    submitted: state.submitted,
  };
}

/** Convert serialized state back to QuizState */
export function deserializeQuizState(data: SerializedQuizState): QuizState {
  return {
    questions: data.questions,
    currentIndex: data.currentIndex,
    answers: new Map(data.answers),
    startTime: data.startTime,
    endTime: data.endTime,
    flaggedQuestions: new Set(data.flaggedQuestions),
    submitted: data.submitted,
  };
}
