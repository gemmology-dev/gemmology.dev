/**
 * Fracture and Cleavage Visual Reference
 * Guide to cleavage directions and fracture patterns
 */

import { useState } from 'react';

interface CleavageData {
  gem: string;
  cleavage: string;
  directions: string;
  quality: string;
  fracture: string;
  notes: string;
}

interface FractureType {
  type: string;
  description: string;
  examples: string;
  appearance: string;
}

const CLEAVAGE_DATA: CleavageData[] = [
  { gem: 'Diamond', cleavage: 'Perfect', directions: '4 directions (octahedral)', quality: 'Excellent', fracture: 'Conchoidal', notes: 'Cleaves easily - avoid sharp blows' },
  { gem: 'Topaz', cleavage: 'Perfect', directions: '1 direction (basal)', quality: 'Excellent', fracture: 'Conchoidal to uneven', notes: 'Very easy to cleave - handle carefully' },
  { gem: 'Kunzite', cleavage: 'Perfect', directions: '2 directions (prismatic)', quality: 'Excellent', fracture: 'Uneven', notes: 'Extremely fragile - not for rings' },
  { gem: 'Feldspar (Moonstone)', cleavage: 'Perfect', directions: '2 directions (90°)', quality: 'Good', fracture: 'Uneven to conchoidal', notes: 'Two perfect cleavages at right angles' },
  { gem: 'Tanzanite', cleavage: 'Perfect', directions: '1 direction (basal)', quality: 'Good', fracture: 'Uneven to conchoidal', notes: 'Very fragile - protective settings required' },
  { gem: 'Emerald', cleavage: 'Indistinct', directions: '1 direction (basal)', quality: 'Poor', fracture: 'Conchoidal to uneven', notes: 'Usually heavily included - brittle' },
  { gem: 'Aquamarine', cleavage: 'Indistinct', directions: '1 direction (basal)', quality: 'Poor', fracture: 'Conchoidal to uneven', notes: 'Better toughness than emerald' },
  { gem: 'Quartz', cleavage: 'None', directions: 'None', quality: 'N/A', fracture: 'Conchoidal', notes: 'Excellent toughness - very durable' },
  { gem: 'Garnet', cleavage: 'None', directions: 'None', quality: 'N/A', fracture: 'Conchoidal to uneven', notes: 'No cleavage - good durability' },
  { gem: 'Spinel', cleavage: 'None', directions: 'None', quality: 'N/A', fracture: 'Conchoidal', notes: 'Excellent toughness - very durable' },
  { gem: 'Ruby', cleavage: 'None', directions: 'None (parting sometimes)', quality: 'N/A', fracture: 'Conchoidal to uneven', notes: 'Excellent toughness - very durable' },
  { gem: 'Sapphire', cleavage: 'None', directions: 'None (parting sometimes)', quality: 'N/A', fracture: 'Conchoidal to uneven', notes: 'Excellent toughness - very durable' },
  { gem: 'Chrysoberyl', cleavage: 'Distinct', directions: '3 directions', quality: 'Fair', fracture: 'Conchoidal to uneven', notes: 'Good toughness despite cleavage' },
  { gem: 'Tourmaline', cleavage: 'Indistinct', directions: 'None to indistinct', quality: 'Poor', fracture: 'Uneven to conchoidal', notes: 'Can be brittle - avoid sharp blows' },
  { gem: 'Peridot', cleavage: 'Distinct', directions: '2 directions', quality: 'Fair', fracture: 'Conchoidal', notes: 'Moderate toughness' },
];

