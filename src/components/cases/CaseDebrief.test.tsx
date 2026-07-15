import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CaseDebrief } from './CaseDebrief';
import type { CaseDefinition, CaseResult } from '../../lib/cases/case-types';

const CASE_DATA: CaseDefinition = {
  id: 'test-case',
  title: "Dealer's Ruby",
  difficulty: 'intermediate',
  estimatedMinutes: 10,
  backstory: 'A dealer offers you a red stone.',
  specimenSummary: 'A 2ct red faceted stone.',
  groundTruth: { speciesFamilyId: 'corundum', treatment: 'heated' },
  steps: [
    {
      id: 'step-1',
      type: 'choose-next-test',
      prompt: 'What do you check first?',
      options: [
        { id: 'opt-a', text: 'Refractometer', weight: 'optimal', score: 10, rationale: 'Diagnostic RI window.' },
        { id: 'opt-b', text: 'Guess', weight: 'poor', score: 0, rationale: 'No evidence.' },
      ],
      pointsMultiplier: 1,
    },
    {
      id: 'step-2',
      type: 'final-identification',
      prompt: 'What is it?',
      options: [
        { id: 'opt-c', text: 'Natural ruby, heat-treated', weight: 'optimal', score: 10, rationale: 'Matches all evidence.' },
        { id: 'opt-d', text: 'Red spinel', weight: 'poor', score: 0, rationale: 'Spinel is isotropic.' },
      ],
      pointsMultiplier: 2,
    },
  ],
  debrief: {
    summary: 'The stone is a heat-treated natural ruby.',
    expertPath: ['Check RI first.', 'Confirm with SG.', 'Look for silk inclusions.', 'Conclude: heated ruby.'],
    furtherReading: ['Hughes, Ruby & Sapphire, ch. 4'],
  },
  conceptTags: ['corundum', 'treatments'],
  references: [{ id: 'hughes-ruby-sapphire', citation: "Hughes, R.W. Ruby & Sapphire: A Gemologist's Guide." }],
  unvetted: false,
};

const RESULT: CaseResult = {
  caseId: 'test-case',
  rawScore: 30,
  maxScore: 30,
  percentage: 100,
  efficiencyBonus: 2,
  grade: 'A',
  decisions: [
    {
      stepId: 'step-1',
      optionId: 'opt-a',
      weight: 'optimal',
      scoreAwarded: 10,
      timeCostIncurred: 1,
      timeMs: 500,
      timestamp: Date.now(),
    },
    {
      stepId: 'step-2',
      optionId: 'opt-c',
      weight: 'optimal',
      scoreAwarded: 20,
      timeCostIncurred: 1,
      timeMs: 800,
      timestamp: Date.now(),
    },
  ],
  completedAt: Date.now(),
};

describe('CaseDebrief', () => {
  it('shows the grade and score', () => {
    render(<CaseDebrief caseData={CASE_DATA} result={RESULT} onRestart={vi.fn()} />);
    expect(screen.getByText(/Grade A/)).toBeInTheDocument();
    expect(screen.getByText(/30\/30/)).toBeInTheDocument();
    expect(screen.getByText(/100%/)).toBeInTheDocument();
  });

  it('shows the efficiency bonus badge when positive', () => {
    render(<CaseDebrief caseData={CASE_DATA} result={RESULT} onRestart={vi.fn()} />);
    expect(screen.getByText(/\+2 efficiency bonus/)).toBeInTheDocument();
  });

  it('omits the efficiency bonus badge when zero', () => {
    render(
      <CaseDebrief caseData={CASE_DATA} result={{ ...RESULT, efficiencyBonus: 0 }} onRestart={vi.fn()} />,
    );
    expect(screen.queryByText(/efficiency bonus/)).not.toBeInTheDocument();
  });

  it('renders the debrief summary', () => {
    render(<CaseDebrief caseData={CASE_DATA} result={RESULT} onRestart={vi.fn()} />);
    expect(screen.getByText('The stone is a heat-treated natural ruby.')).toBeInTheDocument();
  });

  it('renders the expert path as an ordered list', () => {
    render(<CaseDebrief caseData={CASE_DATA} result={RESULT} onRestart={vi.fn()} />);
    expect(screen.getByText('Check RI first.')).toBeInTheDocument();
    expect(screen.getByText('Conclude: heated ruby.')).toBeInTheDocument();
  });

  it('renders further reading links/items', () => {
    render(<CaseDebrief caseData={CASE_DATA} result={RESULT} onRestart={vi.fn()} />);
    expect(screen.getByText('Hughes, Ruby & Sapphire, ch. 4')).toBeInTheDocument();
  });

  it('renders reference citations', () => {
    render(<CaseDebrief caseData={CASE_DATA} result={RESULT} onRestart={vi.fn()} />);
    expect(screen.getByText(/Hughes, R\.W\. Ruby & Sapphire/)).toBeInTheDocument();
  });

  it('renders a decision-by-decision review with each chosen option and rationale', () => {
    render(<CaseDebrief caseData={CASE_DATA} result={RESULT} onRestart={vi.fn()} />);
    expect(screen.getByText(/Refractometer/)).toBeInTheDocument();
    expect(screen.getByText('Diagnostic RI window.')).toBeInTheDocument();
    expect(screen.getByText(/Natural ruby, heat-treated/)).toBeInTheDocument();
    expect(screen.getByText('Matches all evidence.')).toBeInTheDocument();
  });

  it('calls onRestart when the restart button is clicked', async () => {
    const user = userEvent.setup();
    const onRestart = vi.fn();
    render(<CaseDebrief caseData={CASE_DATA} result={RESULT} onRestart={onRestart} />);
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRestart).toHaveBeenCalled();
  });
});
