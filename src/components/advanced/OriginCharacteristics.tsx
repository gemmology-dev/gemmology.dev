/**
 * Origin Determination Reference
 * Geographic origin characteristics for major gem types
 */

import { useState } from 'react';

interface OriginData {
  gem: string;
  origin: string;
  colorCharacteristics: string;
  inclusionFingerprints: string;
  chemicalIndicators: string;
  premium: string;
}

interface OriginNote {
  title: string;
  description: string;
  importance: 'High' | 'Medium' | 'Low';
}

const ORIGIN_DATA: OriginData[] = [
  {
    gem: 'Ruby',
    origin: 'Myanmar (Burma)',
    colorCharacteristics: 'Pure red "pigeon blood", strong fluorescence',
    inclusionFingerprints: 'Silk (rutile needles), calcite crystals, liquid feathers',
    chemicalIndicators: 'Low Fe content, high Cr, specific trace element ratios',
    premium: 'Highest - 20-40% premium over other origins'
  },
  {
    gem: 'Ruby',
    origin: 'Mozambique',
    colorCharacteristics: 'Purplish-red to orangey-red, moderate fluorescence',
    inclusionFingerprints: 'Amphibole needles, graphite platelets, zircon crystals',
    chemicalIndicators: 'Higher Fe content than Burma, V present',
    premium: 'Moderate - 10-20% below Burma equivalent'
  },
  {
    gem: 'Sapphire',
    origin: 'Kashmir',
    colorCharacteristics: 'Velvety blue, sleepy/milky appearance, strong saturation',
    inclusionFingerprints: 'Fine silk creating velvety appearance, negative crystals',
    chemicalIndicators: 'Specific Fe/Ti ratios, low Mg',
    premium: 'Highest - 50-100% premium, rare and sought-after'
  },
  {
    gem: 'Sapphire',
    origin: 'Myanmar (Burma)',
    colorCharacteristics: 'Royal blue, strong saturation, excellent transparency',
    inclusionFingerprints: 'Silk (rutile needles), calcite, liquid inclusions',
    chemicalIndicators: 'Similar to Kashmir but distinguishable by inclusion scene',
    premium: 'High - 30-50% premium'
  },
  {
    gem: 'Sapphire',
    origin: 'Sri Lanka (Ceylon)',
    colorCharacteristics: 'Light to medium blue, good transparency, pastel tones',
    inclusionFingerprints: 'Zircon halos, liquid inclusions, silk',
    chemicalIndicators: 'Low Fe content, often heat-treated',
    premium: 'Moderate - 10-20% premium for fine color'
  },
  {
    gem: 'Emerald',
    origin: 'Colombia',
    colorCharacteristics: 'Pure green (no blue), warm tone, high saturation',
    inclusionFingerprints: 'Three-phase inclusions (liquid, gas, crystal), pyrite, calcite',
    chemicalIndicators: 'Cr-colored, low Fe, specific trace elements',
    premium: 'Highest - 30-50% premium, especially Muzo'
  },
  {
    gem: 'Emerald',
    origin: 'Zambia',
    colorCharacteristics: 'Bluish-green, cool tone, good clarity',
    inclusionFingerprints: 'Mica plates, tremolite needles, two-phase inclusions',
    chemicalIndicators: 'Fe + Cr colored, higher Fe than Colombia',
    premium: 'Moderate - competitive pricing for fine stones'
  },
  {
    gem: 'Emerald',
    origin: 'Brazil',
    colorCharacteristics: 'Light to medium green, yellowish tones possible',
    inclusionFingerprints: 'Mica, biotite, two-phase inclusions',
    chemicalIndicators: 'Variable Cr/V/Fe content',
    premium: 'Lower - 20-30% below Colombian equivalent'
  },
  {
    gem: 'Paraíba Tourmaline',
    origin: 'Brazil (Paraíba)',
    colorCharacteristics: 'Neon blue to green, electric appearance',
    inclusionFingerprints: 'Liquid inclusions, growth tubes',
    chemicalIndicators: 'High Cu content (0.3-1.5%), Mn present',
    premium: 'Highest - significant premium for true Paraíba'
  },
  {
    gem: 'Paraíba Tourmaline',
    origin: 'Mozambique',
    colorCharacteristics: 'Similar neon colors, slightly different hue range',
    inclusionFingerprints: 'Similar to Brazil but distinguishable by experts',
    chemicalIndicators: 'Cu content (often lower than Brazil), trace differences',
    premium: 'High - 30-50% below Brazilian stones'
  },
  {
    gem: 'Spinel',
    origin: 'Myanmar (Burma)',
    colorCharacteristics: 'Vivid red "Jedi" spinel, excellent transparency',
    inclusionFingerprints: 'Octahedral negative crystals, calcite, dolomite',
    chemicalIndicators: 'Low Fe, high Cr (for red)',
    premium: 'High - 30-40% premium for fine reds'
  },
  {
    gem: 'Tanzanite',
    origin: 'Tanzania (only source)',
    colorCharacteristics: 'Blue-violet, trichroic, heat-treated for blue',
    inclusionFingerprints: 'Graphite, apatite needles, liquid inclusions',
    chemicalIndicators: 'V-colored, specific to Merelani Hills deposit',
    premium: 'N/A - single origin, premium for fine color/size'
  },
];

