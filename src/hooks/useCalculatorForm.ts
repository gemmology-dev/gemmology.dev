/**
 * Unified multi-field form state hook with eager validation.
 * Provides automatic validation on every keystroke and computed results.
 *
 * @example
 * ```tsx
 * const { values, errors, result, setValue, isValid } = useCalculatorForm({
 *   fields: {
 *     weightInAir: {
 *       validate: (v) => validateNumber(v, { positive: true, label: 'Weight in air' }),
 *       parse: parseFloat,
 *     },
 *     weightInWater: {
 *       validate: (v) => validateNumber(v, { label: 'Weight in water' }),
 *       parse: parseFloat,
 *     },
 *   },
 *   crossValidate: ({ weightInAir, weightInWater }) => {
 *     const air = parseFloat(weightInAir);
 *     const water = parseFloat(weightInWater);
 *     if (!isNaN(air) && !isNaN(water) && water >= air) {
 *       return { weightInWater: 'Must be less than weight in air' };
 *     }
 *     return {};
 *   },
 *   compute: ({ weightInAir, weightInWater }) => calculateSG(weightInAir, weightInWater),
 * });
 * ```
 */

import { useState, useMemo, useCallback } from 'react';

type ValidatorFn = (value: string) => string | null;
type ParserFn<T> = (value: string) => T;

interface FieldConfig<T = unknown> {
  /** Validation function returning error message or null */
  validate?: ValidatorFn;
  /** Parser function to convert string to typed value */
  parse?: ParserFn<T>;
  /** Initial value (defaults to empty string) */
  initialValue?: string;
  /** Whether field is required for computation (default: true) */
  required?: boolean;
}

interface UseCalculatorFormOptions<
  TFields extends Record<string, FieldConfig>,
  TResult
> {
  /** Field configurations */
  fields: TFields;
  /** Cross-field validation (runs after individual field validation) */
  crossValidate?: (values: Record<keyof TFields, string>) => Partial<Record<keyof TFields, string>>;
  /** Compute result from parsed values (only runs when all required fields are valid) */
  compute?: (parsedValues: {
    [K in keyof TFields]: TFields[K] extends FieldConfig<infer T> ? T : unknown;
  }) => TResult | null;
}

interface UseCalculatorFormReturn<
  TFields extends Record<string, FieldConfig>,
  TResult
> {
  /** Current string values for all fields */
  values: Record<keyof TFields, string>;
  /** Current error messages for all fields (null if valid) */
  errors: Record<keyof TFields, string | null>;
  /** Computed result (null if inputs invalid) */
  result: TResult | null;
  /** Set a field's value */
  setValue: (field: keyof TFields, value: string) => void;
  /** Set multiple field values at once */
  setValues: (values: Partial<Record<keyof TFields, string>>) => void;
  /** Reset all fields to initial values */
  reset: () => void;
  /** Whether all required fields are valid */
  isValid: boolean;
  /** Parsed values for each field (or undefined if invalid) */
  parsedValues: {
    [K in keyof TFields]: TFields[K] extends FieldConfig<infer T> ? T | undefined : unknown;
  };
}

export function useCalculatorForm<
  TFields extends Record<string, FieldConfig>,
  TResult = unknown
>(
  options: UseCalculatorFormOptions<TFields, TResult>
): UseCalculatorFormReturn<TFields, TResult> {
  const { fields, crossValidate, compute } = options;

  // Initialize values from field configs
  const initialValues = useMemo(() => {
    const values: Record<string, string> = {};
    for (const [key, config] of Object.entries(fields)) {
      values[key] = config.initialValue ?? '';
    }
    return values as Record<keyof TFields, string>;
  }, [fields]);

  const [values, setValuesState] = useState(initialValues);

  // Compute field-level errors (eager validation)
  const fieldErrors = useMemo(() => {
    const errors: Record<string, string | null> = {};
    for (const [key, config] of Object.entries(fields)) {
      const value = values[key as keyof TFields];
      // Only validate non-empty values for optional fields
      const isRequired = config.required !== false;
      if (value || isRequired) {
        errors[key] = config.validate?.(value) ?? null;
      } else {
        errors[key] = null;
      }
    }
    return errors as Record<keyof TFields, string | null>;
  }, [fields, values]);

  // Compute cross-field errors
  const crossErrors = useMemo(() => {
    if (!crossValidate) return {} as Partial<Record<keyof TFields, string>>;
    // Only run cross-validation if all fields pass individual validation
    const hasFieldErrors = Object.values(fieldErrors).some(e => e !== null);
    if (hasFieldErrors) return {} as Partial<Record<keyof TFields, string>>;
    return crossValidate(values);
  }, [crossValidate, fieldErrors, values]);

  // Merge all errors
  const errors = useMemo(() => {
    const merged: Record<string, string | null> = { ...fieldErrors };
    for (const [key, error] of Object.entries(crossErrors)) {
      if (error) {
        merged[key] = error;
      }
    }
    return merged as Record<keyof TFields, string | null>;
  }, [fieldErrors, crossErrors]);

  // Check if all required fields are valid
  const isValid = useMemo(() => {
    for (const [key, config] of Object.entries(fields)) {
      const isRequired = config.required !== false;
      const value = values[key as keyof TFields];
      const error = errors[key as keyof TFields];

      if (isRequired && (!value || error)) {
        return false;
      }
      if (value && error) {
        return false;
      }
    }
    return true;
  }, [fields, values, errors]);

  // Parse values
  const parsedValues = useMemo(() => {
    const parsed: Record<string, unknown> = {};
    for (const [key, config] of Object.entries(fields)) {
      const value = values[key as keyof TFields];
      if (value && !errors[key as keyof TFields] && config.parse) {
        parsed[key] = config.parse(value);
      } else {
        parsed[key] = undefined;
      }
    }
    return parsed as {
      [K in keyof TFields]: TFields[K] extends FieldConfig<infer T> ? T | undefined : unknown;
    };
  }, [fields, values, errors]);

  // Compute result
  const result = useMemo(() => {
    if (!compute || !isValid) return null;
    try {
      return compute(parsedValues as {
        [K in keyof TFields]: TFields[K] extends FieldConfig<infer T> ? T : unknown;
      });
    } catch {
      return null;
    }
  }, [compute, isValid, parsedValues]);

  // Set a single field value
  const setValue = useCallback((field: keyof TFields, value: string) => {
    setValuesState(prev => ({ ...prev, [field]: value }));
  }, []);

  // Set multiple field values
  const setValues = useCallback((newValues: Partial<Record<keyof TFields, string>>) => {
    setValuesState(prev => ({ ...prev, ...newValues }));
  }, []);

  // Reset to initial values
  const reset = useCallback(() => {
    setValuesState(initialValues);
  }, [initialValues]);

  return {
    values,
    errors,
    result,
    setValue,
    setValues,
    reset,
    isValid,
    parsedValues,
  };
}
