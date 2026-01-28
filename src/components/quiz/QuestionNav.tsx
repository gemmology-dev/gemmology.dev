/**
 * Question navigation component for exam mode.
 * Shows all questions as clickable dots with status indicators.
 */

import { cn } from '../ui/cn';

interface QuestionNavProps {
  /** Total number of questions */
  totalQuestions: number;
  /** Current question index (0-based) */
  currentIndex: number;
  /** Check if a question is answered */
  isAnswered: (index: number) => boolean;
  /** Check if a question is flagged */
  isFlagged: (index: number) => boolean;
  /** Navigate to a question */
  onNavigate: (index: number) => void;
  /** Additional class names */
  className?: string;
}

export function QuestionNav({
  totalQuestions,
  currentIndex,
  isAnswered,
  isFlagged,
  onNavigate,
  className,
}: QuestionNavProps) {
  return (
    <nav
      role="navigation"
      aria-label="Question navigation"
      className={cn('bg-white rounded-lg border border-slate-200 p-4', className)}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 id="question-nav-heading" className="text-sm font-medium text-slate-700">
          Questions
        </h3>
        <QuestionLegend />
      </div>

      <div
        role="group"
        aria-labelledby="question-nav-heading"
        className="grid grid-cols-5 sm:grid-cols-10 gap-2"
      >
        {Array.from({ length: totalQuestions }, (_, index) => {
          const answered = isAnswered(index);
          const flagged = isFlagged(index);
          const isCurrent = index === currentIndex;

          // Build descriptive aria-label
          const statusParts: string[] = [];
          if (answered) statusParts.push('answered');
          if (flagged) statusParts.push('flagged');
          const statusText = statusParts.length > 0 ? `, ${statusParts.join(', ')}` : '';

          return (
            <button
              key={index}
              type="button"
              onClick={() => onNavigate(index)}
              aria-label={`Question ${index + 1}${statusText}`}
              aria-current={isCurrent ? 'true' : undefined}
              className={cn(
                'relative w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all',
                'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-crystal-500',
                // Current question
                isCurrent && 'ring-2 ring-crystal-500',
                // Answered
                answered && !isCurrent && 'bg-emerald-100 text-emerald-700',
                // Not answered
                !answered && !isCurrent && 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                // Current + answered
                isCurrent && answered && 'bg-emerald-500 text-white',
                // Current + not answered
                isCurrent && !answered && 'bg-crystal-500 text-white'
              )}
              title={`Question ${index + 1}${flagged ? ' (Flagged)' : ''}${answered ? ' (Answered)' : ''}`}
            >
              {index + 1}

              {/* Flag indicator - decorative, state conveyed via aria-label */}
              {flagged && (
                <span
                  className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full flex items-center justify-center"
                  aria-hidden="true"
                >
                  <svg className="w-2 h-2 text-amber-900" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function QuestionLegend() {
  return (
    <div className="flex items-center gap-3 text-xs text-slate-500" aria-hidden="true">
      <div className="flex items-center gap-1">
        <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200" />
        <span>Answered</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200" />
        <span>Unanswered</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-3 h-3 rounded bg-amber-400" />
        <span>Flagged</span>
      </div>
    </div>
  );
}

interface QuestionNavCompactProps {
  /** Current question number (1-based) */
  current: number;
  /** Total questions */
  total: number;
  /** Number answered */
  answered: number;
  /** Number flagged */
  flagged: number;
  /** Additional class names */
  className?: string;
}

export function QuestionNavCompact({
  current,
  total,
  answered,
  flagged,
  className,
}: QuestionNavCompactProps) {
  return (
    <div
      className={cn('flex items-center gap-4 text-sm', className)}
      role="status"
      aria-label={`Question ${current} of ${total}, ${answered} answered${flagged > 0 ? `, ${flagged} flagged` : ''}`}
    >
      <span className="text-slate-600">
        Question <span className="font-medium">{current}</span> of {total}
      </span>
      <span className="text-emerald-600">
        <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        {answered} answered
      </span>
      {flagged > 0 && (
        <span className="text-amber-600">
          <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
          </svg>
          {flagged} flagged
        </span>
      )}
    </div>
  );
}
