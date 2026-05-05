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
import { BookOpen, ChevronRight, CheckCircle2 } from 'lucide-react';
import type { StudyStore, Confidence } from '../../../lib/quiz/study-types';
import { Card, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
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
        <Card padding="md" className="border-crystal-200 dark:border-crystal-800 bg-crystal-50/30 dark:bg-crystal-950/20">
          <CardContent className="flex items-start gap-4">
            <span aria-hidden="true">
              <CheckCircle2 className="w-8 h-8 text-crystal-600 dark:text-crystal-400 flex-shrink-0 mt-0.5" />
            </span>
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                Pretest complete — {correctCount} of {visibleQuestions.length} correct
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                The article below covers each of these topics in depth. Pay particular
                attention to any questions you got wrong — the pretesting effect makes
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
    <aside className="my-6" aria-label={`Pretest — question ${currentIndex + 1} of ${visibleQuestions.length}`}>
      <Card padding="none" className="overflow-hidden border-crystal-200 dark:border-crystal-800">
        {/* Widget header */}
        <div className="px-5 py-3 bg-crystal-50 dark:bg-crystal-950/30 border-b border-crystal-200 dark:border-crystal-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-crystal-600 dark:text-crystal-400" aria-hidden="true" />
            <span
              id={legendId}
              className="text-xs font-semibold uppercase tracking-wider text-crystal-700 dark:text-crystal-300"
            >
              Quick check — {currentIndex + 1} of {visibleQuestions.length}
            </span>
          </div>
          <Badge variant="crystal" size="sm">Pretest</Badge>
        </div>

        <CardContent className="px-5 py-4">
          {/* Rationale teaser (not the testing effect spoiler) */}
          {currentIndex === 0 && !isSubmitted && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 italic">
              Try these before reading. Getting them wrong here makes the article
              that follows stick better in memory.
            </p>
          )}

          {/* Question stem */}
          <p
            className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed mb-3"
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
              return (
                <button
                  key={idx}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => handleOptionSelect(opt)}
                  disabled={isSubmitted}
                  className={cn(
                    'w-full text-left px-4 py-2.5 rounded-lg text-sm border-2 transition-all duration-150',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-crystal-500 focus-visible:ring-offset-2',
                    'disabled:pointer-events-none',
                    !showCorrectness && isSelected &&
                      'border-crystal-500 bg-crystal-50 text-crystal-700 dark:bg-crystal-950/40 dark:text-crystal-300 dark:border-crystal-500',
                    !showCorrectness && !isSelected &&
                      'border-slate-200 text-slate-700 hover:border-crystal-300 hover:bg-crystal-50/30 dark:border-slate-700 dark:text-slate-300 dark:hover:border-crystal-700',
                    showCorrectness && isThisCorrect &&
                      'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
                    showCorrectness && !isThisCorrect && isSelected &&
                      'border-red-400 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
                    showCorrectness && !isThisCorrect && !isSelected &&
                      'border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-500',
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="font-mono text-xs opacity-50">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    {opt}
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
