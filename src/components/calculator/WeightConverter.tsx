/**
 * Weight Converter component.
 * Converts between carat, gram, and milligram using bidirectional sync.
 */

import { useBidirectionalConversion } from '../../hooks/useBidirectionalConversion';
import { FormField, NumberInput } from '../form';
import { FieldError } from '../form/FieldError';
import {
  caratToGram,
  gramToCarat,
  caratToMilligram,
  milligramToCarat,
} from '../../lib/calculator/conversions';

type WeightUnit = 'carat' | 'gram' | 'milligram';

const UNITS = [
  { key: 'carat' as const, decimals: 4 },
  { key: 'gram' as const, decimals: 4 },
  { key: 'milligram' as const, decimals: 2 },
] as const;

function convert(value: number, from: WeightUnit, to: WeightUnit): number {
  if (from === to) return value;

  // Convert to carats first (base unit)
  let inCarats = value;
  if (from === 'gram') {
    inCarats = gramToCarat(value);
  } else if (from === 'milligram') {
    inCarats = milligramToCarat(value);
  }

  // Convert from carats to target unit
  if (to === 'carat') return inCarats;
  if (to === 'gram') return caratToGram(inCarats);
  return caratToMilligram(inCarats);
}

export function WeightConverter() {
  const { values, error, lastEdited, setValue } = useBidirectionalConversion({
    units: UNITS,
    convert,
    validate: (value) => value < 0 ? 'Weight cannot be negative' : null,
  });

  return (
    <div className="space-y-6">
      <div className="text-sm text-slate-600">
        <p>Enter a value in any field to convert between weight units.</p>
        <p className="mt-2 text-xs text-slate-500">
          1 carat = 0.2 grams = 200 milligrams
        </p>
      </div>

      {/* Shared error message */}
      {error && <FieldError message={error} />}

      <div className="space-y-4">
        <FormField
          name="weight-carat"
          label="Carats"
          unit="ct"
          error={lastEdited === 'carat' ? error : null}
        >
          <NumberInput
            value={values.carat}
            onChange={(v) => setValue('carat', v)}
            min={0}
            step={0.01}
            placeholder="e.g., 1.00"
            size="lg"
          />
        </FormField>

        <FormField
          name="weight-gram"
          label="Grams"
          unit="g"
          error={lastEdited === 'gram' ? error : null}
        >
          <NumberInput
            value={values.gram}
            onChange={(v) => setValue('gram', v)}
            min={0}
            step={0.0001}
            placeholder="e.g., 0.20"
            size="lg"
          />
        </FormField>

        <FormField
          name="weight-mg"
          label="Milligrams"
          unit="mg"
          error={lastEdited === 'milligram' ? error : null}
        >
          <NumberInput
            value={values.milligram}
            onChange={(v) => setValue('milligram', v)}
            min={0}
            step={1}
            placeholder="e.g., 200"
            size="lg"
          />
        </FormField>
      </div>

      <div className="text-xs text-slate-500 space-y-1">
        <p><strong>Common weights:</strong></p>
        <p>• 1 carat engagement diamond ≈ 0.2g</p>
        <p>• 5 carat sapphire ≈ 1.0g</p>
        <p>• Melee diamonds are typically 0.01-0.20 ct (2-40 mg)</p>
      </div>
    </div>
  );
}
