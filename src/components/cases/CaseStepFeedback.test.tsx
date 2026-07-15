import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CaseStepFeedback } from './CaseStepFeedback';
import type { CaseStep, DecisionRecord } from '../../lib/cases/case-types';

const STEP: CaseStep = {
  id: 'step-1',
  type: 'choose-next-test',
  prompt: 'What do you check first?',
  options: [
    { id: 'opt-a', text: 'Refractometer', weight: 'optimal', score: 10, rationale: 'Diagnostic RI window.' },
    { id: 'opt-b', text: 'Spectroscope', weight: 'acceptable', score: 5, rationale: 'Useful, but slower.' },
    { id: 'opt-c', text: 'Guess', weight: 'poor', score: 0, rationale: 'No evidence.' },
  ],
  pointsMultiplier: 1,
};

function makeDecision(overrides: Partial<DecisionRecord> = {}): DecisionRecord {
  return {
    stepId: 'step-1',
    optionId: 'opt-b',
    weight: 'acceptable',
    scoreAwarded: 5,
    timeCostIncurred: 1,
    timeMs: 1000,
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('CaseStepFeedback', () => {
  it('renders nothing when show=false', () => {
    const { container } = render(
      <CaseStepFeedback step={STEP} decision={makeDecision()} show={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows the tier + points badge for an optimal decision', () => {
    render(
      <CaseStepFeedback
        step={STEP}
        decision={makeDecision({ optionId: 'opt-a', weight: 'optimal', scoreAwarded: 10 })}
        show={true}
      />,
    );
    expect(screen.getByText(/\+10 points/)).toBeInTheDocument();
    expect(screen.getByText(/optimal/)).toBeInTheDocument();
  });

  it('preserves the "acceptable" tier distinction rather than collapsing to correct/incorrect', () => {
    render(<CaseStepFeedback step={STEP} decision={makeDecision()} show={true} />);
    // The tier badge line must say "acceptable" explicitly...
    expect(screen.getByText(/\+5 points/)).toBeInTheDocument();
    expect(screen.getByText(/acceptable/)).toBeInTheDocument();
    // ...and RationalePanel's binary heading resolves to "Not quite" since
    // acceptable isn't the optimal choice, but the badge above makes clear
    // partial credit was actually awarded.
    expect(screen.getByText(/not quite: here is why/i)).toBeInTheDocument();
  });

  it('shows a poor-tier decision with 0 points and the correct badge', () => {
    render(
      <CaseStepFeedback
        step={STEP}
        decision={makeDecision({ optionId: 'opt-c', weight: 'poor', scoreAwarded: 0 })}
        show={true}
      />,
    );
    expect(screen.getByText(/\+0 points/)).toBeInTheDocument();
    expect(screen.getByText(/poor/)).toBeInTheDocument();
  });

  it("renders the optimal option's rationale as the main explanation, even when a different option was chosen", () => {
    render(<CaseStepFeedback step={STEP} decision={makeDecision()} show={true} />);
    // Appears twice: once as the main rationale header, once in the
    // per-option rationale list — both sourced from the optimal option.
    expect(screen.getAllByText('Diagnostic RI window.').length).toBeGreaterThan(0);
  });

  it('renders per-option rationales for all options', () => {
    render(<CaseStepFeedback step={STEP} decision={makeDecision()} show={true} />);
    expect(screen.getAllByText('Diagnostic RI window.').length).toBeGreaterThan(0);
    expect(screen.getByText('Useful, but slower.')).toBeInTheDocument();
    expect(screen.getByText('No evidence.')).toBeInTheDocument();
  });
});
