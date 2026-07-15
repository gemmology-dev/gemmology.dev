import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionCard } from './QuestionCard';
import type { Question } from '../../lib/quiz';

function mcQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'mc1',
    type: 'multiple-choice',
    difficulty: 'beginner',
    category: 'fundamentals',
    topic: 'crystal-systems',
    questionText: 'Which system has three equal axes at 90 degrees?',
    options: ['Cubic', 'Trigonal', 'Monoclinic'],
    correctAnswer: 'Cubic',
    explanation: 'Cubic crystals have three equal, mutually perpendicular axes.',
    ...overrides,
  };
}

function fillBlankQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'fb1',
    type: 'fill-blank',
    difficulty: 'beginner',
    category: 'fundamentals',
    topic: 'hardness',
    questionText: 'Diamond has a Mohs hardness of ___.',
    correctAnswer: '10',
    ...overrides,
  };
}

function matchingQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'match1',
    type: 'matching',
    difficulty: 'intermediate',
    category: 'species',
    topic: 'gem-species',
    questionText: 'Match each gem to its crystal system.',
    matchingPairs: [
      { left: 'Diamond', right: 'Cubic' },
      { left: 'Quartz', right: 'Trigonal' },
    ],
    correctAnswer: ['Diamond:Cubic', 'Quartz:Trigonal'],
    ...overrides,
  };
}

