/**
 * LearnQuizWidget — 3-question pretest widget shown above a learn article.
 *
 * Flow (per V1-PLAN §A.4 and §7 Phase 3):
 *   1. Show question → user picks option
 *   2. User selects confidence (ConfidenceTap)
 *   3. Submit → reveal rationale (RationalePanel)
 *   4. "Next question" → repeat for up to 3 questions
 *   5. After final question → show "Now read the article below" CTA
 *
 * Props:
 *   - `slug`            — learn article slug (used for analytics tagging)
 *   - `pretestEnabled`  — if false, renders nothing
 *   - `questions`       — up to 3 pre-fetched questions (from curated bank or auto-gen)
 *   - `store`           — StudyStore interface (stubbed in dev/tests)
 *
 * Uses Card, Button primitives; ConfidenceTap and RationalePanel sub-components.
 */

import { useState, useId } from 'react';
import { ChevronRight, CheckCircle2 } from 'lucide-react';
import type { StudyStore, Confidence } from '../../../lib/quiz/study-types';
import { Card, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { cn } from '../../ui/cn';
import { ConfidenceTap } from './ConfidenceTap';
import { RationalePanel } from './RationalePanel';
import type { OptionRationale } from './RationalePanel';

/** Minimal question shape the widget needs — avoids importing full Question type */
export interface WidgetQuestion {
  id: string;
  questionText: string;
  /** All option texts (2–5). */
  options: string[];
  /** The text of the correct option. */
  correctAnswer: string;
  /** Overall rationale for the correct answer. */
  rationaleCorrect?: string;
  /** Per-option rationales (same length as options). */
  optionRationales?: OptionRationale[];
  /** Whether this question is auto-generated and not expert-reviewed. */
  unvetted?: boolean;
}

interface LearnQuizWidgetProps {
  /** Slug of the article this widget appears above (used for tagging responses). */
  slug: string;
  /** Master on/off switch. When false the widget is invisible. */
  pretestEnabled: boolean;
  /** Up to 3 questions (caller handles fetching/fallback). */
  questions: WidgetQuestion[];
  /** StudyStore for persisting responses. Pass a mock in dev/tests. */
  store?: StudyStore;
}

type QuestionPhase = 'selecting' | 'confidence' | 'submitted';

interface QuestionState {
  selectedOption: string | null;
  confidence: Confidence | null;
  phase: QuestionPhase;
}

const MAX_QUESTIONS = 3;

function freshQuestionState(): QuestionState {
  return { selectedOption: null, confidence: null, phase: 'selecting' };
}

export function LearnQuizWidget({
  slug,
  pretestEnabled,
  questions,
  store,
}: LearnQuizWidgetProps) {
  const legendId = useId();
  const visibleQuestions = questions.slice(0, MAX_QUESTIONS);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [questionState, setQuestionState] = useState<QuestionState>(freshQuestionState);
  const [done, setDone] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  if (!pretestEnabled || visibleQuestions.length === 0) return null;

  const currentQuestion = visibleQuestions[currentIndex];
  const { selectedOption, confidence, phase } = questionState;

  const isSubmitted = phase === 'submitted';
  const isLast = currentIndex === visibleQuestions.length - 1;

  const isCorrect =
    selectedOption !== null && selectedOption === currentQuestion.correctAnswer;

  const canShowConfidence = phase === 'confidence';
  const canSubmit =
    phase === 'confidence' && selectedOption !== null && confidence !== null;

  const handleOptionSelect = (opt: string) => {
    if (isSubmitted) return;
    setQuestionState((s) => ({
      ...s,
      selectedOption: opt,
      // Move to confidence phase on first selection
      phase: s.phase === 'selecting' ? 'confidence' : s.phase,
    }));
  };

  const handleConfidenceChange = (c: Confidence) => {
    setQuestionState((s) => ({ ...s, confidence: c }));
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setQuestionState((s) => ({ ...s, phase: 'submitted' }));
    if (isCorrect) setCorrectCount((n) => n + 1);

    // Persist to store if provided
    if (store && confidence) {
      try {
        await store.appendResponse({
          questionId: currentQuestion.id,
          timestamp: Date.now(),
          correct: isCorrect,
          confidence,
          timeMs: 0,
          mode: 'pretest',
          optionChosen: selectedOption ?? undefined,
          sessionId: `pretest-${slug}-${Date.now()}`,
        });
      } catch {
        // Fire-and-forget; widget must not break on store error
      }
    }
  };

  const handleNext = () => {
    if (isLast) {
      setDone(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setQuestionState(freshQuestionState());
    }
  };

  // --- Completed state ---
  if (done) {
    return (
      <aside
        className="my-6"
        aria-label="Pretest complete"
      >
        <Card
          padding="md"
          className="border-emerald-200 bg-emerald-50/40 dark:border-emerald-400/20 dark:bg-emerald-400/10"
        >
          <CardContent className="flex items-start gap-4">
            <span aria-hidden="true">
              <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            </span>
            <div>
              <p className="font-semibold text-slate-900 dark:text-cream-primary text-sm tracking-tight">
                Pretest complete
                <span className="ml-2 font-mono text-xs font-normal text-emerald-700 dark:text-emerald-300">
                  {correctCount} / {visibleQuestions.length}
                </span>
              </p>
              <p className="text-sm text-slate-600 dark:text-cream-secondary mt-1.5 leading-relaxed">
                The article below covers each of these topics in depth. Pay particular
                attention to any questions you got wrong; the pretesting effect makes
                the content that follows measurably stickier.
              </p>
            </div>
          </CardContent>
        </Card>
      </aside>
    );
  }

  // --- Active widget ---
  const optionRationales: OptionRationale[] = currentQuestion.optionRationales?.length
    ? currentQuestion.optionRationales
    : currentQuestion.options.map((text) => ({
        text,
        isCorrect: text === currentQuestion.correctAnswer,
        rationale: '',
      }));

  const userPickedIndex = selectedOption
    ? currentQuestion.options.indexOf(selectedOption)
    : undefined;

  return (
    <aside className="my-6" aria-label={`Pretest, question ${currentIndex + 1} of ${visibleQuestions.length}`}>
      <Card
        padding="none"
        className="overflow-hidden border-slate-200 dark:border-coffee-border"
      >
        {/* Widget header — instrument-label strip. Deliberately dark by
            design in both themes (an "instrument panel" accent); in site
            dark mode it's realigned to the coffee ramp so it doesn't clash
            with the surrounding coffee-page background. */}
        <div className="px-5 py-2.5 bg-slate-900 border-b border-slate-900 dark:bg-coffee-raised2 dark:border-coffee-border-strong flex items-center justify-between">
          <span
            id={legendId}
            className="flex items-baseline gap-2 text-sm font-semibold tracking-tight text-slate-50"
          >
            Quick check
            <span aria-hidden="true" className="text-slate-600">/</span>
            <span className="font-mono text-xs font-normal tabular-nums text-crystal-300">
              {String(currentIndex + 1).padStart(2, '0')}
              <span className="text-slate-600"> of </span>
              {String(visibleQuestions.length).padStart(2, '0')}
            </span>
          </span>
          <span className="inline-flex items-center text-[10px] font-medium uppercase tracking-[0.18em] text-crystal-200/90 border border-white/15 bg-white/5 rounded px-2 py-0.5">
            Pretest
          </span>
        </div>

        <CardContent className="px-5 py-5">
          {/* Helper line — guidance, not body */}
          {currentIndex === 0 && !isSubmitted && (
            <p className="text-sm text-slate-600 dark:text-cream-secondary mb-4 leading-relaxed">
              <span aria-hidden="true" className="text-crystal-500 dark:text-crystal-400 mr-1.5">—</span>
              Try these before reading. Getting them wrong here makes the article
              that follows stick better in memory.
            </p>
          )}

          {/* Question stem */}
          <p
            className="text-base font-medium text-slate-900 dark:text-cream-primary leading-relaxed mb-4 tracking-tight"
            aria-live="polite"
          >
            {currentQuestion.questionText}
          </p>

          {/* Options */}
          <div role="radiogroup" aria-labelledby={legendId} className="space-y-2">
            {currentQuestion.options.map((opt, idx) => {
              const isSelected = selectedOption === opt;
              const showCorrectness = isSubmitted;
              const isThisCorrect = opt === currentQuestion.correctAnswer;
              const letter = String.fromCharCode(65 + idx);

              const isIdle = !showCorrectness && !isSelected;
              const isPickedIdle = !showCorrectness && isSelected;
              const isCorrectReveal = showCorrectness && isThisCorrect;
              const isWrongChosen = showCorrectness && !isThisCorrect && isSelected;

              return (
                <button
                  key={idx}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => handleOptionSelect(opt)}
                  disabled={isSubmitted}
                  className={cn(
                    'group w-full text-left pl-2 pr-4 py-2.5 rounded-lg text-sm border transition-all duration-150',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-crystal-500 dark:focus-visible:ring-crystal-400 focus-visible:ring-offset-2',
                    'disabled:pointer-events-none',
                    isIdle &&
                      'border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50 dark:border-coffee-border dark:text-cream-secondary dark:hover:border-coffee-border-strong dark:hover:bg-coffee-raised',
                    isPickedIdle &&
                      'border-crystal-600 bg-crystal-50 text-crystal-900 ring-1 ring-crystal-600 dark:border-crystal-400 dark:bg-crystal-400/10 dark:text-crystal-200 dark:ring-crystal-400',
                    isCorrectReveal &&
                      'border-emerald-600 bg-emerald-50 text-emerald-900 dark:border-emerald-400 dark:bg-emerald-400/10 dark:text-emerald-200',
                    isWrongChosen &&
                      'border-red-500 bg-red-50 text-red-900 dark:border-red-400 dark:bg-red-400/10 dark:text-red-200',
                    showCorrectness && !isThisCorrect && !isSelected &&
                      'border-slate-200 text-slate-500 dark:border-coffee-border dark:text-cream-muted',
                  )}
                >
                  <span className="inline-flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className={cn(
                        'inline-flex h-6 w-6 items-center justify-center rounded font-mono text-[11px] tracking-wider transition-colors duration-150 flex-shrink-0',
                        isIdle &&
                          'bg-slate-100 text-slate-600 group-hover:bg-slate-200 dark:bg-coffee-raised2 dark:text-cream-secondary dark:group-hover:bg-coffee-border',
                        isPickedIdle &&
                          'bg-crystal-600 text-white',
                        isCorrectReveal &&
                          'bg-emerald-600 text-white',
                        isWrongChosen &&
                          'bg-red-600 text-white',
                        showCorrectness && !isThisCorrect && !isSelected &&
                          'bg-slate-100 text-slate-400 dark:bg-coffee-raised2 dark:text-cream-muted',
                      )}
                    >
                      {letter}
                    </span>
                    <span>{opt}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Confidence tap — shown once option is selected, before submit */}
          {canShowConfidence && !isSubmitted && (
            <ConfidenceTap
              value={confidence}
              onChange={handleConfidenceChange}
              disabled={isSubmitted}
            />
          )}

          {/* Rationale panel — shown post-submit */}
          <RationalePanel
            correct={isCorrect}
            rationaleCorrect={
              currentQuestion.rationaleCorrect ??
              (isCorrect ? 'Correct!' : `The correct answer is ${currentQuestion.correctAnswer}.`)
            }
            optionRationales={optionRationales}
            userPickedIndex={userPickedIndex}
            show={isSubmitted}
          />

          {/* Action buttons */}
          <div className="mt-4 flex justify-end gap-2">
            {canShowConfidence && !isSubmitted && (
              <Button
                variant="primary"
                size="sm"
                disabled={!canSubmit}
                onClick={handleSubmit}
              >
                Submit
              </Button>
            )}
            {isSubmitted && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleNext}
                rightIcon={
                  isLast ? undefined : (
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  )
                }
              >
                {isLast ? 'Continue to article' : 'Next question'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
