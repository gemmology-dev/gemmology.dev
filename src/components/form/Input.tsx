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
        'w-full rounded-lg border bg-white transition-colors',
        'focus:outline-none focus:ring-2',
        'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',
        sizeClasses[size],
        hasError
          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
          : 'border-slate-300 focus:ring-crystal-500 focus:border-crystal-500',
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
            'bg-slate-50 text-slate-500 text-sm',
            hasError ? 'border-red-300' : 'border-slate-300'
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
            'bg-slate-50 text-slate-500 text-sm',
            hasError ? 'border-red-300' : 'border-slate-300'
          )}
        >
          {rightAddon}
        </span>
      )}
    </div>
  );
});
