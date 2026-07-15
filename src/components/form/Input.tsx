/**
 * Base styled input component.
 * Integrates with FormField context for automatic accessibility attributes.
 */

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../ui/cn';
import { useFormFieldOptional } from './FormFieldContext';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether the input has an error (overrides context) */
  hasError?: boolean;
  /** Content to display on the left side of input */
  leftAddon?: ReactNode;
  /** Content to display on the right side of input */
  rightAddon?: ReactNode;
}

const sizeClasses = {
  sm: 'px-2 py-1.5 text-sm',
  md: 'px-3 py-2',
  lg: 'px-3 py-2 text-lg',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    size = 'md',
    hasError: hasErrorProp,
    leftAddon,
    rightAddon,
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
  const inputId = id ?? context?.id;
  const hasError = hasErrorProp ?? context?.hasError ?? false;
  const isDisabled = disabled ?? context?.disabled ?? false;
  const isRequired = required ?? context?.required ?? false;

  // Build aria-describedby from context if not explicitly provided
  const describedBy = ariaDescribedby ?? (context?.hasError ? context.errorId : undefined);

  const inputElement = (
    <input
      ref={ref}
      id={inputId}
      disabled={isDisabled}
      required={isRequired}
      aria-invalid={ariaInvalid ?? hasError}
      aria-describedby={describedBy}
      className={cn(
        'w-full rounded-lg border bg-white dark:bg-coffee-sunk text-slate-900 dark:text-cream-primary placeholder-slate-500 dark:placeholder-cream-muted transition-colors',
        'focus:outline-none focus:ring-2',
        'disabled:bg-slate-50 dark:disabled:bg-coffee-raised2 disabled:text-slate-400 dark:disabled:text-cream-muted disabled:cursor-not-allowed',
        sizeClasses[size],
        hasError
          ? 'border-red-300 dark:border-red-400/50 focus:ring-red-500 dark:focus:ring-red-400/20 focus:border-red-500 dark:focus:border-red-400'
          : 'border-slate-300 dark:border-coffee-border focus:ring-crystal-500 dark:focus:ring-crystal-400/20 focus:border-crystal-500 dark:focus:border-crystal-400',
        // When used with addons, remove border radius on addon side
        leftAddon && 'rounded-l-none',
        rightAddon && 'rounded-r-none',
        className
      )}
      {...props}
    />
  );

  // If no addons, return input directly
  if (!leftAddon && !rightAddon) {
    return inputElement;
  }

  // Wrap with addon containers
  return (
    <div className="flex">
      {leftAddon && (
        <span
          className={cn(
            'inline-flex items-center px-3 rounded-l-lg border border-r-0',
            'bg-slate-50 dark:bg-coffee-raised2 text-slate-600 dark:text-cream-secondary text-sm',
            hasError ? 'border-red-300 dark:border-red-400/50' : 'border-slate-300 dark:border-coffee-border'
          )}
        >
          {leftAddon}
        </span>
      )}
      {inputElement}
      {rightAddon && (
        <span
          className={cn(
            'inline-flex items-center px-3 rounded-r-lg border border-l-0',
            'bg-slate-50 dark:bg-coffee-raised2 text-slate-600 dark:text-cream-secondary text-sm',
            hasError ? 'border-red-300 dark:border-red-400/50' : 'border-slate-300 dark:border-coffee-border'
          )}
        >
          {rightAddon}
        </span>
      )}
    </div>
  );
});
