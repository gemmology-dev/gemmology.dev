/**
 * React hook for managing quiz state.
 * Handles question navigation, answer tracking, and results calculation.
 *
 * Study v1 additions (T1):
 * - Wires studyStore.appendResponse on every submitted answer.
 * - Wires progressTracker.updateProgress + studyStore.updateProgress on quiz submit.
 * - sessionId is generated once per hook lifetime and groups all responses.
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import type {
  Question,
  QuizConfig,
  QuizState,
  QuizResult,
} from '../lib/quiz';
import {
  checkAnswer,
  calculateResults,
  serializeQuizState,
  deserializeQuizState,
} from '../lib/quiz';
import { useLocalStorage, STORAGE_KEYS } from './useLocalStorage';
import { getStudyStore } from '../lib/quiz/store';
import { updateProgress } from '../lib/quiz/progress-tracker';
import { qualityOf, applySM2 } from '../lib/quiz/scheduler';
import { newScheduleEntry } from '../lib/quiz/study-types';
import type { Confidence } from '../lib/quiz/study-types';

interface UseQuizOptions {
  /** Quiz configuration */
  config: QuizConfig;
  /** Questions to use */
  questions: Question[];
  /** Whether to persist state to localStorage */
  persist?: boolean;
}

interface UseQuizReturn {
  /** Current quiz state */
  state: QuizState;
  /** Current question */
  currentQuestion: Question | null;
  /** Whether a question is selected */
  hasAnswer: boolean;
  /** Whether the quiz is complete */
  isComplete: boolean;
  /** Whether the current question is submitted (practice mode) */
  isSubmitted: boolean;
  /** Current score (questions answered correctly) */
  score: number;
  /** Final results (when complete) */
  results: QuizResult | null;
  /** Select an answer for the current question */
  selectAnswer: (answer: string | string[]) => void;
  /** Submit the current answer (practice mode) */
  submitAnswer: (confidence?: Confidence) => void;
  /** Go to the next question */
  nextQuestion: () => void;
  /** Go to the previous question */
  previousQuestion: () => void;
  /** Go to a specific question */
  goToQuestion: (index: number) => void;
  /** Toggle flag on current question (exam mode) */
  toggleFlag: () => void;
  /** Submit the entire quiz */
  submitQuiz: () => void;
  /** Reset the quiz */
  resetQuiz: () => void;
  /** Mark the current question as skipped (not scored) and advance if possible */
  skipQuestion: () => void;
}

