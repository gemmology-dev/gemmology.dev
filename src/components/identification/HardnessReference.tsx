/**
 * Mohs Hardness Scale Reference
 * Includes wear resistance notes and gemstone hardness lookup
 */

import { useState } from 'react';

interface MohsLevel {
  hardness: number;
  mineral: string;
  description: string;
  wearResistance: string;
}

interface GemHardness {
  name: string;
  hardness: number | string;
  wearability: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  notes: string;
}

const MOHS_SCALE: MohsLevel[] = [
  { hardness: 10, mineral: 'Diamond', description: 'Hardest natural material', wearResistance: 'Excellent for all jewelry' },
  { hardness: 9, mineral: 'Corundum (Ruby/Sapphire)', description: 'Extremely durable', wearResistance: 'Excellent for all jewelry' },
  { hardness: 8, mineral: 'Topaz/Spinel', description: 'Very durable', wearResistance: 'Excellent for daily wear' },
  { hardness: 7.5, mineral: 'Beryl (Emerald/Aquamarine)', description: 'Durable with care', wearResistance: 'Good for most jewelry' },
  { hardness: 7, mineral: 'Quartz', description: 'Resistant to scratching', wearResistance: 'Good for most jewelry' },
  { hardness: 6.5, mineral: 'Tanzanite/Peridot', description: 'Moderate durability', wearResistance: 'Fair - avoid rings' },
  { hardness: 6, mineral: 'Feldspar (Moonstone)', description: 'Easily scratched', wearResistance: 'Fair - pendants/earrings' },
  { hardness: 5, mineral: 'Apatite', description: 'Fragile', wearResistance: 'Poor - collector only' },
  { hardness: 4, mineral: 'Fluorite', description: 'Very fragile', wearResistance: 'Poor - collector only' },
  { hardness: 3, mineral: 'Calcite', description: 'Extremely fragile', wearResistance: 'Not suitable for jewelry' },
];

const COMMON_GEMS: GemHardness[] = [
  { name: 'Diamond', hardness: 10.0, wearability: 'Excellent', notes: 'Perfect cleavage - avoid sharp blows' },
  { name: 'Ruby', hardness: 9.0, wearability: 'Excellent', notes: 'No cleavage - extremely durable' },
  { name: 'Sapphire', hardness: 9.0, wearability: 'Excellent', notes: 'No cleavage - extremely durable' },
  { name: 'Alexandrite', hardness: 8.5, wearability: 'Excellent', notes: 'Good toughness' },
  { name: 'Chrysoberyl', hardness: 8.5, wearability: 'Excellent', notes: 'Excellent toughness' },
  { name: 'Spinel', hardness: 8.0, wearability: 'Excellent', notes: 'No cleavage - excellent toughness' },
  { name: 'Topaz', hardness: 8.0, wearability: 'Good', notes: 'Perfect cleavage - handle with care' },
  { name: 'Emerald', hardness: '7.5-8', wearability: 'Fair', notes: 'Usually included - avoid ultrasonic' },
  { name: 'Aquamarine', hardness: '7.5-8', wearability: 'Good', notes: 'Better toughness than emerald' },
  { name: 'Tourmaline', hardness: '7-7.5', wearability: 'Good', notes: 'Can be brittle - avoid sharp blows' },
  { name: 'Garnet', hardness: '6.5-7.5', wearability: 'Good', notes: 'Varies by type - generally durable' },
  { name: 'Amethyst', hardness: 7.0, wearability: 'Good', notes: 'Durable but can fade in sunlight' },
  { name: 'Citrine', hardness: 7.0, wearability: 'Good', notes: 'Durable quartz variety' },
  { name: 'Peridot', hardness: '6.5-7', wearability: 'Fair', notes: 'Avoid rings - better for pendants' },
  { name: 'Tanzanite', hardness: '6-6.5', wearability: 'Fair', notes: 'Perfect cleavage - very fragile' },
  { name: 'Moonstone', hardness: '6-6.5', wearability: 'Fair', notes: 'Two cleavage directions - fragile' },
  { name: 'Opal', hardness: '5-6.5', wearability: 'Poor', notes: 'Hydrous - can crack/craze with drying' },
  { name: 'Turquoise', hardness: '5-6', wearability: 'Poor', notes: 'Porous - avoid chemicals/heat' },
  { name: 'Pearl', hardness: '2.5-4.5', wearability: 'Poor', notes: 'Organic - avoid acids/cosmetics/heat' },
];

export function HardnessReference() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWearability, setFilterWearability] = useState<string>('all');

  const filteredGems = COMMON_GEMS.filter(gem => {
    const matchesSearch = gem.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterWearability === 'all' || gem.wearability === filterWearability;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Mohs Hardness Scale</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-200">
                <th className="px-4 py-2 text-left font-semibold text-slate-700">Hardness</th>
                <th className="px-4 py-2 text-left font-semibold text-slate-700">Reference Mineral</th>
                <th className="px-4 py-2 text-left font-semibold text-slate-700">Description</th>
                <th className="px-4 py-2 text-left font-semibold text-slate-700">Wear Resistance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOHS_SCALE.map(level => (
                <tr key={level.hardness} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-mono font-semibold text-crystal-600">{level.hardness}</td>
                  <td className="px-4 py-2 font-medium text-slate-900">{level.mineral}</td>
                  <td className="px-4 py-2 text-slate-700">{level.description}</td>
                  <td className="px-4 py-2 text-slate-600 text-xs">{level.wearResistance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Gemstone Hardness Lookup</h4>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder="Search gemstone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-crystal-500"
          />
          <select
            value={filterWearability}
            onChange={(e) => setFilterWearability(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-crystal-500"
          >
            <option value="all">All Wearability</option>
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="Poor">Poor</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-200">
                <th className="px-4 py-2 text-left font-semibold text-slate-700">Gemstone</th>
                <th className="px-4 py-2 text-center font-semibold text-slate-700">Hardness</th>
                <th className="px-4 py-2 text-center font-semibold text-slate-700">Wearability</th>
                <th className="px-4 py-2 text-left font-semibold text-slate-700">Special Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGems.map(gem => (
                <tr key={gem.name} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-900">{gem.name}</td>
                  <td className="px-4 py-2 text-center font-mono text-slate-900">{gem.hardness}</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      gem.wearability === 'Excellent' ? 'bg-green-100 text-green-700' :
                      gem.wearability === 'Good' ? 'bg-blue-100 text-blue-700' :
                      gem.wearability === 'Fair' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {gem.wearability}
                    </span>
                  </td>
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

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Hardness vs Toughness</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Hardness</strong> = resistance to scratching (Mohs scale)</li>
          <li>• <strong>Toughness</strong> = resistance to breaking/chipping</li>
          <li>• Diamond has high hardness but lower toughness (perfect cleavage)</li>
          <li>• Jade has moderate hardness (6-7) but excellent toughness (no cleavage)</li>
        </ul>
      </div>
    </div>
  );
}
