/**
 * Hanneman / Hodgkinson short-cut RI widget.
 *
 * For over-the-limit (OTL) and rough-stone identification: the user reports
 * up to three liquid-comparison observations and the widget returns an
 * inferred RI band plus a list of candidate species filtered from the DB.
 */

import { useEffect, useMemo, useState } from 'react';
import { getAllMinerals, type Mineral } from '../../lib/db';
import {
  CONTACT_LIQUIDS,
  combineBands,
  filterMineralsByBand,
  type HannemanCriteria,
  type Relief,
} from '../../lib/calculator/hanneman';
import { FormField, Select } from '../form';
import { Pagination } from '../ui';
import { usePagination } from '../../hooks/usePagination';

type Row = HannemanCriteria;

const RELIEF_OPTIONS: { value: Relief; label: string }[] = [
  { value: 'unknown', label: '(skip this row)' },
  { value: 'lower', label: 'Stone shows lower relief (RI < liquid)' },
  { value: 'equal', label: 'Stone disappears / equal (RI ≈ liquid)' },
  { value: 'higher', label: 'Stone shows higher relief (RI > liquid)' },
];

const liquidOptions = CONTACT_LIQUIDS.map((l) => ({
  value: l.id,
  label: `${l.name}: RI ${l.ri.toFixed(3)}`,
}));

export function HannemanRI() {
  const [hasInitiated, setHasInitiated] = useState(false);
  const [minerals, setMinerals] = useState<Mineral[]>([]);
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  const [rows, setRows] = useState<Row[]>([
    { liquidId: 'methylene-iodide', relief: 'unknown' },
    { liquidId: 'methylene-iodide-si', relief: 'unknown' },
    { liquidId: 'mono-bromo', relief: 'unknown' },
  ]);

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

  const usable = useMemo(() => rows.filter((r) => r.relief !== 'unknown'), [rows]);
  const band = useMemo(() => (usable.length === 0 ? null : combineBands(usable)), [usable]);
  const matches = useMemo(() => {
    if (!band || band.min > band.max) return [];
    if (minerals.length === 0) return [];
    return filterMineralsByBand(band, minerals);
  }, [band, minerals]);

  const { page, params, onPageChange, onPageSizeChange, resetPage } = usePagination({
    initialPageSize: 10,
  });
  useEffect(() => {
    resetPage();
  }, [matches.length, resetPage]);

  const totalPages = Math.ceil(matches.length / params.pageSize);
  const startIndex = (page - 1) * params.pageSize;
  const paginated = matches.slice(startIndex, startIndex + params.pageSize);
  const pagination = {
    page,
    pageSize: params.pageSize,
    total: matches.length,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };

  const setRow = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-6" onPointerDown={() => setHasInitiated(true)}>
      <div className="text-sm text-slate-600 dark:text-cream-secondary">
        <p>
          For stones above the refractometer scale (RI {'>'} 1.81) or rough material with no
          polished facet. Place the stone in a drop of each liquid and compare relief, then
          report what you see.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-coffee-border bg-slate-50 dark:bg-coffee-raised2 p-4 space-y-4">
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField name={`hl-liquid-${i}`} label={`Observation ${i + 1}: liquid`}>
              <Select
                options={liquidOptions}
                value={row.liquidId}
                onChange={(v) => setRow(i, { liquidId: v })}
              />
            </FormField>
            <FormField name={`hl-relief-${i}`} label="What did you see?">
              <Select
                options={RELIEF_OPTIONS}
                value={row.relief}
                onChange={(v) => setRow(i, { relief: v as Relief })}
              />
            </FormField>
          </div>
        ))}
      </div>

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

      {usable.length === 0 ? (
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-coffee-raised2 border border-slate-200 dark:border-coffee-border text-slate-600 dark:text-cream-secondary text-sm text-center">
          Select at least one observation above to infer an RI band.
        </div>
      ) : !band ? null : band.min > band.max ? (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-400/10 border border-red-200 dark:border-red-400/20 text-red-700 dark:text-red-300 text-sm">
          <strong>Conflicting observations.</strong> {band.rationale} Re-test with the suspect liquid.
        </div>
      ) : (
        <>
          <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-400/10 border border-emerald-200 dark:border-emerald-400/20">
            <div className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">
              Inferred RI band: {band.min.toFixed(2)} – {band.max.toFixed(2)}
            </div>
            <div className="text-xs text-emerald-800 dark:text-emerald-200 mt-1">{band.rationale}</div>
          </div>

          {!loading && !dbError && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-700 dark:text-cream-secondary">
                {matches.length} candidate {matches.length === 1 ? 'species' : 'species'}
              </h4>
              {matches.length === 0 ? (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-400/20 text-amber-700 dark:text-amber-300 text-sm text-center">
                  No species match this RI band. Re-check observations or try wider liquids.
                </div>
              ) : (
                paginated.map((m) => (
                  <div
                    key={m.mineral.id}
                    className="p-3 rounded-lg bg-white dark:bg-coffee-raised border border-slate-200 dark:border-coffee-border"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <a
                        href={`/minerals/${m.mineral.id}`}
                        className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                      >
                        {m.mineral.name}
                      </a>
                      <div className="text-xs text-slate-600 dark:text-cream-muted">
                        RI {m.mineral.ri_min?.toFixed(3)} – {m.mineral.ri_max?.toFixed(3)}
                      </div>
                    </div>
                    {m.mineral.optical_character && (
                      <div className="text-xs text-slate-600 dark:text-cream-muted mt-1">
                        {m.mineral.optical_character}
                      </div>
                    )}
                  </div>
                ))
              )}
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