/** Generate a random session identifier. */
function makeSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useQuiz({
  config,
  questions,
  persist = false,
}: UseQuizOptions): UseQuizReturn {
  // Study store singleton — stable reference.
  const store = useRef(getStudyStore()).current;

  // Unique identifier for this quiz session (groups all responses).
  const sessionId = useRef(makeSessionId()).current;

  // Per-question start time so we can compute timeMs.
  const questionStartTime = useRef<number>(Date.now());

  // Initialize state
  const [savedState, setSavedState, clearSavedState] = useLocalStorage<string | null>(
    STORAGE_KEYS.QUIZ_STATE,
    null
  );

  // Track which questions have been submitted (practice mode)
  const [submittedQuestions, setSubmittedQuestions] = useState<Set<string>>(new Set());

  // Initialize quiz state
  const [state, setState] = useState<QuizState>(() => {
    // Try to restore from localStorage if persisting. Never restore an
    // already-submitted session — a completed quiz must not resurrect as
    // the current session when a new one starts.
    if (persist && savedState) {
      try {
        const restored = deserializeQuizState(JSON.parse(savedState));
        if (!restored.submitted) {
          return restored;
        }
      } catch {
        // Ignore parse errors
      }
    }

    return {
      questions,
      currentIndex: 0,
      answers: new Map(),
      startTime: Date.now(),
      flaggedQuestions: new Set(),
      submitted: false,
      skippedQuestions: new Set(),
    };
  });

  // Save state to localStorage when it changes
  const saveState = useCallback((newState: QuizState) => {
    setState(newState);
    if (persist) {
      setSavedState(JSON.stringify(serializeQuizState(newState)));
    }
  }, [persist, setSavedState]);

  // Derived values
  const currentQuestion = state.questions[state.currentIndex] || null;
  const currentAnswer = currentQuestion
    ? state.answers.get(currentQuestion.id)
    : undefined;
  const hasAnswer = currentAnswer !== undefined;
  const isSubmitted = currentQuestion
    ? submittedQuestions.has(currentQuestion.id)
    : false;
  const isComplete = state.submitted;

  // Calculate current score
  const score = useMemo(() => {
    let correct = 0;
    for (const [questionId, answer] of state.answers) {
      const question = state.questions.find(q => q.id === questionId);
      if (question && checkAnswer(question, answer)) {
        correct++;
      }
    }
    return correct;
  }, [state.questions, state.answers]);

  // Calculate results when quiz is complete
  const results = useMemo(() => {
    if (!isComplete) return null;
    return calculateResults(state, config);
  }, [isComplete, state, config]);

  // Select an answer for the current question
  const selectAnswer = useCallback((answer: string | string[]) => {
    if (!currentQuestion || state.submitted) return;

    // Reset per-question timer when user selects (first interaction).
    const newAnswers = new Map(state.answers);
    if (!newAnswers.has(currentQuestion.id)) {
      questionStartTime.current = Date.now();
    }
    newAnswers.set(currentQuestion.id, answer);

    saveState({
      ...state,
      answers: newAnswers,
    });
  }, [currentQuestion, state, saveState]);

  /**
   * Submit the current answer (practice mode — shows feedback).
   *
   * @param confidence - Confidence level captured by ConfidenceTap.
   *   Defaults to 'fairly-sure' until track T3's ConfidenceTap lands.
   * TODO(T3): wire ConfidenceTap — remove default once component is available.
   */
  const submitAnswer = useCallback((
    // TODO(T3): wire ConfidenceTap — remove default once component is available.
    confidence: Confidence = 'fairly-sure'
  ) => {
    if (!currentQuestion || !hasAnswer) return;

    setSubmittedQuestions(prev => new Set(prev).add(currentQuestion.id));

    // --- Study v1: log the response ---
    const answer = state.answers.get(currentQuestion.id);
    const correct = answer !== undefined && checkAnswer(currentQuestion, answer);
    const timeMs = Date.now() - questionStartTime.current;

    store.appendResponse({
      questionId: currentQuestion.id,
      timestamp: Date.now(),
      correct,
      confidence,
      timeMs,
      mode: 'practice',
      optionChosen: Array.isArray(answer) ? answer.join(',') : answer,
      sessionId,
    }).catch((err: unknown) => {
      console.warn('[useQuiz] appendResponse failed:', err);
    });

    // --- Study v1: update the SM-2 schedule for this question ---
    const questionId = currentQuestion.id;
    store.getSchedule(questionId).then(existing => {
      const previous = existing ?? newScheduleEntry(questionId);
      const quality = qualityOf(correct, confidence);
      const next = applySM2(previous, quality);
      return store.updateSchedule(next);
    }).catch((err: unknown) => {
      console.warn('[useQuiz] updateSchedule failed:', err);
    });
  }, [currentQuestion, hasAnswer, state.answers, store, sessionId]);

  // Navigate to next question; reset the per-question timer.
  const nextQuestion = useCallback(() => {
    if (state.currentIndex < state.questions.length - 1) {
      questionStartTime.current = Date.now();
      saveState({
        ...state,
        currentIndex: state.currentIndex + 1,
      });
    }
  }, [state, saveState]);

  // Navigate to previous question
  const previousQuestion = useCallback(() => {
    if (state.currentIndex > 0) {
      saveState({
        ...state,
        currentIndex: state.currentIndex - 1,
      });
    }
  }, [state, saveState]);

  // Navigate to specific question
  const goToQuestion = useCallback((index: number) => {
    if (index >= 0 && index < state.questions.length) {
      questionStartTime.current = Date.now();
      saveState({
        ...state,
        currentIndex: index,
      });
    }
  }, [state, saveState]);

  // Toggle flag on current question (exam mode)
  const toggleFlag = useCallback(() => {
    if (!currentQuestion) return;

    const newFlagged = new Set(state.flaggedQuestions);
    if (newFlagged.has(currentQuestion.id)) {
      newFlagged.delete(currentQuestion.id);
    } else {
      newFlagged.add(currentQuestion.id);
    }

    saveState({
      ...state,
      flaggedQuestions: newFlagged,
    });
  }, [currentQuestion, state, saveState]);

  /**
   * Mark the current question as skipped (e.g. structurally unrenderable).
   * Skipped questions are excluded from scoring but remain visible in results.
   * Advances to the next question when one is available.
   */
  const skipQuestion = useCallback(() => {
    if (!currentQuestion) return;

    const newSkipped = new Set(state.skippedQuestions);
    newSkipped.add(currentQuestion.id);

    const hasNext = state.currentIndex < state.questions.length - 1;
    if (hasNext) {
      questionStartTime.current = Date.now();
    }

    saveState({
      ...state,
      skippedQuestions: newSkipped,
      currentIndex: hasNext ? state.currentIndex + 1 : state.currentIndex,
    });
  }, [currentQuestion, state, saveState]);

  /**
   * Submit the entire quiz.
   * After state update, wires progress-tracker and persists via the store.
   */
  const submitQuiz = useCallback(() => {
    const finalState: QuizState = {
      ...state,
      endTime: Date.now(),
      submitted: true,
    };
    saveState(finalState);

    // --- Study v1: update progress ---
    const quizResult = calculateResults(finalState, config);
    store.getProgress().then(currentProgress => {
      const updated = updateProgress(currentProgress, quizResult);
      return store.updateProgress(updated);
    }).catch((err: unknown) => {
      console.warn('[useQuiz] updateProgress failed:', err);
    });
  }, [state, saveState, config, store]);

  // Reset the quiz
  const resetQuiz = useCallback(() => {
    setSubmittedQuestions(new Set());
    clearSavedState();
    questionStartTime.current = Date.now();

    setState({
      questions,
      currentIndex: 0,
      answers: new Map(),
      startTime: Date.now(),
      flaggedQuestions: new Set(),
      submitted: false,
      skippedQuestions: new Set(),
    });
  }, [questions, clearSavedState]);

  return {
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
    goToQuestion,
    toggleFlag,
    submitQuiz,
    resetQuiz,
    skipQuestion,
  };
}
