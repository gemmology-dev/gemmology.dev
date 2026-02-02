/**
 * Dichroscope Results Lookup
 * Full-width layout: filter bar across the top, matching gems in a responsive grid below.
 */

import { useState, useMemo, useEffect } from 'react';
import { usePagination } from '../../hooks/usePagination';
import { getMineralsWithPleochroismPaginated, type Mineral, type PaginatedResult } from '../../lib/db';
import { Pagination } from '../ui';

interface DichroscopeData {
  gem: string;
  color1: string;
  color2: string;
  color3?: string;
  strength: string;
  notes: string;
}

// Fallback data if database doesn't have structured pleochroism
const FALLBACK_DICHROIC_GEMS: DichroscopeData[] = [
  { gem: 'Ruby', color1: 'Red', color2: 'Orange-red', strength: 'Strong', notes: 'Best seen in thick stones' },
  { gem: 'Sapphire (Blue)', color1: 'Blue', color2: 'Greenish-blue', strength: 'Strong', notes: 'Varies with saturation' },
  { gem: 'Emerald', color1: 'Blue-green', color2: 'Yellow-green', strength: 'Moderate', notes: 'More visible in darker stones' },
  { gem: 'Alexandrite', color1: 'Red/Purple', color2: 'Orange/Green', color3: 'Green', strength: 'Very Strong', notes: 'Color change + pleochroism' },
  { gem: 'Tanzanite', color1: 'Blue/Violet', color2: 'Purple/Red', color3: 'Bronze', strength: 'Very Strong', notes: 'Trichroic — see 3 colors' },
  { gem: 'Tourmaline (Green)', color1: 'Dark green', color2: 'Light green', strength: 'Strong', notes: 'Best down c-axis' },
  { gem: 'Tourmaline (Pink)', color1: 'Dark pink', color2: 'Light pink', strength: 'Strong', notes: 'Visible in most directions' },
  { gem: 'Iolite', color1: 'Violet-blue', color2: 'Pale yellow', color3: 'Colorless', strength: 'Very Strong', notes: 'Dramatic color shift' },
  { gem: 'Andalusite', color1: 'Red-brown', color2: 'Yellow-green', color3: 'Green', strength: 'Very Strong', notes: 'Distinctive colors' },
  { gem: 'Kunzite', color1: 'Violet', color2: 'Colorless/Pink', strength: 'Strong', notes: 'Fades in light' },
  { gem: 'Peridot', color1: 'Green', color2: 'Yellow-green', strength: 'Weak', notes: 'Subtle difference' },
  { gem: 'Aquamarine', color1: 'Blue', color2: 'Colorless/Pale blue', strength: 'Weak', notes: 'Often not visible' },
  { gem: 'Topaz (Blue)', color1: 'Colorless', color2: 'Pale blue', strength: 'Weak', notes: 'Difficult to detect' },
  { gem: 'Morganite', color1: 'Pink', color2: 'Pale pink', strength: 'Weak', notes: 'Requires good stone' },
];

// Map database strength values to display format
const STRENGTH_MAP: Record<string, string> = {
  'very_strong': 'Very Strong',
  'strong': 'Strong',
  'moderate': 'Moderate',
  'weak': 'Weak',
};

const STRENGTH_COLORS: Record<string, string> = {
  'Very Strong': 'bg-red-100 text-red-700',
  'Strong': 'bg-orange-100 text-orange-700',
  'Moderate': 'bg-yellow-100 text-yellow-700',
  'Weak': 'bg-slate-100 text-slate-600',
};

