/**
 * Main Quiz component for practice mode.
 * Combines question display, navigation, and results.
 */

import { useState, useCallback } from 'react';
import type { Question, QuizConfig } from '../../lib/quiz';
import { useQuiz } from '../../hooks/useQuiz';
import { QuestionCard } from './QuestionCard';
import { QuizProgress } from './QuizProgress';
import { QuizResults } from './QuizResults';
import { Button } from '../ui/Button';

interface QuizProps {
  /** Quiz configuration */
  config: QuizConfig;
  /** Questions to display */
  questions: Question[];
  /** Callback when quiz is completed */
  onComplete?: () => void;
  /** Callback to return to setup */
  onBack?: () => void;
}

export function Quiz({
  config,
  questions,
  onComplete,
  onBack,
}: QuizProps) {
  const {
    state,
    currentQuestion,
    hasAnswer,
    isComplete,
    isSubmitted,
    score,
    results,
    selectAnswer,
    submitAnswer,
    nextQuestion,
    previousQuestion,
    submitQuiz,
    resetQuiz,
  } = useQuiz({ config, questions, persist: true });

  // Show results if quiz is complete
  if (isComplete && results) {
    return (
      <QuizResults
        results={results}
        onRetry={resetQuiz}
        onNewQuiz={onBack || resetQuiz}
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

  const isLastQuestion = state.currentIndex === state.questions.length - 1;
  const allAnswered = state.answers.size === state.questions.length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress bar */}
      <QuizProgress
        current={state.currentIndex}
        total={state.questions.length}
        score={score}
        showScore={config.mode === 'practice'}
      />

      {/* Question card */}
      <QuestionCard
        question={currentQuestion}
        questionNumber={state.currentIndex + 1}
        totalQuestions={state.questions.length}
        selectedAnswer={state.answers.get(currentQuestion.id) as string}
        showFeedback={config.mode === 'practice'}
        isSubmitted={isSubmitted}
        onSelectAnswer={(answer) => selectAnswer(answer)}
      />

      {/* Navigation */}
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
          {/* Submit answer button (practice mode) */}
          {config.mode === 'practice' && !isSubmitted && hasAnswer && (
            <Button variant="secondary" onClick={submitAnswer}>
              Check Answer
            </Button>
          )}

          {/* Next/Finish button */}
          {isLastQuestion ? (
            <Button
              variant="primary"
              onClick={submitQuiz}
              disabled={config.mode === 'practice' ? !isSubmitted : !hasAnswer}
            >
              Finish Quiz
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={nextQuestion}
              disabled={config.mode === 'practice' ? !isSubmitted : !hasAnswer}
            >
              Next
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          )}
        </div>
      </div>

      {/* Quick finish option when all questions are answered */}
      {allAnswered && !isLastQuestion && (
        <div className="text-center pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-500 mb-2">
            All questions answered!
          </p>
          <Button variant="outline" onClick={submitQuiz}>
            Submit Quiz Now
          </Button>
        </div>
      )}
    </div>
  );
}