describe('QuestionCard — multiple-choice', () => {
  it('renders all options', () => {
    render(
      <QuestionCard
        question={mcQuestion()}
        questionNumber={1}
        totalQuestions={5}
        showFeedback={true}
        isSubmitted={false}
        onSelectAnswer={() => {}}
      />
    );
    expect(screen.getByText('Cubic')).toBeInTheDocument();
    expect(screen.getByText('Trigonal')).toBeInTheDocument();
    expect(screen.getByText('Monoclinic')).toBeInTheDocument();
  });

  it('calls onSelectAnswer with the option text when clicked', async () => {
    const user = userEvent.setup();
    const onSelectAnswer = vi.fn();
    render(
      <QuestionCard
        question={mcQuestion()}
        questionNumber={1}
        totalQuestions={5}
        showFeedback={true}
        isSubmitted={false}
        onSelectAnswer={onSelectAnswer}
      />
    );
    await user.click(screen.getByText('Cubic'));
    expect(onSelectAnswer).toHaveBeenCalledWith('Cubic');
  });

  it('shows "Correct!" feedback via shared checkAnswer when submitted with the right answer', () => {
    render(
      <QuestionCard
        question={mcQuestion()}
        questionNumber={1}
        totalQuestions={5}
        selectedAnswer="Cubic"
        showFeedback={true}
        isSubmitted={true}
        onSelectAnswer={() => {}}
      />
    );
    expect(screen.getByText('Correct!')).toBeInTheDocument();
  });

  it('shows "Incorrect" feedback when submitted with the wrong answer', () => {
    render(
      <QuestionCard
        question={mcQuestion()}
        questionNumber={1}
        totalQuestions={5}
        selectedAnswer="Trigonal"
        showFeedback={true}
        isSubmitted={true}
        onSelectAnswer={() => {}}
      />
    );
    expect(screen.getByText('Incorrect')).toBeInTheDocument();
  });

  it('regression: shows zero correctness styling when isSubmitted=false (exam mode mid-question)', () => {
    render(
      <QuestionCard
        question={mcQuestion()}
        questionNumber={1}
        totalQuestions={5}
        selectedAnswer="Cubic"
        showFeedback={false}
        isSubmitted={false}
        onSelectAnswer={() => {}}
      />
    );
    // No feedback box at all.
    expect(screen.queryByText('Correct!')).not.toBeInTheDocument();
    expect(screen.queryByText('Incorrect')).not.toBeInTheDocument();
    // The selected option is not disabled/marked answered.
    const selectedOption = screen.getByRole('button', { name: /Cubic/i });
    expect(selectedOption).not.toBeDisabled();
  });

  it('regression: shows zero correctness styling when showFeedback=false even if isSubmitted were true', () => {
    render(
      <QuestionCard
        question={mcQuestion()}
        questionNumber={1}
        totalQuestions={5}
        selectedAnswer="Cubic"
        showFeedback={false}
        isSubmitted={true}
        onSelectAnswer={() => {}}
      />
    );
    expect(screen.queryByText('Correct!')).not.toBeInTheDocument();
    expect(screen.queryByText('Incorrect')).not.toBeInTheDocument();
  });

  it('renders headerExtra content when provided', () => {
    render(
      <QuestionCard
        question={mcQuestion()}
        questionNumber={1}
        totalQuestions={5}
        showFeedback={true}
        isSubmitted={false}
        onSelectAnswer={() => {}}
        headerExtra={<span>flag-button</span>}
      />
    );
    expect(screen.getByText('flag-button')).toBeInTheDocument();
  });

  it('renders scheduleBadge content when provided', () => {
    render(
      <QuestionCard
        question={mcQuestion()}
        questionNumber={1}
        totalQuestions={5}
        showFeedback={true}
        isSubmitted={false}
        onSelectAnswer={() => {}}
        scheduleBadge={<span>New</span>}
      />
    );
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('renders the RationalePanel when showRationalePanel is true and rationaleCorrect is present', () => {
    render(
      <QuestionCard
        question={mcQuestion({
          rationaleCorrect: 'Cubic crystals have three equal axes at right angles.',
          optionRationales: [
            { text: 'Cubic', isCorrect: true, rationale: 'Correct — isometric symmetry.' },
            { text: 'Trigonal', isCorrect: false, rationale: 'Trigonal has a 3-fold axis, not equal axes.' },
            { text: 'Monoclinic', isCorrect: false, rationale: 'Monoclinic has one oblique angle.' },
          ],
        })}
        questionNumber={1}
        totalQuestions={5}
        selectedAnswer="Trigonal"
        showFeedback={true}
        isSubmitted={true}
        showRationalePanel={true}
        onSelectAnswer={() => {}}
      />
    );
    expect(screen.getByRole('region', { name: /answer explanation/i })).toBeInTheDocument();
  });
});

describe('QuestionCard — fill-blank', () => {
  it('renders a text input and reports typed value to onSelectAnswer', async () => {
    const user = userEvent.setup();
    const onSelectAnswer = vi.fn();
    render(
      <QuestionCard
        question={fillBlankQuestion()}
        questionNumber={2}
        totalQuestions={5}
        showFeedback={true}
        isSubmitted={false}
        onSelectAnswer={onSelectAnswer}
      />
    );
    const input = screen.getByLabelText(/your answer/i);
    await user.type(input, '10');
    expect(onSelectAnswer).toHaveBeenCalled();
    expect(input).toHaveValue('10');
  });

  it('shows correct feedback using checkAnswer normalization (case/whitespace tolerant)', () => {
    render(
      <QuestionCard
        question={fillBlankQuestion()}
        questionNumber={2}
        totalQuestions={5}
        selectedAnswer="  10  "
        showFeedback={true}
        isSubmitted={true}
        onSelectAnswer={() => {}}
      />
    );
    expect(screen.getByText('Correct!')).toBeInTheDocument();
  });
});

describe('QuestionCard — matching', () => {
  it('renders one row per pair with a select of right-hand options', () => {
    render(
      <QuestionCard
        question={matchingQuestion()}
        questionNumber={3}
        totalQuestions={5}
        showFeedback={true}
        isSubmitted={false}
        onSelectAnswer={() => {}}
      />
    );
    expect(screen.getByText('Diamond')).toBeInTheDocument();
    expect(screen.getByText('Quartz')).toBeInTheDocument();
    expect(screen.getByLabelText(/match for diamond/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/match for quartz/i)).toBeInTheDocument();
  });

  it('reports the full pair array to onSelectAnswer as selections are made', async () => {
    const user = userEvent.setup();
    const onSelectAnswer = vi.fn();
    render(
      <QuestionCard
        question={matchingQuestion()}
        questionNumber={3}
        totalQuestions={5}
        selectedAnswer={[]}
        showFeedback={true}
        isSubmitted={false}
        onSelectAnswer={onSelectAnswer}
      />
    );
    await user.selectOptions(screen.getByLabelText(/match for diamond/i), 'Cubic');
    expect(onSelectAnswer).toHaveBeenCalledWith(['Diamond:Cubic']);
  });

  it('shows correct feedback when all pairs match regardless of order', () => {
    render(
      <QuestionCard
        question={matchingQuestion()}
        questionNumber={3}
        totalQuestions={5}
        selectedAnswer={['Quartz:Trigonal', 'Diamond:Cubic']}
        showFeedback={true}
        isSubmitted={true}
        onSelectAnswer={() => {}}
      />
    );
    expect(screen.getByText('Correct!')).toBeInTheDocument();
  });
});
