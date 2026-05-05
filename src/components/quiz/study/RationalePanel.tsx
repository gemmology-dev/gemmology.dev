/**
 * RationalePanel — collapsible post-submit feedback panel.
 *
 * Shows the `rationaleCorrect` summary plus per-option rationales, colour-coded
 * by whether each option is correct, incorrect-chosen, or merely incorrect.
 *
 * Uses Card, CardHeader, CardTitle, CardContent from `@/components/ui`.
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent } from '../../ui/Card';
import { cn } from '../../ui/cn';

export interface OptionRationale {
  /** Display text of this option. */
  text: string;
  /** Whether this is the correct answer. */
  isCorrect: boolean;
  /** Per-distractor or correct-answer rationale. */
  rationale: string;
}

interface RationalePanelProps {
  /** Whether the user answered correctly. */
  correct: boolean;
  /** The overall rationale for the correct answer. */
  rationaleCorrect: string;
  /** Per-option rationales (all options, correct + incorrect). */
  optionRationales?: OptionRationale[];
  /** Index of the option the user picked (used for highlighting). */
  userPickedIndex?: number;
  /** Whether the panel should be visible (caller controls show/hide). */
  show: boolean;
}

export function RationalePanel({
  correct,
  rationaleCorrect,
  optionRationales = [],
  userPickedIndex,
  show,
}: RationalePanelProps) {
  const [expanded, setExpanded] = useState(true);

  if (!show) return null;

  const toggleLabel = expanded ? 'Collapse explanation' : 'Expand explanation';

  return (
    <div
      className={cn(
        'mt-4 rounded-xl border-2 overflow-hidden',
        correct
          ? 'border-emerald-200 dark:border-emerald-800'
          : 'border-red-200 dark:border-red-900',
      )}
      role="region"
      aria-label="Answer explanation"
    >
      {/* Header row — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        aria-expanded={expanded}
        aria-controls="rationale-body"
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 text-left',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-crystal-500',
          correct
            ? 'bg-emerald-50 dark:bg-emerald-950/40'
            : 'bg-red-50 dark:bg-red-950/30',
        )}
      >
        <span
          className={cn(
            'flex items-center gap-2 font-semibold text-sm',
            correct
              ? 'text-emerald-700 dark:text-emerald-300'
              : 'text-red-700 dark:text-red-300',
          )}
        >
          {correct ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          ) : (
            <XCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          )}
          {correct ? 'Correct — here is why' : 'Not quite — here is why'}
        </span>
        <span aria-label={toggleLabel}>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-500" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" aria-hidden="true" />
          )}
        </span>
      </button>

      {/* Collapsible body */}
      <div
        id="rationale-body"
        hidden={!expanded}
        className="bg-white dark:bg-slate-900"
      >
        {/* Main rationale */}
        <div className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800">
          {rationaleCorrect}
        </div>

        {/* Per-option breakdown */}
        {optionRationales.length > 0 && (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800" aria-label="Option breakdown">
            {optionRationales.map((opt, idx) => {
              const wasChosen = userPickedIndex === idx;
              const isCorrect = opt.isCorrect;
              return (
                <li
                  key={idx}
                  className={cn(
                    'px-4 py-3 text-sm',
                    isCorrect && 'bg-emerald-50/50 dark:bg-emerald-950/20',
                    wasChosen && !isCorrect && 'bg-red-50/50 dark:bg-red-950/20',
                  )}
                >
                  <div className="flex items-start gap-2">
                    {isCorrect ? (
                      <CheckCircle2
                        className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5"
                        aria-label="Correct option"
                      />
                    ) : (
                      <XCircle
                        className={cn(
                          'w-4 h-4 flex-shrink-0 mt-0.5',
                          wasChosen
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-slate-400 dark:text-slate-600',
                        )}
                        aria-label={wasChosen ? 'Your choice — incorrect' : 'Incorrect option'}
                      />
                    )}
                    <div>
                      <p
                        className={cn(
                          'font-medium',
                          isCorrect
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : wasChosen
                            ? 'text-red-700 dark:text-red-300'
                            : 'text-slate-600 dark:text-slate-400',
                        )}
                      >
                        {opt.text}
                        {wasChosen && !isCorrect && (
                          <span className="ml-2 text-xs font-normal">(your choice)</span>
                        )}
                      </p>
                      {opt.rationale && (
                        <p className="mt-0.5 text-slate-600 dark:text-slate-400">{opt.rationale}</p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
