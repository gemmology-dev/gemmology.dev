/**
 * Heavy Liquid SG Reference
 * Which liquids for which gem SG ranges
 */

import { useState, useEffect, useMemo } from 'react';
import { usePagination } from '../../hooks/usePagination';
import { getMineralsWithSGPaginated, type Mineral, type PaginatedResult } from '../../lib/db';
import { PaginatedTable } from '../ui';

interface HeavyLiquid {
  name: string;
  sg: number;
  notes: string;
  safety: string;
}

const LIQUIDS: HeavyLiquid[] = [
  {
    name: 'Water',
    sg: 1.00,
    notes: 'Baseline reference',
    safety: 'Safe',
  },
  {
    name: 'Toluene',
    sg: 0.87,
    notes: 'For very light organics',
    safety: 'Toxic - use in fume hood',
  },
  {
    name: 'Bromoform',
    sg: 2.89,
    notes: 'Lower than MI',
    safety: 'Toxic - use gloves',
  },
  {
    name: 'Methylene Iodide (Pure)',
    sg: 3.32,
    notes: 'Standard heavy liquid',
    safety: 'Very toxic - use gloves, fume hood',
  },
  {
    name: 'MI + Toluene (3.06)',
    sg: 3.06,
    notes: 'Diluted for tourmaline separation',
    safety: 'Toxic - use gloves, fume hood',
  },
  {
    name: 'Clerici Solution',
    sg: 4.25,
    notes: 'High density option',
    safety: 'Toxic - corrosive',
  },
];

// Fallback data if database is unavailable
const FALLBACK_GEMS = [
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
  const [loading, setLoading] = useState(true);
  const [dbAvailable, setDbAvailable] = useState(false);
  const [paginatedData, setPaginatedData] = useState<PaginatedResult<Mineral> | null>(null);

  const { params, onPageChange, onPageSizeChange } = usePagination<Mineral>({
    initialPageSize: 15,
  });

  // Fetch paginated data from database
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const result = await getMineralsWithSGPaginated(params);
        setPaginatedData(result);
        setDbAvailable(result.pagination.total > 0);
      } catch (err) {
        console.warn('Failed to load SG data:', err);
        setDbAvailable(false);
        setPaginatedData(null);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [params]);

  // Convert database minerals to simple gem format
  const gems = useMemo(() => {
    if (dbAvailable && paginatedData && paginatedData.data.length > 0) {
      return paginatedData.data.map(m => ({
        name: m.name,
        sg: m.sg_min && m.sg_max ? (m.sg_min + m.sg_max) / 2 : 0,
      })).filter(g => g.sg > 0).sort((a, b) => a.sg - b.sg);
    }
    return FALLBACK_GEMS;
  }, [dbAvailable, paginatedData]);

  // Compute floats and sinks for a given liquid SG
  const getFloatsAndSinks = (liquidSG: number) => {
    const floats = gems.filter(g => g.sg < liquidSG).slice(0, 8);
    const sinks = gems.filter(g => g.sg >= liquidSG).slice(0, 8);
    return { floats, sinks };
  };

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
          {LIQUIDS.map((liquid) => {
            const { floats, sinks } = getFloatsAndSinks(liquid.sg);
            return (
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
                    {floats.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-green-700 mb-2">↑ Floats (Lower SG)</div>
                        <div className="space-y-1">
                          {floats.map((gem) => (
                            <div key={gem.name} className="text-sm text-slate-700 bg-green-50 px-2 py-1 rounded">
                              {gem.name} ({gem.sg.toFixed(2)})
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {sinks.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-red-700 mb-2">↓ Sinks (Higher SG)</div>
                        <div className="space-y-1">
                          {sinks.map((gem) => (
                            <div key={gem.name} className="text-sm text-slate-700 bg-red-50 px-2 py-1 rounded">
                              {gem.name} ({gem.sg.toFixed(2)})
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Gem SG Reference</h4>
        <PaginatedTable
          columns={[
            { key: 'name', header: 'Gem' },
            { key: 'sg', header: 'SG', mono: true },
            { key: 'test', header: 'Liquid Test' },
          ]}
          data={paginatedData}
          rowMapper={(m: Mineral) => {
            const sg = m.sg_min && m.sg_max ? (m.sg_min + m.sg_max) / 2 : 0;
            return {
              name: m.name,
              sg: sg.toFixed(2),
              test: sg < 2.89 ? 'Floats in bromoform (2.89)' :
                    sg < 3.32 ? 'Sinks in bromoform, floats in MI (3.32)' :
                    sg < 4.25 ? 'Sinks in MI, floats in Clerici (4.25)' :
                    'Sinks in Clerici solution',
            };
          }}
          loading={loading}
          emptyMessage="No SG data available."
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          showPageSize
          showTotalBadge
          variant="minimal"
        />
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

      <div className="text-sm text-slate-600">
        <a
          href="/learn/equipment/other-tools"
          className="text-crystal-600 hover:text-crystal-700 underline"
        >
          Learn more about heavy liquids and SG measurement →
        </a>
      </div>
    </div>
  );
}
