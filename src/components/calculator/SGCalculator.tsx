/**
 * Specific Gravity Calculator component.
 * Uses hydrostatic weighing method: SG = Weight in air / (Weight in air - Weight in water)
 * Matches against minerals in the database with fallback to hardcoded reference data.
 */

import { useState, useMemo, useEffect } from 'react';
import { calculateSG, type GemReference } from '../../lib/calculator/conversions';
import { useCalculatorData } from '../../hooks/useCalculatorData';
import { cn } from '../ui/cn';
import { ValidationMessage, validateNumber } from './ValidationMessage';

export function SGCalculator() {
  const [weightInAir, setWeightInAir] = useState('');
  const [weightInWater, setWeightInWater] = useState('');
  const [touched, setTouched] = useState({ air: false, water: false });
  const [matchingGems, setMatchingGems] = useState<GemReference[]>([]);

  const { findBySG, dbAvailable } = useCalculatorData();

  // Validation
  const airError = touched.air
    ? validateNumber(weightInAir, { positive: true, label: 'Weight in air' })
    : null;
  const waterError = touched.water
    ? validateNumber(weightInWater, { label: 'Weight in water' })
    : null;

  // Check if water weight is greater than or equal to air weight
  const rangeError = useMemo(() => {
    const air = parseFloat(weightInAir);
    const water = parseFloat(weightInWater);
    if (!isNaN(air) && !isNaN(water) && water >= air && touched.water) {
      return 'Weight in water must be less than weight in air';
    }
    return null;
  }, [weightInAir, weightInWater, touched.water]);

  // Calculate SG
  const sg = useMemo(() => {
    const air = parseFloat(weightInAir);
    const water = parseFloat(weightInWater);

    if (isNaN(air) || isNaN(water) || air <= 0 || water >= air) {
      return null;
    }

    return calculateSG(air, water);
  }, [weightInAir, weightInWater]);

  // Fetch matching gems when SG changes
  useEffect(() => {
    if (sg === null) {
      setMatchingGems([]);
      return;
    }

    findBySG(sg).then(setMatchingGems);
  }, [sg, findBySG]);

  return (
    <div className="space-y-6">
      <div className="text-sm text-slate-600">
        <p>Enter the weight of your stone in air and water to calculate its specific gravity.</p>
        <p className="mt-2 text-xs text-slate-500">
          Formula: SG = Weight in air ÷ (Weight in air − Weight in water)
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="weight-air" className="block text-sm font-medium text-slate-700 mb-1">
            Weight in Air (g)
          </label>
          <input
            id="weight-air"
            type="number"
            step="0.01"
            min="0"
            value={weightInAir}
            onChange={(e) => setWeightInAir(e.target.value)}
            onBlur={() => setTouched(t => ({ ...t, air: true }))}
            placeholder="e.g., 3.52"
            aria-invalid={!!airError}
            aria-describedby={airError ? 'weight-air-error' : undefined}
            className={cn(
              'w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-crystal-500',
              airError ? 'border-red-300 focus:ring-red-500' : 'border-slate-300'
            )}
          />
          <ValidationMessage
            message={airError || ''}
            visible={!!airError}
          />
        </div>

        <div>
          <label htmlFor="weight-water" className="block text-sm font-medium text-slate-700 mb-1">
            Weight in Water (g)
          </label>
          <input
            id="weight-water"
            type="number"
            step="0.01"
            min="0"
            value={weightInWater}
            onChange={(e) => setWeightInWater(e.target.value)}
            onBlur={() => setTouched(t => ({ ...t, water: true }))}
            placeholder="e.g., 2.52"
            aria-invalid={!!(waterError || rangeError)}
            aria-describedby={waterError || rangeError ? 'weight-water-error' : undefined}
            className={cn(
              'w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-crystal-500',
              (waterError || rangeError) ? 'border-red-300 focus:ring-red-500' : 'border-slate-300'
            )}
          />
          <ValidationMessage
            message={rangeError || waterError || ''}
            visible={!!(waterError || rangeError)}
          />
        </div>
      </div>

      {sg !== null && (
        <div className="p-4 rounded-lg bg-crystal-50 border border-crystal-200">
          <div className="text-center mb-4">
            <p className="text-sm text-slate-500">
              Specific Gravity
              {dbAvailable && <span className="ml-1 text-xs text-green-600">(DB)</span>}
            </p>
            <p className="text-3xl font-bold text-crystal-700">{sg.toFixed(2)}</p>
          </div>

          {matchingGems.length > 0 && (
            <div className="border-t border-crystal-200 pt-4 mt-4">
              <p className="text-sm font-medium text-slate-700 mb-2">Possible Matches:</p>
              <div className="flex flex-wrap gap-2">
                {matchingGems.map(gem => (
                  <span
                    key={gem.name}
                    className="px-2 py-1 text-xs font-medium rounded-full bg-white text-slate-700 border border-slate-200"
                  >
                    {gem.name} ({Array.isArray(gem.sg) ? `${gem.sg[0]}-${gem.sg[1]}` : gem.sg})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="text-xs text-slate-500 space-y-1">
        <p><strong>Example (Diamond):</strong> 3.52g in air, 2.52g in water = SG 3.52</p>
        <p><strong>Tip:</strong> Ensure the stone is fully submerged and free of air bubbles.</p>
      </div>
    </div>
  );
}
