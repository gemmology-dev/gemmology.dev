/**
 * Critical Angle Calculator component.
 * Calculates the critical angle for total internal reflection from RI.
 */

import { useState, useMemo } from 'react';
import { calculateCriticalAngle, getCriticalAngleSignificance } from '../../lib/calculator/conversions';
import { ValidationMessage, validateRI } from './ValidationMessage';

export function CriticalAngleCalc() {
  const [ri, setRi] = useState('');
  const [touched, setTouched] = useState(false);

  // Validation
  const error = touched ? validateRI(ri) : null;

  const result = useMemo(() => {
    const riValue = parseFloat(ri);

    if (isNaN(riValue) || riValue < 1) {
      return null;
    }

    const criticalAngle = calculateCriticalAngle(riValue);
    const significance = getCriticalAngleSignificance(criticalAngle);

    return { criticalAngle, significance };
  }, [ri]);

  return (
    <div className="space-y-6">
      <div className="text-sm text-slate-600">
        <p>Enter the refractive index to calculate the critical angle for total internal reflection.</p>
        <p className="mt-2 text-xs text-slate-500">
          Formula: θc = arcsin(1 ÷ RI)
        </p>
      </div>

      <div>
        <label htmlFor="ri-input" className="block text-sm font-medium text-slate-700 mb-1">
          Refractive Index
        </label>
        <input
          id="ri-input"
          type="number"
          step="0.001"
          min="1"
          max="4"
          value={ri}
          onChange={(e) => setRi(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="e.g., 2.417"
          aria-invalid={!!error}
          aria-describedby={error ? 'ri-input-error' : undefined}
          className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-crystal-500 ${error ? 'border-red-300' : 'border-slate-300'}`}
        />
        <ValidationMessage message={error || ''} visible={!!error} />
      </div>

      {/* Hint when no result and no error */}
      {!result && !error && ri && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
          Enter a valid RI value (≥ 1.0) to calculate the critical angle.
        </div>
      )}

      {result && (
        <div className="p-4 rounded-lg bg-crystal-50 border border-crystal-200">
          <div className="text-center mb-3">
            <p className="text-sm text-slate-500">Critical Angle</p>
            <p className="text-3xl font-bold text-crystal-700">{result.criticalAngle.toFixed(1)}°</p>
          </div>
          <p className="text-center text-sm text-slate-600">
            {result.significance}
          </p>
        </div>
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
