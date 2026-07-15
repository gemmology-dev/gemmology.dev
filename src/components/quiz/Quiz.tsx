/**
 * Main Quiz component for practice mode.
 * Combines question display, navigation, and results.
 *
 * Study v1 additions (A4b):
 * - Loads StudySettings once via getStudyStore() (StudyReviewScreen pattern).
 * - Renders ConfidenceTap (gated on settings.requireConfidence) between answer
 *   selection and submit; disables "Check Answer" until a confidence is chosen
 *   when required. Confidence is passed through to submitAnswer().
 * - Loads the SM-2 ScheduleEntry per question and passes it to QuestionCard as
 *   a ScheduleBadge.
 * - Shows UnvettedFlag in the header for auto-generated (unvetted) questions.
 * - RationalePanel is gated via QuestionCard's showRationalePanel prop, driven
 *   by settings.showRationaleOnSubmit.
 *
 * A6 additions:
 * - Header row with a ghost "Restart" button that opens a shared ConfirmDialog
 *   before calling the existing resetQuiz().
 * - Structurally unrenderable questions fall back to UnrenderableQuestionCard
 *   (mirrors Exam.tsx) with a per-question Skip action.
 * - Auto-offer banner ("This saved session has a display issue — start
 *   fresh?") shown only when ALL remaining questions are unrenderable.
 *
 * A8 additions:
 * - useQuizKeyboard wires digits 1-4 (select option) and Enter (submit/
 *   advance) shortcuts; inert while the restart confirm dialog is open.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Question, QuizConfig, QuizResult } from '../../lib/quiz';
import { isRenderable } from '../../lib/quiz';
import { useQuiz } from '../../hooks/useQuiz';
import { useQuizKeyboard } from '../../hooks/useQuizKeyboard';
import { QuestionCard } from './QuestionCard';
import { UnrenderableQuestionCard } from './UnrenderableQuestionCard';
import { QuizProgress } from './QuizProgress';
import { QuizResults } from './QuizResults';
import { Button } from '../ui/Button';
import { ConfirmDialog } from './ConfirmDialog';
import { ConfidenceTap } from './study/ConfidenceTap';
import { ScheduleBadge } from './study/ScheduleBadge';
import { UnvettedFlag } from './study/UnvettedFlag';
import { getStudyStore } from '../../lib/quiz/store';
import { DEFAULT_STUDY_SETTINGS } from '../../lib/quiz/study-types';
import type { Confidence, ScheduleEntry, StudySettings } from '../../lib/quiz/study-types';

interface QuizProps {
  /** Quiz configuration */
  config: QuizConfig;
  /** Questions to display */
  questions: Question[];
  /** Callback fired exactly once, with the final results, when the quiz completes */
  onComplete?: (results: QuizResult) => void;
  /** Callback to return to setup */
  onBack?: () => void;
}

