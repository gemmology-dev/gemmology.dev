/**
 * Category progress display component.
 * Shows completion and best scores for each category.
 */

import type { Category, UserProgress } from '../../lib/quiz';
import { CATEGORIES, CATEGORY_LABELS, getProgressSummary } from '../../lib/quiz';
import { cn } from '../ui/cn';

interface CategoryProgressProps {
  /** User's progress data */
  progress: UserProgress;
  /** Total topics per category */
  topicCounts: Record<Category, number>;
  /** Whether to show compact view */
  compact?: boolean;
  /** Additional class names */
  className?: string;
}

export function CategoryProgress({
  progress,
  topicCounts,
  compact = false,
  className,
}: CategoryProgressProps) {
  const summary = getProgressSummary(progress, topicCounts);

  if (compact) {
    return (
      <div className={cn('space-y-2', className)}>
        {summary.map(({ category, percentage, bestScore }) => (
          <CategoryProgressBar
            key={category}
            category={category}
            percentage={percentage}
            bestScore={bestScore}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-4 gap-4', className)}>
      {summary.map(({ category, completedTopics, totalTopics, percentage, bestScore }) => (
        <CategoryCard
          key={category}
          category={category}
          completedTopics={completedTopics}
          totalTopics={totalTopics}
          percentage={percentage}
          bestScore={bestScore}
        />
      ))}
    </div>
  );
}

interface CategoryProgressBarProps {
  category: Category;
  percentage: number;
  bestScore: number;
}

function CategoryProgressBar({ category, percentage, bestScore }: CategoryProgressBarProps) {
  const label = CATEGORY_LABELS[category];

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="text-slate-500">
          Best: {bestScore > 0 ? `${bestScore}%` : '--'}
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            percentage >= 70 ? 'bg-emerald-500' : percentage > 0 ? 'bg-amber-500' : 'bg-slate-200'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface CategoryCardProps {
  category: Category;
  completedTopics: number;
  totalTopics: number;
  percentage: number;
  bestScore: number;
}

function CategoryCard({
  category,
  completedTopics,
  totalTopics,
  percentage,
  bestScore,
}: CategoryCardProps) {
  const label = CATEGORY_LABELS[category];
  const hasProgress = percentage > 0;

  return (
    <div
      className={cn(
        'p-4 rounded-lg border',
        hasProgress ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50'
      )}
    >
      <h4 className="font-medium text-slate-900 text-sm">{label}</h4>

      {/* Progress ring */}
      <div className="mt-3 flex items-center gap-3">
        <div className="relative w-12 h-12">
          <svg className="w-12 h-12 transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-slate-100"
            />
            {/* Progress circle */}
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={`${percentage * 1.256} 125.6`}
              className={cn(
                percentage >= 70 ? 'text-emerald-500' : percentage > 0 ? 'text-amber-500' : 'text-slate-200'
              )}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-slate-700">
            {percentage}%
          </span>
        </div>

        <div className="flex-1 text-sm">
          <p className="text-slate-500">
            {completedTopics}/{totalTopics} topics
          </p>
          {bestScore > 0 && (
            <p className="text-slate-600">
              Best: <span className="font-medium">{bestScore}%</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface OverallProgressProps {
  progress: UserProgress;
  className?: string;
}

export function OverallProgress({ progress, className }: OverallProgressProps) {
  const percentage = progress.totalAttempted > 0
    ? Math.round((progress.totalCorrect / progress.totalAttempted) * 100)
    : 0;

  return (
    <div className={cn('p-6 rounded-xl bg-gradient-to-br from-crystal-500 to-crystal-600 text-white', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Overall Progress</h3>
          <p className="text-crystal-100 text-sm mt-1">
            {progress.totalQuizzes} quizzes completed
          </p>
        </div>

        <div className="text-right">
          <p className="text-4xl font-bold">{percentage}%</p>
          <p className="text-crystal-100 text-sm">
            {progress.totalCorrect}/{progress.totalAttempted} correct
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-3 bg-crystal-700/50 rounded-full overflow-hidden">
        <div
          className="h-full bg-white rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
