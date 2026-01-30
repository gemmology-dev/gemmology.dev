/**
 * Hook for bidirectional N-way conversions.
 * Editing any field updates all other fields automatically.
 *
 * @example
 * ```tsx
 * const { values, error, setValue, lastEdited } = useBidirectionalConversion({
 *   units: [
 *     { key: 'carat', decimals: 4 },
 *     { key: 'gram', decimals: 4 },
 *     { key: 'milligram', decimals: 2 },
 *   ],
 *   convert: (value, from, to) => {
 *     const inCarats = from === 'carat' ? value
 *       : from === 'gram' ? gramToCarat(value)
 *       : milligramToCarat(value);
 *     return to === 'carat' ? inCarats
 *       : to === 'gram' ? caratToGram(inCarats)
 *       : caratToMilligram(inCarats);
 *   },
 *   validate: (value) => value < 0 ? 'Cannot be negative' : null,
 * });
 * ```
 */

import { useState, useCallback, useMemo } from 'react';

interface UnitConfig<K extends string = string> {
  /** Unique key for the unit */
  key: K;
  /** Number of decimal places for display */
  decimals: number;
  /** Minimum value allowed (defaults to 0) */
  min?: number;
  /** Maximum value allowed */
  max?: number;
}

interface UseBidirectionalConversionOptions<K extends string> {
  /** Unit configurations */
  units: readonly UnitConfig<K>[];
  /**
   * Conversion function.
   * Takes a numeric value, source unit key, and target unit key.
   * Returns the converted value.
   */
  convert: (value: number, from: K, to: K) => number;
  /**
   * Optional validation function.
   * Applied to the parsed numeric value before conversion.
   * Returns error message or null.
   */
  validate?: (value: number, unit: K) => string | null;
}

interface UseBidirectionalConversionReturn<K extends string> {
  /** Current string values for all units */
  values: Record<K, string>;
  /** Current error message (null if valid) */
  error: string | null;
  /** Which unit was last edited (null if none) */
  lastEdited: K | null;
  /** Set a unit's value (triggers conversion to all other units) */
  setValue: (unit: K, value: string) => void;
  /** Reset all values to empty */
  reset: () => void;
  /** Whether the current input is valid */
  isValid: boolean;
}

export function useBidirectionalConversion<K extends string>(
  options: UseBidirectionalConversionOptions<K>
): UseBidirectionalConversionReturn<K> {
  const { units, convert, validate } = options;

  // Initialize all values as empty strings
  const initialValues = useMemo(() => {
    const values: Record<string, string> = {};
    for (const unit of units) {
      values[unit.key] = '';
    }
    return values as Record<K, string>;
  }, [units]);

  const [values, setValues] = useState(initialValues);
  const [lastEdited, setLastEdited] = useState<K | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Find unit config by key
  const getUnitConfig = useCallback((key: K): UnitConfig<K> | undefined => {
    return units.find(u => u.key === key);
  }, [units]);

  // Set a value and convert to all other units
  const setValue = useCallback((unit: K, value: string) => {
    setLastEdited(unit);

    // Handle empty input
    if (!value || value.trim() === '') {
      setValues(initialValues);
      setError(null);
      return;
    }

    // Parse the input
    const num = parseFloat(value);
    if (isNaN(num)) {
      // Keep the typed value, set error, clear others
      setValues(prev => {
        const newValues = { ...initialValues, [unit]: value };
        return newValues as Record<K, string>;
      });
      setError('Please enter a valid number');
      return;
    }

    // Run validation
    if (validate) {
      const validationError = validate(num, unit);
      if (validationError) {
        setValues(prev => {
          const newValues = { ...initialValues, [unit]: value };
          return newValues as Record<K, string>;
        });
        setError(validationError);
        return;
      }
    }

    // Check unit-specific constraints
    const unitConfig = getUnitConfig(unit);
    if (unitConfig) {
      if (unitConfig.min !== undefined && num < unitConfig.min) {
        setValues(prev => {
          const newValues = { ...initialValues, [unit]: value };
          return newValues as Record<K, string>;
        });
        setError(`Value must be at least ${unitConfig.min}`);
        return;
      }
      if (unitConfig.max !== undefined && num > unitConfig.max) {
        setValues(prev => {
          const newValues = { ...initialValues, [unit]: value };
          return newValues as Record<K, string>;
        });
        setError(`Value must be at most ${unitConfig.max}`);
        return;
      }
    }

    // Clear error and convert to all units
    setError(null);

    const newValues: Record<string, string> = { [unit]: value };

    for (const targetUnit of units) {
      if (targetUnit.key === unit) continue;

      const converted = convert(num, unit, targetUnit.key);
      // Format with appropriate decimals, but trim trailing zeros
      const formatted = converted.toFixed(targetUnit.decimals);
      // Remove unnecessary trailing zeros but keep at least one decimal for small numbers
      newValues[targetUnit.key] = parseFloat(formatted).toString();
    }

    setValues(newValues as Record<K, string>);
  }, [units, convert, validate, initialValues, getUnitConfig]);

  // Reset all values
  const reset = useCallback(() => {
    setValues(initialValues);
    setLastEdited(null);
    setError(null);
  }, [initialValues]);

  // Check validity
  const isValid = useMemo(() => {
    if (error) return false;
    // Valid if any field has a value
    return Object.values(values).some(v => v !== '');
  }, [error, values]);

  return {
    values,
    error,
    lastEdited,
    setValue,
    reset,
    isValid,
  };
}
