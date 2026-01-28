/**
 * Dichroscope Results Lookup
 * Input colors seen → suggest possible gems
 */

import { useState } from 'react';

interface DichroscopeData {
  gem: string;
  color1: string;
  color2: string;
  strength: string;
  notes: string;
}

const DICHROIC_GEMS: DichroscopeData[] = [
  { gem: 'Ruby', color1: 'Red', color2: 'Orange-red', strength: 'Strong', notes: 'Best seen in thick stones' },
  { gem: 'Sapphire (Blue)', color1: 'Blue', color2: 'Greenish-blue', strength: 'Strong', notes: 'Varies with saturation' },
  { gem: 'Emerald', color1: 'Blue-green', color2: 'Yellow-green', strength: 'Moderate', notes: 'More visible in darker stones' },
  { gem: 'Alexandrite', color1: 'Red/Purple', color2: 'Orange/Green', strength: 'Very Strong', notes: 'Color change + pleochroism' },
  { gem: 'Tanzanite', color1: 'Blue/Violet', color2: 'Purple/Red', strength: 'Very Strong', notes: 'Trichroic - see 3 colors' },
  { gem: 'Tourmaline (Green)', color1: 'Dark green', color2: 'Light green', strength: 'Strong', notes: 'Best down c-axis' },
  { gem: 'Tourmaline (Pink)', color1: 'Dark pink', color2: 'Light pink', strength: 'Strong', notes: 'Visible in most directions' },
  { gem: 'Iolite', color1: 'Violet-blue', color2: 'Pale yellow', strength: 'Very Strong', notes: 'Dramatic color shift' },
  { gem: 'Andalusite', color1: 'Red-brown', color2: 'Yellow-green', strength: 'Very Strong', notes: 'Distinctive colors' },
  { gem: 'Kunzite', color1: 'Violet', color2: 'Colorless/Pink', strength: 'Strong', notes: 'Fades in light' },
  { gem: 'Peridot', color1: 'Green', color2: 'Yellow-green', strength: 'Weak', notes: 'Subtle difference' },
  { gem: 'Aquamarine', color1: 'Blue', color2: 'Colorless/Pale blue', strength: 'Weak', notes: 'Often not visible' },
  { gem: 'Topaz (Blue)', color1: 'Colorless', color2: 'Pale blue', strength: 'Weak', notes: 'Difficult to detect' },
  { gem: 'Morganite', color1: 'Pink', color2: 'Pale pink', strength: 'Weak', notes: 'Requires good stone' },
];

export function DichroscopeResults() {
  const [color1, setColor1] = useState('');
  const [color2, setColor2] = useState('');
  const [strengthFilter, setStrengthFilter] = useState('all');

  const filtered = DICHROIC_GEMS.filter(gem => {
    const matchColor1 = !color1 || gem.color1.toLowerCase().includes(color1.toLowerCase()) || gem.color2.toLowerCase().includes(color1.toLowerCase());
    const matchColor2 = !color2 || gem.color1.toLowerCase().includes(color2.toLowerCase()) || gem.color2.toLowerCase().includes(color2.toLowerCase());
    const matchStrength = strengthFilter === 'all' || gem.strength.toLowerCase() === strengthFilter;
    return matchColor1 && matchColor2 && matchStrength;
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-600">
          Enter the colors you observe through the dichroscope to identify possible gems. Rotate the stone to see both colors.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            First Color Seen
          </label>
          <input
            type="text"
            value={color1}
            onChange={(e) => setColor1(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-crystal-500 focus:border-crystal-500"
            placeholder="e.g., blue, red, green"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Second Color Seen
          </label>
          <input
            type="text"
            value={color2}
            onChange={(e) => setColor2(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-crystal-500 focus:border-crystal-500"
            placeholder="e.g., greenish-blue"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Strength
          </label>
          <select
            value={strengthFilter}
            onChange={(e) => setStrengthFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-crystal-500 focus:border-crystal-500"
          >
            <option value="all">All</option>
            <option value="very strong">Very Strong</option>
            <option value="strong">Strong</option>
            <option value="moderate">Moderate</option>
            <option value="weak">Weak</option>
          </select>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-900">
            Matching Gems ({filtered.length})
          </h4>
          {filtered.map((gem, idx) => (
            <div key={idx} className="p-4 rounded-lg border border-slate-200 bg-white hover:border-crystal-300 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h5 className="font-semibold text-slate-900">{gem.gem}</h5>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-slate-500">Color 1:</span>{' '}
                      <span className="font-medium text-slate-900">{gem.color1}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Color 2:</span>{' '}
                      <span className="font-medium text-slate-900">{gem.color2}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{gem.notes}</p>
                </div>
                <div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    gem.strength === 'Very Strong' ? 'bg-red-100 text-red-700' :
                    gem.strength === 'Strong' ? 'bg-orange-100 text-orange-700' :
                    gem.strength === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {gem.strength}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500">
          No matching gems found. Try different color terms.
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Using a Dichroscope</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• View the stone through both windows while rotating</li>
          <li>• Isotropic gems (cubic) show NO pleochroism</li>
          <li>• Uniaxial gems (tetragonal, hexagonal, trigonal) show 2 colors</li>
          <li>• Biaxial gems (orthorhombic, monoclinic, triclinic) show 2-3 colors</li>
          <li>• Best viewed in strong light against white background</li>
        </ul>
      </div>
    </div>
  );
}
