import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudySettingsPanel } from './StudySettingsPanel';
import type { StudySettings } from '../../../lib/quiz/study-types';
import { DEFAULT_STUDY_SETTINGS } from '../../../lib/quiz/study-types';

const defaultSettings: StudySettings = { ...DEFAULT_STUDY_SETTINGS };

describe('StudySettingsPanel', () => {
  // ── Render ─────────────────────────────────────────────────────────────────

  it('renders all four setting controls', () => {
    render(<StudySettingsPanel value={defaultSettings} onChange={() => {}} />);
    expect(screen.getByRole('switch', { name: /require confidence/i })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /show rationale/i })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: /review mix/i })).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: /default question count/i })).toBeInTheDocument();
  });

  it('reflects requireConfidence=true', () => {
    render(
      <StudySettingsPanel
        value={{ ...defaultSettings, requireConfidence: true }}
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole('switch', { name: /require confidence/i })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('reflects requireConfidence=false', () => {
    render(
      <StudySettingsPanel
        value={{ ...defaultSettings, requireConfidence: false }}
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole('switch', { name: /require confidence/i })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('reflects showRationaleOnSubmit=false', () => {
    render(
      <StudySettingsPanel
        value={{ ...defaultSettings, showRationaleOnSubmit: false }}
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole('switch', { name: /show rationale/i })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('reflects reviewMixRatio in the slider and percentage label', () => {
    render(
      <StudySettingsPanel
        value={{ ...defaultSettings, reviewMixRatio: 0.4 }}
        onChange={() => {}}
      />,
    );
    const slider = screen.getByRole('slider', { name: /review mix/i });
    expect(slider).toHaveValue('0.4');
    // Percentage label visible somewhere
    expect(screen.getByText(/40%/)).toBeInTheDocument();
  });

  it('reflects preferredQuestionCount', () => {
    render(
      <StudySettingsPanel
        value={{ ...defaultSettings, preferredQuestionCount: 15 }}
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole('spinbutton', { name: /default question count/i })).toHaveValue(15);
  });

  // ── Interaction ────────────────────────────────────────────────────────────

  it('calls onChange with { requireConfidence: false } when toggled off', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <StudySettingsPanel
        value={{ ...defaultSettings, requireConfidence: true }}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('switch', { name: /require confidence/i }));
    expect(onChange).toHaveBeenCalledWith({ requireConfidence: false });
  });

  it('calls onChange with { showRationaleOnSubmit: false } when toggled off', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <StudySettingsPanel
        value={{ ...defaultSettings, showRationaleOnSubmit: true }}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('switch', { name: /show rationale/i }));
    expect(onChange).toHaveBeenCalledWith({ showRationaleOnSubmit: false });
  });

  it('calls onChange with updated reviewMixRatio when slider moves', async () => {
    const onChange = vi.fn();
    const { fireEvent: fe } = await import('@testing-library/react');
    render(
      <StudySettingsPanel
        value={{ ...defaultSettings, reviewMixRatio: 0.7 }}
        onChange={onChange}
      />,
    );
    const slider = screen.getByRole('slider', { name: /review mix/i });
    fe.change(slider, { target: { value: '0.5' } });
    expect(onChange).toHaveBeenCalledWith({ reviewMixRatio: 0.5 });
  });

  it('calls onChange with updated preferredQuestionCount on valid input', async () => {
    const onChange = vi.fn();
    const { fireEvent: fe } = await import('@testing-library/react');
    render(
      <StudySettingsPanel
        value={{ ...defaultSettings, preferredQuestionCount: 10 }}
        onChange={onChange}
      />,
    );
    const input = screen.getByRole('spinbutton', { name: /default question count/i });
    fe.change(input, { target: { value: '20' } });
    expect(onChange).toHaveBeenCalledWith({ preferredQuestionCount: 20 });
  });

  // ── a11y attributes ────────────────────────────────────────────────────────

  it('toggle switches have role="switch"', () => {
    render(<StudySettingsPanel value={defaultSettings} onChange={() => {}} />);
    const switches = screen.getAllByRole('switch');
    expect(switches.length).toBeGreaterThanOrEqual(2);
  });

  it('slider has aria-valuemin, aria-valuemax, aria-valuenow', () => {
    render(<StudySettingsPanel value={defaultSettings} onChange={() => {}} />);
    const slider = screen.getByRole('slider', { name: /review mix/i });
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '1');
    expect(slider).toHaveAttribute('aria-valuenow');
  });
});
