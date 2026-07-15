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

  // Standard refractometer scale upper limit (limited by the contact-liquid RI of ~1.81)
  const REFRACTOMETER_LIMIT = 1.81;

  // Convert database minerals to simulation format. Keep over-the-limit gems
  // — the OTL state is itself a teaching moment.
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
        .filter(g => g.ri_low > 0);
    }
    return FALLBACK_GEMS;
  }, [dbAvailable, mineralsForRefractometer]);

  const [selectedGem, setSelectedGem] = useState<SimulationGem>(simulationGems[0] || FALLBACK_GEMS[0]);
  const [showAnswer, setShowAnswer] = useState(false);

  const birefringence = selectedGem.ri_high - selectedGem.ri_low;
  const isOverTheLimit = selectedGem.ri_low > REFRACTOMETER_LIMIT;

  // Calculate visual position (1.40 to 1.80 scale for display)
  const scale_min = 1.40;
  const scale_max = 1.80;
  const scale_range = scale_max - scale_min;

  const pos_low = ((selectedGem.ri_low - scale_min) / scale_range) * 100;
  const pos_high = ((selectedGem.ri_high - scale_min) / scale_range) * 100;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-600 dark:text-cream-secondary">
          Practice reading refractometer shadow edges. Select a gem to simulate its reading on the scale.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-cream-secondary">
            Select Gem to Simulate
          </label>
          {dbAvailable && (
            <span className="text-xs text-green-600 dark:text-emerald-300 bg-green-50 dark:bg-emerald-400/10 px-2 py-0.5 rounded">
              {simulationGems.length} gems from database
            </span>
          )}
        </div>
        {loading ? (
          <div className="w-full px-3 py-2 text-sm text-slate-600 dark:text-cream-secondary bg-slate-100 dark:bg-coffee-raised2 rounded-lg">
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
            className="w-full px-3 py-2 border border-slate-300 dark:border-coffee-border rounded-lg bg-white dark:bg-coffee-sunk text-slate-900 dark:text-cream-primary focus:ring-2 focus:ring-crystal-500 dark:focus:ring-crystal-400/20 focus:border-crystal-500 dark:focus:border-crystal-400"
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
      <div className="bg-gradient-to-b from-slate-100 to-slate-50 dark:from-coffee-raised2 dark:to-coffee-raised2 rounded-lg p-6 border border-slate-300 dark:border-coffee-border">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-cream-primary mb-4 text-center">Refractometer Scale View</h4>

        {/* Scale */}
        <div className="relative h-32 bg-white dark:bg-coffee-sunk rounded border-2 border-slate-400 dark:border-coffee-border-strong">
          {/* Scale markings */}
          <div className="absolute inset-0 flex">
            {[1.40, 1.45, 1.50, 1.55, 1.60, 1.65, 1.70, 1.75, 1.80].map((val) => {
              const pos = ((val - scale_min) / scale_range) * 100;
              return (
                <div
                  key={val}
                  className="absolute h-full border-l border-slate-300 dark:border-coffee-border"
                  style={{ left: `${pos}%` }}
                >
                  <div className="absolute -bottom-6 left-0 transform -translate-x-1/2 text-xs text-slate-600 dark:text-cream-muted font-mono">
                    {val.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Shadow edge(s) */}
          {!showAnswer ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-slate-600 dark:text-cream-secondary text-sm">Click "Show Reading" to see shadow edge</div>
            </div>
          ) : isOverTheLimit ? (
            // Over-the-limit: a continuously bright field, no shadow edge.
            <div className="absolute inset-0 flex items-center justify-center bg-amber-50 dark:bg-amber-400/10">
              <div className="text-center px-4">
                <div className="text-sm font-semibold text-amber-900 dark:text-amber-300">Over the limit</div>
                <div className="text-xs text-amber-800 dark:text-amber-200 mt-1">
                  RI {selectedGem.ri_low.toFixed(3)} exceeds the contact-liquid limit (~1.81). The field stays continuously bright with no shadow edge.
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Dark area (low RI side) */}
              <div
                className="absolute inset-y-0 left-0 bg-slate-800 bg-opacity-80 dark:bg-coffee-border-strong dark:bg-opacity-90"
                style={{ width: `${Math.min(pos_low, 100)}%` }}
              />

              {/* Shadow edge marker (low) */}
              <div
                className="absolute inset-y-0 w-1 bg-red-500 shadow-lg"
                style={{ left: `${Math.min(pos_low, 100)}%` }}
              >
                <div className="absolute -top-8 left-0 transform -translate-x-1/2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                  {selectedGem.ri_low.toFixed(3)}
                </div>
              </div>

              {/* If DR, show high edge */}
              {!selectedGem.isotropic && birefringence > 0.001 && selectedGem.ri_high <= REFRACTOMETER_LIMIT && (
                <>
                  <div
                    className="absolute inset-y-0 bg-slate-700 bg-opacity-60 dark:bg-coffee-border-strong dark:bg-opacity-60"
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
            className="px-4 py-2 bg-crystal-700 text-white rounded-lg hover:bg-crystal-800 transition-colors font-medium text-sm"
          >
            {showAnswer ? 'Hide Reading' : 'Show Reading'}
          </button>
        </div>
      </div>

      {showAnswer && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-coffee-raised2 border border-slate-200 dark:border-coffee-border">
            <div className="text-xs text-slate-600 dark:text-cream-muted mb-1">Low RI</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-cream-primary">{selectedGem.ri_low.toFixed(3)}</div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 dark:bg-coffee-raised2 border border-slate-200 dark:border-coffee-border">
            <div className="text-xs text-slate-600 dark:text-cream-muted mb-1">High RI</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-cream-primary">{selectedGem.ri_high.toFixed(3)}</div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 dark:bg-coffee-raised2 border border-slate-200 dark:border-coffee-border">
            <div className="text-xs text-slate-600 dark:text-cream-muted mb-1">Birefringence</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-cream-primary">{birefringence.toFixed(3)}</div>
            <div className="text-xs text-slate-600 dark:text-cream-muted mt-1">
              {selectedGem.isotropic ? 'Isotropic (SR)' : 'Anisotropic (DR)'}
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-400/10 border border-blue-200 dark:border-blue-400/20 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">Reading Tips</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• <strong>Single shadow edge:</strong> Isotropic gem (cubic or amorphous)</li>
          <li>• <strong>Double shadow edge:</strong> Doubly refractive gem - rotate to see both</li>
          <li>• <strong>Blurry edge:</strong> Poor contact with hemisphere - add RI fluid</li>
          <li>• <strong>No reading:</strong> RI above 1.81 (over the limit)</li>
        </ul>
      </div>
    </div>
  );
}