const ORIGIN_NOTES: OriginNote[] = [
  {
    title: 'Geographic Origin ≠ Quality',
    description: 'Origin premiums exist due to rarity and historical reputation, not inherent quality. A fine Mozambique ruby can be superior to a poor Burma ruby.',
    importance: 'High'
  },
  {
    title: 'Laboratory Reports Required',
    description: 'Origin determination requires advanced laboratory testing (FTIR, LA-ICP-MS, UV-Vis spectroscopy). Visual inspection alone is insufficient.',
    importance: 'High'
  },
  {
    title: 'Origin Certainty Levels',
    description: 'Labs use terms like "determination," "indication," or "opinion" based on confidence level. Not all stones can be definitively origin-determined.',
    importance: 'Medium'
  },
  {
    title: 'Heat Treatment Complicates Origin',
    description: 'Heat treatment can alter or destroy diagnostic inclusions, making origin determination more difficult or impossible.',
    importance: 'Medium'
  },
];

export function OriginCharacteristics() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGem, setSelectedGem] = useState<string>('all');

  const uniqueGems = ['all', ...new Set(ORIGIN_DATA.map(d => d.gem))];

  const filteredData = ORIGIN_DATA.filter(data => {
    const matchesSearch = data.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          data.gem.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGem = selectedGem === 'all' || data.gem === selectedGem;
    return matchesSearch && matchesGem;
  });

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Important Considerations</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          {ORIGIN_NOTES.map(note => (
            <div key={note.title} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <div className="flex items-start justify-between mb-1">
                <h5 className="font-semibold text-slate-900 text-sm">{note.title}</h5>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  note.importance === 'High' ? 'bg-red-100 text-red-700' :
                  note.importance === 'Medium' ? 'bg-amber-100 text-amber-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {note.importance}
                </span>
              </div>
              <p className="text-xs text-slate-700">{note.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Origin Characteristics Database</h4>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder="Search gem or origin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-crystal-500"
          />
          <select
            value={selectedGem}
            onChange={(e) => setSelectedGem(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-crystal-500"
          >
            {uniqueGems.map(gem => (
              <option key={gem} value={gem}>
                {gem === 'all' ? 'All Gems' : gem}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          {filteredData.map((data, idx) => (
            <div key={idx} className="p-4 rounded-lg border border-slate-200 bg-white hover:border-crystal-300 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h5 className="font-semibold text-slate-900">{data.gem}</h5>
                  <p className="text-sm text-crystal-600 font-medium">{data.origin}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap ${
                  data.premium.startsWith('Highest') ? 'bg-green-100 text-green-700' :
                  data.premium.startsWith('High') ? 'bg-blue-100 text-blue-700' :
                  data.premium.startsWith('Moderate') ? 'bg-amber-100 text-amber-700' :
                  data.premium.startsWith('Lower') ? 'bg-slate-100 text-slate-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {data.premium.split(' - ')[0]}
                </span>
              </div>

              <div className="grid gap-2 text-xs">
                <div>
                  <strong className="text-slate-700">Color Characteristics:</strong>
                  <p className="text-slate-600 mt-0.5">{data.colorCharacteristics}</p>
                </div>
                <div>
                  <strong className="text-slate-700">Inclusion Fingerprints:</strong>
                  <p className="text-slate-600 mt-0.5">{data.inclusionFingerprints}</p>
                </div>
                <div>
                  <strong className="text-slate-700">Chemical Indicators:</strong>
                  <p className="text-slate-600 mt-0.5">{data.chemicalIndicators}</p>
                </div>
                <div>
                  <strong className="text-slate-700">Market Premium:</strong>
                  <p className="text-slate-600 mt-0.5">{data.premium}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredData.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-4">No origin data found matching your criteria.</p>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Origin Determination Methods</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>FTIR Spectroscopy</strong>: Detects water content, structural features</li>
          <li>• <strong>UV-Vis Spectroscopy</strong>: Analyzes color-causing elements and ratios</li>
          <li>• <strong>LA-ICP-MS</strong>: Trace element "chemical fingerprinting"</li>
          <li>• <strong>Microscopy</strong>: Inclusion scene examination</li>
          <li>• <strong>Oxygen Isotope Analysis</strong>: Distinguishes geological environments (research tool)</li>
        </ul>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-amber-900 mb-2">⚠️ Commercial Considerations</h4>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>• Origin reports from reputable labs (GIA, Gübelin, SSEF, AGL) are essential</li>
          <li>• Premiums vary by market - Asian markets often pay higher for certain origins</li>
          <li>• Heat treatment disclosure affects origin premium (unheated commands higher prices)</li>
          <li>• New deposits constantly emerge, changing market dynamics</li>
          <li>• Focus on beauty and quality, not just origin certificates</li>
        </ul>
      </div>
    </div>
  );
}
