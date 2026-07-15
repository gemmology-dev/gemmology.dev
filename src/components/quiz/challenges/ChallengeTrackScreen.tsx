/**
 * ChallengeTrackScreen — per-track staged-mastery screen for Study Challenge
 * Tracks (Phase 1).
 *
 * Used by src/pages/study/challenges/[track].astro, which resolves the full
 * ordered Question[] for every stage at build time and passes plain data in
 * (no astro:content on the client).
 *
 * Two views:
 *  - "stages": a list of the track's stages with locked/unlocked/passed
 *    state. Stage N+1 is locked until stage N is passed; a locked stage
 *    shows a short rationale instead of a Start button.
 *  - "quiz": an active <Quiz/> session for one stage. On completion, the
 *    result is recorded via the ChallengeStore and the view returns to the
 *    stage list (with the newly-updated lock/passed state).
 *
 * Progress is read from the localStorage-backed ChallengeStore on mount via
 * useEffect — SSR-safe, since no progress/lock state is rendered until the
 * effect runs client-side.
 */

import { useEffect, useState } from 'react';
import { Quiz } from '../Quiz';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Link } from '../../ui/Link';
import { getChallengeStore } from '../../../lib/quiz/challenge-store';
import type { ChallengeProgress } from '../../../lib/quiz/challenge-store';
import { STORAGE_KEYS } from '../../../hooks/useLocalStorage';
import type { Category, Question, QuizResult } from '../../../lib/quiz';

/** One fully-resolved stage, as built at page-generation time by [track].astro. */
export interface ChallengeTrackScreenStage {
  id: string;
  title: string;
  description?: string;
  passThreshold: number;
  questions: Question[];
}

export interface ChallengeTrackScreenTrack {
  id: string;
  title: string;
  description: string;
  icon?: string;
  estimatedMinutes?: number;
  categoryAffinity?: Category;
}

interface ChallengeTrackScreenProps {
  track: ChallengeTrackScreenTrack;
  stages: ChallengeTrackScreenStage[];
}

function isStagePassed(progress: ChallengeProgress | null, stageId: string): boolean {
  return progress?.stages[stageId]?.passed ?? false;
}

export function ChallengeTrackScreen({ track, stages }: ChallengeTrackScreenProps) {
  const [progress, setProgress] = useState<ChallengeProgress | null>(null);
  const [activeStageIndex, setActiveStageIndex] = useState<number | null>(null);

  useEffect(() => {
    try {
      setProgress(getChallengeStore().getProgress(track.id));
    } catch (err) {
      console.warn('[ChallengeTrackScreen] failed to load progress:', err);
    }
  }, [track.id]);

  const handleStartStage = (index: number) => {
    if (typeof window !== 'undefined') {
      // Same pattern as QuizPage.handleStart: an explicit Start is always a
      // fresh session, so any leftover in-progress quiz state must be
      // discarded before <Quiz/> mounts and (potentially) restores it.
      window.localStorage.removeItem(STORAGE_KEYS.QUIZ_STATE);
    }
    setActiveStageIndex(index);
  };

  const backToStages = () => setActiveStageIndex(null);

  const handleStageComplete = (stageIndex: number, results: QuizResult) => {
    const stage = stages[stageIndex];
    const allStageIds = stages.map(s => s.id);
    try {
      const updated = getChallengeStore().recordStageResult(
        track.id,
        stage.id,
        results.score,
        results.totalQuestions,
        stage.passThreshold,
        allStageIds,
      );
      setProgress(updated);
    } catch (err) {
      console.warn('[ChallengeTrackScreen] failed to record stage result:', err);
    }
    setActiveStageIndex(null);
  };

  if (activeStageIndex !== null) {
    const stage = stages[activeStageIndex];
    const categories = Array.from(new Set(stage.questions.map(q => q.category)));

    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={backToStages}>
          &larr; Back to {track.title}
        </Button>
        <Quiz
          questions={stage.questions}
          config={{
            categories: categories.length > 0 ? categories : ['fundamentals'],
            questionCount: stage.questions.length,
            shuffleQuestions: false,
            shuffleOptions: true,
            mode: 'practice',
          }}
          onComplete={(results) => handleStageComplete(activeStageIndex, results)}
          onBack={backToStages}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/study/challenges" variant="muted">
          &larr; All challenge tracks
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 mt-3">{track.title}</h1>
        <p className="text-slate-600 mt-2 max-w-prose">{track.description}</p>
      </div>

      <div className="space-y-4">
        {stages.map((stage, index) => {
          const passed = isStagePassed(progress, stage.id);
          const previousPassed = index === 0 || isStagePassed(progress, stages[index - 1].id);
          const locked = !previousPassed;
          const result = progress?.stages[stage.id];

          return (
            <Card key={stage.id} className={locked ? 'opacity-70' : undefined}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle as="h2">
                    Stage {index + 1}: {stage.title}
                  </CardTitle>
                  {passed && <Badge variant="emerald">Passed</Badge>}
                  {!passed && locked && <Badge variant="default">Locked</Badge>}
                </div>
                {stage.description && <CardDescription>{stage.description}</CardDescription>}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">
                  {stage.questions.length} question{stage.questions.length === 1 ? '' : 's'} &middot;{' '}
                  {Math.round(stage.passThreshold * 100)}% to pass
                  {result && (
                    <>
                      {' '}
                      &middot; best score {Math.round(result.bestScore * 100)}%
                      {result.attempts > 1 ? ` (${result.attempts} attempts)` : ''}
                    </>
                  )}
                </p>
                {locked && (
                  <p className="text-sm text-amber-700 mt-2">
                    Complete stage {index} to unlock this stage.
                  </p>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  variant={passed ? 'secondary' : 'primary'}
                  disabled={locked || stage.questions.length === 0}
                  onClick={() => handleStartStage(index)}
                >
                  {passed ? 'Retry stage' : 'Start stage'}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
