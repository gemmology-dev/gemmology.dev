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
import { cn } from '../../ui/cn';
import {
  stripCitations,
  collectCitations,
  citationLabel,
} from '../../../lib/quiz/citations';

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

  // Strip inline [ref:slug] markers from all rationale strings before render
  // and collect a single deduped Sources list to surface at the foot.
  const cleanCorrect = stripCitations(rationaleCorrect);
  const cleanOptions = optionRationales.map((opt) => ({
    ...opt,
    rationale: stripCitations(opt.rationale),
  }));
  const sources = collectCitations(
    rationaleCorrect,
    ...optionRationales.map((opt) => opt.rationale),
  );

  return (
    <div
      className={cn(
        'mt-4 rounded-xl border-2 overflow-hidden',
        correct ? 'border-emerald-200' : 'border-red-200',
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
          correct ? 'bg-emerald-50' : 'bg-red-50',
        )}
      >
        <span
          className={cn(
            'flex items-center gap-2 font-semibold text-sm',
            correct ? 'text-emerald-700' : 'text-red-700',
          )}
        >
          {correct ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          ) : (
            <XCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          )}
          {correct ? 'Correct: here is why' : 'Not quite: here is why'}
        </span>
        <span aria-label={toggleLabel}>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-600" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-600" aria-hidden="true" />
          )}
        </span>
      </button>

      {/* Collapsible body */}
      <div
        id="rationale-body"
        hidden={!expanded}
        className="bg-white"
      >
        {/* Main rationale */}
        <div className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100">
          {cleanCorrect}
        </div>

        {/* Per-option breakdown */}
        {cleanOptions.length > 0 && (
          <ul className="divide-y divide-slate-100" aria-label="Option breakdown">
            {cleanOptions.map((opt, idx) => {
              const wasChosen = userPickedIndex === idx;
              const isCorrect = opt.isCorrect;
              return (
                <li
                  key={idx}
                  className={cn(
                    'px-4 py-3 text-sm',
                    isCorrect && 'bg-emerald-50/50',
                    wasChosen && !isCorrect && 'bg-red-50/50',
                  )}
                >
                  <div className="flex items-start gap-2">
                    {isCorrect ? (
                      <CheckCircle2
                        className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5"
                        aria-label="Correct option"
                      />
                    ) : (
                      <XCircle
                        className={cn(
                          'w-4 h-4 flex-shrink-0 mt-0.5',
                          wasChosen ? 'text-red-600' : 'text-slate-600',
                        )}
                        aria-label={wasChosen ? 'Your choice, incorrect' : 'Incorrect option'}
                      />
                    )}
                    <div>
                      <p
                        className={cn(
                          'font-medium',
                          isCorrect
                            ? 'text-emerald-700'
                            : wasChosen
                            ? 'text-red-700'
                            : 'text-slate-600',
                        )}
                      >
                        {opt.text}
                        {wasChosen && !isCorrect && (
                          <span className="ml-2 text-xs font-normal">(your choice)</span>
                        )}
                      </p>
                      {opt.rationale && (
                        <p className="mt-0.5 text-slate-600">{opt.rationale}</p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Sources footer — single deduped citation line at the foot of the body */}
        {sources.length > 0 && (
          <p
            className="px-4 py-2.5 text-xs text-slate-500 border-t border-slate-100 bg-slate-50/50"
            aria-label="Sources"
          >
            <span className="font-medium uppercase tracking-wider text-slate-600 mr-2">
              Sources
            </span>
            {sources.map((slug, idx) => (
              <span key={slug}>
                {idx > 0 && <span aria-hidden="true" className="mx-1.5 text-slate-400">·</span>}
                {citationLabel(slug)}
              </span>
            ))}
          </p>
        )}
      </div>
    </div>
  );
}
