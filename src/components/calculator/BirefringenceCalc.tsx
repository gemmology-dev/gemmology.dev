/**
 * Birefringence Calculator component.
 * Calculates birefringence from max and min RI values.
 */

import { useCalculatorForm } from '../../hooks/useCalculatorForm';
import { calculateBirefringence, classifyBirefringence } from '../../lib/calculator/conversions';
import { validateRI } from './ValidationMessage';
import { FormField, NumberInput } from '../form';
import { ClassifiedResult } from './results';

export function BirefringenceCalc() {
  const { values, errors, result, setValue } = useCalculatorForm({
    fields: {
      riMax: {
        validate: validateRI,
        parse: parseFloat,
      },
      riMin: {
        validate: validateRI,
        parse: parseFloat,
      },
    },
    crossValidate: ({ riMax, riMin }) => {
      const max = parseFloat(riMax);
      const min = parseFloat(riMin);
      if (!isNaN(max) && !isNaN(min) && max < min) {
        return { riMax: 'Maximum RI should be greater than minimum RI' };
      }
      return {};
    },
    compute: ({ riMax, riMin }) => {
      if (riMax === undefined || riMin === undefined) return null;
      if (riMax < riMin) return null;
      const birefringence = calculateBirefringence(riMax, riMin);
      const classification = classifyBirefringence(birefringence);
      return { birefringence, classification };
    },
  });

  return (
    <div className="space-y-6">
      <div className="text-sm text-slate-600">
        <p>Enter the maximum and minimum refractive index values to calculate birefringence.</p>
        <p className="mt-2 text-xs text-slate-500">
          Formula: Birefringence = RI(max) − RI(min)
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          name="ri-max"
          label="RI Maximum"
          error={errors.riMax}
        >
          <NumberInput
            value={values.riMax}
            onChange={(v) => setValue('riMax', v)}
            min={1}
            max={3}
            step={0.001}
            placeholder="e.g., 1.553"
          />
        </FormField>

        <FormField
          name="ri-min"
          label="RI Minimum"
          error={errors.riMin}
        >
          <NumberInput
            value={values.riMin}
            onChange={(v) => setValue('riMin', v)}
            min={1}
            max={3}
            step={0.001}
            placeholder="e.g., 1.544"
          />
        </FormField>
      </div>

      {result && (
        <ClassifiedResult
          value={result.birefringence}
          precision={3}
          label="Birefringence"
          classification={result.classification}
        />
      )}

      <div className="text-xs text-slate-500 space-y-1">
        <p><strong>Example (Quartz):</strong> 1.553 − 1.544 = 0.009 (Low)</p>
        <p><strong>Example (Zircon):</strong> 1.984 − 1.925 = 0.059 (Very High)</p>
        <p><strong>Note:</strong> Isotropic gems (cubic system) have no birefringence.</p>
      </div>
    </div>
  );
}
