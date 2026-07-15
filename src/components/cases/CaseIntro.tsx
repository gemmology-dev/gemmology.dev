/**
 * CaseIntro — the backstory/specimen screen shown before a case's first
 * step. Offers "Resume case" instead of "Start case" when a saved
 * in-progress attempt already exists.
 */

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { DifficultyBadge } from '../ui/DifficultyBadge';
import { Button } from '../ui/Button';
import type { CaseDefinition } from '../../lib/cases/case-types';

const DIFFICULTY_LEVEL_MAP = {
  foundation: 'beginner',
  intermediate: 'intermediate',
  diploma: 'advanced',
} as const;

interface CaseIntroProps {
  caseData: CaseDefinition;
  /** Whether a saved in-progress attempt exists for this case. */
  hasSavedProgress: boolean;
  onStart: () => void;
}

export function CaseIntro({ caseData, hasSavedProgress, onStart }: CaseIntroProps) {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <DifficultyBadge level={DIFFICULTY_LEVEL_MAP[caseData.difficulty]} />
          {caseData.unvetted && <Badge variant="topaz">Unvetted</Badge>}
        </div>
        <CardTitle className="mt-3">{caseData.title}</CardTitle>
        <CardDescription>~{caseData.estimatedMinutes} min &middot; {caseData.steps.length} steps</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-slate-700">{caseData.backstory}</p>
        <p className="mt-3 text-sm font-medium text-slate-600">Specimen</p>
        <p className="text-slate-700">{caseData.specimenSummary}</p>
        {caseData.conceptTags && caseData.conceptTags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {caseData.conceptTags.map((tag) => (
              <Badge key={tag} variant="outline" size="sm">{tag}</Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="primary" className="w-full" onClick={onStart}>
          {hasSavedProgress ? 'Resume case' : 'Start case'}
        </Button>
      </CardFooter>
    </Card>
  );
}
