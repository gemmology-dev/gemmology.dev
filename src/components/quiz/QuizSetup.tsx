/**
 * Quiz setup component for selecting categories, difficulty, and question count.
 */

import { useState } from 'react';
import type { QuizConfig, Category, Difficulty } from '../../lib/quiz';
import { CATEGORIES, CATEGORY_LABELS, DEFAULT_QUIZ_CONFIG } from '../../lib/quiz';
import { Button } from '../ui/Button';
import { cn } from '../ui/cn';

interface QuizSetupProps {
  /** Available question counts per category */
  availableQuestions: Record<Category, number>;
  /** Callback when quiz is started */
  onStart: (config: QuizConfig, timeLimit?: number) => void;
  /** Whether to show exam mode option */
  showExamMode?: boolean;
}

const QUESTION_COUNTS = [5, 10, 15, 20, 25, 50];
const DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced'];
const TIME_LIMITS = [
  { value: 15 * 60, label: '15 min' },
  { value: 30 * 60, label: '30 min' },
  { value: 45 * 60, label: '45 min' },
  { value: 60 * 60, label: '1 hour' },
  { value: 90 * 60, label: '1.5 hours' },
];

export function QuizSetup({
  availableQuestions,
  onStart,
  showExamMode = false,
}: QuizSetupProps) {
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(['fundamentals']);
  const [selectedDifficulties, setSelectedDifficulties] = useState<Difficulty[]>([]);
  const [questionCount, setQuestionCount] = useState(10);
  const [mode, setMode] = useState<'practice' | 'exam'>('practice');
  const [timeLimit, setTimeLimit] = useState(30 * 60); // 30 minutes default

  // Calculate total available questions based on selection
  const totalAvailable = selectedCategories.reduce(
    (sum, cat) => sum + (availableQuestions[cat] || 0),
    0
  );

  // Handle category toggle
  const toggleCategory = (category: Category) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        // Don't allow deselecting all categories
        if (prev.length === 1) return prev;
        return prev.filter(c => c !== category);
      }
      return [...prev, category];
    });
  };

  // Handle difficulty toggle
  const toggleDifficulty = (difficulty: Difficulty) => {
    setSelectedDifficulties(prev => {
      if (prev.includes(difficulty)) {
        return prev.filter(d => d !== difficulty);
      }
      return [...prev, difficulty];
    });
  };

  // Handle start
  const handleStart = () => {
    const config: QuizConfig = {
      categories: selectedCategories,
      difficulty: selectedDifficulties.length > 0 ? selectedDifficulties : undefined,
      questionCount: Math.min(questionCount, totalAvailable),
      shuffleQuestions: true,
      shuffleOptions: true,
      mode,
    };
    onStart(config, mode === 'exam' ? timeLimit : undefined);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Mode selection */}
      {showExamMode && (
        <div>
          <h3 className="text-lg font-medium text-slate-900 mb-3">Mode</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setMode('practice')}
              className={cn(
                'p-4 rounded-lg border-2 text-left transition-all',
                mode === 'practice'
                  ? 'border-crystal-500 bg-crystal-50'
                  : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    mode === 'practice' ? 'bg-crystal-500 text-white' : 'bg-slate-100 text-slate-500'
                  )}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Practice</p>
                  <p className="text-sm text-slate-500">Immediate feedback</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode('exam')}
              className={cn(
                'p-4 rounded-lg border-2 text-left transition-all',
                mode === 'exam'
                  ? 'border-crystal-500 bg-crystal-50'
                  : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    mode === 'exam' ? 'bg-crystal-500 text-white' : 'bg-slate-100 text-slate-500'
                  )}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Exam</p>
                  <p className="text-sm text-slate-500">Timed, no feedback</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Category selection */}
      <div>
        <h3 className="text-lg font-medium text-slate-900 mb-3">Categories</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CATEGORIES.map(category => {
            const count = availableQuestions[category] || 0;
            const isSelected = selectedCategories.includes(category);

            return (
              <button
                key={category}
                type="button"
                onClick={() => toggleCategory(category)}
                disabled={count === 0}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  'border-2',
                  isSelected && 'border-crystal-500 bg-crystal-50 text-crystal-700',
                  !isSelected && count > 0 && 'border-slate-200 text-slate-600 hover:border-slate-300',
                  count === 0 && 'border-slate-100 text-slate-300 cursor-not-allowed'
                )}
              >
                <span className="block">{CATEGORY_LABELS[category]}</span>
                <span className="text-xs opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Difficulty filter */}
      <div>
        <h3 className="text-lg font-medium text-slate-900 mb-3">
          Difficulty
          <span className="text-sm font-normal text-slate-500 ml-2">(optional)</span>
        </h3>
        <div className="flex gap-2">
          {DIFFICULTIES.map(difficulty => (
            <button
              key={difficulty}
              type="button"
              onClick={() => toggleDifficulty(difficulty)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all border-2',
                selectedDifficulties.includes(difficulty)
                  ? 'border-crystal-500 bg-crystal-50 text-crystal-700'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              )}
            >
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </button>
          ))}
        </div>
        {selectedDifficulties.length === 0 && (
          <p className="text-sm text-slate-500 mt-2">All difficulties will be included</p>
        )}
      </div>

      {/* Question count */}
      <div>
        <h3 className="text-lg font-medium text-slate-900 mb-3">Number of Questions</h3>
        <div className="flex flex-wrap gap-2">
          {QUESTION_COUNTS.map(count => (
            <button
              key={count}
              type="button"
              onClick={() => setQuestionCount(count)}
              disabled={count > totalAvailable}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all border-2',
                questionCount === count && 'border-crystal-500 bg-crystal-50 text-crystal-700',
                questionCount !== count && count <= totalAvailable && 'border-slate-200 text-slate-600 hover:border-slate-300',
                count > totalAvailable && 'border-slate-100 text-slate-300 cursor-not-allowed'
              )}
            >
              {count}
            </button>
          ))}
        </div>
        <p className="text-sm text-slate-500 mt-2">
          {totalAvailable} questions available from selected categories
        </p>
      </div>

      {/* Time limit (exam mode only) */}
      {mode === 'exam' && (
        <div>
          <h3 className="text-lg font-medium text-slate-900 mb-3">Time Limit</h3>
          <div className="flex flex-wrap gap-2">
            {TIME_LIMITS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTimeLimit(value)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all border-2',
                  timeLimit === value
                    ? 'border-crystal-500 bg-crystal-50 text-crystal-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-500 mt-2">
            Approximately {Math.round((timeLimit / 60) / questionCount * 10) / 10} minutes per question
          </p>
        </div>
      )}

      {/* Start button */}
      <div className="pt-4">
        <Button
          size="lg"
          onClick={handleStart}
          disabled={totalAvailable === 0}
          className="w-full"
        >
          Start {mode === 'exam' ? 'Exam' : 'Quiz'}
          <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