const FRACTURE_TYPES: FractureType[] = [
  {
    type: 'Conchoidal',
    description: 'Smooth, curved surfaces like broken glass',
    examples: 'Quartz, obsidian, most amorphous materials',
    appearance: 'Curved, shell-like fracture with concentric ridges'
  },
  {
    type: 'Uneven',
    description: 'Rough, irregular surfaces',
    examples: 'Most crystalline gems, corundum, garnet',
    appearance: 'Irregular, non-smooth fracture surfaces'
  },
  {
    type: 'Splintery',
    description: 'Fractures into elongated splinters',
    examples: 'Fibrous minerals, some tourmalines',
    appearance: 'Long, thin, needle-like fragments'
  },
  {
    type: 'Hackly',
    description: 'Jagged, sharp points',
    examples: 'Native metals, some sulfides',
    appearance: 'Sharp, irregular, jagged edges'
  },
];

export function FractureCleavageGuide() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCleavage, setFilterCleavage] = useState<string>('all');

  const filteredGems = CLEAVAGE_DATA.filter(gem => {
    const matchesSearch = gem.gem.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterCleavage === 'all' || gem.cleavage === filterCleavage;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Fracture Types</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          {FRACTURE_TYPES.map(fracture => (
            <div key={fracture.type} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <h5 className="font-semibold text-slate-900 text-sm mb-1">{fracture.type}</h5>
              <p className="text-xs text-slate-700 mb-2">{fracture.description}</p>
              <p className="text-xs text-slate-600">
                <strong>Appearance:</strong> {fracture.appearance}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                <strong>Examples:</strong> {fracture.examples}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Cleavage Reference</h4>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder="Search gemstone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-crystal-500"
          />
          <select
            value={filterCleavage}
            onChange={(e) => setFilterCleavage(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-crystal-500"
          >
            <option value="all">All Cleavage</option>
            <option value="Perfect">Perfect</option>
            <option value="Distinct">Distinct</option>
            <option value="Indistinct">Indistinct</option>
            <option value="None">None</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-200">
                <th className="px-4 py-2 text-left font-semibold text-slate-700">Gemstone</th>
                <th className="px-4 py-2 text-center font-semibold text-slate-700">Cleavage</th>
                <th className="px-4 py-2 text-left font-semibold text-slate-700">Directions</th>
                <th className="px-4 py-2 text-left font-semibold text-slate-700">Fracture</th>
                <th className="px-4 py-2 text-left font-semibold text-slate-700">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGems.map(gem => (
                <tr key={gem.gem} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-900">{gem.gem}</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      gem.cleavage === 'Perfect' ? 'bg-red-100 text-red-700' :
                      gem.cleavage === 'Distinct' ? 'bg-amber-100 text-amber-700' :
                      gem.cleavage === 'Indistinct' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {gem.cleavage}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-700 text-xs">{gem.directions}</td>
                  <td className="px-4 py-2 text-slate-700 text-xs">{gem.fracture}</td>
                  <td className="px-4 py-2 text-slate-600 text-xs">{gem.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredGems.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-4">No gemstones found matching your criteria.</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-red-900 mb-2">Understanding Cleavage</h4>
          <ul className="text-sm text-red-800 space-y-1">
            <li>• <strong>Perfect</strong>: Splits easily along smooth planes</li>
            <li>• <strong>Distinct</strong>: Visible planes, moderate ease of splitting</li>
            <li>• <strong>Indistinct</strong>: Difficult to observe/achieve</li>
            <li>• <strong>None</strong>: No cleavage planes present</li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Cleavage vs Fracture</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Cleavage</strong>: Breaks along crystallographic planes</li>
            <li>• <strong>Fracture</strong>: Random breaking not related to structure</li>
            <li>• Cleavage surfaces are smooth and planar</li>
            <li>• Fracture surfaces are irregular and curved</li>
          </ul>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-amber-900 mb-2">Handling Gems with Perfect Cleavage</h4>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>• Avoid ultrasonic cleaners (vibrations can cause cleavage)</li>
          <li>• Use bezel or protective settings instead of prong settings</li>
          <li>• Avoid steam cleaning for gems with cleavage</li>
          <li>• Handle with extreme care during setting and sizing</li>
          <li>• Not recommended for rings (high-impact jewelry)</li>
        </ul>
      </div>
    </div>
  );
}
