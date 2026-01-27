/**
 * Quiz results summary component.
 * Shows score, breakdown by category, and options to retry or start new quiz.
 */

import type { QuizResult, CategoryBreakdown } from '../../lib/quiz';
import { getGrade, getFeedback, formatDuration, CATEGORY_LABELS } from '../../lib/quiz';
import { Button } from '../ui/Button';
import { cn } from '../ui/cn';

interface QuizResultsProps {
  /** The quiz results to display */
  results: QuizResult;
  /** Callback to retry the same quiz */
  onRetry: () => void;
  /** Callback to start a new quiz */
  onNewQuiz: () => void;
  /** Callback to review answers */
  onReview?: () => void;
}

export function QuizResults({
  results,
  onRetry,
  onNewQuiz,
  onReview,
}: QuizResultsProps) {
  const grade = getGrade(results.percentage);
  const feedback = getFeedback(results.percentage);
  const duration = formatDuration(results.timeTaken);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Main score card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div
          className={cn(
            'px-6 py-8 text-center',
            results.percentage >= 70 ? 'bg-emerald-50' : 'bg-amber-50'
          )}
        >
          {/* Grade circle */}
          <div
            className={cn(
              'w-24 h-24 mx-auto rounded-full flex items-center justify-center text-4xl font-bold',
              results.percentage >= 90 && 'bg-emerald-500 text-white',
              results.percentage >= 70 && results.percentage < 90 && 'bg-emerald-400 text-white',
              results.percentage >= 60 && results.percentage < 70 && 'bg-amber-400 text-white',
              results.percentage < 60 && 'bg-red-400 text-white'
            )}
          >
            {grade}
          </div>

          {/* Score */}
          <div className="mt-4">
            <p className="text-3xl font-bold text-slate-900">
              {results.score} / {results.totalQuestions}
            </p>
            <p className="text-lg text-slate-600 mt-1">
              {results.percentage}% correct
            </p>
          </div>

          {/* Feedback */}
          <p className="mt-4 text-slate-600">
            {feedback}
          </p>
        </div>

        {/* Stats */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="text-center">
              <p className="text-slate-500">Time</p>
              <p className="font-medium text-slate-900">{duration}</p>
            </div>
            <div className="text-center">
              <p className="text-slate-500">Questions</p>
              <p className="font-medium text-slate-900">{results.totalQuestions}</p>
            </div>
            <div className="text-center">
              <p className="text-slate-500">Mode</p>
              <p className="font-medium text-slate-900 capitalize">{results.config.mode}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      {results.breakdown.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">Score by Category</h3>
          </div>
          <div className="p-4 space-y-3">
            {results.breakdown.map((breakdown) => (
              <CategoryScoreBar key={breakdown.category} breakdown={breakdown} />
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {onReview && (
          <Button variant="outline" onClick={onReview} className="flex-1">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Review Answers
          </Button>
        )}
        <Button variant="secondary" onClick={onRetry} className="flex-1">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Retry Quiz
        </Button>
        <Button variant="primary" onClick={onNewQuiz} className="flex-1">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Quiz
        </Button>
      </div>
    </div>
  );
}

interface CategoryScoreBarProps {
  breakdown: CategoryBreakdown;
}

function CategoryScoreBar({ breakdown }: CategoryScoreBarProps) {
  const label = CATEGORY_LABELS[breakdown.category] || breakdown.category;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-900">
          {breakdown.correct}/{breakdown.total} ({breakdown.percentage}%)
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            breakdown.percentage >= 70 ? 'bg-emerald-500' : 'bg-amber-500'
          )}
          style={{ width: `${breakdown.percentage}%` }}
        />
      </div>
    </div>
  );
}
