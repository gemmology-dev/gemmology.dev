/**
 * StudySettingsPanel — user-tunable study behaviour toggles.
 *
 * Surfaces the four `StudySettings` fields:
 *   - requireConfidence   (toggle)
 *   - showRationaleOnSubmit (toggle)
 *   - reviewMixRatio      (slider 0–1)
 *   - preferredQuestionCount (number input)
 *
 * Props are fully controlled; parent owns state via onChange(patch).
 * Uses Card, CardHeader, CardTitle, CardContent from `@/components/ui`.
 */

import type { StudySettings } from '../../../lib/quiz/study-types';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { cn } from '../../ui/cn';

interface StudySettingsPanelProps {
  /** Current settings value. */
  value: StudySettings;
  /** Partial patch emitted on every change. */
  onChange: (patch: Partial<StudySettings>) => void;
}

interface ToggleRowProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onToggle: (next: boolean) => void;
}

function ToggleRow({ id, label, description, checked, onToggle }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1 min-w-0">
        <label
          htmlFor={id}
          className="block text-sm font-medium text-slate-800 dark:text-slate-200 cursor-pointer"
        >
          {label}
        </label>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
      </div>
      {/* Toggle switch */}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onToggle(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent',
          'cursor-pointer transition-colors duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-crystal-500 focus-visible:ring-offset-2',
          checked
            ? 'bg-crystal-600 dark:bg-crystal-500'
            : 'bg-slate-200 dark:bg-slate-700',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md',
            'transform transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
    </div>
  );
}

export function StudySettingsPanel({ value, onChange }: StudySettingsPanelProps) {
  const reviewMixPercent = Math.round(value.reviewMixRatio * 100);

  return (
    <Card padding="none" className="overflow-hidden">
      <CardHeader className="px-6 pt-6 pb-4 mb-0 border-b border-slate-100 dark:border-slate-800">
        <CardTitle as="h2">Study settings</CardTitle>
      </CardHeader>

      <CardContent className="px-6 py-2 divide-y divide-slate-100 dark:divide-slate-800">
        {/* Require confidence */}
        <ToggleRow
          id="setting-require-confidence"
          label="Require confidence rating"
          description="Show the Unsure / Fairly sure / Certain buttons before submit."
          checked={value.requireConfidence}
          onToggle={(v) => onChange({ requireConfidence: v })}
        />

        {/* Show rationale on submit */}
        <ToggleRow
          id="setting-show-rationale"
          label="Show rationale after submitting"
          description="Display the correct-answer explanation and distractor rationales after each question."
          checked={value.showRationaleOnSubmit}
          onToggle={(v) => onChange({ showRationaleOnSubmit: v })}
        />

        {/* Review mix ratio */}
        <div className="py-3">
          <label
            htmlFor="setting-review-mix"
            className="block text-sm font-medium text-slate-800 dark:text-slate-200"
          >
            Review mix
            <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
              {reviewMixPercent}% review / {100 - reviewMixPercent}% new
            </span>
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-2">
            Fraction of due (spaced-repetition) items vs new questions in each session.
          </p>
          <input
            id="setting-review-mix"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={value.reviewMixRatio}
            onChange={(e) =>
              onChange({ reviewMixRatio: parseFloat(e.currentTarget.value) })
            }
            aria-valuemin={0}
            aria-valuemax={1}
            aria-valuenow={value.reviewMixRatio}
            aria-valuetext={`${reviewMixPercent}% review`}
            className={cn(
              'w-full h-2 rounded-full appearance-none cursor-pointer',
              'bg-slate-200 dark:bg-slate-700',
              'accent-crystal-600 dark:accent-crystal-500',
            )}
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>All new</span>
            <span>All review</span>
          </div>
        </div>

        {/* Preferred question count */}
        <div className="py-3">
          <label
            htmlFor="setting-question-count"
            className="block text-sm font-medium text-slate-800 dark:text-slate-200"
          >
            Default question count
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-2">
            Pre-filled in the quiz setup screen.
          </p>
          <input
            id="setting-question-count"
            type="number"
            min={3}
            max={50}
            step={1}
            value={value.preferredQuestionCount}
            onChange={(e) => {
              const n = parseInt(e.currentTarget.value, 10);
              if (!isNaN(n) && n >= 3 && n <= 50) {
                onChange({ preferredQuestionCount: n });
              }
            }}
            aria-valuemin={3}
            aria-valuemax={50}
            className={cn(
              'block w-24 rounded-lg border border-slate-300 px-3 py-1.5 text-sm',
              'text-slate-800 dark:text-slate-200',
              'bg-white dark:bg-slate-900',
              'dark:border-slate-700',
              'focus:outline-none focus:ring-2 focus:ring-crystal-500 focus:border-crystal-500',
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
