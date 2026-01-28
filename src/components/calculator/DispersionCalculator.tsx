/**
 * Dispersion Calculator
 * Calculate fire/dispersion from RI at different wavelengths
 */

import { useState } from 'react';
import { ResultCard } from './ResultCard';
import { ValidationMessage, validateRI } from './ValidationMessage';

const COMMON_GEMS_DISPERSION = [
  { name: 'Diamond', dispersion: 0.044, ri: 2.417 },
  { name: 'Zircon', dispersion: 0.039, ri: 1.960 },
  { name: 'Sphene', dispersion: 0.051, ri: 1.900 },
  { name: 'Demantoid Garnet', dispersion: 0.057, ri: 1.888 },
  { name: 'Ruby/Sapphire', dispersion: 0.018, ri: 1.762 },
  { name: 'Spinel', dispersion: 0.020, ri: 1.718 },
  { name: 'Topaz', dispersion: 0.014, ri: 1.619 },
  { name: 'Tourmaline', dispersion: 0.017, ri: 1.624 },
  { name: 'Quartz', dispersion: 0.013, ri: 1.544 },
  { name: 'Emerald', dispersion: 0.014, ri: 1.577 },
];

export function DispersionCalculator() {
  const [riRed, setRiRed] = useState('');
  const [riViolet, setRiViolet] = useState('');

  const riRedNum = parseFloat(riRed);
  const riVioletNum = parseFloat(riViolet);

  const isValidRed = validateRI(riRedNum);
  const isValidViolet = validateRI(riVioletNum);

  let dispersion: number | null = null;
  let category = '';

  if (isValidRed && isValidViolet && riVioletNum > riRedNum) {
    dispersion = riVioletNum - riRedNum;

    if (dispersion < 0.020) category = 'Low';
    else if (dispersion < 0.030) category = 'Moderate';
    else if (dispersion < 0.040) category = 'High';
    else category = 'Very High';
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-600">
          Enter the refractive index at red (C-line, 656nm) and violet (F-line, 486nm) wavelengths to calculate dispersion.
        </p>
        <p className="text-xs text-slate-500 mt-2">
          <strong>Formula:</strong> Dispersion = RI(violet) − RI(red)
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            RI at Red (C-line 656nm)
          </label>
          <input
            type="number"
            step="0.001"
            min="1"
            max="3"
            value={riRed}
            onChange={(e) => setRiRed(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-crystal-500 focus:border-crystal-500"
            placeholder="e.g., 2.407"
          />
          <ValidationMessage value={riRedNum} validator={validateRI} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            RI at Violet (F-line 486nm)
          </label>
          <input
            type="number"
            step="0.001"
            min="1"
            max="3"
            value={riViolet}
            onChange={(e) => setRiViolet(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-crystal-500 focus:border-crystal-500"
            placeholder="e.g., 2.451"
          />
          <ValidationMessage value={riVioletNum} validator={validateRI} />
        </div>
      </div>

      {dispersion !== null && (
        <ResultCard
          value={dispersion.toFixed(3)}
          label={`Dispersion (${category})`}
          variant="crystal"
        >
          <p className="text-sm text-slate-600 mt-2">
            <strong>Fire Potential:</strong> {category === 'Very High' || category === 'High' ? 'Excellent' : category === 'Moderate' ? 'Good' : 'Low'} spectral color separation
          </p>
        </ResultCard>
      )}

      <div className="mt-6">
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Common Gem Dispersion Reference</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-slate-700">Gem</th>
                <th className="px-3 py-2 text-left font-medium text-slate-700">Dispersion</th>
                <th className="px-3 py-2 text-left font-medium text-slate-700">RI (avg)</th>
                <th className="px-3 py-2 text-left font-medium text-slate-700">Fire</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {COMMON_GEMS_DISPERSION.map((gem) => (
                <tr key={gem.name} className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-900">{gem.name}</td>
                  <td className="px-3 py-2 font-mono text-slate-700">{gem.dispersion.toFixed(3)}</td>
                  <td className="px-3 py-2 font-mono text-slate-600">{gem.ri.toFixed(3)}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {gem.dispersion >= 0.040 ? 'Very High' : gem.dispersion >= 0.030 ? 'High' : gem.dispersion >= 0.020 ? 'Moderate' : 'Low'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Why Dispersion Matters</h4>
        <p className="text-sm text-blue-800">
          Dispersion measures how much a gem splits white light into spectral colors. Higher dispersion creates more "fire" — the rainbow flashes seen in a well-cut stone. Diamond's high dispersion (0.044) is why it shows exceptional fire, while quartz's low dispersion (0.013) produces minimal color flashes.
        </p>
      </div>
    </div>
  );
}
