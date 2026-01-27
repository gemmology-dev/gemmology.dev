/**
 * Specific Gravity Calculator component.
 * Uses hydrostatic weighing method: SG = Weight in air / (Weight in air - Weight in water)
 */

import { useState, useMemo } from 'react';
import { calculateSG, findGemsBySG } from '../../lib/calculator/conversions';
import { cn } from '../ui/cn';

export function SGCalculator() {
  const [weightInAir, setWeightInAir] = useState('');
  const [weightInWater, setWeightInWater] = useState('');

  const result = useMemo(() => {
    const air = parseFloat(weightInAir);
    const water = parseFloat(weightInWater);

    if (isNaN(air) || isNaN(water) || air <= 0) {
      return null;
    }

    const sg = calculateSG(air, water);
    const matchingGems = findGemsBySG(sg);

    return { sg, matchingGems };
  }, [weightInAir, weightInWater]);

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
            placeholder="e.g., 3.52"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-crystal-500"
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
            placeholder="e.g., 2.52"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-crystal-500"
          />
        </div>
      </div>

      {result && (
        <div className="p-4 rounded-lg bg-crystal-50 border border-crystal-200">
          <div className="text-center mb-4">
            <p className="text-sm text-slate-500">Specific Gravity</p>
            <p className="text-3xl font-bold text-crystal-700">{result.sg.toFixed(2)}</p>
          </div>

          {result.matchingGems.length > 0 && (
            <div className="border-t border-crystal-200 pt-4 mt-4">
              <p className="text-sm font-medium text-slate-700 mb-2">Possible Matches:</p>
              <div className="flex flex-wrap gap-2">
                {result.matchingGems.map(gem => (
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
