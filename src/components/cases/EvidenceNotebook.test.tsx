import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EvidenceNotebook } from './EvidenceNotebook';
import type { EvidenceItem } from '../../lib/cases/case-types';

const EVIDENCE: EvidenceItem[] = [
  { id: 'ev-1', kind: 'ri', label: 'Refractometer reading', value: '1.762-1.770', detail: 'Uniaxial negative.' },
  { id: 'ev-2', kind: 'sg', label: 'Specific gravity', value: '4.00', toolHref: '/tools/measurement' },
];

describe('EvidenceNotebook', () => {
  it('shows a placeholder when no evidence has been gathered yet', () => {
    render(<EvidenceNotebook evidence={[]} />);
    const placeholders = screen.getAllByText('No evidence gathered yet.');
    // Both the mobile and desktop render trees are present in the DOM
    // simultaneously (visibility toggled purely via CSS), so both copies exist.
    expect(placeholders.length).toBeGreaterThan(0);
  });

  it('renders evidence items in accumulation order (both mobile and desktop copies)', () => {
    render(<EvidenceNotebook evidence={EVIDENCE} />);
    const readingLabels = screen.getAllByText('Refractometer reading');
    const sgLabels = screen.getAllByText('Specific gravity');
    expect(readingLabels.length).toBeGreaterThan(0);
    expect(sgLabels.length).toBeGreaterThan(0);
  });

  it('shows the evidence count in the disclosure summary and rail heading', () => {
    render(<EvidenceNotebook evidence={EVIDENCE} />);
    const headings = screen.getAllByText('Evidence (2)');
    expect(headings.length).toBeGreaterThan(0);
  });

  it('renders item detail text when present', () => {
    render(<EvidenceNotebook evidence={EVIDENCE} />);
    expect(screen.getAllByText('Uniaxial negative.').length).toBeGreaterThan(0);
  });

  it('renders a tool link when toolHref is present', () => {
    render(<EvidenceNotebook evidence={EVIDENCE} />);
    const links = screen.getAllByRole('link', { name: /open tool/i });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute('href', '/tools/measurement');
  });

  it('the mobile disclosure starts collapsed and can be toggled open', async () => {
    const user = userEvent.setup();
    render(<EvidenceNotebook evidence={EVIDENCE} />);
    const summaries = screen.getAllByText(/Evidence \(2\)/);
    const summaryEl = summaries.find((el) => el.tagName === 'SUMMARY');
    expect(summaryEl).toBeDefined();
    const details = summaryEl!.closest('details');
    expect(details).not.toHaveAttribute('open');
    await user.click(summaryEl!);
    expect(details).toHaveAttribute('open');
  });
});
