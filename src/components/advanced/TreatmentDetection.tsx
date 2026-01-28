/**
 * Treatment Detection Reference
 * Visual and instrumental indicators for common gem treatments
 */

import { useState } from 'react';

interface Treatment {
  treatment: string;
  gems: string;
  visualIndicators: string;
  instrumentalTests: string;
  permanence: string;
  disclosure: string;
}

interface TreatmentType {
  name: string;
  description: string;
  purpose: string;
  detectability: 'Easy' | 'Moderate' | 'Difficult' | 'Very Difficult';
}

const TREATMENT_TYPES: TreatmentType[] = [
  {
    name: 'Heat Treatment',
    description: 'Controlled heating to improve color and clarity',
    purpose: 'Color improvement, inclusion dissolving',
    detectability: 'Moderate'
  },
  {
    name: 'Fracture Filling',
    description: 'Glass/resin filling of surface-reaching fractures',
    purpose: 'Clarity enhancement',
    detectability: 'Easy'
  },
  {
    name: 'Dyeing',
    description: 'Adding color through dyes or stains',
    purpose: 'Color enhancement',
    detectability: 'Easy'
  },
  {
    name: 'Oiling/Resin',
    description: 'Filling fissures with oil or epoxy resin',
    purpose: 'Clarity enhancement (especially emerald)',
    detectability: 'Moderate'
  },
  {
    name: 'Irradiation',
    description: 'Exposure to radiation to alter color',
    purpose: 'Color change (blue topaz, colored diamonds)',
    detectability: 'Difficult'
  },
  {
    name: 'Diffusion',
    description: 'Surface or bulk diffusion of color-causing elements',
    purpose: 'Color enhancement',
    detectability: 'Moderate'
  },
  {
    name: 'Coating',
    description: 'Thin surface coating for color/effect',
    purpose: 'Color, iridescence, or protective layer',
    detectability: 'Easy'
  },
  {
    name: 'HPHT',
    description: 'High Pressure High Temperature processing',
    purpose: 'Color improvement (diamonds, synthetic gems)',
    detectability: 'Very Difficult'
  },
];

const TREATMENT_INDICATORS: Treatment[] = [
  {
    treatment: 'Heat (Corundum)',
    gems: 'Ruby, Sapphire',
    visualIndicators: 'Silk dissolution, rounded inclusions, color zoning changes, stress fractures',
    instrumentalTests: 'Microscopy (inclusion changes), spectroscopy (Fe³⁺ peaks)',
    permanence: 'Permanent',
    disclosure: 'Standard practice - disclosure varies by market'
  },
  {
    treatment: 'Beryllium Diffusion',
    gems: 'Sapphire (orange padparadscha)',
    visualIndicators: 'Color concentration at facet junctions, uneven color',
    instrumentalTests: 'EDXRF (beryllium detection), FTIR, UV-Vis',
    permanence: 'Permanent',
    disclosure: 'Required - significantly affects value'
  },
  {
    treatment: 'Fracture Filling (Glass)',
    gems: 'Ruby, Diamond',
    visualIndicators: 'Flash effect, color flashes in fissures, surface residue',
    instrumentalTests: 'Microscopy (gas bubbles, flow structures)',
    permanence: 'Not permanent - avoid heat/ultrasonic',
    disclosure: 'Required - major value impact'
  },
  {
    treatment: 'Oiling (Emerald)',
    gems: 'Emerald',
    visualIndicators: 'Oil in fissures (UV fluorescence), surface residue',
    instrumentalTests: 'UV lamp (yellow-green fluorescence), FTIR',
    permanence: 'Not permanent - oil can dry out',
    disclosure: 'Standard practice - grade depends on extent'
  },
  {
    treatment: 'Irradiation + Heat',
    gems: 'Blue Topaz, Fancy Diamonds',
    visualIndicators: 'Uniform color, specific color types (Swiss/London blue)',
    instrumentalTests: 'Spectroscopy (radiation-induced defects), color centers',
    permanence: 'Permanent (stable)',
    disclosure: 'Required for blue topaz'
  },
  {
    treatment: 'Dyeing',
    gems: 'Jade, Chalcedony, Pearls',
    visualIndicators: 'Color in pores/fractures, unnatural colors, concentrations',
    instrumentalTests: 'Microscopy (dye concentrations), Chelsea filter, spectroscopy',
    permanence: 'Not permanent - can fade',
    disclosure: 'Required - major value impact'
  },
  {
    treatment: 'Coating',
    gems: 'Topaz (Mystic), Diamond',
    visualIndicators: 'Wear at facet edges, scratches revealing base color',
    instrumentalTests: 'Microscopy (edge chipping), spectroscopy',
    permanence: 'Not permanent - wears off',
    disclosure: 'Required - temporary treatment'
  },
  {
    treatment: 'Lattice Diffusion',
    gems: 'Sapphire (full color)',
    visualIndicators: 'Even color distribution, possible surface concentration',
    instrumentalTests: 'EDXRF (Ti, Fe detection at surface), FTIR',
    permanence: 'Permanent',
    disclosure: 'Required - affects value'
  },
  {
    treatment: 'Clarity Enhancement (Diamonds)',
    gems: 'Diamond',
    visualIndicators: 'Flash effect in fractures, laser drill holes',
    instrumentalTests: 'Microscopy (drill holes, filler in fractures)',
    permanence: 'Varies - laser drilling permanent, filling not',
    disclosure: 'Required - significant value reduction'
  },
];

