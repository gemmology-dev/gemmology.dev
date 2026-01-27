/**
 * Exam mode component.
 * Timed assessment with no immediate feedback, question flagging, and navigation.
 */

import { useState } from 'react';
import type { Question, QuizConfig } from '../../lib/quiz';
import { useExam } from '../../hooks/useExam';
import { QuestionCard } from './QuestionCard';
import { ExamTimer } from './ExamTimer';
import { QuestionNav, QuestionNavCompact } from './QuestionNav';
import { ExamResults } from './ExamResults';
import { Button } from '../ui/Button';
import { cn } from '../ui/cn';

interface ExamProps {
  /** Exam configuration */
  config: QuizConfig;
  /** Questions to display */
  questions: Question[];
  /** Time limit in seconds */
  timeLimit: number;
  /** Callback when exam is completed */
  onComplete?: () => void;
  /** Callback to return to setup */
  onBack?: () => void;
}

export function Exam({
  config,
  questions,
  timeLimit,
  onComplete,
  onBack,
}: ExamProps) {
  const [showNav, setShowNav] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const {
    state,
    currentQuestion,
    hasAnswer,
    isComplete,
    results,
    timeRemaining,
    isTimerRunning,
    isTimeExpired,
    answeredCount,
    flaggedCount,
    selectAnswer,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    toggleFlag,
    isQuestionFlagged,
    isQuestionAnswered,
    submitExam,
    resetExam,
  } = useExam({
    config,
    questions,
    timeLimit,
    autoSubmitOnTimeout: true,
  });

  // Show results if exam is complete
  if (isComplete && results) {
    return (
      <ExamResults
        results={results}
        timeLimit={timeLimit}
        onRetry={resetExam}
        onNewExam={onBack || resetExam}
      />
    );
  }

  // No question to show
  if (!currentQuestion) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">No questions available</p>
        <Button variant="secondary" onClick={onBack} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const unansweredCount = questions.length - answeredCount;
  const isFlagged = isQuestionFlagged(currentQuestion.id);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header bar */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200 -mx-4 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Timer */}
          <ExamTimer
            timeRemaining={timeRemaining}
            isRunning={isTimerRunning}
            isExpired={isTimeExpired}
          />

          {/* Quick stats */}
          <QuestionNavCompact
            current={state.currentIndex + 1}
            total={questions.length}
            answered={answeredCount}
            flagged={flaggedCount}
            className="hidden sm:flex"
          />

          {/* Navigation toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNav(!showNav)}
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            {showNav ? 'Hide' : 'Show'} Questions
          </Button>
        </div>
      </div>

      {/* Question navigation panel */}
      {showNav && (
        <QuestionNav
          totalQuestions={questions.length}
          currentIndex={state.currentIndex}
          isAnswered={(index) => isQuestionAnswered(questions[index].id)}
          isFlagged={(index) => isQuestionFlagged(questions[index].id)}
          onNavigate={goToQuestion}
        />
      )}

      {/* Question card - no feedback in exam mode */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Question header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Question {state.currentIndex + 1} of {questions.length}
            </span>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'px-2 py-1 text-xs font-medium rounded-full',
                  currentQuestion.difficulty === 'beginner' && 'bg-emerald-100 text-emerald-700',
                  currentQuestion.difficulty === 'intermediate' && 'bg-amber-100 text-amber-700',
                  currentQuestion.difficulty === 'advanced' && 'bg-red-100 text-red-700'
                )}
              >
                {currentQuestion.difficulty}
              </span>

              {/* Flag button */}
              <button
                type="button"
                onClick={toggleFlag}
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  isFlagged
                    ? 'bg-amber-100 text-amber-600'
                    : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
                )}
                title={isFlagged ? 'Remove flag' : 'Flag for review'}
              >
                <svg className="w-5 h-5" fill={isFlagged ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Question text */}
        <div className="px-6 py-6">
          <h2 className="text-lg font-medium text-slate-900 leading-relaxed">
            {currentQuestion.questionText}
          </h2>
        </div>

        {/* Answer options - no feedback shown */}
        <div className="px-6 pb-6 space-y-3">
          {currentQuestion.options?.map((option, index) => {
            const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
            const isSelected = state.answers.get(currentQuestion.id) === option;

            return (
              <button
                key={option}
                type="button"
                onClick={() => selectAnswer(option)}
                className={cn(
                  'w-full flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-crystal-500',
                  isSelected
                    ? 'border-crystal-500 bg-crystal-50'
                    : 'border-slate-200 bg-white hover:border-crystal-300 hover:bg-crystal-50'
                )}
              >
                <span
                  className={cn(
                    'flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold',
                    isSelected ? 'bg-crystal-500 text-white' : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {labels[index]}
                </span>
                <span className="flex-1 pt-1 text-slate-700">{option}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          onClick={previousQuestion}
          disabled={state.currentIndex === 0}
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </Button>

        <div className="flex gap-2">
          {state.currentIndex === questions.length - 1 ? (
            <Button
              variant="primary"
              onClick={() => setConfirmSubmit(true)}
            >
              Submit Exam
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </Button>
          ) : (
            <Button variant="primary" onClick={nextQuestion}>
              Next
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          )}
        </div>
      </div>

      {/* Submit confirmation modal */}
      {confirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900">Submit Exam?</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>
                <span className="font-medium text-emerald-600">{answeredCount}</span> of {questions.length} questions answered
              </p>
              {unansweredCount > 0 && (
                <p className="text-amber-600">
                  <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {unansweredCount} questions unanswered
                </p>
              )}
              {flaggedCount > 0 && (
                <p className="text-amber-600">
                  <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                  </svg>
                  {flaggedCount} questions flagged for review
                </p>
              )}
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Once submitted, you cannot change your answers.
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setConfirmSubmit(false)}
                className="flex-1"
              >
                Review Questions
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setConfirmSubmit(false);
                  submitExam();
                }}
                className="flex-1"
              >
                Submit Exam
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
