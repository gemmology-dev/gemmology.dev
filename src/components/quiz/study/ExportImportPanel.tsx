/**
 * ExportImportPanel — JSON export/import for localStorage study data.
 *
 * Export: calls store.exportAll() → triggers browser file download.
 * Import: file-picker → reads JSON text → store.importAll() → success/error toast.
 *
 * Accepts `store: StudyStore` as a prop so the real implementation can be
 * injected by the parent; tests use a mock.
 *
 * Uses Button from `@/components/ui`.
 */

import { useRef, useState } from 'react';
import { Download, Upload, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { StudyStore } from '../../../lib/quiz/study-types';
import { Button } from '../../ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../ui/Card';
import { cn } from '../../ui/cn';

interface ExportImportPanelProps {
  /** Injected store implementation (LocalStudyStore in prod, mock in dev/tests). */
  store: StudyStore;
}

type ToastState =
  | { kind: 'idle' }
  | { kind: 'success'; message: string }
  | { kind: 'warning'; message: string; warnings: string[] }
  | { kind: 'error'; message: string };

export function ExportImportPanel({ store }: ExportImportPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>({ kind: 'idle' });

  const showToast = (state: ToastState, durationMs = 6000) => {
    setToast(state);
    setTimeout(() => setToast({ kind: 'idle' }), durationMs);
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const json = await store.exportAll();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `gemmology-study-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast({ kind: 'success', message: 'Study data exported successfully.' });
    } catch (err) {
      showToast({
        kind: 'error',
        message: 'Export failed. Please try again.',
      });
    } finally {
      setExportLoading(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;

    setImportLoading(true);
    try {
      const text = await file.text();
      const result = await store.importAll(text);
      if (result.success && result.warnings.length === 0) {
        showToast({ kind: 'success', message: 'Study data imported successfully.' });
      } else if (result.success) {
        showToast({
          kind: 'warning',
          message: 'Imported with warnings.',
          warnings: result.warnings,
        });
      } else {
        showToast({
          kind: 'error',
          message: result.warnings[0] ?? 'Import failed — the file may be invalid.',
        });
      }
    } catch {
      showToast({
        kind: 'error',
        message: 'Could not read the file. Make sure it is a valid JSON export.',
      });
    } finally {
      setImportLoading(false);
      // Reset so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Card padding="none" className="overflow-hidden">
      <CardHeader className="px-6 pt-6 pb-4 mb-0 border-b border-slate-100 dark:border-slate-800">
        <CardTitle as="h2">Export &amp; Import</CardTitle>
        <CardDescription>
          Back up your study history, schedule, and settings to a JSON file, or
          restore a previous backup.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6 py-4 flex flex-col sm:flex-row gap-3">
        {/* Export button */}
        <Button
          variant="outline"
          size="md"
          loading={exportLoading}
          onClick={handleExport}
          leftIcon={<Download className="w-4 h-4" aria-hidden="true" />}
          aria-label="Export study data as JSON file"
        >
          Export study data
        </Button>

        {/* Import button */}
        <Button
          variant="ghost"
          size="md"
          loading={importLoading}
          onClick={handleImportClick}
          leftIcon={<Upload className="w-4 h-4" aria-hidden="true" />}
          aria-label="Import study data from JSON file"
        >
          Import
        </Button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          aria-hidden="true"
          tabIndex={-1}
          className="sr-only"
        />
      </CardContent>

      {/* Toast notification */}
      {toast.kind !== 'idle' && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={cn(
            'mx-6 mb-4 rounded-lg px-4 py-3 text-sm flex items-start gap-2',
            toast.kind === 'success' &&
              'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
            (toast.kind === 'warning') &&
              'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
            toast.kind === 'error' &&
              'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900',
          )}
        >
          {toast.kind === 'success' && (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
          )}
          {(toast.kind === 'warning' || toast.kind === 'error') && (
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
          )}
          <div>
            <p>{toast.kind === 'success' || toast.kind === 'error' ? toast.message : toast.message}</p>
            {toast.kind === 'warning' && toast.warnings.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {toast.warnings.map((w, i) => (
                  <li key={i} className="text-xs opacity-80">
                    {w}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
