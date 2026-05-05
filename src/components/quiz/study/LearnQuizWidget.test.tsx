import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LearnQuizWidget } from './LearnQuizWidget';
import type { WidgetQuestion } from './LearnQuizWidget';
import type { StudyStore } from '../../../lib/quiz/study-types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const Q1: WidgetQuestion = {
  id: 'q1',
  questionText: 'What crystal system is diamond?',
  options: ['Cubic', 'Hexagonal', 'Trigonal'],
  correctAnswer: 'Cubic',
  rationaleCorrect: 'Diamond crystallises in the cubic system with point group m3m.',
  optionRationales: [
    { text: 'Cubic', isCorrect: true, rationale: 'Correct.' },
    { text: 'Hexagonal', isCorrect: false, rationale: 'Hexagonal has 6-fold symmetry.' },
    { text: 'Trigonal', isCorrect: false, rationale: 'Trigonal has 3-fold symmetry.' },
  ],
};

const Q2: WidgetQuestion = {
  id: 'q2',
  questionText: 'What is the RI range of corundum?',
  options: ['1.544–1.553', '1.762–1.770', '1.718'],
  correctAnswer: '1.762–1.770',
  rationaleCorrect: 'Corundum has RI 1.762–1.770.',
};

const Q3: WidgetQuestion = {
  id: 'q3',
  questionText: 'Which gem shows asterism?',
  options: ['Star ruby', 'Peridot', 'Spinel'],
  correctAnswer: 'Star ruby',
  rationaleCorrect: 'Star ruby shows asterism due to silk inclusions.',
};

const QUESTIONS = [Q1, Q2, Q3];

function makeMockStore(overrides: Partial<StudyStore> = {}): StudyStore {
  return {
    appendResponse: vi.fn().mockResolvedValue(undefined),
    getResponsesFor: vi.fn().mockResolvedValue([]),
    getRecentResponses: vi.fn().mockResolvedValue([]),
    getSchedule: vi.fn().mockResolvedValue(null),
    updateSchedule: vi.fn().mockResolvedValue(undefined),
    getDueItems: vi.fn().mockResolvedValue([]),
    getProgress: vi.fn().mockResolvedValue({} as any),
    updateProgress: vi.fn().mockResolvedValue(undefined),
    getSettings: vi.fn().mockResolvedValue(undefined),
    updateSettings: vi.fn().mockResolvedValue(undefined),
    exportAll: vi.fn().mockResolvedValue('{}'),
    importAll: vi.fn().mockResolvedValue({ success: true, warnings: [] }),
    ...overrides,
  };
}

// ── Helper: answer current question, pick confidence, submit ──────────────────

async function answerQuestion(
  user: ReturnType<typeof userEvent.setup>,
  optionText: string,
  confidence: 'q' | 'w' | 'e' = 'e',
) {
  const optionBtn = screen.getByRole('radio', { name: new RegExp(optionText, 'i') });
  await user.click(optionBtn);
  // Trigger confidence via keyboard shortcut (userEvent wraps in act)
  await user.keyboard(confidence);
  // Wait for submit button to be enabled
  const submitBtn = await screen.findByRole('button', { name: /submit/i });
  await user.click(submitBtn);
}

