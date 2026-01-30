/**
 * Number-specific input component.
 * Handles string value for controlled inputs while providing number-specific behavior.
 */

import { forwardRef, type KeyboardEvent } from 'react';
import { Input, type InputProps } from './Input';

export interface NumberInputProps extends Omit<InputProps, 'type' | 'onChange' | 'value'> {
  /** Current string value (controlled) */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Step increment */
  step?: number | 'any';
  /** Allow negative values (default: true) */
  allowNegative?: boolean;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
  {
    value,
    onChange,
    min,
    max,
    step = 'any',
    allowNegative = true,
    onKeyDown,
    ...props
  },
  ref
) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Prevent 'e' and 'E' which are valid for scientific notation but unwanted
    if (e.key === 'e' || e.key === 'E') {
      e.preventDefault();
    }

    // Prevent minus if negative not allowed
    if (!allowNegative && e.key === '-') {
      e.preventDefault();
    }

    // Call original onKeyDown if provided
    onKeyDown?.(e);
  };

  return (
    <Input
      ref={ref}
      type="number"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      min={min}
      max={max}
      step={step}
      {...props}
    />
  );
});
