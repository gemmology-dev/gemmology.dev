/**
 * Scoring and results calculation for quizzes and exams.
 */

import type {
  Question,
  QuizState,
  QuestionResult,
  QuizResult,
  CategoryBreakdown,
  Category,
  QuizConfig,
} from './question-types';
import { checkAnswer } from './question-generator';

/**
 * Calculate results for a completed quiz.
 */
export function calculateResults(
  state: QuizState,
  config: QuizConfig
): QuizResult {
  const results: QuestionResult[] = [];
  let score = 0;

  for (const question of state.questions) {
    const userAnswer = state.answers.get(question.id) || null;
    const isCorrect = userAnswer !== null && checkAnswer(question, userAnswer);
    const wasFlagged = state.flaggedQuestions.has(question.id);

    if (isCorrect) score++;

    results.push({
      question,
      userAnswer,
      isCorrect,
      wasFlagged,
    });
  }

  const totalQuestions = state.questions.length;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const timeTaken = (state.endTime || Date.now()) - state.startTime;

  // Calculate breakdown by category
  const breakdown = calculateCategoryBreakdown(results);

  return {
    results,
    score,
    totalQuestions,
    percentage,
    timeTaken,
    breakdown,
    config,
    completedAt: Date.now(),
  };
}

/**
 * Calculate score breakdown by category.
 */
function calculateCategoryBreakdown(results: QuestionResult[]): CategoryBreakdown[] {
  const categoryMap = new Map<Category, { correct: number; total: number }>();

  for (const result of results) {
    const category = result.question.category;
    const current = categoryMap.get(category) || { correct: 0, total: 0 };

    current.total++;
    if (result.isCorrect) current.correct++;

    categoryMap.set(category, current);
  }

  return Array.from(categoryMap.entries()).map(([category, { correct, total }]) => ({
    category,
    correct,
    total,
    percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
  }));
}

/**
 * Get a grade letter based on percentage.
 */
export function getGrade(percentage: number): string {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}

/**
 * Get descriptive feedback based on score.
 */
export function getFeedback(percentage: number): string {
  if (percentage >= 90) return 'Excellent! You have a strong understanding of this material.';
  if (percentage >= 80) return 'Great work! You have a good grasp of the concepts.';
  if (percentage >= 70) return 'Good job! Consider reviewing the topics you missed.';
  if (percentage >= 60) return 'You passed, but there\'s room for improvement.';
  return 'Keep studying! Review the learn content and try again.';
}

/**
 * Format time duration in a human-readable way.
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Calculate the pass/fail status for an exam.
 */
export function getPassStatus(percentage: number, passingScore: number = 70): {
  passed: boolean;
  message: string;
} {
  const passed = percentage >= passingScore;
  const message = passed
    ? `Congratulations! You passed with ${percentage}%.`
    : `You scored ${percentage}%. You need ${passingScore}% to pass.`;

  return { passed, message };
}

/**
 * Get statistics about wrong answers for review.
 */
export function getWrongAnswerStats(results: QuestionResult[]): {
  topics: Map<string, number>;
  categories: Map<Category, number>;
  difficulties: Map<string, number>;
} {
  const topics = new Map<string, number>();
  const categories = new Map<Category, number>();
  const difficulties = new Map<string, number>();

  for (const result of results) {
    if (!result.isCorrect) {
      const { topic, category, difficulty } = result.question;

      topics.set(topic, (topics.get(topic) || 0) + 1);
      categories.set(category, (categories.get(category) || 0) + 1);
      difficulties.set(difficulty, (difficulties.get(difficulty) || 0) + 1);
    }
  }

  return { topics, categories, difficulties };
}
