/**
 * UV Fluorescence Lookup widget.
 *
 * The user reports observed LWUV and SWUV reactions; the widget parses the
 * freeform `fluorescence` field of every mineral family in the database and
 * returns a ranked candidate list, with treatment red-flag warnings where
 * the observation matches a known treatment signature (e.g., chalky SWUV
 * in heated sapphire).
 */

import { useEffect, useMemo, useState } from 'react';
import { getAllFamilies, type MineralFamily } from '../../lib/db';
import {
  parseFluorescence,
  scoreUvMatch,
  type UvIntensity,
} from '../../lib/uv-fluorescence/parse-fluorescence';
import { FormField, Select } from '../form';
import { Pagination } from '../ui';
import { usePagination } from '../../hooks/usePagination';

const INTENSITY_OPTIONS: { value: UvIntensity; label: string }[] = [
  { value: 'unknown', label: 'skip this band' },
  { value: 'inert', label: 'Inert (no reaction)' },
  { value: 'weak', label: 'Weak' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'strong', label: 'Strong' },
  { value: 'very_strong', label: 'Very strong' },
];

const COLOR_OPTIONS = [
  { value: '', label: 'any colour' },
  { value: 'red', label: 'Red' },
  { value: 'orange', label: 'Orange' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'green', label: 'Green' },
  { value: 'blue', label: 'Blue' },
  { value: 'violet', label: 'Violet / purple' },
  { value: 'pink', label: 'Pink' },
  { value: 'white', label: 'White' },
  { value: 'chalky', label: 'Chalky / cloudy' },
];

interface MatchRow {
  family: MineralFamily;
  score: number;
  treatmentFlag?: string;
}

function detectTreatmentFlag(family: MineralFamily, swuvColor: string): string | undefined {
  if (!family.fluorescence) return undefined;
  const text = family.fluorescence.toLowerCase();
  // Classic chalky-SWUV reaction in heat-treated sapphire.
  if (
    swuvColor === 'chalky' &&
    /sapphire|corundum/.test(family.name.toLowerCase()) &&
    /chalk|cloudy/.test(text)
  ) {
    return 'Chalky SWUV is a strong indicator of heat treatment in corundum.';
  }
  return undefined;
}

export function UvFluorescenceLookup() {
  const [hasInitiated, setHasInitiated] = useState(false);
  const [families, setFamilies] = useState<MineralFamily[]>([]);
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  const [lwuvIntensity, setLwuvIntensity] = useState<UvIntensity>('strong');
  const [lwuvColor, setLwuvColor] = useState('');
  const [swuvIntensity, setSwuvIntensity] = useState<UvIntensity>('unknown');
  const [swuvColor, setSwuvColor] = useState('');

  useEffect(() => {
    if (!hasInitiated) return;
    let mounted = true;
    (async () => {
      try {
        const all = await getAllFamilies();
        if (!mounted) return;
        setFamilies(all);
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

  const obs = { lwuvIntensity, lwuvColor, swuvIntensity, swuvColor };
  const hasObservation = lwuvIntensity !== 'unknown' || swuvIntensity !== 'unknown';

  const matches = useMemo<MatchRow[]>(() => {
    if (!hasObservation || families.length === 0) return [];
    const out: MatchRow[] = [];
    for (const family of families) {
      const fl = parseFluorescence(family.fluorescence);
      if (!fl) continue;
      const score = scoreUvMatch(obs, fl);
      if (score < 0.4) continue;
      out.push({
        family,
        score,
        treatmentFlag: detectTreatmentFlag(family, swuvColor),
      });
    }
    return out.sort((a, b) => b.score - a.score).slice(0, 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [families, lwuvIntensity, lwuvColor, swuvIntensity, swuvColor]);

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

  return (
    <div className="space-y-6" onPointerDown={() => setHasInitiated(true)}>
      <p className="text-sm text-slate-600">
        Observe the stone under both long-wave (365 nm) and short-wave (254 nm) UV in a darkened
        cabinet and report what you see. The reasoner ranks species whose stored fluorescence text
        matches your observation.
      </p>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
        <h4 className="text-sm font-semibold text-slate-700">Long-wave (365 nm)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField name="lw-int" label="Intensity">
            <Select
              options={INTENSITY_OPTIONS}
              value={lwuvIntensity}
              onChange={(v) => setLwuvIntensity(v as UvIntensity)}
            />
          </FormField>
          <FormField name="lw-color" label="Colour">
            <Select options={COLOR_OPTIONS} value={lwuvColor} onChange={setLwuvColor} />
          </FormField>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
        <h4 className="text-sm font-semibold text-slate-700">Short-wave (254 nm)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField name="sw-int" label="Intensity">
            <Select
              options={INTENSITY_OPTIONS}
              value={swuvIntensity}
              onChange={(v) => setSwuvIntensity(v as UvIntensity)}
            />
          </FormField>
          <FormField name="sw-color" label="Colour">
            <Select options={COLOR_OPTIONS} value={swuvColor} onChange={setSwuvColor} />
          </FormField>
        </div>
      </div>

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

      {!loading && !dbError && families.length > 0 && (
        <>
          {!hasObservation ? (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-sm text-center">
              Select an LW or SW intensity to see ranked candidates.
            </div>
          ) : matches.length === 0 ? (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm text-center">
              No species match these UV reactions. Try widening colour or intensity, or recheck observations under darker conditions.
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-700">
                {matches.length} candidate {matches.length === 1 ? 'family' : 'families'}
              </h4>
              {paginated.map((m) => (
                <div
                  key={m.family.id}
                  className="p-3 rounded-lg bg-white border border-slate-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <a
                      href={`/minerals/${m.family.id}`}
                      className="font-semibold text-rose-700 hover:underline"
                    >
                      {m.family.name}
                    </a>
                    <div className="text-xs text-slate-600">match {(m.score * 100).toFixed(0)}%</div>
                  </div>
                  {m.family.fluorescence && (
                    <div className="mt-1 text-xs text-slate-700">
                      Stored: {m.family.fluorescence}
                    </div>
                  )}
                  {m.treatmentFlag && (
                    <div className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
                      ⚠ {m.treatmentFlag}
                    </div>
                  )}
                </div>
              ))}
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
