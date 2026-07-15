import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ChallengeProgress } from '../../../lib/quiz/challenge-store';

const mockGetAllProgress = vi.fn<() => Record<string, ChallengeProgress>>();

vi.mock('../../../lib/quiz/challenge-store', () => ({
  getChallengeStore: () => ({
    getAllProgress: mockGetAllProgress,
  }),
}));

const { ChallengesHub } = await import('./ChallengesHub');
import type { ChallengeTrackSummary } from './ChallengesHub';

function makeSummary(overrides: Partial<ChallengeTrackSummary> = {}): ChallengeTrackSummary {
  return {
    id: 'gem-chemistry',
    title: 'Gem Chemistry',
    description: 'A track about chemistry.',
    stageCount: 3,
    totalQuestions: 15,
    ...overrides,
  };
}

beforeEach(() => {
  mockGetAllProgress.mockReset();
  mockGetAllProgress.mockReturnValue({});
});

describe('ChallengesHub — empty state', () => {
  it('shows the "Tracks are coming" empty state when there are zero tracks', () => {
    render(<ChallengesHub trackSummaries={[]} />);
    expect(screen.getByText('Tracks are coming')).toBeInTheDocument();
  });

  it('does not render any track cards in the empty state', () => {
    render(<ChallengesHub trackSummaries={[]} />);
    expect(screen.queryByText('Gem Chemistry')).not.toBeInTheDocument();
  });
});

describe('ChallengesHub — track cards', () => {
  it('renders a card per track with title, description, and counts', () => {
    render(<ChallengesHub trackSummaries={[makeSummary()]} />);
    expect(screen.getByText('Gem Chemistry')).toBeInTheDocument();
    expect(screen.getByText('A track about chemistry.')).toBeInTheDocument();
    expect(screen.getByText('3 stages')).toBeInTheDocument();
    expect(screen.getByText('15 questions')).toBeInTheDocument();
  });

  it('shows "Start track" and no Completed badge when there is no recorded progress', async () => {
    render(<ChallengesHub trackSummaries={[makeSummary()]} />);
    expect(await screen.findByRole('button', { name: 'Start track' })).toBeInTheDocument();
    expect(screen.queryByText('Completed')).not.toBeInTheDocument();
  });

  it('shows "Continue track" and stage-passed count once progress is loaded', async () => {
    mockGetAllProgress.mockReturnValue({
      'gem-chemistry': {
        trackId: 'gem-chemistry',
        stages: {
          'stage-1': { stageId: 'stage-1', attempts: 1, bestScore: 0.9, passed: true, lastAttemptAt: Date.now() },
        },
      },
    });

    render(<ChallengesHub trackSummaries={[makeSummary()]} />);

    expect(await screen.findByRole('button', { name: 'Continue track' })).toBeInTheDocument();
    expect(await screen.findByText('1 / 3 stages passed')).toBeInTheDocument();
  });

  it('shows a Completed badge once completedAt is set', async () => {
    mockGetAllProgress.mockReturnValue({
      'gem-chemistry': {
        trackId: 'gem-chemistry',
        stages: {},
        completedAt: Date.now(),
      },
    });

    render(<ChallengesHub trackSummaries={[makeSummary()]} />);
    expect(await screen.findByText('Completed')).toBeInTheDocument();
  });

  it('does not throw when getChallengeStore/getAllProgress throws', () => {
    mockGetAllProgress.mockImplementation(() => {
      throw new Error('boom');
    });
    expect(() => render(<ChallengesHub trackSummaries={[makeSummary()]} />)).not.toThrow();
  });
});
