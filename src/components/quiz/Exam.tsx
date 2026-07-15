/**
 * Exam mode component.
 * Timed assessment with no immediate feedback, question flagging, and navigation.
 *
 * A8: useQuizKeyboard wires digits 1-4 (select option) and Enter
 * (advance/open submit-confirm) shortcuts. Enter never auto-submits the exam
 * past the confirm step — on the last question it opens the confirm dialog
 * instead of calling submitExam() directly.
 */

import { useState, useCallback } from 'react';
import type { Question, QuizConfig } from '../../lib/quiz';
import { isRenderable } from '../../lib/quiz';
import { useExam } from '../../hooks/useExam';
import { useQuizKeyboard } from '../../hooks/useQuizKeyboard';
import { QuestionCard } from './QuestionCard';
import { UnrenderableQuestionCard } from './UnrenderableQuestionCard';
import { ExamTimer } from './ExamTimer';
import { QuestionNav, QuestionNavCompact } from './QuestionNav';
import { ExamResults } from './ExamResults';
import { ConfirmDialog } from './ConfirmDialog';
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
    skipQuestion,
  } = useExam({
    config,
    questions,
    timeLimit,
    autoSubmitOnTimeout: true,
  });

  // A8: digit keys 1-4 select an option (multiple-choice/true-false only).
  const handleSelectIndex = useCallback((index: number) => {
    if (!currentQuestion) return;
    if (currentQuestion.type !== 'multiple-choice' && currentQuestion.type !== 'true-false') return;
    const options = currentQuestion.options;
    if (!options || index < 0 || index >= options.length) return;
    selectAnswer(options[index]);
  }, [currentQuestion, selectAnswer]);

  // A8: Enter advances to the next question, or opens the submit-confirm
  // dialog on the last question — it never submits the exam directly.
  const handleEnter = useCallback(() => {
    if (!currentQuestion) return;
    const isLast = state.currentIndex === questions.length - 1;
    if (isLast) {
      setConfirmSubmit(true);
    } else {
      nextQuestion();
    }
  }, [currentQuestion, state.currentIndex, questions.length, nextQuestion]);

  useQuizKeyboard({
    enabled: !isComplete && !!currentQuestion && !confirmSubmit,
    onSelectIndex: handleSelectIndex,
    onEnter: handleEnter,
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
        <p className="text-slate-600">No questions available</p>
        <Button variant="secondary" onClick={onBack} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const unansweredCount = questions.length - answeredCount;
  const isFlagged = isQuestionFlagged(currentQuestion.id);

  // Calculate pacing indicator
  const timeUsed = timeLimit - timeRemaining;
  const suggestedTimePerQuestion = timeLimit / questions.length;
  const expectedQuestionIndex = Math.floor(timeUsed / suggestedTimePerQuestion);
  const actualQuestionIndex = state.currentIndex;
  // Consider "on pace" if within 1 question of expected, or ahead
  const isPacingOk = actualQuestionIndex >= expectedQuestionIndex - 1;
  // Calculate how many questions ahead/behind
  const pacingDiff = actualQuestionIndex - expectedQuestionIndex;

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

          {/* Pacing indicator - hidden on mobile, shows on sm+ */}
          <div
            className={cn(
              'hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
              isPacingOk
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            )}
            title={pacingDiff >= 0
              ? `${pacingDiff} question${pacingDiff !== 1 ? 's' : ''} ahead of suggested pace`
              : `${Math.abs(pacingDiff)} question${Math.abs(pacingDiff) !== 1 ? 's' : ''} behind suggested pace`
            }
          >
            {isPacingOk ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span>{isPacingOk ? 'On pace' : 'Behind pace'}</span>
          </div>

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
      {isRenderable(currentQuestion) ? (
        <QuestionCard
          question={currentQuestion}
          questionNumber={state.currentIndex + 1}
          totalQuestions={questions.length}
          selectedAnswer={state.answers.get(currentQuestion.id)}
          showFeedback={false}
          isSubmitted={false}
          onSelectAnswer={selectAnswer}
          headerExtra={
            <button
              type="button"
              onClick={toggleFlag}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                isFlagged
                  ? 'bg-amber-100 text-amber-600'
                  : 'hover:bg-slate-100 text-slate-600 hover:text-slate-700'
              )}
              title={isFlagged ? 'Remove flag' : 'Flag for review'}
            >
              <svg className="w-5 h-5" fill={isFlagged ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
            </button>
          }
        />
      ) : (
        <UnrenderableQuestionCard
          questionNumber={state.currentIndex + 1}
          totalQuestions={questions.length}
          onSkip={skipQuestion}
        />
      )}

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
      <ConfirmDialog
        open={confirmSubmit}
        title="Submit Exam?"
        confirmLabel="Submit Exam"
        cancelLabel="Review Questions"
        onCancel={() => setConfirmSubmit(false)}
        onConfirm={() => {
          setConfirmSubmit(false);
          submitExam();
        }}
      >
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
        <p>Once submitted, you cannot change your answers.</p>
      </ConfirmDialog>
    </div>
  );
}
