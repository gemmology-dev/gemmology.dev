/**
 * CaseCard — hub card for a single Lab Simulation case.
 * Modeled on src/components/quiz/challenges/ChallengesHub.tsx's track card.
 *
 * Reads its own completed/score state from LocalCaseStore on mount via
 * useEffect (SSR-safe, avoids a hydration mismatch) so each card is an
 * independent island rather than requiring the whole hub to hydrate one
 * shared component.
 */

import { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../ui/Card';
import { IconBox } from '../ui/IconBox';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { DifficultyBadge } from '../ui/DifficultyBadge';
import { getCaseStore } from '../../lib/cases/store';
import type { CaseStoredEntry } from '../../lib/cases/store';

/** Maps a case's 3-level difficulty onto DifficultyBadge's beginner/intermediate/advanced scale. */
const DIFFICULTY_LEVEL_MAP = {
  foundation: 'beginner',
  intermediate: 'intermediate',
  diploma: 'advanced',
} as const;

/** Plain-data summary of one case, built at build time by the Astro page. */
export interface CaseSummary {
  id: string;
  title: string;
  difficulty: 'foundation' | 'intermediate' | 'diploma';
  estimatedMinutes: number;
  specimenSummary: string;
}

interface CaseCardProps {
  caseSummary: CaseSummary;
}

export function CaseCard({ caseSummary }: CaseCardProps) {
  const [entry, setEntry] = useState<CaseStoredEntry | null>(null);

  useEffect(() => {
    try {
      setEntry(getCaseStore().getCaseState(caseSummary.id));
    } catch (err) {
      console.warn('[CaseCard] failed to load case state:', err);
    }
  }, [caseSummary.id]);

  const isComplete = entry?.state.status === 'complete';
  const hasProgress = entry !== null && !isComplete;

  return (
    <Card hover className="flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <IconBox variant="ruby" aria-hidden="true">
            <span>{'\u{1F52C}'}</span>
          </IconBox>
          {isComplete && entry?.result && (
            <Badge variant="emerald">Solved &middot; {entry.result.grade}</Badge>
          )}
        </div>
        <CardTitle className="mt-3">{caseSummary.title}</CardTitle>
        <CardDescription>{caseSummary.specimenSummary}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600 dark:text-cream-secondary">
          <DifficultyBadge level={DIFFICULTY_LEVEL_MAP[caseSummary.difficulty]} />
          <span aria-hidden="true">&middot;</span>
          <span>~{caseSummary.estimatedMinutes} min</span>
        </div>

        {isComplete && entry?.result && (
          <p className="text-sm text-slate-500 mt-3 dark:text-cream-muted">
            Best result: {entry.result.percentage}% (+{entry.result.efficiencyBonus} efficiency)
          </p>
        )}
        {hasProgress && (
          <p className="text-sm text-slate-500 mt-3 dark:text-cream-muted">In progress &mdash; resume where you left off.</p>
        )}
      </CardContent>

      <CardFooter>
        <Button
          variant="primary"
          className="w-full"
          onClick={() => {
            window.location.href = `/study/cases/${caseSummary.id}`;
          }}
        >
          {isComplete ? 'Review case' : hasProgress ? 'Resume case' : 'Start case'}
        </Button>
      </CardFooter>
    </Card>
  );
}
