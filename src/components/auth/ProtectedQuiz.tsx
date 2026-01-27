/**
 * Protected Quiz component wrapper.
 * Wraps the quiz interface with LockGate authentication.
 */

import { useState, useEffect } from 'react';
import { LockGate } from './LockGate';
import { QuizSetup, Quiz, Exam } from '../quiz';
import type { Question, QuizConfig, Category, LearnEntry } from '../../lib/quiz';
import { generateQuestions, selectQuestions, getQuestionStats } from '../../lib/quiz';

interface ProtectedQuizProps {
  /** Learn content entries for generating questions */
  learnEntries: LearnEntry[];
}

export function ProtectedQuiz({ learnEntries }: ProtectedQuizProps) {
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [config, setConfig] = useState<QuizConfig | null>(null);
  const [timeLimit, setTimeLimit] = useState<number>(30 * 60);
  const [isLoading, setIsLoading] = useState(true);

  // Generate all questions on mount
  useEffect(() => {
    const questions = generateQuestions(learnEntries);
    setAllQuestions(questions);
    setIsLoading(false);
  }, [learnEntries]);

  // Calculate available questions per category
  const stats = getQuestionStats(allQuestions);
  const availableQuestions = stats.byCategory as Record<Category, number>;

  // Handle quiz start
  const handleStart = (newConfig: QuizConfig, examTimeLimit?: number) => {
    const questions = selectQuestions(allQuestions, newConfig);
    setSelectedQuestions(questions);
    setConfig(newConfig);
    if (examTimeLimit) {
      setTimeLimit(examTimeLimit);
    }
  };

  // Handle going back to setup
  const handleBack = () => {
    setConfig(null);
    setSelectedQuestions([]);
  };

  return (
    <LockGate>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Quiz</h1>
            <p className="text-slate-600 mt-2">
              Test your gemmology knowledge with questions from the learn content.
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-pulse text-slate-400">Loading questions...</div>
            </div>
          ) : config && selectedQuestions.length > 0 ? (
            config.mode === 'exam' ? (
              <Exam
                config={config}
                questions={selectedQuestions}
                timeLimit={timeLimit}
                onBack={handleBack}
              />
            ) : (
              <Quiz
                config={config}
                questions={selectedQuestions}
                onBack={handleBack}
              />
            )
          ) : (
            <QuizSetup
              availableQuestions={availableQuestions}
              onStart={handleStart}
              showExamMode={true}
            />
          )}
        </div>
      </div>
    </LockGate>
  );
}
