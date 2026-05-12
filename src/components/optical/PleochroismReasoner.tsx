/**
 * Pleochroism Reasoner.
 *
 * A guided dichroscope-observation reasoner: the user reports how many
 * distinct colours they saw, the colours themselves, and the perceived
 * strength. The widget explains what the colour count implies (isotropic /
 * uniaxial / biaxial) and ranks candidate species from the database.
 */

import { useEffect, useMemo, useState } from 'react';
import { getAllMinerals, type Mineral } from '../../lib/db';
import {
  matchPleochroism,
  interpretColourCount,
  type ObservedColourCount,
  type PleochroismStrength,
} from '../../lib/pleochroism/match-pleochroism';
import { FormField, Select } from '../form';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../ui';

const COLOUR_COUNT_OPTIONS = [
  { value: '1', label: '1: single colour' },
  { value: '2', label: '2: dichroic' },
  { value: '3', label: '3: trichroic' },
];

const STRENGTH_OPTIONS: { value: PleochroismStrength; label: string }[] = [
  { value: 'unknown', label: 'Not sure' },
  { value: 'weak', label: 'Weak' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'strong', label: 'Strong' },
  { value: 'very_strong', label: 'Very strong' },
];

const STRENGTH_BADGE: Record<string, string> = {
  very_strong: 'bg-red-100 text-red-700',
  strong: 'bg-orange-100 text-orange-700',
  moderate: 'bg-yellow-100 text-yellow-700',
  weak: 'bg-slate-100 text-slate-600',
};

export function PleochroismReasoner() {
  const [minerals, setMinerals] = useState<Mineral[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  const [colourCount, setColourCount] = useState<ObservedColourCount>(2);
  const [c1, setC1] = useState('');
  const [c2, setC2] = useState('');
  const [c3, setC3] = useState('');
  const [strength, setStrength] = useState<PleochroismStrength>('unknown');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const all = await getAllMinerals();
        if (!mounted) return;
        setMinerals(all);
      } catch (err) {
        if (!mounted) return;
        setDbError(err instanceof Error ? err.message : 'Database load failed');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const interpretation = useMemo(() => interpretColourCount(colourCount), [colourCount]);

  const results = useMemo(() => {
    if (minerals.length === 0) return [];
    const colours = [c1, c2, c3]
      .slice(0, colourCount)
      .map((s) => s.trim())
      .filter(Boolean);
    return matchPleochroism({ colourCount, colours, strength }, minerals);
  }, [minerals, colourCount, c1, c2, c3, strength]);

  const { page, params, onPageChange, onPageSizeChange, resetPage } = usePagination({
    initialPageSize: 10,
  });
  useEffect(() => {
    resetPage();
  }, [results.length, resetPage]);

  const totalPages = Math.ceil(results.length / params.pageSize);
  const startIndex = (page - 1) * params.pageSize;
  const paginated = results.slice(startIndex, startIndex + params.pageSize);
  const pagination = {
    page,
    pageSize: params.pageSize,
    total: results.length,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };

  const observedColoursEntered = [c1, c2, c3].slice(0, colourCount).filter((s) => s.trim()).length;

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Report what you saw through the dichroscope. The reasoner explains what your observation implies and ranks
        candidate species from the mineral database.
      </p>

      {/* Step 1 — colour count */}
      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-4">
        <FormField name="pleo-count" label="Step 1: How many distinct colours did you see?">
          <Select
            options={COLOUR_COUNT_OPTIONS}
            value={String(colourCount)}
            onChange={(v) => setColourCount(Number(v) as ObservedColourCount)}
          />
        </FormField>

        <div className="rounded-md border border-purple-200 bg-purple-50 p-3 text-sm text-purple-900">
          <div className="font-semibold">{interpretation.title}</div>
          <div className="mt-1 text-purple-800">{interpretation.body}</div>
        </div>
      </div>

      {/* Step 2 — colours */}
      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
        <h3 className="text-sm font-medium text-slate-700">Step 2: Observed colours</h3>
        <p className="text-xs text-slate-600">
          Type the colour name in plain English ("yellowish-green", "blue", "pale violet"). Order does not matter.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FormField name="pleo-c1" label="Colour 1">
            <input
              type="text"
              value={c1}
              onChange={(e) => setC1(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-crystal-500 focus:border-crystal-500"
              placeholder="e.g., yellow-green"
            />
          </FormField>
          {colourCount >= 2 && (
            <FormField name="pleo-c2" label="Colour 2">
              <input
                type="text"
                value={c2}
                onChange={(e) => setC2(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-crystal-500 focus:border-crystal-500"
                placeholder="e.g., blue-green"
              />
            </FormField>
          )}
          {colourCount >= 3 && (
            <FormField name="pleo-c3" label="Colour 3">
              <input
                type="text"
                value={c3}
                onChange={(e) => setC3(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-crystal-500 focus:border-crystal-500"
                placeholder="e.g., red-brown"
              />
            </FormField>
          )}
        </div>
      </div>

      {/* Step 3 — strength */}
      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
        <FormField name="pleo-strength" label="Step 3: Perceived strength (optional)">
          <Select
            options={STRENGTH_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            value={strength}
            onChange={(v) => setStrength(v as PleochroismStrength)}
          />
        </FormField>
      </div>

      {/* Status / errors */}
      {loading && (
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-sm">
          Loading mineral database…
        </div>
      )}
      {dbError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          Database unavailable: {dbError}
        </div>
      )}

      {/* Results */}
      {!loading && !dbError && minerals.length > 0 && (
        <>
          {observedColoursEntered === 0 ? (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-sm text-center">
              Enter at least one observed colour to see ranked candidates.
            </div>
          ) : results.length === 0 ? (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm text-center">
              No species match these colours. Try broader colour names (e.g. "green" rather than "olive-green").
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-700">
                {results.length} candidate {results.length === 1 ? 'species' : 'species'}
              </h4>
              {paginated.map((m) => {
                const stored = [
                  m.mineral.pleochroism_color1,
                  m.mineral.pleochroism_color2,
                  m.mineral.pleochroism_color3,
                ].filter(Boolean) as string[];
                const strengthLabel = m.mineral.pleochroism_strength?.replace('_', ' ') ?? '';
                const badgeClass = STRENGTH_BADGE[m.mineral.pleochroism_strength ?? ''] ?? 'bg-slate-100 text-slate-600';
                return (
                  <div
                    key={m.mineral.id}
                    className="p-3 rounded-lg bg-white border border-slate-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/minerals/${m.mineral.id}`}
                          className="font-semibold text-crystal-700 hover:underline"
                        >
                          {m.mineral.name}
                        </a>
                        {strengthLabel && (
                          <span className={`text-xs px-2 py-0.5 rounded ${badgeClass}`}>
                            {strengthLabel}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600">
                        match {(m.score * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      Stored colours: {stored.join(' / ') || '—'}
                    </div>
                    <div className="mt-2 text-xs text-slate-700">{m.reason}</div>
                  </div>
                );
              })}
              {totalPages > 1 && (
                <Pagination
                  pagination={pagination}
                  onPageChange={onPageChange}
                  onPageSizeChange={onPageSizeChange}
                  showPageSize
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
