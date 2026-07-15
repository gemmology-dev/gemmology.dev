/**
 * CaseDebrief — completion screen: grade + score + efficiency badge,
 * decision-by-decision review with rationale, expert path, and references.
 */

import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { CaseDefinition, CaseResult, CaseOptionWeight } from '../../lib/cases/case-types';

interface CaseDebriefProps {
  caseData: CaseDefinition;
  result: CaseResult;
  onRestart: () => void;
}

function tierBadgeVariant(weight: CaseOptionWeight): 'emerald' | 'topaz' | 'ruby' {
  if (weight === 'optimal') return 'emerald';
  if (weight === 'acceptable') return 'topaz';
  return 'ruby';
}

export function CaseDebrief({ caseData, result, onRestart }: CaseDebriefProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Case complete</CardTitle>
            <Badge variant="crystal">Grade {result.grade}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-700 dark:text-cream-secondary">
            <span>
              Score: <span className="font-medium">{result.rawScore}/{result.maxScore}</span> ({result.percentage}%)
            </span>
            {result.efficiencyBonus > 0 && (
              <Badge variant="topaz">+{result.efficiencyBonus} efficiency bonus</Badge>
            )}
          </div>
          <p className="mt-4 text-slate-700 dark:text-cream-secondary">{caseData.debrief.summary}</p>

          <p className="mt-4 text-sm font-semibold text-slate-800 dark:text-cream-primary">Expert path</p>
          <ol className="mt-2 list-decimal list-inside space-y-1 text-slate-700 dark:text-cream-secondary">
            {caseData.debrief.expertPath.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>

          {caseData.debrief.furtherReading && caseData.debrief.furtherReading.length > 0 && (
            <>
              <p className="mt-4 text-sm font-semibold text-slate-800 dark:text-cream-primary">Further reading</p>
              <ul className="mt-2 list-disc list-inside space-y-1 text-slate-700 dark:text-cream-secondary">
                {caseData.debrief.furtherReading.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </>
          )}

          {caseData.references && caseData.references.length > 0 && (
            <p className="mt-4 text-xs text-slate-500 dark:text-cream-muted">
              {caseData.references.map((ref) => ref.citation).join(' ')}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle as="h3">Decision review</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            {result.decisions.map((decision, i) => {
              const step = caseData.steps.find((s) => s.id === decision.stepId);
              const option = step?.options.find((o) => o.id === decision.optionId);
              if (!step || !option) return null;
              return (
                <li key={decision.stepId} className="border-l-2 border-slate-200 pl-4 dark:border-coffee-border">
                  <p className="text-sm font-medium text-slate-800 dark:text-cream-primary">
                    {i + 1}. {step.prompt}
                  </p>
                  <p className="mt-1 text-sm text-slate-700 dark:text-cream-secondary">
                    Chosen: {option.text}{' '}
                    <Badge variant={tierBadgeVariant(decision.weight)} size="sm">
                      +{decision.scoreAwarded} pts
                    </Badge>
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-cream-muted">{option.rationale}</p>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

      <Button variant="secondary" className="w-full" onClick={onRestart}>
        Try again
      </Button>
    </div>
  );
}