export function TreatmentDetection() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGem, setSelectedGem] = useState<string>('all');

  const uniqueGems = ['all', ...new Set(TREATMENT_INDICATORS.flatMap(t => t.gems.split(', ')))];

  const filteredTreatments = TREATMENT_INDICATORS.filter(treatment => {
    const matchesSearch = treatment.treatment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          treatment.gems.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGem = selectedGem === 'all' || treatment.gems.includes(selectedGem);
    return matchesSearch && matchesGem;
  });

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Common Treatment Types</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          {TREATMENT_TYPES.map(type => (
            <div key={type.name} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <div className="flex items-start justify-between mb-1">
                <h5 className="font-semibold text-slate-900 text-sm">{type.name}</h5>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  type.detectability === 'Easy' ? 'bg-green-100 text-green-700' :
                  type.detectability === 'Moderate' ? 'bg-blue-100 text-blue-700' :
                  type.detectability === 'Difficult' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {type.detectability}
                </span>
              </div>
              <p className="text-xs text-slate-700 mb-1">{type.description}</p>
              <p className="text-xs text-slate-600">
                <strong>Purpose:</strong> {type.purpose}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Detection Indicators</h4>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder="Search treatment or gem..."
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
          {filteredTreatments.map((treatment, idx) => (
            <div key={idx} className="p-4 rounded-lg border border-slate-200 bg-white hover:border-crystal-300 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h5 className="font-semibold text-slate-900">{treatment.treatment}</h5>
                  <p className="text-xs text-slate-500">{treatment.gems}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  treatment.permanence.startsWith('Permanent') ? 'bg-green-100 text-green-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {treatment.permanence.startsWith('Permanent') ? 'Permanent' : 'Temporary'}
                </span>
              </div>

              <div className="grid gap-2 text-xs">
                <div>
                  <strong className="text-slate-700">Visual Indicators:</strong>
                  <p className="text-slate-600 mt-0.5">{treatment.visualIndicators}</p>
                </div>
                <div>
                  <strong className="text-slate-700">Instrumental Tests:</strong>
                  <p className="text-slate-600 mt-0.5">{treatment.instrumentalTests}</p>
                </div>
                <div>
                  <strong className="text-slate-700">Disclosure:</strong>
                  <p className="text-slate-600 mt-0.5">{treatment.disclosure}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTreatments.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-4">No treatments found matching your criteria.</p>
        )}
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-red-900 mb-2">⚠️ Important Disclosure Requirements</h4>
        <ul className="text-sm text-red-800 space-y-1">
          <li>• All treatments must be disclosed to buyers in most markets</li>
          <li>• Undisclosed treatments can result in legal liability</li>
          <li>• Some treatments (fracture filling, dyeing) drastically reduce value</li>
          <li>• Standard treatments (heat in corundum) may not require disclosure in some markets</li>
          <li>• When in doubt, always disclose - transparency builds trust</li>
        </ul>
      </div>
    </div>
  );
}
