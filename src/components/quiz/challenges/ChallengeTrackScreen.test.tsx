import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ChallengeProgress } from '../../../lib/quiz/challenge-store';
import type { Question, QuizConfig, QuizResult } from '../../../lib/quiz';

const mockGetProgress = vi.fn<(trackId: string) => ChallengeProgress>();
const mockRecordStageResult = vi.fn();

vi.mock('../../../lib/quiz/challenge-store', () => ({
  getChallengeStore: () => ({
    getProgress: mockGetProgress,
    recordStageResult: mockRecordStageResult,
  }),
}));

// The real <Quiz/> pulls in the full study-store machinery; for this
// component's own tests (stage gating / start / complete / back), Quiz is
// treated as an opaque child so we can assert on the props it was given and
// trigger onComplete/onBack directly.
let lastQuizProps: { questions: Question[]; config: QuizConfig; onComplete?: (r: QuizResult) => void; onBack?: () => void } | null = null;

vi.mock('../Quiz', () => ({
  Quiz: (props: { questions: Question[]; config: QuizConfig; onComplete?: (r: QuizResult) => void; onBack?: () => void }) => {
    lastQuizProps = props;
    return (
      <div data-testid="mock-quiz">
        <span>Quiz for {props.questions.length} question(s)</span>
        <button
          onClick={() =>
            props.onComplete?.({
              results: [],
              score: props.questions.length,
              totalQuestions: props.questions.length,
              percentage: 100,
              timeTaken: 1000,
              breakdown: [],
              config: props.config,
              completedAt: Date.now(),
            })
          }
        >
          Mock Complete
        </button>
        <button onClick={() => props.onBack?.()}>Mock Back</button>
      </div>
    );
  },
}));

const { ChallengeTrackScreen } = await import('./ChallengeTrackScreen');

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'q1',
    type: 'multiple-choice',
    difficulty: 'beginner',
    category: 'fundamentals',
    topic: 'crystal-systems',
    questionText: 'Which system has three equal axes at 90 degrees?',
    options: ['Cubic', 'Trigonal', 'Monoclinic'],
    correctAnswer: 'Cubic',
    ...overrides,
  };
}

const track = {
  id: 'gem-chemistry',
  title: 'Gem Chemistry',
  description: 'Chemistry of gemstones.',
};

const stages = [
  { id: 'stage-1', title: 'Stage One', passThreshold: 0.7, questions: [makeQuestion({ id: 'q1' })] },
  { id: 'stage-2', title: 'Stage Two', passThreshold: 0.8, questions: [makeQuestion({ id: 'q2' })] },
];

beforeEach(() => {
  mockGetProgress.mockReset();
  mockRecordStageResult.mockReset();
  mockGetProgress.mockReturnValue({ trackId: 'gem-chemistry', stages: {} });
  lastQuizProps = null;
});

describe('ChallengeTrackScreen — stage gating', () => {
  it('shows stage 1 unlocked and stage 2 locked when no progress is recorded', async () => {
    render(<ChallengeTrackScreen track={track} stages={stages} />);

    expect(await screen.findByText('Stage 1: Stage One')).toBeInTheDocument();
    expect(screen.getByText('Stage 2: Stage Two')).toBeInTheDocument();

    const startButtons = screen.getAllByRole('button', { name: 'Start stage' });
    // Stage 1's start button enabled, stage 2's disabled (locked).
    expect(startButtons[0]).not.toBeDisabled();
    expect(startButtons[1]).toBeDisabled();
    expect(screen.getByText(/Complete stage 1 to unlock this stage\./)).toBeInTheDocument();
  });

  it('unlocks stage 2 once stage 1 is passed', async () => {
    mockGetProgress.mockReturnValue({
      trackId: 'gem-chemistry',
      stages: {
        'stage-1': { stageId: 'stage-1', attempts: 1, bestScore: 0.9, passed: true, lastAttemptAt: Date.now() },
      },
    });

    render(<ChallengeTrackScreen track={track} stages={stages} />);

    await waitFor(() => {
      const startButtons = screen.getAllByRole('button', { name: 'Start stage' });
      expect(startButtons[0]).toBeInTheDocument();
    });

    expect(await screen.findByText('Passed')).toBeInTheDocument();
    const retryOrStart = screen.getAllByRole('button', { name: /Retry stage|Start stage/ });
    expect(retryOrStart[1]).not.toBeDisabled();
  });
});

describe('ChallengeTrackScreen — starting and completing a stage', () => {
  it('passes the stage questions in fixed order to Quiz (no shuffleQuestions)', async () => {
    const user = userEvent.setup();
    render(<ChallengeTrackScreen track={track} stages={stages} />);

    await user.click((await screen.findAllByRole('button', { name: 'Start stage' }))[0]);

    expect(await screen.findByTestId('mock-quiz')).toBeInTheDocument();
    expect(lastQuizProps!.questions.map(q => q.id)).toEqual(['q1']);
    expect(lastQuizProps!.config.shuffleQuestions).toBe(false);
    expect(lastQuizProps!.config.questionCount).toBe(1);
  });

  it('records the result via recordStageResult and returns to the stage list on completion', async () => {
    const user = userEvent.setup();
    render(<ChallengeTrackScreen track={track} stages={stages} />);

    await user.click((await screen.findAllByRole('button', { name: 'Start stage' }))[0]);
    await screen.findByTestId('mock-quiz');

    await user.click(screen.getByRole('button', { name: 'Mock Complete' }));

    expect(mockRecordStageResult).toHaveBeenCalledWith(
      'gem-chemistry',
      'stage-1',
      1,
      1,
      0.7,
      ['stage-1', 'stage-2'],
    );

    await waitFor(() => {
      expect(screen.queryByTestId('mock-quiz')).not.toBeInTheDocument();
    });
    expect(await screen.findByText('Stage 1: Stage One')).toBeInTheDocument();
  });

  it('returns to the stage list when Back is triggered without completing', async () => {
    const user = userEvent.setup();
    render(<ChallengeTrackScreen track={track} stages={stages} />);

    await user.click((await screen.findAllByRole('button', { name: 'Start stage' }))[0]);
    await screen.findByTestId('mock-quiz');

    await user.click(screen.getByRole('button', { name: 'Mock Back' }));

    expect(mockRecordStageResult).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByTestId('mock-quiz')).not.toBeInTheDocument();
    });
  });
});
