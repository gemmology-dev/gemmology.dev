/**
 * CaseRunner — island root for a single Lab Simulation case.
 * Wires useCaseRunner through intro -> step loop -> debrief, with a
 * ConfirmDialog-gated restart control available throughout.
 */

import { useState } from 'react';
import { useCaseRunner } from '../../hooks/useCaseRunner';
import { ConfirmDialog } from '../quiz/ConfirmDialog';
import { Button } from '../ui/Button';
import { CaseIntro } from './CaseIntro';
import { CaseProgressStrip } from './CaseProgressStrip';
import { EvidenceNotebook } from './EvidenceNotebook';
import { CaseStepPanel } from './CaseStepPanel';
import { CaseDebrief } from './CaseDebrief';
import type { CaseDefinition } from '../../lib/cases/case-types';

interface CaseRunnerProps {
  caseData: CaseDefinition;
}

export function CaseRunner({ caseData }: CaseRunnerProps) {
  const {
    state,
    currentStep,
    selectedOptionId,
    selectOption,
    isSubmitted,
    submitDecision,
    currentDecision,
    nextStep,
    resetCase,
    isComplete,
    result,
    revealedEvidence,
  } = useCaseRunner({ caseData });

  // Intro is shown until the learner explicitly starts/resumes, unless the
  // case is already complete (reopen straight into the debrief) or already
  // mid-run with at least one recorded decision (resuming past the intro).
  const [showIntro, setShowIntro] = useState(
    !isComplete && state.decisions.length === 0,
  );
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  const hasSavedProgress = state.decisions.length > 0 || isComplete;

  const handleRestart = () => {
    resetCase();
    setShowRestartConfirm(false);
    setShowIntro(true);
  };

  if (showIntro) {
    return (
      <CaseIntro
        caseData={caseData}
        hasSavedProgress={hasSavedProgress}
        onStart={() => setShowIntro(false)}
      />
    );
  }

  if (isComplete && result) {
    return (
      <div className="space-y-6">
        <CaseDebrief caseData={caseData} result={result} onRestart={() => setShowRestartConfirm(true)} />
        <ConfirmDialog
          open={showRestartConfirm}
          title="Restart case?"
          confirmLabel="Restart"
          cancelLabel="Cancel"
          onConfirm={handleRestart}
          onCancel={() => setShowRestartConfirm(false)}
        >
          <p>This clears your saved progress and score for this case. This cannot be undone.</p>
        </ConfirmDialog>
      </div>
    );
  }

  if (!currentStep) return null;

  const isLastStep = state.currentStepIndex >= caseData.steps.length - 1;
  const runningScore = state.decisions.reduce((sum, d) => sum + d.scoreAwarded, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <CaseProgressStrip
          current={state.currentStepIndex}
          total={caseData.steps.length}
          runningScore={runningScore}
          className="flex-1"
        />
        <Button variant="ghost" size="sm" onClick={() => setShowRestartConfirm(true)}>
          Restart
        </Button>
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_18rem] lg:gap-6 lg:items-start">
        <div className="lg:hidden">
          <EvidenceNotebook evidence={revealedEvidence} />
        </div>

        <CaseStepPanel
          step={currentStep}
          selectedOptionId={selectedOptionId}
          isSubmitted={isSubmitted}
          decision={currentDecision}
          isLastStep={isLastStep}
          onSelectOption={selectOption}
          onSubmit={submitDecision}
          onNext={nextStep}
        />

        <div className="hidden lg:block">
          <EvidenceNotebook evidence={revealedEvidence} />
        </div>
      </div>

      <ConfirmDialog
        open={showRestartConfirm}
        title="Restart case?"
        confirmLabel="Restart"
        cancelLabel="Cancel"
        onConfirm={handleRestart}
        onCancel={() => setShowRestartConfirm(false)}
      >
        <p>This clears your saved progress and score for this case. This cannot be undone.</p>
      </ConfirmDialog>
    </div>
  );
}
