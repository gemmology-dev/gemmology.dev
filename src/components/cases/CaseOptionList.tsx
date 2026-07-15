/**
 * CaseOptionList — the list of decision options for a single case step.
 *
 * Markup and a11y are modeled on src/components/quiz/AnswerOption.tsx
 * (aria-pressed, disabled after submit, per-option aria-label), extended to a
 * 3-tier post-submit reveal instead of a binary correct/incorrect one:
 * optimal = emerald, acceptable = amber, poor = red. The option the user
 * actually chose gets an additional highlight ring so it stands out among
 * same-tier siblings.
 *
 * Light-only: no `dark:` classes (site convention for new Study components).
 */

import { cn } from '../ui/cn';
import { Badge } from '../ui/Badge';
import type { CaseOption, CaseOptionWeight } from '../../lib/cases/case-types';

export const CASE_OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

interface CaseOptionListProps {
  options: CaseOption[];
  /** Currently selected (pre-submit) option id. */
  selectedOptionId: string | null;
  /** Whether a decision has already been submitted for this step. */
  isSubmitted: boolean;
  onSelect: (optionId: string) => void;
}

function tierBadgeVariant(weight: CaseOptionWeight): 'emerald' | 'topaz' | 'ruby' {
  if (weight === 'optimal') return 'emerald';
  if (weight === 'acceptable') return 'topaz';
  return 'ruby';
}

function tierLabel(weight: CaseOptionWeight): string {
  if (weight === 'optimal') return 'Optimal';
  if (weight === 'acceptable') return 'Acceptable';
  return 'Poor';
}

export function CaseOptionList({
  options,
  selectedOptionId,
  isSubmitted,
  onSelect,
}: CaseOptionListProps) {
  return (
    <div className="space-y-3" role="group" aria-label="Decision options">
      {options.map((option, index) => {
        const label = CASE_OPTION_LABELS[index] ?? String(index + 1);
        const isSelected = selectedOptionId === option.id;
        const isChosen = isSubmitted && isSelected;

        const ariaLabelParts = [`Option ${label}: ${option.text}`];
        if (isSelected) ariaLabelParts.push('selected');
        if (isSubmitted) ariaLabelParts.push(`${tierLabel(option.weight)} choice`);
        if (isChosen) ariaLabelParts.push('your choice');

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            disabled={isSubmitted}
            aria-pressed={isSelected}
            aria-label={ariaLabelParts.join(', ')}
            className={cn(
              'w-full flex items-start gap-3 p-4 rounded-lg border-2 text-left',
              'transform transition-all duration-200 ease-out',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-crystal-500',
              // Pre-submit default / selected states.
              !isSubmitted && !isSelected && 'border-slate-200 bg-white hover:border-crystal-300 hover:bg-crystal-50 active:scale-[0.98]',
              !isSubmitted && isSelected && 'border-crystal-500 bg-crystal-50 scale-[1.01] shadow-md',
              // Post-submit: every option reveals its tier, so the acceptable
              // middle state is never lost even when it wasn't the choice made.
              isSubmitted && option.weight === 'optimal' && 'border-emerald-500 bg-emerald-50',
              isSubmitted && option.weight === 'acceptable' && 'border-amber-500 bg-amber-50',
              isSubmitted && option.weight === 'poor' && 'border-red-500 bg-red-50',
              // The chosen option gets an extra highlight ring.
              isChosen && 'ring-2 ring-offset-2 ring-slate-900/60',
              isSubmitted && 'cursor-not-allowed',
              !isSubmitted && 'cursor-pointer',
            )}
          >
            <span
              className={cn(
                'flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold',
                !isSubmitted && !isSelected && 'bg-slate-100 text-slate-600',
                !isSubmitted && isSelected && 'bg-crystal-700 text-white',
                isSubmitted && option.weight === 'optimal' && 'bg-emerald-500 text-white',
                isSubmitted && option.weight === 'acceptable' && 'bg-amber-500 text-white',
                isSubmitted && option.weight === 'poor' && 'bg-red-500 text-white',
              )}
            >
              {label}
            </span>

            <span className="flex-1 pt-1 space-y-1">
              <span
                className={cn(
                  'block',
                  !isSubmitted && 'text-slate-700',
                  isSubmitted && option.weight === 'optimal' && 'text-emerald-700 font-medium',
                  isSubmitted && option.weight === 'acceptable' && 'text-amber-800',
                  isSubmitted && option.weight === 'poor' && 'text-red-700',
                )}
              >
                {option.text}
                {isChosen && <span className="ml-2 text-xs font-normal text-slate-500">(your choice)</span>}
              </span>

              {isSubmitted && (
                <Badge variant={tierBadgeVariant(option.weight)} size="sm">
                  {tierLabel(option.weight)} &middot; +{option.score} pts
                </Badge>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
