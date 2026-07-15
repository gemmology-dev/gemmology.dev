/**
 * ChallengesHub — card grid landing page for Study Challenge Tracks.
 *
 * Used by src/pages/study/challenges/index.astro. Progress (stages passed /
 * total, "Completed" badge) is read from the localStorage-backed
 * LocalChallengeStore on mount via useEffect — SSR-safe, since no progress
 * is rendered until the effect runs client-side (avoids a hydration
 * mismatch between server and client markup).
 *
 * Renders a "Tracks are coming" empty state when `trackSummaries` is empty
 * (Phase 1 ships with zero real tracks — see src/content/challenges/_example).
 */

import { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../../ui/Card';
import { IconBox } from '../../ui/IconBox';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { getChallengeStore } from '../../../lib/quiz/challenge-store';
import type { ChallengeProgress } from '../../../lib/quiz/challenge-store';
import type { Category } from '../../../lib/quiz';
import { CATEGORY_LABELS } from '../../../lib/quiz';

/** Plain-data summary of one track, built at build time by the Astro page. */
export interface ChallengeTrackSummary {
  id: string;
  title: string;
  description: string;
  icon?: string;
  estimatedMinutes?: number;
  categoryAffinity?: Category;
  stageCount: number;
  totalQuestions: number;
}

interface ChallengesHubProps {
  trackSummaries: ChallengeTrackSummary[];
}

export function ChallengesHub({ trackSummaries }: ChallengesHubProps) {
  const [progressByTrack, setProgressByTrack] = useState<Record<string, ChallengeProgress>>({});

  useEffect(() => {
    try {
      setProgressByTrack(getChallengeStore().getAllProgress());
    } catch (err) {
      console.warn('[ChallengesHub] failed to load progress:', err);
    }
  }, []);

  if (trackSummaries.length === 0) {
    return <EmptyTracksState />;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {trackSummaries.map(track => {
        const progress = progressByTrack[track.id];
        const stagesPassed = progress
          ? Object.values(progress.stages).filter(s => s.passed).length
          : 0;
        const isComplete = Boolean(progress?.completedAt);

        return (
          <Card key={track.id} hover className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <IconBox variant="crystal" aria-hidden="true">
                  <span>{track.icon ?? '\u{1F3AF}'}</span>
                </IconBox>
                {isComplete && <Badge variant="emerald">Completed</Badge>}
              </div>
              <CardTitle className="mt-3">{track.title}</CardTitle>
              <CardDescription>{track.description}</CardDescription>
            </CardHeader>

            <CardContent className="flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
                <span>
                  {track.stageCount} stage{track.stageCount === 1 ? '' : 's'}
                </span>
                <span aria-hidden="true">&middot;</span>
                <span>
                  {track.totalQuestions} question{track.totalQuestions === 1 ? '' : 's'}
                </span>
                {track.estimatedMinutes !== undefined && (
                  <>
                    <span aria-hidden="true">&middot;</span>
                    <span>~{track.estimatedMinutes} min</span>
                  </>
                )}
              </div>

              {track.categoryAffinity && (
                <Badge variant="outline" size="sm" className="mt-3">
                  {CATEGORY_LABELS[track.categoryAffinity]}
                </Badge>
              )}

              <p className="text-sm text-slate-500 mt-3">
                {stagesPassed} / {track.stageCount} stages passed
              </p>
            </CardContent>

            <CardFooter>
              <Button
                variant="primary"
                className="w-full"
                onClick={() => {
                  window.location.href = `/study/challenges/${track.id}`;
                }}
              >
                {stagesPassed > 0 ? 'Continue track' : 'Start track'}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}

function EmptyTracksState() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
      <h2 className="text-xl font-semibold text-slate-900">Tracks are coming</h2>
      <p className="text-slate-600 mt-2 max-w-prose mx-auto">
        Themed challenge tracks are in development — structured, staged-mastery study
        paths built around specific gemmology topics. Check back soon, or head to
        practice and exam mode in the meantime.
      </p>
      <div className="mt-6">
        <Button
          variant="primary"
          onClick={() => {
            window.location.href = '/quiz';
          }}
        >
          Go to Practice &amp; Exam Mode
        </Button>
      </div>
    </div>
  );
}