describe('LearnQuizWidget', () => {
  // ── pretestEnabled=false ───────────────────────────────────────────────────

  it('renders nothing when pretestEnabled=false', () => {
    const { container } = render(
      <LearnQuizWidget
        slug="fundamentals/crystal-systems"
        pretestEnabled={false}
        questions={QUESTIONS}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when questions array is empty', () => {
    const { container } = render(
      <LearnQuizWidget
        slug="fundamentals/crystal-systems"
        pretestEnabled={true}
        questions={[]}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  // ── Initial render ─────────────────────────────────────────────────────────

  it('renders the first question text', () => {
    render(
      <LearnQuizWidget
        slug="fundamentals/crystal-systems"
        pretestEnabled={true}
        questions={QUESTIONS}
      />,
    );
    expect(screen.getByText(Q1.questionText)).toBeInTheDocument();
  });

  it('shows question counter "1 of 3"', () => {
    render(
      <LearnQuizWidget slug="slug" pretestEnabled={true} questions={QUESTIONS} />,
    );
    expect(screen.getByText(/1 of 3/i)).toBeInTheDocument();
  });

  it('renders answer options as radio buttons', () => {
    render(
      <LearnQuizWidget slug="slug" pretestEnabled={true} questions={QUESTIONS} />,
    );
    for (const opt of Q1.options) {
      expect(screen.getByRole('radio', { name: new RegExp(opt, 'i') })).toBeInTheDocument();
    }
  });

  it('Submit button is absent before selecting an option', () => {
    render(
      <LearnQuizWidget slug="slug" pretestEnabled={true} questions={QUESTIONS} />,
    );
    expect(screen.queryByRole('button', { name: /submit/i })).not.toBeInTheDocument();
  });

  // ── Option → confidence → submit flow ─────────────────────────────────────

  it('shows ConfidenceTap after selecting an option', async () => {
    const user = userEvent.setup();
    render(
      <LearnQuizWidget slug="slug" pretestEnabled={true} questions={QUESTIONS} />,
    );
    await user.click(screen.getByRole('radio', { name: /cubic/i }));
    expect(screen.getByRole('group', { name: /how confident/i })).toBeInTheDocument();
  });

  it('Submit button is disabled before choosing confidence', async () => {
    const user = userEvent.setup();
    render(
      <LearnQuizWidget slug="slug" pretestEnabled={true} questions={QUESTIONS} />,
    );
    await user.click(screen.getByRole('radio', { name: /cubic/i }));
    // Submit button appears but is disabled
    const submitBtn = screen.getByRole('button', { name: /submit/i });
    expect(submitBtn).toBeDisabled();
  });

  it('Submit button is enabled after option + confidence selected', async () => {
    const user = userEvent.setup();
    render(
      <LearnQuizWidget slug="slug" pretestEnabled={true} questions={QUESTIONS} />,
    );
    await user.click(screen.getByRole('radio', { name: /cubic/i }));
    await user.keyboard('e'); // certain — triggers ConfidenceTap shortcut
    // Button must now be enabled
    const submitBtn = await screen.findByRole('button', { name: /submit/i });
    expect(submitBtn).not.toBeDisabled();
  });

  it('shows RationalePanel after submitting', async () => {
    const user = userEvent.setup();
    render(
      <LearnQuizWidget slug="slug" pretestEnabled={true} questions={QUESTIONS} />,
    );
    await answerQuestion(user, 'Cubic');
    expect(
      screen.getByRole('region', { name: /answer explanation/i }),
    ).toBeInTheDocument();
  });

  it('shows "Next question" button after submitting non-final question', async () => {
    const user = userEvent.setup();
    render(
      <LearnQuizWidget slug="slug" pretestEnabled={true} questions={QUESTIONS} />,
    );
    await answerQuestion(user, 'Cubic');
    expect(screen.getByRole('button', { name: /next question/i })).toBeInTheDocument();
  });

  // ── Q2 advance ────────────────────────────────────────────────────────────

  it('advances to question 2 after clicking "Next question"', async () => {
    const user = userEvent.setup();
    render(
      <LearnQuizWidget slug="slug" pretestEnabled={true} questions={QUESTIONS} />,
    );
    await answerQuestion(user, 'Cubic');
    await user.click(screen.getByRole('button', { name: /next question/i }));
    expect(screen.getByText(Q2.questionText)).toBeInTheDocument();
    expect(screen.getByText(/2 of 3/i)).toBeInTheDocument();
  });

  // ── Q3 and completion ─────────────────────────────────────────────────────

  it('shows "Continue to article" button on the last question after submit', async () => {
    const user = userEvent.setup();
    render(
      <LearnQuizWidget slug="slug" pretestEnabled={true} questions={QUESTIONS} />,
    );
    await answerQuestion(user, 'Cubic');
    await user.click(screen.getByRole('button', { name: /next question/i }));
    await answerQuestion(user, '1.762');
    await user.click(screen.getByRole('button', { name: /next question/i }));
    await answerQuestion(user, 'Star ruby');
    expect(screen.getByRole('button', { name: /continue to article/i })).toBeInTheDocument();
  });

  it('shows completion message after clicking "Continue to article"', async () => {
    const user = userEvent.setup();
    render(
      <LearnQuizWidget slug="slug" pretestEnabled={true} questions={QUESTIONS} />,
    );
    // Full flow
    await answerQuestion(user, 'Cubic');
    await user.click(screen.getByRole('button', { name: /next question/i }));
    await answerQuestion(user, '1.762');
    await user.click(screen.getByRole('button', { name: /next question/i }));
    await answerQuestion(user, 'Star ruby');
    await user.click(screen.getByRole('button', { name: /continue to article/i }));

    expect(screen.getByText(/pretest complete/i)).toBeInTheDocument();
  });

  it('final CTA mentions how many were correct', async () => {
    const user = userEvent.setup();
    render(
      <LearnQuizWidget slug="slug" pretestEnabled={true} questions={QUESTIONS} />,
    );
    await answerQuestion(user, 'Cubic');         // correct
    await user.click(screen.getByRole('button', { name: /next question/i }));
    await answerQuestion(user, '1.544'); // wrong
    await user.click(screen.getByRole('button', { name: /next question/i }));
    await answerQuestion(user, 'Star ruby');      // correct
    await user.click(screen.getByRole('button', { name: /continue to article/i }));

    // 2 correct out of 3
    expect(screen.getByText(/2 of 3 correct/i)).toBeInTheDocument();
  });

  // ── Store integration ─────────────────────────────────────────────────────

  it('calls store.appendResponse with mode="pretest" after submitting', async () => {
    const user = userEvent.setup();
    const store = makeMockStore();
    render(
      <LearnQuizWidget
        slug="fundamentals/crystal-systems"
        pretestEnabled={true}
        questions={QUESTIONS}
        store={store}
      />,
    );
    await answerQuestion(user, 'Cubic');
    await waitFor(() => {
      expect(store.appendResponse).toHaveBeenCalledWith(
        expect.objectContaining({ mode: 'pretest', questionId: 'q1' }),
      );
    });
  });

  it('does not crash when store is undefined', async () => {
    const user = userEvent.setup();
    render(
      <LearnQuizWidget slug="slug" pretestEnabled={true} questions={[Q1]} />,
    );
    await answerQuestion(user, 'Cubic');
    // No error thrown
    expect(screen.getByRole('region', { name: /answer explanation/i })).toBeInTheDocument();
  });

  // ── Limits to MAX_QUESTIONS=3 ─────────────────────────────────────────────

  it('uses at most 3 questions even if more are passed', () => {
    const extraQ: WidgetQuestion = {
      id: 'q4',
      questionText: 'Extra question?',
      options: ['Yes', 'No'],
      correctAnswer: 'Yes',
      rationaleCorrect: 'Yes.',
    };
    render(
      <LearnQuizWidget
        slug="slug"
        pretestEnabled={true}
        questions={[Q1, Q2, Q3, extraQ]}
      />,
    );
    expect(screen.getByText(/1 of 3/i)).toBeInTheDocument();
  });

  // ── a11y ──────────────────────────────────────────────────────────────────

  it('widget has role="complementary" via the aside landmark', () => {
    render(
      <LearnQuizWidget slug="slug" pretestEnabled={true} questions={QUESTIONS} />,
    );
    // Astro renders aside, RTL sees it
    expect(screen.getByRole('complementary')).toBeInTheDocument();
  });

  it('option buttons have role="radio" for a11y', () => {
    render(
      <LearnQuizWidget slug="slug" pretestEnabled={true} questions={QUESTIONS} />,
    );
    const radios = screen.getAllByRole('radio');
    expect(radios.length).toBeGreaterThanOrEqual(3);
  });
});
