/**
 * React hook for managing quiz state.
 * Handles question navigation, answer tracking, and results calculation.
 */

import { useState, useCallback, useMemo } from 'react';
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
  submitAnswer: () => void;
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
}

export function useQuiz({
  config,
  questions,
  persist = false,
}: UseQuizOptions): UseQuizReturn {
  // Initialize state
  const [savedState, setSavedState, clearSavedState] = useLocalStorage<string | null>(
    STORAGE_KEYS.QUIZ_STATE,
    null
  );

  // Track which questions have been submitted (practice mode)
  const [submittedQuestions, setSubmittedQuestions] = useState<Set<string>>(new Set());

  // Initialize quiz state
  const [state, setState] = useState<QuizState>(() => {
    // Try to restore from localStorage if persisting
    if (persist && savedState) {
      try {
        return deserializeQuizState(JSON.parse(savedState));
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

    const newAnswers = new Map(state.answers);
    newAnswers.set(currentQuestion.id, answer);

    saveState({
      ...state,
      answers: newAnswers,
    });
  }, [currentQuestion, state, saveState]);

  // Submit the current answer (practice mode - show feedback)
  const submitAnswer = useCallback(() => {
    if (!currentQuestion || !hasAnswer) return;

    setSubmittedQuestions(prev => new Set(prev).add(currentQuestion.id));
  }, [currentQuestion, hasAnswer]);

  // Navigate to next question
  const nextQuestion = useCallback(() => {
    if (state.currentIndex < state.questions.length - 1) {
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

  // Submit the entire quiz
  const submitQuiz = useCallback(() => {
    saveState({
      ...state,
      endTime: Date.now(),
      submitted: true,
    });
  }, [state, saveState]);

  // Reset the quiz
  const resetQuiz = useCallback(() => {
    setSubmittedQuestions(new Set());
    clearSavedState();

    setState({
      questions,
      currentIndex: 0,
      answers: new Map(),
      startTime: Date.now(),
      flaggedQuestions: new Set(),
      submitted: false,
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
  };
}
