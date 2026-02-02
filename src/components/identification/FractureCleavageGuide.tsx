/**
 * Fracture and Cleavage Visual Reference
 * Guide to cleavage directions and fracture patterns
 */

import { useState } from 'react';
import { Table } from '../ui';

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
    <div className="space-y-5">
      {/* Fracture types — responsive grid */}
      <div>
        <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Fracture Types</h4>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {FRACTURE_TYPES.map(fracture => (
            <div key={fracture.type} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <h5 className="font-semibold text-slate-900 text-xs mb-1">{fracture.type}</h5>
              <p className="text-xs text-slate-600 mb-1">{fracture.description}</p>
              <p className="text-xs text-slate-500">{fracture.examples}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cleavage reference — filter bar + full-width table */}
      <div>
        <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Cleavage Reference</h4>

        <div className="flex flex-wrap gap-2 items-end mb-3">
          <div className="flex-1 min-w-[180px]">
            <input
              type="text"
              placeholder="Search gemstone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            />
          </div>
          <div className="w-36 shrink-0">
            <select
              value={filterCleavage}
              onChange={(e) => setFilterCleavage(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            >
              <option value="all">All Cleavage</option>
              <option value="Perfect">Perfect</option>
              <option value="Distinct">Distinct</option>
              <option value="Indistinct">Indistinct</option>
              <option value="None">None</option>
            </select>
          </div>
          <span className="text-xs text-slate-400 shrink-0 pb-0.5">{filteredGems.length} gem{filteredGems.length !== 1 ? 's' : ''}</span>
        </div>

        {filteredGems.length > 0 ? (
          <Table
            columns={[
              { key: 'gem', header: 'Gemstone' },
              { key: 'cleavage', header: 'Cleavage', align: 'center' },
              { key: 'directions', header: 'Directions' },
              { key: 'fracture', header: 'Fracture' },
              { key: 'notes', header: 'Notes' },
            ]}
            rows={filteredGems.map(gem => ({
              gem: gem.gem,
              cleavage: (
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                  gem.cleavage === 'Perfect' ? 'bg-red-100 text-red-700' :
                  gem.cleavage === 'Distinct' ? 'bg-amber-100 text-amber-700' :
                  gem.cleavage === 'Indistinct' ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {gem.cleavage}
                </span>
              ),
              directions: <span className="text-xs">{gem.directions}</span>,
              fracture: <span className="text-xs">{gem.fracture}</span>,
              notes: <span className="text-xs text-slate-500">{gem.notes}</span>,
            }))}
            variant="default"
          />
        ) : (
          <div className="text-center text-slate-500 text-sm py-4 border border-slate-200 rounded-xl">
            No gemstones found matching your criteria.
          </div>
        )}
      </div>

      {/* Tips — compact inline strips */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
        <span>• <strong>Perfect</strong> cleavage splits easily along smooth planes</span>
        <span>• <strong>Cleavage</strong> = along crystal planes; <strong>Fracture</strong> = random breaking</span>
        <span>• Avoid ultrasonic cleaning for gems with perfect cleavage</span>
        <span>• Use bezel or protective settings for fragile gems</span>
      </div>
    </div>
  );
}
