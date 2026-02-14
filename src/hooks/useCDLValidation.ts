import { useState, useEffect, useCallback, useRef } from 'react';
import { parseCDL } from '../lib/cdl-parser';

interface ValidationError {
  line: number;
  column: number;
  message: string;
}

interface CDLValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validate CDL code using the proper CDL parser.
 * Parses the entire string (supports multi-line definitions and references).
 */
function validateCDL(code: string): CDLValidationResult {
  const errors: ValidationError[] = [];
  const trimmed = code.trim();
  if (!trimmed) return { isValid: true, errors: [] };

  const result = parseCDL(trimmed);

  if (!result.valid && result.error) {
    errors.push({
      line: 1,
      column: 1,
      message: result.error,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

interface UseCDLValidationOptions {
  debounceMs?: number;
}

interface UseCDLValidationResult {
  validation: CDLValidationResult;
  validate: (code: string) => void;
}

export function useCDLValidation(
  options: UseCDLValidationOptions = {}
): UseCDLValidationResult {
  const { debounceMs = 300 } = options;
  const [validation, setValidation] = useState<CDLValidationResult>({
    isValid: true,
    errors: [],
  });
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const validate = useCallback(
    (code: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        const result = validateCDL(code);
        setValidation(result);
      }, debounceMs);
    },
    [debounceMs]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { validation, validate };
}
