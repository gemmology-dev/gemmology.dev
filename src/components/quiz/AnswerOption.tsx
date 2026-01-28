/**
 * Answer option button for quiz questions.
 * Handles different states: default, selected, correct, incorrect.
 */

import { cn } from '../ui/cn';

interface AnswerOptionProps {
  /** The answer text to display */
  text: string;
  /** Option identifier (A, B, C, D) */
  label: string;
  /** Whether this option is currently selected */
  isSelected: boolean;
  /** Whether this is the correct answer (shown after submission) */
  isCorrect?: boolean;
  /** Whether the question has been answered */
  isAnswered: boolean;
  /** Whether the option is disabled */
  disabled?: boolean;
  /** Click handler */
  onClick: () => void;
}

export function AnswerOption({
  text,
  label,
  isSelected,
  isCorrect,
  isAnswered,
  disabled = false,
  onClick,
}: AnswerOptionProps) {
  // Determine the visual state
  const showCorrect = isAnswered && isCorrect;
  const showIncorrect = isAnswered && isSelected && !isCorrect;
  const showMissed = isAnswered && isCorrect && !isSelected;

  // Build accessible label with full context
  const buildAriaLabel = () => {
    const parts = [`Option ${label}: ${text}`];
    if (isSelected) parts.push('selected');
    if (showCorrect) parts.push('correct answer');
    if (showIncorrect) parts.push('incorrect');
    if (showMissed) parts.push('this was the correct answer');
    return parts.join(', ');
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isAnswered}
      aria-label={buildAriaLabel()}
      aria-pressed={isSelected}
      className={cn(
        'w-full flex items-start gap-3 p-4 rounded-lg border-2 text-left',
        'transform transition-all duration-200 ease-out',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-crystal-500',
        // Default state
        !isAnswered && !isSelected && 'border-slate-200 bg-white hover:border-crystal-300 hover:bg-crystal-50 active:scale-[0.98]',
        // Selected state (before submission) - subtle scale up
        !isAnswered && isSelected && 'border-crystal-500 bg-crystal-50 scale-[1.01] shadow-md',
        // Correct answer (after submission)
        showCorrect && 'border-emerald-500 bg-emerald-50',
        // Incorrect selection (after submission)
        showIncorrect && 'border-red-500 bg-red-50',
        // Missed correct answer (after submission)
        showMissed && 'border-emerald-300 bg-emerald-50/50',
        // Disabled
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && !isAnswered && 'cursor-pointer'
      )}
    >
      {/* Option label (A, B, C, D) */}
      <span
        className={cn(
          'flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold',
          // Default state
          !isAnswered && !isSelected && 'bg-slate-100 text-slate-600',
          // Selected state
          !isAnswered && isSelected && 'bg-crystal-500 text-white',
          // Correct
          showCorrect && 'bg-emerald-500 text-white',
          // Incorrect
          showIncorrect && 'bg-red-500 text-white',
          // Missed
          showMissed && 'bg-emerald-200 text-emerald-700'
        )}
      >
        {label}
      </span>

      {/* Answer text */}
      <span
        className={cn(
          'flex-1 pt-1',
          !isAnswered && 'text-slate-700',
          showCorrect && 'text-emerald-700 font-medium',
          showIncorrect && 'text-red-700',
          showMissed && 'text-emerald-600'
        )}
      >
        {text}
      </span>

      {/* Status icon - decorative, state is conveyed via aria-label */}
      {isAnswered && (
        <span className="flex-shrink-0 pt-1" aria-hidden="true">
          {showCorrect && (
            <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
          {showIncorrect && (
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
        </span>
      )}
    </button>
  );
}

/** Labels for answer options */
export const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
