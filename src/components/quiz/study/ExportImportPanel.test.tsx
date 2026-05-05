import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportImportPanel } from './ExportImportPanel';
import type { StudyStore } from '../../../lib/quiz/study-types';

// ── Minimal mock StudyStore ───────────────────────────────────────────────────

function makeMockStore(overrides: Partial<StudyStore> = {}): StudyStore {
  return {
    appendResponse: vi.fn().mockResolvedValue(undefined),
    getResponsesFor: vi.fn().mockResolvedValue([]),
    getRecentResponses: vi.fn().mockResolvedValue([]),
    getSchedule: vi.fn().mockResolvedValue(null),
    updateSchedule: vi.fn().mockResolvedValue(undefined),
    getDueItems: vi.fn().mockResolvedValue([]),
    getProgress: vi.fn().mockResolvedValue({
      completedTopics: {} as any,
      bestScores: {} as any,
      totalQuizzes: 0,
      totalCorrect: 0,
      totalAttempted: 0,
      lastActivity: 0,
    }),
    updateProgress: vi.fn().mockResolvedValue(undefined),
    getSettings: vi.fn().mockResolvedValue(undefined),
    updateSettings: vi.fn().mockResolvedValue(undefined),
    exportAll: vi.fn().mockResolvedValue('{"version":1}'),
    importAll: vi.fn().mockResolvedValue({ success: true, warnings: [] }),
    ...overrides,
  };
}

// ── Mock URL.createObjectURL (jsdom doesn't implement it) ─────────────────────

beforeEach(() => {
  (globalThis as any).URL.createObjectURL = vi.fn(() => 'blob:mock');
  (globalThis as any).URL.revokeObjectURL = vi.fn();
});

describe('ExportImportPanel', () => {
  // ── Render ─────────────────────────────────────────────────────────────────

  it('renders export and import buttons', () => {
    render(<ExportImportPanel store={makeMockStore()} />);
    expect(screen.getByRole('button', { name: /export study data/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument();
  });

  it('renders a heading', () => {
    render(<ExportImportPanel store={makeMockStore()} />);
    expect(screen.getByRole('heading', { name: /export.*import/i })).toBeInTheDocument();
  });

  // ── Export flow ────────────────────────────────────────────────────────────

  it('calls store.exportAll() when export button is clicked', async () => {
    const user = userEvent.setup();
    const store = makeMockStore();
    render(<ExportImportPanel store={store} />);
    await user.click(screen.getByRole('button', { name: /export study data/i }));
    await waitFor(() => expect(store.exportAll).toHaveBeenCalled());
  });

  it('shows a success toast after successful export', async () => {
    const user = userEvent.setup();
    render(<ExportImportPanel store={makeMockStore()} />);
    await user.click(screen.getByRole('button', { name: /export study data/i }));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(/exported successfully/i),
    );
  });

  it('shows an error toast when exportAll throws', async () => {
    const user = userEvent.setup();
    const store = makeMockStore({
      exportAll: vi.fn().mockRejectedValue(new Error('disk full')),
    });
    render(<ExportImportPanel store={store} />);
    await user.click(screen.getByRole('button', { name: /export study data/i }));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(/export failed/i),
    );
  });

  // ── Import flow ────────────────────────────────────────────────────────────

  it('shows a success toast after successful import', async () => {
    const user = userEvent.setup();
    const store = makeMockStore({
      importAll: vi.fn().mockResolvedValue({ success: true, warnings: [] }),
    });
    render(<ExportImportPanel store={store} />);

    const file = new File(['{"version":1}'], 'backup.json', {
      type: 'application/json',
    });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(/imported successfully/i),
    );
  });

  it('shows a warning toast when importAll returns warnings', async () => {
    const user = userEvent.setup();
    const store = makeMockStore({
      importAll: vi.fn().mockResolvedValue({
        success: true,
        warnings: ['Unknown field: foo'],
      }),
    });
    render(<ExportImportPanel store={store} />);

    const file = new File(['{"version":1}'], 'backup.json', {
      type: 'application/json',
    });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(/imported with warnings/i),
    );
    expect(screen.getByRole('status')).toHaveTextContent(/Unknown field: foo/);
  });

  it('shows an error toast when importAll returns success=false', async () => {
    const user = userEvent.setup();
    const store = makeMockStore({
      importAll: vi.fn().mockResolvedValue({
        success: false,
        warnings: ['Invalid schema version'],
      }),
    });
    render(<ExportImportPanel store={store} />);

    const file = new File(['bad json'], 'backup.json', {
      type: 'application/json',
    });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(/invalid schema version/i),
    );
  });

  // ── a11y ──────────────────────────────────────────────────────────────────

  it('toast has aria-live="polite"', async () => {
    const user = userEvent.setup();
    render(<ExportImportPanel store={makeMockStore()} />);
    await user.click(screen.getByRole('button', { name: /export study data/i }));
    await waitFor(() => screen.getByRole('status'));
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('file input has aria-hidden and tabIndex=-1', () => {
    render(<ExportImportPanel store={makeMockStore()} />);
    const input = document.querySelector('input[type="file"]');
    expect(input).toHaveAttribute('aria-hidden', 'true');
    expect(input).toHaveAttribute('tabindex', '-1');
  });
});
