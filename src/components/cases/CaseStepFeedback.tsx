/**
 * CaseStepFeedback — wraps the existing quiz RationalePanel to show
 * post-submit feedback for a case step's decision.
 *
 * RationalePanel only has a binary `correct` prop, which would render an
 * `acceptable`-weight choice as "Not quite" even though partial credit was
 * awarded. To keep the tri-state tier legible, this wrapper adds its own
 * light-only tier badge line ("+N points · optimal/acceptable/poor") above
 * the panel rather than modifying RationalePanel (which contains `dark:`
 * classes that must not be touched or imitated here).
 */

import { RationalePanel } from '../quiz/study/RationalePanel';
import { Badge } from '../ui/Badge';
import type { CaseStep, DecisionRecord, CaseOptionWeight } from '../../lib/cases/case-types';

interface CaseStepFeedbackProps {
  step: CaseStep;
  decision: DecisionRecord;
  show: boolean;
}

function tierBadgeVariant(weight: CaseOptionWeight): 'emerald' | 'topaz' | 'ruby' {
  if (weight === 'optimal') return 'emerald';
  if (weight === 'acceptable') return 'topaz';
  return 'ruby';
}

function tierLabel(weight: CaseOptionWeight): string {
  if (weight === 'optimal') return 'optimal';
  if (weight === 'acceptable') return 'acceptable';
  return 'poor';
}

export function CaseStepFeedback({ step, decision, show }: CaseStepFeedbackProps) {
  if (!show) return null;

  const chosenOption = step.options.find((o) => o.id === decision.optionId);
  const optimalOption = step.options.find((o) => o.weight === 'optimal');
  const userPickedIndex = step.options.findIndex((o) => o.id === decision.optionId);
  const optionRationales = step.options.map((o) => ({
    text: o.text,
    isCorrect: o.weight === 'optimal',
    rationale: o.rationale,
  }));

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Badge variant={tierBadgeVariant(decision.weight)}>
          +{decision.scoreAwarded} points &middot; {tierLabel(decision.weight)}
        </Badge>
      </div>
      <RationalePanel
        correct={decision.weight === 'optimal'}
        rationaleCorrect={optimalOption?.rationale ?? chosenOption?.rationale ?? ''}
        optionRationales={optionRationales}
        userPickedIndex={userPickedIndex >= 0 ? userPickedIndex : undefined}
        show={show}
      />
    </div>
  );
}
