/**
 * Composable form components with eager validation and accessibility.
 *
 * @example
 * ```tsx
 * import { FormField, NumberInput } from '@/components/form';
 *
 * <FormField name="weight-air" label="Weight in Air" unit="g" error={airError}>
 *   <NumberInput value={weightInAir} onChange={setWeightInAir} min={0} step={0.01} />
 * </FormField>
 * ```
 */

// Context
export { FormFieldProvider, useFormField, useFormFieldOptional } from './FormFieldContext';

// Components
export { FormField, FormFieldLabel, FormFieldHint } from './FormField';
export { Input, type InputProps } from './Input';
export { NumberInput, type NumberInputProps } from './NumberInput';
export { Select, type SelectProps, type SelectOption } from './Select';
export { FieldError } from './FieldError';
