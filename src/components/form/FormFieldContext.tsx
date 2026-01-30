/**
 * Context provider for form field components.
 * Enables automatic ID generation and accessibility attribute linking.
 */

import { createContext, useContext, useId, useMemo, type ReactNode } from 'react';

interface FormFieldContextValue {
  /** Base ID for the field (used for input id) */
  id: string;
  /** ID for the error element (for aria-describedby) */
  errorId: string;
  /** ID for the hint element (for aria-describedby) */
  hintId: string;
  /** Field name */
  name: string;
  /** Whether the field has an error */
  hasError: boolean;
  /** Whether the field is required */
  required: boolean;
  /** Whether the field is disabled */
  disabled: boolean;
}

const FormFieldContext = createContext<FormFieldContextValue | null>(null);

interface FormFieldProviderProps {
  name: string;
  hasError: boolean;
  required?: boolean;
  disabled?: boolean;
  children: ReactNode;
}

export function FormFieldProvider({
  name,
  hasError,
  required = false,
  disabled = false,
  children,
}: FormFieldProviderProps) {
  const generatedId = useId();

  const value = useMemo<FormFieldContextValue>(() => ({
    id: `field-${name}-${generatedId}`,
    errorId: `field-${name}-error-${generatedId}`,
    hintId: `field-${name}-hint-${generatedId}`,
    name,
    hasError,
    required,
    disabled,
  }), [name, generatedId, hasError, required, disabled]);

  return (
    <FormFieldContext.Provider value={value}>
      {children}
    </FormFieldContext.Provider>
  );
}

/**
 * Hook to access form field context.
 * Must be used within a FormField component.
 */
export function useFormField(): FormFieldContextValue {
  const context = useContext(FormFieldContext);
  if (!context) {
    throw new Error('useFormField must be used within a FormField component');
  }
  return context;
}

/**
 * Hook to optionally access form field context.
 * Returns null if not within a FormField component.
 */
export function useFormFieldOptional(): FormFieldContextValue | null {
  return useContext(FormFieldContext);
}
