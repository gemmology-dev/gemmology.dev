/**
 * Specific Gravity Calculator component.
 *
 * Hydrostatic weighing:   SG = W_air / ((W_air − W_water) / ρ_water(T))
 * The water-temperature correction adjusts for the small density change
 * of water with temperature, which matters for high-precision SG below ~3.0.
 */

import { useEffect, useMemo, useState } from 'react';
import { useCalculatorForm } from '../../hooks/useCalculatorForm';
import { useGemLookup, formatSG } from '../../hooks/useGemLookup';
import { validateNumber } from './ValidationMessage';
import { FormField, NumberInput, Select } from '../form';
import { NumberResult, GemMatchBadges } from './results';

/**
 * Density of pure water (g/cm³) at 1 atm, NIST table.
 * Linear interpolation between samples is more than accurate enough for
 * gem-room work.
 */
const WATER_DENSITY_TABLE: { tempC: number; density: number }[] = [
  { tempC: 4, density: 1.00000 },
  { tempC: 15, density: 0.99913 },
  { tempC: 20, density: 0.99821 },
  { tempC: 25, density: 0.99704 },
  { tempC: 30, density: 0.99565 },
];

const TEMP_OPTIONS = [
  { value: '20', label: '20 °C (room temperature, default)' },
  { value: '4', label: '4 °C (max density, ideal but cold)' },
  { value: '15', label: '15 °C (cool tap water)' },
  { value: '25', label: '25 °C (warm room)' },
  { value: '30', label: '30 °C (warm)' },
];

function waterDensityAt(tempC: number): number {
  const table = WATER_DENSITY_TABLE;
  if (tempC <= table[0].tempC) return table[0].density;
  if (tempC >= table[table.length - 1].tempC) return table[table.length - 1].density;
  for (let i = 1; i < table.length; i++) {
    const lo = table[i - 1];
    const hi = table[i];
    if (tempC <= hi.tempC) {
      const t = (tempC - lo.tempC) / (hi.tempC - lo.tempC);
      return lo.density + t * (hi.density - lo.density);
    }
  }
  return 1.0;
}

/**
 * Pure SG formula with water-density correction.
 * SG = W_air / ((W_air − W_water) / ρ_water(T))
 */
export function calculateSGCorrected(
  weightInAir: number,
  weightInWater: number,
  waterDensity: number,
): number {
  if (weightInAir <= 0) return 0;
  const denom = (weightInAir - weightInWater) / waterDensity;
  if (denom <= 0) return 0;
  return weightInAir / denom;
}

export function SGCalculator() {
  const [tempC, setTempC] = useState('20');
  const waterDensity = useMemo(() => waterDensityAt(parseFloat(tempC) || 20), [tempC]);

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
      return calculateSGCorrected(weightInAir, weightInWater, waterDensity);
    },
  });

  // Gem lookup with debouncing
  const { matches, lookup, initiate } = useGemLookup({
    type: 'sg',
    tolerance: 0.05,
  });

  // Trigger lookup when SG result changes
  useEffect(() => {
    lookup(result);
  }, [result, lookup]);

  return (
    <div className="space-y-6" onPointerDown={initiate}>
      <div className="text-sm text-slate-600 dark:text-cream-secondary">
        <p>Enter the weight of your stone in air and water to calculate its specific gravity.</p>
        <p className="mt-2 text-sm text-slate-600 dark:text-cream-secondary">
          Formula: SG = W<sub>air</sub> ÷ ((W<sub>air</sub> − W<sub>water</sub>) ÷ ρ<sub>water</sub>(T))
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        <FormField name="water-temp" label="Water temperature">
          <Select options={TEMP_OPTIONS} value={tempC} onChange={setTempC} />
        </FormField>
      </div>

      <div className="text-xs text-slate-500 dark:text-cream-muted">
        ρ<sub>water</sub> at {tempC} °C = <span className="font-mono">{waterDensity.toFixed(5)} g/cm³</span>
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
              origin: gem.origin,
            }))}
            label="Possible Matches"
            emptyMessage="No common gemstones match this SG value within ±0.05 tolerance. The stone may be unusual, synthetic, or the measurement may need verification."
          />
        </NumberResult>
      )}

      <div className="text-sm text-slate-600 dark:text-cream-secondary space-y-1">
        <p><strong>Example (Diamond):</strong> 3.52g in air, 2.52g in water at 20 °C = SG 3.52</p>
        <p><strong>Tip:</strong> Ensure the stone is fully submerged and free of air bubbles. Temperature correction matters most for low-SG materials (opal, amber, beryl).</p>
      </div>
    </div>
  );
}