export function DichroscopeResults() {
  const [color1, setColor1] = useState('');
  const [color2, setColor2] = useState('');
  const [strengthFilter, setStrengthFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [dbAvailable, setDbAvailable] = useState(false);
  const [paginatedData, setPaginatedData] = useState<PaginatedResult<Mineral> | null>(null);

  const { params, onPageChange, onPageSizeChange, resetPage } = usePagination<Mineral>({
    initialPageSize: 15,
  });

  // Fetch paginated data from database
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const result = await getMineralsWithPleochroismPaginated(params);
        setPaginatedData(result);
        setDbAvailable(result.pagination.total > 0);
      } catch (err) {
        console.warn('Failed to load pleochroism data:', err);
        setDbAvailable(false);
        setPaginatedData(null);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [params]);

  // Reset to first page when filters change
  useEffect(() => {
    resetPage();
  }, [color1, color2, strengthFilter, resetPage]);

  // Convert database minerals to dichroscope display format
  const dichroicGems = useMemo((): DichroscopeData[] => {
    if (dbAvailable && paginatedData && paginatedData.data.length > 0) {
      return paginatedData.data
        .filter(m => m.pleochroism_color1 && m.pleochroism_color2)
        .map(m => ({
          gem: m.name,
          color1: m.pleochroism_color1 || '',
          color2: m.pleochroism_color2 || '',
          color3: m.pleochroism_color3 || undefined,
          strength: STRENGTH_MAP[m.pleochroism_strength || ''] || 'Moderate',
          notes: m.pleochroism_notes || '',
        }));
    }
    return FALLBACK_DICHROIC_GEMS;
  }, [dbAvailable, paginatedData]);

  const filtered = dichroicGems.filter(gem => {
    const allColors = [gem.color1, gem.color2, gem.color3].filter(Boolean).join(' ').toLowerCase();
    const matchColor1 = !color1 || allColors.includes(color1.toLowerCase());
    const matchColor2 = !color2 || allColors.includes(color2.toLowerCase());
    const matchStrength = strengthFilter === 'all' || gem.strength.toLowerCase() === strengthFilter;
    return matchColor1 && matchColor2 && matchStrength;
  });

  return (
    <div className="space-y-5">
      {/* Filter bar — single row across full width */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-semibold text-slate-600 mb-1">First Color</label>
          <input
            type="text"
            value={color1}
            onChange={(e) => setColor1(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
            placeholder="e.g., blue, red"
          />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Second Color</label>
          <input
            type="text"
            value={color2}
            onChange={(e) => setColor2(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
            placeholder="e.g., greenish-blue"
          />
        </div>
        <div className="w-36 shrink-0">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Strength</label>
          <select
            value={strengthFilter}
            onChange={(e) => setStrengthFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
          >
            <option value="all">All</option>
            <option value="very strong">Very Strong</option>
            <option value="strong">Strong</option>
            <option value="moderate">Moderate</option>
            <option value="weak">Weak</option>
          </select>
        </div>
        <div className="flex items-center gap-2 shrink-0 pb-1">
          <span className="text-xs text-slate-400">{filtered.length} gem{filtered.length !== 1 ? 's' : ''}</span>
          {dbAvailable && paginatedData && (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
              {paginatedData.pagination.total} in database
            </span>
          )}
        </div>
      </div>

      {/* Results — responsive grid */}
      {loading ? (
        <div className="text-center py-6 text-slate-500 text-sm">Loading pleochroism data...</div>
      ) : filtered.length > 0 ? (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((gem, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-white hover:border-purple-300 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h5 className="font-semibold text-slate-900 text-sm">{gem.gem}</h5>
                  <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${STRENGTH_COLORS[gem.strength] || 'bg-slate-100 text-slate-600'}`}>
                    {gem.strength}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs mb-1.5">
                  <div>
                    <span className="text-slate-500">1:</span>{' '}
                    <span className="font-medium text-slate-800">{gem.color1}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">2:</span>{' '}
                    <span className="font-medium text-slate-800">{gem.color2}</span>
                  </div>
                  {gem.color3 && (
                    <div>
                      <span className="text-slate-500">3:</span>{' '}
                      <span className="font-medium text-slate-800">{gem.color3}</span>
                      <span className="text-purple-500 ml-1">(trichroic)</span>
                    </div>
                  )}
                </div>
                {gem.notes && <p className="text-xs text-slate-500">{gem.notes}</p>}
              </div>
            ))}
          </div>
          {/* Pagination */}
          {paginatedData && paginatedData.pagination.totalPages > 1 && (
            <Pagination
              pagination={paginatedData.pagination}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
              showPageSize
            />
          )}
        </>
      ) : (
        <div className="text-center py-6 text-slate-500 text-sm">No matching gems found. Try different color terms.</div>
      )}

      {/* Usage tips — inline */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
        <span>• Isotropic gems (cubic) show no pleochroism</span>
        <span>• Uniaxial gems show 2 colors</span>
        <span>• Biaxial gems can show 2–3 colors</span>
        <span>• Best viewed in strong light against white</span>
      </div>

      <div className="text-sm text-slate-600 pt-2">
        <a
          href="/learn/equipment/dichroscope"
          className="text-purple-600 hover:text-purple-700 underline"
        >
          Learn dichroscope technique and see full pleochroism reference →
        </a>
      </div>
    </div>
  );
}
