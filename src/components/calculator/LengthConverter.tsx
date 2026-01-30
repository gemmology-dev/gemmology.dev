/**
 * Length Converter component.
 * Converts between millimeters and inches using bidirectional sync.
 */

import { useBidirectionalConversion } from '../../hooks/useBidirectionalConversion';
import { FormField, NumberInput } from '../form';
import { FieldError } from '../form/FieldError';
import { mmToInch, inchToMm } from '../../lib/calculator/conversions';

type LengthUnit = 'mm' | 'inches';

const UNITS = [
  { key: 'mm' as const, decimals: 2 },
  { key: 'inches' as const, decimals: 4 },
] as const;

function convert(value: number, from: LengthUnit, to: LengthUnit): number {
  if (from === to) return value;
  if (from === 'mm') return mmToInch(value);
  return inchToMm(value);
}

export function LengthConverter() {
  const { values, error, lastEdited, setValue } = useBidirectionalConversion({
    units: UNITS,
    convert,
    validate: (value) => value < 0 ? 'Length cannot be negative' : null,
  });

  return (
    <div className="space-y-6">
      <div className="text-sm text-slate-600">
        <p>Enter a value in either field to convert between length units.</p>
        <p className="mt-2 text-xs text-slate-500">
          1 inch = 25.4 mm
        </p>
      </div>

      {/* Shared error message */}
      {error && <FieldError message={error} />}

      <div className="grid grid-cols-2 gap-4">
        <FormField
          name="length-mm"
          label="Millimeters"
          unit="mm"
          error={lastEdited === 'mm' ? error : null}
        >
          <NumberInput
            value={values.mm}
            onChange={(v) => setValue('mm', v)}
            min={0}
            step={0.01}
            placeholder="e.g., 6.5"
            size="lg"
          />
        </FormField>

        <FormField
          name="length-inch"
          label="Inches"
          unit="in"
          error={lastEdited === 'inches' ? error : null}
        >
          <NumberInput
            value={values.inches}
            onChange={(v) => setValue('inches', v)}
            min={0}
            step={0.0001}
            placeholder="e.g., 0.25"
            size="lg"
          />
        </FormField>
      </div>

      <div className="text-xs text-slate-500 space-y-1">
        <p><strong>Common stone sizes:</strong></p>
        <p>• 6.5mm round ≈ 1 carat diamond</p>
        <p>• 7mm round ≈ 1.25 carat diamond</p>
        <p>• 8mm round ≈ 2 carat diamond</p>
        <p>• Ring sizes typically 16-20mm diameter</p>
      </div>
    </div>
  );
}
