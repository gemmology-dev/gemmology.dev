/**
 * Question card component for displaying a single quiz question.
 * Handles multiple-choice and true/false question types.
 */

import { useState, useCallback } from 'react';
import type { Question } from '../../lib/quiz';
import { AnswerOption, OPTION_LABELS } from './AnswerOption';
import { cn } from '../ui/cn';

interface QuestionCardProps {
  /** The question to display */
  question: Question;
  /** Current question number (1-based) */
  questionNumber: number;
  /** Total number of questions */
  totalQuestions: number;
  /** The user's current answer (if any) */
  selectedAnswer?: string;
  /** Whether to show feedback (practice mode) */
  showFeedback: boolean;
  /** Whether this question has been submitted */
  isSubmitted: boolean;
  /** Callback when an answer is selected */
  onSelectAnswer: (answer: string) => void;
  /** Callback when the question is submitted (practice mode) */
  onSubmit?: () => void;
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  showFeedback,
  isSubmitted,
  onSelectAnswer,
  onSubmit,
}: QuestionCardProps) {
  const options = question.options || [];
  const correctAnswer = Array.isArray(question.correctAnswer)
    ? question.correctAnswer[0]
    : question.correctAnswer;

  // Determine if the selected answer is correct
  const isCorrectAnswer = selectedAnswer === correctAnswer;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500">
            Question {questionNumber} of {totalQuestions}
          </span>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'px-2 py-1 text-xs font-medium rounded-full',
                question.difficulty === 'beginner' && 'bg-emerald-100 text-emerald-700',
                question.difficulty === 'intermediate' && 'bg-amber-100 text-amber-700',
                question.difficulty === 'advanced' && 'bg-red-100 text-red-700'
              )}
            >
              {question.difficulty}
            </span>
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
              {question.category}
            </span>
          </div>
        </div>
      </div>

      {/* Question text */}
      <div className="px-6 py-6">
        <h2 className="text-lg font-medium text-slate-900 leading-relaxed">
          {question.questionText}
        </h2>
      </div>

      {/* Answer options */}
      <div className="px-6 pb-6 space-y-3">
        {options.map((option, index) => (
          <AnswerOption
            key={option}
            text={option}
            label={OPTION_LABELS[index]}
            isSelected={selectedAnswer === option}
            isCorrect={option === correctAnswer}
            isAnswered={isSubmitted && showFeedback}
            disabled={isSubmitted && showFeedback}
            onClick={() => onSelectAnswer(option)}
          />
        ))}
      </div>

      {/* Feedback section (practice mode) */}
      {isSubmitted && showFeedback && (
        <div
          className={cn(
            'px-6 py-4 border-t',
            isCorrectAnswer
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-red-50 border-red-200'
          )}
        >
          <div className="flex items-start gap-3">
            {isCorrectAnswer ? (
              <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <div>
              <p
                className={cn(
                  'font-medium',
                  isCorrectAnswer ? 'text-emerald-700' : 'text-red-700'
                )}
              >
                {isCorrectAnswer ? 'Correct!' : 'Incorrect'}
              </p>
              {!isCorrectAnswer && (
                <p className="text-sm text-red-600 mt-1">
                  The correct answer is: <strong>{correctAnswer}</strong>
                </p>
              )}
              {question.explanation && (
                <p className="text-sm text-slate-600 mt-2">
                  {question.explanation}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Source link */}
      {question.sourceRef && (
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
          <a
            href={question.sourceRef}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-crystal-600 hover:text-crystal-700 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Learn more about {question.topic}
          </a>
        </div>
      )}
    </div>
  );
}
