import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Question, QuizConfig } from '../../lib/quiz';
import { DEFAULT_STUDY_SETTINGS } from '../../lib/quiz/study-types';
import { newScheduleEntry } from '../../lib/quiz/study-types';

// ── Mock the study store singleton so settings/schedule are observable and
//    controllable per test. ─────────────────────────────────────────────────
const mockStore = {
  appendResponse: vi.fn().mockResolvedValue(undefined),
  getResponsesFor: vi.fn().mockResolvedValue([]),
  getRecentResponses: vi.fn().mockResolvedValue([]),
  getSchedule: vi.fn().mockResolvedValue(null),
  updateSchedule: vi.fn().mockResolvedValue(undefined),
  getDueItems: vi.fn().mockResolvedValue([]),
  getProgress: vi.fn().mockResolvedValue({
    completedTopics: {
      fundamentals: [], equipment: [], species: [], identification: [],
      phenomena: [], origin: [], market: [], care: [],
    },
    bestScores: {
      fundamentals: 0, equipment: 0, species: 0, identification: 0,
      phenomena: 0, origin: 0, market: 0, care: 0,
    },
    totalQuizzes: 0,
    totalCorrect: 0,
    totalAttempted: 0,
    lastActivity: 0,
  }),
  updateProgress: vi.fn().mockResolvedValue(undefined),
  getSettings: vi.fn().mockResolvedValue(DEFAULT_STUDY_SETTINGS),
  updateSettings: vi.fn().mockResolvedValue(undefined),
  exportAll: vi.fn(),
  importAll: vi.fn(),
};

vi.mock('../../lib/quiz/store', () => ({
  getStudyStore: () => mockStore,
}));

const { Quiz } = await import('./Quiz');

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

function makeConfig(overrides: Partial<QuizConfig> = {}): QuizConfig {
  return {
    categories: ['fundamentals'],
    questionCount: 1,
    shuffleQuestions: false,
    shuffleOptions: false,
    mode: 'practice',
    ...overrides,
  };
}

beforeEach(() => {
  window.localStorage.clear();
  vi.clearAllMocks();
  mockStore.getSettings.mockResolvedValue(DEFAULT_STUDY_SETTINGS);
  mockStore.getSchedule.mockResolvedValue(null);
  mockStore.updateSchedule.mockResolvedValue(undefined);
  mockStore.appendResponse.mockResolvedValue(undefined);
});

describe('Quiz — study v1 wiring (A4b)', () => {
  it('shows ConfidenceTap once an answer is selected and gates Check Answer until confidence is chosen (requireConfidence: true)', async () => {
    const user = userEvent.setup();
    const question = makeQuestion();
    render(<Quiz config={makeConfig()} questions={[question]} />);

    // Confidence tap not shown before an answer is picked.
    expect(screen.queryByText('How confident are you?')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Cubic/ }));

    // Now the confidence tap should appear.
    await waitFor(() => {
      expect(screen.getByText('How confident are you?')).toBeInTheDocument();
    });

    // Check Answer is disabled until confidence is picked.
    const checkAnswerBtn = screen.getByRole('button', { name: 'Check Answer' });
    expect(checkAnswerBtn).toBeDisabled();

    await user.click(screen.getByRole('radio', { name: /Certain/ }));

    await waitFor(() => {
      expect(checkAnswerBtn).not.toBeDisabled();
    });
  });

  it('does not render ConfidenceTap and does not gate Check Answer when requireConfidence is false', async () => {
    const user = userEvent.setup();
    mockStore.getSettings.mockResolvedValue({
      ...DEFAULT_STUDY_SETTINGS,
      requireConfidence: false,
    });

    const question = makeQuestion();
    render(<Quiz config={makeConfig()} questions={[question]} />);

    await waitFor(() => {
      expect(mockStore.getSettings).toHaveBeenCalled();
    });

    await user.click(screen.getByRole('button', { name: /Cubic/ }));

    expect(screen.queryByText('How confident are you?')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Check Answer' })).not.toBeDisabled();
    });
  });

  it('submits the chosen confidence to submitAnswer via the SM-2 schedule update', async () => {
    const user = userEvent.setup();
    const question = makeQuestion();
    render(<Quiz config={makeConfig()} questions={[question]} />);

    await user.click(screen.getByRole('button', { name: /Cubic/ }));
    await waitFor(() => screen.getByText('How confident are you?'));
    await user.click(screen.getByRole('radio', { name: /Certain/ }));
    await user.click(screen.getByRole('button', { name: 'Check Answer' }));

    await waitFor(() => {
      expect(mockStore.appendResponse).toHaveBeenCalledWith(
        expect.objectContaining({ confidence: 'certain', correct: true })
      );
    });
  });

  it('shows the UnvettedFlag badge when the question is unvetted', async () => {
    const question = makeQuestion({ unvetted: true });
    render(<Quiz config={makeConfig()} questions={[question]} />);

    expect(await screen.findByText('Auto-generated')).toBeInTheDocument();
  });

  it('does not show the UnvettedFlag badge when the question is vetted', () => {
    const question = makeQuestion({ unvetted: false });
    render(<Quiz config={makeConfig()} questions={[question]} />);

    expect(screen.queryByText('Auto-generated')).not.toBeInTheDocument();
  });

  it('shows a "New" ScheduleBadge for a never-seen question', async () => {
    mockStore.getSchedule.mockResolvedValue(null);
    const question = makeQuestion();
    render(<Quiz config={makeConfig()} questions={[question]} />);

    expect(await screen.findByText('New')).toBeInTheDocument();
  });

  it('shows a "Due" ScheduleBadge when the schedule entry is due now', async () => {
    const dueEntry = { ...newScheduleEntry('q1'), totalReviews: 1, nextDue: Date.now() - 1000 };
    mockStore.getSchedule.mockResolvedValue(dueEntry);

    const question = makeQuestion();
    render(<Quiz config={makeConfig()} questions={[question]} />);

    expect(await screen.findByText('Due')).toBeInTheDocument();
  });
});

