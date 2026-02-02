/**
 * Refractometer Reading Simulator
 * Interactive teaching tool for learning to read shadow edges
 */

import { useState, useMemo } from 'react';
import { useCalculatorData } from '../../hooks/useCalculatorData';

// Fallback data if database is unavailable
const FALLBACK_GEMS = [
  { name: 'Spinel', ri_low: 1.718, ri_high: 1.718, isotropic: true },
  { name: 'Garnet (Pyrope)', ri_low: 1.740, ri_high: 1.740, isotropic: true },
  { name: 'Ruby', ri_low: 1.762, ri_high: 1.770, isotropic: false },
  { name: 'Sapphire', ri_low: 1.762, ri_high: 1.770, isotropic: false },
  { name: 'Emerald', ri_low: 1.570, ri_high: 1.590, isotropic: false },
  { name: 'Quartz', ri_low: 1.544, ri_high: 1.553, isotropic: false },
  { name: 'Topaz', ri_low: 1.609, ri_high: 1.617, isotropic: false },
  { name: 'Tourmaline', ri_low: 1.624, ri_high: 1.644, isotropic: false },
  { name: 'Peridot', ri_low: 1.654, ri_high: 1.690, isotropic: false },
  { name: 'Aquamarine', ri_low: 1.577, ri_high: 1.583, isotropic: false },
];

interface SimulationGem {
  name: string;
  ri_low: number;
  ri_high: number;
  isotropic: boolean;
}

export function RefractometerSimulator() {
  const { mineralsForRefractometer, dbAvailable, loading } = useCalculatorData();

  // Convert database minerals to simulation format
  const simulationGems = useMemo((): SimulationGem[] => {
    if (dbAvailable && mineralsForRefractometer.length > 0) {
      return mineralsForRefractometer
        .filter(m => m.ri_min && m.ri_max)
        .map(m => ({
          name: m.name,
          ri_low: Number(m.ri_min) || 0,
          ri_high: Number(m.ri_max) || 0,
          isotropic: m.optical_character === 'Isotropic',
        }))
        .filter(g => g.ri_low > 0 && g.ri_high <= 1.81);
    }
    return FALLBACK_GEMS;
  }, [dbAvailable, mineralsForRefractometer]);

  const [selectedGem, setSelectedGem] = useState<SimulationGem>(simulationGems[0] || FALLBACK_GEMS[0]);
  const [showAnswer, setShowAnswer] = useState(false);

  const birefringence = selectedGem.ri_high - selectedGem.ri_low;

  // Calculate visual position (1.40 to 1.80 scale for display)
  const scale_min = 1.40;
  const scale_max = 1.80;
  const scale_range = scale_max - scale_min;

  const pos_low = ((selectedGem.ri_low - scale_min) / scale_range) * 100;
  const pos_high = ((selectedGem.ri_high - scale_min) / scale_range) * 100;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-600">
          Practice reading refractometer shadow edges. Select a gem to simulate its reading on the scale.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-slate-700">
            Select Gem to Simulate
          </label>
          {dbAvailable && (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
              {simulationGems.length} gems from database
            </span>
          )}
        </div>
        {loading ? (
          <div className="w-full px-3 py-2 text-sm text-slate-500 bg-slate-100 rounded-lg">
            Loading gems...
          </div>
        ) : (
          <select
            value={selectedGem.name}
            onChange={(e) => {
              const found = simulationGems.find(g => g.name === e.target.value);
              if (found) {
                setSelectedGem(found);
                setShowAnswer(false);
              }
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-crystal-500 focus:border-crystal-500"
          >
            {simulationGems.map((gem) => (
              <option key={gem.name} value={gem.name}>
                {gem.name} (RI: {gem.ri_low.toFixed(3)}{gem.ri_low !== gem.ri_high ? `-${gem.ri_high.toFixed(3)}` : ''})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Simulated Refractometer Scale */}
      <div className="bg-gradient-to-b from-slate-100 to-slate-50 rounded-lg p-6 border border-slate-300">
        <h4 className="text-sm font-semibold text-slate-900 mb-4 text-center">Refractometer Scale View</h4>

        {/* Scale */}
        <div className="relative h-32 bg-white rounded border-2 border-slate-400">
          {/* Scale markings */}
          <div className="absolute inset-0 flex">
            {[1.40, 1.45, 1.50, 1.55, 1.60, 1.65, 1.70, 1.75, 1.80].map((val) => {
              const pos = ((val - scale_min) / scale_range) * 100;
              return (
                <div
                  key={val}
                  className="absolute h-full border-l border-slate-300"
                  style={{ left: `${pos}%` }}
                >
                  <div className="absolute -bottom-6 left-0 transform -translate-x-1/2 text-xs text-slate-600 font-mono">
                    {val.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Shadow edge(s) */}
          {!showAnswer ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-slate-400 text-sm">Click "Show Reading" to see shadow edge</div>
            </div>
          ) : (
            <>
              {/* Dark area (low RI side) */}
              <div
                className="absolute inset-y-0 left-0 bg-slate-800 bg-opacity-80"
                style={{ width: `${pos_low}%` }}
              />

              {/* Shadow edge marker (low) */}
              <div
                className="absolute inset-y-0 w-1 bg-red-500 shadow-lg"
                style={{ left: `${pos_low}%` }}
              >
                <div className="absolute -top-8 left-0 transform -translate-x-1/2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                  {selectedGem.ri_low.toFixed(3)}
                </div>
              </div>

              {/* If DR, show high edge */}
              {!selectedGem.isotropic && birefringence > 0.001 && (
                <>
                  <div
                    className="absolute inset-y-0 bg-slate-700 bg-opacity-60"
                    style={{ left: `${pos_low}%`, width: `${pos_high - pos_low}%` }}
                  />
                  <div
                    className="absolute inset-y-0 w-1 bg-blue-500 shadow-lg"
                    style={{ left: `${pos_high}%` }}
                  >
                    <div className="absolute -bottom-8 left-0 transform -translate-x-1/2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                      {selectedGem.ri_high.toFixed(3)}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            className="px-4 py-2 bg-crystal-500 text-white rounded-lg hover:bg-crystal-600 transition-colors font-medium text-sm"
          >
            {showAnswer ? 'Hide Reading' : 'Show Reading'}
          </button>
        </div>
      </div>

      {showAnswer && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-xs text-slate-500 mb-1">Low RI</div>
            <div className="text-2xl font-bold text-slate-900">{selectedGem.ri_low.toFixed(3)}</div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-xs text-slate-500 mb-1">High RI</div>
            <div className="text-2xl font-bold text-slate-900">{selectedGem.ri_high.toFixed(3)}</div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-xs text-slate-500 mb-1">Birefringence</div>
            <div className="text-2xl font-bold text-slate-900">{birefringence.toFixed(3)}</div>
            <div className="text-xs text-slate-600 mt-1">
              {selectedGem.isotropic ? 'Isotropic (SR)' : 'Anisotropic (DR)'}
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Reading Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Single shadow edge:</strong> Isotropic gem (cubic or amorphous)</li>
          <li>• <strong>Double shadow edge:</strong> Doubly refractive gem - rotate to see both</li>
          <li>• <strong>Blurry edge:</strong> Poor contact with hemisphere - add RI fluid</li>
          <li>• <strong>No reading:</strong> RI above 1.81 (over the limit)</li>
        </ul>
      </div>
    </div>
  );
}
