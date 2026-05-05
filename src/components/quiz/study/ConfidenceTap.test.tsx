import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfidenceTap } from './ConfidenceTap';

describe('ConfidenceTap', () => {
  // ── Render ─────────────────────────────────────────────────────────────────

  it('renders all three confidence buttons', () => {
    render(<ConfidenceTap value={null} onChange={() => {}} />);
    expect(screen.getByRole('radio', { name: /unsure/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /fairly sure/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /certain/i })).toBeInTheDocument();
  });

  it('renders a fieldset with a visible legend', () => {
    render(<ConfidenceTap value={null} onChange={() => {}} />);
    expect(screen.getByRole('group', { name: /how confident/i })).toBeInTheDocument();
  });

  it('shows keyboard shortcuts in the UI', () => {
    const { container } = render(<ConfidenceTap value={null} onChange={() => {}} />);
    // kbd elements are aria-hidden; query via text content
    const kbds = container.querySelectorAll('kbd');
    const texts = Array.from(kbds).map((k) => k.textContent);
    expect(texts).toContain('[Q]');
    expect(texts).toContain('[W]');
    expect(texts).toContain('[E]');
  });

  // ── aria-checked state ─────────────────────────────────────────────────────

  it('marks the selected option as aria-checked=true', () => {
    render(<ConfidenceTap value="fairly-sure" onChange={() => {}} />);
    expect(screen.getByRole('radio', { name: /fairly sure/i })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('marks unselected options as aria-checked=false', () => {
    render(<ConfidenceTap value="certain" onChange={() => {}} />);
    expect(screen.getByRole('radio', { name: /unsure/i })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    expect(screen.getByRole('radio', { name: /fairly sure/i })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('with value=null all options are aria-checked=false', () => {
    render(<ConfidenceTap value={null} onChange={() => {}} />);
    for (const label of [/unsure/i, /fairly sure/i, /certain/i]) {
      expect(screen.getByRole('radio', { name: label })).toHaveAttribute(
        'aria-checked',
        'false',
      );
    }
  });

  // ── Mouse interaction ──────────────────────────────────────────────────────

  it('calls onChange with "unsure" when Unsure is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ConfidenceTap value={null} onChange={onChange} />);
    await user.click(screen.getByRole('radio', { name: /unsure/i }));
    expect(onChange).toHaveBeenCalledWith('unsure');
  });

  it('calls onChange with "fairly-sure" when Fairly sure is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ConfidenceTap value={null} onChange={onChange} />);
    await user.click(screen.getByRole('radio', { name: /fairly sure/i }));
    expect(onChange).toHaveBeenCalledWith('fairly-sure');
  });

  it('calls onChange with "certain" when Certain is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ConfidenceTap value={null} onChange={onChange} />);
    await user.click(screen.getByRole('radio', { name: /certain/i }));
    expect(onChange).toHaveBeenCalledWith('certain');
  });

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────

  it('calls onChange with "unsure" on Q keydown', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ConfidenceTap value={null} onChange={onChange} />);
    await user.keyboard('q');
    expect(onChange).toHaveBeenCalledWith('unsure');
  });

  it('calls onChange with "fairly-sure" on W keydown', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ConfidenceTap value={null} onChange={onChange} />);
    await user.keyboard('w');
    expect(onChange).toHaveBeenCalledWith('fairly-sure');
  });

  it('calls onChange with "certain" on E keydown', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ConfidenceTap value={null} onChange={onChange} />);
    await user.keyboard('e');
    expect(onChange).toHaveBeenCalledWith('certain');
  });

  it('ignores keyboard shortcuts when disabled=true', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ConfidenceTap value={null} onChange={onChange} disabled={true} />);
    await user.keyboard('q');
    expect(onChange).not.toHaveBeenCalled();
  });

  // ── Disabled prop ──────────────────────────────────────────────────────────

  it('disables all buttons when disabled=true', () => {
    render(<ConfidenceTap value={null} onChange={() => {}} disabled={true} />);
    for (const label of [/unsure/i, /fairly sure/i, /certain/i]) {
      expect(screen.getByRole('radio', { name: label })).toBeDisabled();
    }
  });

  it('does not call onChange when a disabled button is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ConfidenceTap value={null} onChange={onChange} disabled={true} />);
    await user.click(screen.getByRole('radio', { name: /unsure/i }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