describe('Quiz — mid-quiz restart (A6)', () => {
  it('opens a confirm dialog from the Restart button and resets progress on confirm', async () => {
    const user = userEvent.setup();
    const question = makeQuestion();
    render(<Quiz config={makeConfig()} questions={[question]} />);

    // Select an answer so we have state to lose.
    await user.click(screen.getByRole('button', { name: /Cubic/ }));
    expect(screen.getByRole('button', { name: /Cubic/ })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Restart' }));
    expect(screen.getByText('Restart Quiz?')).toBeInTheDocument();

    // Two buttons are now named "Restart": the header ghost button and the
    // confirm dialog's primary action. The dialog's is the one rendered last.
    const restartButtons = screen.getAllByRole('button', { name: 'Restart' });
    await user.click(restartButtons[restartButtons.length - 1]);

    await waitFor(() => {
      expect(screen.queryByText('Restart Quiz?')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Cubic/ })).toHaveAttribute('aria-pressed', 'false');
  });

  it('cancelling the restart confirm dialog leaves progress untouched', async () => {
    const user = userEvent.setup();
    const question = makeQuestion();
    render(<Quiz config={makeConfig()} questions={[question]} />);

    await user.click(screen.getByRole('button', { name: /Cubic/ }));
    await user.click(screen.getByRole('button', { name: 'Restart' }));
    expect(screen.getByText('Restart Quiz?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByText('Restart Quiz?')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cubic/ })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('Quiz — unrenderable questions and auto-offer banner (A6)', () => {
  it('renders UnrenderableQuestionCard with a working Skip for a single malformed question, without showing the auto-offer banner', async () => {
    const user = userEvent.setup();
    const bad = makeQuestion({ id: 'bad', options: ['OnlyOne'] });
    const good = makeQuestion({ id: 'good' });
    render(<Quiz config={makeConfig({ questionCount: 2 })} questions={[bad, good]} />);

    expect(screen.getByText('This question could not be displayed')).toBeInTheDocument();
    expect(screen.queryByText('This saved session has a display issue — start fresh?')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Skip question' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Cubic/ })).toBeInTheDocument();
    });
  });

  it('shows the auto-offer banner when every remaining question is unrenderable', () => {
    const bad1 = makeQuestion({ id: 'bad1', options: ['OnlyOne'] });
    const bad2 = makeQuestion({ id: 'bad2', options: [] });
    render(<Quiz config={makeConfig({ questionCount: 2 })} questions={[bad1, bad2]} />);

    expect(
      screen.getByText('This saved session has a display issue — start fresh?')
    ).toBeInTheDocument();
  });
});

describe('Quiz — keyboard essentials (A8)', () => {
  it('pressing "1" selects the first option', async () => {
    mockStore.getSettings.mockResolvedValue({ ...DEFAULT_STUDY_SETTINGS, requireConfidence: false });
    const question = makeQuestion();
    render(<Quiz config={makeConfig()} questions={[question]} />);

    await waitFor(() => expect(mockStore.getSettings).toHaveBeenCalled());

    fireEvent.keyDown(document, { key: '1' });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Cubic/ })).toHaveAttribute('aria-pressed', 'true');
    });
  });

  it('pressing Enter submits the current answer once it is selectable', async () => {
    mockStore.getSettings.mockResolvedValue({ ...DEFAULT_STUDY_SETTINGS, requireConfidence: false });
    const user = userEvent.setup();
    const question = makeQuestion();
    render(<Quiz config={makeConfig()} questions={[question]} />);

    await user.click(screen.getByRole('button', { name: /Cubic/ }));
    fireEvent.keyDown(document, { key: 'Enter' });

    await waitFor(() => {
      expect(mockStore.appendResponse).toHaveBeenCalled();
    });
  });

  it('digit shortcuts are inert while the restart confirm dialog is open', async () => {
    mockStore.getSettings.mockResolvedValue({ ...DEFAULT_STUDY_SETTINGS, requireConfidence: false });
    const user = userEvent.setup();
    const question = makeQuestion();
    render(<Quiz config={makeConfig()} questions={[question]} />);

    await user.click(screen.getByRole('button', { name: 'Restart' }));
    expect(screen.getByText('Restart Quiz?')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: '1' });

    expect(screen.getByRole('button', { name: /Cubic/ })).toHaveAttribute('aria-pressed', 'false');
  });
});
