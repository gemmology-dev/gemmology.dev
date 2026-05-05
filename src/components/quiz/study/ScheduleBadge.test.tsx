import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScheduleBadge } from './ScheduleBadge';
import type { ScheduleEntry } from '../../../lib/quiz/study-types';

const NOW = 1_746_748_800_000; // fixed epoch for deterministic tests

function makeEntry(overrides: Partial<ScheduleEntry> = {}): ScheduleEntry {
  return {
    questionId: 'test-q',
    nextDue: NOW + 86_400_000 * 7, // due in 7 days
    intervalDays: 7,
    easeFactor: 2.5,
    repetitions: 2,
    lapses: 0,
    lastReviewed: NOW - 86_400_000,
    totalReviews: 3,
    ...overrides,
  };
}

describe('ScheduleBadge', () => {
  // ── null / never-seen entry ────────────────────────────────────────────────

  it('renders "New" when entry is null', () => {
    render(<ScheduleBadge entry={null} now={NOW} />);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('renders "New" when totalReviews is 0', () => {
    render(<ScheduleBadge entry={makeEntry({ totalReviews: 0 })} now={NOW} />);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('"New" badge has an appropriate aria-label', () => {
    render(<ScheduleBadge entry={null} now={NOW} />);
    expect(screen.getByLabelText(/new — never seen before/i)).toBeInTheDocument();
  });

  // ── Due state ─────────────────────────────────────────────────────────────

  it('renders "Due" when nextDue is in the past', () => {
    render(
      <ScheduleBadge
        entry={makeEntry({ nextDue: NOW - 1000 })}
        now={NOW}
      />,
    );
    expect(screen.getByText('Due')).toBeInTheDocument();
  });

  it('renders "Due" when nextDue equals now', () => {
    render(<ScheduleBadge entry={makeEntry({ nextDue: NOW })} now={NOW} />);
    expect(screen.getByText('Due')).toBeInTheDocument();
  });

  it('"Due" badge has an appropriate aria-label', () => {
    render(
      <ScheduleBadge entry={makeEntry({ nextDue: NOW - 1 })} now={NOW} />,
    );
    expect(screen.getByLabelText(/due for review/i)).toBeInTheDocument();
  });

  // ── Mastered state ────────────────────────────────────────────────────────

  it('renders "Mastered (7 d)" when due in 7 days', () => {
    render(
      <ScheduleBadge
        entry={makeEntry({ nextDue: NOW + 86_400_000 * 7 })}
        now={NOW}
      />,
    );
    expect(screen.getByText('Mastered (7 d)')).toBeInTheDocument();
  });

  it('renders "Mastered (1 d)" with singular day label', () => {
    render(
      <ScheduleBadge
        entry={makeEntry({ nextDue: NOW + 86_400_000 })}
        now={NOW}
      />,
    );
    expect(screen.getByText('Mastered (1 d)')).toBeInTheDocument();
  });

  it('"Mastered" badge has an appropriate aria-label mentioning days', () => {
    render(
      <ScheduleBadge
        entry={makeEntry({ nextDue: NOW + 86_400_000 * 14 })}
        now={NOW}
      />,
    );
    expect(screen.getByLabelText(/mastered, due in 14 days/i)).toBeInTheDocument();
  });

  // ── Edge: far-future date ─────────────────────────────────────────────────

  it('handles very large intervals gracefully', () => {
    render(
      <ScheduleBadge
        entry={makeEntry({ nextDue: NOW + 86_400_000 * 365 })}
        now={NOW}
      />,
    );
    expect(screen.getByText('Mastered (365 d)')).toBeInTheDocument();
  });
});
