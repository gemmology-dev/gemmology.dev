import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UnvettedFlag } from './UnvettedFlag';

describe('UnvettedFlag', () => {
  // ── unvetted=false ─────────────────────────────────────────────────────────

  it('renders nothing when unvetted=false', () => {
    const { container } = render(<UnvettedFlag unvetted={false} />);
    expect(container.firstChild).toBeNull();
  });

  // ── unvetted=true — structural ─────────────────────────────────────────────

  it('renders when unvetted=true', () => {
    render(<UnvettedFlag unvetted={true} />);
    // Badge text "Auto-generated" — use getAllBy since tooltip also matches
    const matches = screen.getAllByText(/auto-generated/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('has an accessible label on the icon trigger', () => {
    render(<UnvettedFlag unvetted={true} />);
    expect(
      screen.getByRole('img', { name: /auto-generated question/i }),
    ).toBeInTheDocument();
  });

  it('has a tooltip element with role="tooltip"', () => {
    render(<UnvettedFlag unvetted={true} />);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('tooltip mentions expert-reviewed', () => {
    render(<UnvettedFlag unvetted={true} />);
    expect(screen.getByRole('tooltip')).toHaveTextContent(/expert-reviewed/i);
  });

  // ── Tooltip visibility on hover ────────────────────────────────────────────

  it('tooltip is initially hidden (opacity-0 / pointer-events-none)', () => {
    render(<UnvettedFlag unvetted={true} />);
    const tooltip = screen.getByRole('tooltip');
    // We test via class since opacity is CSS-only and jsdom won't compute it
    expect(tooltip).toHaveClass('opacity-0');
  });

  it('tooltip becomes visible on mouse enter', async () => {
    const user = userEvent.setup();
    render(<UnvettedFlag unvetted={true} />);
    const trigger = screen.getByRole('img', { name: /auto-generated question/i });
    await user.hover(trigger);
    expect(screen.getByRole('tooltip')).toHaveClass('opacity-100');
  });

  it('tooltip hides again on mouse leave', async () => {
    const user = userEvent.setup();
    render(<UnvettedFlag unvetted={true} />);
    const trigger = screen.getByRole('img', { name: /auto-generated question/i });
    await user.hover(trigger);
    await user.unhover(trigger);
    expect(screen.getByRole('tooltip')).toHaveClass('opacity-0');
  });

  // ── Focus-based tooltip ────────────────────────────────────────────────────

  it('tooltip shows on focus', async () => {
    const user = userEvent.setup();
    render(<UnvettedFlag unvetted={true} />);
    const trigger = screen.getByRole('img', { name: /auto-generated question/i });
    await user.tab(); // focus the tabIndex=0 element
    // Fallback: fireEvent.focus
    trigger.focus();
    expect(screen.getByRole('tooltip')).toHaveClass('opacity-100');
  });

  // ── aria-describedby linkage ───────────────────────────────────────────────

  it('trigger is described by the tooltip', () => {
    render(<UnvettedFlag unvetted={true} />);
    const trigger = screen.getByRole('img', { name: /auto-generated question/i });
    const tooltip = screen.getByRole('tooltip');
    expect(trigger).toHaveAttribute('aria-describedby', tooltip.id);
  });
});
