import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CaseOptionList } from './CaseOptionList';
import type { CaseOption } from '../../lib/cases/case-types';

const OPTIONS: CaseOption[] = [
  { id: 'opt-a', text: 'Reach for the refractometer', weight: 'optimal', score: 10, rationale: 'Fast and diagnostic.' },
  { id: 'opt-b', text: 'Reach for the spectroscope', weight: 'acceptable', score: 5, rationale: 'Works, but slower here.' },
  { id: 'opt-c', text: 'Guess by eye', weight: 'poor', score: 0, rationale: 'No evidence gathered.' },
];

describe('CaseOptionList', () => {
  it('renders all options with A/B/C labels', () => {
    render(
      <CaseOptionList options={OPTIONS} selectedOptionId={null} isSubmitted={false} onSelect={vi.fn()} />,
    );
    expect(screen.getByText('Reach for the refractometer')).toBeInTheDocument();
    expect(screen.getByText('Reach for the spectroscope')).toBeInTheDocument();
    expect(screen.getByText('Guess by eye')).toBeInTheDocument();
  });

  it('calls onSelect with the option id when clicked, before submit', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <CaseOptionList options={OPTIONS} selectedOptionId={null} isSubmitted={false} onSelect={onSelect} />,
    );
    await user.click(screen.getByText('Reach for the refractometer'));
    expect(onSelect).toHaveBeenCalledWith('opt-a');
  });

  it('marks the selected option as aria-pressed before submit', () => {
    render(
      <CaseOptionList options={OPTIONS} selectedOptionId="opt-a" isSubmitted={false} onSelect={vi.fn()} />,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true');
    expect(buttons[1]).toHaveAttribute('aria-pressed', 'false');
  });

  it('disables all options once submitted', () => {
    render(
      <CaseOptionList options={OPTIONS} selectedOptionId="opt-a" isSubmitted={true} onSelect={vi.fn()} />,
    );
    for (const button of screen.getAllByRole('button')) {
      expect(button).toBeDisabled();
    }
  });

  it('does not call onSelect when clicked after submission', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <CaseOptionList options={OPTIONS} selectedOptionId="opt-a" isSubmitted={true} onSelect={onSelect} />,
    );
    await user.click(screen.getByText('Reach for the spectroscope'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('reveals tier badges for every option once submitted, not just the chosen one', () => {
    render(
      <CaseOptionList options={OPTIONS} selectedOptionId="opt-b" isSubmitted={true} onSelect={vi.fn()} />,
    );
    expect(screen.getByText(/Optimal.*\+10 pts/)).toBeInTheDocument();
    expect(screen.getByText(/Acceptable.*\+5 pts/)).toBeInTheDocument();
    expect(screen.getByText(/Poor.*\+0 pts/)).toBeInTheDocument();
  });

  it('marks only the chosen option as "(your choice)"', () => {
    render(
      <CaseOptionList options={OPTIONS} selectedOptionId="opt-b" isSubmitted={true} onSelect={vi.fn()} />,
    );
    expect(screen.getByText('(your choice)')).toBeInTheDocument();
    // Only one option should carry the "your choice" annotation.
    expect(screen.getAllByText('(your choice)')).toHaveLength(1);
  });
});
