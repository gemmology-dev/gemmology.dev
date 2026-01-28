/**
 * Validation message component for calculator inputs.
 * Displays inline validation hints when input values are invalid.
 */

import { cn } from '../ui/cn';

interface ValidationMessageProps {
  /** The message to display */
  message: string;
  /** Type of validation message */
  type?: 'error' | 'warning' | 'info';
  /** Whether the message should be visible */
  visible?: boolean;
  /** Additional class names */
  className?: string;
}

export function ValidationMessage({
  message,
  type = 'error',
  visible = true,
  className,
}: ValidationMessageProps) {
  if (!visible) return null;

  return (
    <p
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

// ============================================================================
// Validation utilities
// ============================================================================

/**
 * Validates a numeric input value.
 * Returns an error message if invalid, or null if valid.
 */
export function validateNumber(
  value: string,
  options?: {
    required?: boolean;
    min?: number;
    max?: number;
    positive?: boolean;
    label?: string;
  }
): string | null {
  const { required = false, min, max, positive = false, label = 'Value' } = options || {};

  if (!value) {
    return required ? `${label} is required` : null;
  }

  const num = parseFloat(value);

  if (isNaN(num)) {
    return 'Please enter a valid number';
  }

  if (positive && num <= 0) {
    return `${label} must be positive`;
  }

  if (min !== undefined && num < min) {
    return `${label} must be at least ${min}`;
  }

  if (max !== undefined && num > max) {
    return `${label} must be at most ${max}`;
  }

  return null;
}

/**
 * Validates a refractive index value (typically 1.0-3.0 for gems).
 */
export function validateRI(value: string): string | null {
  if (!value) return null;

  const num = parseFloat(value);
  if (isNaN(num)) return 'Please enter a valid number';
  if (num < 1.0 || num > 3.0) return 'RI should be between 1.0 and 3.0';

  return null;
}

/**
 * Validates that RI max is greater than RI min.
 */
export function validateRIRange(riMax: string, riMin: string): string | null {
  const max = parseFloat(riMax);
  const min = parseFloat(riMin);

  if (!isNaN(max) && !isNaN(min) && max < min) {
    return 'Maximum RI should be greater than minimum RI';
  }

  return null;
}
