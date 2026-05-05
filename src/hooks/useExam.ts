/**
 * React hook for managing exam state with timer.
 * Extends useQuiz with countdown functionality and exam-specific features.
 *
 * Study v1 additions (T1):
 * - Wires studyStore.appendResponse for every answered question at submit time.
 * - Wires progressTracker.updateProgress + studyStore.updateProgress on submit.
 * - sessionId groups all responses from a single exam sitting.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  Question,
  QuizConfig,
  QuizState,
  QuizResult,
} from '../lib/quiz';
import {
  calculateResults,
  serializeQuizState,
  deserializeQuizState,
  checkAnswer,
} from '../lib/quiz';
import { useLocalStorage, STORAGE_KEYS } from './useLocalStorage';
import { getStudyStore } from '../lib/quiz/store';
import { updateProgress } from '../lib/quiz/progress-tracker';
import type { Confidence } from '../lib/quiz/study-types';

interface UseExamOptions {
  /** Exam configuration */
  config: QuizConfig;
  /** Questions to use */
  questions: Question[];
  /** Time limit in seconds */
  timeLimit: number;
  /** Whether to auto-submit when time runs out */
  autoSubmitOnTimeout?: boolean;
}

interface UseExamReturn {
  /** Current exam state */
  state: QuizState;
  /** Current question */
  currentQuestion: Question | null;
  /** Whether a question is selected */
  hasAnswer: boolean;
  /** Whether the exam is complete */
  isComplete: boolean;
  /** Current score (only available after submission) */
  score: number | null;
  /** Final results (when complete) */
  results: QuizResult | null;
  /** Time remaining in seconds */
  timeRemaining: number;
  /** Whether the timer is running */
  isTimerRunning: boolean;
  /** Whether time has expired */
  isTimeExpired: boolean;
  /** Number of answered questions */
  answeredCount: number;
  /** Number of flagged questions */
  flaggedCount: number;
  /** Select an answer for the current question */
  selectAnswer: (answer: string | string[]) => void;
  /** Go to the next question */
  nextQuestion: () => void;
  /** Go to the previous question */
  previousQuestion: () => void;
  /** Go to a specific question */
  goToQuestion: (index: number) => void;
  /** Toggle flag on current question */
  toggleFlag: () => void;
  /** Check if a question is flagged */
  isQuestionFlagged: (questionId: string) => boolean;
  /** Check if a question is answered */
  isQuestionAnswered: (questionId: string) => boolean;
  /**
   * Submit the exam.
   *
   * @param confidenceMap - Per-question confidence captured by ConfidenceTap
   *   (keyed by questionId). Until T3's ConfidenceTap lands, pass an empty
   *   Map or omit; answers will record 'fairly-sure'.
   * TODO(T3): wire ConfidenceTap — remove default once component is available.
   */
  submitExam: (confidenceMap?: Map<string, Confidence>) => void;
  /** Reset the exam */
  resetExam: () => void;
  /** Pause the timer */
  pauseTimer: () => void;
  /** Resume the timer */
  resumeTimer: () => void;
}

interface SerializedExamState {
  quizState: string;
  timeRemaining: number;
  isPaused: boolean;
}

