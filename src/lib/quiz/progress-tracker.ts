/**
 * Progress tracking for quiz/exam completion.
 * Tracks completed topics, best scores, and overall statistics.
 */

import type {
  UserProgress,
  QuizResult,
  Category,
  INITIAL_PROGRESS,
} from './question-types';
import { CATEGORIES } from './question-types';

/**
 * Update progress after completing a quiz.
 */
export function updateProgress(
  currentProgress: UserProgress,
  result: QuizResult
): UserProgress {
  const newProgress = { ...currentProgress };

  // Update total statistics
  newProgress.totalQuizzes++;
  newProgress.totalCorrect += result.score;
  newProgress.totalAttempted += result.totalQuestions;
  newProgress.lastActivity = Date.now();

  // Update category-specific data
  for (const breakdown of result.breakdown) {
    const { category, percentage } = breakdown;

    // Update best score if this is better
    if (percentage > (newProgress.bestScores[category] || 0)) {
      newProgress.bestScores[category] = percentage;
    }

    // Mark topics as completed if score is above threshold
    if (percentage >= 70) {
      const topicsInCategory = result.results
        .filter(r => r.question.category === category)
        .map(r => r.question.topic);

      const uniqueTopics = [...new Set(topicsInCategory)];
      const currentCompleted = newProgress.completedTopics[category] || [];

      newProgress.completedTopics[category] = [
        ...new Set([...currentCompleted, ...uniqueTopics]),
      ];
    }
  }

  return newProgress;
}

/**
 * Calculate overall progress percentage.
 */
export function calculateOverallProgress(progress: UserProgress): number {
  if (progress.totalAttempted === 0) return 0;
  return Math.round((progress.totalCorrect / progress.totalAttempted) * 100);
}

/**
 * Get progress for a specific category.
 */
export function getCategoryProgress(
  progress: UserProgress,
  category: Category,
  totalTopicsInCategory: number
): {
  completedTopics: number;
  totalTopics: number;
  percentage: number;
  bestScore: number;
} {
  const completedTopics = progress.completedTopics[category]?.length || 0;

  return {
    completedTopics,
    totalTopics: totalTopicsInCategory,
    percentage: totalTopicsInCategory > 0
      ? Math.round((completedTopics / totalTopicsInCategory) * 100)
      : 0,
    bestScore: progress.bestScores[category] || 0,
  };
}

/**
 * Get a summary of progress across all categories.
 */
export function getProgressSummary(
  progress: UserProgress,
  topicCounts: Record<Category, number>
): Array<{
  category: Category;
  completedTopics: number;
  totalTopics: number;
  percentage: number;
  bestScore: number;
}> {
  return CATEGORIES.map(category => {
    const totalTopics = topicCounts[category] || 0;
    return {
      category,
      ...getCategoryProgress(progress, category, totalTopics),
    };
  });
}

/**
 * Check if user has achieved mastery in a category.
 * Mastery = completed all topics with >= 80% best score
 */
export function hasCategoryMastery(
  progress: UserProgress,
  category: Category,
  totalTopicsInCategory: number
): boolean {
  const completedTopics = progress.completedTopics[category]?.length || 0;
  const bestScore = progress.bestScores[category] || 0;

  return completedTopics >= totalTopicsInCategory && bestScore >= 80;
}

/**
 * Get suggestions for what to study next based on progress.
 */
export function getStudySuggestions(
  progress: UserProgress,
  topicCounts: Record<Category, number>
): Category[] {
  const suggestions: Array<{ category: Category; priority: number }> = [];

  for (const category of CATEGORIES) {
    const totalTopics = topicCounts[category] || 0;
    if (totalTopics === 0) continue;

    const completedTopics = progress.completedTopics[category]?.length || 0;
    const bestScore = progress.bestScores[category] || 0;
    const completionRate = completedTopics / totalTopics;

    // Priority scoring:
    // - Lower best scores = higher priority
    // - Lower completion rates = higher priority
    // - Categories with no attempts = highest priority
    let priority = 0;

    if (bestScore === 0) {
      priority = 100; // Never attempted
    } else if (bestScore < 70) {
      priority = 80 - bestScore; // Failing scores
    } else {
      priority = (1 - completionRate) * 50; // Based on completion
    }

    suggestions.push({ category, priority });
  }

  // Sort by priority descending and return top categories
  return suggestions
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3)
    .map(s => s.category);
}

/**
 * Reset progress for a specific category.
 */
export function resetCategoryProgress(
  progress: UserProgress,
  category: Category
): UserProgress {
  return {
    ...progress,
    completedTopics: {
      ...progress.completedTopics,
      [category]: [],
    },
    bestScores: {
      ...progress.bestScores,
      [category]: 0,
    },
    lastActivity: Date.now(),
  };
}

/**
 * Calculate streak information (consecutive days with activity).
 * Note: This requires storing daily activity timestamps.
 */
export function calculateStreak(activityDates: number[]): {
  currentStreak: number;
  longestStreak: number;
} {
  if (activityDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Convert to date strings for comparison
  const dates = activityDates
    .map(ts => new Date(ts).toDateString())
    .filter((date, index, self) => self.indexOf(date) === index)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;

  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  // Check if there's activity today or yesterday for current streak
  if (dates[0] === today || dates[0] === yesterday) {
    currentStreak = 1;
  }

  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i - 1]);
    const currDate = new Date(dates[i]);
    const dayDiff = Math.floor(
      (prevDate.getTime() - currDate.getTime()) / 86400000
    );

    if (dayDiff === 1) {
      tempStreak++;
      if (i === 1 || currentStreak > 0) {
        currentStreak = tempStreak;
      }
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }

  longestStreak = Math.max(longestStreak, tempStreak);

  return { currentStreak, longestStreak };
}
