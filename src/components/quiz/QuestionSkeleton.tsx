/**
 * Skeleton loading component for quiz questions.
 * Displays an animated placeholder while questions are loading.
 */

import { cn } from '../ui/cn';

interface QuestionSkeletonProps {
  /** Number of answer options to show (default: 4) */
  optionCount?: number;
  /** Whether to show the source link skeleton */
  showSourceLink?: boolean;
  /** Additional class names */
  className?: string;
}

export function QuestionSkeleton({
  optionCount = 4,
  showSourceLink = true,
  className,
}: QuestionSkeletonProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden',
        className
      )}
      aria-busy="true"
      aria-label="Loading question"
    >
      {/* Header skeleton */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center justify-between">
          {/* Question number */}
          <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
          {/* Tags */}
          <div className="flex items-center gap-2">
            <div className="h-6 w-20 bg-slate-200 rounded-full animate-pulse" />
            <div className="h-6 w-24 bg-slate-200 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* Question text skeleton */}
      <div className="px-6 py-6 space-y-2">
        <div className="h-5 bg-slate-200 rounded animate-pulse w-full" />
        <div className="h-5 bg-slate-200 rounded animate-pulse w-4/5" />
        <div className="h-5 bg-slate-200 rounded animate-pulse w-2/3" />
      </div>

      {/* Answer options skeleton */}
      <div className="px-6 pb-6 space-y-3">
        {Array.from({ length: optionCount }, (_, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-4 rounded-lg border-2 border-slate-200 bg-white"
            style={{ animationDelay: `${index * 75}ms` }}
          >
            {/* Option label circle */}
            <div className="flex-shrink-0 w-8 h-8 bg-slate-200 rounded-full animate-pulse" />
            {/* Option text */}
            <div className="flex-1 pt-1 space-y-1">
              <div
                className="h-4 bg-slate-200 rounded animate-pulse"
                style={{ width: `${70 + (index % 3) * 10}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Source link skeleton */}
      {showSourceLink && (
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
          <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
        </div>
      )}
    </div>
  );
}

/**
 * Compact skeleton for use in lists or grids.
 */
export function QuestionSkeletonCompact() {
  return (
    <div
      className="bg-white rounded-lg border border-slate-200 p-4"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="space-y-3">
        <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
        <div className="h-5 bg-slate-200 rounded animate-pulse w-full" />
        <div className="h-5 bg-slate-200 rounded animate-pulse w-3/4" />
      </div>
    </div>
  );
}
