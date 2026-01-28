/**
 * Gem Comparison Tool
 * Side-by-side property comparison (2-4 gems)
 */

import { useState } from 'react';

interface GemData {
  name: string;
  ri_low: number;
  ri_high: number;
  sg: number;
  hardness: number;
  dispersion: number;
  system: string;
  pleochroism: string;
}

const GEM_DATABASE: GemData[] = [
  { name: 'Diamond', ri_low: 2.417, ri_high: 2.417, sg: 3.52, hardness: 10.0, dispersion: 0.044, system: 'Cubic', pleochroism: 'None' },
  { name: 'Ruby', ri_low: 1.762, ri_high: 1.770, sg: 4.00, hardness: 9.0, dispersion: 0.018, system: 'Trigonal', pleochroism: 'Distinct' },
  { name: 'Sapphire', ri_low: 1.762, ri_high: 1.770, sg: 4.00, hardness: 9.0, dispersion: 0.018, system: 'Trigonal', pleochroism: 'Distinct' },
  { name: 'Emerald', ri_low: 1.570, ri_high: 1.590, sg: 2.72, hardness: 7.5, dispersion: 0.014, system: 'Hexagonal', pleochroism: 'Distinct' },
  { name: 'Spinel', ri_low: 1.718, ri_high: 1.718, sg: 3.60, hardness: 8.0, dispersion: 0.020, system: 'Cubic', pleochroism: 'None' },
  { name: 'Topaz', ri_low: 1.609, ri_high: 1.617, sg: 3.53, hardness: 8.0, dispersion: 0.014, system: 'Orthorhombic', pleochroism: 'Weak' },
  { name: 'Tourmaline', ri_low: 1.624, ri_high: 1.644, sg: 3.10, hardness: 7.0, dispersion: 0.017, system: 'Trigonal', pleochroism: 'Strong' },
  { name: 'Quartz', ri_low: 1.544, ri_high: 1.553, sg: 2.65, hardness: 7.0, dispersion: 0.013, system: 'Trigonal', pleochroism: 'Weak' },
  { name: 'Zircon', ri_low: 1.925, ri_high: 1.984, sg: 4.70, hardness: 7.5, dispersion: 0.039, system: 'Tetragonal', pleochroism: 'Weak' },
  { name: 'Garnet (Pyrope)', ri_low: 1.740, ri_high: 1.740, sg: 3.76, hardness: 7.5, dispersion: 0.022, system: 'Cubic', pleochroism: 'None' },
  { name: 'Garnet (Almandine)', ri_low: 1.780, ri_high: 1.780, sg: 4.13, hardness: 7.5, dispersion: 0.024, system: 'Cubic', pleochroism: 'None' },
  { name: 'Peridot', ri_low: 1.654, ri_high: 1.690, sg: 3.34, hardness: 6.5, dispersion: 0.020, system: 'Orthorhombic', pleochroism: 'Weak' },
  { name: 'Aquamarine', ri_low: 1.570, ri_high: 1.590, sg: 2.71, hardness: 7.5, dispersion: 0.014, system: 'Hexagonal', pleochroism: 'Weak' },
  { name: 'Tanzanite', ri_low: 1.691, ri_high: 1.700, sg: 3.35, hardness: 6.5, dispersion: 0.030, system: 'Orthorhombic', pleochroism: 'Very Strong' },
  { name: 'Alexandrite', ri_low: 1.745, ri_high: 1.755, sg: 3.71, hardness: 8.5, dispersion: 0.015, system: 'Orthorhombic', pleochroism: 'Very Strong' },
];

export function GemComparison() {
  const [selected, setSelected] = useState<string[]>(['Diamond', 'Ruby']);

  const handleToggleGem = (gemName: string) => {
    if (selected.includes(gemName)) {
      if (selected.length > 1) {
        setSelected(selected.filter(n => n !== gemName));
      }
    } else {
      if (selected.length < 4) {
        setSelected([...selected, gemName]);
      }
    }
  };

  const selectedGems = selected.map(name => GEM_DATABASE.find(g => g.name === name)!);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-600">
          Select 2-4 gems to compare their optical and physical properties side-by-side.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-slate-900">
            Selected Gems ({selected.length}/4)
          </h4>
          {selected.length > 1 && (
            <button
              onClick={() => setSelected(['Diamond'])}
              className="text-xs text-crystal-600 hover:text-crystal-700 font-medium"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {GEM_DATABASE.map(gem => (
            <button
              key={gem.name}
              onClick={() => handleToggleGem(gem.name)}
              disabled={!selected.includes(gem.name) && selected.length >= 4}
              className={`px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all ${
                selected.includes(gem.name)
                  ? 'bg-crystal-500 border-crystal-500 text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-crystal-300'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {gem.name}
            </button>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b-2 border-slate-200">
              <th className="px-4 py-3 text-left font-semibold text-slate-700 sticky left-0 bg-slate-50">Property</th>
              {selectedGems.map(gem => (
                <th key={gem.name} className="px-4 py-3 text-center font-semibold text-slate-900 border-l border-slate-200">
                  {gem.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-700 bg-white sticky left-0">RI (Low)</td>
              {selectedGems.map(gem => (
                <td key={gem.name} className="px-4 py-3 text-center font-mono text-slate-900 border-l border-slate-100">
                  {gem.ri_low.toFixed(3)}
                </td>
              ))}
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-700 bg-white sticky left-0">RI (High)</td>
              {selectedGems.map(gem => (
                <td key={gem.name} className="px-4 py-3 text-center font-mono text-slate-900 border-l border-slate-100">
                  {gem.ri_high.toFixed(3)}
                </td>
              ))}
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-700 bg-white sticky left-0">Birefringence</td>
              {selectedGems.map(gem => (
                <td key={gem.name} className="px-4 py-3 text-center font-mono text-slate-900 border-l border-slate-100">
                  {(gem.ri_high - gem.ri_low).toFixed(3)}
                </td>
              ))}
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-700 bg-white sticky left-0">Specific Gravity</td>
              {selectedGems.map(gem => (
                <td key={gem.name} className="px-4 py-3 text-center font-mono text-slate-900 border-l border-slate-100">
                  {gem.sg.toFixed(2)}
                </td>
              ))}
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-700 bg-white sticky left-0">Hardness (Mohs)</td>
              {selectedGems.map(gem => (
                <td key={gem.name} className="px-4 py-3 text-center font-mono text-slate-900 border-l border-slate-100">
                  {gem.hardness}
                </td>
              ))}
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-700 bg-white sticky left-0">Dispersion</td>
              {selectedGems.map(gem => (
                <td key={gem.name} className="px-4 py-3 text-center font-mono text-slate-900 border-l border-slate-100">
                  {gem.dispersion.toFixed(3)}
                </td>
              ))}
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-700 bg-white sticky left-0">Crystal System</td>
              {selectedGems.map(gem => (
                <td key={gem.name} className="px-4 py-3 text-center text-slate-900 border-l border-slate-100">
                  {gem.system}
                </td>
              ))}
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-700 bg-white sticky left-0">Pleochroism</td>
              {selectedGems.map(gem => (
                <td key={gem.name} className="px-4 py-3 text-center text-slate-900 border-l border-slate-100">
                  {gem.pleochroism}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Comparison Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Compare RI to separate gems with similar appearance</li>
          <li>• SG and hardness help distinguish gems of similar RI</li>
          <li>• Birefringence and pleochroism indicate crystal system</li>
          <li>• Dispersion affects brilliance and fire in well-cut stones</li>
        </ul>
      </div>
    </div>
  );
}
