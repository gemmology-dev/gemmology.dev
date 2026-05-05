/**
 * QuizPage - top-level quiz interface (practice + exam modes).
 */

import { useState, useEffect } from 'react';
import { QuizSetup, Quiz, Exam } from './index';
import type { Question, QuizConfig, Category, LearnEntry } from '../../lib/quiz';
import { generateQuestions, selectQuestions, getQuestionStats } from '../../lib/quiz';

interface QuizPageProps {
  /** Learn content entries for generating questions */
  learnEntries: LearnEntry[];
}

export function QuizPage({ learnEntries }: QuizPageProps) {
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [config, setConfig] = useState<QuizConfig | null>(null);
  const [timeLimit, setTimeLimit] = useState<number>(30 * 60);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const questions = generateQuestions(learnEntries);
    setAllQuestions(questions);
    setIsLoading(false);
  }, [learnEntries]);

  const stats = getQuestionStats(allQuestions);
  const availableQuestions = stats.byCategory as Record<Category, number>;

  const handleStart = (newConfig: QuizConfig, examTimeLimit?: number) => {
    const questions = selectQuestions(allQuestions, newConfig);
    setSelectedQuestions(questions);
    setConfig(newConfig);
    if (examTimeLimit) {
      setTimeLimit(examTimeLimit);
    }
  };

  const handleBack = () => {
    setConfig(null);
    setSelectedQuestions([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Practice and Exam Mode</h1>
          <p className="text-slate-600 mt-2">
            756 questions across all FGA subject areas. Practise at your own pace, or sit a timed mock exam.
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
  );
}
