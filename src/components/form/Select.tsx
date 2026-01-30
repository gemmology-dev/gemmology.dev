/**
 * Styled select dropdown component.
 * Integrates with FormField context for automatic accessibility attributes.
 */

import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '../ui/cn';
import { useFormFieldOptional } from './FormFieldContext';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'size'> {
  /** Available options */
  options: SelectOption[];
  /** Current value */
  value: string;
  /** Callback when selection changes */
  onChange: (value: string) => void;
  /** Placeholder text for empty state */
  placeholder?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether the select has an error (overrides context) */
  hasError?: boolean;
}

const sizeClasses = {
  sm: 'px-2 py-1.5 text-sm',
  md: 'px-3 py-2',
  lg: 'px-3 py-2 text-lg',
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    options,
    value,
    onChange,
    placeholder,
    size = 'md',
    hasError: hasErrorProp,
    className,
    id,
    disabled,
    required,
    'aria-invalid': ariaInvalid,
    'aria-describedby': ariaDescribedby,
    ...props
  },
  ref
) {
  const context = useFormFieldOptional();

  // Use explicit props or fall back to context
  const selectId = id ?? context?.id;
  const hasError = hasErrorProp ?? context?.hasError ?? false;
  const isDisabled = disabled ?? context?.disabled ?? false;
  const isRequired = required ?? context?.required ?? false;

  // Build aria-describedby from context if not explicitly provided
  const describedBy = ariaDescribedby ?? (context?.hasError ? context.errorId : undefined);

  return (
    <select
      ref={ref}
      id={selectId}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={isDisabled}
      required={isRequired}
      aria-invalid={ariaInvalid ?? hasError}
      aria-describedby={describedBy}
      className={cn(
        'w-full rounded-lg border bg-white transition-colors appearance-none cursor-pointer',
        'focus:outline-none focus:ring-2',
        'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',
        // Arrow icon using CSS
        'bg-no-repeat bg-right',
        "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E\")]",
        'bg-[length:1.5rem_1.5rem]',
        'pr-10', // Space for arrow
        sizeClasses[size],
        hasError
          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
          : 'border-slate-300 focus:ring-crystal-500 focus:border-crystal-500',
        className
      )}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </select>
  );
});
