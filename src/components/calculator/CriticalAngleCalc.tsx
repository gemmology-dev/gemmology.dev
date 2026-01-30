/**
 * Critical Angle Calculator component.
 * Calculates the critical angle for total internal reflection from RI.
 */

import { useCalculatorForm } from '../../hooks/useCalculatorForm';
import { calculateCriticalAngle, getCriticalAngleSignificance } from '../../lib/calculator/conversions';
import { validateRI } from './ValidationMessage';
import { FormField, NumberInput } from '../form';
import { ClassifiedResult } from './results';

export function CriticalAngleCalc() {
  const { values, errors, result, setValue } = useCalculatorForm({
    fields: {
      ri: {
        validate: validateRI,
        parse: parseFloat,
      },
    },
    compute: ({ ri }) => {
      if (ri === undefined || ri < 1) return null;
      const criticalAngle = calculateCriticalAngle(ri);
      const significance = getCriticalAngleSignificance(criticalAngle);
      return { criticalAngle, significance };
    },
  });

  return (
    <div className="space-y-6">
      <div className="text-sm text-slate-600">
        <p>Enter the refractive index to calculate the critical angle for total internal reflection.</p>
        <p className="mt-2 text-xs text-slate-500">
          Formula: θc = arcsin(1 ÷ RI)
        </p>
      </div>

      <FormField
        name="ri-input"
        label="Refractive Index"
        error={errors.ri}
      >
        <NumberInput
          value={values.ri}
          onChange={(v) => setValue('ri', v)}
          min={1}
          max={4}
          step={0.001}
          placeholder="e.g., 2.417"
        />
      </FormField>

      {/* Hint when no result and no error but has input */}
      {!result && !errors.ri && values.ri && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
          Enter a valid RI value (≥ 1.0) to calculate the critical angle.
        </div>
      )}

      {result && (
        <ClassifiedResult
          value={result.criticalAngle}
          precision={1}
          unit="°"
          label="Critical Angle"
          classification={result.significance}
          classificationLevel={
            result.criticalAngle < 25 ? 'very-high' :
            result.criticalAngle < 35 ? 'high' :
            result.criticalAngle < 45 ? 'medium' : 'low'
          }
        />
      )}

      <div className="bg-slate-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-slate-700 mb-2">Why This Matters</h4>
        <p className="text-xs text-slate-600">
          Light entering a gem at angles greater than the critical angle will be totally internally
          reflected back into the stone. A smaller critical angle means more light is reflected,
          creating more brilliance. This is why diamond (θc = 24.4°) appears more brilliant than
          quartz (θc = 40.5°).
        </p>
      </div>

      <div className="text-xs text-slate-500 space-y-1">
        <p><strong>Diamond (RI 2.417):</strong> θc = 24.4° — Excellent light return</p>
        <p><strong>Corundum (RI 1.77):</strong> θc = 34.4° — Good light return</p>
        <p><strong>Quartz (RI 1.55):</strong> θc = 40.2° — Moderate light return</p>
      </div>
    </div>
  );
}
