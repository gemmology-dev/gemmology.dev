/**
 * Question card component for displaying a single quiz question.
 * Handles multiple-choice, true/false, fill-blank, and matching question types.
 */

import type { ReactNode } from 'react';
import { useState, useEffect, useId } from 'react';
import type { Question, OptionRationale as QuestionOptionRationale } from '../../lib/quiz';
import { checkAnswer } from '../../lib/quiz';
import { AnswerOption, OPTION_LABELS } from './AnswerOption';
import { RationalePanel } from './study/RationalePanel';
import { cn } from '../ui/cn';

interface QuestionCardProps {
  /** The question to display */
  question: Question;
  /** Current question number (1-based) */
  questionNumber: number;
  /** Total number of questions */
  totalQuestions: number;
  /** The user's current answer (if any). String for MCQ/true-false/fill-blank, string[] for matching. */
  selectedAnswer?: string | string[];
  /** Whether to show feedback (practice mode) */
  showFeedback: boolean;
  /** Whether this question has been submitted */
  isSubmitted: boolean;
  /** Callback when an answer is selected */
  onSelectAnswer: (answer: string | string[]) => void;
  /** Callback when the question is submitted (practice mode) */
  onSubmit?: () => void;
  /** Extra content rendered in the header, next to the difficulty/category badges (e.g. a flag button) */
  headerExtra?: ReactNode;
  /** SM-2 schedule status badge, rendered in the header (practice mode, Study v1) */
  scheduleBadge?: ReactNode;
  /** When true, renders the collapsible RationalePanel instead of the plain feedback box. Default false. */
  showRationalePanel?: boolean;
}

/** Inline fill-blank text input. */
function FillBlankInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder="Type your answer..."
      className={cn(
        'w-full px-4 py-3 rounded-lg border-2 text-slate-900',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-crystal-500',
        'border-slate-200 bg-white',
        disabled && 'opacity-70 cursor-not-allowed bg-slate-50'
      )}
      aria-label="Your answer"
    />
  );
}

/** Inline matching-question rows: each left item gets a dropdown of right-side options. */
function MatchingRows({
  pairs,
  value,
  onChange,
  disabled,
}: {
  pairs: Array<{ left: string; right: string }>;
  value: string[];
  onChange: (value: string[]) => void;
  disabled: boolean;
}) {
  const uid = useId();
  // value entries are `${left}:${right}` strings, matching the generator convention.
  const selections = new Map<string, string>();
  for (const entry of value) {
    const idx = entry.indexOf(':');
    if (idx === -1) continue;
    selections.set(entry.slice(0, idx), entry.slice(idx + 1));
  }

  const rightOptions = pairs.map(p => p.right);

  const handleSelect = (left: string, right: string) => {
    const next = new Map(selections);
    if (right) {
      next.set(left, right);
    } else {
      next.delete(left);
    }
    onChange(Array.from(next.entries()).map(([l, r]) => `${l}:${r}`));
  };

  return (
    <div className="space-y-3">
      {pairs.map((pair, index) => (
        <div key={pair.left} className="flex items-center gap-3">
          <span className="flex-1 text-sm text-slate-700">{pair.left}</span>
          <select
            id={`${uid}-match-${index}`}
            name={`${uid}-match-${index}`}
            value={selections.get(pair.left) ?? ''}
            onChange={(e) => handleSelect(pair.left, e.target.value)}
            disabled={disabled}
            aria-label={`Match for ${pair.left}`}
            className={cn(
              'flex-1 px-3 py-2 rounded-lg border-2 text-sm text-slate-900',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-crystal-500',
              'border-slate-200 bg-white',
              disabled && 'opacity-70 cursor-not-allowed bg-slate-50'
            )}
          >
            <option value="">Choose a match...</option>
            {rightOptions.map((right) => (
              <option key={right} value={right}>
                {right}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
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
  headerExtra,
  scheduleBadge,
  showRationalePanel = false,
}: QuestionCardProps) {
  const options = question.options || [];
  const selectedString = typeof selectedAnswer === 'string' ? selectedAnswer : undefined;
  const selectedArray = Array.isArray(selectedAnswer) ? selectedAnswer : [];

  // Local text state for fill-blank so the input stays controlled even before
  // the parent has recorded a first answer.
  const [fillBlankValue, setFillBlankValue] = useState(selectedString ?? '');
  useEffect(() => {
    setFillBlankValue(selectedString ?? '');
  }, [selectedString, question.id]);

  const hasAnswer = selectedAnswer !== undefined;
  const isAnswered = isSubmitted && showFeedback;
  const isCorrectAnswer = hasAnswer && checkAnswer(question, selectedAnswer);

  // For single-value display purposes (feedback text, RationalePanel highlighting).
  const correctAnswerDisplay = Array.isArray(question.correctAnswer)
    ? question.correctAnswer[0]
    : question.correctAnswer;

  const userPickedIndex =
    (question.type === 'multiple-choice' || question.type === 'true-false') && selectedString
      ? options.indexOf(selectedString)
      : undefined;

  const optionRationales: QuestionOptionRationale[] | undefined = question.optionRationales;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-600">
            Question {questionNumber} of {totalQuestions}
          </span>
          <div className="flex items-center gap-2">
            {scheduleBadge}
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
            {headerExtra}
          </div>
        </div>
      </div>

      {/* Question text */}
      <div className="px-6 py-6">
        <h2 className="text-lg font-medium text-slate-900 leading-relaxed">
          {question.questionText}
        </h2>
      </div>

      {/* Answer input, branched by question type */}
      <div className="px-6 pb-6">
        {(question.type === 'multiple-choice' || question.type === 'true-false') && (
          <div className="space-y-3">
            {options.map((option, index) => (
              <AnswerOption
                key={option}
                text={option}
                label={OPTION_LABELS[index]}
                isSelected={selectedString === option}
                isCorrect={option === correctAnswerDisplay}
                isAnswered={isAnswered}
                disabled={isAnswered}
                onClick={() => onSelectAnswer(option)}
              />
            ))}
          </div>
        )}

        {question.type === 'fill-blank' && (
          <FillBlankInput
            value={fillBlankValue}
            onChange={(value) => {
              setFillBlankValue(value);
              onSelectAnswer(value);
            }}
            disabled={isAnswered}
          />
        )}

        {question.type === 'matching' && question.matchingPairs && (
          <MatchingRows
            pairs={question.matchingPairs}
            value={selectedArray}
            onChange={onSelectAnswer}
            disabled={isAnswered}
          />
        )}
      </div>

      {/* Feedback section (practice mode) */}
      {isAnswered && showRationalePanel && question.rationaleCorrect && (
        <div className="px-6 pb-6">
          <RationalePanel
            correct={isCorrectAnswer}
            rationaleCorrect={question.rationaleCorrect}
            optionRationales={optionRationales}
            userPickedIndex={userPickedIndex}
            show={true}
          />
        </div>
      )}

      {isAnswered && (!showRationalePanel || !question.rationaleCorrect) && (
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
                  The correct answer is: <strong>{correctAnswerDisplay}</strong>
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
            className="text-sm text-crystal-700 hover:text-crystal-700 flex items-center gap-1"
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
