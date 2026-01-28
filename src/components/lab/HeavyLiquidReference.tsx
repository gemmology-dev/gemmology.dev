/**
 * Heavy Liquid SG Reference
 * Which liquids for which gem SG ranges
 */

import { useState } from 'react';

interface HeavyLiquid {
  name: string;
  sg: number;
  floats: string[];
  sinks: string[];
  notes: string;
  safety: string;
}

const LIQUIDS: HeavyLiquid[] = [
  {
    name: 'Water',
    sg: 1.00,
    floats: [],
    sinks: ['All gems'],
    notes: 'Baseline reference',
    safety: 'Safe',
  },
  {
    name: 'Toluene',
    sg: 0.87,
    floats: ['Amber (0.96-1.10)'],
    sinks: ['Most gems'],
    notes: 'For very light organics',
    safety: 'Toxic - use in fume hood',
  },
  {
    name: 'Methylene Iodide (Pure)',
    sg: 3.32,
    floats: ['Quartz (2.65)', 'Beryl (2.70)', 'Tourmaline (3.06)'],
    sinks: ['Diamond (3.52)', 'Corundum (4.00)', 'Spinel (3.60)'],
    notes: 'Standard heavy liquid',
    safety: 'Very toxic - use gloves, fume hood',
  },
  {
    name: 'Methylene Iodide + Toluene (3.06)',
    sg: 3.06,
    floats: ['Quartz (2.65)', 'Beryl (2.70)', 'Tourmaline (3.06)'],
    sinks: ['Diamond (3.52)', 'Corundum (4.00)', 'Topaz (3.53)'],
    notes: 'Diluted for tourmaline separation',
    safety: 'Toxic - use gloves, fume hood',
  },
  {
    name: 'Clerici Solution',
    sg: 4.25,
    floats: ['Diamond (3.52)', 'Corundum (4.00)', 'Topaz (3.53)'],
    sinks: ['Zircon (4.70)', 'Cassiterite (6.99)'],
    notes: 'High density option',
    safety: 'Toxic - corrosive',
  },
  {
    name: 'Bromoform',
    sg: 2.89,
    floats: ['Quartz (2.65)', 'Beryl (2.70)', 'Feldspar (2.56)'],
    sinks: ['Tourmaline (3.06)', 'Diamond (3.52)', 'Corundum (4.00)'],
    notes: 'Lower than MI',
    safety: 'Toxic - use gloves',
  },
];

const COMMON_GEMS = [
  { name: 'Amber', sg: 1.08 },
  { name: 'Opal', sg: 2.10 },
  { name: 'Quartz', sg: 2.65 },
  { name: 'Beryl', sg: 2.70 },
  { name: 'Tourmaline', sg: 3.06 },
  { name: 'Diamond', sg: 3.52 },
  { name: 'Topaz', sg: 3.53 },
  { name: 'Spinel', sg: 3.60 },
  { name: 'Corundum', sg: 4.00 },
  { name: 'Zircon', sg: 4.70 },
];

export function HeavyLiquidReference() {
  const [selectedSG, setSelectedSG] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-600">
          Heavy liquids separate gems by specific gravity. Select a liquid to see which gems float or sink.
        </p>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Heavy Liquids</h4>
        <div className="space-y-2">
          {LIQUIDS.map((liquid) => (
            <button
              key={liquid.name}
              onClick={() => setSelectedSG(selectedSG === liquid.sg ? null : liquid.sg)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selectedSG === liquid.sg
                  ? 'border-crystal-500 bg-crystal-50'
                  : 'border-slate-200 bg-white hover:border-crystal-300'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h5 className="font-semibold text-slate-900">{liquid.name}</h5>
                  <div className="text-sm text-slate-600 mt-1">
                    SG: <span className="font-mono font-medium">{liquid.sg.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{liquid.notes}</p>
                  <div className={`text-xs mt-2 px-2 py-1 rounded inline-block ${
                    liquid.safety === 'Safe'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {liquid.safety}
                  </div>
                </div>
              </div>

              {selectedSG === liquid.sg && (
                <div className="mt-4 pt-4 border-t border-slate-200 grid md:grid-cols-2 gap-4">
                  {liquid.floats.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-green-700 mb-2">↑ Floats (Lower SG)</div>
                      <div className="space-y-1">
                        {liquid.floats.map((gem, idx) => (
                          <div key={idx} className="text-sm text-slate-700 bg-green-50 px-2 py-1 rounded">
                            {gem}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {liquid.sinks.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-red-700 mb-2">↓ Sinks (Higher SG)</div>
                      <div className="space-y-1">
                        {liquid.sinks.slice(0, 5).map((gem, idx) => (
                          <div key={idx} className="text-sm text-slate-700 bg-red-50 px-2 py-1 rounded">
                            {gem}
                          </div>
                        ))}
                        {liquid.sinks.length > 5 && (
                          <div className="text-xs text-slate-500 italic">+ {liquid.sinks.length - 5} more</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Common Gem SG Reference</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-slate-700">Gem</th>
                <th className="px-3 py-2 text-left font-medium text-slate-700">SG</th>
                <th className="px-3 py-2 text-left font-medium text-slate-700">Liquid Test</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {COMMON_GEMS.map((gem) => (
                <tr key={gem.name} className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-900">{gem.name}</td>
                  <td className="px-3 py-2 font-mono text-slate-700">{gem.sg.toFixed(2)}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">
                    {gem.sg < 2.89 ? 'Floats in bromoform (2.89)' :
                     gem.sg < 3.32 ? 'Sinks in bromoform, floats in MI (3.32)' :
                     gem.sg < 4.25 ? 'Sinks in MI, floats in Clerici (4.25)' :
                     'Sinks in Clerici solution'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-red-900 mb-2">⚠️ Safety Warning</h4>
        <ul className="text-sm text-red-800 space-y-1">
          <li>• Heavy liquids are <strong>highly toxic</strong> - avoid skin contact and fumes</li>
          <li>• Always use gloves, safety glasses, and work in a fume hood</li>
          <li>• Store in sealed containers away from light (causes decomposition)</li>
          <li>• Never use with porous or fractured stones - liquid can be absorbed</li>
          <li>• Dispose of according to hazardous waste regulations</li>
        </ul>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Alternative: Hydrostatic Weighing</h4>
        <p className="text-sm text-blue-800">
          For most gem identification, hydrostatic weighing (measuring weight in air vs water) is safer and more accurate than heavy liquids. Heavy liquids are mainly used for quick separation of parcels or when hydrostatic equipment isn't available.
        </p>
      </div>
    </div>
  );
}
