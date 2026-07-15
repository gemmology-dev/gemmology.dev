/**
 * StudyReviewScreen — page-level wrapper that surfaces SM-2 due items.
 *
 * Used by `src/pages/study/review.astro`.
 *
 * Behaviour:
 *  - Generate the full question pool from learn entries
 *  - Ask the LocalStudyStore which question IDs are due now
 *  - If there are due items, render <Quiz/> with just those questions
 *  - Otherwise render an empty state with a CTA back to /quiz
 */

import { useEffect, useState } from 'react';
import { Quiz } from '../Quiz';
import { Button } from '../../ui/Button';
import {
  generateQuestions,
  DEFAULT_QUIZ_CONFIG,
  type LearnEntry,
  type Question,
  type QuizConfig,
} from '../../../lib/quiz';
import { getStudyStore } from '../../../lib/quiz/store/local';

interface StudyReviewScreenProps {
  /** Learn content entries for question generation. */
  learnEntries: LearnEntry[];
}

export function StudyReviewScreen({ learnEntries }: StudyReviewScreenProps) {
  const [store] = useState(() => getStudyStore());
  const [dueQuestions, setDueQuestions] = useState<Question[] | null>(null);

  useEffect(() => {
    let mounted = true;
    const all = generateQuestions(learnEntries);
    void store.getDueItems(Date.now()).then(dueIds => {
      if (!mounted) return;
      const dueSet = new Set(dueIds);
      const due = all.filter(q => dueSet.has(q.id));
      setDueQuestions(due);
    });
    return () => {
      mounted = false;
    };
  }, [learnEntries, store]);

  const config: QuizConfig = {
    ...DEFAULT_QUIZ_CONFIG,
    mode: 'practice',
    questionCount: dueQuestions?.length ?? 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 dark:from-coffee-page dark:to-coffee-page">
      <div className="max-w-4xl mx-auto px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-cream-primary">Review</h1>
          <p className="text-slate-600 mt-2 dark:text-cream-secondary">
            Spaced-repetition queue: items the scheduler says you should see today.
          </p>
        </header>

        {dueQuestions === null ? (
          <div className="text-center py-12 animate-pulse text-slate-500 dark:text-cream-muted">
            Loading due items…
          </div>
        ) : dueQuestions.length === 0 ? (
          <EmptyReviewState />
        ) : (
          <Quiz
            config={config}
            questions={dueQuestions}
            onBack={() => {
              window.location.href = '/quiz';
            }}
          />
        )}
      </div>
    </div>
  );
}

function EmptyReviewState() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-10 text-center dark:border-coffee-border dark:bg-coffee-raised">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-cream-primary">Nothing due right now</h2>
      <p className="text-slate-600 mt-2 max-w-prose mx-auto dark:text-cream-secondary">
        Your spaced-repetition queue is empty; every item you've seen is still
        within its scheduled interval. Practice new questions to grow the queue.
      </p>
      <div className="mt-6">
        <Button variant="primary" onClick={() => (window.location.href = '/quiz')}>
          Start a practice session
        </Button>
      </div>
    </div>
  );
}
