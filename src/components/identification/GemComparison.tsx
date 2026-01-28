/**
 * Gem Comparison Tool
 * Side-by-side property comparison (2-4 gems)
 * Full-width layout: gem selector pills on top, comparison table stretches full width below.
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

const PROPERTIES = [
  { key: 'ri_low' as const, label: 'RI (Low)', format: (g: GemData) => g.ri_low.toFixed(3) },
  { key: 'ri_high' as const, label: 'RI (High)', format: (g: GemData) => g.ri_high.toFixed(3) },
  { key: 'birefringence' as const, label: 'Birefringence', format: (g: GemData) => (g.ri_high - g.ri_low).toFixed(3) },
  { key: 'sg' as const, label: 'Specific Gravity', format: (g: GemData) => g.sg.toFixed(2) },
  { key: 'hardness' as const, label: 'Hardness (Mohs)', format: (g: GemData) => String(g.hardness) },
  { key: 'dispersion' as const, label: 'Dispersion', format: (g: GemData) => g.dispersion.toFixed(3) },
  { key: 'system' as const, label: 'Crystal System', format: (g: GemData) => g.system },
  { key: 'pleochroism' as const, label: 'Pleochroism', format: (g: GemData) => g.pleochroism },
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
    <div className="space-y-5">
      {/* Gem selector + counter — horizontal bar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex flex-wrap gap-2 flex-1">
          {GEM_DATABASE.map(gem => (
            <button
              key={gem.name}
              onClick={() => handleToggleGem(gem.name)}
              disabled={!selected.includes(gem.name) && selected.length >= 4}
              className={`px-3 py-1 rounded-full border text-xs font-semibold transition-all ${
                selected.includes(gem.name)
                  ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300 hover:text-amber-700'
              } disabled:opacity-35 disabled:cursor-not-allowed`}
            >
              {gem.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500">{selected.length}/4</span>
          {selected.length > 1 && (
            <button
              onClick={() => setSelected(['Diamond'])}
              className="text-xs text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Comparison table — stretches full width */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-4 py-3 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider sticky left-0 bg-slate-50 border-b border-slate-200">Property</th>
              {selectedGems.map(gem => (
                <th key={gem.name} className="px-4 py-3 text-center font-semibold text-slate-900 border-l border-slate-200 border-b border-slate-200">
                  {gem.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PROPERTIES.map((prop, i) => (
              <tr key={prop.key} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                <td className="px-4 py-2.5 font-medium text-slate-600 text-xs sticky left-0 bg-inherit border-b border-slate-100">
                  {prop.label}
                </td>
                {selectedGems.map(gem => (
                  <td key={gem.name} className="px-4 py-2.5 text-center font-mono text-sm text-slate-900 border-l border-slate-100 border-b border-slate-100">
                    {prop.format(gem)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tips — compact inline */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
        <span>• Compare RI to separate similar-looking gems</span>
        <span>• SG + hardness distinguish gems with similar RI</span>
        <span>• Dispersion indicates fire in well-cut stones</span>
      </div>
    </div>
  );
}