export function Quiz({
  config,
  questions,
  onComplete,
  onBack,
}: QuizProps) {
  const {
    state,
    currentQuestion,
    hasAnswer,
    isComplete,
    isSubmitted,
    score,
    results,
    selectAnswer,
    submitAnswer,
    nextQuestion,
    previousQuestion,
    submitQuiz,
    resetQuiz,
    skipQuestion,
  } = useQuiz({ config, questions, persist: true });

  // Restart confirmation dialog (A6).
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  // Fire onComplete exactly once per completion. Guarded with a ref (rather
  // than relying solely on effect deps) so re-renders while isComplete stays
  // true never invoke it twice; reset when the quiz is no longer complete
  // (e.g. after Restart) so a subsequent completion fires again.
  const onCompleteFiredRef = useRef(false);
  useEffect(() => {
    if (isComplete && results) {
      if (!onCompleteFiredRef.current) {
        onCompleteFiredRef.current = true;
        onComplete?.(results);
      }
    } else {
      onCompleteFiredRef.current = false;
    }
  }, [isComplete, results, onComplete]);

  // Study store singleton — stable reference.
  const store = useRef(getStudyStore()).current;

  // User-tunable study behaviour (confidence requirement, rationale visibility).
  const [settings, setSettings] = useState<StudySettings>(DEFAULT_STUDY_SETTINGS);
  useEffect(() => {
    let mounted = true;
    store.getSettings().then(loaded => {
      if (mounted) setSettings(loaded);
    }).catch((err: unknown) => {
      console.warn('[Quiz] getSettings failed:', err);
    });
    return () => {
      mounted = false;
    };
  }, [store]);

  // Confidence captured for the current question, reset whenever the question changes.
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const currentQuestionId = currentQuestion?.id;
  useEffect(() => {
    setConfidence(null);
  }, [currentQuestionId]);

  // SM-2 schedule entry for the current question (drives the ScheduleBadge).
  const [scheduleEntry, setScheduleEntry] = useState<ScheduleEntry | null>(null);
  useEffect(() => {
    if (!currentQuestionId) {
      setScheduleEntry(null);
      return;
    }
    let mounted = true;
    store.getSchedule(currentQuestionId).then(entry => {
      if (mounted) setScheduleEntry(entry);
    }).catch((err: unknown) => {
      console.warn('[Quiz] getSchedule failed:', err);
    });
    return () => {
      mounted = false;
    };
  }, [currentQuestionId, store]);

  // Derived values used by both rendering and keyboard shortcuts. Computed
  // here (before the early returns below) to satisfy the Rules of Hooks,
  // since useQuizKeyboard and its callbacks must also be called unconditionally.
  const isLastQuestion = state.currentIndex === state.questions.length - 1;
  const allAnswered = state.answers.size === state.questions.length;

  // A6: only offer a "start fresh" escape hatch when every remaining question
  // is structurally unrenderable — a single bad question is handled inline by
  // the per-question Skip button on UnrenderableQuestionCard.
  const remainingQuestions = state.questions.slice(state.currentIndex);
  const allRemainingUnrenderable =
    remainingQuestions.length > 0 && remainingQuestions.every(q => !isRenderable(q));

  // Confidence is only required to unlock "Check Answer" when the setting is on.
  const confidenceSatisfied = !settings.requireConfidence || confidence !== null;
  const canCheckAnswer = hasAnswer && confidenceSatisfied;

  const handleSubmitAnswer = useCallback(() => {
    submitAnswer(confidence ?? 'fairly-sure');
  }, [submitAnswer, confidence]);

  // A8: digit keys 1-4 select an option (multiple-choice/true-false only);
  // suppressed while typing in an input/textarea/select (fill-blank/matching safe).
  const handleSelectIndex = useCallback((index: number) => {
    if (!currentQuestion || isSubmitted) return;
    if (currentQuestion.type !== 'multiple-choice' && currentQuestion.type !== 'true-false') return;
    const options = currentQuestion.options;
    if (!options || index < 0 || index >= options.length) return;
    selectAnswer(options[index]);
  }, [currentQuestion, isSubmitted, selectAnswer]);

  // A8: Enter submits the current answer (once confidence, if required, is
  // satisfied), or advances to the next question / finishes the quiz once the
  // current question has been submitted.
  const handleEnter = useCallback(() => {
    if (!currentQuestion) return;
    if (!isSubmitted) {
      if (canCheckAnswer) handleSubmitAnswer();
      return;
    }
    if (isLastQuestion) {
      submitQuiz();
    } else {
      nextQuestion();
    }
  }, [currentQuestion, isSubmitted, canCheckAnswer, handleSubmitAnswer, isLastQuestion, submitQuiz, nextQuestion]);

  useQuizKeyboard({
    enabled: !isComplete && !!currentQuestion && !showRestartConfirm,
    onSelectIndex: handleSelectIndex,
    onEnter: handleEnter,
  });

  // Show results if quiz is complete
  if (isComplete && results) {
    return (
      <QuizResults
        results={results}
        onRetry={resetQuiz}
        onNewQuiz={onBack || resetQuiz}
      />
    );
  }

  // No question to show
  if (!currentQuestion) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">No questions available</p>
        <Button variant="secondary" onClick={onBack} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header row: mid-quiz Restart (A6) */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => setShowRestartConfirm(true)}>
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Restart
        </Button>
      </div>

      {/* Progress bar */}
      <QuizProgress
        current={state.currentIndex}
        total={state.questions.length}
        score={score}
        showScore={config.mode === 'practice'}
      />

      {/* Auto-offer banner: only when every remaining question is unrenderable */}
      {allRemainingUnrenderable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-amber-800">
            This saved session has a display issue — start fresh?
          </p>
          <Button variant="secondary" size="sm" onClick={() => setShowRestartConfirm(true)}>
            Start Fresh
          </Button>
        </div>
      )}

      {/* Question card */}
      {isRenderable(currentQuestion) ? (
        <QuestionCard
          question={currentQuestion}
          questionNumber={state.currentIndex + 1}
          totalQuestions={state.questions.length}
          selectedAnswer={state.answers.get(currentQuestion.id) as string}
          showFeedback={config.mode === 'practice'}
          isSubmitted={isSubmitted}
          onSelectAnswer={(answer) => selectAnswer(answer)}
          headerExtra={<UnvettedFlag unvetted={!!currentQuestion.unvetted} />}
          scheduleBadge={<ScheduleBadge entry={scheduleEntry} />}
          showRationalePanel={settings.showRationaleOnSubmit}
        />
      ) : (
        <UnrenderableQuestionCard
          questionNumber={state.currentIndex + 1}
          totalQuestions={state.questions.length}
          onSkip={skipQuestion}
        />
      )}

      {/* Confidence tap — shown once an answer is selected, before submit */}
      {config.mode === 'practice' && settings.requireConfidence && hasAnswer && !isSubmitted && (
        <ConfidenceTap
          value={confidence}
          onChange={setConfidence}
          disabled={isSubmitted}
        />
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          onClick={previousQuestion}
          disabled={state.currentIndex === 0}
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </Button>

        <div className="flex gap-2">
          {/* Submit answer button (practice mode) */}
          {config.mode === 'practice' && !isSubmitted && hasAnswer && (
            <Button variant="secondary" onClick={handleSubmitAnswer} disabled={!canCheckAnswer}>
              Check Answer
            </Button>
          )}

          {/* Next/Finish button */}
          {isLastQuestion ? (
            <Button
              variant="primary"
              onClick={submitQuiz}
              disabled={config.mode === 'practice' ? !isSubmitted : !hasAnswer}
            >
              Finish Quiz
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={nextQuestion}
              disabled={config.mode === 'practice' ? !isSubmitted : !hasAnswer}
            >
              Next
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          )}
        </div>
      </div>

      {/* Quick finish option when all questions are answered */}
      {allAnswered && !isLastQuestion && (
        <div className="text-center pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-600 mb-2">
            All questions answered!
          </p>
          <Button variant="outline" onClick={submitQuiz}>
            Submit Quiz Now
          </Button>
        </div>
      )}

      {/* Restart confirmation (A6) */}
      <ConfirmDialog
        open={showRestartConfirm}
        title="Restart Quiz?"
        confirmLabel="Restart"
        cancelLabel="Cancel"
        onConfirm={() => {
          setShowRestartConfirm(false);
          resetQuiz();
        }}
        onCancel={() => setShowRestartConfirm(false)}
      >
        <p>
          This will clear your current answers and start the quiz over from the first question.
        </p>
      </ConfirmDialog>
    </div>
  );
}
