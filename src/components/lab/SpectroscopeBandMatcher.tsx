/**
 * Spectroscope Band Matcher widget.
 *
 * The user ticks observed absorption bands on a wavelength scale; the
 * widget ranks candidate gem species from the curated reference table.
 * For 30+ commonly-tested species this is more useful than the existing
 * wavelength → colour SpectroscopeCalculator, which is display-only.
 */

import { useMemo, useState } from 'react';
import { matchBands } from '../../lib/spectroscope/match-bands';
import { getAllReferenceBands } from '../../lib/spectroscope/reference-bands';
import { FormField, NumberInput, Select } from '../form';

const TOLERANCE_OPTIONS = [
  { value: '3', label: '± 3 nm (sharp lines)' },
  { value: '5', label: '± 5 nm (default)' },
  { value: '8', label: '± 8 nm (broad bands)' },
  { value: '12', label: '± 12 nm (very broad)' },
];

const REFERENCE_BANDS = getAllReferenceBands();

/**
 * Group the reference wavelengths into colour regions for the picker UI.
 */
function colourFor(wl: number): string {
  if (wl < 430) return 'violet';
  if (wl < 480) return 'blue';
  if (wl < 510) return 'cyan';
  if (wl < 565) return 'green';
  if (wl < 590) return 'yellow';
  if (wl < 620) return 'orange';
  return 'red';
}

const COLOUR_SWATCH: Record<string, string> = {
  violet: 'bg-violet-200 text-violet-900',
  blue: 'bg-blue-200 text-blue-900',
  cyan: 'bg-cyan-200 text-cyan-900',
  green: 'bg-green-200 text-green-900',
  yellow: 'bg-yellow-200 text-yellow-900',
  orange: 'bg-orange-200 text-orange-900',
  red: 'bg-red-200 text-red-900',
};

export function SpectroscopeBandMatcher() {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [customNm, setCustomNm] = useState('');
  const [tolerance, setTolerance] = useState('5');

  const observed = useMemo(() => Array.from(selected).sort((a, b) => a - b), [selected]);
  const matches = useMemo(
    () => matchBands(observed, parseFloat(tolerance) || 5),
    [observed, tolerance],
  );

  const toggle = (wl: number) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(wl)) next.delete(wl);
      else next.add(wl);
      return next;
    });
  };

  const addCustom = () => {
    const v = parseFloat(customNm);
    if (isNaN(v) || v < 350 || v > 800) return;
    setSelected((s) => new Set(s).add(Math.round(v)));
    setCustomNm('');
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Tick every absorption line you can see in the spectroscope. The reasoner ranks species
        whose stored band patterns match. Selective (diagnostic) bands are weighted more heavily.
      </p>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Observed bands</h4>
        <div className="flex flex-wrap gap-2">
          {REFERENCE_BANDS.map((wl) => {
            const isOn = selected.has(wl);
            const swatch = COLOUR_SWATCH[colourFor(wl)];
            return (
              <button
                key={wl}
                type="button"
                onClick={() => toggle(wl)}
                className={`text-xs px-2.5 py-1 rounded font-mono border transition ${
                  isOn ? `${swatch} border-slate-700 ring-2 ring-slate-400` : `${swatch} border-transparent opacity-60 hover:opacity-100`
                }`}
                title={`${wl} nm — ${colourFor(wl)} region`}
              >
                {wl} nm
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormField name="custom-nm" label="Add custom wavelength (nm)">
            <div className="flex gap-2">
              <NumberInput
                value={customNm}
                onChange={setCustomNm}
                min={350}
                max={800}
                step={1}
                placeholder="e.g., 415"
              />
              <button
                type="button"
                onClick={addCustom}
                className="px-3 py-2 bg-rose-600 text-white text-sm rounded hover:bg-rose-700"
              >
                Add
              </button>
            </div>
          </FormField>

          <FormField name="band-tolerance" label="Match tolerance">
            <Select options={TOLERANCE_OPTIONS} value={tolerance} onChange={setTolerance} />
          </FormField>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              disabled={selected.size === 0}
              className="px-3 py-2 bg-slate-200 text-slate-700 text-sm rounded hover:bg-slate-300 disabled:opacity-50"
            >
              Clear all bands
            </button>
          </div>
        </div>
      </div>

      {observed.length === 0 ? (
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-sm text-center">
          Tick at least one band above to see ranked candidates.
        </div>
      ) : matches.length === 0 ? (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm text-center">
          No reference species match these bands within ± {tolerance} nm. Try widening the tolerance or rechecking the readings against a reference scale.
        </div>
      ) : (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-700">
            {matches.length} candidate {matches.length === 1 ? 'species' : 'species'} ({observed.length} band{observed.length === 1 ? '' : 's'} ticked)
          </h4>
          {matches.map((m) => (
            <div key={m.reference.familyId} className="p-3 rounded-lg bg-white border border-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <a
                    href={`/minerals/${m.reference.familyId}`}
                    className="font-semibold text-rose-700 hover:underline"
                  >
                    {m.reference.name}
                  </a>
                  {m.hasSelective && (
                    <span className="ml-2 text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                      diagnostic
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-600">coverage {(m.coverage * 100).toFixed(0)}%</div>
              </div>
              <div className="mt-1 text-xs text-slate-700">{m.reason}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {m.matched.map((mb, i) => (
                  <span
                    key={i}
                    className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${COLOUR_SWATCH[colourFor(mb.band.wavelength)]}`}
                    title={mb.band.cause ?? ''}
                  >
                    {mb.observed} nm{mb.band.cause ? ` (${mb.band.cause})` : ''}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
