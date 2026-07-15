/**
 * CaseStepPanel — a single case step: prompt, option list, tool/learn links,
 * and (once submitted) tier feedback + a "Continue" control.
 */

import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { CaseOptionList } from './CaseOptionList';
import { CaseStepFeedback } from './CaseStepFeedback';
import { ToolAndLearnLinks } from './ToolAndLearnLinks';
import type { CaseStep, DecisionRecord } from '../../lib/cases/case-types';

interface CaseStepPanelProps {
  step: CaseStep;
  selectedOptionId: string | null;
  isSubmitted: boolean;
  decision: DecisionRecord | null;
  isLastStep: boolean;
  onSelectOption: (optionId: string) => void;
  onSubmit: () => void;
  onNext: () => void;
}

export function CaseStepPanel({
  step,
  selectedOptionId,
  isSubmitted,
  decision,
  isLastStep,
  onSelectOption,
  onSubmit,
  onNext,
}: CaseStepPanelProps) {
  return (
    <Card>
      <CardContent>
        <p className="text-lg font-medium text-slate-900 dark:text-cream-primary">{step.prompt}</p>

        <div className="mt-4">
          <CaseOptionList
            options={step.options}
            selectedOptionId={selectedOptionId}
            isSubmitted={isSubmitted}
            onSelect={onSelectOption}
          />
        </div>

        <ToolAndLearnLinks learnLinks={step.learnLinks} toolLinks={step.toolLinks} />

        {isSubmitted && decision && (
          <div className="mt-4">
            <CaseStepFeedback step={step} decision={decision} show={isSubmitted} />
          </div>
        )}

        <div className="mt-6 flex justify-end">
          {!isSubmitted ? (
            <Button variant="primary" disabled={!selectedOptionId} onClick={onSubmit}>
              Submit decision
            </Button>
          ) : (
            <Button variant="primary" onClick={onNext}>
              {isLastStep ? 'See debrief' : 'Continue'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
