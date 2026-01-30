/**
 * Specific Gravity Calculator component.
 * Uses hydrostatic weighing method: SG = Weight in air / (Weight in air - Weight in water)
 * Matches against minerals in the database with fallback to hardcoded reference data.
 */

import { useEffect } from 'react';
import { useCalculatorForm } from '../../hooks/useCalculatorForm';
import { useGemLookup, formatSG } from '../../hooks/useGemLookup';
import { calculateSG } from '../../lib/calculator/conversions';
import { validateNumber } from './ValidationMessage';
import { FormField, NumberInput } from '../form';
import { NumberResult, GemMatchBadges } from './results';

export function SGCalculator() {
  const { values, errors, result, setValue } = useCalculatorForm({
    fields: {
      weightInAir: {
        validate: (v) => validateNumber(v, { positive: true, label: 'Weight in air' }),
        parse: parseFloat,
      },
      weightInWater: {
        validate: (v) => validateNumber(v, { label: 'Weight in water' }),
        parse: parseFloat,
      },
    },
    crossValidate: ({ weightInAir, weightInWater }) => {
      const air = parseFloat(weightInAir);
      const water = parseFloat(weightInWater);
      if (!isNaN(air) && !isNaN(water) && water >= air) {
        return { weightInWater: 'Weight in water must be less than weight in air' };
      }
      return {};
    },
    compute: ({ weightInAir, weightInWater }) => {
      if (weightInAir === undefined || weightInWater === undefined) return null;
      if (weightInAir <= 0 || weightInWater >= weightInAir) return null;
      return calculateSG(weightInAir, weightInWater);
    },
  });

  // Gem lookup with debouncing
  const { matches, lookup } = useGemLookup({
    type: 'sg',
    tolerance: 0.05,
  });

  // Trigger lookup when SG result changes
  useEffect(() => {
    lookup(result);
  }, [result, lookup]);

  return (
    <div className="space-y-6">
      <div className="text-sm text-slate-600">
        <p>Enter the weight of your stone in air and water to calculate its specific gravity.</p>
        <p className="mt-2 text-xs text-slate-500">
          Formula: SG = Weight in air ÷ (Weight in air − Weight in water)
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          name="weight-air"
          label="Weight in Air"
          unit="g"
          error={errors.weightInAir}
        >
          <NumberInput
            value={values.weightInAir}
            onChange={(v) => setValue('weightInAir', v)}
            min={0}
            step={0.01}
            placeholder="e.g., 3.52"
          />
        </FormField>

        <FormField
          name="weight-water"
          label="Weight in Water"
          unit="g"
          error={errors.weightInWater}
        >
          <NumberInput
            value={values.weightInWater}
            onChange={(v) => setValue('weightInWater', v)}
            min={0}
            step={0.01}
            placeholder="e.g., 2.52"
          />
        </FormField>
      </div>

      {result !== null && (
        <NumberResult
          value={result}
          precision={2}
          label="Specific Gravity"
          copyable
        >
          <GemMatchBadges
            matches={matches.map(gem => ({
              name: gem.name,
              propertyValue: formatSG(gem.sg),
            }))}
            label="Possible Matches"
            emptyMessage="No common gemstones match this SG value within ±0.05 tolerance. The stone may be unusual, synthetic, or the measurement may need verification."
          />
        </NumberResult>
      )}

      <div className="text-xs text-slate-500 space-y-1">
        <p><strong>Example (Diamond):</strong> 3.52g in air, 2.52g in water = SG 3.52</p>
        <p><strong>Tip:</strong> Ensure the stone is fully submerged and free of air bubbles.</p>
      </div>
    </div>
  );
}
