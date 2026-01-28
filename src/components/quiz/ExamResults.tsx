/**
 * Exam results component with detailed breakdown.
 * Shows score, time analysis, category breakdown, and question review.
 */

import { useState } from 'react';
import type { QuizResult, QuestionResult } from '../../lib/quiz';
import { getGrade, getFeedback, formatDuration, getPassStatus, CATEGORY_LABELS } from '../../lib/quiz';
import { Button } from '../ui/Button';
import { cn } from '../ui/cn';

interface ExamResultsProps {
  /** The exam results */
  results: QuizResult;
  /** Original time limit in seconds */
  timeLimit: number;
  /** Callback to retry the exam */
  onRetry: () => void;
  /** Callback to start a new exam */
  onNewExam: () => void;
}

export function ExamResults({
  results,
  timeLimit,
  onRetry,
  onNewExam,
}: ExamResultsProps) {
  const [showReview, setShowReview] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'incorrect' | 'correct'>('all');

  const grade = getGrade(results.percentage);
  const feedback = getFeedback(results.percentage);
  const duration = formatDuration(results.timeTaken);
  const { passed, message } = getPassStatus(results.percentage, 70);

  // Calculate time usage
  const timeUsedPercent = Math.round((results.timeTaken / (timeLimit * 1000)) * 100);
  const timeUnusedSeconds = Math.max(0, timeLimit - Math.floor(results.timeTaken / 1000));

  // Filter results for review
  const filteredResults = results.results.filter(r => {
    if (reviewFilter === 'incorrect') return !r.isCorrect;
    if (reviewFilter === 'correct') return r.isCorrect;
    return true;
  });

  const incorrectCount = results.results.filter(r => !r.isCorrect).length;

  if (showReview) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Review header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Question Review</h2>
            <p className="text-slate-600 mt-1">
              Review your answers and see explanations
            </p>
          </div>
          <Button variant="secondary" onClick={() => setShowReview(false)}>
            Back to Results
          </Button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 border-b border-slate-200 pb-2">
          {[
            { value: 'all' as const, label: `All (${results.results.length})` },
            { value: 'incorrect' as const, label: `Incorrect (${incorrectCount})` },
            { value: 'correct' as const, label: `Correct (${results.score})` },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setReviewFilter(tab.value)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                reviewFilter === tab.value
                  ? 'bg-crystal-100 text-crystal-700'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Questions list */}
        <div className="space-y-4">
          {filteredResults.map((result, index) => (
            <QuestionReviewCard
              key={result.question.id}
              result={result}
              questionNumber={results.results.indexOf(result) + 1}
            />
          ))}
        </div>

        {filteredResults.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No questions match this filter.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Pass/Fail banner */}
      <div
        className={cn(
          'rounded-xl p-6 text-center',
          passed ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'
        )}
      >
        <div
          className={cn(
            'w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl font-bold',
            passed ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
          )}
        >
          {passed ? (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            grade
          )}
        </div>
        <h2
          className={cn(
            'mt-4 text-2xl font-bold',
            passed ? 'text-emerald-700' : 'text-amber-700'
          )}
        >
          {passed ? 'Exam Passed!' : 'Keep Studying'}
        </h2>
        <p className={cn('mt-2', passed ? 'text-emerald-600' : 'text-amber-600')}>
          {message}
        </p>
      </div>

      {/* Score breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-900">Results Summary</h3>
        </div>

        <div className="p-6">
          {/* Main score */}
          <div className="text-center pb-6 border-b border-slate-200">
            <p className="text-4xl font-bold text-slate-900">
              {results.score} / {results.totalQuestions}
            </p>
            <p className="text-lg text-slate-600 mt-1">
              {results.percentage}% correct
            </p>
            <p className="text-sm text-slate-500 mt-2">{feedback}</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-4 pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{grade}</p>
              <p className="text-sm text-slate-500">Grade</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{duration}</p>
              <p className="text-sm text-slate-500">Time Used</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{timeUsedPercent}%</p>
              <p className="text-sm text-slate-500">Time Usage</p>
            </div>
          </div>

          {/* Time bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-600">Time Used</span>
              <span className="text-slate-500">
                {timeUnusedSeconds > 0
                  ? `${formatDuration(timeUnusedSeconds * 1000)} remaining`
                  : 'Time limit reached'}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  timeUsedPercent >= 90 ? 'bg-amber-500' : 'bg-crystal-500'
                )}
                style={{ width: `${Math.min(timeUsedPercent, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      {results.breakdown.length > 1 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-semibold text-slate-900">Score by Category</h3>
          </div>
          <div className="p-4 space-y-3">
            {results.breakdown.map((breakdown, index) => {
              const label = CATEGORY_LABELS[breakdown.category] || breakdown.category;
              const isWeak = breakdown.percentage < 70;

              return (
                <div
                  key={breakdown.category}
                  className="space-y-1 animate-slide-in-up opacity-0"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animationFillMode: 'forwards',
                  }}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className={cn('text-slate-600', isWeak && 'text-amber-700 font-medium')}>
                      {label}
                      {isWeak && (
                        <span className="ml-2 text-xs text-amber-500">Needs review</span>
                      )}
                    </span>
                    <span className="font-medium text-slate-900">
                      {breakdown.correct}/{breakdown.total} ({breakdown.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-700 ease-out',
                        breakdown.percentage >= 70 ? 'bg-emerald-500' : 'bg-amber-500'
                      )}
                      style={{
                        width: `${breakdown.percentage}%`,
                        transitionDelay: `${index * 100 + 200}ms`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          onClick={() => setShowReview(true)}
          className="flex-1"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Review Answers
        </Button>
        <Button variant="secondary" onClick={onRetry} className="flex-1">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Retry Exam
        </Button>
        <Button variant="primary" onClick={onNewExam} className="flex-1">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Exam
        </Button>
      </div>
    </div>
  );
}

interface QuestionReviewCardProps {
  result: QuestionResult;
  questionNumber: number;
}

function QuestionReviewCard({ result, questionNumber }: QuestionReviewCardProps) {
  const { question, userAnswer, isCorrect } = result;
  const correctAnswer = Array.isArray(question.correctAnswer)
    ? question.correctAnswer[0]
    : question.correctAnswer;

  return (
    <div
      className={cn(
        'rounded-xl border overflow-hidden',
        isCorrect ? 'border-emerald-200' : 'border-red-200'
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'px-4 py-2 flex items-center justify-between',
          isCorrect ? 'bg-emerald-50' : 'bg-red-50'
        )}
      >
        <span className="text-sm font-medium text-slate-700">
          Question {questionNumber}
        </span>
        <span
          className={cn(
            'px-2 py-1 text-xs font-medium rounded-full',
            isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          )}
        >
          {isCorrect ? 'Correct' : 'Incorrect'}
        </span>
      </div>

      {/* Question */}
      <div className="p-4">
        <p className="font-medium text-slate-900">{question.questionText}</p>

        <div className="mt-4 space-y-2">
          {/* Your answer */}
          <div className="flex items-start gap-2">
            <span className="text-sm text-slate-500 w-24 flex-shrink-0">Your answer:</span>
            <span
              className={cn(
                'text-sm font-medium',
                isCorrect ? 'text-emerald-600' : 'text-red-600'
              )}
            >
              {userAnswer || '(No answer)'}
            </span>
          </div>

          {/* Correct answer (if wrong) */}
          {!isCorrect && (
            <div className="flex items-start gap-2">
              <span className="text-sm text-slate-500 w-24 flex-shrink-0">Correct:</span>
              <span className="text-sm font-medium text-emerald-600">{correctAnswer}</span>
            </div>
          )}

          {/* Explanation */}
          {question.explanation && (
            <div className="mt-3 p-3 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600">{question.explanation}</p>
            </div>
          )}

          {/* Source link */}
          {question.sourceRef && (
            <a
              href={question.sourceRef}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-sm text-crystal-600 hover:text-crystal-700"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Learn more about {question.topic}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
