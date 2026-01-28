/**
 * Mohs Hardness Scale Reference
 * Full-width layout: Mohs scale on left, searchable gem lookup on right (desktop).
 */

import { useState } from 'react';

interface MohsLevel {
  hardness: number;
  mineral: string;
  wearResistance: string;
}

interface GemHardness {
  name: string;
  hardness: number | string;
  wearability: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  notes: string;
}

const MOHS_SCALE: MohsLevel[] = [
  { hardness: 10, mineral: 'Diamond', wearResistance: 'Excellent for all jewelry' },
  { hardness: 9, mineral: 'Corundum (Ruby/Sapphire)', wearResistance: 'Excellent for all jewelry' },
  { hardness: 8, mineral: 'Topaz / Spinel', wearResistance: 'Excellent for daily wear' },
  { hardness: 7.5, mineral: 'Beryl (Emerald / Aquamarine)', wearResistance: 'Good for most jewelry' },
  { hardness: 7, mineral: 'Quartz', wearResistance: 'Good for most jewelry' },
  { hardness: 6.5, mineral: 'Tanzanite / Peridot', wearResistance: 'Fair — avoid rings' },
  { hardness: 6, mineral: 'Feldspar (Moonstone)', wearResistance: 'Fair — pendants/earrings' },
  { hardness: 5, mineral: 'Apatite', wearResistance: 'Poor — collector only' },
  { hardness: 4, mineral: 'Fluorite', wearResistance: 'Poor — collector only' },
  { hardness: 3, mineral: 'Calcite', wearResistance: 'Not suitable for jewelry' },
];

const COMMON_GEMS: GemHardness[] = [
  { name: 'Diamond', hardness: 10.0, wearability: 'Excellent', notes: 'Perfect cleavage — avoid sharp blows' },
  { name: 'Ruby', hardness: 9.0, wearability: 'Excellent', notes: 'No cleavage — extremely durable' },
  { name: 'Sapphire', hardness: 9.0, wearability: 'Excellent', notes: 'No cleavage — extremely durable' },
  { name: 'Alexandrite', hardness: 8.5, wearability: 'Excellent', notes: 'Good toughness' },
  { name: 'Spinel', hardness: 8.0, wearability: 'Excellent', notes: 'No cleavage — excellent toughness' },
  { name: 'Topaz', hardness: 8.0, wearability: 'Good', notes: 'Perfect cleavage — handle with care' },
  { name: 'Emerald', hardness: '7.5–8', wearability: 'Fair', notes: 'Usually included — avoid ultrasonic' },
  { name: 'Aquamarine', hardness: '7.5–8', wearability: 'Good', notes: 'Better toughness than emerald' },
  { name: 'Tourmaline', hardness: '7–7.5', wearability: 'Good', notes: 'Can be brittle — avoid sharp blows' },
  { name: 'Garnet', hardness: '6.5–7.5', wearability: 'Good', notes: 'Varies by type — generally durable' },
  { name: 'Amethyst', hardness: 7.0, wearability: 'Good', notes: 'Durable but can fade in sunlight' },
  { name: 'Peridot', hardness: '6.5–7', wearability: 'Fair', notes: 'Avoid rings — better for pendants' },
  { name: 'Tanzanite', hardness: '6–6.5', wearability: 'Fair', notes: 'Perfect cleavage — very fragile' },
  { name: 'Moonstone', hardness: '6–6.5', wearability: 'Fair', notes: 'Two cleavage directions — fragile' },
  { name: 'Opal', hardness: '5–6.5', wearability: 'Poor', notes: 'Hydrous — can crack with drying' },
  { name: 'Turquoise', hardness: '5–6', wearability: 'Poor', notes: 'Porous — avoid chemicals/heat' },
  { name: 'Pearl', hardness: '2.5–4.5', wearability: 'Poor', notes: 'Organic — avoid acids/cosmetics' },
];

const WEARABILITY_COLORS: Record<string, string> = {
  Excellent: 'bg-green-100 text-green-700',
  Good: 'bg-blue-100 text-blue-700',
  Fair: 'bg-amber-100 text-amber-700',
  Poor: 'bg-red-100 text-red-700',
};

export function HardnessReference() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWearability, setFilterWearability] = useState<string>('all');

  const filteredGems = COMMON_GEMS.filter(gem => {
    const matchesSearch = gem.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterWearability === 'all' || gem.wearability === filterWearability;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-5">
      {/* Two-column layout: Mohs scale | Gem lookup */}
      <div className="grid lg:grid-cols-[auto_1fr] gap-5">
        {/* Left: Mohs scale — compact table */}
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200">
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Mohs Scale</h4>
          </div>
          <table className="text-sm">
            <tbody>
              {MOHS_SCALE.map(level => (
                <tr key={level.hardness} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2 font-mono font-bold text-amber-600 text-center w-12">{level.hardness}</td>
                  <td className="px-3 py-2 font-medium text-slate-900 whitespace-nowrap">{level.mineral}</td>
                  <td className="px-3 py-2 text-xs text-slate-500 hidden lg:table-cell">{level.wearResistance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right: Searchable gem lookup */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search gemstone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <select
              value={filterWearability}
              onChange={(e) => setFilterWearability(e.target.value)}
              className="px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="all">All</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
            </select>
          </div>

          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Gem</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Hardness</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Wear</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredGems.map((gem, i) => (
                  <tr key={gem.name} className={`border-b border-slate-100 last:border-0 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                    <td className="px-3 py-2 font-medium text-slate-900">{gem.name}</td>
                    <td className="px-3 py-2 text-center font-mono text-slate-900">{gem.hardness}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${WEARABILITY_COLORS[gem.wearability]}`}>
                        {gem.wearability}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500">{gem.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredGems.length === 0 && (
              <p className="text-center text-slate-500 text-sm py-4">No matches found.</p>
            )}
          </div>
        </div>
      </div>

      {/* Info strip */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
        <span>• <strong>Hardness</strong> = resistance to scratching</span>
        <span>• <strong>Toughness</strong> = resistance to breaking (not the same thing)</span>
        <span>• Diamond is hard but has perfect cleavage — jade is softer but tougher</span>
      </div>
    </div>
  );
}
