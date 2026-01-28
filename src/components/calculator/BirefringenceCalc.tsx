/**
 * Birefringence Calculator component.
 * Calculates birefringence from max and min RI values.
 */

import { useState, useMemo } from 'react';
import { calculateBirefringence, classifyBirefringence } from '../../lib/calculator/conversions';
import { cn } from '../ui/cn';
import { ValidationMessage, validateRI, validateRIRange } from './ValidationMessage';

export function BirefringenceCalc() {
  const [riMax, setRiMax] = useState('');
  const [riMin, setRiMin] = useState('');
  const [touched, setTouched] = useState({ max: false, min: false });

  // Validation
  const maxError = touched.max ? validateRI(riMax) : null;
  const minError = touched.min ? validateRI(riMin) : null;
  const rangeError = touched.max && touched.min ? validateRIRange(riMax, riMin) : null;

  const result = useMemo(() => {
    const max = parseFloat(riMax);
    const min = parseFloat(riMin);

    if (isNaN(max) || isNaN(min) || max < min) {
      return null;
    }

    const birefringence = calculateBirefringence(max, min);
    const classification = classifyBirefringence(birefringence);

    return { birefringence, classification };
  }, [riMax, riMin]);

  return (
    <div className="space-y-6">
      <div className="text-sm text-slate-600">
        <p>Enter the maximum and minimum refractive index values to calculate birefringence.</p>
        <p className="mt-2 text-xs text-slate-500">
          Formula: Birefringence = RI(max) − RI(min)
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="ri-max" className="block text-sm font-medium text-slate-700 mb-1">
            RI Maximum
          </label>
          <input
            id="ri-max"
            type="number"
            step="0.001"
            min="1"
            max="3"
            value={riMax}
            onChange={(e) => setRiMax(e.target.value)}
            onBlur={() => setTouched(t => ({ ...t, max: true }))}
            placeholder="e.g., 1.553"
            aria-invalid={!!(maxError || rangeError)}
            aria-describedby={maxError || rangeError ? 'ri-max-error' : undefined}
            className={cn(
              'w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-crystal-500',
              (maxError || rangeError) ? 'border-red-300 focus:ring-red-500' : 'border-slate-300'
            )}
          />
          <ValidationMessage
            message={rangeError || maxError || ''}
            visible={!!(maxError || rangeError)}
          />
        </div>

        <div>
          <label htmlFor="ri-min" className="block text-sm font-medium text-slate-700 mb-1">
            RI Minimum
          </label>
          <input
            id="ri-min"
            type="number"
            step="0.001"
            min="1"
            max="3"
            value={riMin}
            onChange={(e) => setRiMin(e.target.value)}
            onBlur={() => setTouched(t => ({ ...t, min: true }))}
            placeholder="e.g., 1.544"
            aria-invalid={!!minError}
            aria-describedby={minError ? 'ri-min-error' : undefined}
            className={cn(
              'w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-crystal-500',
              minError ? 'border-red-300 focus:ring-red-500' : 'border-slate-300'
            )}
          />
          <ValidationMessage
            message={minError || ''}
            visible={!!minError}
          />
        </div>
      </div>

      {result && (
        <div className="p-4 rounded-lg bg-crystal-50 border border-crystal-200">
          <div className="text-center mb-2">
            <p className="text-sm text-slate-500">Birefringence</p>
            <p className="text-3xl font-bold text-crystal-700">{result.birefringence.toFixed(3)}</p>
          </div>
          <p className="text-center text-sm text-slate-600">
            Classification: <span className="font-medium">{result.classification}</span>
          </p>
        </div>
      )}

      <div className="text-xs text-slate-500 space-y-1">
        <p><strong>Example (Quartz):</strong> 1.553 − 1.544 = 0.009 (Low)</p>
        <p><strong>Example (Zircon):</strong> 1.984 − 1.925 = 0.059 (Very High)</p>
        <p><strong>Note:</strong> Isotropic gems (cubic system) have no birefringence.</p>
      </div>
    </div>
  );
}
