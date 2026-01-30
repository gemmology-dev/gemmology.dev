/**
 * Form field container component.
 * Provides context for label, error display, and accessibility attribute management.
 */

import type { ReactNode } from 'react';
import { cn } from '../ui/cn';
import { FormFieldProvider, useFormField } from './FormFieldContext';
import { FieldError } from './FieldError';

interface FormFieldProps {
  /** Field name - used for ID generation */
  name: string;
  /** Label text */
  label: string;
  /** Unit to display after label, e.g., "(g)" or "(mm)" */
  unit?: string;
  /** Help text displayed below input */
  hint?: string;
  /** Error message for eager validation */
  error?: string | null;
  /** Warning message (non-blocking) */
  warning?: string | null;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Additional class names for the container */
  className?: string;
  /** Input or Select component */
  children: ReactNode;
}

export function FormField({
  name,
  label,
  unit,
  hint,
  error,
  warning,
  required = false,
  disabled = false,
  className,
  children,
}: FormFieldProps) {
  const hasError = !!error;

  return (
    <FormFieldProvider
      name={name}
      hasError={hasError}
      required={required}
      disabled={disabled}
    >
      <div className={cn('space-y-1', className)}>
        <FormFieldLabel label={label} unit={unit} required={required} />
        {children}
        {error && <FieldError message={error} type="error" />}
        {!error && warning && <FieldError message={warning} type="warning" />}
        {!error && !warning && hint && <FormFieldHint hint={hint} />}
      </div>
    </FormFieldProvider>
  );
}

/**
 * Label component for form fields.
 */
function FormFieldLabel({
  label,
  unit,
  required,
}: {
  label: string;
  unit?: string;
  required: boolean;
}) {
  const { id } = useFormField();

  return (
    <label
      htmlFor={id}
      className="block text-sm font-medium text-slate-700"
    >
      {label}
      {unit && (
        <span className="text-slate-500 font-normal ml-1">({unit})</span>
      )}
      {required && (
        <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
      )}
    </label>
  );
}

/**
 * Hint text component for form fields.
 */
function FormFieldHint({ hint }: { hint: string }) {
  const { hintId } = useFormField();

  return (
    <p id={hintId} className="text-xs text-slate-500">
      {hint}
    </p>
  );
}

// Export subcomponents for advanced usage
export { FormFieldLabel, FormFieldHint };
