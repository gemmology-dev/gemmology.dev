import { useState, useEffect, useCallback, useRef } from 'react';

interface ValidationError {
  line: number;
  column: number;
  message: string;
}

interface CDLValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// CDL validation patterns
const SYSTEM_PATTERN = /^(cubic|hexagonal|trigonal|tetragonal|orthorhombic|monoclinic|triclinic)/i;
const POINT_GROUP_PATTERN = /\[([^\]]+)\]/;
const FORM_PATTERN = /\{(-?\d+(?:,-?\d+){2,3})\}/g;
const DISTANCE_PATTERN = /@(\d+(?:\.\d+)?)/;

function validateCDL(code: string): CDLValidationResult {
  const errors: ValidationError[] = [];
  const lines = code.split('\n');

  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return; // Skip empty lines and comments

    // Check for valid crystal system
    if (!SYSTEM_PATTERN.test(trimmed)) {
      const systemMatch = trimmed.match(/^(\w+)/);
      if (systemMatch) {
        errors.push({
          line: lineIndex + 1,
          column: 1,
          message: `Unknown crystal system: "${systemMatch[1]}". Valid systems: cubic, hexagonal, trigonal, tetragonal, orthorhombic, monoclinic, triclinic`,
        });
      }
    }

    // Check for point group
    const pointGroupMatch = trimmed.match(POINT_GROUP_PATTERN);
    if (!pointGroupMatch) {
      errors.push({
        line: lineIndex + 1,
        column: trimmed.indexOf('[') > -1 ? trimmed.indexOf('[') + 1 : 1,
        message: 'Missing or invalid point group. Format: [point_group]',
      });
    }

    // Check for colon after point group
    if (!trimmed.includes(':')) {
      errors.push({
        line: lineIndex + 1,
        column: trimmed.length,
        message: 'Missing colon after point group. Format: system[group]:{forms}',
      });
    }

    // Check for at least one form
    const forms = trimmed.match(FORM_PATTERN);
    if (!forms || forms.length === 0) {
      errors.push({
        line: lineIndex + 1,
        column: trimmed.indexOf(':') > -1 ? trimmed.indexOf(':') + 2 : 1,
        message: 'Missing crystal form. Format: {hkl} or {hkil} for hexagonal',
      });
    }

    // Validate form indices
    forms?.forEach((form) => {
      const indices = form.slice(1, -1).split(',').map(Number);
      if (indices.some(isNaN)) {
        errors.push({
          line: lineIndex + 1,
          column: trimmed.indexOf(form) + 1,
          message: `Invalid Miller indices in ${form}. Must be integers.`,
        });
      }
    });
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