/** Generate a random session identifier. */
function makeSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useExam({
  config,
  questions,
  timeLimit,
  autoSubmitOnTimeout = true,
}: UseExamOptions): UseExamReturn {
  // Study store singleton — stable reference.
  const store = useRef(getStudyStore()).current;

  // Unique identifier for this exam session.
  const sessionId = useRef(makeSessionId()).current;

  // Track per-question start times for timeMs computation.
  const questionStartTimes = useRef<Map<string, number>>(new Map());

  // Persist exam state
  const [savedState, setSavedState, clearSavedState] = useLocalStorage<string | null>(
    STORAGE_KEYS.EXAM_STATE,
    null
  );

  // Initialize state
  const [state, setState] = useState<QuizState>(() => {
    if (savedState) {
      try {
        const parsed: SerializedExamState = JSON.parse(savedState);
        return deserializeQuizState(JSON.parse(parsed.quizState));
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
    };
  });

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(() => {
    if (savedState) {
      try {
        const parsed: SerializedExamState = JSON.parse(savedState);
        return parsed.timeRemaining;
      } catch {
        // Ignore
      }
    }
    return timeLimit;
  });

  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Derived values
  const currentQuestion = state.questions[state.currentIndex] || null;
  const currentAnswer = currentQuestion
    ? state.answers.get(currentQuestion.id)
    : undefined;
  const hasAnswer = currentAnswer !== undefined;
  const isComplete = state.submitted;
  const isTimeExpired = timeRemaining <= 0;
  const isTimerRunning = !isPaused && !isComplete && !isTimeExpired;
  const answeredCount = state.answers.size;
  const flaggedCount = state.flaggedQuestions.size;

  // Calculate results when complete
  const [results, setResults] = useState<QuizResult | null>(null);
  const [score, setScore] = useState<number | null>(null);

  // Timer effect
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning]);

  // Auto-submit when time expires
  useEffect(() => {
    if (isTimeExpired && autoSubmitOnTimeout && !isComplete) {
      submitExam();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimeExpired, autoSubmitOnTimeout, isComplete]);

  // Save state periodically
  useEffect(() => {
    if (!isComplete) {
      const examState: SerializedExamState = {
        quizState: JSON.stringify(serializeQuizState(state)),
        timeRemaining,
        isPaused,
      };
      setSavedState(JSON.stringify(examState));
    }
  }, [state, timeRemaining, isPaused, isComplete, setSavedState]);

  // Track when a user first views/interacts with each question.
  useEffect(() => {
    if (currentQuestion && !questionStartTimes.current.has(currentQuestion.id)) {
      questionStartTimes.current.set(currentQuestion.id, Date.now());
    }
  }, [currentQuestion]);

  // Select an answer
  const selectAnswer = useCallback((answer: string | string[]) => {
    if (!currentQuestion || state.submitted) return;

    // Record start time on first answer for this question.
    if (!questionStartTimes.current.has(currentQuestion.id)) {
      questionStartTimes.current.set(currentQuestion.id, Date.now());
    }

    const newAnswers = new Map(state.answers);
    newAnswers.set(currentQuestion.id, answer);

    setState(prev => ({
      ...prev,
      answers: newAnswers,
    }));
  }, [currentQuestion, state.submitted, state.answers]);

  // Navigate to next question
  const nextQuestion = useCallback(() => {
    if (state.currentIndex < state.questions.length - 1) {
      setState(prev => ({
        ...prev,
        currentIndex: prev.currentIndex + 1,
      }));
    }
  }, [state.currentIndex, state.questions.length]);

  // Navigate to previous question
  const previousQuestion = useCallback(() => {
    if (state.currentIndex > 0) {
      setState(prev => ({
        ...prev,
        currentIndex: prev.currentIndex - 1,
      }));
    }
  }, [state.currentIndex]);

  // Navigate to specific question
  const goToQuestion = useCallback((index: number) => {
    if (index >= 0 && index < state.questions.length) {
      setState(prev => ({
        ...prev,
        currentIndex: index,
      }));
    }
  }, [state.questions.length]);

  // Toggle flag on current question
  const toggleFlag = useCallback(() => {
    if (!currentQuestion) return;

    setState(prev => {
      const newFlagged = new Set(prev.flaggedQuestions);
      if (newFlagged.has(currentQuestion.id)) {
        newFlagged.delete(currentQuestion.id);
      } else {
        newFlagged.add(currentQuestion.id);
      }
      return {
        ...prev,
        flaggedQuestions: newFlagged,
      };
    });
  }, [currentQuestion]);

  // Check if question is flagged
  const isQuestionFlagged = useCallback((questionId: string) => {
    return state.flaggedQuestions.has(questionId);
  }, [state.flaggedQuestions]);

  // Check if question is answered
  const isQuestionAnswered = useCallback((questionId: string) => {
    return state.answers.has(questionId);
  }, [state.answers]);

  /**
   * Submit the exam.
   *
   * Logs one ResponseRecord per answered question to the study store, then
   * updates progress via progressTracker + store.
   *
   * @param confidenceMap - Per-question confidence (keyed by questionId).
   *   Defaults to 'fairly-sure' for all until ConfidenceTap (T3) is wired.
   * TODO(T3): wire ConfidenceTap — remove default once component is available.
   */
  const submitExam = useCallback((
    confidenceMap: Map<string, Confidence> = new Map()
  ) => {
    const now = Date.now();
    const finalState: QuizState = {
      ...state,
      endTime: now,
      submitted: true,
    };

    setState(finalState);

    // Calculate results
    const examResults = calculateResults(finalState, config);
    setResults(examResults);
    setScore(examResults.score);

    // Clear saved state
    clearSavedState();

    // --- Study v1: log one ResponseRecord per answered question ---
    for (const [questionId, answer] of finalState.answers) {
      const question = finalState.questions.find(q => q.id === questionId);
      if (!question) continue;

      const correct = checkAnswer(question, answer);
      // TODO(T3): wire ConfidenceTap — remove default once component is available.
      const confidence: Confidence = confidenceMap.get(questionId) ?? 'fairly-sure';
      const startTime = questionStartTimes.current.get(questionId) ?? finalState.startTime;
      const timeMs = now - startTime;

      store.appendResponse({
        questionId,
        timestamp: now,
        correct,
        confidence,
        timeMs,
        mode: 'exam',
        optionChosen: Array.isArray(answer) ? answer.join(',') : answer,
        sessionId,
      }).catch((err: unknown) => {
        console.warn('[useExam] appendResponse failed:', err);
      });
    }

    // --- Study v1: update progress ---
    store.getProgress().then(currentProgress => {
      const updated = updateProgress(currentProgress, examResults);
      return store.updateProgress(updated);
    }).catch((err: unknown) => {
      console.warn('[useExam] updateProgress failed:', err);
    });
  }, [state, config, clearSavedState, store, sessionId]);

  // Reset the exam
  const resetExam = useCallback(() => {
    clearSavedState();
    setResults(null);
    setScore(null);
    setTimeRemaining(timeLimit);
    setIsPaused(false);
    questionStartTimes.current = new Map();

    setState({
      questions,
      currentIndex: 0,
      answers: new Map(),
      startTime: Date.now(),
      flaggedQuestions: new Set(),
      submitted: false,
    });
  }, [questions, timeLimit, clearSavedState]);

  // Pause timer
  const pauseTimer = useCallback(() => {
    setIsPaused(true);
  }, []);

  // Resume timer
  const resumeTimer = useCallback(() => {
    setIsPaused(false);
  }, []);

  return {
    state,
    currentQuestion,
    hasAnswer,
    isComplete,
    score,
    results,
    timeRemaining,
    isTimerRunning,
    isTimeExpired,
    answeredCount,
    flaggedCount,
    selectAnswer,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    toggleFlag,
    isQuestionFlagged,
    isQuestionAnswered,
    submitExam,
    resetExam,
    pauseTimer,
    resumeTimer,
  };
}
