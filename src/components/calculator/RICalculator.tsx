/**
 * RI Lookup Calculator component.
 * Look up gems by refractive index value.
 * Uses database with fallback to hardcoded reference data.
 */

import { useState, useEffect } from 'react';
import { COMMON_GEMS, type GemReference } from '../../lib/calculator/conversions';
import { useCalculatorData } from '../../hooks/useCalculatorData';

export function RICalculator() {
  const [ri, setRi] = useState('');
  const [tolerance, setTolerance] = useState('0.01');
  const [results, setResults] = useState<GemReference[] | null>(null);

  const { findByRI, dbAvailable, fallbackGems } = useCalculatorData();

  // Fetch matching gems when RI or tolerance changes
  useEffect(() => {
    const riValue = parseFloat(ri);
    const tolValue = parseFloat(tolerance);

    if (isNaN(riValue) || riValue < 1) {
      setResults(null);
      return;
    }

    findByRI(riValue, isNaN(tolValue) ? 0.01 : tolValue).then(setResults);
  }, [ri, tolerance, findByRI]);

  const formatRI = (ri: number | [number, number]) => {
    if (Array.isArray(ri)) {
      return `${ri[0].toFixed(3)} - ${ri[1].toFixed(3)}`;
    }
    return ri.toFixed(3);
  };

  const formatSG = (sg: number | [number, number]) => {
    if (Array.isArray(sg)) {
      return `${sg[0].toFixed(2)} - ${sg[1].toFixed(2)}`;
    }
    return sg.toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-slate-600">
        <p>Enter an RI reading to find matching gemstones.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="ri-lookup" className="block text-sm font-medium text-slate-700 mb-1">
            Refractive Index
          </label>
          <input
            id="ri-lookup"
            type="number"
            step="0.001"
            min="1"
            max="3"
            value={ri}
            onChange={(e) => setRi(e.target.value)}
            placeholder="e.g., 1.544"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-crystal-500"
          />
        </div>

        <div>
          <label htmlFor="ri-tolerance" className="block text-sm font-medium text-slate-700 mb-1">
            Tolerance (±)
          </label>
          <select
            id="ri-tolerance"
            value={tolerance}
            onChange={(e) => setTolerance(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-crystal-500"
          >
            <option value="0.005">± 0.005 (Narrow)</option>
            <option value="0.01">± 0.01 (Standard)</option>
            <option value="0.02">± 0.02 (Wide)</option>
            <option value="0.05">± 0.05 (Very Wide)</option>
          </select>
        </div>
      </div>

      {results !== null && (
        <div className="space-y-3">
          {results.length > 0 ? (
            <>
              <p className="text-sm font-medium text-slate-700">
                {results.length} possible match{results.length !== 1 ? 'es' : ''}:
              </p>
              <div className="space-y-2">
                {results.map(gem => (
                  <GemMatchCard key={gem.name} gem={gem} />
                ))}
              </div>
            </>
          ) : (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
              No common gems found with RI {ri} (±{tolerance}). Try widening the tolerance or
              checking your reading.
            </div>
          )}
        </div>
      )}

      {/* Reference table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-slate-50 border-b flex items-center justify-between">
          <h4 className="text-sm font-medium text-slate-700">Common Gem RI Reference</h4>
          {dbAvailable && (
            <span className="text-xs text-green-600">Database connected</span>
          )}
        </div>
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left text-slate-700">Gem</th>
                <th className="px-4 py-2 text-left text-slate-700">RI</th>
                <th className="px-4 py-2 text-left text-slate-700">SG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fallbackGems.map(gem => (
                <tr key={gem.name} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-slate-900">{gem.name}</td>
                  <td className="px-4 py-2 text-slate-600 font-mono text-xs">{formatRI(gem.ri)}</td>
                  <td className="px-4 py-2 text-slate-600 font-mono text-xs">{formatSG(gem.sg)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function GemMatchCard({ gem }: { gem: GemReference }) {
  const formatRI = (ri: number | [number, number]) => {
    if (Array.isArray(ri)) return `${ri[0].toFixed(3)} - ${ri[1].toFixed(3)}`;
    return ri.toFixed(3);
  };

  const formatSG = (sg: number | [number, number]) => {
    if (Array.isArray(sg)) return `${sg[0].toFixed(2)} - ${sg[1].toFixed(2)}`;
    return sg.toFixed(2);
  };

  return (
    <div className="p-3 rounded-lg bg-crystal-50 border border-crystal-200">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-slate-900">{gem.name}</h4>
        <span className="text-xs text-slate-500">Hardness: {gem.hardness}</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-slate-500">RI:</span>{' '}
          <span className="font-mono text-slate-700">{formatRI(gem.ri)}</span>
        </div>
        <div>
          <span className="text-slate-500">SG:</span>{' '}
          <span className="font-mono text-slate-700">{formatSG(gem.sg)}</span>
        </div>
        {gem.birefringence != null && (
          <div>
            <span className="text-slate-500">Biref:</span>{' '}
            <span className="font-mono text-slate-700">{gem.birefringence.toFixed(3)}</span>
          </div>
        )}
        {gem.dispersion != null && (
          <div>
            <span className="text-slate-500">Disp:</span>{' '}
            <span className="font-mono text-slate-700">{gem.dispersion.toFixed(3)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
