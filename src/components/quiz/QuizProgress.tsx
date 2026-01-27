/**
 * Quiz progress indicator showing current progress and score.
 */

import { cn } from '../ui/cn';

interface QuizProgressProps {
  /** Current question index (0-based) */
  current: number;
  /** Total number of questions */
  total: number;
  /** Number of correct answers so far */
  score?: number;
  /** Whether to show the score */
  showScore?: boolean;
  /** Additional class names */
  className?: string;
}

export function QuizProgress({
  current,
  total,
  score = 0,
  showScore = false,
  className,
}: QuizProgressProps) {
  const percentage = total > 0 ? Math.round(((current) / total) * 100) : 0;
  const scorePercentage = current > 0 ? Math.round((score / current) * 100) : 0;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Progress bar */}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-crystal-500 transition-all duration-300 ease-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">
          Question {current + 1} of {total}
        </span>
        {showScore && current > 0 && (
          <span className="text-slate-600">
            Score: <span className="font-medium text-crystal-600">{score}/{current}</span>
            <span className="text-slate-400 ml-1">({scorePercentage}%)</span>
          </span>
        )}
      </div>
    </div>
  );
}

interface QuizProgressDotsProps {
  /** Total number of questions */
  total: number;
  /** Current question index (0-based) */
  current: number;
  /** Map of question index to whether it was answered correctly */
  results?: Map<number, boolean>;
  /** Set of flagged question indices (exam mode) */
  flagged?: Set<number>;
  /** Callback when a dot is clicked */
  onNavigate?: (index: number) => void;
  /** Additional class names */
  className?: string;
}

export function QuizProgressDots({
  total,
  current,
  results,
  flagged,
  onNavigate,
  className,
}: QuizProgressDotsProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {Array.from({ length: total }, (_, index) => {
        const isAnswered = results?.has(index);
        const isCorrect = results?.get(index);
        const isFlagged = flagged?.has(index);
        const isCurrent = index === current;

        return (
          <button
            key={index}
            type="button"
            onClick={() => onNavigate?.(index)}
            disabled={!onNavigate}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-crystal-500',
              // Current question
              isCurrent && 'ring-2 ring-crystal-500 ring-offset-2',
              // Not answered
              !isAnswered && !isCurrent && 'bg-slate-100 text-slate-400',
              // Answered correctly
              isAnswered && isCorrect && 'bg-emerald-100 text-emerald-700',
              // Answered incorrectly
              isAnswered && !isCorrect && 'bg-red-100 text-red-700',
              // Flagged
              isFlagged && 'ring-2 ring-amber-400',
              // Interactive
              onNavigate && 'hover:scale-110 cursor-pointer'
            )}
          >
            {isFlagged ? (
              <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
              </svg>
            ) : (
              index + 1
            )}
          </button>
        );
      })}
    </div>
  );
}
