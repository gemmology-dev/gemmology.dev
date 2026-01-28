/**
 * Pleochroism Reference Guide
 * Expected colors by gem and crystal axis
 */

import { useState } from 'react';

interface PleochroismData {
  gem: string;
  system: string;
  direction1: string;
  color1: string;
  direction2: string;
  color2: string;
  direction3?: string;
  color3?: string;
  strength: string;
  notes: string;
}

const PLEOCHROIC_GEMS: PleochroismData[] = [
  {
    gem: 'Ruby',
    system: 'Trigonal',
    direction1: 'O-ray',
    color1: 'Purplish red',
    direction2: 'E-ray',
    color2: 'Orange-red',
    strength: 'Distinct',
    notes: 'Best seen in thick stones',
  },
  {
    gem: 'Sapphire (Blue)',
    system: 'Trigonal',
    direction1: 'O-ray',
    color1: 'Deep blue',
    direction2: 'E-ray',
    color2: 'Greenish-blue',
    strength: 'Distinct',
    notes: 'Varies with saturation',
  },
  {
    gem: 'Emerald',
    system: 'Hexagonal',
    direction1: 'O-ray',
    color1: 'Blue-green',
    direction2: 'E-ray',
    color2: 'Yellow-green',
    strength: 'Distinct',
    notes: 'More visible in darker stones',
  },
  {
    gem: 'Tanzanite',
    system: 'Orthorhombic',
    direction1: 'Alpha',
    color1: 'Blue',
    direction2: 'Beta',
    color2: 'Violet',
    direction3: 'Gamma',
    color3: 'Purple/Red',
    strength: 'Very Strong',
    notes: 'Trichroic - heat treated shows 2 colors',
  },
  {
    gem: 'Alexandrite',
    system: 'Orthorhombic',
    direction1: 'Alpha',
    color1: 'Green',
    direction2: 'Beta',
    color2: 'Orange',
    direction3: 'Gamma',
    color3: 'Red/Purple',
    strength: 'Very Strong',
    notes: 'Color change + strong pleochroism',
  },
  {
    gem: 'Andalusite',
    system: 'Orthorhombic',
    direction1: 'Alpha',
    color1: 'Yellow-green',
    direction2: 'Beta',
    color2: 'Brown-green',
    direction3: 'Gamma',
    color3: 'Red-brown',
    strength: 'Very Strong',
    notes: 'Distinctive multicolor effect',
  },
  {
    gem: 'Iolite',
    system: 'Orthorhombic',
    direction1: 'Alpha',
    color1: 'Violet-blue',
    direction2: 'Beta',
    color2: 'Blue',
    direction3: 'Gamma',
    color3: 'Pale yellow',
    strength: 'Very Strong',
    notes: 'Water sapphire - dramatic colors',
  },
  {
    gem: 'Kunzite',
    system: 'Monoclinic',
    direction1: 'Alpha',
    color1: 'Colorless',
    direction2: 'Beta',
    color2: 'Pink',
    direction3: 'Gamma',
    color3: 'Violet',
    strength: 'Distinct',
    notes: 'Fades in light over time',
  },
  {
    gem: 'Tourmaline (Green)',
    system: 'Trigonal',
    direction1: 'O-ray',
    color1: 'Dark green',
    direction2: 'E-ray',
    color2: 'Light green',
    strength: 'Strong',
    notes: 'Best viewed down c-axis',
  },
  {
    gem: 'Tourmaline (Pink)',
    system: 'Trigonal',
    direction1: 'O-ray',
    color1: 'Dark pink',
    direction2: 'E-ray',
    color2: 'Light pink',
    strength: 'Strong',
    notes: 'Orientation important for cutting',
  },
  {
    gem: 'Aquamarine',
    system: 'Hexagonal',
    direction1: 'O-ray',
    color1: 'Blue',
    direction2: 'E-ray',
    color2: 'Colorless/Pale blue',
    strength: 'Weak',
    notes: 'Often not visible',
  },
  {
    gem: 'Peridot',
    system: 'Orthorhombic',
    direction1: 'Alpha',
    color1: 'Colorless/Pale green',
    direction2: 'Beta',
    color2: 'Yellow-green',
    direction3: 'Gamma',
    color3: 'Green',
    strength: 'Weak',
    notes: 'Subtle color difference',
  },
];

export function PleochroismReference() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = PLEOCHROIC_GEMS.filter(gem => {
    const matchStrength = filter === 'all' || gem.strength.toLowerCase() === filter;
    const matchSearch = !search || gem.gem.toLowerCase().includes(search.toLowerCase());
    return matchStrength && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-600">
          Reference guide for expected pleochroic colors in common gems. Use with dichroscope for identification.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Search Gem
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-crystal-500 focus:border-crystal-500"
            placeholder="e.g., ruby, tanzanite"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Strength Filter
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-crystal-500 focus:border-crystal-500"
          >
            <option value="all">All Strengths</option>
            <option value="very strong">Very Strong</option>
            <option value="strong">Strong</option>
            <option value="distinct">Distinct</option>
            <option value="weak">Weak</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((gem, idx) => (
          <div key={idx} className="p-4 rounded-lg border border-slate-200 bg-white">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h5 className="font-semibold text-slate-900">{gem.gem}</h5>
                <p className="text-xs text-slate-500">{gem.system} • {gem.strength}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium shrink-0 ${
                gem.strength === 'Very Strong' ? 'bg-red-100 text-red-700' :
                gem.strength === 'Strong' ? 'bg-orange-100 text-orange-700' :
                gem.strength === 'Distinct' ? 'bg-yellow-100 text-yellow-700' :
                'bg-slate-100 text-slate-700'
              }`}>
                {gem.strength}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-50 rounded p-2">
                <div className="text-xs text-slate-500 mb-1">{gem.direction1}</div>
                <div className="font-medium text-slate-900">{gem.color1}</div>
              </div>
              <div className="bg-slate-50 rounded p-2">
                <div className="text-xs text-slate-500 mb-1">{gem.direction2}</div>
                <div className="font-medium text-slate-900">{gem.color2}</div>
              </div>
              {gem.direction3 && gem.color3 && (
                <div className="bg-slate-50 rounded p-2 col-span-2">
                  <div className="text-xs text-slate-500 mb-1">{gem.direction3}</div>
                  <div className="font-medium text-slate-900">{gem.color3}</div>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-600 mt-3 italic">{gem.notes}</p>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          No gems match your search criteria.
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Crystal Systems & Pleochroism</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Cubic:</strong> No pleochroism (isotropic)</li>
          <li>• <strong>Tetragonal, Hexagonal, Trigonal:</strong> 2 colors (uniaxial)</li>
          <li>• <strong>Orthorhombic, Monoclinic, Triclinic:</strong> 2-3 colors (biaxial)</li>
          <li>• <strong>O-ray/E-ray:</strong> Ordinary/Extraordinary rays in uniaxial gems</li>
          <li>• <strong>Alpha/Beta/Gamma:</strong> Three optical directions in biaxial gems</li>
        </ul>
      </div>
    </div>
  );
}
