/**
 * ConfidenceTap — three-button confidence rating widget.
 *
 * Shown between option selection and answer submit. Keyboard shortcuts:
 *   Q → unsure | W → fairly-sure | E → certain
 *
 * Uses the `Button` primitive from `@/components/ui` with className overrides
 * to apply the three semantic colour tones.
 */

import { useEffect, useCallback } from 'react';
import type { Confidence } from '../../../lib/quiz/study-types';
import { Button } from '../../ui/Button';
import { cn } from '../../ui/cn';

interface ConfidenceTapProps {
  /** Currently selected confidence level, or null if none selected yet. */
  value: Confidence | null;
  /** Called when the user selects or changes their confidence. */
  onChange: (confidence: Confidence) => void;
  /** When true, all buttons are inert (post-submit or loading). */
  disabled?: boolean;
}

interface ConfidenceOption {
  value: Confidence;
  label: string;
  shortcut: string;
  /** Tailwind classes for the selected / active state ring colour. */
  selectedClass: string;
  /** Tailwind classes for the unselected idle state. */
  idleClass: string;
  /** Screen-reader description. */
  description: string;
}

const OPTIONS: ConfidenceOption[] = [
  {
    value: 'unsure',
    label: 'Unsure',
    shortcut: 'Q',
    selectedClass: 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 dark:border-red-500',
    idleClass: 'border-slate-200 text-slate-700 hover:border-red-300 hover:bg-red-50/50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-red-700',
    description: 'I guessed or am not confident',
  },
  {
    value: 'fairly-sure',
    label: 'Fairly sure',
    shortcut: 'W',
    selectedClass: 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-500',
    idleClass: 'border-slate-200 text-slate-700 hover:border-amber-300 hover:bg-amber-50/50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-amber-700',
    description: 'I am reasonably confident',
  },
  {
    value: 'certain',
    label: 'Certain',
    shortcut: 'E',
    selectedClass: 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-500',
    idleClass: 'border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-700',
    description: 'I am very confident in this answer',
  },
];

const SHORTCUT_MAP: Record<string, Confidence> = {
  q: 'unsure',
  w: 'fairly-sure',
  e: 'certain',
};

export function ConfidenceTap({ value, onChange, disabled = false }: ConfidenceTapProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;
      // Don't fire shortcuts when focus is inside an input or textarea
      const tag = (e.target as Element | null)?.tagName?.toLowerCase() ?? '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      const mapped = SHORTCUT_MAP[e.key.toLowerCase()];
      if (mapped) {
        e.preventDefault();
        onChange(mapped);
      }
    },
    [disabled, onChange],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <fieldset
      className="my-4"
      aria-labelledby="confidence-legend"
      disabled={disabled}
    >
      <legend
        id="confidence-legend"
        className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
      >
        How confident are you?
      </legend>
      <div
        role="radiogroup"
        aria-labelledby="confidence-legend"
        className="grid grid-cols-3 gap-2"
      >
        {OPTIONS.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${opt.label}: ${opt.description}`}
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1',
                'rounded-lg border-2 px-3 py-2.5 text-sm font-medium',
                'transition-all duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-crystal-500 focus-visible:ring-offset-2',
                'disabled:pointer-events-none disabled:opacity-50',
                isSelected ? opt.selectedClass : opt.idleClass,
              )}
            >
              <span>{opt.label}</span>
              <kbd
                aria-hidden="true"
                className="text-xs opacity-50 font-sans not-italic"
              >
                [{opt.shortcut}]
              </kbd>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
