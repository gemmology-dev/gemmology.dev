/**
 * ConfirmDialog — shared modal confirmation dialog.
 *
 * Extracted from Exam.tsx's inline submit-confirmation modal so both Exam and
 * Quiz can use the same pattern (e.g. Exam's "Submit Exam?" and Quiz's
 * mid-quiz "Restart Quiz?" confirmations).
 */

import type { ReactNode } from 'react';
import { Button } from '../ui/Button';

interface ConfirmDialogProps {
  /** Whether the dialog is visible. Renders nothing when false. */
  open: boolean;
  /** Dialog title. */
  title: string;
  /** Body content — freeform, rendered below the title. */
  children?: ReactNode;
  /** Label for the confirm (primary) button. */
  confirmLabel: string;
  /** Label for the cancel (secondary) button. */
  cancelLabel: string;
  /** Called when the user confirms. */
  onConfirm: () => void;
  /** Called when the user cancels (also fires on backdrop click). */
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 dark:bg-coffee-raised2 dark:border dark:border-coffee-border"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-dialog-title" className="text-lg font-semibold text-slate-900 dark:text-cream-primary">
          {title}
        </h3>
        {children && (
          <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-cream-secondary">{children}</div>
        )}
        <div className="mt-6 flex gap-3">
          <Button variant="secondary" onClick={onCancel} className="flex-1">
            {cancelLabel}
          </Button>
          <Button variant="primary" onClick={onConfirm} className="flex-1">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
