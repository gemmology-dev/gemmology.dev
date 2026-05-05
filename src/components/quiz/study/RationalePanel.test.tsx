import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RationalePanel } from './RationalePanel';
import type { OptionRationale } from './RationalePanel';

const RATIONALES: OptionRationale[] = [
  { text: 'Ruby', isCorrect: true, rationale: 'All readings match corundum.' },
  { text: 'Spinel', isCorrect: false, rationale: 'Spinel is isotropic.' },
  { text: 'Pyrope', isCorrect: false, rationale: 'Pyrope SG is lower.' },
];

describe('RationalePanel', () => {
  // ── show=false ─────────────────────────────────────────────────────────────

  it('renders nothing when show=false', () => {
    const { container } = render(
      <RationalePanel
        correct={true}
        rationaleCorrect="Great diagnostic chain."
        show={false}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  // ── show=true, correct answer ──────────────────────────────────────────────

  it('renders the correct rationale text when shown', () => {
    render(
      <RationalePanel
        correct={true}
        rationaleCorrect="Great diagnostic chain."
        show={true}
      />,
    );
    expect(screen.getByText('Great diagnostic chain.')).toBeInTheDocument();
  });

  it('shows "Correct — here is why" heading when correct=true', () => {
    render(
      <RationalePanel correct={true} rationaleCorrect="test" show={true} />,
    );
    expect(screen.getByText(/correct — here is why/i)).toBeInTheDocument();
  });

  it('shows "Not quite — here is why" heading when correct=false', () => {
    render(
      <RationalePanel correct={false} rationaleCorrect="test" show={true} />,
    );
    expect(screen.getByText(/not quite — here is why/i)).toBeInTheDocument();
  });

  // ── Collapse / expand ──────────────────────────────────────────────────────

  it('starts expanded (body visible)', () => {
    render(
      <RationalePanel correct={true} rationaleCorrect="Explanation here." show={true} />,
    );
    expect(screen.getByText('Explanation here.')).toBeVisible();
  });

  it('collapses when the header button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <RationalePanel correct={true} rationaleCorrect="Explanation here." show={true} />,
    );
    const toggle = screen.getByRole('button');
    await user.click(toggle);
    // After collapse, the body div has `hidden` attribute
    const body = document.getElementById('rationale-body');
    expect(body).toHaveAttribute('hidden');
  });

  it('re-expands when clicked again', async () => {
    const user = userEvent.setup();
    render(
      <RationalePanel correct={true} rationaleCorrect="Explanation here." show={true} />,
    );
    const toggle = screen.getByRole('button');
    await user.click(toggle); // collapse
    await user.click(toggle); // expand
    const body = document.getElementById('rationale-body');
    expect(body).not.toHaveAttribute('hidden');
  });

  it('toggle button has aria-expanded reflecting state', async () => {
    const user = userEvent.setup();
    render(
      <RationalePanel correct={true} rationaleCorrect="x" show={true} />,
    );
    const toggle = screen.getByRole('button');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  // ── Per-option rationales ──────────────────────────────────────────────────

  it('renders all option rationales when provided', () => {
    render(
      <RationalePanel
        correct={false}
        rationaleCorrect="Here is why."
        optionRationales={RATIONALES}
        userPickedIndex={1}
        show={true}
      />,
    );
    expect(screen.getByText('All readings match corundum.')).toBeInTheDocument();
    expect(screen.getByText('Spinel is isotropic.')).toBeInTheDocument();
    expect(screen.getByText('Pyrope SG is lower.')).toBeInTheDocument();
  });

  it('marks the user-picked incorrect option with "(your choice)"', () => {
    render(
      <RationalePanel
        correct={false}
        rationaleCorrect="Here is why."
        optionRationales={RATIONALES}
        userPickedIndex={1}
        show={true}
      />,
    );
    expect(screen.getByText('(your choice)')).toBeInTheDocument();
  });

  it('renders without optionRationales prop without errors', () => {
    render(
      <RationalePanel correct={true} rationaleCorrect="test" show={true} />,
    );
    expect(screen.getByText('test')).toBeInTheDocument();
  });

  // ── a11y ──────────────────────────────────────────────────────────────────

  it('has role="region" with an accessible label', () => {
    render(<RationalePanel correct={true} rationaleCorrect="x" show={true} />);
    expect(
      screen.getByRole('region', { name: /answer explanation/i }),
    ).toBeInTheDocument();
  });
});
