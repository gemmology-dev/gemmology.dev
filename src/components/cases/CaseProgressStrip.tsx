/**
 * CaseProgressStrip — "Step X of N" progress bar + running score.
 * Modeled on src/components/quiz/QuizProgress.tsx.
 */

import { cn } from '../ui/cn';

interface CaseProgressStripProps {
  /** Current step index (0-based). */
  current: number;
  /** Total number of steps. */
  total: number;
  /** Sum of scoreAwarded across decisions recorded so far. */
  runningScore: number;
  className?: string;
}

export function CaseProgressStrip({ current, total, runningScore, className }: CaseProgressStripProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-crystal-500 transition-all duration-300 ease-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">
          Step {current + 1} of {total}
        </span>
        <span className="text-slate-600">
          Score: <span className="font-medium text-crystal-700">{runningScore}</span>
        </span>
      </div>
    </div>
  );
}
