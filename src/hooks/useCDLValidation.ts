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
 * Validate CDL code using the proper CDL parser
 */
function validateCDL(code: string): CDLValidationResult {
  const lines = code.split('\n');
  const errors: ValidationError[] = [];

  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return; // Skip empty lines and comments

    const result = parseCDL(trimmed);

    if (!result.valid && result.error) {
      errors.push({
        line: lineIndex + 1,
        column: 1,
        message: result.error,
      });
    }
  });

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
