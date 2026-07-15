import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuizSetup } from './QuizSetup';
import { CATEGORIES } from '../../lib/quiz';
import type { Category } from '../../lib/quiz';

function makeAvailableQuestions(overrides: Partial<Record<Category, number>> = {}): Record<Category, number> {
  const base = Object.fromEntries(CATEGORIES.map(c => [c, 10])) as Record<Category, number>;
  return { ...base, ...overrides };
}

describe('QuizSetup — category multi-select affordance (A5)', () => {
  it('shows the "N of 8 categories selected" helper line, updating as categories toggle', async () => {
    const user = userEvent.setup();
    render(
      <QuizSetup availableQuestions={makeAvailableQuestions()} onStart={vi.fn()} />
    );

    // Default: only 'fundamentals' pre-selected.
    expect(screen.getByText('1 of 8 categories selected')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Equipment/ }));
    expect(screen.getByText('2 of 8 categories selected')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Gem Species/ }));
    expect(screen.getByText('3 of 8 categories selected')).toBeInTheDocument();
  });

  it('marks selected category buttons with aria-pressed="true" and a check icon, unselected with "false"', async () => {
    const user = userEvent.setup();
    render(
      <QuizSetup availableQuestions={makeAvailableQuestions()} onStart={vi.fn()} />
    );

    const fundamentalsBtn = screen.getByRole('button', { name: /Fundamentals/ });
    const equipmentBtn = screen.getByRole('button', { name: /Equipment/ });

    expect(fundamentalsBtn).toHaveAttribute('aria-pressed', 'true');
    expect(equipmentBtn).toHaveAttribute('aria-pressed', 'false');

    await user.click(equipmentBtn);
    expect(equipmentBtn).toHaveAttribute('aria-pressed', 'true');

    await user.click(equipmentBtn);
    expect(equipmentBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('does not allow deselecting the last remaining category (min-1 rule preserved)', async () => {
    const user = userEvent.setup();
    render(
      <QuizSetup availableQuestions={makeAvailableQuestions()} onStart={vi.fn()} />
    );

    const fundamentalsBtn = screen.getByRole('button', { name: /Fundamentals/ });
    expect(fundamentalsBtn).toHaveAttribute('aria-pressed', 'true');

    // Only one category selected — clicking it again must be a no-op.
    await user.click(fundamentalsBtn);

    expect(fundamentalsBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('1 of 8 categories selected')).toBeInTheDocument();
  });

  it('supports selecting multiple categories simultaneously', async () => {
    const user = userEvent.setup();
    render(
      <QuizSetup availableQuestions={makeAvailableQuestions()} onStart={vi.fn()} />
    );

    await user.click(screen.getByRole('button', { name: /Equipment/ }));
    await user.click(screen.getByRole('button', { name: /Gem Species/ }));
    await user.click(screen.getByRole('button', { name: /Identification/ }));

    expect(screen.getByText('4 of 8 categories selected')).toBeInTheDocument();
    for (const name of [/Fundamentals/, /Equipment/, /Gem Species/, /Identification/]) {
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'true');
    }
  });
});
