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
  very_strong: 'bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300',
  strong: 'bg-orange-100 text-orange-700 dark:bg-orange-400/10 dark:text-orange-300',
  moderate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-400/10 dark:text-yellow-300',
  weak: 'bg-slate-100 text-slate-600 dark:bg-coffee-raised2 dark:text-cream-secondary',
};

export function PleochroismReasoner() {
  const [hasInitiated, setHasInitiated] = useState(false);
  const [minerals, setMinerals] = useState<Mineral[]>([]);
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  const [colourCount, setColourCount] = useState<ObservedColourCount>(2);
  const [c1, setC1] = useState('');
  const [c2, setC2] = useState('');
  const [c3, setC3] = useState('');
  const [strength, setStrength] = useState<PleochroismStrength>('unknown');

  useEffect(() => {
    if (!hasInitiated) return;
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
  }, [hasInitiated]);

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
    <div className="space-y-6" onPointerDown={() => setHasInitiated(true)}>
      <p className="text-sm text-slate-600 dark:text-cream-secondary">
        Report what you saw through the dichroscope. The reasoner explains what your observation implies and ranks
        candidate species from the mineral database.
      </p>

      {/* Step 1 — colour count */}
      <div className="p-4 rounded-lg bg-slate-50 dark:bg-coffee-raised2 border border-slate-200 dark:border-coffee-border space-y-4">
        <FormField name="pleo-count" label="Step 1: How many distinct colours did you see?">
          <Select
            options={COLOUR_COUNT_OPTIONS}
            value={String(colourCount)}
            onChange={(v) => setColourCount(Number(v) as ObservedColourCount)}
          />
        </FormField>

        <div className="rounded-md border border-purple-200 dark:border-purple-400/20 bg-purple-50 dark:bg-purple-400/10 p-3 text-sm text-purple-900 dark:text-purple-300">
          <div className="font-semibold">{interpretation.title}</div>
          <div className="mt-1 text-purple-800 dark:text-purple-200">{interpretation.body}</div>
        </div>
      </div>

      {/* Step 2 — colours */}
      <div className="p-4 rounded-lg bg-slate-50 dark:bg-coffee-raised2 border border-slate-200 dark:border-coffee-border space-y-3">
        <h3 className="text-sm font-medium text-slate-700 dark:text-cream-secondary">Step 2: Observed colours</h3>
        <p className="text-xs text-slate-600 dark:text-cream-muted">
          Type the colour name in plain English ("yellowish-green", "blue", "pale violet"). Order does not matter.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FormField name="pleo-c1" label="Colour 1">
            <input
              type="text"
              value={c1}
              onChange={(e) => setC1(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-coffee-border rounded-lg bg-white dark:bg-coffee-sunk text-slate-900 dark:text-cream-primary placeholder-slate-500 dark:placeholder-cream-muted focus:ring-2 focus:ring-crystal-500 dark:focus:ring-crystal-400/20 focus:border-crystal-500 dark:focus:border-crystal-400"
              placeholder="e.g., yellow-green"
            />
          </FormField>
          {colourCount >= 2 && (
            <FormField name="pleo-c2" label="Colour 2">
              <input
                type="text"
                value={c2}
                onChange={(e) => setC2(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-coffee-border rounded-lg bg-white dark:bg-coffee-sunk text-slate-900 dark:text-cream-primary placeholder-slate-500 dark:placeholder-cream-muted focus:ring-2 focus:ring-crystal-500 dark:focus:ring-crystal-400/20 focus:border-crystal-500 dark:focus:border-crystal-400"
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
                className="w-full px-3 py-2 border border-slate-300 dark:border-coffee-border rounded-lg bg-white dark:bg-coffee-sunk text-slate-900 dark:text-cream-primary placeholder-slate-500 dark:placeholder-cream-muted focus:ring-2 focus:ring-crystal-500 dark:focus:ring-crystal-400/20 focus:border-crystal-500 dark:focus:border-crystal-400"
                placeholder="e.g., red-brown"
              />
            </FormField>
          )}
        </div>
      </div>

      {/* Step 3 — strength */}
      <div className="p-4 rounded-lg bg-slate-50 dark:bg-coffee-raised2 border border-slate-200 dark:border-coffee-border">
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
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-coffee-raised2 border border-slate-200 dark:border-coffee-border text-slate-600 dark:text-cream-secondary text-sm">
          Loading mineral database…
        </div>
      )}
      {dbError && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-400/10 border border-red-200 dark:border-red-400/20 text-red-700 dark:text-red-300 text-sm">
          Database unavailable: {dbError}
        </div>
      )}

      {/* Results */}
      {!loading && !dbError && minerals.length > 0 && (
        <>
          {observedColoursEntered === 0 ? (
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-coffee-raised2 border border-slate-200 dark:border-coffee-border text-slate-600 dark:text-cream-secondary text-sm text-center">
              Enter at least one observed colour to see ranked candidates.
            </div>
          ) : results.length === 0 ? (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-400/20 text-amber-700 dark:text-amber-300 text-sm text-center">
              No species match these colours. Try broader colour names (e.g. "green" rather than "olive-green").
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-700 dark:text-cream-secondary">
                {results.length} candidate {results.length === 1 ? 'species' : 'species'}
              </h4>
              {paginated.map((m) => {
                const stored = [
                  m.mineral.pleochroism_color1,
                  m.mineral.pleochroism_color2,
                  m.mineral.pleochroism_color3,
                ].filter(Boolean) as string[];
                const strengthLabel = m.mineral.pleochroism_strength?.replace('_', ' ') ?? '';
                const badgeClass = STRENGTH_BADGE[m.mineral.pleochroism_strength ?? ''] ?? 'bg-slate-100 text-slate-600 dark:bg-coffee-raised2 dark:text-cream-secondary';
                return (
                  <div
                    key={m.mineral.id}
                    className="p-3 rounded-lg bg-white dark:bg-coffee-raised border border-slate-200 dark:border-coffee-border"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/minerals/${m.mineral.id}`}
                          className="font-semibold text-crystal-700 dark:text-crystal-400 hover:underline"
                        >
                          {m.mineral.name}
                        </a>
                        {strengthLabel && (
                          <span className={`text-xs px-2 py-0.5 rounded ${badgeClass}`}>
                            {strengthLabel}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-cream-muted">
                        match {(m.score * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-slate-600 dark:text-cream-muted">
                      Stored colours: {stored.join(' / ') || '—'}
                    </div>
                    <div className="mt-2 text-xs text-slate-700 dark:text-cream-secondary">{m.reason}</div>
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
