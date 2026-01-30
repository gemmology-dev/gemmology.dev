/**
 * Field error display component.
 * Shows validation messages with appropriate styling and accessibility attributes.
 */

import { cn } from '../ui/cn';
import { useFormFieldOptional } from './FormFieldContext';

interface FieldErrorProps {
  /** Override the ID (defaults to context errorId) */
  id?: string;
  /** The error message to display */
  message: string | null | undefined;
  /** Type of message (affects styling) */
  type?: 'error' | 'warning' | 'info';
  /** Additional class names */
  className?: string;
}

export function FieldError({
  id,
  message,
  type = 'error',
  className,
}: FieldErrorProps) {
  const context = useFormFieldOptional();
  const errorId = id ?? context?.errorId;

  if (!message) return null;

  return (
    <p
      id={errorId}
      className={cn(
        'text-xs mt-1',
        type === 'error' && 'text-red-500',
        type === 'warning' && 'text-amber-500',
        type === 'info' && 'text-slate-500',
        className
      )}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live="polite"
    >
      {message}
    </p>
  );
}
